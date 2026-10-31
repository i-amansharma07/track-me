import { AnalyticsService } from "./analytics.service";

export class AnalyticsController {
  private service = new AnalyticsService();

  async summary(userId: string) {
    return this.service.summary(userId);
  }

  async daily(userId: string, start?: string, end?: string) {
    return this.service.daily(userId, start, end);
  }

  async categories(userId: string) {
    return this.service.categories(userId);
  }
}
