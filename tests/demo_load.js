import { createLogger } from "../src/index.js";
import os from "os";

const hasGC = typeof global.gc === "function";

const TOTAL_LOGS = 100000;
const BATCH_SIZE = 10000;
const LEVEL = "INFO";

const logger = createLogger({ level: LEVEL });

console.log("\n--- DONNER LOGGER LOAD TEST ---");
console.log("CPU:", os.cpus()[0].model);
console.log("LOG LEVEL:", LEVEL);
console.log("TOTAL LOGS:", TOTAL_LOGS);
console.log("GC ENABLED:", hasGC);
console.log("---------------------------------\n");

function mem() {
    const m = process.memoryUsage();
    return {
        rss: (m.rss / 1024 / 1024).toFixed(1) + " MB",
        heapUsed: (m.heapUsed / 1024 / 1024).toFixed(1) + " MB",
        heapTotal: (m.heapTotal / 1024 / 1024).toFixed(1) + " MB"
    };
}

function cpu() {
    const cpus = os.cpus();
    let user = 0, sys = 0;

    for (const c of cpus) {
        user += c.times.user;
        sys += c.times.sys;
    }
    return { user, sys };
}

//
// --- METRIC CAPTURE ---
//
const startMem = mem();
const startCpu = cpu();
const startTime = performance.now();

if (hasGC) global.gc();

//
// --- LOGGING LOOP ---
//
async function runLoadTest() {
    console.log("Logging started…");

    for (let i = 0; i < TOTAL_LOGS; i++) {
        logger.info(`log #${i}`, { Payload: [{ index: i }] });

        // разгружаем очередь пачками
        if (i % BATCH_SIZE === 0) {
            await new Promise(r => setTimeout(r, 0));
        }
    }

    // ждём, пока очередь допишет всё
    await new Promise(r => setTimeout(r, 200));

    const endTime = performance.now();
    if (hasGC) global.gc();

    const endMem = mem();
    const endCpu = cpu();

    const durationMs = endTime - startTime;
    const rps = Math.round(TOTAL_LOGS / (durationMs / 1000));

    console.log("\n--- RESULTS ---\n");

    console.log("Time:", durationMs.toFixed(2), "ms");
    console.log("Logs/sec (RPS):", rps);

    console.log("\n--- MEMORY ---");
    console.log("Start:", startMem);
    console.log("End:  ", endMem);

    console.log("\n--- CPU TIMES ---");
    console.log("User time (total):", (endCpu.user - startCpu.user) / 1000, "ms");
    console.log("Sys time (total): ", (endCpu.sys - startCpu.sys) / 1000, "ms");

    console.log("\n--- SUMMARY ---");
    console.log(`Avg time per log: ${(durationMs / TOTAL_LOGS).toFixed(5)} ms`);
    console.log(`Peak RSS: ${endMem.rss}`);
    console.log("\n--- DONE ---\n");
}

runLoadTest();