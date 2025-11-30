/**
 * Lightweight asynchronous queue for logs
 */
export class LogQueue {
    constructor() {
        this.head = null
        this.tail = null
        this.flushing = false
    }

    /**
     * @param {Function} fn
     */
    push(fn) {
        const node = { fn, next: null }

        if (this.tail === null) {
            this.head = this.tail = node
        } else {
            this.tail.next = node
            this.tail = node
        }

        if (!this.flushing) this.flush()
    }

    flush() {
        this.flushing = true

        while (this.head) {
            const node = this.head
            this.head = node.next
            if (this.head === null) this.tail = null
            node.fn()
        }

        this.flushing = false
    }

    /**
     * @returns {boolean}
     */
    isEmpty() {
        return this.head === null
    }
}