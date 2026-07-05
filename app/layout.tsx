import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "New Con-tech | 건설 전자적 대금지급시스템",
  description:
    "체불 없는 건설 현장을 위한 대금지급·출역관리 플랫폼 (노무비닷컴 스타일 데모)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
