// 実行は npx prisma db seed　(package.jsonの prisma にコマンド追加)
// 上記コマンドで実行する範囲は相対パスを基準にする必要があるので注意
import { v4 as uuid } from "uuid";
import { PrismaClient} from "@prisma/client";
import {Role} from "../src/app/_types/Role";
import { UserSeed, userSeedSchema } from "../src/app/_types/UserSeed";
import bcrypt from "bcryptjs"

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // テスト用のユーザ情報の「種」となる userSeeds を作成
  const userSeeds: UserSeed[] = [
    {
      name: "高負荷 耐子",
      password: "password1111",
      secretPhrase: "RoseBURST",
      email: "admin01@example.com",
      role: Role.ADMIN,
    },
    {
      name: "不具合 直志",
      password: "password2222",
      secretPhrase: "SkyLINE",
      email: "admin02@example.com",
      role: Role.ADMIN,
    },
    {
      name: "構文 誤次郎",
      password: "password1111",
      secretPhrase: "JIROBOT",
      email: "user01@example.com",
      role: Role.USER,
      aboutSlug: "gojiro",
      aboutContent: "構文誤次郎です。<br>よろしくお願いします。",
    },
    {
      name: "仕様 曖昧子",
      password: "password2222",
      secretPhrase: "AIMAIBOT",
      email: "user02@example.com",
      role: Role.USER,
      aboutSlug: "aimaiko",
      aboutContent: "仕様曖昧子と申します。仲良くしてください。",
    }
  ];

  // userSeedSchema を使って UserSeeds のバリデーション
  try {
    await Promise.all(
      userSeeds.map(async (userSeed, index) => {
        const result = userSeedSchema.safeParse(userSeed);
        if (result.success) return;
        console.error(
          `Validation error in record ${index}:\n${JSON.stringify(userSeed, null, 2)}`,
        );
        console.error("▲▲▲ Validation errors ▲▲▲");
        console.error(
          JSON.stringify(result.error.flatten().fieldErrors, null, 2),
        );
        throw new Error(`Validation failed at record ${index}`);
      }),
    );
  } catch (error) {
    throw error;
  }

  // 各テーブルの全レコードを削除
  await prisma.user.deleteMany();
  await prisma.session.deleteMany();
  await prisma.stolenContent.deleteMany();
  await prisma.loginAttempt.deleteMany();
    
  // ユーザ（user）テーブルにテストデータを挿入
  const userData = await Promise.all(
  userSeeds.map(async (userSeed) => ({
    id: uuid(),
    name: userSeed.name,
    password: await bcrypt.hash(userSeed.password, 10),
    secretPhrase: await bcrypt.hash(userSeed.secretPhrase, 10), // ダミーの秘密の合言葉をハッシュ化して保存
    role: userSeed.role,
    email: userSeed.email,
    aboutSlug: userSeed.aboutSlug || null,
    aboutContent: userSeed.aboutContent || "",
  }))
);

await prisma.user.createMany({ data: userData });

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => console.error(e.message))
  .finally(async () => {
    await prisma.$disconnect();
  });
