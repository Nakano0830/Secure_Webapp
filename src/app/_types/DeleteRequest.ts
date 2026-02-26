
import { z } from "zod";
import { emailSchema, passwordSchema } from "./CommonSchemas";

export const secretPhraseSchema = z.string().min(4, "合言葉は4文字以上で入力してください");

export const deleteAccountRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  secretPhrase: secretPhraseSchema,
  confirmText: z.literal("アカウントを削除します", {
    errorMap: () => ({ message: "確認のため「アカウントを削除します」と入力してください" }),
  }),
  // ▼ 変更：boolean型にしつつ、trueであることを要求する
  isConfirmed: z.boolean().refine((val) => val === true, {
    message: "注意事項に同意する必要があります",
  }),
});

export type DeleteAccountRequest = z.infer<typeof deleteAccountRequestSchema>;