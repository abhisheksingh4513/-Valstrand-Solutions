const Job = require("../models/Job");

/*  Stage definitions per job type  */
const STAGE_MAP = {
    video_upload: ["Uploaded", "Processing", "Encoding", "Ready"],
    food_order: ["Placed", "Preparing", "Out for Delivery", "Delivered"],
};

/*  Result payloads returned when the job finishes  */
const RESULT_MAP = {
    video_upload: { url: "https://cdn.example.com/videos/output.mp4", resolution: "1080p" },
    food_order: { deliveredBy: "Rider #42", rating: 4.8 },
};

/*  Delay between stages (ms) — randomised a bit so jobs feel realistic  */
function stageDelay() {
    return 3000 + Math.floor(Math.random() * 4000); // 3‑7 s
}

/**
 * Atomically advance a job to the next stage.
 * Uses `findOneAndUpdate` with a status filter so two concurrent
 * workers can never push the same job past the same stage twice.
 */
async function advanceStage(jobId, fromStatus, toStatus, progress, isLast) {
    const now = new Date();

    const updateOps = {
        $set: {
            status: toStatus,
            progress,
            ...(isLast ? { result: RESULT_MAP[undefined] } : {}), // placeholder, overridden below
        },
        $push: {
            stages: { name: toStatus, startedAt: now, completedAt: isLast ? now : null },
        },
    };

    // Mark the *previous* stage as completed
    const job = await Job.findOneAndUpdate(
        { _id: jobId, status: fromStatus },
        updateOps,
        { new: true }
    );

    return job; // null means another process already moved it
}

/**
 * Process a single job through all its stages.
 * Called right after creation — runs fully asynchronously.
 */
async function processJob(jobId, jobType) {
    const stages = STAGE_MAP[jobType];
    if (!stages) return;

    try {
        for (let i = 0; i < stages.length; i++) {
            const fromStatus = i === 0 ? stages[0] : stages[i - 1];
            const toStatus = stages[i];
            const progress = Math.round(((i + 1) / stages.length) * 100);
            const isLast = i === stages.length - 1;

            if (i === 0) {
                // First stage — already set during creation, just mark the stage entry
                await Job.findOneAndUpdate(
                    { _id: jobId, status: stages[0] },
                    {
                        $set: { progress: Math.round((1 / stages.length) * 100) },
                        $push: { stages: { name: stages[0], startedAt: new Date(), completedAt: null } },
                    }
                );
                await delay(stageDelay());
                continue;
            }

            // Wait before transitioning
            await delay(stageDelay());

            // Complete the previous stage
            await Job.updateOne(
                { _id: jobId, "stages.name": fromStatus, "stages.completedAt": null },
                { $set: { "stages.$.completedAt": new Date() } }
            );

            // Advance to the next stage
            const updated = await advanceStage(jobId, fromStatus, toStatus, progress, isLast);
            if (!updated) {
                console.warn(`[Worker] Job ${jobId} — could not transition ${fromStatus} → ${toStatus} (already moved)`);
                return;
            }

            // If last stage, set final result
            if (isLast) {
                await Job.updateOne(
                    { _id: jobId },
                    {
                        $set: {
                            result: RESULT_MAP[jobType],
                            "stages.$[elem].completedAt": new Date(),
                        },
                    },
                    { arrayFilters: [{ "elem.name": toStatus }] }
                );
            }
        }

        console.log(`[Worker] Job ${jobId} completed successfully`);
    } catch (err) {
        console.error(`[Worker] Job ${jobId} failed:`, err.message);
        await Job.updateOne(
            { _id: jobId },
            { $set: { status: "Failed", error: err.message } }
        );
    }
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { processJob, STAGE_MAP };
