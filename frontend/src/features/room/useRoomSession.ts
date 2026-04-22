import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { SOCKET_ORIGIN } from "@/lib/env";

const ICE: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

type PeerMeta = { socketId: string; userId: string };

type SignalEnvelope = {
  from: string;
  userId: string;
  roomId: string;
  data: {
    type: "offer" | "answer" | "ice-candidate";
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  };
};

export function useRoomSession(roomId: string, accessToken: string | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    () => new Map()
  );
  const [peerList, setPeerList] = useState<PeerMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!accessToken || !roomId) return;

    let cancelled = false;

    const run = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        const socket = io(SOCKET_ORIGIN, {
          auth: { token: accessToken },
          transports: ["websocket"],
        });
        socketRef.current = socket;

        const ensurePc = (remoteId: string): RTCPeerConnection => {
          let pc = pcsRef.current.get(remoteId);
          if (pc) return pc;
          pc = new RTCPeerConnection(ICE);
          pcsRef.current.set(remoteId, pc);

          stream.getTracks().forEach((t) => pc!.addTrack(t, stream));

          pc.ontrack = (ev) => {
            const [ms] = ev.streams;
            if (ms) {
              setRemoteStreams((prev) => new Map(prev).set(remoteId, ms));
            }
          };

          pc.onicecandidate = (ev) => {
            if (ev.candidate) {
              socket.emit("signal", {
                roomId,
                to: remoteId,
                data: {
                  type: "ice-candidate",
                  candidate: ev.candidate.toJSON(),
                },
              });
            }
          };

          return pc;
        };

        const maybeOffer = async (remoteId: string) => {
          const myId = socket.id;
          if (!myId || !remoteId || myId >= remoteId) return;
          const pc = ensurePc(remoteId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("signal", {
            roomId,
            to: remoteId,
            data: { type: "offer", sdp: offer },
          });
        };

        socket.emit(
          "join-room",
          { roomId },
          (ack: { ok?: boolean; error?: string }) => {
            if (!ack?.ok) {
              setError(ack?.error ?? "Could not join room");
            }
          }
        );

        socket.on("room-peers", (payload: { peers: PeerMeta[] }) => {
          setPeerList(payload.peers ?? []);
          void Promise.all(
            (payload.peers ?? []).map((p) => maybeOffer(p.socketId))
          );
        });

        socket.on("peer-joined", (peer: PeerMeta) => {
          setPeerList((prev) => [...prev, peer]);
          void maybeOffer(peer.socketId);
        });

        socket.on("peer-left", ({ socketId }: { socketId: string }) => {
          setPeerList((prev) => prev.filter((p) => p.socketId !== socketId));
          pcsRef.current.get(socketId)?.close();
          pcsRef.current.delete(socketId);
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.delete(socketId);
            return next;
          });
        });

        socket.on("signal", async (msg: SignalEnvelope) => {
          if (!msg?.data || msg.roomId !== roomId) return;
          const remoteId = msg.from;
          const myId = socket.id;
          if (!myId) return;

          const pc = ensurePc(remoteId);

          if (msg.data.type === "offer" && msg.data.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.data.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("signal", {
              roomId,
              to: remoteId,
              data: { type: "answer", sdp: answer },
            });
          } else if (msg.data.type === "answer" && msg.data.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.data.sdp));
          } else if (msg.data.type === "ice-candidate" && msg.data.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(msg.data.candidate));
            } catch {
              /* ignore */
            }
          }
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Media error");
      }
    };

    void run();

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      pcsRef.current.forEach((pc) => pc.close());
      pcsRef.current.clear();
      const s = socketRef.current;
      if (s) {
        s.emit("leave-room", { roomId });
        s.disconnect();
      }
      socketRef.current = null;
      setLocalStream(null);
      setRemoteStreams(new Map());
      setPeerList([]);
    };
  }, [roomId, accessToken]);

  return { localStream, remoteStreams, peerList, error };
}
