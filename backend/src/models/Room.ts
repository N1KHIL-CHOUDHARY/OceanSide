import mongoose, { type InferSchemaType, type Model } from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

roomSchema.index({ hostId: 1, createdAt: -1 });

export type RoomDocument = InferSchemaType<typeof roomSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Room: Model<RoomDocument> =
  mongoose.models.Room ?? mongoose.model<RoomDocument>("Room", roomSchema);
