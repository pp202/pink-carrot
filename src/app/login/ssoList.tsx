"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import classNames from "classnames";

const className = classNames({
  "w-full flex px-7 py-3 justify-center items-center gap-3": true,
  "rounded-xl border border-zinc-500/40 bg-zinc-700 text-zinc-100": true,
  "font-medium text-sm transition-colors duration-200": true,
  "hover:bg-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200":
    true,
});

export const SSOList = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <section aria-label="Single sign-on providers">
      <button
        type="button"
        className={className}
        onClick={() => signIn("google", { callbackUrl })}
      >
        <img
          className="h-6 w-6"
          src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
          alt="Google logo"
        />
        Continue with Google
      </button>
    </section>
  );
};
