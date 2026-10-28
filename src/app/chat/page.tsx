import { ChatRoom } from "@/components/chat-room";

export default function ChatPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#c45c26]">
        Survivors on frequency
      </p>
      <h1 className="font-display text-4xl tracking-wide text-[#f3ebe2]">
        Outpost radio
      </h1>
      <p className="mt-2 mb-6 text-sm text-[#a89a8c]">
        Live chat with whoever is online in the yard. Profile pictures pull from
        Steam when you connect.
      </p>
      <ChatRoom />
    </main>
  );
}
