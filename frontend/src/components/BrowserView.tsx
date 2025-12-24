"use client";

import { useRef, useCallback, useState } from "react";

interface BrowserViewProps {
    url: string;
    screenshot: string | null;
    isLoading: boolean;
    isUserControlled?: boolean;
    isRunning?: boolean;  // When true, shows animated gradient border
    onTakeControl: () => void;
    onHandBack: () => void;
    sessionId?: string;
    onBrowserAction?: (action: BrowserAction) => void;
    liveUrl?: string | null;  // Browser Use Cloud live URL
}

interface BrowserAction {
    type: "click" | "type" | "scroll";
    x?: number;
    y?: number;
    text?: string;
    deltaY?: number;
}

export default function BrowserView({
    url,
    screenshot,
    isLoading,
    isUserControlled,
    isRunning,
    onTakeControl,
    onHandBack,
    onBrowserAction,
    liveUrl,
}: BrowserViewProps) {
    const imageRef = useRef<HTMLImageElement>(null);
    const [lastClick, setLastClick] = useState<string>("");

    // Handle click on screenshot - forward to Playwright via CDP
    const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
        if (!isUserControlled || !imageRef.current || !onBrowserAction) return;

        e.preventDefault();
        const img = imageRef.current;
        const rect = img.getBoundingClientRect();

        // Get natural size of screenshot
        const naturalWidth = img.naturalWidth || 1280;
        const naturalHeight = img.naturalHeight || 800;

        // Calculate click position with object-contain scaling
        const displayedWidth = rect.width;
        const displayedHeight = rect.height;
        const scale = Math.min(displayedWidth / naturalWidth, displayedHeight / naturalHeight);
        const renderedWidth = naturalWidth * scale;
        const renderedHeight = naturalHeight * scale;
        const offsetX = (displayedWidth - renderedWidth) / 2;
        const offsetY = (displayedHeight - renderedHeight) / 2;

        const adjustedX = e.clientX - rect.left - offsetX;
        const adjustedY = e.clientY - rect.top - offsetY;

        // Convert to browser coordinates
        const browserX = Math.round(adjustedX / scale);
        const browserY = Math.round(adjustedY / scale);

        if (browserX >= 0 && browserY >= 0 && browserX <= naturalWidth && browserY <= naturalHeight) {
            setLastClick(`(${browserX}, ${browserY})`);
            onBrowserAction({ type: "click", x: browserX, y: browserY });
        }
    }, [isUserControlled, onBrowserAction]);

    return (
        <div
            className={`browser-frame h-full flex flex-col relative ${isRunning ? 'agent-working' : ''}`}
            style={isRunning ? {
                // Animated gradient border effect
                background: 'linear-gradient(90deg, #667eea, #764ba2, #6B8DD6, #8E54E9, #667eea)',
                backgroundSize: '400% 100%',
                animation: 'gradientShift 3s ease infinite',
                padding: '3px',
                borderRadius: '12px',
            } : undefined}
        >
            {/* Inner container for content */}
            <div className={`${isRunning ? 'bg-white rounded-[9px] flex-1 flex flex-col overflow-hidden' : 'flex-1 flex flex-col'}`}>
                {/* Browser Toolbar */}
                <div className="browser-toolbar">
                    <div className="browser-controls">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>

                    <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="browser-url w-full pl-9"
                            value={url || "about:blank"}
                            readOnly
                        />
                    </div>

                    {/* Intervention Controls */}
                    {isUserControlled ? (
                        <div className="flex gap-2 items-center">
                            <span className="text-xs text-yellow-600 font-mono">
                                Click: {lastClick || "ready"}
                            </span>
                            <button
                                onClick={onHandBack}
                                className="btn-intervention"
                                style={{ background: "#dcfce7", color: "#166534", borderColor: "#86efac" }}
                            >
                                ✓ Hand Back
                            </button>
                        </div>
                    ) : (
                        <button onClick={onTakeControl} className="btn-intervention">
                            Action Required
                        </button>
                    )}
                </div>

                {/* Browser Content - Live URL iframe or Screenshot streaming */}
                <div className="flex-1 relative bg-white overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {/* User control banner */}
                    {isUserControlled && (
                        <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-yellow-800 py-1 px-4 text-center text-xs font-bold z-10 border-b border-yellow-200">
                            🖱️ CLICK ON THE PAGE TO INTERACT - Agent is paused
                        </div>
                    )}

                    {/* Priority 1: Browser Use Cloud Live URL (iframe) */}
                    {liveUrl ? (
                        <div className="relative w-full h-full">
                            <iframe
                                src={liveUrl}
                                className="w-full h-full border-0"
                                title="Browser Use Cloud Live View"
                                allow="clipboard-read; clipboard-write"
                            />
                            {/* Overlay controls for Cloud View */}
                            <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-center bg-black/80 text-white text-xs z-50">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Live View Active
                                </span>
                                <a
                                    href={liveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold flex items-center gap-1 transition-colors"
                                >
                                    Open in New Tab ↗
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute top-0 right-0 bg-black/50 text-white text-xs p-1 z-50 pointer-events-none">
                            Debug: No Live URL (Screenshot mode)
                        </div>
                    )}

                    {screenshot && !liveUrl ? (
                        /* Priority 2: Screenshot stream */
                        <img
                            ref={imageRef}
                            src={`data:image/png;base64,${screenshot}`}
                            alt="Browser"
                            className="w-full h-full object-contain"
                            onClick={handleImageClick}
                            style={{
                                cursor: isUserControlled ? 'crosshair' : 'default',
                                outline: isUserControlled ? '3px solid #eab308' : 'none',
                            }}
                            draggable={false}
                        />
                    ) : (
                        /* No content yet */
                        !liveUrl && (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <p>Start a task to see the browser</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
