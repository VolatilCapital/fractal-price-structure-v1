import { describe, it, expect, vi } from "vitest"
import { NoopLogger, noopLogger } from "./Logger.js"
import { ConsoleLogger } from "../../infrastructure/logging/ConsoleLogger.js"

describe("NoopLogger", () => {
  it("should not throw when calling debug", () => {
    const logger = new NoopLogger()
    expect(() => logger.debug("test message")).not.toThrow()
  })

  it("should not throw when calling info", () => {
    const logger = new NoopLogger()
    expect(() => logger.info("test message")).not.toThrow()
  })

  it("should not throw when calling warn", () => {
    const logger = new NoopLogger()
    expect(() => logger.warn("test message")).not.toThrow()
  })

  it("should not throw when calling error", () => {
    const logger = new NoopLogger()
    expect(() => logger.error("test message")).not.toThrow()
  })

  it("should provide a default singleton instance", () => {
    expect(noopLogger).toBeInstanceOf(NoopLogger)
  })
})

describe("ConsoleLogger", () => {
  it("should call console.debug for debug messages", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {})
    const logger = new ConsoleLogger()

    logger.debug("test message", { extra: "data" })

    expect(spy).toHaveBeenCalledWith("test message", { extra: "data" })
    spy.mockRestore()
  })

  it("should call console.info for info messages", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {})
    const logger = new ConsoleLogger()

    logger.info("info message")

    expect(spy).toHaveBeenCalledWith("info message")
    spy.mockRestore()
  })

  it("should call console.warn for warn messages", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {})
    const logger = new ConsoleLogger()

    logger.warn("warning message")

    expect(spy).toHaveBeenCalledWith("warning message")
    spy.mockRestore()
  })

  it("should call console.error for error messages", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const logger = new ConsoleLogger()

    logger.error("error message")

    expect(spy).toHaveBeenCalledWith("error message")
    spy.mockRestore()
  })

  it("should add prefix to messages when provided", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {})
    const logger = new ConsoleLogger("MyModule")

    logger.info("prefixed message")

    expect(spy).toHaveBeenCalledWith("[MyModule] prefixed message")
    spy.mockRestore()
  })
})
