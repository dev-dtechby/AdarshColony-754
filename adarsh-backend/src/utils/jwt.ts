import jwt, { SignOptions } from "jsonwebtoken";
import ms, { StringValue } from "ms";
import { ENV } from "../config/env";

export function signToken(
  payload: object,
  expires: StringValue = "7d"
): string {
  if (!ENV.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  const options: SignOptions = {
    expiresIn: ms(expires), // ✅ number
  };

  return jwt.sign(
    payload,
    ENV.JWT_SECRET,
    options
  );
}

export function verifyToken(token: string): any {
  if (!ENV.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.verify(token, ENV.JWT_SECRET);
}
