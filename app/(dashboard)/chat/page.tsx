import { AgentChat } from '@/components/chat/agent-chat'

export default function ChatPage() {
  return (
    <div className="container mx-auto h-[calc(100vh-4rem)] p-4 md:p-6">
      <div className="h-full rounded-lg border bg-card">
        <AgentChat />
      </div>
    </div>
  )
}
