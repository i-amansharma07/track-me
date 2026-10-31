import { TaskController } from "@/server/modules/tasks/task.controller";

const controller = new TaskController();

export async function GET(req: Request) {
  return controller.list(req as unknown as import("next/server").NextRequest);
}

export async function POST(req: Request) {
  return controller.create(req);
}
