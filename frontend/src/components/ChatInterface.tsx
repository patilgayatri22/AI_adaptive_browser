"use client";

import { useRef, useEffect } from "react";

interface Message {
    role: string;
    content: string;
}

interface ChatInterfaceProps {
    messages: Message[];
    query: string;
    setQuery: (query: string) => void;
    onSubmit: () => void;
    isConnected: boolean;
}

export default function ChatInterface({
    messages,
    query,
    setQuery,
    onSubmit,
    isConnected,
}: ChatInterfaceProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="chat-container h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-[var(--muted)] py-8">
                        <svg
                            className="w-12 h-12 mx-auto mb-3 opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                        <p className="text-sm">Start by describing what you want to do</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === "user"
                                        ? "bg-[var(--primary)] text-white"
                                        : "bg-[var(--card)] border border-[var(--border)]"
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--border)]">
                <div className="relative">
                    <textarea
                        className="chat-input pr-12"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for flights from San Jose to Detroit..."
                        rows={2}
                    />
                    <button
                        onClick={onSubmit}
                        disabled={!query.trim() || !isConnected}
                        className="absolute right-3 bottom-3 p-2 rounded-lg bg-[var(--primary)] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--primary-dark)] transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>

                {/* Connection Status */}
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
                    <span
                        className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"
                            }`}
                    />
                    {isConnected ? "Connected" : "Reconnecting..."}
                </div>
            </div>
        </div>
    );
}
