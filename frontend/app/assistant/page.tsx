"use client";

import AppShell from "@/components/layout/AppShell";
import ChatWindow from "@/components/ai/ChatWindow";

export default function AssistantPage() {
  return (
    <AppShell>
      <ChatWindow />
    </AppShell>
  );
}