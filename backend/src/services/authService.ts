import { v4 as uuidv4 } from "uuid";

import { User, type UserDocument } from "../models/User";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";
import { conflict, unauthorized } from "../utils/errors";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

const userCreatedAt = (doc: UserDocument): string =>
  doc.createdAt instanceof Date
    ? doc.createdAt.toISOString()
    : new Date(doc.createdAt).toISOString();

const toAuthUser = (doc: UserDocument): AuthUser => ({
  id: doc._id.toString(),
  name: doc.name,
  email: doc.email,
  createdAt: userCreatedAt(doc),
});

const accessParams = (doc: UserDocument) => ({
  userId: doc._id.toString(),
  email: doc.email,
  name: doc.name,
  createdAt: userCreatedAt(doc),
});

export const registerUser = async (params: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> => {
  const existing = await User.findOne({ email: params.email.toLowerCase() });
  if (existing) {
    throw conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(params.password);
  const jti = uuidv4();

  const user = await User.create({
    name: params.name.trim(),
    email: params.email.toLowerCase().trim(),
    passwordHash,
    refreshJti: jti,
  });

  const accessToken = signAccessToken(accessParams(user));
  const refreshToken = signRefreshToken(user._id.toString(), jti);

  return { user: toAuthUser(user), accessToken, refreshToken };
};

export const loginUser = async (params: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> => {
  const user = await User.findOne({ email: params.email.toLowerCase().trim() }).select(
    "+passwordHash +refreshJti"
  );
  if (!user?.passwordHash) {
    throw unauthorized("Invalid email or password");
  }

  const ok = await verifyPassword(params.password, user.passwordHash);
  if (!ok) {
    throw unauthorized("Invalid email or password");
  }

  const jti = uuidv4();
  user.refreshJti = jti;
  await user.save();

  const accessToken = signAccessToken(accessParams(user));
  const refreshToken = signRefreshToken(user._id.toString(), jti);

  return { user: toAuthUser(user), accessToken, refreshToken };
};

export const refreshSession = async (
  refreshToken: string
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> => {
  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw unauthorized("Invalid or expired refresh token");
  }

  const user = await User.findById(payload.sub).select("+refreshJti");
  if (!user || !user.refreshJti || user.refreshJti !== payload.jti) {
    throw unauthorized("Invalid or expired refresh token");
  }

  const jti = uuidv4();
  user.refreshJti = jti;
  await user.save();

  const accessToken = signAccessToken(accessParams(user));
  const nextRefresh = signRefreshToken(user._id.toString(), jti);

  return {
    user: toAuthUser(user),
    accessToken,
    refreshToken: nextRefresh,
  };
};

export const logoutUser = async (userId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshJti: "" } });
};
