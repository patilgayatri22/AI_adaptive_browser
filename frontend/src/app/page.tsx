"use client";

import { useState, useEffect, useRef } from "react";
import BrowserView from "@/components/BrowserView";
import TaskStatus from "@/components/TaskStatus";
import ChatInterface from "@/components/ChatInterface";
import { useAgentSession } from "@/hooks/useAgentSession";

export default function Home() {
  const {
    session,
    steps,
    browserState,
    isConnected,
    sendMessage,
    startTask,
    confirmComplete,
    takeControl,
    handBackControl,
    sendBrowserAction,
    lastMessage,
  } = useAgentSession();

  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([]);

  const handleSubmit = async () => {
    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    setMessages(prev => [...prev, userMessage]);

    const response = await sendMessage(query);

    if (response.needsFollowUp) {
      setMessages(prev => [...prev, { role: "assistant", content: response.question || "" }]);
    } else if (response.startExecution) {
      await startTask(response.taskData);
    }

    setQuery("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-3 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">Agent Browser</h1>
          <div className="h-4 w-[1px] bg-gray-300"></div>
          <p className="text-sm text-gray-500">
            {session?.taskSummary || "Ask me to search for flights"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Action Required
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Browser View */}
        <div className="flex-1 p-6 bg-gray-50">
          <BrowserView
            url={browserState.url}
            screenshot={browserState.screenshot}
            isLoading={browserState.isLoading}
            isUserControlled={session?.isUserControlled}
            isRunning={session?.status === "running"}
            onTakeControl={takeControl}
            onHandBack={handBackControl}
            sessionId={session?.id}
            liveUrl={browserState.liveUrl}
            onBrowserAction={(action) => sendBrowserAction({
              actionType: action.type,
              x: action.x,
              y: action.y,
              text: action.text,
              deltaY: action.deltaY,
            })}
          />
        </div>

        {/* Right: Task Status + Chat */}
        <div className="w-[400px] border-l border-gray-200 flex flex-col bg-white shadow-sm z-10">
          <div className="flex-1 overflow-hidden">
            <TaskStatus
              status={session?.status || "idle"}
              taskName={session?.taskName}
              taskSummary={session?.taskSummary}
              steps={steps}
              onConfirmComplete={confirmComplete}
            />
          </div>

          <div className="border-t border-gray-200">
            <ChatInterface
              messages={messages}
              query={query}
              setQuery={setQuery}
              onSubmit={handleSubmit}
              isConnected={isConnected}
            />
          </div>
        </div>
      </main>
      {/* Debug Overlay */}
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded z-50 text-xs font-mono max-w-sm overflow-auto max-h-64 hidden">
        <h3 className="font-bold mb-2">Debug State</h3>
        <pre>{JSON.stringify({
          liveUrl: browserState.liveUrl,
          isLoading: browserState.isLoading,
          hasScreenshot: !!browserState.screenshot,
          stepsCount: steps.length,
          lastMsgType: lastMessage?.type,
          lastMsgLiveUrl: lastMessage?.liveUrl,
          lastMsgHasStep: !!lastMessage?.step
        }, null, 2)}</pre>
      </div>
    </div>
  );
}
