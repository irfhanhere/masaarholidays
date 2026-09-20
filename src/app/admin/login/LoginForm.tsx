"use client";

import { useActionState, useState } from "react";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next ?? "/admin"} />

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-semibold text-masaar-black">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="Enter your email address"
          className="w-full rounded-md border border-black/15 px-4 py-2.5 text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-semibold text-masaar-black">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="Enter your password"
            className="w-full rounded-md border border-black/15 px-4 py-2.5 pr-10 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-masaar-black/50"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
      </div>

      {state.status === "error" && (
        <p className="text-sm text-red-600" role="alert">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-admin-primary px-5 py-3 text-sm font-semibold text-white hover:bg-admin-primary-dark disabled:opacity-60"
      >
        {isPending ? "Signing In…" : "Sign In →"}
      </button>

      <p className="text-center text-xs text-masaar-black/50">
        Forgot your password? Contact your site administrator for a reset.
      </p>
    </form>
  );
}
