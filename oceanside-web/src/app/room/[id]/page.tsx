"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";

type SignalMessage =
  | { type: "offer"; offer: RTCSessionDescriptionInit }
  | { type: "answer"; answer: RTCSessionDescriptionInit }
  | { type: "ice"; candidate: RTCIceCandidateInit };

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const roomId = params.id;

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let pc: RTCPeerConnection;
    let socket: WebSocket;
    let localStream: MediaStream;
    let isCaller = false;
  
    async function start() {
      // 1️⃣ Camera
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
  
      localVideoRef.current!.srcObject = localStream;
  
      // 2️⃣ Peer connection
      pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
  
      localStream.getTracks().forEach((track) =>
        pc.addTrack(track, localStream)
      );
  
      pc.ontrack = (e) => {
        remoteVideoRef.current!.srcObject = e.streams[0];
      };
  
      // 3️⃣ WebSocket
      socket = new WebSocket("ws://localhost:8080");
  
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: "join", roomId }));
      };
  
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.send(
            JSON.stringify({ type: "ice", candidate: e.candidate, roomId })
          );
        }
      };
  
      socket.onmessage = async (e) => {
        const msg = JSON.parse(e.data);
  
        if (msg.type === "join") {
          // Someone else joined → YOU become caller
          isCaller = true;
  
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
  
          socket.send(
            JSON.stringify({ type: "offer", offer, roomId })
          );
        }
  
        if (msg.type === "offer") {
          await pc.setRemoteDescription(msg.offer);
  
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
  
          socket.send(
            JSON.stringify({ type: "answer", answer, roomId })
          );
        }
  
        if (msg.type === "answer") {
          await pc.setRemoteDescription(msg.answer);
        }
  
        if (msg.type === "ice") {
          await pc.addIceCandidate(msg.candidate);
        }
      };
    }
  
    start();
  
    return () => {
      pc?.close();
      socket?.close();
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, [roomId]);
  

  return (
    <main style={{ padding: 40 }}>
      <h1>🌊 Oceanside</h1>
      <p>Room: {roomId}</p>

      <div style={{ display: "flex", gap: 20 }}>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          style={{ width: 300, background: "#000" }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: 300, background: "#000" }}
        />
      </div>
    </main>
  );
}
