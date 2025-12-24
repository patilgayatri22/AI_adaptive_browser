"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Step {
    id: string;
    name: string;
    description: string;
    status: "pending" | "running" | "complete" | "error";
    timestamp?: string;
}

interface BrowserState {
    url: string;
    screenshot: string | null;
    isLoading: boolean;
    liveUrl: string | null;  // Browser Use Cloud live URL
}

interface Session {
    id: string;
    status: "idle" | "running" | "waiting" | "complete" | "error";
    taskName: string;
    taskSummary: string;
    definitionOfDone: string;
    isUserControlled: boolean;
}

interface BrowserActionParams {
    actionType: "click" | "type" | "scroll";
    x?: number;
    y?: number;
    text?: string;
    deltaY?: number;
}

interface UseAgentSessionReturn {
    session: Session | null;
    steps: Step[];
    browserState: BrowserState;
    isConnected: boolean;
    sendMessage: (message: string) => Promise<{
        needsFollowUp: boolean;
        question?: string;
        startExecution?: boolean;
        taskData?: any;
    }>;
    startTask: (taskData: any) => Promise<void>;
    confirmComplete: () => Promise<void>;
    takeControl: () => void;
    handBackControl: () => void;
    sendBrowserAction: (action: BrowserActionParams) => void;
    lastMessage: any; // Export for debugging
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8001";

export function useAgentSession(): UseAgentSessionReturn {
    const [session, setSession] = useState<Session | null>(null);
    const [steps, setSteps] = useState<Step[]>([]);
    const [browserState, setBrowserState] = useState<BrowserState>({
        url: "",
        screenshot: null,
        isLoading: false,
        liveUrl: null,
    });
    const [isConnected, setIsConnected] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const sessionIdRef = useRef<string | null>(null);

    const [lastMessage, setLastMessage] = useState<any>(null);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(`${WS_URL}/ws/agent`);

        ws.onopen = () => {
            console.log("WebSocket connected");
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setLastMessage(data);

            switch (data.type) {
                case "session_created":
                    sessionIdRef.current = data.sessionId;
                    setSession({
                        id: data.sessionId,
                        status: "idle",
                        taskName: "",
                        taskSummary: "",
                        definitionOfDone: "",
                        isUserControlled: false,
                    });
                    break;

                case "screenshot":
                    setBrowserState(prev => ({
                        ...prev,
                        screenshot: data.image,
                        url: data.url || prev.url,
                        isLoading: false,
                    }));
                    break;

                case "step_update":
                    console.log("[useAgentSession] Received step_update:", data);
                    setSteps(prev => {
                        const existing = prev.findIndex(s => s.id === data.step.id);
                        if (existing >= 0) {
                            const updated = [...prev];
                            updated[existing] = { ...updated[existing], ...data.step };
                            return updated;
                        }
                        return [...prev, data.step];
                    });

                    // Also check for liveUrl in step update (redundancy)
                    if (data.liveUrl) {
                        setBrowserState(prev => {
                            if (prev.liveUrl === data.liveUrl) return prev;
                            console.log("[useAgentSession] Received live_url via step_update:", data.liveUrl);
                            return {
                                ...prev,
                                liveUrl: data.liveUrl
                            };
                        });
                    }
                    break;

                case "task_started":
                    setSession(prev => prev ? {
                        ...prev,
                        status: "running",
                        taskName: data.taskName,
                        taskSummary: data.taskSummary,
                        definitionOfDone: data.definitionOfDone,
                    } : null);
                    setSteps(data.steps || []);
                    break;

                case "task_complete":
                    setSession(prev => prev ? {
                        ...prev,
                        status: "waiting",
                    } : null);
                    break;

                case "url_changed":
                    setBrowserState(prev => ({
                        ...prev,
                        url: data.url,
                    }));
                    break;

                case "loading":
                    setBrowserState(prev => ({
                        ...prev,
                        isLoading: data.isLoading,
                    }));
                    break;

                case "intervention_status":
                    setSession(prev => prev ? {
                        ...prev,
                        isUserControlled: data.isUserControlled,
                    } : null);
                    break;

                case "live_url":
                    // Browser Use Cloud live browser URL for iframe embedding
                    console.log("[useAgentSession] Received live_url:", data.liveUrl);
                    setBrowserState(prev => ({
                        ...prev,
                        liveUrl: data.liveUrl,
                    }));
                    break;
            }
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected");
            setIsConnected(false);
            // Reconnect after 2 seconds
            setTimeout(connect, 2000);
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        wsRef.current = ws;
    }, []);

    useEffect(() => {
        connect();
        return () => {
            wsRef.current?.close();
        };
    }, [connect]);

    // Send a message (chat) to the agent
    const sendMessage = useCallback(async (message: string) => {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionId: sessionIdRef.current,
                message,
            }),
        });

        return response.json();
    }, []);

    // Start task execution
    const startTask = useCallback(async (taskData: any) => {
        wsRef.current?.send(JSON.stringify({
            type: "start_task",
            sessionId: sessionIdRef.current,
            ...taskData,
        }));
    }, []);

    // Confirm task is complete (stores workflow)
    const confirmComplete = useCallback(async () => {
        const response = await fetch(`${API_URL}/api/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionId: sessionIdRef.current,
                success: true,
            }),
        });

        if (response.ok) {
            setSession(prev => prev ? { ...prev, status: "complete" } : null);
        }
    }, []);

    // User takes control of the browser
    const takeControl = useCallback(() => {
        wsRef.current?.send(JSON.stringify({
            type: "intervention",
            action: "take_control",
            sessionId: sessionIdRef.current,
        }));
    }, []);

    // User hands control back to agent
    const handBackControl = useCallback(() => {
        wsRef.current?.send(JSON.stringify({
            type: "intervention",
            action: "hand_back",
            sessionId: sessionIdRef.current,
        }));
    }, []);

    // Send browser action (click, type, scroll) when user is in control
    const sendBrowserAction = useCallback((action: BrowserActionParams) => {
        // Note: Backend validates user control, don't check here (stale closure issue)
        console.log("[useAgentSession] sendBrowserAction called:", action);

        if (!wsRef.current) {
            console.log("[useAgentSession] No WebSocket connection!");
            return;
        }

        const message = {
            type: "browser_action",
            action: action.actionType,
            sessionId: sessionIdRef.current,
            x: action.x,
            y: action.y,
            text: action.text,
            deltaY: action.deltaY,
        };

        console.log("[useAgentSession] Sending:", message);
        wsRef.current.send(JSON.stringify(message));
    }, []);

    return {
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
        lastMessage, // Export for debugging
    };
}
