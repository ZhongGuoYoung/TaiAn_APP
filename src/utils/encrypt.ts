// 加密解密工具
import CryptoJS from "crypto-js";

const SECRET_KEY = "defluat-key";

/**
 * 加密
 * @param data
 * @returns
 */
export function encryptData(data: any) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
}

/**
 * 解密
 * @param data
 * @returns
 */
export function decryptData(data: string) {
  return JSON.parse(
    CryptoJS.AES.decrypt(data, SECRET_KEY).toString(CryptoJS.enc.Utf8),
  );
}
