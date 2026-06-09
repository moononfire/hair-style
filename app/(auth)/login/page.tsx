"use client";

import { useActionState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type State = { error?: string } | undefined;

async function loginAction(_prev: State, formData: FormData): Promise<State> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (result?.error) {
    return { error: "Nieprawidłowy email lub hasło." };
  }

  return undefined;
}

export default function LoginPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (prev: State, formData: FormData) => {
      const result = await loginAction(prev, formData);
      if (!result?.error) {
        router.push("/calendar");
      }
      return result;
    },
    undefined
  );

  return (
    <div className="w-full max-w-sm space-y-6 px-4">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">HairBook</h1>
        <p className="text-sm text-muted-foreground">Zaloguj się do systemu</p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="pracownik@salon.pl"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Hasło
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Logowanie..." : "Zaloguj się"}
        </button>
      </form>
    </div>
  );
}
