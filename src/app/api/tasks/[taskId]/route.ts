import { TaskController } from "@/server/modules/tasks/task.controller";

const controller = new TaskController();

export async function GET(req: Request, { params }: { params: { taskId: string } }) {
  return controller.getById(params);
}

export async function PATCH(req: Request, { params }: { params: { taskId: string } }) {
  return controller.update(params, req);
}

export async function DELETE(req: Request, { params }: { params: { taskId: string } }) {
  return controller.delete(params);
}
