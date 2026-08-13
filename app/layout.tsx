import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "履约雷达 · 17TRACK履约监控",
  description: "以17TRACK主状态、子状态与完整物流轨迹为底座的跨境履约监控、预警和时效分析平台。",
  openGraph: {
    title: "履约雷达 · 17TRACK履约监控",
    description: "状态、预警、分析一体化的跨境履约监控平台。",
    images: ["https://fulfillment-control-tower.zengyun666.chatgpt.site/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "履约雷达 · 17TRACK履约监控",
    description: "状态、预警、分析一体化的跨境履约监控平台。",
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
