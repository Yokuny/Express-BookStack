import { type Document, model, Schema } from "mongoose";

export interface ILog extends Document {
  method: string;
  route: string;
  statusCode: number;
  responseTime: number;
  ip: string;
  userID?: string;
  feature?: string;
  error?: string;
  timestamp: Date;
}

const logSchema = new Schema<ILog>({
  method: { type: String, required: true },
  route: { type: String, required: true },
  statusCode: { type: Number, required: true },
  responseTime: { type: Number, required: true },
  ip: { type: String, required: true },
  userID: { type: String },
  feature: { type: String },
  error: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const Log = model<ILog>("Log", logSchema);
