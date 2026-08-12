import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "履约智控 · 异常控制塔",
  description: "跨境电商履约追踪、异常预警、工单协同与时效分析的一体化运营控制塔。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
