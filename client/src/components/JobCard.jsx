const STAGE_MAP = {
    video_upload: ["Uploaded", "Processing", "Encoding", "Ready"],
    food_order: ["Placed", "Preparing", "Out for Delivery", "Delivered"],
};

const TYPE_ICONS = {
    video_upload: "🎬",
    food_order: "🍕",
};

const TYPE_LABELS = {
    video_upload: "Video Upload",
    food_order: "Food Order",
};

function getStageState(stages, currentStatus, stageName, stageIndex, allStages, isFailed) {
    const stageEntry = stages?.find((s) => s.name === stageName);
    const currentIdx = allStages.indexOf(currentStatus);

    if (isFailed) {
        if (stageEntry?.completedAt) return "completed";
        if (stageName === currentStatus) return "failed";
        return "pending";
    }

    if (stageEntry?.completedAt) return "completed";
    if (stageName === currentStatus) return "active";
    if (stageIndex < currentIdx) return "completed";
    return "pending";
}

function getStatusBadgeClass(status, allStages, isFailed) {
    if (isFailed) return "failed";
    const lastStage = allStages[allStages.length - 1];
    if (status === lastStage) return "completed";
    if (allStages.includes(status)) return "in-progress";
    return "queued";
}

function formatTime(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function JobCard({ job }) {
    const allStages = STAGE_MAP[job.type] || [];
    const isFailed = job.status === "Failed";
    const isComplete = job.status === allStages[allStages.length - 1];
    const badgeClass = getStatusBadgeClass(job.status, allStages, isFailed);

    return (
        <div className="job-card">
            {/* Header */}
            <div className="job-card-header">
                <div className="job-card-title">
                    <div className={`job-type-icon ${job.type}`}>
                        {TYPE_ICONS[job.type] || "📦"}
                    </div>
                    <div>
                        <h3>{job.title}</h3>
                        <span className="job-type-label">{TYPE_LABELS[job.type] || job.type}</span>
                    </div>
                </div>

                <span className={`status-badge ${badgeClass}`}>
                    <span className="pulse" />
                    {job.status}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar-container">
                <div className="progress-bar-header">
                    <span>Progress</span>
                    <span className="progress-value">{job.progress}%</span>
                </div>
                <div className="progress-bar-track">
                    <div
                        className={`progress-bar-fill ${isComplete ? "done" : ""}`}
                        style={{ width: `${job.progress}%` }}
                    />
                </div>
            </div>

            {/* Stage Timeline */}
            <div className="stage-timeline">
                {allStages.map((stage, idx) => {
                    const state = getStageState(job.stages, job.status, stage, idx, allStages, isFailed);
                    return (
                        <div className="stage-item" key={stage}>
                            <div className="stage-node">
                                <div className={`stage-dot ${state}`} />
                                <span className={`stage-label ${state}`}>{stage}</span>
                            </div>
                            {idx < allStages.length - 1 && (
                                <div
                                    className={`stage-connector ${state === "completed" ? "completed" : ""
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Result */}
            {isComplete && job.result && (
                <div className="job-result">
                    <h4>✅ Result</h4>
                    <pre>{JSON.stringify(job.result, null, 2)}</pre>
                </div>
            )}

            {/* Error */}
            {isFailed && job.error && (
                <div className="job-error">
                    <h4>❌ Error</h4>
                    <p>{job.error}</p>
                </div>
            )}

            {/* Timestamp */}
            <div className="job-timestamp">
                🕐 Created {formatTime(job.createdAt)}
                {job.updatedAt !== job.createdAt && ` · Updated ${formatTime(job.updatedAt)}`}
            </div>
        </div>
    );
}
