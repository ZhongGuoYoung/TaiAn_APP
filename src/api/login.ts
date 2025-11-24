// src/api/login.ts
import request from "@/utils/request";
import "@/utils/http";

export const getSaltAndPublicKey = () => {
  return uni.request({
    url: "api/Login/GetSalt",
    method: "GET"
  });
};

export const verifyCode = (data: any) => {
  return request({
    url: "Login/VerifyCode",
    method: "POST",
    data,
  });
};

export const resetPassword = (data: any) => {
  return request({
    url: "Login/ResetPassword",
    method: "POST",
    data,
  });
};


export const loginWithEncryption = (data: { username: string; password: string }) => {
  return uni.request({
    url: "api/Login/Login",
    method: "POST",
    header: {
      "Content-Type": "application/json"
    },
    data
  });
};

export const sendCode = (data: any) => {
  return request({
    url: "Login/SendCode",
    method: "POST",
    data,
  });
};

export const logout = () => {
  return request({
    url: "Login/Logout",
    method: "POST",
  });
};


