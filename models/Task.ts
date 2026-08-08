import mongoose, { Schema, Document } from "mongoose";
import { IFileSnapshot, ITask as ITaskFields } from "@/types/workspace";

export interface ITask extends Document {
  title: ITaskFields["title"];
  description: ITaskFields["description"];
  status: ITaskFields["status"];
  repository: ITaskFields["repository"];
  branch?: ITaskFields["branch"];
  filesSnapshot: IFileSnapshot[];
  createdAt: Date;
  updatedAt: Date;
}

const FileSnapshotSchema = new Schema<IFileSnapshot>({
  path: { type: String, required: true },
  content: { type: String, default: "" },
  status: {
    type: String,
    enum: ["original", "added", "modified", "deleted"],
    default: "original",
  },
});

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Done"],
      default: "Pending",
    },
    repository: { type: String, required: true },
    branch: { type: String },
    filesSnapshot: [FileSnapshotSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Task ||
  mongoose.model<ITask>("Task", TaskSchema);
