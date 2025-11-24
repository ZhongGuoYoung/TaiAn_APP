// src/utils/crypto.ts
import { SM2 } from "gm-crypto";

/**
 * 使用 SM2 加密 password + salt
 */
export const sm2EncryptPassword = (password: string, salt: string, publicKey: string): string => {
  return SM2.encrypt(password + salt, publicKey, {
    inputEncoding: "utf8",
    outputEncoding: "hex"
  });
};
