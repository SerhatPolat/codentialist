export interface IFileSnapshot {
  path: string;
  content: string;
  status: "original" | "added" | "modified" | "deleted";
}

export interface ITask {
  _id: string;
  title: string;
  description: string;
  status: "Pending" | "In Progress" | "Done";
  repository: string;
  branch?: string;
  filesSnapshot: IFileSnapshot[];
  createdAt: string;
  updatedAt: string;
}
