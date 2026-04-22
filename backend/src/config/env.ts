import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),

    PORT: z.coerce.number().default(5000),

    MONGODB_URI: z.string(),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES: z.string(),
    JWT_REFRESH_EXPIRES: z.string(),

    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_API_SECRET: z.string(),
    CLOUDINARY_CLOUD_NAME: z.string(),
    CLOUDINARY_FOLDER: z.string(),

    CORS_ORIGIN: z.string(),
  })
  .passthrough(); // 🔥 critical fix

export const env = envSchema.parse(process.env);