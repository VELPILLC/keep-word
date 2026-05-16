"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

// useSearchParams() requires a Suspense boundary in Next.js App Router
function CallbackHandler() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      // No code — redirect home (handles token_hash / magic link flows too)
      router.replace("/");
      return;
    }

    supabase.auth
      .exchangeCodeForSession(code)
      .then(() => router.replace("/"))
      .catch(() => router.replace("/"));
  }, [params, router]);

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#1C1410",
      color: "#5C4E47",
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: "10px",
      letterSpacing: "0.14em",
    }}>
      signing in...
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div style={{
        height: "100dvh",
        background: "#1C1410",
      }} />
    }>
      <CallbackHandler />
    </Suspense>
  );
}
