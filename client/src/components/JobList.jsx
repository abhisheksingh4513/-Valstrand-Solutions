import JobCard from "./JobCard";

export default function JobList({ jobs, loading }) {
    return (
        <section className="jobs-section">
            <h2>
                Pipeline Jobs
                <span className="count">{jobs.length}</span>
            </h2>

            {loading && jobs.length === 0 ? (
                <div className="jobs-empty">
                    <div className="empty-icon">⏳</div>
                    <p>Loading jobs…</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="jobs-empty">
                    <div className="empty-icon">📋</div>
                    <p>No jobs yet. Create one to see it flow through the pipeline!</p>
                </div>
            ) : (
                <>
                    <div className="jobs-list">
                        {jobs.map((job) => (
                            <JobCard key={job._id} job={job} />
                        ))}
                    </div>
                    <div className="live-indicator">
                        <span className="live-dot" />
                        Live — refreshing every 2s
                    </div>
                </>
            )}
        </section>
    );
}
