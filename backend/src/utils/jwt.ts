import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env";

const accessSignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES,
} as SignOptions;

const refreshSignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES,
} as SignOptions;

export type AccessTokenPayload = {
  sub: string;
  email: string;
  name: string;
  createdAt: string;
  typ: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  typ: "refresh";
  jti: string;
};

export const signAccessToken = (params: {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
}): string =>
  jwt.sign(
    {
      sub: params.userId,
      email: params.email,
      name: params.name,
      createdAt: params.createdAt,
      typ: "access",
    } satisfies AccessTokenPayload,
    env.JWT_ACCESS_SECRET,
    accessSignOptions
  );

export const signRefreshToken = (userId: string, jti: string): string =>
  jwt.sign(
    { sub: userId, typ: "refresh", jti } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    refreshSignOptions
  );

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid access token");
  }
  const rec = decoded as Record<string, unknown>;
  const sub = rec.sub;
  const email = rec.email;
  const name = rec.name;
  const createdAt = rec.createdAt;
  const typ = rec.typ;
  if (
    typeof sub !== "string" ||
    typeof email !== "string" ||
    typeof name !== "string" ||
    typeof createdAt !== "string" ||
    typ !== "access"
  ) {
    throw new Error("Invalid access token payload");
  }
  return { sub, email, name, createdAt, typ: "access" };
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid refresh token");
  }
  const rec = decoded as Record<string, unknown>;
  const sub = rec.sub;
  const typ = rec.typ;
  const jti = rec.jti;
  if (typeof sub !== "string" || typ !== "refresh" || typeof jti !== "string") {
    throw new Error("Invalid refresh token payload");
  }
  return { sub, typ: "refresh", jti };
};
