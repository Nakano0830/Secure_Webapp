import { z } from "zod";
import { Role } from "./Role";

export const passwordSchema = z.string().min(5).refine(
  (val) => /[A-Za-z]/.test(val) && /\d/.test(val),
  "パスワードは英字と数字を両方含む必要があります",
);
export const emailSchema = z.string().email();
export const userNameSchema = z.string().min(1);
export const roleSchema = z.nativeEnum(Role);

// prettier-ignore
export const isUUID = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const uuidSchema = z.string().refine(isUUID, {
  message: "Invalid UUID format.",
});

export const aboutContentSchema = z.string().min(0).max(1000);
export const aboutSlugSchema = z
  .string()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .refine(
    (val) =>
      val === null ||
      (val.length >= 4 && val.length <= 16 && /^[a-z0-9-]+$/.test(val)),
    {
      message: "4〜16文字の英小文字・数字・ハイフンのみ使用できます",
    },
  );

export const getPasswordStrength = (password: string) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++; // 長さ
  if (/[A-Z]/.test(password)) score++; // 大文字
  if (/[0-9]/.test(password)) score++; // 数字
  if (/[^A-Za-z0-9]/.test(password)) score++; // 記号
  return score; // 0〜4のスコア
};

export const strengthLabels = ["非常に弱い", "弱い", "普通", "強い", "非常に強い"];
export const strengthColors = ["bg-gray-200", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
