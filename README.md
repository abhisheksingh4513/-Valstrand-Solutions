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

## Setup Instructions

### Prerequisites
- **Node.js**
- **MongoDB** (running locally or via a cloud provider like MongoDB Atlas)

### 1. Backend Setup
1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `server` directory. Add your MongoDB connection string and a port:
   ```env
   MONGO_URI=your_mongodb_connection_string
   PORT=5000
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *(The server will start on port 5000 by default)*

### 2. Frontend Setup
1. Open a new terminal window/tab and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Start the Vite frontend development server:
   ```bash
   npm run dev
   ```

### 3. Running the Application
Once both servers are running, open your web browser and navigate to the URL provided by your Vite terminal (usually `http://localhost:5173`). You'll be able to create new background jobs and see their status update in real-time.
