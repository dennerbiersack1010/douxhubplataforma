"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      <video
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => router.replace("/login")}
        onError={() => router.replace("/login")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      >
        <source src="/intro/doux-intro.mp4" type="video/mp4" />
      </video>
    </main>
  );
}
