"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <svg
          className="h-8 w-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Coś poszło nie tak</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error.message || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."}
        </p>
      </div>
      <button
        onClick={unstable_retry}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}
