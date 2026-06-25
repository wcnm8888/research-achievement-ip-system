import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { hashSessionToken } from "../identity/session-identity.adapter";

const passwordHashPrefix = "scrypt";
const passwordKeyLength = 64;
const passwordSaltLength = 16;
const scryptCost = 16384;
const scryptBlockSize = 8;
const scryptParallelization = 1;

export const createOpaqueToken = (): string => randomBytes(32).toString("base64url");

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(passwordSaltLength);
  const derivedKey = await deriveScryptKey(password, salt, passwordKeyLength, {
    N: scryptCost,
    r: scryptBlockSize,
    p: scryptParallelization,
  });

  return [
    passwordHashPrefix,
    scryptCost,
    scryptBlockSize,
    scryptParallelization,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
};

export const verifyPassword = async (
  password: string,
  storedHash: string,
): Promise<boolean> => {
  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== passwordHashPrefix) {
    return false;
  }

  const rawCost = parts[1];
  const rawBlockSize = parts[2];
  const rawParallelization = parts[3];
  const rawSalt = parts[4];
  const rawKey = parts[5];
  if (!rawCost || !rawBlockSize || !rawParallelization || !rawSalt || !rawKey) {
    return false;
  }

  const cost = Number(rawCost);
  const blockSize = Number(rawBlockSize);
  const parallelization = Number(rawParallelization);
  if (!Number.isInteger(cost) || !Number.isInteger(blockSize) || !Number.isInteger(parallelization)) {
    return false;
  }

  const salt = Buffer.from(rawSalt, "base64url");
  const expectedKey = Buffer.from(rawKey, "base64url");
  const actualKey = await deriveScryptKey(password, salt, expectedKey.length, {
    N: cost,
    r: blockSize,
    p: parallelization,
  });

  return (
    actualKey.length === expectedKey.length &&
    timingSafeEqual(actualKey, expectedKey)
  );
};

export const requireSessionSecret = (): string => {
  const sessionSecret = process.env.SESSION_SECRET?.trim();
  if (!sessionSecret) {
    throw new AuthConfigurationError("SESSION_SECRET is required.");
  }

  return sessionSecret;
};

export const hashOpaqueToken = (token: string, secret: string): string => {
  const tokenHash = hashSessionToken(token, secret);
  if (!tokenHash) {
    throw new AuthConfigurationError("Session token could not be hashed.");
  }

  return tokenHash;
};

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConfigurationError";
  }
}

const deriveScryptKey = (
  password: string,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number },
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
