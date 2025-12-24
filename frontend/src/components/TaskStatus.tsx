"use client";

interface Step {
    id: string;
    name: string;
    description: string;
    status: "pending" | "running" | "complete" | "error";
    timestamp?: string;
}

interface TaskStatusProps {
    status: "idle" | "running" | "waiting" | "complete" | "error";
    taskName?: string;
    taskSummary?: string;
    steps: Step[];
    onConfirmComplete: () => void;
    onRetry?: () => void;
}

export default function TaskStatus({
    status,
    taskName,
    taskSummary,
    steps,
    onConfirmComplete,
    onRetry,
}: TaskStatusProps) {
    const getStatusBadge = () => {
        switch (status) {
            case "running":
                return <span className="status-badge running">Running</span>;
            case "waiting":
                return <span className="status-badge waiting">Confirm</span>;
            case "complete":
                return <span className="status-badge complete">Complete</span>;
            case "error":
                return <span className="status-badge error">Error</span>;
            default:
                return <span className="status-badge" style={{ background: "#374151" }}>Idle</span>;
        }
    };

    const getStepIcon = (stepStatus: Step["status"]) => {
        switch (stepStatus) {
            case "complete":
                return (
                    <div className="step-icon complete">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case "running":
                return (
                    <div className="step-icon running">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    </div>
                );
            case "error":
                return (
                    <div className="step-icon error">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            default:
                return <div className="step-icon pending" />;
        }
    };

    const handleNotQuite = () => {
        if (onRetry) {
            onRetry();
        } else {
            // Fallback: reload page to start over
            window.location.reload();
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            {/* Header Section */}
            <div className="mb-6">
                <div className="mb-4">
                    {getStatusBadge()}
                </div>

                {taskName && (
                    <div>
                        <h2 className="text-sm font-medium text-gray-900 mb-1">{taskName}</h2>
                        {taskSummary && (
                            <p className="text-sm text-gray-500">{taskSummary}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Steps Timeline - Scrollable with smooth behavior */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex-shrink-0">Steps</h3>

                {steps.length > 0 ? (
                    <div
                        className="flex-1 overflow-y-auto pr-2 scroll-smooth"
                        style={{
                            scrollBehavior: 'smooth',
                            maxHeight: 'calc(100vh - 300px)'
                        }}
                        ref={(el) => {
                            // Auto-scroll to bottom when new steps are added
                            if (el) {
                                el.scrollTop = el.scrollHeight;
                            }
                        }}
                    >
                        <div className="step-timeline">
                            {steps.map((step, index) => {
                                // Determine if this step should show as complete
                                // (all previous steps are complete, or this is not the last step)
                                const isLastStep = index === steps.length - 1;
                                const displayStatus = isLastStep && step.status === "running"
                                    ? "running"
                                    : (step.status === "running" && !isLastStep)
                                        ? "complete"
                                        : step.status;

                                return (
                                    <div
                                        key={step.id}
                                        className={`step-item transition-all duration-300 ease-in-out ${displayStatus === 'running' ? 'opacity-100' : 'opacity-80'}`}
                                        style={{
                                            animation: isLastStep ? 'fadeIn 0.3s ease-in-out' : 'none'
                                        }}
                                    >
                                        {/* Marker */}
                                        <div className={`step-marker ${displayStatus}`}>
                                            {displayStatus === "complete" && (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            {displayStatus === "error" && (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="step-content min-w-0">
                                            <p className="step-title truncate">{step.name}</p>
                                            {step.description && (
                                                <p className="step-desc line-clamp-2">{step.description}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-gray-400 italic">
                        Waiting for steps...
                    </div>
                )}
            </div>

            {/* Confirmation Area */}
            {status === "waiting" && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-900 mb-3">
                        Task completed?
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onConfirmComplete}
                            className="btn-primary flex-1"
                        >
                            Confirm
                        </button>
                        <button
                            onClick={handleNotQuite}
                            className="btn-secondary flex-1"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {status === "complete" && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="bg-green-50 rounded-lg p-3 flex items-start gap-2">
                        <svg className="w-4 h-4 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-xs text-green-700">
                            Workflow saved.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
