import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createRoom, listRooms } from "@/features/rooms/roomsApi";
import { useAuthStore } from "@/stores/authStore";

export function DashboardPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");

  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => listRooms(accessToken!),
    enabled: Boolean(accessToken),
  });

  const createMut = useMutation({
    mutationFn: () => createRoom(accessToken!, title.trim() || "Untitled room"),
    onSuccess: () => {
      setTitle("");
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  return (
    <div className="mx-auto max-w-6xl flex-1 px-4 py-10">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Recording rooms</h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Create a session or open one you host or joined.
          </p>
        </div>
        <form
          className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <Input
            placeholder="Room title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="New room title"
          />
          <Button type="submit" disabled={createMut.isPending || !accessToken}>
            <Plus className="h-4 w-4" />
            New room
          </Button>
        </form>
      </div>

      {roomsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : roomsQuery.isError ? (
        <p className="text-[var(--destructive)]" role="alert">
          Could not load rooms. Try refreshing.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(roomsQuery.data?.rooms ?? []).map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{room.title}</CardTitle>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {room.participantIds.length} participant
                    {room.participantIds.length === 1 ? "" : "s"}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link to={`/room/${room.id}`}>Enter studio</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!roomsQuery.isLoading && (roomsQuery.data?.rooms?.length ?? 0) === 0 ? (
        <p className="mt-8 text-center text-[var(--muted-foreground)]">
          No rooms yet — create your first session above.
        </p>
      ) : null}
    </div>
  );
}
