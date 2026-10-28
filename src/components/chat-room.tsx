"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface ChatMsg {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  text: string;
  createdAt: number;
  userId: string;
}

interface OnlinePerson {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

export function ChatRoom({ compact }: { compact?: boolean }) {
  const { user } = useApp();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [online, setOnline] = useState<{ count: number; people: OnlinePerson[] }>(
    { count: 0, people: [] },
  );
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{
        messages: ChatMsg[];
        online: { count: number; people: OnlinePerson[] };
      }>("/api/chat");
      setMessages(data.messages);
      setOnline(data.online);
    } catch {
      /* ignore poll errors */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 2500);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    setError(null);
    try {
      const data = await api<{
        messages: ChatMsg[];
        online: { count: number; people: OnlinePerson[] };
      }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setText("");
      setMessages(data.messages);
      setOnline(data.online);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    }
  }

  return (
    <section
      className={
        compact
          ? "flex h-[420px] flex-col overflow-hidden rounded-sm border border-[rgba(196,92,38,0.3)] bg-[rgba(12,10,8,0.92)]"
          : "flex h-[560px] flex-col overflow-hidden rounded-sm border border-[rgba(196,92,38,0.3)] bg-[rgba(12,10,8,0.92)]"
      }
    >
      <header className="flex items-center justify-between border-b border-[rgba(196,92,38,0.22)] bg-[rgba(28,18,12,0.95)] px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
            Outpost chat
          </p>
          <h2 className="font-display text-xl tracking-wide text-[#f3ebe2]">
            Radio · {online.count} online
          </h2>
        </div>
        <div className="flex -space-x-2">
          {online.people.slice(0, 6).map((p) => (
            <div
              key={p.userId}
              title={p.displayName}
              className="h-7 w-7 overflow-hidden rounded-full border border-[#c45c26]/40 bg-[#1a1410]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.avatarUrl || "/logo.svg"}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((m) => (
          <div key={m.id} className="flex gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.avatarUrl || "/logo.svg"}
              alt=""
              className="mt-0.5 h-8 w-8 rounded-full border border-[rgba(196,92,38,0.35)] object-cover"
            />
            <div>
              <p className="text-[11px] font-semibold text-[#f0a060]">
                {m.displayName}{" "}
                <span className="font-normal text-[#6b6258]">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
              <p className="text-sm text-[#d9cfc3]">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[rgba(196,92,38,0.22)] bg-black/30 p-3">
        {user?.steamConnected ? (
          <div className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              placeholder="Say something to the yard…"
              className="border-[rgba(196,92,38,0.3)] bg-[rgba(20,16,12,0.9)] text-[#f3ebe2]"
            />
            <Button
              onClick={() => void send()}
              className="bg-[#c45c26] text-[#120e0b] hover:bg-[#e07030]"
            >
              Send
            </Button>
          </div>
        ) : (
          <p className="text-center text-sm text-[#a89a8c]">
            <Link href="/account" className="text-[#f0a060] underline-offset-2 hover:underline">
              Account
            </Link>{" "}
            to talk on the radio.
          </p>
        )}
        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      </div>
    </section>
  );
}
