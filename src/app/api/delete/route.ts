// app/api/user/delete/route.ts

import { prisma } from "@/libs/prisma";
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { deleteAccountRequestSchema } from "@/app/_types/DeleteRequest"; // ※スキーマを作成したファイルパスに合わせて調整してください

export const POST = async (req: NextRequest) => {
  try {
    // 1. リクエストボディの取得とバリデーション
    const result = deleteAccountRequestSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json({ success: false, message: "入力内容に誤りがあります。" });
    }
    const { email, password, secretPhrase } = result.data;

    // 2. データベースからユーザーを検索
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, message: "認証情報が一致しません。" });
    }

    // 3. パスワードの検証
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ success: false, message: "認証情報が一致しません。" });
    }

    // 4. 秘密の合言葉の検証
    // ※注意：もしDBの user.secretPhrase が undefined/null の場合（古いデータなど）はここで弾かれます
    if (!user.secretPhrase) {
       return NextResponse.json({ success: false, message: "このアカウントには秘密の合言葉が設定されていません。" });
    }
    const isValidPhrase = await bcrypt.compare(secretPhrase, user.secretPhrase);
    if (!isValidPhrase) {
      return NextResponse.json({ success: false, message: "秘密の合言葉が一致しません。" });
    }

    // 5. アカウントの削除
    await prisma.user.delete({ where: { id: user.id } });

    // 成功レスポンスを返す
    return NextResponse.json({ success: true, message: "アカウントを削除しました。" });

  } catch (e) {
    console.error("Delete API Error:", e);
    return NextResponse.json({ success: false, message: "サーバーエラーが発生しました。" });
  }
};