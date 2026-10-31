import { describe, it, expect } from "vitest";
import { AnalyticsService } from "@/server/modules/analytics/analytics.service";

describe("Analytics module structure", () => {
  const service = new AnalyticsService();

  it("instantiates service", () => {
    expect(service).toBeDefined();
  });

  it("has summary method", () => {
    expect(typeof service.summary).toBe("function");
  });

  it("has daily method", () => {
    expect(typeof service.daily).toBe("function");
  });

  it("has categories method", () => {
    expect(typeof service.categories).toBe("function");
  });
});
