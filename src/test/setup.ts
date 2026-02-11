import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Mock IntersectionObserver
class IntersectionObserver {
 observe() { }
 unobserve() { }
 disconnect() { }
}
Object.defineProperty(window, 'IntersectionObserver', {
 writable: true,
 configurable: true,
 value: IntersectionObserver,
})

// Mock ResizeObserver
class ResizeObserver {
 observe() { }
 unobserve() { }
 disconnect() { }
}
Object.defineProperty(window, 'ResizeObserver', {
 writable: true,
 configurable: true,
 value: ResizeObserver,
})

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
 cleanup()
})
