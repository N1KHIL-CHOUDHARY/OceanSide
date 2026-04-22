import mongoose from "mongoose";

import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";
import { Recording, type RecordingDocument } from "../models/Recording";
import { assertRoomMember } from "./roomService";
import { badRequest } from "../utils/errors";

export type RecordingDto = {
  id: string;
  roomId: string;
  fileUrl: string;
  durationSeconds: number;
  title?: string;
  mimeType: string;
  createdAt: Date;
};

const toDto = (doc: RecordingDocument): RecordingDto => ({
  id: doc._id.toString(),
  roomId: doc.roomId.toString(),
  fileUrl: doc.fileUrl,
  durationSeconds: doc.durationSeconds,
  title: doc.title ?? undefined,
  mimeType: doc.mimeType ?? "video/webm",
  createdAt: doc.createdAt,
});

export const listRecordingsByRoom = async (
  roomId: string,
  userId: string
): Promise<RecordingDto[]> => {
  await assertRoomMember(roomId, userId);
  const items = await Recording.find({ roomId })
    .sort({ createdAt: -1 })
    .limit(200)
    .exec();
  return items.map(toDto);
};

export const createRecordingFromUpload = async (params: {
  roomId: string;
  userId: string;
  buffer: Buffer;
  mimeType: string;
  durationSeconds: number;
  title?: string;
}): Promise<RecordingDto> => {
  await assertRoomMember(params.roomId, params.userId);

  if (!params.buffer.length) {
    throw badRequest("Empty upload");
  }

  const folder = `${env.CLOUDINARY_FOLDER}/rooms/${params.roomId}`;

  const uploadResult = await new Promise<{
    secure_url: string;
    public_id: string;
    duration?: number;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
      },
      (err, result) => {
        if (err || !result) {
          reject(err ?? new Error("Upload failed"));
          return;
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          duration: result.duration,
        });
      }
    );
    stream.end(params.buffer);
  });

  const duration =
    typeof uploadResult.duration === "number" && uploadResult.duration > 0
      ? uploadResult.duration
      : params.durationSeconds;

  const rec = await Recording.create({
    roomId: new mongoose.Types.ObjectId(params.roomId),
    uploadedBy: new mongoose.Types.ObjectId(params.userId),
    fileUrl: uploadResult.secure_url,
    cloudinaryPublicId: uploadResult.public_id,
    durationSeconds: Math.round(duration),
    mimeType: params.mimeType,
    title: params.title?.trim(),
  });

  return toDto(rec);
};
