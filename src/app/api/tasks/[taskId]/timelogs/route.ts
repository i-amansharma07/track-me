import { TaskController } from "@/server/modules/tasks/task.controller";

const controller = new TaskController();

export async function GET(req: Request, context: { params: Promise<{ taskId: string }> }) {
  const params = await context.params;
  return controller.getTimeLogs(params, req);
}
