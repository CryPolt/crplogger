import { jest } from "@jest/globals"
import {
    runWithRequestId,
    getRequestId,
    generateRequestId
} from "../src/index.js"

describe("Request Context", () => {

    test("generateRequestId returns uuid-like string", () => {
        const id = generateRequestId()
        expect(typeof id).toBe("string")
        expect(id.length).toBeGreaterThan(20)
    })

    test("runWithRequestId sets request_id", () => {
        const rid = generateRequestId()
        runWithRequestId(() => {
            expect(getRequestId()).toBe(rid)
        }, rid)
    })

    test("Async propagation works", done => {
        const rid = generateRequestId()

        runWithRequestId(() => {
            setTimeout(() => {
                expect(getRequestId()).toBe(rid)
                done()
            }, 5)
        }, rid)
    })
})