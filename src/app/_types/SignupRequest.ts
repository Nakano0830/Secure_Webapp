import { z } from "zod";
import {
  userNameSchema,
  emailSchema,
  passwordSchema,
} from "@/app/_types/CommonSchemas";
import { secretPhraseSchema } from "./DeleteRequest";

export const signupRequestSchema = z.object({
  name: userNameSchema,
  email: emailSchema,
  password: passwordSchema,
  secretPhrase: secretPhraseSchema, // 追加: サインアップ時の秘密の合言葉のバリデーション
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;
