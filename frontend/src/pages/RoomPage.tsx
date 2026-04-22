import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Mic, MicOff, Video, VideoOff, Circle, Square, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listRecordings, uploadRecording } from "@/features/recordings/recordingsApi";
import { getRoom, joinRoom } from "@/features/rooms/roomsApi";
import { useRoomSession } from "@/features/room/useRoomSession";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export function RoomPage() {
  const { id: roomId = "" } = useParams();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const joinQuery = useQuery({
    queryKey: ["join-room", roomId],
    queryFn: () => joinRoom(accessToken!, roomId),
    enabled: Boolean(accessToken && roomId),
    retry: false,
  });

  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => getRoom(accessToken!, roomId),
    enabled: Boolean(accessToken && roomId) && joinQuery.isSuccess,
  });

  const recordingsQuery = useQuery({
    queryKey: ["recordings", roomId],
    queryFn: () => listRecordings(accessToken!, roomId),
    enabled: Boolean(accessToken && roomId) && joinQuery.isSuccess,
  });

  const { localStream, remoteStreams, peerList, error: mediaError } =
    useRoomSession(joinQuery.isSuccess ? roomId : "", accessToken);

  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [recording, setRecording] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const el = localVideoRef.current;
    if (el && localStream) {
      el.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = audioOn;
    });
  }, [audioOn, localStream]);

  useEffect(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => {
      t.enabled = videoOn;
    });
  }, [videoOn, localStream]);

  const toggleRecording = () => {
    if (!localStream || !accessToken) return;

    if (!recording) {
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      const mime =
        MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm";
      const rec = new MediaRecorder(localStream, { mimeType: mime });
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start(400);
      recorderRef.current = rec;
      setRecording(true);
      setUploadStatus(null);
      return;
    }

    const rec = recorderRef.current;
    if (!rec) return;
    rec.stop();
    recorderRef.current = null;
    setRecording(false);

    void (async () => {
      const started = startedAtRef.current;
      const durationSec =
        started !== null ? Math.max(1, Math.round((Date.now() - started) / 1000)) : 1;
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      chunksRef.current = [];
      setUploadStatus("Uploading…");
      try {
        await uploadRecording({
          accessToken,
          roomId,
          blob,
          durationSeconds: durationSec,
          title: `Take ${new Date().toISOString()}`,
        });
        setUploadStatus("Saved.");
        void recordingsQuery.refetch();
      } catch (e) {
        setUploadStatus(e instanceof Error ? e.message : "Upload failed");
      }
    })();
  };

  if (!accessToken) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-[var(--muted-foreground)]">Sign in to join this room.</p>
        <Button asChild className="mt-4">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (joinQuery.isLoading || roomQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="aspect-video w-full max-w-4xl" />
      </div>
    );
  }

  if (joinQuery.isError || roomQuery.isError) {
    const err = joinQuery.isError ? joinQuery.error : roomQuery.error;
    const msg =
      err instanceof ApiError ? err.message : "Could not load room.";
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-[var(--destructive)]">{msg}</p>
        <Button asChild variant="secondary" className="mt-4">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const room = roomQuery.data?.room;

  return (
    <div className="mx-auto max-w-6xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{room?.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Signed in as {user?.name} · {peerList.length + 1} in session
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard">Leave</Link>
        </Button>
      </div>

      {mediaError ? (
        <p className="mb-4 text-sm text-[var(--destructive)]" role="alert">
          {mediaError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-black/40">
              <video
                ref={localVideoRef}
                className="aspect-video w-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <p className="bg-black/60 px-2 py-1 text-xs text-white">You</p>
            </div>
            {Array.from(remoteStreams.entries()).map(([sid, stream]) => (
              <RemoteVideo key={sid} stream={stream} label={`Guest ${sid.slice(0, 4)}`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={audioOn ? "secondary" : "destructive"}
              onClick={() => setAudioOn((a) => !a)}
            >
              {audioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              {audioOn ? "Mute" : "Unmute"}
            </Button>
            <Button
              type="button"
              variant={videoOn ? "secondary" : "destructive"}
              onClick={() => setVideoOn((v) => !v)}
            >
              {videoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              {videoOn ? "Camera off" : "Camera on"}
            </Button>
            <Button
              type="button"
              variant={recording ? "destructive" : "default"}
              onClick={toggleRecording}
            >
              {recording ? (
                <>
                  <Square className="h-4 w-4" /> Stop & upload
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4" /> Record
                </>
              )}
            </Button>
            {uploadStatus ? (
              <span className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
                <Upload className="h-4 w-4" />
                {uploadStatus}
              </span>
            ) : null}
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved takes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recordingsQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              (recordingsQuery.data?.recordings ?? []).map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm"
                >
                  <p className="font-medium">{r.title ?? "Recording"}</p>
                  <p className="text-[var(--muted-foreground)]">
                    {r.durationSeconds}s · {new Date(r.createdAt).toLocaleString()}
                  </p>
                  <video
                    src={r.fileUrl}
                    controls
                    className="mt-2 w-full rounded-md"
                  />
                </div>
              ))
            )}
            {(recordingsQuery.data?.recordings?.length ?? 0) === 0 &&
            !recordingsQuery.isLoading ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                No recordings yet — capture a take with Record.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RemoteVideo({ stream, label }: { stream: MediaStream; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.srcObject = stream;
  }, [stream]);
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-black/40">
      <video ref={ref} className="aspect-video w-full object-cover" autoPlay playsInline />
      <p className="bg-black/60 px-2 py-1 text-xs text-white">{label}</p>
    </div>
  );
}
