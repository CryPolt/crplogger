import { createLogger } from "../src/index.js";
import { performance } from "perf_hooks";
import os from "os";

const TEST_DURATION_SEC = 5;
const THREADS = 6;
const PAYLOAD_SIZE = 4;
const DISABLE_STDERR = true;

const logger = createLogger({ level: "INFO" });

function generatePayload(size) {
    const arr = [];
    for (let i = 0; i < size; i++)
        arr.push({ n: i, v: Math.random().toString(36).slice(2) });
    return arr;
}

async function measureEventLoopStats(samples = 200) {
    const delays = [];

    for (let i = 0; i < samples; i++) {
        const start = performance.now();
        await new Promise(r => setImmediate(r));
        delays.push(performance.now() - start);
    }

    delays.sort((a, b) => a - b);
    const pct = p => delays[Math.floor(delays.length * p)] || delays[delays.length - 1];

    return {
        avg: delays.reduce((a, b) => a + b, 0) / samples,
        p50: pct(0.50),
        p90: pct(0.90),
        p99: pct(0.99),
        p999: pct(0.999)
    };
}

function mb(x) {
    return (x / 1024 / 1024).toFixed(2);
}

function printMetric(label, value) {
    console.log(label.padEnd(30, " "), value);
}

async function runThread(id, durationMs, payload) {
    let counter = 0;
    const start = performance.now();

    while (performance.now() - start < durationMs) {
        logger.info(`T${id} log #${counter}`, { Payload: payload });
        counter++;
    }

    return counter;
}

async function runBenchmark() {
    console.log("\n================ FIXED TIME LOGGER BENCHMARK ================");
    console.log("CPU:", os.cpus()[0].model);
    console.log("Cores:", os.cpus().length);
    console.log("Threads:", THREADS);
    console.log("Payload size:", PAYLOAD_SIZE);
    console.log("Test duration:", TEST_DURATION_SEC, "sec");
    console.log("============================================================\n");

    const origWrite = process.stderr.write;
    if (DISABLE_STDERR) process.stderr.write = () => true;

    global.gc && global.gc();
    const memStart = process.memoryUsage();
    const benchStart = performance.now();

    const durationMs = TEST_DURATION_SEC * 1000;
    const payload = generatePayload(PAYLOAD_SIZE);

    const workers = [];
    for (let t = 0; t < THREADS; t++) {
        workers.push(runThread(t, durationMs, payload));
    }

    const results = await Promise.all(workers);
    const sentLogs = results.reduce((a, b) => a + b, 0);

    await logger.waitForFlush();

    const benchEnd = performance.now();
    const memEnd = process.memoryUsage();

    if (DISABLE_STDERR) process.stderr.write = origWrite;

    const elapsed = benchEnd - benchStart;
    const logsPerSec = Math.round(sentLogs / (elapsed / 1000));
    const timePerLogMs = elapsed / sentLogs;

    const loopStats = await measureEventLoopStats();

    console.log("\n================ RESULTS ================\n");

    printMetric("Logs sent:", sentLogs.toLocaleString("ru-RU"));
    printMetric("Total time (ms):", elapsed.toFixed(2));
    printMetric("Logs per second:", logsPerSec.toLocaleString("ru-RU"));
    printMetric("Time per log (ms):", timePerLogMs.toFixed(6));

    console.log("\n--- EVENT LOOP LATENCY ---");
    printMetric("EventLoop avg (ms):", loopStats.avg.toFixed(6));
    printMetric("EventLoop p50 (ms):", loopStats.p50.toFixed(6));
    printMetric("EventLoop p90 (ms):", loopStats.p90.toFixed(6));
    printMetric("EventLoop p99 (ms):", loopStats.p99.toFixed(6));
    printMetric("EventLoop p999 (ms):", loopStats.p999.toFixed(6));

    console.log("\n--- MEMORY USAGE ---");
    printMetric("RSS start (MB):", mb(memStart.rss));
    printMetric("RSS end (MB):", mb(memEnd.rss));
    printMetric("Heap start (MB):", mb(memStart.heapUsed));
    printMetric("Heap end (MB):", mb(memEnd.heapUsed));
    printMetric("External end (MB):", mb(memEnd.external));

    const memPerLog = (memEnd.heapUsed - memStart.heapUsed) / sentLogs;
    printMetric("Heap per 1 log (bytes):", memPerLog.toFixed(4));

    console.log("\n================ DONE ================\n");
}

runBenchmark();