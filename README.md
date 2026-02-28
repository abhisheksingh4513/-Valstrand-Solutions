# Async Job Processing Application

This is a demonstration of a MERN stack application designed to handle asynchronous, multi-stage background tasks (like video uploads or food orders), specifically showcasing how processes maintain consistency and handle concurrency.

## Architecture Approach

The system follows a simplified monolith architecture where the REST API and the job processing workers are unified within an Express.js server, utilizing MongoDB as the data store.

- **Express.js API**: Handles incoming HTTP requests to create jobs and fetch their current status.
- **MongoDB Database**: Acts as the central source of truth, persisting the job's state, tracking the timeline of executed stages, and avoiding in-memory state loss.
- **Client Application**: A lightweight React frontend (M**R**N stack) that polls or receives updates to render the changing state of jobs in real-time.

This approach was selected to provide immediate feedback to users while offloading long-running tasks without the overhead of maintaining additional message brokers (like Redis, RabbitMQ, or Kafka) during early-stage development. 

## Background Processing

Long-running jobs are processed using a fire-and-forget mechanism upon job creation. 

1. **Job Initialization**: When a client sends a `POST /api/jobs` request, the server creates a new job record in MongoDB with an initial status (e.g., "Placed" or "Uploaded").
2. **Asynchronous Execution**: The API immediately triggers a background `processJob()` worker function and returns a `201 Created` response to the client. The HTTP request is not blocked by the work.
3. **Stage Processing**: The worker iterates over predefined operational stages (e.g., Prepared, Out for Delivery, Delivered). It uses asynchronous delays to simulate real processing time and updates the job's progress and status in the database at each step.
4. **Resilience**: If an error occurs during execution, the worker catches the exception and gracefully marks the job's status as "Failed" with an error message stored in MongoDB.

## Consistency and Concurrency

This application guarantees data consistency and prevents race conditions through the robust use of MongoDB atomic operations rather than locking.

- **Atomic Transitions**: The worker advances jobs to the next stage using `Job.findOneAndUpdate()`. Crucially, this query filters heavily by both the `jobId` *and* the job's expected current `status` (e.g., `{ _id: jobId, status: fromStatus }`).
- **Idempotency**: Because the atomic update checks the `status`, if two concurrent workers somehow attempt to move the same job from "Preparing" to "Out for Delivery", only the first worker's query will find a match. The second worker will find that the condition `status: "Preparing"` is no longer true and will exit safely without corrupting the timeline.
- **Stage Tracking**: MongoDB's `$set` and `$push` operators are used atomically to update text progress and append timestamps to an array of stages in a single network roundtrip, guaranteeing that the job's data model is always perfectly synchronized with its execution state.
