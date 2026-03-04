import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isPhone } from "./utils";

describe("isPhone", () => {
  let originalNavigator: typeof navigator;

  beforeEach(() => {
    originalNavigator = global.navigator;
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
    });
  });

  it("should return true for Android user agent", () => {
    Object.defineProperty(global, "navigator", {
      value: {
        userAgent:
          "Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36",
      },
      writable: true,
    });
    expect(isPhone()).toBe(true);
  });

  it("should return true for iPhone user agent", () => {
    Object.defineProperty(global, "navigator", {
      value: {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1",
      },
      writable: true,
    });
    expect(isPhone()).toBe(true);
  });

  it("should return false for desktop Windows user agent", () => {
    Object.defineProperty(global, "navigator", {
      value: {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
      },
      writable: true,
    });
    expect(isPhone()).toBe(false);
  });

  it("should return false for desktop Mac user agent", () => {
    Object.defineProperty(global, "navigator", {
      value: {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
      },
      writable: true,
    });
    expect(isPhone()).toBe(false);
  });

  it("should return false if navigator is undefined", () => {
    Object.defineProperty(global, "navigator", {
      value: undefined,
      writable: true,
    });
    expect(isPhone()).toBe(false);
  });
});
