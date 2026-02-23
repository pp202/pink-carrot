"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import classNames from 'classnames'

const className = classNames({
  'px-7 py-2 justify-center items-center': true,
  'text-white font-medium text-sm uppercase': true,
  'flex': true
})


export const SSOList = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <section>
      <a
        className={className}
        style={{ backgroundColor: "#000000"}}
        onClick={() => signIn("google", { callbackUrl })}
        role="button"
      >
        <img
          className="pr-2"
          src="/images/google.svg"
          alt=""
          style={{ height: "2rem" }}
        />
        Continue with Google
      </a>
    </section>
  );
};