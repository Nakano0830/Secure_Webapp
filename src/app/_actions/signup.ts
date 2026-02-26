"use server";

import { prisma } from "@/libs/prisma";
import { signupRequestSchema } from "@/app/_types/SignupRequest";
import { userProfileSchema } from "@/app/_types/UserProfile";
import type { SignupRequest } from "@/app/_types/SignupRequest";
import type { UserProfile } from "@/app/_types/UserProfile";
import type { ServerActionResponse } from "@/app/_types/ServerActionResponse";
import bcrypt from "bcryptjs";

// ユーザのサインアップのサーバアクション
export const signupServerAction = async (
  signupRequest: SignupRequest,
): Promise<ServerActionResponse<UserProfile | null>> => {
  try {
    const payload = signupRequestSchema.parse(signupRequest);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 既に登録済みユーザのサインアップではないか確認
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (existingUser) {
      return {
        success: false,
        payload: null,
        message: "登録できませんでした．",
      };
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    // 追加: 秘密の合言葉のハッシュ化
    const hashedSecretPhrase = await bcrypt.hash(payload.secretPhrase, 10);

    // ユーザの作成
    const user = await prisma.user.create({
      data: {
        email: payload.email,
        password: hashedPassword,
        secretPhrase: hashedSecretPhrase, // 追加したフィールド
        name: payload.name,
      },
    });

    // レスポンスの生成
    const res: ServerActionResponse<UserProfile> = {
      success: true,
      payload: userProfileSchema.parse(user), // 余分なプロパティを削除,
      message: "",
    };
    return res;
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Internal Server Error";
    console.error(errorMsg);
    return {
      success: false,
      payload: null,
      message: errorMsg,
    };
  }
};
