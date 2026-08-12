import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "履约雷达 · 监控预警分析",
  description: "聚焦跨境电商履约监控、规则预警、轨迹诊断与多维时效分析。",
  openGraph: {
    title: "履约雷达 · 监控预警分析",
    description: "跨境电商履约监控、规则预警、轨迹诊断与多维时效分析平台。",
    images: ["https://fulfillment-control-tower.zengyun666.chatgpt.site/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "履约雷达 · 监控预警分析",
    description: "跨境电商履约监控、规则预警、轨迹诊断与多维时效分析平台。",
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
