import type { Metadata } from "next";
import "./globals.css";
import "./analysis.css";

export const metadata: Metadata = {
  title: "履约雷达 · 物流轨迹预警监控",
  description: "基于ERP履约数据与17TRACK轨迹的轻量物流预警、追踪和时效分析平台。",
  openGraph: {
    title: "履约雷达 · 物流轨迹预警监控",
    description: "聚焦真正需要跟进的异常包裹，统一查看17TRACK状态与履约时效。",
    images: ["https://fulfillment-control-tower.zengyun666.chatgpt.site/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "履约雷达 · 物流轨迹预警监控",
    description: "聚焦真正需要跟进的异常包裹，统一查看17TRACK状态与履约时效。",
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
