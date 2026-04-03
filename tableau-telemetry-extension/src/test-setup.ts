import '@testing-library/jest-dom'

// Mock ResizeObserver for jsdom (not available natively)
globalThis.ResizeObserver = class ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {
    // no-op in test environment
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
