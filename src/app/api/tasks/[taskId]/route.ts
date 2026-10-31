import { TaskController } from "@/server/modules/tasks/task.controller";

const controller = new TaskController();

export async function GET(req: Request, context: { params: Promise<{ taskId: string }> }) {
  const params = await context.params;
  return controller.getById(params, req);
}

export async function PATCH(req: Request, context: { params: Promise<{ taskId: string }> }) {
  const params = await context.params;
  return controller.update(params, req);
}

export async function DELETE(req: Request, context: { params: Promise<{ taskId: string }> }) {
  const params = await context.params;
  return controller.delete(params, req);
}
