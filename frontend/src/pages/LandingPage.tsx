import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Mic, Video } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col justify-center gap-16 px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl space-y-6"
      >
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--muted-foreground)]">
          OceanSide
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Studio-grade recording sessions in your browser.
        </h1>
        <p className="text-lg text-[var(--muted-foreground)]">
          Create a room, invite guests, capture HD video and audio with WebRTC, and
          save takes to the cloud — minimal, fast, and built for clarity.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/register">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Video, title: "WebRTC video", body: "Low-latency peer connections with STUN." },
          { icon: Mic, title: "Clean audio", body: "Mute, device selection, and recording controls." },
          {
            icon: ArrowRight,
            title: "Cloud saves",
            body: "Upload finished takes to Cloudinary via the API.",
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <item.icon className="mb-3 h-6 w-6 text-[var(--primary)]" />
            <h2 className="font-medium">{item.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
