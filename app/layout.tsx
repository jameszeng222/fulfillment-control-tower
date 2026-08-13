import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "履约雷达 · 17TRACK履约监控",
  description: "聚焦监控中心、订单追踪、履约分析和规则配置的17TRACK跨境履约平台。",
  openGraph: {
    title: "履约雷达 · 17TRACK履约监控",
    description: "监控、追踪、分析、规则四个核心模块的跨境履约平台。",
    images: ["https://fulfillment-control-tower.zengyun666.chatgpt.site/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "履约雷达 · 17TRACK履约监控",
    description: "监控、追踪、分析、规则四个核心模块的跨境履约平台。",
    images: ["https://fulfillment-control-tower.zengyun666.chatgpt.site/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
