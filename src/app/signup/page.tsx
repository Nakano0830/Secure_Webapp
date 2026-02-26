"use client";

// ServerAction (Custom Invocation) を利用した実装
// （ /api/signup のようなAPIエンドポイントを実装する必要がない ）

import React, { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupRequestSchema, SignupRequest } from "@/app/_types/SignupRequest";
import { TextInputField } from "@/app/_components/TextInputField";
import { ErrorMsgField } from "@/app/_components/ErrorMsgField";
import { Button } from "@/app/_components/Button";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { faSpinner, faPenNib } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { signupServerAction } from "@/app/_actions/signup";

import { getPasswordStrength, strengthLabels, strengthColors } from "@/app/_types/CommonSchemas"; // パスは適宜調整してください

const Page: React.FC = () => {
  const c_Name = "name";
  const c_Email = "email";
  const c_Password = "password";
  const c_SecretPhrase = "secretPhrase";

  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [isSignUpCompleted, setIsSignUpCompleted] = useState(false);

  // フォーム処理関連の準備と設定
  const formMethods = useForm<SignupRequest>({
    mode: "onChange",
    resolver: zodResolver(signupRequestSchema),
  });
  const fieldErrors = formMethods.formState.errors;

  const passwordValue = formMethods.watch(c_Password, "");
  const strength = getPasswordStrength(passwordValue);

  // ルートエラー（サーバサイドで発生した認証エラー）の表示設定の関数
  const setRootError = (errorMsg: string) => {
    formMethods.setError("root", {
      type: "manual",
      message: errorMsg,
    });
  };

  // ルートエラーメッセージのクリアに関する設定
  useEffect(() => {
    const subscription = formMethods.watch((value, { name }) => {
      if (name === c_Email || name === c_Password) {
        formMethods.clearErrors("root");
      }
    });
    return () => subscription.unsubscribe();
  }, [formMethods]);

  // ログイン完了後のリダイレクト処理
  useEffect(() => {
    if (isSignUpCompleted) {
      router.replace(`/login?${c_Email}=${formMethods.getValues(c_Email)}`);
      router.refresh();
      console.log("サインアップ完了");
    }
  }, [formMethods, isSignUpCompleted, router]);

  // フォームの送信処理
  const onSubmit = async (signupRequest: SignupRequest) => {
    try {
      startTransition(async () => {
        // ServerAction (Custom Invocation) の利用
        const res = await signupServerAction(signupRequest);
        if (!res.success) {
          setRootError(res.message);
          return;
        }
        setIsSignUpCompleted(true);
      });
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "予期せぬエラーが発生しました。";
      setRootError(errorMsg);
    }
  };

  return (
    <main>
      <div className="text-2xl font-bold">
        <FontAwesomeIcon icon={faPenNib} className="mr-1.5" />
        Signup
      </div>
      <form
        noValidate
        onSubmit={formMethods.handleSubmit(onSubmit)}
        className="mt-4 flex flex-col gap-y-4"
      >
        <div>
          <label htmlFor={c_Name} className="mb-2 block font-bold">
            表示名
          </label>
          <TextInputField
            {...formMethods.register(c_Name)}
            id={c_Name}
            placeholder="寝屋川 タヌキ"
            type="text"
            disabled={isPending || isSignUpCompleted}
            error={!!fieldErrors.name}
            autoComplete="name"
          />
          <ErrorMsgField msg={fieldErrors.name?.message} />
        </div>

        <div>
          <label htmlFor={c_Email} className="mb-2 block font-bold">
            メールアドレス（ログインID）
          </label>
          <TextInputField
            {...formMethods.register(c_Email)}
            id={c_Email}
            placeholder="name@example.com"
            type="email"
            disabled={isPending || isSignUpCompleted}
            error={!!fieldErrors.email}
            autoComplete="email"
          />
          <ErrorMsgField msg={fieldErrors.email?.message} />
        </div>

        <div>
          <label htmlFor={c_Password} className="mb-2 block font-bold">
            パスワード
          </label>
          <TextInputField
            {...formMethods.register(c_Password)}
            id={c_Password}
            placeholder="*****"
            type="password"
            disabled={isPending || isSignUpCompleted}
            error={!!fieldErrors.password}
            autoComplete="off"
          />

          {/*  追加: パスワード強度インジケーター */}
          {passwordValue && (
            <div className="mt-2">
              <div className="flex gap-1 h-1.5">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      i < strength ? strengthColors[strength] : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-[10px] mt-1 font-bold ${strength > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
                強度: {strengthLabels[strength]}
              </p>
            </div> 
          )}

          <ErrorMsgField msg={fieldErrors.password?.message} />
          <ErrorMsgField msg={fieldErrors.root?.message} />
        </div>

        {/* 追加: 秘密の合言葉入力 */}
        <div>
          <label htmlFor={c_SecretPhrase} className="mb-2 block font-bold">
            秘密の合言葉 <span className="text-xs text-gray-500 font-normal">（アカウント削除時に必要です）</span>
          </label>
          <TextInputField
            {...formMethods.register(c_SecretPhrase)}
            id={c_SecretPhrase}
            placeholder="合言葉を入力"
            type="password" 
            disabled={isPending || isSignUpCompleted}
            error={!!fieldErrors.secretPhrase}
            autoComplete="off"
          />
          <ErrorMsgField msg={fieldErrors.secretPhrase?.message} />
          <ErrorMsgField msg={fieldErrors.root?.message} />
        </div>

        <Button
          variant="indigo"
          width="stretch"
          className="tracking-widest"
          disabled={
            !formMethods.formState.isValid ||
            formMethods.formState.isSubmitting ||
            isSignUpCompleted
          }
        >
          登録
        </Button>
      </form>

      {isSignUpCompleted && (
        <div>
          <div className="mt-4 flex items-center gap-x-2">
            <FontAwesomeIcon icon={faSpinner} spin />
            <div>サインアップが完了しました。ログインページに移動します。</div>
          </div>
          <NextLink
            href={`/login?${c_Email}=${formMethods.getValues(c_Email)}`}
            className="text-blue-500 hover:underline"
          >
            自動的に画面が切り替わらないときはこちらをクリックしてください。
          </NextLink>
        </div>
      )}
    </main>
  );
};

export default Page;
