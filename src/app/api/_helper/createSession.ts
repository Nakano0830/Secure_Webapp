import { cookies } from "next/headers";
import { prisma } from "@/libs/prisma";

/**
 * セッションを新規作成して Cookie に設定する。
 * @param userId - ユーザのID (UUID)
 * @param tokenMaxAgeSeconds - 有効期限（秒単位）
 * @returns - SessionID
 */
export const createSession = async (
  userId: string,
  tokenMaxAgeSeconds: number,
): Promise<string> => {
  const session = await prisma.session.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      expiresAt: new Date(Date.now() + tokenMaxAgeSeconds * 1000),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("sess_id", session.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: tokenMaxAgeSeconds,
    secure: false, 
  });

  return session.id;
};
