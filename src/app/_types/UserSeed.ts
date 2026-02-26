import { z } from "zod";
import {
  userNameSchema,
  emailSchema,
  passwordSchema,
  roleSchema,
  aboutSlugSchema,
  aboutContentSchema,
} from "./CommonSchemas";
import { secretPhraseSchema } from "./DeleteRequest";

export const userSeedSchema = z.object({
  name: userNameSchema,
  email: emailSchema,
  password: passwordSchema,
  secretPhrase: secretPhraseSchema, // 追加: ユーザシードの秘密の合言葉のバリデーション
  role: roleSchema,
  aboutSlug: aboutSlugSchema.optional(),
  aboutContent: aboutContentSchema.optional(),
});

export type UserSeed = z.infer<typeof userSeedSchema>;
