export type TimeLog = {
  id: string;
  taskId: string;
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
};
