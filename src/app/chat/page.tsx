import { ChatRoom } from "@/components/chat-room";

export default function ChatPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-4xl tracking-wide text-[#f3ebe2]">
        Chat
      </h1>
      <p className="mt-2 text-sm text-[#a89a8c]">
        Talk with whoever is online in the yard. Connect Steam on Account to
        send messages — avatars come from your Steam profile.
      </p>
      <div className="mt-8">
        <ChatRoom />
      </div>
    </main>
  );
}
