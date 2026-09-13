import ChatAssistant from "@/components/acheteur/chat-assistant";

export default function AssistantPage() {
  return (
    <div className="px-4 pb-2">
      <h1 className="mb-3 mt-2 text-xl font-extrabold text-brand-navy">Ti&apos;bot — votre assistant IA</h1>
      <ChatAssistant />
    </div>
  );
}
