import { AnalyticsController } from "@/server/modules/analytics/analytics.controller";

const controller = new AnalyticsController();

export async function GET(req: Request) {
  return controller.getDaily(req as unknown as import("next/server").NextRequest);
}
