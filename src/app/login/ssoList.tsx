"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import classNames from "classnames";

const className = classNames({
  "flex px-7 py-2 justify-center items-center": true,
  "text-white font-medium text-sm uppercase": true,
});


export const SSOList = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <section>
      <a
        className={className}
        style={{ backgroundColor: "#000000" }}
        onClick={() => signIn("google", { callbackUrl })}
        role="button"
      >
        <img
          className="pr-2"
          src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
          alt=""
          style={{ height: "2rem" }}
        />
        Continue with Google
      </a>
    </section>
  );
};
