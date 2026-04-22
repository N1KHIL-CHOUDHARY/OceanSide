import { apiFetch } from "@/lib/api";

export type RoomSummary = {
  id: string;
  title: string;
  hostId: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
};

export async function listRooms(accessToken: string): Promise<{ rooms: RoomSummary[] }> {
  return apiFetch("/api/rooms", { accessToken });
}

export async function createRoom(
  accessToken: string,
  title: string
): Promise<{ room: RoomSummary }> {
  return apiFetch("/api/rooms", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ title }),
  });
}

export async function getRoom(
  accessToken: string,
  id: string
): Promise<{ room: RoomSummary }> {
  return apiFetch(`/api/rooms/${encodeURIComponent(id)}`, { accessToken });
}

export async function joinRoom(
  accessToken: string,
  id: string
): Promise<{ room: RoomSummary }> {
  return apiFetch(`/api/rooms/${encodeURIComponent(id)}/join`, {
    method: "POST",
    accessToken,
  });
}
