"use client";

import React, { useState } from "react";
import { useForm , SubmitHandler} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DeleteAccountRequest, deleteAccountRequestSchema } from "@/app/_types/DeleteRequest";
// ... (TextInputField, Button, ErrorMsgField などのインポート)

export default function AccountDeletePage() {
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const formMethods = useForm<DeleteAccountRequest>({
    mode: "onChange", // 入力するたびにバリデーションを走らせる
    resolver: zodResolver(deleteAccountRequestSchema),
    defaultValues: { isConfirmed: false } // チェックボックスの初期値
  });
  const { register, handleSubmit, formState: { errors, isValid } } = formMethods;

  // ▼ 変更：SubmitHandler<DeleteAccountRequest> の型を明記する
  const onSubmit: SubmitHandler<DeleteAccountRequest> = async (data) => {
    setIsPending(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json();
      if (!body.success) {
        setErrorMsg(body.message);
        setIsPending(false);
        return;
      }

      // 成功時の処理（ログアウト＆リダイレクトなど）
      alert("アカウントを削除しました。");
      window.location.href = "/";
      
    } catch (e) {
      setErrorMsg("予期せぬエラーが発生しました。");
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border border-red-200 bg-red-50 rounded-lg">
      <h1 className="text-xl font-bold text-red-600 mb-4">アカウントの完全削除（退会）</h1>
      <p className="text-sm mb-6 text-gray-700">
        一度アカウントを削除すると、すべてのデータが失われ、元に戻すことはできません。
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* メールアドレス */}
        <div>
          <label className="block text-sm font-bold mb-1">メールアドレス</label>
          <input {...register("email")} type="email" className="w-full border p-2" />
        </div>

        {/* パスワード */}
        <div>
          <label className="block text-sm font-bold mb-1">パスワード</label>
          <input {...register("password")} type="password" className="w-full border p-2" />
        </div>

        {/* 秘密の合言葉 */}
        <div>
          <label className="block text-sm font-bold mb-1">秘密の合言葉</label>
          <input {...register("secretPhrase")} type="password" className="w-full border p-2" />
        </div>

        {/* フールプルーフ 1: タイピング確認 */}
        <div className="mt-4 p-4 bg-white border border-red-300 rounded">
          <label className="block text-sm font-bold mb-1 text-red-600">
            確認のため、「アカウントを削除します」と入力してください。
          </label>
          <input {...register("confirmText")} type="text" className="w-full border p-2" placeholder="アカウントを削除します" />
          {errors.confirmText && <p className="text-red-500 text-xs mt-1">{errors.confirmText.message}</p>}
        </div>

        {/* フールプルーフ 2: チェックボックス */}
        <div className="flex items-center gap-2 mt-2">
          <input {...register("isConfirmed")} type="checkbox" id="confirmCheck" className="w-5 h-5" />
          <label htmlFor="confirmCheck" className="text-sm font-bold text-red-600">
            本当に削除してよいか確認しました。
          </label>
        </div>

        {errorMsg && <p className="text-red-500 font-bold">{errorMsg}</p>}

        {/* フールプルーフ 3: 条件を満たすまでボタンを押せない */}
        <button
          type="submit"
          disabled={!isValid || isPending}
          className={`mt-4 p-3 rounded text-white font-bold tracking-widest transition-all ${
            !isValid || isPending ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isPending ? "削除中..." : "アカウントを完全に削除する"}
        </button>
      </form>
    </div>
  );
}