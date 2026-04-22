import mongoose, { type InferSchemaType, type Model } from "mongoose";

const recordingSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    durationSeconds: { type: Number, required: true, min: 0 },
    mimeType: { type: String, default: "video/webm" },
    title: { type: String, trim: true },
  },
  { timestamps: true }
);

recordingSchema.index({ roomId: 1, createdAt: -1 });

export type RecordingDocument = InferSchemaType<typeof recordingSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Recording: Model<RecordingDocument> =
  mongoose.models.Recording ??
  mongoose.model<RecordingDocument>("Recording", recordingSchema);
