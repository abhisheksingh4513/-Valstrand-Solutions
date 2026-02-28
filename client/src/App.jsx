import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import CreateJob from "./components/CreateJob";
import JobList from "./components/JobList";

const API_BASE = "/api/jobs";

export default function App() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchJobs = useCallback(async () => {
        try {
            const { data } = await axios.get(API_BASE);
            setJobs(data);
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch + polling every 2 seconds
    useEffect(() => {
        fetchJobs();
        const interval = setInterval(fetchJobs, 2000);
        return () => clearInterval(interval);
    }, [fetchJobs]);

    const handleJobCreated = (newJob) => {
        setJobs((prev) => [newJob, ...prev]);
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>⚡ Async Pipeline</h1>
                <p>Create jobs and watch them progress through multiple stages in real time</p>
            </header>

            <div className="app-content">
                <CreateJob onCreated={handleJobCreated} />
                <JobList jobs={jobs} loading={loading} />
            </div>
        </div>
    );
}
