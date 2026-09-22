"use client";

import {
  Activity,
  Archive,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Database,
  Download,
  FileSpreadsheet,
  Gauge,
  History,
  Layers3,
  MapPin,
  PackageCheck,
  PackageSearch,
  Radar,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  Upload,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

type View = "overview" | "monitor" | "analysis" | "settings";
type MainStatus =
  | "NotFound"
  | "InfoReceived"
  | "InTransit"
  | "Expired"
  | "AvailableForPickup"
  | "OutForDelivery"
  | "DeliveryFailure"
  | "Delivered"
  | "Exception";
type AlertKey =
  | "all"
  | "transport_timeout"
  | "stagnation"
  | "customs_hold"
  | "no_update"
  | "not_online"
  | "delivery_failure"
  | "returning"
  | "carrier_exception"
  | "signout_timeout"
  | "fulfillment_error"
  | "stock_shortage"
  | "split_order_exception";
type AlertFilterKey = AlertKey;
type Severity = "critical" | "high" | "medium";
type MonitorState = "active" | "recovered" | "normal" | "archived";
type SyncStatus = "success" | "failure" | "stopped";
type TeamKey = "all" | "LM" | "FD" | "LM_TT" | "INFLUENCER";
type WarehouseKey = "all" | "winit" | "domestic";
type DateRangeKey = "3d" | "yesterday" | "7d" | "30d" | "90d" | "custom";
type LifecycleFilter = "all" | MonitorState;

type BusinessRule = {
  key: Exclude<AlertKey, "all">;
  scope: string;
  trigger: string;
  trackStatus: string;
  exclusions: string;
  recovery: string;
  priority: "紧急" | "高" | "中";
  keywordMode?: "辅助匹配" | "必须命中" | "不使用";
  keywords?: string;
  ignoredKeywords?: string;
  enabled: boolean;
};

type ErpPreTrackAlert = {
  id: string;
  kind: "signout_timeout" | "fulfillment_error" | "stock_shortage" | "split_order_exception";
  reasonTag?: string;
  stage?: string;
  orderNo: string;
  fulfillmentNo?: string;
  team: Exclude<TeamKey, "all">;
  warehouse: string;
  createdAt: string;
  age: string;
  errorCode: string;
  reason: string;
  severity: Severity;
};

type TrackEvent = {
  time: string;
  title: string;
  detail: string;
  location?: string;
  source: "OMS" | "ERP" | "WMS" | "17TRACK";
  state: "normal" | "warning" | "success";
};

type AlertHistory = {
  alert: Exclude<AlertKey, "all">;
  triggeredAt: string;
  recoveredAt: string;
  duration: string;
  reason: string;
};

type Order = {
  fulfillmentNo: string;
  orderNo: string;
  trackingNo: string;
  team: Exclude<TeamKey, "all">;
  platform: string;
  warehouse: string;
  country: string;
  carrier: string;
  channel: string;
  status: MainStatus;
  subStatus: string;
  alert?: Exclude<AlertKey, "all">;
  secondaryAlerts?: Exclude<AlertKey, "all">[];
  alertHistory?: AlertHistory[];
  severity?: Severity;
  monitorState: MonitorState;
  syncStatus: SyncStatus;
  syncAt: string;
  evidence?: string;
  tags?: string[];
  paymentAt?: string;
  fulfillmentCreatedAt?: string;
  deliveredAt?: string;
  cEndCarrier?: string;
  shippedAt: string;
  elapsed: string;
  abnormalAge: string;
  latestTrack: string;
  latestAt: string;
  sla: string;
  dataIssue?: string;
  events: TrackEvent[];
};

const STATUS_META: Record<MainStatus, { label: string; tone: string; count: number }> = {
  NotFound: { label: "查询不到", tone: "gray", count: 7 },
  InfoReceived: { label: "收到信息", tone: "cyan", count: 18 },
  InTransit: { label: "运输途中", tone: "blue", count: 2079 },
  Expired: { label: "运输过久", tone: "amber", count: 9 },
  AvailableForPickup: { label: "等待自提", tone: "purple", count: 15 },
  OutForDelivery: { label: "派送途中", tone: "green", count: 42 },
  DeliveryFailure: { label: "派送失败", tone: "red", count: 23 },
  Delivered: { label: "已签收", tone: "emerald", count: 2480 },
  Exception: { label: "物流异常", tone: "orange", count: 31 },
};

const ALERT_META: Record<Exclude<AlertKey, "all">, { label: string; count: number; hint: string }> = {
  transport_timeout: { label: "运输超时", count: 28, hint: "当前与历史 · 超SLA或官方运输过久" },
  stagnation: { label: "物流停滞", count: 27, hint: "有轨迹 · 同地点未移动" },
  customs_hold: { label: "海关卡关", count: 9, hint: "超时停留 / 清关补资料" },
  no_update: { label: "物流断更", count: 18, hint: "完全无新有效轨迹" },
  not_online: { label: "物流未上网", count: 12, hint: "签出 >2自然日" },
  delivery_failure: { label: "派送异常", count: 14, hint: "失败 / 自提 / 拒收" },
  returning: { label: "包裹退运", count: 8, hint: "Exception_Returning" },
  carrier_exception: { label: "其他异常", count: 3, hint: "丢失 / 破损 / 销毁等兜底" },
  signout_timeout: { label: "超时未签出", count: 6, hint: "履约单生成 >24小时" },
  fulfillment_error: { label: "履约单报错", count: 3, hint: "ERP建单 / 取号失败" },
  stock_shortage: { label: "商品缺货", count: 5, hint: "ERP库存不足 / 分配失败" },
  split_order_exception: { label: "拆单异常", count: 3, hint: "订单分配物流渠道失败" },
};

const ORDER_WAREHOUSE_ALERT_KEYS: Exclude<AlertKey, "all">[] = [
  "fulfillment_error",
  "stock_shortage",
  "split_order_exception",
  "signout_timeout",
];

const LOGISTICS_ALERT_KEYS: Exclude<AlertKey, "all">[] = [
  "not_online",
  "transport_timeout",
  "no_update",
  "stagnation",
  "customs_hold",
  "delivery_failure",
  "returning",
  "carrier_exception",
];

const ALERT_GROUPS: { key: "order_warehouse" | "logistics"; label: string; hint: string; alerts: Exclude<AlertKey, "all">[] }[] = [
  { key: "order_warehouse", label: "订单 + 仓库异常", hint: "ERP建单、库存、渠道分配与仓库签出", alerts: ORDER_WAREHOUSE_ALERT_KEYS },
  { key: "logistics", label: "物流异常", hint: "从上网、运输、清关到末端派送", alerts: LOGISTICS_ALERT_KEYS },
];

const BUSINESS_ALERT_RULE_OPTIONS: Exclude<AlertKey, "all">[] = [
  "fulfillment_error",
  "stock_shortage",
  "split_order_exception",
  "signout_timeout",
  "not_online",
  "transport_timeout",
  "no_update",
  "stagnation",
  "customs_hold",
  "delivery_failure",
  "returning",
  "carrier_exception",
];

const ALERT_FOCUS_STATUS: Record<AlertFilterKey, MainStatus> = {
  all: "InTransit",
  transport_timeout: "InTransit",
  stagnation: "InTransit",
  customs_hold: "InTransit",
  no_update: "InTransit",
  not_online: "InfoReceived",
  delivery_failure: "DeliveryFailure",
  returning: "Exception",
  carrier_exception: "Exception",
  signout_timeout: "InfoReceived",
  fulfillment_error: "NotFound",
  stock_shortage: "NotFound",
  split_order_exception: "NotFound",
};

const ALERT_PRIORITY: Exclude<AlertKey, "all">[] = [
  "fulfillment_error", "stock_shortage", "split_order_exception", "signout_timeout", "returning", "carrier_exception", "delivery_failure", "customs_hold", "no_update", "stagnation", "not_online", "transport_timeout",
];

const BUSINESS_RULES: BusinessRule[] = [
  { key: "not_online", scope: "全部团队 · 全部渠道", trigger: "签出后 >2个自然日仍无有效揽收轨迹", trackStatus: "InfoReceived / NotFound", exclusions: "签出时间缺失、同步失败", recovery: "出现 InTransit_PickedUp 后自动恢复", priority: "高", keywordMode: "辅助匹配", keywords: "Picked up, Accepted, Collected", ignoredKeywords: "Label created, Electronic data received", enabled: true },
  { key: "no_update", scope: "全部团队 · 运输中包裹", trigger: "最后一条有效轨迹后 >3个工作日完全无新有效轨迹", trackStatus: "InTransit", exclusions: "派送失败、等待自提、同步失败", recovery: "出现任一新的有效轨迹后自动恢复", priority: "高", keywordMode: "辅助匹配", keywords: "Departed, Arrived, Processed, In transit", ignoredKeywords: "Label created, Electronic data received", enabled: true },
  { key: "stagnation", scope: "LM / FD / LM_TT", trigger: "期间仍有轨迹更新，但连续扫描地点未变化 >3个工作日", trackStatus: "InTransit_Arrival / Other", exclusions: "海关节点、同步失败", recovery: "标准化地点或处理节点发生变化", priority: "中", keywordMode: "辅助匹配", keywords: "Arrived at facility, Processing center, Distribution center", ignoredKeywords: "Customs, Clearance", enabled: true },
  { key: "customs_hold", scope: "跨境渠道", trigger: "海关节点停留 >3个工作日，或17TRACK提示清关需要补充资料", trackStatus: "InTransit_CustomsProcessing / CustomsRequiringInformation", exclusions: "已放行、已离开海关节点", recovery: "资料补充完成、清关放行或离开海关节点", priority: "高", keywordMode: "辅助匹配", keywords: "Customs, Clearance, Held by customs, Additional information required", ignoredKeywords: "Released, Cleared", enabled: true },
  { key: "transport_timeout", scope: "按渠道 × 国家SLA", trigger: "实际或当前运输时长超过承诺时效 +2个工作日，或17TRACK主状态明确为Expired（运输过久）", trackStatus: "Expired（官方运输过久） / InTransit等状态（按渠道SLA计算）", exclusions: "渠道SLA缺失、订单取消、测试订单；Exception_Delayed不单独触发超时", recovery: "签收、退运或人工归档后退出当前待办；超时命中事实继续用于履约和渠道分析", priority: "高", enabled: true },
  { key: "delivery_failure", scope: "全部末端派送渠道", trigger: "派送失败、等待自提或收件人拒收", trackStatus: "DeliveryFailure / AvailableForPickup / Exception_Rejected", exclusions: "已签收", recovery: "重新派送、客户确认、自提、签收或人工解决", priority: "紧急", keywordMode: "辅助匹配", keywords: "Delivery attempted, Invalid address, No recipient, Rejected, Refused", ignoredKeywords: "Delivered", enabled: true },
  { key: "returning", scope: "全部团队 · 全部渠道", trigger: "17TRACK识别包裹退运", trackStatus: "Exception_Returning", exclusions: "无", recovery: "退运完成或人工关闭", priority: "紧急", keywordMode: "辅助匹配", keywords: "Return to sender, Returning", ignoredKeywords: "Return completed", enabled: true },
  { key: "carrier_exception", scope: "全部团队 · 全部渠道", trigger: "17TRACK异常无法归入运输、卡关、派送或退运等明确业务规则", trackStatus: "Exception_Lost / Damage / Destroyed / Security / Cancel / Other", exclusions: "延误、退运、拒收、派送失败及清关补资料等已明确分类", recovery: "出现恢复运输、签收结果或人工确认关闭", priority: "紧急", keywordMode: "辅助匹配", keywords: "Lost, Damaged, Destroyed, Security, Cancelled, Other", ignoredKeywords: "Delayed, Rejected, Customs, Delivered, Returning", enabled: true },
  { key: "signout_timeout", scope: "全部团队 · 待签出履约单", trigger: "履约单生成后24小时仍未完成仓库签出", trackStatus: "ERP履约单状态 / 签出时间", exclusions: "已取消、人工冻结的履约单", recovery: "ERP回传签出时间后自动恢复", priority: "高", enabled: true },
  { key: "fulfillment_error", scope: "全部团队 · ERP建单任务", trigger: "ERP建单或物流取号返回错误", trackStatus: "ERP错误码 / 城市 / 地址 / 邮编 / 取号结果", exclusions: "已取消订单、测试订单", recovery: "ERP重试成功并生成履约单", priority: "紧急", keywordMode: "辅助匹配", keywords: "地址错误, 邮编错误, 城市错误, 取号失败", ignoredKeywords: "已取消, 测试订单", enabled: true },
  { key: "stock_shortage", scope: "全部团队 · 待分配库存订单", trigger: "ERP返回可用库存不足、库存分配失败或订单缺货", trackStatus: "ERP库存状态 / 可用库存 / 分配结果 / 缺货SKU", exclusions: "已取消订单、测试订单、预售订单", recovery: "补货、换仓或拆单后库存分配成功；取消或退款后关闭", priority: "紧急", keywordMode: "辅助匹配", keywords: "库存不足, 分配失败, 订单缺货, Stock insufficient", ignoredKeywords: "预售, 已取消", enabled: true },
  { key: "split_order_exception", scope: "全部团队 · 待分配物流渠道订单", trigger: "订单分配物流渠道失败，ERP未能为订单匹配可用物流渠道", trackStatus: "ERP物流渠道分配状态 / 目标仓 / 目的国 / 渠道匹配结果", exclusions: "无需物流配送、已取消订单、测试订单", recovery: "重新分配物流渠道成功并取得物流单号；取消或退款后关闭", priority: "紧急", keywordMode: "辅助匹配", keywords: "物流渠道分配失败, 无可用渠道, 渠道匹配失败, Carrier route unavailable", ignoredKeywords: "无需物流配送, 已取消", enabled: true },
];

const ERP_PRETRACK_ALERTS: ErpPreTrackAlert[] = [
  { id: "PRE-260812-091", kind: "signout_timeout", orderNo: "SO-260812-091", fulfillmentNo: "P26081200091", team: "LM", warehouse: "USKY3-WINIT", createdAt: "2026-08-12 08:16", age: "27小时", errorCode: "WAIT_SIGN_OUT", reason: "履约单已生成，仓库尚未完成签出", severity: "high" },
  { id: "PRE-260811-407", kind: "signout_timeout", orderNo: "SO-260811-407", fulfillmentNo: "P26081100407", team: "FD", warehouse: "NF01", createdAt: "2026-08-11 13:42", age: "45小时", errorCode: "WAIT_SIGN_OUT", reason: "库存已分配，等待仓库扫描出库", severity: "critical" },
  { id: "ERR-260813-209", kind: "stock_shortage", reasonTag: "订单缺货", stage: "库存分配失败", orderNo: "SO-260813-209", team: "LM_TT", warehouse: "USKY3-WINIT", createdAt: "2026-08-13 10:24", age: "1小时21分", errorCode: "ERP_STOCK_INSUFFICIENT", reason: "订单缺货：2个SKU可用库存不足，ERP无法分配库存并生成履约单", severity: "critical" },
  { id: "ERR-260813-287", kind: "split_order_exception", reasonTag: "物流渠道未分配", stage: "物流渠道分配失败", orderNo: "SO-260813-287", fulfillmentNo: "P26081300287（待取号）", team: "FD", warehouse: "JY01", createdAt: "2026-08-13 09:48", age: "1小时57分", errorCode: "ERP_LOGISTICS_CHANNEL_ASSIGN_FAILED", reason: "订单未能匹配目的国和目标仓对应的可用物流渠道，无法继续获取物流单号", severity: "critical" },
  { id: "ERR-260813-118", kind: "fulfillment_error", orderNo: "SO-260813-118", team: "INFLUENCER", warehouse: "USKY3-WINIT", createdAt: "2026-08-13 09:06", age: "2小时39分", errorCode: "ERP_ADDRESS_ZIP_MISMATCH", reason: "城市与邮编不匹配，ERP无法生成履约单", severity: "critical" },
  { id: "ERR-260813-076", kind: "fulfillment_error", orderNo: "SO-260813-076", team: "LM", warehouse: "NF01", createdAt: "2026-08-13 07:51", age: "3小时54分", errorCode: "ERP_CARRIER_LABEL_FAILED", reason: "物流商取号失败，未能获取物流单号", severity: "critical" },
  { id: "ERR-260812-633", kind: "fulfillment_error", orderNo: "SO-260812-633", team: "FD", warehouse: "JY01", createdAt: "2026-08-12 19:28", age: "16小时17分", errorCode: "ERP_CITY_INVALID", reason: "收件城市无法识别，ERP建单校验未通过", severity: "high" },
];

const TEAM_META: Record<TeamKey, { label: string; description: string; monitored: number; alerts: number; todayNew: number; recovered: number }> = {
  all: { label: "全部团队", description: "跨团队总览", monitored: 4704, alerts: 136, todayNew: 33, recovered: 21 },
  LM: { label: "LM", description: "LM团队监控", monitored: 1978, alerts: 50, todayNew: 12, recovered: 8 },
  FD: { label: "FD", description: "FD团队监控", monitored: 1406, alerts: 41, todayNew: 10, recovered: 6 },
  LM_TT: { label: "LM_TT", description: "LM_TT团队监控", monitored: 820, alerts: 27, todayNew: 7, recovered: 4 },
  INFLUENCER: { label: "网红团队", description: "网红订单监控", monitored: 500, alerts: 18, todayNew: 4, recovered: 3 },
};

const WAREHOUSE_META: Record<WarehouseKey, { label: string; codes: string; monitored: number }> = {
  all: { label: "全部发货仓", codes: "全部仓库", monitored: 4704 },
  winit: { label: "万邑通仓", codes: "USKY3-WINIT", monitored: 3189 },
  domestic: { label: "国内仓", codes: "JY01 / NF01", monitored: 1515 },
};

function warehouseKeyOf(code: string): Exclude<WarehouseKey, "all"> {
  if (code === "USKY3-WINIT") return "winit";
  return "domestic";
}

const C_END_CARRIER_OPTIONS: Record<WarehouseKey, string[]> = {
  all: ["GOFO", "SpeedX", "USPS", "UPS", "Royal Mail", "DHL Paket", "3PE EXPRESS"],
  winit: ["GOFO", "SpeedX", "USPS", "UPS"],
  domestic: ["Royal Mail", "DHL Paket", "USPS", "3PE EXPRESS"],
};

const DATE_RANGE_META: { key: DateRangeKey; label: string; factor: number }[] = [
  { key: "3d", label: "最近3天", factor: 0.102 },
  { key: "yesterday", label: "昨天", factor: 0.032 },
  { key: "7d", label: "近7天", factor: 0.24 },
  { key: "30d", label: "近1个月", factor: 1 },
  { key: "90d", label: "近3个月", factor: 2.73 },
  { key: "custom", label: "自定义日期", factor: 1 },
];

const SUB_STATUS_GROUPS: Record<MainStatus, { code: string; label: string; count: number }[]> = {
  NotFound: [
    { code: "NotFound_Other", label: "运输商无信息", count: 6 },
    { code: "NotFound_InvalidCode", label: "运单号无效", count: 1 },
  ],
  InfoReceived: [{ code: "InfoReceived", label: "收到物流信息", count: 18 }],
  InTransit: [
    { code: "InTransit_PickedUp", label: "承运商已揽收", count: 374 },
    { code: "InTransit_Other", label: "其他运输中状态", count: 519 },
    { code: "InTransit_Departure", label: "已离开起运港", count: 249 },
    { code: "InTransit_Arrival", label: "已到达目的港", count: 374 },
    { code: "InTransit_CustomsProcessing", label: "海关处理中", count: 332 },
    { code: "InTransit_CustomsReleased", label: "清关已完成", count: 166 },
    { code: "InTransit_CustomsRequiringInformation", label: "清关需要补充资料", count: 65 },
  ],
  Expired: [{ code: "Expired_Other", label: "运输时间过久", count: 9 }],
  AvailableForPickup: [{ code: "AvailableForPickup_Other", label: "等待收件人自提", count: 15 }],
  OutForDelivery: [{ code: "OutForDelivery_Other", label: "正在末端派送", count: 42 }],
  DeliveryFailure: [
    { code: "DeliveryFailure_Other", label: "其他派送失败", count: 4 },
    { code: "DeliveryFailure_NoBody", label: "无人签收或无法联系", count: 7 },
    { code: "DeliveryFailure_Security", label: "安全、清关或费用原因", count: 2 },
    { code: "DeliveryFailure_Rejected", label: "收件人拒收", count: 3 },
    { code: "DeliveryFailure_InvalidAddress", label: "收件地址错误", count: 7 },
  ],
  Delivered: [{ code: "Delivered_Other", label: "已成功签收", count: 2480 }],
  Exception: [
    { code: "Exception_Other", label: "其他物流异常", count: 4 },
    { code: "Exception_Returning", label: "包裹退件中", count: 7 },
    { code: "Exception_Returned", label: "退件已签收", count: 2 },
    { code: "Exception_NoBody", label: "收件人信息异常", count: 2 },
    { code: "Exception_Security", label: "安全、清关或费用异常", count: 3 },
    { code: "Exception_Damage", label: "包裹损坏", count: 2 },
    { code: "Exception_Rejected", label: "收件人拒收", count: 2 },
    { code: "Exception_Delayed", label: "运输延误", count: 4 },
    { code: "Exception_Lost", label: "包裹丢失", count: 2 },
    { code: "Exception_Destroyed", label: "包裹已销毁", count: 1 },
    { code: "Exception_Cancel", label: "物流订单取消", count: 2 },
  ],
};

const SUB_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(SUB_STATUS_GROUPS).flat().map((item) => [item.code, item.label]),
);

const baseEvents: TrackEvent[] = [
  {
    time: "2026-08-03 15:42",
    title: "仓库签出",
    detail: "ERP签出时间，作为未上网和运输时效的唯一计算起点",
    location: "NF01",
    source: "ERP",
    state: "normal",
  },
  {
    time: "2026-08-03 18:16",
    title: "InTransit_PickedUp · 承运商揽收",
    detail: "首次真实上网；InfoReceived / Shipping Label Created 不计为上网",
    location: "Shenzhen, CN",
    source: "17TRACK",
    state: "success",
  },
  {
    time: "2026-08-07 03:40",
    title: "InTransit_Departure · 离开始发机场",
    detail: "Departed from origin airport",
    location: "Shenzhen, CN",
    source: "17TRACK",
    state: "normal",
  },
];

const ORDERS: Order[] = [
  {
    fulfillmentNo: "P26080300176",
    orderNo: "SO-260803-176",
    trackingNo: "YT260803881729",
    team: "LM",
    platform: "PC8",
    warehouse: "JY01",
    country: "GB",
    carrier: "YunExpress",
    channel: "云途英国专线",
    status: "InTransit",
    subStatus: "InTransit_CustomsRequiringInformation",
    alert: "customs_hold",
    secondaryAlerts: ["transport_timeout"],
    severity: "high",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:45",
    evidence: "17TRACK提示清关需要补充资料，直接归入海关卡关；同时保留超过渠道承诺时效的关联判断。",
    shippedAt: "2026-08-03 15:42",
    elapsed: "9天 20小时",
    abnormalAge: "待补资料 7小时",
    latestTrack: "Additional customs information required",
    latestAt: "08-09 23:11",
    sla: "7工作日",
    events: [
      ...baseEvents,
      {
        time: "2026-08-09 23:11",
        title: "InTransit_CustomsRequiringInformation · 清关需要补充资料",
        detail: "命中事件型卡关规则，无需等待满3个工作日；补齐资料或清关放行后恢复",
        location: "Heathrow, GB",
        source: "17TRACK",
        state: "warning",
      },
    ],
  },
  {
    fulfillmentNo: "P26080900311",
    orderNo: "SO-260809-311",
    trackingNo: "3PE260809412095",
    team: "FD",
    platform: "PC1",
    warehouse: "NF01",
    country: "US",
    carrier: "3PE EXPRESS",
    channel: "Luvme Express",
    status: "InfoReceived",
    subStatus: "InfoReceived",
    alert: "not_online",
    severity: "high",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:45",
    evidence: "ERP签出后4天仍无InTransit_PickedUp；Shipping Label Created不计为上网。",
    shippedAt: "2026-08-09 08:30",
    elapsed: "4天 3小时",
    abnormalAge: "等待 4天 3小时",
    latestTrack: "Shipping Label Created",
    latestAt: "08-09 10:02",
    sla: "8工作日",
    events: [
      {
        time: "2026-08-09 08:30",
        title: "仓库签出",
        detail: "ERP已签出，开始计算未上网时长",
        location: "NF01",
        source: "ERP",
        state: "normal",
      },
      {
        time: "2026-08-09 10:02",
        title: "InfoReceived · 仅收到电子信息",
        detail: "Shipping Label Created，不满足 InTransit_PickedUp，因此仍判定未上网",
        source: "17TRACK",
        state: "warning",
      },
    ],
  },
  {
    fulfillmentNo: "P260509004803",
    orderNo: "SO-260509-803",
    trackingNo: "9334920845500000037882",
    team: "FD",
    platform: "PC1",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "USPS",
    channel: "WYT-USPS GA",
    status: "AvailableForPickup",
    subStatus: "AvailableForPickup_Other",
    alert: "delivery_failure",
    severity: "high",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 10:13",
    evidence: "17TRACK主状态仍为AvailableForPickup；业务层归入派送异常，提示客服联系客户自提，同时排除物流断更。",
    shippedAt: "2026-08-01 23:30",
    elapsed: "11天 12小时",
    abnormalAge: "等待自提 4天 1小时",
    latestTrack: "AVAILABLE FOR PICKUP",
    latestAt: "08-09 10:13",
    sla: "7工作日",
    events: [
      ...baseEvents,
      {
        time: "2026-08-09 10:13",
        title: "AvailableForPickup · 等待自提",
        detail: "该状态不纳入物流断更统计，当前记录用于展示排除逻辑",
        location: "San Leandro, CA",
        source: "17TRACK",
        state: "warning",
      },
    ],
  },
  {
    fulfillmentNo: "P260509004405",
    orderNo: "SO-260509-405",
    trackingNo: "SPXEWR079601274715",
    team: "LM",
    platform: "PC1",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "SpeedX",
    channel: "WYT-WF5日达 Zonal",
    status: "DeliveryFailure",
    subStatus: "DeliveryFailure_InvalidAddress",
    alert: "delivery_failure",
    severity: "critical",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:45",
    evidence: "17TRACK主状态DeliveryFailure，子状态明确为InvalidAddress。",
    shippedAt: "2026-08-08 11:52",
    elapsed: "5天",
    abnormalAge: "失败 18小时",
    latestTrack: "Attempted Delivery: Invalid Address",
    latestAt: "08-12 17:49",
    sla: "6工作日",
    events: [
      ...baseEvents,
      {
        time: "2026-08-12 17:49",
        title: "DeliveryFailure_InvalidAddress · 地址错误",
        detail: "承运商派送失败，建议客服优先确认收件地址",
        location: "Newark, NJ",
        source: "17TRACK",
        state: "warning",
      },
    ],
  },
  {
    fulfillmentNo: "P26080500954",
    orderNo: "SO-260805-954",
    trackingNo: "GFUS01050155127361",
    team: "INFLUENCER",
    platform: "PC16",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "GOFO",
    channel: "WYT-WF7日达 Zonal",
    status: "Exception",
    subStatus: "Exception_Returning",
    alert: "returning",
    severity: "critical",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:45",
    evidence: "17TRACK子状态Exception_Returning，包裹正退回发件地。",
    shippedAt: "2026-08-02 09:44",
    elapsed: "11天 2小时",
    abnormalAge: "退运 1天 7小时",
    latestTrack: "Return initiated by carrier",
    latestAt: "08-12 04:38",
    sla: "7工作日",
    events: [
      ...baseEvents,
      {
        time: "2026-08-12 04:38",
        title: "Exception_Returning · 退回发件地",
        detail: "17TRACK已识别退运状态",
        location: "Melrose Park, IL",
        source: "17TRACK",
        state: "warning",
      },
    ],
  },
  {
    fulfillmentNo: "P26080100629",
    orderNo: "SO-260801-629",
    trackingNo: "42091701926129270054550001",
    team: "LM",
    platform: "PC1",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "USPS",
    channel: "USPS Ground Advantage",
    status: "InTransit",
    subStatus: "InTransit_Other",
    alert: "transport_timeout",
    severity: "high",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:45",
    evidence: "USPS Ground Advantage承诺7工作日，已超过2个工作日且轨迹仍正常更新。",
    shippedAt: "2026-07-31 16:20",
    elapsed: "12天 19小时",
    abnormalAge: "超时 3工作日",
    latestTrack: "Moving Through Network",
    latestAt: "08-13 06:18",
    sla: "7工作日 +2",
    events: [
      ...baseEvents,
      {
        time: "2026-08-13 06:18",
        title: "InTransit_Other · 网络运输中",
        detail: "轨迹仍在正常更新，但已超过渠道承诺时效2个工作日",
        location: "Dallas, TX",
        source: "17TRACK",
        state: "warning",
      },
    ],
  },
  {
    fulfillmentNo: "P26072200417",
    orderNo: "SO-260722-417",
    trackingNo: "42030301927489034710001234",
    team: "LM_TT",
    platform: "PC16",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "USPS",
    channel: "USPS Ground Advantage",
    status: "Delivered",
    subStatus: "Delivered_Other",
    monitorState: "archived",
    syncStatus: "success",
    syncAt: "08-13 09:22",
    evidence: "原物流断更已退款，之后原包裹恢复投递并显示Delivered；实际妥投超过渠道SLA，只计入渠道质量分析，不再占用当前预警。",
    tags: ["妥投超时", "二次异常", "已退款"],
    shippedAt: "2026-07-22 08:16",
    elapsed: "9天 6小时",
    abnormalAge: "投递恢复",
    latestTrack: "Delivered, Front Door/Porch",
    latestAt: "07-31 14:22",
    sla: "7工作日",
    alertHistory: [{ alert: "transport_timeout", triggeredAt: "2026-07-30 08:16", recoveredAt: "2026-07-31 14:22", duration: "超SLA 2天6小时", reason: "包裹已妥投，退出当前预警并计入渠道妥投超时率" }],
    events: [
      ...baseEvents,
      {
        time: "2026-07-27 12:20",
        title: "客服已处理 · 退款",
        detail: "原异常为物流断更，TOS解决方案已同步",
        source: "ERP",
        state: "warning",
      },
      {
        time: "2026-07-31 14:22",
        title: "Delivered_Other · 原包裹恢复投递",
        detail: "已处理后原包裹再次妥投，系统归类为二次异常",
        location: "Boston, MA",
        source: "17TRACK",
        state: "success",
      },
    ],
  },
  {
    fulfillmentNo: "P26081000682",
    orderNo: "SO-260810-682",
    trackingNo: "1Z84A77E0394802196",
    team: "FD",
    platform: "PC1",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "UPS",
    channel: "UPS Ground",
    status: "InTransit",
    subStatus: "InTransit_Arrival",
    monitorState: "normal",
    syncStatus: "success",
    syncAt: "08-13 11:41",
    evidence: "轨迹更新正常，运输4天，未命中任何业务预警。",
    shippedAt: "2026-08-09 10:20",
    elapsed: "4天 1小时",
    abnormalAge: "—",
    latestTrack: "Arrived at destination facility",
    latestAt: "08-13 10:48",
    sla: "7工作日",
    events: [...baseEvents, { time: "2026-08-13 10:48", title: "InTransit_Arrival · 到达目的地区域", detail: "17TRACK轨迹持续正常更新", location: "Louisville, KY", source: "17TRACK", state: "normal" }],
  },
  {
    fulfillmentNo: "P26080100208",
    orderNo: "SO-260801-208",
    trackingNo: "9400111899562710042231",
    team: "LM_TT",
    platform: "PC16",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "USPS",
    channel: "USPS Ground Advantage",
    status: "Delivered",
    subStatus: "Delivered_Other",
    monitorState: "archived",
    syncStatus: "success",
    syncAt: "08-12 22:15",
    evidence: "包裹已正常签收，系统自动归档，无业务预警。",
    shippedAt: "2026-08-01 08:42",
    elapsed: "5天 8小时",
    abnormalAge: "已归档",
    latestTrack: "Delivered, In/At Mailbox",
    latestAt: "08-06 16:50",
    sla: "7工作日",
    events: [...baseEvents, { time: "2026-08-06 16:50", title: "Delivered_Other · 成功签收", detail: "正常妥投并自动归档", location: "Seattle, WA", source: "17TRACK", state: "success" }],
  },
  {
    fulfillmentNo: "P26081100119",
    orderNo: "SO-260811-119",
    trackingNo: "LT260811445800",
    team: "FD",
    platform: "PC8",
    warehouse: "JY01",
    country: "DE",
    carrier: "DHL eCommerce",
    channel: "云途德国专线",
    status: "InfoReceived",
    subStatus: "InfoReceived",
    monitorState: "normal",
    syncStatus: "failure",
    syncAt: "08-13 11:37",
    evidence: "保留上一次同步成功取得的InfoReceived状态；最近同步失败，暂停未上网、断更、停滞和卡关判断。",
    dataIssue: "运输商接口同步失败",
    shippedAt: "2026-08-11 09:10",
    elapsed: "—",
    abnormalAge: "待同步恢复",
    latestTrack: "Shipment information received",
    latestAt: "08-12 09:15",
    sla: "8工作日",
    events: [{ time: "2026-08-11 09:10", title: "仓库签出", detail: "ERP签出成功", location: "JY01", source: "ERP", state: "normal" }, { time: "2026-08-12 09:15", title: "InfoReceived · 收到电子信息", detail: "这是最近一次同步成功取得的状态；后续同步失败不会将其覆盖为NotFound", source: "17TRACK", state: "normal" }],
  },
  {
    fulfillmentNo: "P26080800731",
    orderNo: "SO-260808-731",
    trackingNo: "SFX260808731US",
    team: "LM",
    platform: "PC1",
    warehouse: "NF01",
    country: "US",
    carrier: "SpeedX",
    channel: "SpeedX Zonal",
    status: "InTransit",
    subStatus: "InTransit_PickedUp",
    monitorState: "recovered",
    syncStatus: "success",
    syncAt: "08-13 08:26",
    evidence: "曾在签出后超过2天未揽收；出现InTransit_PickedUp后于08-12 18:26自动恢复。",
    shippedAt: "2026-08-08 09:31",
    elapsed: "1天 17小时",
    abnormalAge: "已恢复 17小时",
    latestTrack: "Shipment picked up",
    latestAt: "08-12 18:26",
    sla: "6工作日",
    alertHistory: [{ alert: "not_online", triggeredAt: "2026-08-10 09:31", recoveredAt: "2026-08-12 18:26", duration: "2天8小时55分", reason: "识别到 InTransit_PickedUp，系统自动恢复" }],
    events: [{ time: "2026-08-08 09:31", title: "仓库签出", detail: "开始计算未上网时长", location: "NF01", source: "ERP", state: "normal" }, { time: "2026-08-12 18:26", title: "InTransit_PickedUp · 已揽收", detail: "真实上网，物流未上网预警自动恢复", location: "Queens, NY", source: "17TRACK", state: "success" }],
  },
  {
    fulfillmentNo: "P26080400518",
    orderNo: "SO-260804-518",
    trackingNo: "YT260804518GB",
    team: "FD",
    platform: "PC8",
    warehouse: "JY01",
    country: "GB",
    carrier: "YunExpress",
    channel: "云途英国专线",
    status: "InTransit",
    subStatus: "InTransit_Arrival",
    alert: "stagnation",
    severity: "high",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:45",
    evidence: "包裹在 Birmingham Distribution Centre 连续3个工作日未离开，同地点停留命中物流停滞规则。",
    shippedAt: "2026-08-04 14:20",
    elapsed: "9天 21小时",
    abnormalAge: "停滞 3天 6小时",
    latestTrack: "Arrived at destination sorting centre",
    latestAt: "08-10 05:36",
    sla: "7工作日",
    events: [...baseEvents, { time: "2026-08-10 05:36", title: "InTransit_Arrival · 到达处理中心", detail: "连续3个工作日没有离开同一处理节点", location: "Birmingham, GB", source: "17TRACK", state: "warning" }],
  },
  {
    fulfillmentNo: "P26080600244",
    orderNo: "SO-260806-244",
    trackingNo: "420100019260806244001",
    team: "LM_TT",
    platform: "PC16",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "USPS",
    channel: "USPS Ground Advantage",
    status: "InTransit",
    subStatus: "InTransit_Departure",
    alert: "no_update",
    severity: "high",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:45",
    evidence: "最近一条有效轨迹距今超过3个工作日，且没有派送失败或等待自提状态，命中物流断更规则。",
    shippedAt: "2026-08-06 10:15",
    elapsed: "7天 1小时",
    abnormalAge: "断更 4天 2小时",
    latestTrack: "Departed USPS Regional Facility",
    latestAt: "08-09 09:28",
    sla: "7工作日",
    events: [...baseEvents, { time: "2026-08-09 09:28", title: "InTransit_Departure · 离开区域中心", detail: "此后连续4个工作日没有新的有效物流轨迹", location: "Los Angeles, CA", source: "17TRACK", state: "warning" }],
  },
  {
    fulfillmentNo: "P26080200844",
    orderNo: "SO-260802-844",
    trackingNo: "SPXSEA26080284401",
    team: "LM",
    platform: "PC1",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "SpeedX",
    channel: "WYT-WF5日达 Zonal",
    status: "DeliveryFailure",
    subStatus: "DeliveryFailure_Rejected",
    alert: "delivery_failure",
    secondaryAlerts: ["transport_timeout"],
    severity: "critical",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:44",
    evidence: "17TRACK明确记录收件人拒收，业务层统一归入派送异常；客服需确认拒收原因和后续处理。",
    shippedAt: "2026-08-02 10:18",
    elapsed: "11天 1小时",
    abnormalAge: "拒收 1天 4小时",
    latestTrack: "Delivery rejected by recipient",
    latestAt: "08-12 07:36",
    sla: "5工作日 +2",
    events: [...baseEvents, { time: "2026-08-12 07:36", title: "DeliveryFailure_Rejected · 收件人拒收", detail: "拒收属于末端派送异常；运输超时作为关联预警保留", location: "Seattle, WA", source: "17TRACK", state: "warning" }],
  },
  {
    fulfillmentNo: "P26080500392",
    orderNo: "SO-260805-392",
    trackingNo: "420331019260805392001",
    team: "FD",
    platform: "PC1",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "USPS",
    channel: "USPS Ground Advantage",
    status: "InTransit",
    subStatus: "InTransit_Departure",
    alert: "no_update",
    secondaryAlerts: ["transport_timeout"],
    severity: "high",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:45",
    evidence: "包裹上网后已有真实运输轨迹，之后4个工作日没有新的有效轨迹，并同时超过渠道SLA。",
    shippedAt: "2026-08-05 08:22",
    elapsed: "8天 3小时",
    abnormalAge: "断更 4天 5小时",
    latestTrack: "Departed Shipping Partner Facility",
    latestAt: "08-09 06:31",
    sla: "5工作日 +2",
    alertHistory: [{ alert: "not_online", triggeredAt: "2026-08-07 08:22", recoveredAt: "2026-08-08 15:10", duration: "1天6小时48分", reason: "识别到承运商真实揽收，系统自动恢复" }],
    events: [...baseEvents, { time: "2026-08-08 15:10", title: "InTransit_PickedUp · 未上网预警恢复", detail: "历史未上网记录仅在履约单详情保留", location: "Los Angeles, CA", source: "17TRACK", state: "success" }, { time: "2026-08-09 06:31", title: "InTransit_Departure · 最后一条有效轨迹", detail: "此后没有新的有效轨迹，触发物流断更", location: "Los Angeles, CA", source: "17TRACK", state: "warning" }],
  },
  {
    fulfillmentNo: "P26080400717",
    orderNo: "SO-260804-717",
    trackingNo: "YT260804717DE",
    team: "INFLUENCER",
    platform: "PC8",
    warehouse: "JY01",
    country: "DE",
    carrier: "YunExpress",
    channel: "云途德国专线",
    status: "InTransit",
    subStatus: "InTransit_Arrival",
    alert: "stagnation",
    secondaryAlerts: ["transport_timeout"],
    severity: "high",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:42",
    evidence: "期间每天都有处理轨迹，但连续扫描地点均为 Frankfurt Hub；属于停滞而不是断更。",
    shippedAt: "2026-08-04 07:55",
    elapsed: "9天 4小时",
    abnormalAge: "停滞 4天 2小时",
    latestTrack: "Processed at Frankfurt distribution center",
    latestAt: "08-13 04:08",
    sla: "6工作日 +2",
    events: [...baseEvents, { time: "2026-08-11 04:03", title: "InTransit_Arrival · Frankfurt Hub", detail: "处理轨迹仍在更新，但地点未变化", location: "Frankfurt, DE", source: "17TRACK", state: "warning" }, { time: "2026-08-13 04:08", title: "InTransit_Other · Frankfurt Hub", detail: "再次产生有效轨迹，标准化地点仍相同", location: "Frankfurt, DE", source: "17TRACK", state: "warning" }],
  },
  {
    fulfillmentNo: "P26080300605",
    orderNo: "SO-260803-605",
    trackingNo: "GFUS260803605779",
    team: "INFLUENCER",
    platform: "PC16",
    warehouse: "NF01",
    country: "US",
    carrier: "GOFO",
    channel: "WYT-WF7日达 Zonal",
    status: "Exception",
    subStatus: "Exception_Returning",
    alert: "returning",
    secondaryAlerts: ["transport_timeout"],
    severity: "critical",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:40",
    evidence: "承运商已发起退运，同时包裹整体运输超时；主预警按优先级显示包裹退运。",
    shippedAt: "2026-08-03 12:26",
    elapsed: "10天",
    abnormalAge: "退运 13小时",
    latestTrack: "Returning to sender - address issue",
    latestAt: "08-12 22:18",
    sla: "7工作日 +2",
    events: [...baseEvents, { time: "2026-08-12 22:18", title: "Exception_Returning · 包裹退运", detail: "包裹退运为主预警，运输超时保留为关联预警", location: "Ontario, CA", source: "17TRACK", state: "warning" }],
  },
  {
    fulfillmentNo: "P26080700338",
    orderNo: "SO-260807-338",
    trackingNo: "YT260807338US",
    team: "LM",
    platform: "PC8",
    warehouse: "NF01",
    country: "US",
    carrier: "YunExpress",
    cEndCarrier: "USPS",
    channel: "云途美国专线",
    status: "Exception",
    subStatus: "Exception_Lost",
    alert: "carrier_exception",
    severity: "critical",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:46",
    evidence: "17TRACK子状态为Exception_Lost，未命中运输、退运、派送或卡关规则，归入其他异常兜底并按紧急优先级处理。",
    shippedAt: "2026-08-07 09:18",
    elapsed: "6天 2小时",
    abnormalAge: "丢失 9小时",
    latestTrack: "Package reported lost by carrier",
    latestAt: "08-13 02:41",
    sla: "7工作日",
    events: [...baseEvents, { time: "2026-08-13 02:41", title: "Exception_Lost · 承运商报告丢失", detail: "其他异常保留官方具体原因“丢失”，建议立即向承运商核查", location: "Los Angeles, CA", source: "17TRACK", state: "warning" }],
  },
  {
    fulfillmentNo: "P26080800426",
    orderNo: "SO-260808-426",
    trackingNo: "SPXNYC26080842602",
    team: "FD",
    platform: "PC1",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "SpeedX",
    channel: "WYT-WF5日达 Zonal",
    status: "Exception",
    subStatus: "Exception_Damage",
    alert: "carrier_exception",
    severity: "high",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:43",
    evidence: "17TRACK返回Exception_Damage，渠道已报告包裹在运输过程中破损。",
    shippedAt: "2026-08-08 11:36",
    elapsed: "5天",
    abnormalAge: "破损 14小时",
    latestTrack: "Shipment damaged in transit",
    latestAt: "08-12 21:27",
    sla: "5工作日",
    events: [...baseEvents, { time: "2026-08-12 21:27", title: "Exception_Damage · 运输破损", detail: "保留17TRACK官方破损原因，业务层归入其他异常兜底", location: "New York, NY", source: "17TRACK", state: "warning" }],
  },
  {
    fulfillmentNo: "P26080200153",
    orderNo: "SO-260802-153",
    trackingNo: "GFUS260802153884",
    team: "LM_TT",
    platform: "PC16",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "GOFO",
    channel: "WYT-WF7日达 Zonal",
    status: "Exception",
    subStatus: "Exception_Destroyed",
    alert: "carrier_exception",
    severity: "critical",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:39",
    evidence: "17TRACK子状态为Exception_Destroyed，属于不可逆异常，归入其他异常兜底并立即核查处置结果。",
    shippedAt: "2026-08-02 16:05",
    elapsed: "10天 19小时",
    abnormalAge: "销毁 1天 3小时",
    latestTrack: "Shipment destroyed by carrier",
    latestAt: "08-12 08:44",
    sla: "7工作日",
    events: [...baseEvents, { time: "2026-08-12 08:44", title: "Exception_Destroyed · 包裹已销毁", detail: "其他异常按紧急优先级展示，不与包裹退运重复", location: "Chicago, IL", source: "17TRACK", state: "warning" }],
  },
  {
    fulfillmentNo: "P26080600661",
    orderNo: "SO-260806-661",
    trackingNo: "42075001926080666101",
    team: "LM",
    platform: "PC1",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "USPS",
    channel: "USPS Ground Advantage",
    status: "Exception",
    subStatus: "Exception_Delayed",
    alert: "transport_timeout",
    severity: "high",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:45",
    evidence: "17TRACK的Exception_Delayed仅作为运输延误事实保留；该单因实际运输时长超过渠道SLA +2个工作日，才触发运输超时。",
    shippedAt: "2026-08-06 07:42",
    elapsed: "7天 4小时",
    abnormalAge: "延误 2天 1小时",
    latestTrack: "Delivery delayed due to carrier operations",
    latestAt: "08-11 10:06",
    sla: "5工作日 +2",
    events: [...baseEvents, { time: "2026-08-11 10:06", title: "Exception_Delayed · 渠道运输延误", detail: "延误状态本身不触发运输超时；本单另因超过渠道SLA +2个工作日命中超时规则", location: "Denver, CO", source: "17TRACK", state: "warning" }],
  },
];

const NAV: { id: View; label: string; desc: string; icon: LucideIcon }[] = [
  { id: "overview", label: "数据总览", desc: "整体履约结构", icon: Gauge },
  { id: "monitor", label: "轨迹监控", desc: "预警与运单追踪", icon: Radar },
  { id: "analysis", label: "渠道时效", desc: "渠道表现分析", icon: BarChart3 },
  { id: "settings", label: "数据与规则", desc: "导入和SLA", icon: Settings2 },
];

function StatusBadge({ status }: { status: MainStatus }) {
  const meta = STATUS_META[status];
  return <span className={`status-badge ${meta.tone}`}><i />{meta.label}</span>;
}

function TrackStatusPair({ status, subStatus }: { status: MainStatus; subStatus: string }) {
  const subLabel = SUB_STATUS_LABELS[subStatus];
  return (
    <div className="track-status-pair">
      <div><span>主状态</span><StatusBadge status={status} /></div>
      <div><span>子状态</span><strong>{subLabel ?? "未映射状态"}</strong></div>
    </div>
  );
}

function AlertBadge({ alert }: { alert: Exclude<AlertKey, "all"> }) {
  return <span className={`alert-badge alert-${alert}`}>{ALERT_META[alert].label}</span>;
}

function activeAlerts(order: Order) {
  if (order.monitorState !== "active") return [];
  return currentRuleAlerts(order)
    .sort((left, right) => ALERT_PRIORITY.indexOf(left) - ALERT_PRIORITY.indexOf(right));
}

function currentRuleAlerts(order: Order) {
  return [order.alert, ...(order.secondaryAlerts ?? [])]
    .filter((alert): alert is Exclude<AlertKey, "all"> => Boolean(alert))
    .filter((alert, index, list) => list.indexOf(alert) === index);
}

function ruleHitState(order: Order, rule: Exclude<AlertKey, "all">) {
  if (order.monitorState === "active" && currentRuleAlerts(order).includes(rule)) return "current" as const;
  if (currentRuleAlerts(order).includes(rule) || order.alertHistory?.some((item) => item.alert === rule)) return "history" as const;
  return null;
}

function formatDateTime(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function shiftDateTime(value: string, hours: number) {
  const date = new Date(value.replace(" ", "T"));
  date.setHours(date.getHours() + hours);
  return formatDateTime(date);
}

function getDeliveredAt(order: Order) {
  if (order.deliveredAt) return order.deliveredAt;
  const deliveredEvent = [...order.events].reverse().find((event) => event.source === "17TRACK" && /Delivered|签收|妥投/.test(event.title));
  return deliveredEvent?.time ?? "未签收";
}

function getOrderMilestones(order: Order) {
  const shippedAt = new Date(order.shippedAt.replace(" ", "T")).getTime();
  const isAfterOutbound = (event: TrackEvent) => new Date(event.time.replace(" ", "T")).getTime() >= shippedAt;
  const onlineEvent = order.events.find((event) => event.source === "17TRACK" && isAfterOutbound(event) && /InTransit_PickedUp|Picked.?up|已揽收|承运商揽收|Accepted|Collected/i.test(event.title));
  const deliveryEvent = order.events.find((event) => event.source === "17TRACK" && isAfterOutbound(event) && /OutForDelivery|派送途中|正在派送|派送中/i.test(event.title));

  return {
    payment: order.paymentAt ?? shiftDateTime(order.shippedAt, -36),
    created: order.fulfillmentCreatedAt ?? shiftDateTime(order.shippedAt, -18),
    outbound: order.shippedAt || "—",
    online: onlineEvent?.time ?? (order.subStatus === "InTransit_PickedUp" ? order.latestAt : "—"),
    delivery: deliveryEvent?.time ?? (order.status === "OutForDelivery" ? order.latestAt : "—"),
  };
}

function getCEndCarrier(order: Order) {
  if (order.cEndCarrier) return order.cEndCarrier;
  const channelMapping: Record<string, string> = {
    "云途英国专线": "Royal Mail",
    "云途德国专线": "DHL Paket",
    "Luvme Express": "USPS",
  };
  return channelMapping[order.channel] ?? order.carrier;
}

function getCurrentNode(order: Order) {
  const currentAlert = activeAlerts(order)[0];
  const alertNode: Partial<Record<Exclude<AlertKey, "all">, string>> = {
    fulfillment_error: "履约单创建失败",
    stock_shortage: "等待库存处理",
    split_order_exception: "等待物流渠道分配",
    signout_timeout: "等待仓库签出",
    not_online: "等待承运商揽收",
    customs_hold: "海关处理中",
    delivery_failure: "末端派送处理",
    returning: "包裹退运中",
    carrier_exception: "等待承运商反馈",
  };
  if (currentAlert && alertNode[currentAlert]) return alertNode[currentAlert];
  if (order.status === "Delivered") return "已签收";
  if (order.status === "OutForDelivery") return "末端派送中";
  if (order.status === "AvailableForPickup") return "等待收件人自提";
  if (order.status === "InfoReceived") return "等待承运商揽收";
  return STATUS_META[order.status].label;
}

function getFulfillmentTimeline(order: Order) {
  const milestones = getOrderMilestones(order);
  const normalizedEvents = order.events.map((event) => /仓库签出|出库完成/.test(event.title) ? { ...event, source: "WMS" as const } : event);
  const fullChain: TrackEvent[] = [
    { time: milestones.payment, title: "订单支付完成", detail: `订单 ${order.orderNo} 进入履约流程`, source: "OMS", state: "success" },
    { time: milestones.created, title: "履约单创建", detail: `履约单 ${order.fulfillmentNo} 创建并分配至 ${order.warehouse}`, source: "ERP", state: "success" },
    ...normalizedEvents,
  ];
  return fullChain.sort((left, right) => new Date(right.time.replace(" ", "T")).getTime() - new Date(left.time.replace(" ", "T")).getTime());
}

function MonitorBadge({ state }: { state: MonitorState }) {
  const meta: Record<MonitorState, string> = { active: "预警中", recovered: "已恢复", normal: "监控正常", archived: "已归档" };
  return <span className={`monitor-badge ${state}`}><i />{meta[state]}</span>;
}

function SyncBadge({ status }: { status: SyncStatus }) {
  const meta: Record<SyncStatus, string> = { success: "同步正常", failure: "同步失败", stopped: "停止跟踪" };
  return <span className={`sync-badge ${status}`}><i />{meta[status]}</span>;
}

function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="header-actions">{actions}</div>
    </div>
  );
}

function OrderTable({ rows, selectedRule, selected, onToggle, onToggleAll, onOpen }: { rows: Order[]; selectedRule: AlertKey; selected: string[]; onToggle: (trackingNo: string) => void; onToggleAll: () => void; onOpen: (order: Order) => void }) {
  const allSelected = rows.length > 0 && rows.every((order) => selected.includes(order.trackingNo));
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="select-cell"><input type="checkbox" aria-label="选择当前页全部运单" checked={allSelected} onChange={onToggleAll} /></th>
            <th>业务预警</th>
            <th>履约单 / 订单</th>
            <th>运单号</th>
            <th>关键时间</th>
            <th>17TRACK状态</th>
            <th>渠道 / 国家</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => { const alerts = activeAlerts(order); const selectedHit = selectedRule === "all" ? null : ruleHitState(order, selectedRule); const milestones = getOrderMilestones(order); return (
            <tr key={`${order.trackingNo}-${order.carrier}`} onClick={() => onOpen(order)}>
              <td className="select-cell" onClick={(event) => event.stopPropagation()}><input type="checkbox" aria-label={`选择运单 ${order.trackingNo}`} checked={selected.includes(order.trackingNo)} onChange={() => onToggle(order.trackingNo)} /></td>
              <td>{selectedRule !== "all" && selectedHit ? <><div className="alert-line"><AlertBadge alert={selectedRule} /><span className={`rule-hit-state ${selectedHit}`}>{selectedHit === "current" ? "当前命中" : "历史命中"}</span></div><small className="current-alert-label">{alerts[0] ? `当前分类：${ALERT_META[alerts[0]].label}` : `当前结果：${STATUS_META[order.status].label}`}</small>{order.severity && <small className={`risk ${order.severity}`}>{order.severity === "critical" ? "紧急" : order.severity === "high" ? "高" : "中"}</small>}</> : alerts.length ? <><div className="alert-line"><AlertBadge alert={alerts[0]} />{alerts.length > 1 ? <span className="more-alerts">+{alerts.length - 1}</span> : null}</div>{order.severity && <small className={`risk ${order.severity}`}>{order.severity === "critical" ? "紧急" : order.severity === "high" ? "高" : "中"}</small>}</> : <span className="no-alert"><CheckCircle2 size={12} />无实时预警</span>}{order.tags?.length ? <div className="business-tags">{order.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}</td>
              <td><div className="team-order-head"><strong>{order.fulfillmentNo}</strong><span>{TEAM_META[order.team].label}</span></div><small>{order.orderNo} · {order.platform}</small><span className="current-node">当前节点：{getCurrentNode(order)}</span></td>
              <td>
                <a href={`https://t.17track.net/zh-cn#nums=${order.trackingNo}`} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                  {order.trackingNo}<ArrowUpRight size={12} />
                </a>
                <small>{order.carrier}</small>
              </td>
              <td className="key-times"><dl>
                <div><dt>支付</dt><dd>{milestones.payment}</dd></div>
                <div><dt>创建</dt><dd>{milestones.created}</dd></div>
                <div><dt>出库</dt><dd>{milestones.outbound}</dd></div>
                <div><dt>上网</dt><dd>{milestones.online}</dd></div>
              </dl></td>
              <td><TrackStatusPair status={order.status} subStatus={order.subStatus} /></td>
              <td><strong>{order.channel}</strong><small>{order.country} · {order.warehouse}</small></td>
              <td><button className="icon-button" aria-label="查看物流详情"><ChevronRight size={17} /></button></td>
            </tr>
          ); })}
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty-state"><Search size={22} /><strong>没有匹配的运单</strong><span>试试调整关键词或筛选条件</span></div>}
    </div>
  );
}

function ErpAlertTable({ rows, notify }: { rows: ErpPreTrackAlert[]; notify: (text: string) => void }) {
  return (
    <div className="table-wrap">
      <table className="erp-alert-table">
        <thead><tr><th>业务预警</th><th>订单号 / 履约单号</th><th>团队 / 仓库</th><th>ERP处理阶段</th><th>创建时间</th><th>已等待</th><th>ERP错误或阻塞原因</th><th /></tr></thead>
        <tbody>{rows.map((item) => <tr key={item.id}>
          <td><AlertBadge alert={item.kind} />{item.reasonTag && <small>{item.reasonTag}</small>}<small className={`risk ${item.severity}`}>{item.severity === "critical" ? "紧急" : "高"}</small></td>
          <td><strong>{item.orderNo}</strong><small>{item.fulfillmentNo ?? "履约单未生成"}</small></td>
          <td><strong>{TEAM_META[item.team].label}</strong><small>{item.warehouse}</small></td>
          <td><span className="erp-stage">{item.stage ?? (item.kind === "signout_timeout" ? "等待仓库签出" : "ERP建单失败")}</span><code>{item.errorCode}</code></td>
          <td><strong>{item.createdAt}</strong><small>{item.kind === "signout_timeout" ? "履约单生成时间" : item.kind === "stock_shortage" ? "缺货发现时间" : item.kind === "split_order_exception" ? "渠道分配失败时间" : "ERP报错时间"}</small></td>
          <td><strong className="erp-age">{item.age}</strong><small>{item.kind === "signout_timeout" ? "超过24小时开始预警" : item.kind === "stock_shortage" ? "等待补货、换仓或拆单" : item.kind === "split_order_exception" ? "等待重新分配物流渠道" : "等待修复并重试"}</small></td>
          <td><strong>{item.reason}</strong><small>来源：ERP错误中心</small></td>
          <td><button className="erp-link" onClick={() => notify(`${item.orderNo}：已定位到ERP错误详情`)}>查看ERP<ArrowUpRight size={12} /></button></td>
        </tr>)}</tbody>
      </table>
      {rows.length === 0 && <div className="empty-state"><Search size={22} /><strong>没有匹配的ERP预警</strong><span>试试调整团队或搜索条件</span></div>}
    </div>
  );
}

function Overview({ toMonitor, toAnalysis }: { toMonitor: () => void; toAnalysis: () => void }) {
  const channels = [
    { name: "WYT-WF5日达 Zonal", count: 1420, share: 30.2, color: "#315fd6" },
    { name: "Luvme Express", count: 986, share: 21.0, color: "#6e86df" },
    { name: "SpeedX Zonal", count: 652, share: 13.9, color: "#27a17d" },
    { name: "云途专线", count: 448, share: 9.5, color: "#dda04c" },
    { name: "USPS GA", count: 374, share: 7.9, color: "#dc6c5c" },
    { name: "其他渠道", count: 824, share: 17.5, color: "#bdc5d2" },
  ];
  const statuses = Object.entries(STATUS_META) as [MainStatus, typeof STATUS_META[MainStatus]][];
  const daily = [188, 224, 207, 246, 281, 258, 310, 296, 338, 321, 356, 374, 348, 392];
  return (
    <>
      <PageHeader eyebrow="OPERATIONS OVERVIEW" title="数据总览" description="从履约准备、物流轨迹、渠道结构和17TRACK状态看当前物流履约盘面。" actions={<><button className="button secondary"><CalendarDays size={15} />近30天</button><button className="button primary" onClick={toMonitor}><Radar size={15} />查看136条预警</button></>} />
      <section className="overview-kpis">
        <article><div><span>有效监控运单</span><PackageSearch size={18} /></div><strong>4,704</strong><small><b>↑ 8.4%</b> 较上周期 · 36个渠道</small></article>
        <article><div><span>已签收</span><PackageCheck size={18} /></div><strong>2,480</strong><small>签收率 <b>52.7%</b> · 自动归档</small></article>
        <article><div><span>运输中</span><Truck size={18} /></div><strong>2,079</strong><small>占全部运单 <b>44.2%</b></small></article>
        <article className="warning"><div><span>活跃预警</span><AlertTriangle size={18} /></div><strong>136</strong><small>含其他异常3条 · ERP预警17条</small></article>
        <article><div><span>7天达成率</span><Gauge size={18} /></div><strong>93.7%</strong><small><b>↑ 1.8%</b> 较上周期</small></article>
      </section>
      <section className="overview-runline"><span className="live-dot" /><div><strong>轨迹监控运行正常</strong><small>ERP 11:43 · 17TRACK 11:45 · 每5分钟扫描</small></div><span>今日新增预警 <b>26</b></span><span>今日恢复 <b className="positive">21</b></span><span>同步失败 <b>23</b></span></section>
      <section className="layer-banner"><div><span className="layer-icon fact"><PackageSearch size={15} /></span><p><strong>物流事实层</strong><small>17TRACK主状态定阶段、子状态解释原因，代码原样保留</small></p><b>4,704单</b></div><ChevronRight size={15} /><div><span className="layer-icon rule"><Radar size={15} /></span><p><strong>业务判断层</strong><small>订单 + 仓库、物流两组预警由12条规则计算</small></p><b>136条活跃预警</b></div><ChevronRight size={15} /><div><span className="layer-icon health"><Activity size={15} /></span><p><strong>数据健康层</strong><small>同步失败保留上次成功状态，并暂停时间类判断</small></p><b>32条需关注</b></div></section>
      <section className="overview-main">
        <article className="panel channel-share"><div className="panel-title"><div><h2>物流渠道占比</h2><p>有效监控运单 · 按当前渠道统计</p></div><button onClick={toAnalysis}>渠道分析<ChevronRight size={13} /></button></div><div className="donut-area"><div className="donut"><div><strong>4,704</strong><span>有效运单</span></div></div><div className="share-list">{channels.map((item) => <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><b>{item.count.toLocaleString()}</b><em>{item.share}%</em></div>)}</div></div></article>
        <article className="panel volume-trend"><div className="panel-title"><div><h2>每日签出运单趋势</h2><p>最近14天 · ERP签出时间</p></div><span>日均 295单</span></div><div className="volume-bars">{daily.map((value, index) => <div key={index}><b>{index === daily.length - 1 ? value : ""}</b><i style={{ height: `${Math.round(value / 4.4)}%` }} /><small>{index % 2 === 0 ? `${index + 1}日` : ""}</small></div>)}</div><div className="trend-summary"><span><i />签出运单</span><strong>峰值 392单 · 近7日 +6.8%</strong></div></article>
      </section>
      <section className="overview-secondary">
        <article className="panel status-overview"><div className="panel-title"><div><h2>17TRACK状态分布</h2><p>物流事实 · 九个主状态总数等于有效运单数</p></div><button onClick={toMonitor}>查看运单<ChevronRight size={13} /></button></div><div className="status-stack">{statuses.map(([key, meta]) => <div key={key} style={{ width: `${Math.max(1.2, meta.count / 47.04)}%` }} className={meta.tone} title={`${meta.label} ${meta.count}`} />)}</div><div className="status-overview-list">{statuses.map(([key, meta]) => <button key={key} onClick={toMonitor}><i className={meta.tone} /><span>{meta.label}</span><strong>{meta.count.toLocaleString()}</strong><small>{key}</small></button>)}</div><div className="sync-health"><strong>数据同步健康度</strong><span><i className="success" />同步正常 4,672</span><span><i className="failure" />同步失败 23</span><span><i className="stopped" />停止跟踪 9</span></div></article>
        <article className="panel structure-card"><div className="panel-title"><div><h2>目的国家分布</h2><p>按有效监控运单</p></div></div>{[["美国 US",72.4,3406],["英国 GB",12.6,593],["加拿大 CA",5.8,273],["德国 DE",3.9,184],["其他",5.3,248]].map(([name, share, count]) => <div className="structure-row" key={String(name)}><div><strong>{name}</strong><small>{Number(count).toLocaleString()}单</small></div><i><b style={{ width: `${share}%` }} /></i><span>{share}%</span></div>)}</article>
        <article className="panel structure-card"><div className="panel-title"><div><h2>发货仓分布</h2><p>按业务仓库分组</p></div></div>{[["万邑通仓",67.8,3189],["国内仓",32.2,1515]].map(([name, share, count]) => <div className="structure-row warehouse-row" key={String(name)}><div><strong>{name}</strong><small>{Number(count).toLocaleString()}单</small></div><i><b style={{ width: `${share}%` }} /></i><span>{share}%</span></div>)}</article>
      </section>
    </>
  );
}

function Monitor({ onOpen, notify }: { onOpen: (order: Order) => void; notify: (text: string) => void }) {
  const [team, setTeam] = useState<TeamKey>("all");
  const [warehouse, setWarehouse] = useState<WarehouseKey>("all");
  const [cEndCarrier, setCEndCarrier] = useState("all");
  const [mode, setMode] = useState<"alerts" | "all">("alerts");
  const [monitorLayer, setMonitorLayer] = useState<"business" | "track">("business");
  const [activeAlert, setActiveAlert] = useState<AlertFilterKey>("all");
  const [ruleFilter, setRuleFilter] = useState<AlertKey>("all");
  const [status, setStatus] = useState<MainStatus | "all">("all");
  const [subStatus, setSubStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("全部国家");
  const [lifecycle, setLifecycle] = useState<LifecycleFilter>("all");
  const [platform, setPlatform] = useState("all");
  const [syncFilter, setSyncFilter] = useState<SyncStatus | "all">("all");
  const [nodeFilter, setNodeFilter] = useState("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeKey>("90d");
  const [customStart, setCustomStart] = useState("2026-08-01");
  const [customEnd, setCustomEnd] = useState("2026-08-13");
  const [selected, setSelected] = useState<string[]>([]);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const isPreTrackAlert = activeAlert !== "all" && ORDER_WAREHOUSE_ALERT_KEYS.includes(activeAlert);

  const dateWindow = useMemo(() => {
    const demoEnd = new Date("2026-08-13T23:59:59");
    if (dateRange === "custom") return { start: new Date(`${customStart}T00:00:00`), end: new Date(`${customEnd}T23:59:59`) };
    if (dateRange === "yesterday") return { start: new Date("2026-08-12T00:00:00"), end: new Date("2026-08-12T23:59:59") };
    const days = dateRange === "3d" ? 3 : dateRange === "7d" ? 7 : dateRange === "90d" ? 90 : 30;
    const start = new Date(demoEnd);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    return { start, end: demoEnd };
  }, [customEnd, customStart, dateRange]);

  const rows = useMemo(() => ORDERS.map((order) => archivedIds.includes(order.trackingNo) ? { ...order, monitorState: "archived" as MonitorState } : order).filter((order) => {
    const text = `${order.fulfillmentNo} ${order.orderNo} ${order.trackingNo}`.toLowerCase();
    const alerts = activeAlerts(order);
    const matchesAlert = activeAlert === "all" || alerts.includes(activeAlert);
    const hitState = ruleFilter === "all" ? null : ruleHitState(order, ruleFilter);
    const matchesRule = ruleFilter === "all" || (mode === "alerts" ? hitState === "current" : hitState !== null);
    return (team === "all" || order.team === team)
      && (warehouse === "all" || warehouseKeyOf(order.warehouse) === warehouse)
      && (cEndCarrier === "all" || getCEndCarrier(order) === cEndCarrier)
      && (mode === "all" ? matchesRule : order.monitorState === "active" && matchesAlert && matchesRule)
      && (status === "all" || order.status === status)
      && (subStatus === "all" || order.subStatus === subStatus)
      && (country === "全部国家" || order.country === country)
      && (lifecycle === "all" || order.monitorState === lifecycle)
      && (platform === "all" || order.platform === platform)
      && (syncFilter === "all" || order.syncStatus === syncFilter)
      && (nodeFilter === "all" || getCurrentNode(order) === nodeFilter)
      && (() => { const shipped = new Date(order.shippedAt.replace(" ", "T")); return shipped >= dateWindow.start && shipped <= dateWindow.end; })()
      && (!query || text.includes(query.toLowerCase()));
  }), [activeAlert, archivedIds, cEndCarrier, country, dateWindow, lifecycle, mode, nodeFilter, platform, query, ruleFilter, status, subStatus, syncFilter, team, warehouse]);

  const erpRows = useMemo(() => ERP_PRETRACK_ALERTS.filter((item) => (activeAlert === "all" || (isPreTrackAlert && item.kind === activeAlert))
    && (ruleFilter === "all" || item.kind === ruleFilter)
    && (team === "all" || item.team === team)
    && (warehouse === "all" || warehouseKeyOf(item.warehouse) === warehouse)
    && (!query || `${item.orderNo} ${item.fulfillmentNo ?? ""} ${item.errorCode} ${item.reason}`.toLowerCase().includes(query.toLowerCase()))), [activeAlert, isPreTrackAlert, query, ruleFilter, team, warehouse]);

  const teamStats = TEAM_META[team];
  const availableCEndCarriers = C_END_CARRIER_OPTIONS[warehouse];
  const customDays = Math.max(1, Math.round((dateWindow.end.getTime() - dateWindow.start.getTime()) / 86400000) + 1);
  const dateFactor = dateRange === "custom" ? Math.min(3, customDays / 30) : DATE_RANGE_META.find((item) => item.key === dateRange)?.factor ?? 1;
  const warehouseFactor = WAREHOUSE_META[warehouse].monitored / WAREHOUSE_META.all.monitored;
  const scale = (value: number) => Math.max(0, Math.round(value * dateFactor * warehouseFactor));
  const scopedStats = { monitored: scale(teamStats.monitored), alerts: scale(teamStats.alerts), todayNew: scale(teamStats.todayNew), recovered: scale(teamStats.recovered) };
  const statusCount = (total: number) => scale(team === "all" ? total : total * teamStats.monitored / TEAM_META.all.monitored);
  const alertCount = (total: number) => scale(team === "all" ? total : total * teamStats.alerts / TEAM_META.all.alerts);
  const filteredAlertCount = (total: number) => alertCount(total);
  const rangeLabel = dateRange === "custom" ? `${customStart} 至 ${customEnd}` : DATE_RANGE_META.find((item) => item.key === dateRange)?.label;
  const expandedStatus: MainStatus = status === "all" ? ALERT_FOCUS_STATUS[activeAlert] : status;
  const activeFilterMeta = activeAlert === "all" ? null : ALERT_META[activeAlert];
  const selectedRuleMeta = ruleFilter === "all" ? null : ALERT_META[ruleFilter];

  function selectAlert(nextAlert: AlertFilterKey) {
    setMonitorLayer("business");
    setActiveAlert(nextAlert);
    setRuleFilter("all");
    setStatus("all");
    setSubStatus("all");
    setSelected([]);
  }

  function selectRuleFilter(nextRule: AlertKey) {
    setMonitorLayer("business");
    setRuleFilter(nextRule);
    if (nextRule !== "all") setActiveAlert(nextRule);
    setStatus("all");
    setSubStatus("all");
    setSelected([]);
  }

  function toggleRow(trackingNo: string) {
    setSelected((current) => current.includes(trackingNo) ? current.filter((item) => item !== trackingNo) : [...current, trackingNo]);
  }

  function toggleAllRows() {
    const visibleIds = rows.map((order) => order.trackingNo);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
    setSelected((current) => allSelected ? current.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...current, ...visibleIds])));
  }

  function confirmArchive() {
    setArchivedIds((current) => Array.from(new Set([...current, ...selected])));
    const count = selected.length;
    setSelected([]);
    setShowArchiveConfirm(false);
    notify(`已归档${count}条业务监控记录，17TRACK状态与轨迹继续保留`);
  }

  return (
    <>
      <section className="monitor-scope" aria-label="监控范围筛选">
        <label className="scope-select"><span>签出日期</span><select value={dateRange} onChange={(event) => setDateRange(event.target.value as DateRangeKey)}>{DATE_RANGE_META.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
        <label className="scope-select"><span>团队</span><select value={team} onChange={(event) => { setTeam(event.target.value as TeamKey); setSelected([]); }}>{(Object.entries(TEAM_META) as [TeamKey, typeof TEAM_META[TeamKey]][]).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>
        <label className="scope-select warehouse-select"><span>发货仓</span><select value={warehouse} onChange={(event) => { setWarehouse(event.target.value as WarehouseKey); setCEndCarrier("all"); setSelected([]); }}>{(Object.entries(WAREHOUSE_META) as [WarehouseKey, typeof WAREHOUSE_META[WarehouseKey]][]).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>
        <button className={`scope-more-button ${showMoreFilters ? "active" : ""}`} onClick={() => setShowMoreFilters((value) => !value)} aria-expanded={showMoreFilters}><SlidersHorizontal size={18} />更多筛选</button>
        <button className="scope-query-button" onClick={() => notify(`已按${teamStats.label}、${WAREHOUSE_META[warehouse].label}、${rangeLabel}查询`)}><Search size={18} />查询</button>
        {dateRange === "custom" && <div className="scope-custom-date"><span>自定义签出日期</span><input type="date" value={customStart} max={customEnd} onChange={(event) => setCustomStart(event.target.value)} aria-label="开始日期" /><i>至</i><input type="date" value={customEnd} min={customStart} onChange={(event) => setCustomEnd(event.target.value)} aria-label="结束日期" /></div>}
        {showMoreFilters && <div className="scope-more-filters" aria-label="更多筛选条件">
          <label><span>销售平台</span><select value={platform} onChange={(event) => setPlatform(event.target.value)}><option value="all">全部平台</option><option>Shopify</option><option>Amazon</option><option>TikTok Shop</option></select></label>
          <label><span>当前履约节点</span><select value={nodeFilter} onChange={(event) => setNodeFilter(event.target.value)}><option value="all">全部节点</option><option>等待仓库签出</option><option>等待承运商揽收</option><option>海关处理中</option><option>末端派送处理</option><option>已签收</option></select></label>
          <label><span>数据同步</span><select value={syncFilter} onChange={(event) => setSyncFilter(event.target.value as SyncStatus | "all")}><option value="all">全部同步状态</option><option value="success">同步正常</option><option value="failure">同步失败</option><option value="stopped">停止跟踪</option></select></label>
          <label><span>监控生命周期</span><select value={lifecycle} onChange={(event) => setLifecycle(event.target.value as LifecycleFilter)}><option value="all">全部监控状态</option><option value="active">预警中</option><option value="recovered">已恢复</option><option value="normal">监控正常</option><option value="archived">已归档</option></select></label>
        </div>}
      </section>

      <section className="monitor-compact-bar" aria-label="监控视图切换">
        <div className="monitor-switch"><button className={mode === "alerts" ? "active" : ""} onClick={() => { setMode("alerts"); setLifecycle("all"); setSelected([]); }}><AlertTriangle size={16} />当前预警 <b>{scopedStats.alerts}</b></button><button className={mode === "all" ? "active" : ""} onClick={() => { setMode("all"); setActiveAlert("all"); if (ruleFilter === "fulfillment_error" || ruleFilter === "stock_shortage" || ruleFilter === "split_order_exception" || ruleFilter === "signout_timeout") setRuleFilter("all"); setSelected([]); }}><PackageSearch size={16} />全部运单 <b>{scopedStats.monitored.toLocaleString()}</b></button></div>
        <div className="monitor-view-tabs">
          <button className={monitorLayer === "business" ? "active" : ""} onClick={() => { setMonitorLayer("business"); setStatus("all"); setSubStatus("all"); }}><Radar size={16} />业务预警 <b>{scopedStats.alerts}</b></button>
          <button className={monitorLayer === "track" ? "active" : ""} onClick={() => { setMonitorLayer("track"); setActiveAlert("all"); setRuleFilter("all"); }}><PackageSearch size={16} />17TRACK状态 <b>{scopedStats.monitored.toLocaleString()}</b></button>
        </div>
      </section>

      {monitorLayer === "track" && <><section className="status-grid compact-status">
        {(Object.entries(STATUS_META) as [MainStatus, typeof STATUS_META[MainStatus]][]).map(([key, meta]) => <button key={key} className={`${status === key ? "active " : ""}${status === "all" && activeAlert !== "all" && expandedStatus === key ? "linked " : ""}${meta.tone}`} onClick={() => { const next = status === key ? "all" : key; setStatus(next); setSubStatus("all"); }}><span><i />{meta.label}</span><strong>{statusCount(meta.count).toLocaleString()}</strong><small>{key}</small></button>)}
      </section>

      <section className="substatus-filter" aria-label={`${STATUS_META[expandedStatus].label}子状态筛选`}>
        <div><span>子状态筛选 · 默认展开</span><strong>{STATUS_META[expandedStatus].label}</strong><small>{SUB_STATUS_GROUPS[expandedStatus].length}个相关子状态</small></div>
        <button className={subStatus === "all" ? "active" : ""} onClick={() => setSubStatus("all")}><strong>全部</strong><small>不限制子状态</small></button>
        {SUB_STATUS_GROUPS[expandedStatus].map((item) => <button key={item.code} className={subStatus === item.code ? "active" : ""} onClick={() => { setStatus(expandedStatus); setSubStatus(item.code); }}><span><strong>{item.label}</strong><b>{statusCount(item.count).toLocaleString()}</b></span><code>{item.code}</code></button>)}
      </section></>}

      {monitorLayer === "business" && isPreTrackAlert && <section className="pretrack-source-note"><span><Database size={17} /></span><div><strong>ERP履约准备预警</strong><p>发生在物流单号注册17TRACK之前；生成物流单号后自动进入轨迹监控。</p></div><b>数据源：ERP错误中心</b></section>}

      {monitorLayer === "business" && mode === "alerts" && <section className="alert-overview" aria-label="业务预警分类">
        <div className="alert-groups">
          {ALERT_GROUPS.map((group) => {
            const groupCount = group.alerts.reduce((total, alert) => total + ALERT_META[alert].count, 0);
            return <section className={`alert-group ${group.key}`} key={group.key} aria-label={group.label}>
              <header><div><span>{group.key === "order_warehouse" ? <Database size={17} /> : <Truck size={17} />}</span><p><strong>{group.label}</strong></p></div><b>{filteredAlertCount(groupCount)}</b></header>
              <div className="alert-cards">
                {group.alerts.map((alert) => <button key={alert} className={activeAlert === alert ? "active" : ""} onClick={() => selectAlert(alert)}>
                  <span className={`alert-icon ${alert}`}><AlertTriangle size={17} /></span><div><small>{ALERT_META[alert].label}</small><strong>{filteredAlertCount(ALERT_META[alert].count)}</strong></div>
                </button>)}
              </div>
            </section>;
          })}
        </div>
      </section>}

      {monitorLayer === "business" && mode === "all" && <section className="special-watch"><span><History size={17} /></span><div><strong>特殊关注标签</strong><p>二次异常 3单 · 已重发 17单 · 已退款 9单</p></div><small>处理结果与历史标签，不计入当前业务预警</small></section>}

      <section className="panel monitor-panel">
        <div className="panel-toolbar">
          <div className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索运单号、订单号、履约单号" /></div>
          {monitorLayer === "business" && <select value={ruleFilter} onChange={(event) => selectRuleFilter(event.target.value as AlertKey)} aria-label="业务预警">
            <option value="all">全部业务预警</option>
            {BUSINESS_ALERT_RULE_OPTIONS.map((rule) => <option key={rule} value={rule}>{ALERT_META[rule].label}</option>)}
          </select>}
          <select aria-label="物流渠道"><option>全部渠道</option><option>WYT-USPS GA</option><option>WYT-WF5日达 Zonal</option><option>云途英国专线</option></select>
          <select value={cEndCarrier} disabled={isPreTrackAlert} onChange={(event) => setCEndCarrier(event.target.value)} aria-label="C端物流渠道"><option value="all">{isPreTrackAlert ? "生成运单后筛选C端渠道" : "全部C端渠道"}</option>{availableCEndCarriers.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select value={country} onChange={(event) => setCountry(event.target.value)} aria-label="目的国家"><option>全部国家</option><option>US</option><option>GB</option></select>
          <span className="result-count">{teamStats.label} · {WAREHOUSE_META[warehouse].label} · {rangeLabel} · 显示 {isPreTrackAlert ? erpRows.length : rows.length} 条示例 · {mode === "alerts" ? `${selectedRuleMeta?.label ?? activeFilterMeta?.label ?? "全部预警"}共 ${selectedRuleMeta ? filteredAlertCount(selectedRuleMeta.count) : activeAlert === "all" ? scopedStats.alerts : filteredAlertCount(activeFilterMeta?.count ?? 0)} 条` : selectedRuleMeta ? `${selectedRuleMeta.label} · 当前与历史命中` : `有效运单共 ${scopedStats.monitored.toLocaleString()} 条`}</span>
        </div>
        {!isPreTrackAlert && selected.length > 0 && <div className="selection-bar"><div><strong>已选择 {selected.length} 条运单</strong><span>归档只结束业务预警监控，不删除17TRACK官方状态和历史轨迹。</span></div><button onClick={() => setSelected([])}>取消选择</button><button className="archive-action" onClick={() => setShowArchiveConfirm(true)}><Archive size={14} />手动归档</button></div>}
        {isPreTrackAlert ? <ErpAlertTable rows={erpRows} notify={notify} /> : <OrderTable rows={rows} selectedRule={ruleFilter} selected={selected} onToggle={toggleRow} onToggleAll={toggleAllRows} onOpen={onOpen} />}
        <div className="table-footer"><span>{isPreTrackAlert ? "ERP修复并重试成功后自动恢复 · 生成物流单号后进入17TRACK轨迹监控" : "业务预警可手动归档 · 17TRACK状态与完整轨迹始终保留在历史运单中"}</span><div><button className="active">1</button><button>2</button><button>3</button><button>下一页</button></div></div>
      </section>
      {showArchiveConfirm && <div className="modal-mask" role="button" tabIndex={0} aria-label="关闭归档确认" onClick={(event) => { if (event.target === event.currentTarget) setShowArchiveConfirm(false); }} onKeyDown={(event) => { if (event.key === "Escape") setShowArchiveConfirm(false); }}><section className="archive-confirm" role="dialog" aria-modal="true" aria-label="确认归档业务监控"><span className="archive-confirm-icon"><Archive size={22} /></span><h2>归档 {selected.length} 条业务监控记录？</h2><p>归档后运单会移出“当前预警”，但不会删除或改写17TRACK主状态、子状态及完整轨迹。你仍可在“全部运单 → 已归档”中查询。</p><div><button className="button secondary" onClick={() => setShowArchiveConfirm(false)}>取消</button><button className="button primary" onClick={confirmArchive}>确认归档</button></div></section></div>}
    </>
  );
}

function Analysis() {
  const [days, setDays] = useState(7);
  const [selectedChannel, setSelectedChannel] = useState("全部渠道");
  const [country, setCountry] = useState("全部国家");
  const channelData = [
    { channel: "WYT-WF5日达 Zonal", country: "US", orders: 1420, avg: 4.1, d3: 61.8, d5: 88.6, d7: 96.2, sla: 96.2, overtime: 3.8, noUpdate: 1.2, failure: 0.28, trend: 1.6 },
    { channel: "Luvme Express", country: "US", orders: 486, avg: 4.5, d3: 55.1, d5: 84.2, d7: 94.8, sla: 94.8, overtime: 5.2, noUpdate: 2.1, failure: 0.41, trend: 0.7 },
    { channel: "SpeedX Zonal", country: "US", orders: 352, avg: 4.8, d3: 49.7, d5: 80.4, d7: 93.4, sla: 93.4, overtime: 6.6, noUpdate: 2.8, failure: 0.85, trend: -0.3 },
    { channel: "云途英国专线", country: "GB", orders: 148, avg: 5.7, d3: 36.5, d5: 69.6, d7: 89.6, sla: 89.6, overtime: 10.4, noUpdate: 4.1, failure: 0.68, trend: -2.1 },
    { channel: "USPS Ground Advantage", country: "US", orders: 100, avg: 6.2, d3: 31.0, d5: 62.0, d7: 84.1, sla: 84.1, overtime: 15.9, noUpdate: 5.3, failure: 1.2, trend: -3.4 },
  ];
  const visibleChannels = channelData.filter((row) => country === "全部国家" || row.country === country);
  const focus = channelData.find((row) => row.channel === selectedChannel);
  const rate = focus
    ? `${(days <= 3 ? focus.d3 : days <= 5 ? focus.d5 : days <= 7 ? focus.d7 : Math.min(99, focus.d7 + (days - 7) * 1.15)).toFixed(1)}%`
    : ({ 3: "54.2%", 5: "81.7%", 7: "93.7%", 10: "97.9%" } as Record<number, string>)[days] ?? `${Math.min(98.6, 68 + days * 3.7).toFixed(1)}%`;
  const trend = [84, 87, 86, 89, 91, 90, 93, 92, 94, 93, 95, 96];
  return (
    <>
      <PageHeader eyebrow="CHANNEL PERFORMANCE" title="渠道时效分析" description="同口径横向比较不同渠道，快速定位慢、断更多或派送不稳定的渠道。" actions={<button className="button secondary"><Download size={15} />导出渠道分析</button>} />
      <section className="analysis-filter panel">
        <select value={selectedChannel} onChange={(event) => setSelectedChannel(event.target.value)}><option>全部渠道</option>{channelData.map((row) => <option key={row.channel}>{row.channel}</option>)}</select>
        <select value={country} onChange={(event) => setCountry(event.target.value)}><option>全部国家</option><option value="US">US · 美国</option><option value="GB">GB · 英国</option></select>
        <select><option>按签出日期</option><option>按创建日期</option><option>按妥投日期</option></select>
        <label><input type="number" min="1" max="30" value={days} onChange={(event) => setDays(Number(event.target.value) || 1)} /><span>天达成率</span></label>
        <button className="button primary">应用</button><small className="analysis-scope">当前口径：工作日 · 已妥投订单</small>
      </section>
      <section className="metric-grid">
        <article className="metric-card primary-metric"><div><span>{focus?.channel ?? "整体"} · {days}天达成率</span><Gauge size={18} /></div><strong>{rate}</strong><small><b>{focus && focus.trend < 0 ? "↓" : "↑"} {Math.abs(focus?.trend ?? 1.8)}%</b> 较上周期</small></article>
        <article className="metric-card"><div><span>平均妥投时效</span><Clock3 size={18} /></div><strong>{focus?.avg ?? 4.6}<em>天</em></strong><small>签出 → 17TRACK Delivered</small></article>
        <article className="metric-card"><div><span>已妥投超时率</span><Activity size={18} /></div><strong>{focus?.overtime ?? 6.3}%</strong><small>用于渠道质量分析，不进入当前预警</small></article>
        <article className="metric-card"><div><span>轨迹断更率 / 派送失败率</span><AlertTriangle size={18} /></div><strong>{focus?.noUpdate ?? 2.8}% <em>/ {focus?.failure ?? 0.49}%</em></strong><small>渠道运输与末端稳定性</small></article>
      </section>
      <section className="panel channel-matrix">
        <div className="panel-title"><div><h2>渠道表现对比</h2><p>点击任一渠道查看上方指标和下方趋势；样本量低于30不参与排名</p></div><span>{visibleChannels.length}个渠道</span></div>
        <div className="channel-table-wrap"><table className="channel-table"><thead><tr><th>物流渠道</th><th>国家</th><th>履约单量</th><th>平均妥投</th><th>3天达成</th><th>5天达成</th><th>7天达成</th><th>SLA达成</th><th>超时率</th><th>断更率</th><th>派送失败</th><th>环比</th></tr></thead><tbody>{visibleChannels.map((row) => <tr key={row.channel} className={selectedChannel === row.channel ? "selected" : ""} onClick={() => setSelectedChannel(row.channel)}><td><strong>{row.channel}</strong><small>点击下钻</small></td><td>{row.country}</td><td>{row.orders.toLocaleString()}</td><td><strong>{row.avg}天</strong></td><td>{row.d3}%</td><td>{row.d5}%</td><td>{row.d7}%</td><td><span className={`performance ${row.sla < 90 ? "bad" : row.sla < 94 ? "warn" : "good"}`}>{row.sla}%</span></td><td className={row.overtime > 10 ? "negative" : ""}>{row.overtime}%</td><td className={row.noUpdate > 4 ? "negative" : ""}>{row.noUpdate}%</td><td className={row.failure > 1 ? "negative" : ""}>{row.failure}%</td><td><span className={`delta ${row.trend < 0 ? "down" : "up"}`}>{row.trend > 0 ? "+" : ""}{row.trend}%</span></td></tr>)}</tbody></table></div>
        <div className="matrix-legend"><span><i className="good" />SLA达成 ≥94%</span><span><i className="warn" />90%–94%</span><span><i className="bad" />低于90%</span><button onClick={() => setSelectedChannel("全部渠道")}>清除渠道下钻</button></div>
      </section>
      <section className="analysis-layout">
        <article className="panel chart-panel"><div className="panel-title"><div><h2>{focus?.channel ?? "全部渠道"} · {days}天达成率趋势</h2><p>最近12周 · 按签出日期</p></div><span>目标 ≥ 92%</span></div><div className="trend-chart">{trend.map((value, index) => { const adjusted = Math.max(74, Math.min(99, value + (focus ? focus.sla - 93 : 0))); return <div key={index}><b>{adjusted.toFixed(0)}%</b><i style={{ height: `${(adjusted - 72) * 7}px` }} /><small>W{index + 21}</small></div>; })}</div></article>
        <article className="panel channel-panel"><div className="panel-title"><div><h2>渠道SLA达成排名</h2><p>按渠道 × 国家规则计算</p></div></div>{channelData.map((row) => <button className={`channel-rank ${selectedChannel === row.channel ? "active" : ""}`} key={row.channel} onClick={() => setSelectedChannel(row.channel)}><div><strong>{row.channel}</strong><small>{row.orders}单 · {row.avg}天</small></div><span><i style={{ width: `${row.sla}%` }} /></span><b className={row.sla < 90 ? "bad" : ""}>{row.sla}%</b></button>)}</article>
      </section>
      <section className="quality-row"><article className="panel"><div className="panel-title"><div><h2>超时分布</h2><p>{focus?.channel ?? "全部渠道"} · 已妥投订单</p></div></div><div className="segments"><span style={{ width: "42%" }}>1–2天 42%</span><span style={{ width: "27%" }}>3–4天 27%</span><span style={{ width: "18%" }}>5–6天 18%</span><span style={{ width: "13%" }}>≥7天 13%</span></div></article><article className="panel"><div className="panel-title"><div><h2>轨迹稳定性</h2><p>{focus?.channel ?? "全部渠道"} · 运输途中无有效轨迹间隔</p></div></div><div className="stability"><div><b>2.8%</b><span>2–3天无更新</span></div><div><b>1.1%</b><span>4–6天无更新</span></div><div><b>0.3%</b><span>7–10天无更新</span></div><div><b>0.08%</b><span>10天以上</span></div></div></article></section>
    </>
  );
}

function Settings({ onImport, notify }: { onImport: () => void; notify: (text: string) => void }) {
  const [tab, setTab] = useState<"business" | "data" | "sla" | "statuses">("business");
  return (
    <>
      <PageHeader eyebrow="DATA & RULES" title="数据与规则" description="业务预警读取ERP与17TRACK事实，独立判断且不覆盖来源系统状态。" actions={tab === "business" ? <button className="button primary" onClick={() => notify("12条底层判断规则已发布，并按订单 + 仓库、物流两组展示")}><Check size={15} />保存并发布</button> : tab === "data" ? <button className="button primary" onClick={onImport}><Upload size={15} />重新导入</button> : tab === "sla" ? <button className="button primary" onClick={() => notify("SLA规则已保存")}><Check size={15} />保存规则</button> : <a className="button secondary" href="https://api.17track.net/zh-cn/doc?version=v2.4" target="_blank" rel="noreferrer">官方文档<ArrowUpRight size={13} /></a>} />
      <div className="settings-tabs"><button className={tab === "business" ? "active" : ""} onClick={() => setTab("business")}><Radar size={15} />业务预警规则</button><button className={tab === "sla" ? "active" : ""} onClick={() => setTab("sla")}><SlidersHorizontal size={15} />渠道SLA规则</button><button className={tab === "statuses" ? "active" : ""} onClick={() => setTab("statuses")}><Layers3 size={15} />17TRACK状态字典</button><button className={tab === "data" ? "active" : ""} onClick={() => setTab("data")}><Database size={15} />导入数据质量</button></div>
      {tab === "business" ? <BusinessRules notify={notify} /> : tab === "data" ? <DataQuality onImport={onImport} /> : tab === "sla" ? <SlaRules /> : <StatusDictionary />}
    </>
  );
}

function BusinessRules({ notify }: { notify: (text: string) => void }) {
  const [rules, setRules] = useState(BUSINESS_RULES);
  const [editing, setEditing] = useState<Exclude<AlertKey, "all"> | null>(null);
  const rule = editing ? rules.find((item) => item.key === editing) : null;
  const isErpRule = rule?.key === "signout_timeout" || rule?.key === "fulfillment_error" || rule?.key === "stock_shortage" || rule?.key === "split_order_exception";

  function toggleRule(key: Exclude<AlertKey, "all">) {
    setRules((current) => current.map((item) => item.key === key ? { ...item, enabled: !item.enabled } : item));
  }

  return (
    <>
      <section className="rule-layer-guide">
        <article><span className="layer-icon fact"><PackageSearch size={15} /></span><div><strong>ERP + 17TRACK事实</strong><p>ERP履约状态、错误码和17TRACK物流状态原样保留，业务配置不能修改。</p></div><b>两类事实来源</b></article>
        <ChevronRight size={16} />
        <article><span className="layer-icon rule"><Radar size={15} /></span><div><strong>业务预警判断</strong><p>按团队、渠道、时间阈值、排除条件和恢复条件独立计算。</p></div><b>{rules.filter((item) => item.enabled).length}条启用</b></article>
      </section>
      <section className="stagnation-compare" aria-label="物流停滞与物流断更区别">
        <header><div><strong>停滞和断更如何区分</strong><span>两条规则互斥判断，避免同一包裹重复预警</span></div><b>关键区别：有没有新的有效轨迹</b></header>
        <article><span className="compare-icon stagnation"><MapPin size={16} /></span><div><strong>物流停滞</strong><p>期间<strong>仍有轨迹更新</strong>，但标准化后的地点或处理中心连续超过3个工作日没有变化。</p><small>例：连续出现“Processing at Birmingham Center”</small></div></article>
        <article><span className="compare-icon no-update"><History size={16} /></span><div><strong>物流断更</strong><p>最后一条有效轨迹之后，连续超过3个工作日<strong>完全没有新的有效轨迹</strong>。</p><small>Label Created等电子信息不重置断更计时</small></div></article>
        <footer><ShieldCheck size={14} /><span>若期间存在新轨迹但地点未移动，判定“停滞”；若没有新有效轨迹，判定“断更”。海关节点优先归入“海关卡关”。</span></footer>
      </section>
      <section className="panel business-rules">
        <div className="panel-title"><div><h2>业务预警规则</h2><p>使用标准模板配置阈值和适用范围，避免业务规则覆盖17TRACK官方状态。</p></div><button className="button secondary" onClick={() => { setEditing("no_update"); notify("已复制物流断更规则作为新规则草稿"); }}>+ 新增规则</button></div>
        <div className="business-rule-head"><span>规则 / 优先级</span><span>适用范围</span><span>触发条件</span><span>关联事实字段</span><span>恢复与排除</span><span>状态</span><span /></div>
        {rules.map((item) => <div className="business-rule-row" key={item.key}>
          <div><AlertBadge alert={item.key} /><small>{item.priority}优先级 · 当前命中 {ALERT_META[item.key].count} 单</small></div>
          <strong>{item.scope}</strong>
          <p>{item.trigger}{item.keywordMode && item.keywordMode !== "不使用" && <small className="keyword-summary">关键字：{item.keywordMode}</small>}</p>
          <code>{item.trackStatus}</code>
          <p><b>恢复：</b>{item.recovery}<small><b>排除：</b>{item.exclusions}</small></p>
          <button className={`rule-switch ${item.enabled ? "enabled" : ""}`} aria-label={`${ALERT_META[item.key].label}${item.enabled ? "已启用" : "已停用"}`} aria-pressed={item.enabled} onClick={() => toggleRule(item.key)}><i />{item.enabled ? "启用" : "停用"}</button>
          <button className="rule-edit" onClick={() => setEditing(item.key)}>配置</button>
        </div>)}
        <footer><ShieldCheck size={14} /><span>规则发布后只影响新的预警判断；历史命中记录保留当时的规则版本，便于追溯。</span></footer>
      </section>
      {rule && <div className="modal-mask" role="button" tabIndex={0} aria-label="关闭规则配置" onClick={(event) => { if (event.target === event.currentTarget) setEditing(null); }} onKeyDown={(event) => { if (event.key === "Escape") setEditing(null); }}><section className="rule-editor" role="dialog" aria-modal="true" aria-label={`配置${ALERT_META[rule.key].label}规则`}>
        <header><div><span>业务预警规则</span><h2>{ALERT_META[rule.key].label}</h2><p>规则代码：{rule.key} · {isErpRule ? "ERP" : "17TRACK"}事实字段只读</p></div><button onClick={() => setEditing(null)} aria-label="关闭规则配置"><X size={17} /></button></header>
        <div className="rule-editor-body">
          <section><h3>适用范围</h3><div className="rule-form-grid"><label><span>团队</span><select defaultValue="全部团队"><option>全部团队</option><option>LM</option><option>FD</option><option>LM_TT</option><option>网红团队</option></select></label><label><span>物流渠道</span><select defaultValue="全部渠道"><option>全部渠道</option><option>WYT-WF5日达 Zonal</option><option>云途英国专线</option></select></label><label><span>目的国家</span><select defaultValue="全部国家"><option>全部国家</option><option>US</option><option>GB</option></select></label></div></section>
          <section><h3>触发判断</h3><div className="rule-form-grid"><label className="wide"><span>触发条件</span><input defaultValue={rule.trigger} /></label><label><span>时间口径</span><select defaultValue={rule.key === "not_online" ? "自然日" : "工作日"}><option>工作日</option><option>自然日</option></select></label><label><span>阈值</span><input type="number" defaultValue={rule.key === "not_online" || rule.key === "transport_timeout" ? 2 : 3} /></label><label><span>优先级</span><select defaultValue={rule.priority}><option>紧急</option><option>高</option><option>中</option></select></label></div></section>
          <section className="readonly-fact"><h3>{isErpRule ? "ERP关联字段" : "17TRACK关联条件"} <small>只读映射</small></h3><div><code>{rule.trackStatus}</code><span>业务规则仅读取来源系统事实，不会写回或覆盖状态。</span></div></section>
          <section className="keyword-config"><h3>{isErpRule ? "ERP错误关键字" : "轨迹关键字"} <small>可选辅助条件，不替代状态与时间判断</small></h3><div className="rule-form-grid"><label><span>使用方式</span><select defaultValue={rule.keywordMode ?? "不使用"}><option>不使用</option><option>辅助匹配</option><option>必须命中</option></select></label><label className="wide"><span>命中关键字 · 逗号分隔</span><input defaultValue={rule.keywords ?? ""} placeholder={isErpRule ? "例如：邮编错误, 取号失败" : "例如：Arrived at facility, Processing center"} /></label><label className="wide"><span>忽略或排除关键字</span><input defaultValue={rule.ignoredKeywords ?? ""} placeholder="例如：Label created, Released" /></label><label><span>匹配字段</span><select defaultValue={isErpRule ? "ERP错误信息" : "轨迹标题 + 详情"}><option>{isErpRule ? "ERP错误信息" : "轨迹标题 + 详情"}</option><option>仅标题</option><option>仅详情</option></select></label></div><p>{rule.key === "no_update" ? "断更规则中的关键字用于区分“有效轨迹”和电子占位信息；不是要求轨迹必须包含某个固定词。" : "优先使用17TRACK标准状态和结构化节点，关键字仅补充识别运输商原始文案。"}</p></section>
          <section><h3>排除与恢复</h3><div className="rule-form-grid"><label className="wide"><span>排除条件</span><input defaultValue={rule.exclusions} /></label><label className="wide"><span>自动恢复条件</span><input defaultValue={rule.recovery} /></label></div></section>
        </div>
        <footer><button className="button secondary" onClick={() => setEditing(null)}>取消</button><button className="button primary" onClick={() => { setEditing(null); notify(`${ALERT_META[rule.key].label}规则已保存为草稿`); }}>保存草稿</button></footer>
      </section></div>}
    </>
  );
}

function StatusDictionary() {
  return (
    <section className="panel status-catalog">
      <header><div><span className="dictionary-icon"><Layers3 size={17} /></span><p><strong>17TRACK主状态与子状态</strong><small>9个主状态用于判断阶段，30个子状态用于解释具体节点或原因。</small></p></div><b>V2.4 · 9主 / 30子</b></header>
      <div className="dictionary-grid">
        {(Object.entries(SUB_STATUS_GROUPS) as [MainStatus, { code: string; label: string; count: number }[]][]).map(([mainStatus, items]) => <section key={mainStatus}><header><StatusBadge status={mainStatus} /><span>{items.length}个</span></header>{items.map((item) => <div key={item.code}><strong>{item.label}</strong><code>{item.code}</code></div>)}</section>)}
      </div>
      <footer><ShieldCheck size={14} /><span>中文名称用于页面显示，枚举代码原样保存；未来出现未映射状态时保留原值，不覆盖、不丢弃。</span></footer>
    </section>
  );
}

function DataQuality({ onImport }: { onImport: () => void }) {
  return (
    <div className="settings-layout">
      <section className="panel source-card"><div className="source-head"><div className="file-mark"><FileSpreadsheet size={22} /></div><div><span>当前数据源</span><h2>履约单导入模板.xlsx</h2><p>履约单导入 · 6,948行 · 13个字段</p></div><button className="button secondary" onClick={onImport}>查看导入校验</button></div><div className="quality-score"><div><strong>63</strong><span>数据健康度</span></div><i><b style={{ width: "63%" }} /></i><p>基础字段可用，但重复数据、占位值和长运单号会直接影响异常数量。</p></div></section>
      <section className="quality-stats"><article><span className="quality-icon warn"><AlertTriangle size={17} /></span><div><strong>1,998</strong><span>完全重复行</span></div><small>导入时自动跳过</small></article><article><span className="quality-icon bad"><CircleAlert size={17} /></span><div><strong>238</strong><span>运单号为“19”</span></div><small>拒绝导入，无法监控</small></article><article><span className="quality-icon warn"><Clock3 size={17} /></span><div><strong>314</strong><span>签出时间缺失</span></div><small>排除未上网和时效计算</small></article><article><span className="quality-icon good"><ShieldCheck size={17} /></span><div><strong>704</strong><span>超15位数字运单</span></div><small>强制按文本保留精度</small></article></section>
      <section className="panel mapping-card"><div className="panel-title"><div><h2>V2主表字段</h2><p>一行一个包裹；相同履约单可以对应多个不同运单</p></div><span>12个核心字段</span></div><div className="mapping-grid"><div className="mapping-head"><span>字段</span><span>来源</span><span>规则</span></div>{[
        ["履约单号 *", "现有字段", "业务标识"], ["订单号 *", "新增", "支持订单精准查询"], ["快递单号 *", "现有字段", "文本格式 / 与运输商代码组成追踪键"], ["17TRACK运输商代码 *", "渠道映射", "与运单号组成唯一追踪键"], ["团队", "新增", "用于团队筛选"], ["发货仓代码 *", "仓库代码", "字段重命名"], ["目的国家ISO *", "目的国家", "US / GB / DE"], ["物流渠道 *", "当前渠道", "匹配SLA规则"], ["签出时间 *", "现有字段", "预警计算唯一起点"],
      ].map((item) => <div className="mapping-row" key={item[0]}><strong>{item[0]}</strong><span>{item[1]}</span><code>{item[2]}</code></div>)}</div><div className="mapping-foot"><CircleCheck size={15} /><span>17TRACK主状态、子状态、轨迹和异常类型由系统生成，不写回Excel主表。</span></div></section>
      <aside className="panel ingest-rules"><h2>导入处理规则</h2>{[
        ["19 → 空值", "历史数据兼容；新数据禁止使用19占位"], ["运单号强制文本", "保留前导零，阻止科学计数法和精度丢失"], ["运单号 + 运输商代码", "17TRACK唯一追踪键；同号不同运输商不直接去重"], ["缺失签出时间", "保留并标记数据不完整，不参与时间规则"], ["国家转ISO", "中文国家名在导入时标准化"],
      ].map(([title, detail]) => <div key={title}><CheckCircle2 size={15} /><p><strong>{title}</strong><span>{detail}</span></p></div>)}</aside>
    </div>
  );
}

function SlaRules() {
  const rules = [
    ["US", "WYT-USPS GA", "7", "2", "美国工作日", "启用"],
    ["US", "WYT-WF5日达 Zonal", "5", "2", "美国工作日", "启用"],
    ["US", "Luvme Express", "8", "2", "美国工作日", "启用"],
    ["GB", "云途英国专线", "7", "2", "英国工作日", "启用"],
  ];
  return (
    <div className="sla-layout">
      <section className="panel sla-card"><div className="panel-title"><div><h2>渠道 × 国家承诺时效</h2><p>未妥投超时进入当前预警；已妥投但超时只计入渠道质量和履约单历史</p></div><button className="button secondary">+ 新增规则</button></div><div className="sla-table"><div className="sla-head"><span>国家</span><span>物流渠道</span><span>承诺时效</span><span>缓冲</span><span>工作日历</span><span>状态</span></div>{rules.map((rule) => <div className="sla-row" key={`${rule[0]}${rule[1]}`}><strong>{rule[0]}</strong><span>{rule[1]}</span><label><input defaultValue={rule[2]} /> 工作日</label><label><input defaultValue={rule[3]} /> 工作日</label><span>{rule[4]}<ChevronDown size={13} /></span><b><i />{rule[5]}</b></div>)}</div></section>
      <aside className="panel rule-definitions"><h2>核心状态口径</h2><div><span className="definition-icon"><PackageCheck size={16} /></span><p><strong>真实上网</strong><code>InTransit_PickedUp</code><small>InfoReceived不算实体首扫</small></p></div><div><span className="definition-icon"><History size={16} /></span><p><strong>物流断更</strong><code>3个工作日无有效轨迹</code><small>排除派送失败和等待自提</small></p></div><div><span className="definition-icon"><Truck size={16} /></span><p><strong>派送异常</strong><code>DeliveryFailure / AvailableForPickup</code><small>原始状态分别保留，不互相改写</small></p></div><div><span className="definition-icon"><CircleAlert size={16} /></span><p><strong>海关卡关</strong><code>海关节点 &gt;3工作日</code><small>独立于普通同地点停滞</small></p></div><div><span className="definition-icon"><Layers3 size={16} /></span><p><strong>二次异常标签</strong><code>已处理 + 原包裹恢复投递</code><small>属于业务标签，不进入实时预警</small></p></div></aside>
    </div>
  );
}

function DetailDrawer({ order, onClose, notify }: { order: Order; onClose: () => void; notify: (text: string) => void }) {
  const alerts = activeAlerts(order);
  const milestones = getOrderMilestones(order);
  const deliveredAt = getDeliveredAt(order);
  const cEndCarrier = getCEndCarrier(order);
  const fulfillmentTimeline = getFulfillmentTimeline(order);
  return (
    <div className="drawer-mask" role="button" tabIndex={0} aria-label="关闭物流详情" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <aside className="drawer">
        <header><div><span>物流详情</span><button className="erp-fulfillment-link" onClick={() => notify(`${order.fulfillmentNo}：已模拟跳转ERP履约单详情；正式环境接入ERP详情URL模板`)}>{order.fulfillmentNo}<ArrowUpRight size={14} /></button><p>{order.orderNo} · {order.trackingNo}</p></div><button onClick={onClose} aria-label="关闭"><X size={18} /></button></header>
        <div className="drawer-status"><span className="fact-label">17TRACK事实</span><span className="drawer-main-status">主状态</span><StatusBadge status={order.status} /><code>{order.status}</code><span className="drawer-sub-status">子状态 · {SUB_STATUS_LABELS[order.subStatus] ?? "未映射"}</span><code>{order.subStatus}</code><SyncBadge status={order.syncStatus} /></div>
        <div className="drawer-body">
          <section className="drawer-summary"><div><span>当前履约节点</span><strong>{getCurrentNode(order)}</strong></div><div><span>支付时间</span><strong>{milestones.payment}</strong></div><div><span>履约单创建时间</span><strong>{milestones.created}</strong></div><div><span>仓库签出时间</span><strong>{milestones.outbound}</strong></div><div><span>物流上网时间</span><strong>{milestones.online}</strong></div><div><span>开始派送时间</span><strong>{milestones.delivery}</strong></div><div><span>签收时间</span><strong>{deliveredAt}</strong></div><div><span>所属团队</span><strong>{TEAM_META[order.team].label}</strong></div><div><span>C端物流商</span><strong>{cEndCarrier}</strong></div><div><span>物流渠道</span><strong>{order.channel}</strong></div><div><span>发货仓 / 国家</span><strong>{order.warehouse} → {order.country}</strong></div><div><span>运输时长 / SLA</span><strong>{order.elapsed} / {order.sla}</strong></div></section>
          <section className="layer-detail"><article className="fact-detail"><header><span><PackageSearch size={15} /></span><div><strong>物流事实</strong><small>来自17TRACK，代码和轨迹原样保存</small></div></header><dl><div><dt>主状态</dt><dd><b>{STATUS_META[order.status].label}</b><code>{order.status}</code></dd></div><div><dt>子状态</dt><dd><b>{SUB_STATUS_LABELS[order.subStatus] ?? "未映射，保留原值"}</b><code>{order.subStatus}</code></dd></div><div><dt>17TRACK运输商</dt><dd><b>{order.carrier}</b></dd></div><div><dt>运输商原文</dt><dd><b>{order.latestTrack}</b></dd></div><div><dt>最近同步</dt><dd><b>{order.syncAt}</b><code>{order.syncStatus}</code></dd></div></dl></article><article className={`judgment-detail ${order.monitorState}`}><header><span><Radar size={15} /></span><div><strong>业务监控判断</strong><small>同一履约单只突出最高优先级预警</small></div><MonitorBadge state={order.monitorState} /></header><div className="detail-alert-list">{alerts.length ? alerts.map((alert, index) => <div key={alert}><span>{index === 0 ? "主预警" : "关联预警"}</span><AlertBadge alert={alert} /><b>预警中</b></div>) : <span className="no-alert"><CheckCircle2 size={12} />未命中实时预警</span>}</div>{order.tags?.length ? <div className="drawer-tags"><span>业务标签</span>{order.tags.map((tag) => <b key={tag}>{tag}</b>)}</div> : null}<p>{order.evidence}</p></article></section>
          <section className="alert-history"><header><div><History size={15} /><span><strong>历史预警</strong><small>仅在履约单详情保留</small></span></div><b>{order.alertHistory?.length ?? 0}条</b></header>{order.alertHistory?.length ? order.alertHistory.map((history, index) => <article key={`${history.alert}-${index}`}><AlertBadge alert={history.alert} /><span className="history-recovered">已自动恢复</span><dl><div><dt>触发时间</dt><dd>{history.triggeredAt}</dd></div><div><dt>恢复时间</dt><dd>{history.recoveredAt}</dd></div><div><dt>超时时长</dt><dd>{history.duration}</dd></div><div><dt>恢复原因</dt><dd>{history.reason}</dd></div></dl></article>) : <div className="alert-history-empty" aria-label="暂无历史预警" />}</section>
          {order.syncStatus === "failure" && <div className="sync-warning"><CircleAlert size={16} /><div><strong>保留上次成功状态，暂停时间类预警</strong><p>同步失败不会把主状态改成NotFound；系统暂停未上网、断更、停滞和卡关判断，恢复同步后自动重算。</p></div></div>}
          <div className="drawer-section-title"><div><h3>履约全链路时间轴</h3><span>OMS + ERP + WMS + 17TRACK</span></div><a href={`https://t.17track.net/zh-cn#nums=${order.trackingNo}`} target="_blank" rel="noreferrer">在17TRACK打开<ArrowUpRight size={13} /></a></div>
          <section className="timeline">{fulfillmentTimeline.map((event, index) => <article key={`${event.source}-${event.time}-${index}`} className={event.state}><i /><time>{event.time}</time><div><span>{event.source}</span><strong>{event.title}</strong><p>{event.detail}</p>{event.location && <small><MapPin size={12} />{event.location}</small>}</div></article>)}</section>
        </div>
        <footer><button className="button secondary" onClick={() => navigator.clipboard?.writeText(order.trackingNo).then(() => notify("运单号已复制"))}>复制运单号</button><button className="button primary" onClick={() => notify("已标记为今日已查看")}>标记已查看</button></footer>
      </aside>
    </div>
  );
}

function ImportModal({ onClose, notify }: { onClose: () => void; notify: (text: string) => void }) {
  const [validated, setValidated] = useState(false);
  return (
    <div className="modal-mask" role="button" tabIndex={0} aria-label="关闭履约单导入" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <section className="import-modal" role="dialog" aria-modal="true" aria-label="履约单数据导入">
        <header><div><span>履约单数据导入</span><h2>导入前先校验，不让脏数据进入预警计算</h2></div><button onClick={onClose}><X size={18} /></button></header>
        {!validated ? <div className="import-ready"><div className="upload-zone"><FileSpreadsheet size={30} /><strong>履约单导入模板.xlsx</strong><span>已识别：履约单导入 · 6,948行 · 13列</span><button className="button primary" onClick={() => setValidated(true)}>开始校验</button></div><div className="import-hints"><div><Check size={14} /><span>按表头名称匹配，不依赖固定列顺序</span></div><div><Check size={14} /><span>长运单号以文本读取，保留完整精度</span></div><div><Check size={14} /><span>运单号 + 运输商代码作为17TRACK唯一追踪键</span></div></div></div> : <div className="validation-result"><div className="validation-summary"><span className="success-ring"><Check size={24} /></span><div><strong>校验完成</strong><p>可安全写入的记录已与问题数据分开。</p></div></div><div className="validation-grid"><article><span>原始行数</span><strong>6,948</strong><small>100%</small></article><article className="good"><span>有效唯一运单</span><strong>4,704</strong><small>进入轨迹监控</small></article><article className="warn"><span>跳过重复</span><strong>1,998</strong><small>完全相同行</small></article><article className="bad"><span>拒绝导入</span><strong>238</strong><small>运单号缺失/为19</small></article></div><div className="validation-lines"><div><span>签出时间缺失</span><strong>314行</strong><em>导入但不参与时间类预警</em></div><div><span>超15位纯数字运单</span><strong>704行</strong><em>已强制转换为文本</em></div><div><span>历史占位值“19”</span><strong>6,003行</strong><em>已统一转换为空值</em></div></div><div className="modal-actions"><button className="button secondary" onClick={() => setValidated(false)}>返回</button><button className="button primary" onClick={() => { notify("4,704个有效运单已进入监控"); onClose(); }}>确认导入有效记录</button></div></div>}
      </section>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState("");

  function notify(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(""), 2600);
  }

  function changeView(nextView: View) {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span><Radar size={20} /></span><div><strong>履约雷达</strong><small>17TRACK CONTROL</small></div></div>
        <nav>{NAV.map((item) => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => changeView(item.id)}><Icon size={17} /><span><strong>{item.label}</strong><small>{item.desc}</small></span>{item.id === "monitor" && <b>136</b>}</button>; })}</nav>
        <div className="sidebar-foot"><div><span className="live-dot" /><p><strong>数据同步正常</strong><small>17TRACK · 2分钟前</small></p></div><div className="user"><span>YZ</span><p><strong>运营管理员</strong><small>物流部 · 全部权限</small></p></div></div>
      </aside>
      <main>
        <header className="topbar"><div><strong>履约控制台</strong><ChevronRight size={13} /><span>{NAV.find((item) => item.id === view)?.label}</span></div><div><button><CalendarDays size={14} />近30天<ChevronDown size={13} /></button><button><CircleCheck size={14} />数据更新于 11:45</button></div></header>
        <div className="content">
          {view === "overview" && <Overview toMonitor={() => changeView("monitor")} toAnalysis={() => changeView("analysis")} />}
          {view === "monitor" && <Monitor onOpen={setSelectedOrder} notify={notify} />}
          {view === "analysis" && <Analysis />}
          {view === "settings" && <Settings onImport={() => setShowImport(true)} notify={notify} />}
        </div>
      </main>
      {selectedOrder && <DetailDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} notify={notify} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} notify={notify} />}
      {toast && <div className="toast"><CheckCircle2 size={16} />{toast}</div>}
    </div>
  );
}
