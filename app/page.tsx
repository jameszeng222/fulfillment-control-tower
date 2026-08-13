"use client";

import {
  Activity,
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
  RefreshCw,
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
  | "no_update"
  | "not_online"
  | "delivery_failure"
  | "returning"
  | "second_exception";
type Severity = "critical" | "high" | "medium";
type MonitorState = "active" | "recovered" | "normal" | "archived";
type SyncStatus = "success" | "failure" | "stopped";

type TrackEvent = {
  time: string;
  title: string;
  detail: string;
  location?: string;
  source: "ERP" | "17TRACK";
  state: "normal" | "warning" | "success";
};

type Order = {
  fulfillmentNo: string;
  orderNo: string;
  trackingNo: string;
  team: string;
  platform: string;
  warehouse: string;
  country: string;
  carrier: string;
  channel: string;
  status: MainStatus;
  subStatus: string;
  alert?: Exclude<AlertKey, "all">;
  secondaryAlerts?: Exclude<AlertKey, "all">[];
  severity?: Severity;
  monitorState: MonitorState;
  syncStatus: SyncStatus;
  syncAt: string;
  evidence?: string;
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
  transport_timeout: { label: "运输超时", count: 26, hint: "超承诺时效 +2工作日" },
  stagnation: { label: "物流停滞", count: 31, hint: "同地点 >3工作日" },
  no_update: { label: "物流断更", count: 18, hint: "有效轨迹 >3工作日" },
  not_online: { label: "物流未上网", count: 12, hint: "签出 >2自然日" },
  delivery_failure: { label: "派送失败", count: 14, hint: "17TRACK主/子状态" },
  returning: { label: "包裹退运", count: 8, hint: "Exception_Returning" },
  second_exception: { label: "二次异常", count: 3, hint: "处理后状态再次变化" },
};

const baseEvents: TrackEvent[] = [
  {
    time: "2026-08-03 15:42",
    title: "仓库签出",
    detail: "ERP签出时间，作为未上网和运输时效的唯一计算起点",
    location: "XC01",
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
    team: "欧洲客服组",
    platform: "PC8",
    warehouse: "JY01",
    country: "GB",
    carrier: "YunExpress",
    channel: "云途英国专线",
    status: "InTransit",
    subStatus: "InTransit_CustomsProcessing",
    alert: "stagnation",
    secondaryAlerts: ["transport_timeout"],
    severity: "high",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 11:45",
    evidence: "Heathrow同一海关节点连续3个工作日未离开；同时超过渠道承诺时效。",
    shippedAt: "2026-08-03 15:42",
    elapsed: "9天 20小时",
    abnormalAge: "停滞 3天 8小时",
    latestTrack: "Customs clearance processing",
    latestAt: "08-09 23:11",
    sla: "7工作日",
    events: [
      ...baseEvents,
      {
        time: "2026-08-09 23:11",
        title: "InTransit_CustomsProcessing · 清关处理中",
        detail: "在 Heathrow 海关节点持续停留，尚未出现 CustomsReleased",
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
    team: "北美客服一组",
    platform: "PC1",
    warehouse: "XC01",
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
        location: "XC01",
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
    team: "北美客服一组",
    platform: "PC1",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "USPS",
    channel: "WYT-USPS GA",
    status: "AvailableForPickup",
    subStatus: "AvailableForPickup_Other",
    monitorState: "normal",
    syncStatus: "success",
    syncAt: "08-13 10:13",
    evidence: "等待自提按规则排除物流断更，保留17TRACK原始状态。",
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
    team: "北美客服二组",
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
    team: "北美客服二组",
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
    team: "北美客服一组",
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
    team: "北美客服二组",
    platform: "PC16",
    warehouse: "USKY3-WINIT",
    country: "US",
    carrier: "USPS",
    channel: "USPS Ground Advantage",
    status: "Delivered",
    subStatus: "Delivered_Other",
    alert: "second_exception",
    severity: "medium",
    monitorState: "active",
    syncStatus: "success",
    syncAt: "08-13 09:22",
    evidence: "原物流断更已退款，之后原包裹恢复投递并显示Delivered。",
    shippedAt: "2026-07-22 08:16",
    elapsed: "9天 6小时",
    abnormalAge: "投递恢复",
    latestTrack: "Delivered, Front Door/Porch",
    latestAt: "07-31 14:22",
    sla: "7工作日",
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
    team: "北美客服一组",
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
    team: "北美客服二组",
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
    team: "欧洲客服组",
    platform: "PC8",
    warehouse: "JY01",
    country: "DE",
    carrier: "DHL eCommerce",
    channel: "云途德国专线",
    status: "NotFound",
    subStatus: "NotFound_Other",
    monitorState: "normal",
    syncStatus: "failure",
    syncAt: "08-13 11:37",
    evidence: "17TRACK最近同步失败，暂不判定为物流未上网或物流断更。",
    dataIssue: "运输商接口同步失败",
    shippedAt: "2026-08-11 09:10",
    elapsed: "—",
    abnormalAge: "待同步恢复",
    latestTrack: "No tracking information available",
    latestAt: "08-13 11:37",
    sla: "8工作日",
    events: [{ time: "2026-08-11 09:10", title: "仓库签出", detail: "ERP签出成功", location: "JY01", source: "ERP", state: "normal" }],
  },
  {
    fulfillmentNo: "P26080800731",
    orderNo: "SO-260808-731",
    trackingNo: "SFX260808731US",
    team: "北美客服一组",
    platform: "PC1",
    warehouse: "XC01",
    country: "US",
    carrier: "SpeedX",
    channel: "SpeedX Zonal",
    status: "InTransit",
    subStatus: "InTransit_PickedUp",
    alert: "not_online",
    severity: "medium",
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
    events: [{ time: "2026-08-08 09:31", title: "仓库签出", detail: "开始计算未上网时长", location: "XC01", source: "ERP", state: "normal" }, { time: "2026-08-12 18:26", title: "InTransit_PickedUp · 已揽收", detail: "真实上网，物流未上网预警自动恢复", location: "Queens, NY", source: "17TRACK", state: "success" }],
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

function AlertBadge({ alert }: { alert: Exclude<AlertKey, "all"> }) {
  return <span className={`alert-badge alert-${alert}`}>{ALERT_META[alert].label}</span>;
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

function OrderTable({ rows, onOpen }: { rows: Order[]; onOpen: (order: Order) => void }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>业务预警</th>
            <th>履约单 / 订单</th>
            <th>运单号</th>
            <th>17TRACK主 / 子状态</th>
            <th>渠道 / 国家</th>
            <th>监控生命周期</th>
            <th>最新物流轨迹</th>
            <th>数据同步</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => (
            <tr key={`${order.trackingNo}-${order.carrier}`} onClick={() => onOpen(order)}>
              <td>{order.alert ? <><div className="alert-line"><AlertBadge alert={order.alert} />{order.secondaryAlerts?.length ? <span className="more-alerts">+{order.secondaryAlerts.length}</span> : null}</div>{order.severity && <small className={`risk ${order.severity}`}>{order.severity === "critical" ? "紧急" : order.severity === "high" ? "高" : "中"}</small>}</> : <span className="no-alert"><CheckCircle2 size={12} />无业务预警</span>}</td>
              <td><strong>{order.fulfillmentNo}</strong><small>{order.orderNo} · {order.platform}</small></td>
              <td>
                <a href={`https://t.17track.net/zh-cn#nums=${order.trackingNo}`} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                  {order.trackingNo}<ArrowUpRight size={12} />
                </a>
                <small>{order.carrier}</small>
              </td>
              <td><StatusBadge status={order.status} /><code>{order.subStatus}</code></td>
              <td><strong>{order.channel}</strong><small>{order.country} · {order.warehouse}</small></td>
              <td><MonitorBadge state={order.monitorState} /><small>{order.abnormalAge} · 运输 {order.elapsed}</small></td>
              <td><strong className="track-copy">{order.latestTrack}</strong><small>{order.latestAt}</small></td>
              <td><SyncBadge status={order.syncStatus} /><small>{order.syncAt}</small></td>
              <td><button className="icon-button" aria-label="查看物流详情"><ChevronRight size={17} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty-state"><Search size={22} /><strong>没有匹配的运单</strong><span>试试调整关键词或筛选条件</span></div>}
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
      <PageHeader eyebrow="OPERATIONS OVERVIEW" title="数据总览" description="从总体规模、渠道结构和17TRACK状态看当前物流履约盘面。" actions={<><button className="button secondary"><CalendarDays size={15} />近30天</button><button className="button primary" onClick={toMonitor}><Radar size={15} />查看112条预警</button></>} />
      <section className="overview-kpis">
        <article><div><span>有效监控运单</span><PackageSearch size={18} /></div><strong>4,704</strong><small><b>↑ 8.4%</b> 较上周期 · 36个渠道</small></article>
        <article><div><span>已签收</span><PackageCheck size={18} /></div><strong>2,480</strong><small>签收率 <b>52.7%</b> · 自动归档</small></article>
        <article><div><span>运输中</span><Truck size={18} /></div><strong>2,079</strong><small>占全部运单 <b>44.2%</b></small></article>
        <article className="warning"><div><span>活跃预警</span><AlertTriangle size={18} /></div><strong>112</strong><small>今日新增26 · 恢复21</small></article>
        <article><div><span>7天达成率</span><Gauge size={18} /></div><strong>93.7%</strong><small><b>↑ 1.8%</b> 较上周期</small></article>
      </section>
      <section className="layer-banner"><div><span className="layer-icon fact"><PackageSearch size={15} /></span><p><strong>物流事实层</strong><small>17TRACK九个主状态 + 三十个子状态，原值保留</small></p><b>4,704单</b></div><ChevronRight size={15} /><div><span className="layer-icon rule"><Radar size={15} /></span><p><strong>业务判断层</strong><small>ERP + 轨迹 + 渠道SLA计算，不覆盖物流状态</small></p><b>112条活跃预警</b></div><ChevronRight size={15} /><div><span className="layer-icon health"><Activity size={15} /></span><p><strong>数据健康层</strong><small>同步失败单独监控，不误判为物流断更</small></p><b>32条需关注</b></div></section>
      <section className="overview-main">
        <article className="panel channel-share"><div className="panel-title"><div><h2>物流渠道占比</h2><p>有效监控运单 · 按当前渠道统计</p></div><button onClick={toAnalysis}>渠道分析<ChevronRight size={13} /></button></div><div className="donut-area"><div className="donut"><div><strong>4,704</strong><span>有效运单</span></div></div><div className="share-list">{channels.map((item) => <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><b>{item.count.toLocaleString()}</b><em>{item.share}%</em></div>)}</div></div></article>
        <article className="panel volume-trend"><div className="panel-title"><div><h2>每日签出运单趋势</h2><p>最近14天 · ERP签出时间</p></div><span>日均 295单</span></div><div className="volume-bars">{daily.map((value, index) => <div key={index}><b>{index === daily.length - 1 ? value : ""}</b><i style={{ height: `${Math.round(value / 4.4)}%` }} /><small>{index % 2 === 0 ? `${index + 1}日` : ""}</small></div>)}</div><div className="trend-summary"><span><i />签出运单</span><strong>峰值 392单 · 近7日 +6.8%</strong></div></article>
      </section>
      <section className="overview-secondary">
        <article className="panel status-overview"><div className="panel-title"><div><h2>17TRACK状态分布</h2><p>物流事实 · 九个主状态总数等于有效运单数</p></div><button onClick={toMonitor}>查看运单<ChevronRight size={13} /></button></div><div className="status-stack">{statuses.map(([key, meta]) => <div key={key} style={{ width: `${Math.max(1.2, meta.count / 47.04)}%` }} className={meta.tone} title={`${meta.label} ${meta.count}`} />)}</div><div className="status-overview-list">{statuses.map(([key, meta]) => <button key={key} onClick={toMonitor}><i className={meta.tone} /><span>{meta.label}</span><strong>{meta.count.toLocaleString()}</strong><small>{key}</small></button>)}</div><div className="sync-health"><strong>数据同步健康度</strong><span><i className="success" />同步正常 4,672</span><span><i className="failure" />同步失败 23</span><span><i className="stopped" />停止跟踪 9</span></div></article>
        <article className="panel structure-card"><div className="panel-title"><div><h2>目的国家分布</h2><p>按有效监控运单</p></div></div>{[["美国 US",72.4,3406],["英国 GB",12.6,593],["加拿大 CA",5.8,273],["德国 DE",3.9,184],["其他",5.3,248]].map(([name, share, count]) => <div className="structure-row" key={String(name)}><div><strong>{name}</strong><small>{Number(count).toLocaleString()}单</small></div><i><b style={{ width: `${share}%` }} /></i><span>{share}%</span></div>)}</article>
        <article className="panel structure-card"><div className="panel-title"><div><h2>发货仓分布</h2><p>按ERP发货仓代码</p></div></div>{[["USKY3-WINIT",67.8,3189],["XC01",13.2,621],["NF01",10.9,513],["JY01",6.4,301],["其他",1.7,80]].map(([name, share, count]) => <div className="structure-row warehouse-row" key={String(name)}><div><strong>{name}</strong><small>{Number(count).toLocaleString()}单</small></div><i><b style={{ width: `${share}%` }} /></i><span>{share}%</span></div>)}</article>
      </section>
    </>
  );
}

function Monitor({ onOpen, onImport, notify }: { onOpen: (order: Order) => void; onImport: () => void; notify: (text: string) => void }) {
  const [mode, setMode] = useState<"alerts" | "all">("alerts");
  const [activeAlert, setActiveAlert] = useState<AlertKey>("all");
  const [status, setStatus] = useState<MainStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("全部国家");

  const rows = useMemo(() => ORDERS.filter((order) => {
    const text = `${order.fulfillmentNo} ${order.orderNo} ${order.trackingNo}`.toLowerCase();
    return (mode === "all" || (order.monitorState === "active" && !!order.alert && (activeAlert === "all" || order.alert === activeAlert || order.secondaryAlerts?.includes(activeAlert as Exclude<AlertKey, "all">))))
      && (status === "all" || order.status === status)
      && (country === "全部国家" || order.country === country)
      && (!query || text.includes(query.toLowerCase()));
  }), [activeAlert, country, mode, query, status]);

  return (
    <>
      <PageHeader
        eyebrow="LOGISTICS WATCH"
        title="物流轨迹监控"
        description="预警监控与运单追踪合为一页，统一查看17TRACK状态、异常规则和完整轨迹。"
        actions={<><button className="button secondary" onClick={onImport}><Upload size={15} />导入履约单</button><button className="button primary" onClick={() => notify("轨迹已刷新，新增2条状态变化")}><RefreshCw size={15} />更新轨迹</button></>}
      />

      <div className="sync-strip">
        <div className="sync-title"><span className="live-dot" /><div><strong>监控运行正常</strong><small>ERP 11:43 · 17TRACK 11:45 · 每5分钟扫描规则</small></div></div>
        <div><span>监控运单</span><strong>4,704</strong></div>
        <div><span>活跃预警</span><strong>112</strong></div>
        <div><span>今日新增</span><strong>26</strong></div>
        <div><span>今日恢复</span><strong className="positive">21</strong></div>
        <button onClick={onImport}><CircleAlert size={15} /><span>数据质量</span><strong>需处理 2,550 行</strong><ChevronRight size={14} /></button>
      </div>

      <div className="monitor-switch"><button className={mode === "alerts" ? "active" : ""} onClick={() => setMode("alerts")}><AlertTriangle size={14} />异常预警 <b>112</b></button><button className={mode === "all" ? "active" : ""} onClick={() => { setMode("all"); setActiveAlert("all"); }}><PackageSearch size={14} />全部运单 <b>4,704</b></button><span>同一套搜索、筛选与轨迹详情</span></div>

      <section className="status-grid compact-status">
        {(Object.entries(STATUS_META) as [MainStatus, typeof STATUS_META[MainStatus]][]).map(([key, meta]) => <button key={key} className={status === key ? `active ${meta.tone}` : meta.tone} onClick={() => setStatus(status === key ? "all" : key)}><span><i />{meta.label}</span><strong>{meta.count.toLocaleString()}</strong><small>{key}</small></button>)}
      </section>

      {mode === "alerts" && <section className="alert-cards" aria-label="异常类型">
        <button className={activeAlert === "all" ? "active" : ""} onClick={() => setActiveAlert("all")}>
          <span className="alert-icon all"><Radar size={17} /></span><div><small>全部预警</small><strong>112</strong><em>按风险和时长排序</em></div>
        </button>
        {(Object.entries(ALERT_META) as [Exclude<AlertKey, "all">, typeof ALERT_META[Exclude<AlertKey, "all">]][]).map(([key, item]) => (
          <button key={key} className={activeAlert === key ? "active" : ""} onClick={() => setActiveAlert(key)}>
            <span className={`alert-icon ${key}`}><AlertTriangle size={16} /></span><div><small>{item.label}</small><strong>{item.count}</strong><em>{item.hint}</em></div>
          </button>
        ))}
      </section>}

      <section className="panel monitor-panel">
        <div className="panel-toolbar">
          <div className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索运单号、订单号、履约单号" /></div>
          <select aria-label="物流渠道"><option>全部渠道</option><option>WYT-USPS GA</option><option>WYT-WF5日达 Zonal</option><option>云途英国专线</option></select>
          <select value={country} onChange={(event) => setCountry(event.target.value)} aria-label="目的国家"><option>全部国家</option><option>US</option><option>GB</option></select>
          <select aria-label="团队"><option>全部团队</option><option>北美客服一组</option><option>北美客服二组</option><option>欧洲客服组</option></select>
          {mode === "all" && <select aria-label="监控生命周期"><option>全部监控状态</option><option>预警中</option><option>已恢复</option><option>监控正常</option><option>已归档</option></select>}
          {mode === "all" && <select aria-label="同步状态"><option>全部同步状态</option><option>同步正常</option><option>同步失败</option><option>停止跟踪</option></select>}
          <button className="filter-button"><SlidersHorizontal size={14} />更多筛选</button>
          <span className="result-count">显示 {rows.length} 条示例 · {mode === "alerts" ? `异常共 ${activeAlert === "all" ? 112 : ALERT_META[activeAlert].count} 条` : "有效运单共 4,704 条"}</span>
        </div>
        <div className="rule-note"><ShieldCheck size={14} /><span>{mode === "alerts" ? <>断更自动排除“派送失败”和“等待自提”；未上网以ERP签出时间 + <code>InTransit_PickedUp</code>判断。</> : <>保留17TRACK主状态、子状态原值；点击运单查看ERP与17TRACK完整轨迹。</>}</span></div>
        <OrderTable rows={rows} onOpen={onOpen} />
        <div className="table-footer"><span>默认监控30天 · 超期未解决保留 · 已签收自动归档</span><div><button className="active">1</button><button>2</button><button>3</button><button>下一页</button></div></div>
      </section>
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
        <article className="metric-card"><div><span>超过渠道SLA</span><Activity size={18} /></div><strong>{focus?.overtime ?? 6.3}%</strong><small>按渠道 × 国家承诺时效计算</small></article>
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
  const [tab, setTab] = useState<"data" | "sla">("data");
  return (
    <>
      <PageHeader eyebrow="DATA & RULES" title="数据与规则" description="只维护影响预警准确性的导入质量和渠道SLA，不增加重型流程。" actions={tab === "data" ? <button className="button primary" onClick={onImport}><Upload size={15} />重新导入</button> : <button className="button primary" onClick={() => notify("SLA规则已保存")}><Check size={15} />保存规则</button>} />
      <div className="settings-tabs"><button className={tab === "data" ? "active" : ""} onClick={() => setTab("data")}><Database size={15} />导入数据质量</button><button className={tab === "sla" ? "active" : ""} onClick={() => setTab("sla")}><SlidersHorizontal size={15} />渠道SLA规则</button></div>
      {tab === "data" ? <DataQuality onImport={onImport} /> : <SlaRules />}
    </>
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
      <section className="panel sla-card"><div className="panel-title"><div><h2>渠道 × 国家承诺时效</h2><p>运输超时 = 超过承诺妥投时效2个工作日，仍未进入派送状态且轨迹正常更新</p></div><button className="button secondary">+ 新增规则</button></div><div className="sla-table"><div className="sla-head"><span>国家</span><span>物流渠道</span><span>承诺时效</span><span>缓冲</span><span>工作日历</span><span>状态</span></div>{rules.map((rule) => <div className="sla-row" key={`${rule[0]}${rule[1]}`}><strong>{rule[0]}</strong><span>{rule[1]}</span><label><input defaultValue={rule[2]} /> 工作日</label><label><input defaultValue={rule[3]} /> 工作日</label><span>{rule[4]}<ChevronDown size={13} /></span><b><i />{rule[5]}</b></div>)}</div></section>
      <aside className="panel rule-definitions"><h2>核心状态口径</h2><div><span className="definition-icon"><PackageCheck size={16} /></span><p><strong>真实上网</strong><code>InTransit_PickedUp</code><small>InfoReceived不算上网</small></p></div><div><span className="definition-icon"><History size={16} /></span><p><strong>物流断更</strong><code>3个工作日无有效轨迹</code><small>排除派送失败和等待自提</small></p></div><div><span className="definition-icon"><Truck size={16} /></span><p><strong>派送失败</strong><code>DeliveryFailure_*</code><small>保留17TRACK主/子状态原值</small></p></div><div><span className="definition-icon"><Layers3 size={16} /></span><p><strong>二次异常</strong><code>已处理 + 原包裹恢复投递</code><small>解决方案来自TOS，不在主表重复维护</small></p></div></aside>
    </div>
  );
}

function DetailDrawer({ order, onClose, notify }: { order: Order; onClose: () => void; notify: (text: string) => void }) {
  return (
    <div className="drawer-mask" onClick={onClose}>
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <header><div><span>物流详情</span><h2>{order.fulfillmentNo}</h2><p>{order.orderNo} · {order.trackingNo}</p></div><button onClick={onClose} aria-label="关闭"><X size={18} /></button></header>
        <div className="drawer-status"><span className="fact-label">17TRACK事实</span><StatusBadge status={order.status} /><code>{order.subStatus}</code><SyncBadge status={order.syncStatus} /></div>
        <div className="drawer-body">
          <section className="drawer-summary"><div><span>物流渠道</span><strong>{order.channel}</strong></div><div><span>发货仓 / 国家</span><strong>{order.warehouse} → {order.country}</strong></div><div><span>签出时间</span><strong>{order.shippedAt}</strong></div><div><span>运输时长 / SLA</span><strong>{order.elapsed} / {order.sla}</strong></div></section>
          <section className="layer-detail"><article className="fact-detail"><header><span><PackageSearch size={15} /></span><div><strong>物流事实</strong><small>来自17TRACK，不做覆盖或改写</small></div></header><dl><div><dt>主状态</dt><dd>{order.status}</dd></div><div><dt>子状态</dt><dd>{order.subStatus}</dd></div><div><dt>最近同步</dt><dd>{order.syncAt}</dd></div><div><dt>最新轨迹</dt><dd>{order.latestTrack}</dd></div></dl></article><article className={`judgment-detail ${order.monitorState}`}><header><span><Radar size={15} /></span><div><strong>业务监控判断</strong><small>ERP + 17TRACK + 渠道SLA规则</small></div><MonitorBadge state={order.monitorState} /></header><div className="judgment-alerts">{order.alert ? <><AlertBadge alert={order.alert} />{order.secondaryAlerts?.map((alert) => <AlertBadge key={alert} alert={alert} />)}</> : <span className="no-alert"><CheckCircle2 size={12} />未命中业务预警</span>}</div><p>{order.evidence}</p></article></section>
          {order.syncStatus === "failure" && <div className="sync-warning"><CircleAlert size={16} /><div><strong>本单不参与物流异常判断</strong><p>17TRACK最近同步失败，系统将其归入数据健康问题，避免误判为物流未上网或断更。</p></div></div>}
          <div className="drawer-section-title"><div><h3>完整物流轨迹</h3><span>ERP + 17TRACK</span></div><a href={`https://t.17track.net/zh-cn#nums=${order.trackingNo}`} target="_blank" rel="noreferrer">在17TRACK打开<ArrowUpRight size={13} /></a></div>
          <section className="timeline">{order.events.map((event, index) => <article key={`${event.time}-${index}`} className={event.state}><i /><time>{event.time}</time><div><span>{event.source}</span><strong>{event.title}</strong><p>{event.detail}</p>{event.location && <small><MapPin size={12} />{event.location}</small>}</div></article>)}</section>
        </div>
        <footer><button className="button secondary" onClick={() => navigator.clipboard?.writeText(order.trackingNo).then(() => notify("运单号已复制"))}>复制运单号</button><button className="button primary" onClick={() => notify("已标记为今日已查看")}>标记已查看</button></footer>
      </aside>
    </div>
  );
}

function ImportModal({ onClose, notify }: { onClose: () => void; notify: (text: string) => void }) {
  const [validated, setValidated] = useState(false);
  return (
    <div className="modal-mask" onClick={onClose}>
      <section className="import-modal" onClick={(event) => event.stopPropagation()}>
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span><Radar size={20} /></span><div><strong>履约雷达</strong><small>17TRACK CONTROL</small></div></div>
        <nav>{NAV.map((item) => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><Icon size={17} /><span><strong>{item.label}</strong><small>{item.desc}</small></span>{item.id === "monitor" && <b>112</b>}</button>; })}</nav>
        <div className="sidebar-foot"><div><span className="live-dot" /><p><strong>数据同步正常</strong><small>17TRACK · 2分钟前</small></p></div><div className="user"><span>YZ</span><p><strong>运营管理员</strong><small>物流部 · 全部权限</small></p></div></div>
      </aside>
      <main>
        <header className="topbar"><div><strong>履约控制台</strong><ChevronRight size={13} /><span>{NAV.find((item) => item.id === view)?.label}</span></div><div><button><CalendarDays size={14} />近30天<ChevronDown size={13} /></button><button><CircleCheck size={14} />数据更新于 11:45</button></div></header>
        <div className="content">
          {view === "overview" && <Overview toMonitor={() => setView("monitor")} toAnalysis={() => setView("analysis")} />}
          {view === "monitor" && <Monitor onOpen={setSelectedOrder} onImport={() => setShowImport(true)} notify={notify} />}
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
