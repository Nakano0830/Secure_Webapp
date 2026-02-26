import { prisma } from "@/libs/prisma";
import { loginRequestSchema } from "@/app/_types/LoginRequest";
import { userProfileSchema } from "@/app/_types/UserProfile";
import type { UserProfile } from "@/app/_types/UserProfile";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import { NextResponse, NextRequest } from "next/server";
import { createSession } from "@/app/api/_helper/createSession";
import { createJwt } from "@/app/api/_helper/createJwt";
import { AUTH } from "@/config/auth";
import bcrypt from "bcryptjs";

// キャッシュを無効化して毎回最新情報を取得
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// ロックのしきい値設定
const MAX_ATTEMPTS = 8;
const LOCK_MINUTES = 10;

export const POST = async (req: NextRequest) => {
  try {
    // -----------------------------------------------------
    // 1. IPアドレスの取得とロック確認
    // -----------------------------------------------------
    const ip = req.headers.get("x-forwarded-for")?.split(',')[0] || "unknown-ip";
    
    // DBから現在のIPの失敗記録を取得
    const attemptRecord = await prisma.loginAttempt.findUnique({
      where: { ip },
    });

    if (attemptRecord) {
      const isLocked = attemptRecord.attempts >= MAX_ATTEMPTS;
      const minutesSinceLastAttempt = (new Date().getTime() - attemptRecord.updatedAt.getTime()) / (1000 * 60);

      // ロック期間中の場合、即座にエラーを返す
      if (isLocked && minutesSinceLastAttempt < LOCK_MINUTES) {
        const res: ApiResponse<null> = {
          success: false,
          payload: null,
          message: `ログイン試行回数が上限に達しました。${LOCK_MINUTES}分後にもう一度お試しください。`,
        };
        return NextResponse.json(res);
      }

      // ロック期間が過ぎている場合は回数をリセット
      if (isLocked && minutesSinceLastAttempt >= LOCK_MINUTES) {
        await prisma.loginAttempt.update({ where: { ip }, data: { attempts: 0 } });
      }
    }

    // -----------------------------------------------------
    // 2. リクエストのパース (元のまま)
    // -----------------------------------------------------
    const result = loginRequestSchema.safeParse(await req.json());
    if (!result.success) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "リクエストボディの形式が不正です。",
      };
      return NextResponse.json(res);
    }
    const loginRequest = result.data;

    // -----------------------------------------------------
    // 3. ユーザー検索 (元のまま)
    // -----------------------------------------------------
    const user = await prisma.user.findUnique({
      where: { email: loginRequest.email },
    });
    
    if (!user) {
      // ▼ 追加: 失敗回数をカウントアップ
      await prisma.loginAttempt.upsert({
        where: { ip },
        update: { attempts: { increment: 1 } },
        create: { ip, attempts: 1 },
      });

      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "メールアドレスまたはパスワードの組み合わせが正しくありません。",
      };
      return NextResponse.json(res);
    }

    // -----------------------------------------------------
    // 4. パスワードの検証 (元のまま)
    // -----------------------------------------------------
    const isValidPassword = await bcrypt.compare(loginRequest.password, user.password);
    
    if (!isValidPassword) {
      // ▼ 追加: 失敗回数をカウントアップ
      await prisma.loginAttempt.upsert({
        where: { ip },
        update: { attempts: { increment: 1 } },
        create: { ip, attempts: 1 },
      });

      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "メールアドレスまたはパスワードの組み合わせが正しくありません。",
      };
      return NextResponse.json(res);
    }

    // -----------------------------------------------------
    // 5. 認証成功時の処理 (元のまま)
    // -----------------------------------------------------
    // ▼ 追加: 成功したのでIPの失敗記録を削除（リセット）
    if (attemptRecord) {
      await prisma.loginAttempt.delete({ where: { ip } });
    }

    const tokenMaxAgeSeconds = 60 * 60 * 3; // 3時間

    if (AUTH.isSession) {
      // ■■ セッションベース認証の処理 ■■
      await createSession(user.id, tokenMaxAgeSeconds);
      const res: ApiResponse<UserProfile> = {
        success: true,
        payload: userProfileSchema.parse(user), // 余分なプロパティを削除
        message: "",
      };
      return NextResponse.json(res);
    } else {
      // ■■ トークンベース認証の処理 ■■
      const jwt = await createJwt(user, tokenMaxAgeSeconds);
      const res: ApiResponse<string> = {
        success: true,
        payload: jwt,
        message: "",
      };
      return NextResponse.json(res);
    }
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Internal Server Error";
    console.error(errorMsg);
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: "ログインのサーバサイドの処理に失敗しました。",
    };
    return NextResponse.json(res);
  }
};