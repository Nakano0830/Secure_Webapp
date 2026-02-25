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
  secretPhrase: secretPhraseSchema,
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;
