import { API_BASE } from "@/lib/env";

export type RecordingDto = {
  id: string;
  roomId: string;
  fileUrl: string;
  durationSeconds: number;
  title?: string;
  mimeType: string;
  createdAt: string;
};

export async function listRecordings(
  accessToken: string,
  roomId: string
): Promise<{ recordings: RecordingDto[] }> {
  const path = `/api/recordings/${encodeURIComponent(roomId)}`;
  const url = API_BASE ? `${API_BASE}${path}` : path;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: "include",
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? "Failed to load recordings");
  }
  return res.json() as Promise<{ recordings: RecordingDto[] }>;
}

export async function uploadRecording(params: {
  accessToken: string;
  roomId: string;
  blob: Blob;
  durationSeconds: number;
  title?: string;
}): Promise<{ recording: RecordingDto }> {
  const form = new FormData();
  form.append("file", params.blob, "recording.webm");
  form.append("roomId", params.roomId);
  form.append("durationSeconds", String(params.durationSeconds));
  if (params.title) form.append("title", params.title);

  const path = "/api/recordings";
  const url = API_BASE ? `${API_BASE}${path}` : path;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${params.accessToken}` },
    body: form,
    credentials: "include",
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? "Upload failed");
  }
  return res.json() as Promise<{ recording: RecordingDto }>;
}
