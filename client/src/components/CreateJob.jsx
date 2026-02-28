import { useState } from "react";
import axios from "axios";

const JOB_TYPES = [
    { value: "video_upload", label: "🎬 Video Upload", desc: "Uploaded → Processing → Encoding → Ready" },
    { value: "food_order", label: "🍕 Food Order", desc: "Placed → Preparing → Out for Delivery → Delivered" },
];

export default function CreateJob({ onCreated }) {
    const [title, setTitle] = useState("");
    const [type, setType] = useState("video_upload");
    const [submitting, setSubmitting] = useState(false);

    const selectedType = JOB_TYPES.find((t) => t.value === type);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        setSubmitting(true);
        try {
            const { data } = await axios.post("/api/jobs", { title: title.trim(), type });
            onCreated(data);
            setTitle("");
        } catch (err) {
            console.error("Failed to create job:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="create-panel">
            <h2>
                <span className="icon">+</span>
                New Job
            </h2>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="job-title">Title</label>
                    <input
                        id="job-title"
                        type="text"
                        placeholder="e.g. Summer Vacation Clip"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={submitting}
                        autoComplete="off"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="job-type">Pipeline Type</label>
                    <select
                        id="job-type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        disabled={submitting}
                    >
                        {JOB_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                    {selectedType && (
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8 }}>
                            {selectedType.desc}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn-create"
                    disabled={submitting || !title.trim()}
                >
                    {submitting ? (
                        <>
                            <span className="spinner-inline" />
                            Creating…
                        </>
                    ) : (
                        "Create Job →"
                    )}
                </button>
            </form>
        </div>
    );
}
