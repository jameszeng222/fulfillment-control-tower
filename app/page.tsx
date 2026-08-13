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
  Filter,
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

type View = "monitor" | "tracking" | "analysis" | "settings";
type MainStatus =
  | "NotFound"
  | "InfoReceived"
  | "InTransit"
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
  alert: Exclude<AlertKey, "all">;
  severity: Severity;
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
  InTransit: { label: "运输途中", tone: "blue", count: 2106 },
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
    severity: "high",
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
    alert: "no_update",
    severity: "medium",
    shippedAt: "2026-08-01 23:30",
    elapsed: "11天 12小时",
    abnormalAge: "断更 4天 1小时",
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
];

const NAV: { id: View; label: string; desc: string; icon: LucideIcon }[] = [
  { id: "monitor", label: "预警监控", desc: "待关注异常", icon: Radar },
  { id: "tracking", label: "运单追踪", desc: "17TRACK状态", icon: PackageSearch },
  { id: "analysis", label: "时效分析", desc: "履约质量", icon: BarChart3 },
  { id: "settings", label: "数据与规则", desc: "导入和SLA", icon: Settings2 },
];

function StatusBadge({ status }: { status: MainStatus }) {
  const meta = STATUS_META[status];
  return <span className={`status-badge ${meta.tone}`}><i />{meta.label}</span>;
}

function AlertBadge({ alert }: { alert: Exclude<AlertKey, "all"> }) {
  return <span className={`alert-badge alert-${alert}`}>{ALERT_META[alert].label}</span>;
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
            <th>预警类型</th>
            <th>履约单 / 订单</th>
            <th>运单号</th>
            <th>17TRACK状态</th>
            <th>渠道 / 国家</th>
            <th>异常时长</th>
            <th>最新物流轨迹</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => (
            <tr key={order.trackingNo} onClick={() => onOpen(order)}>
              <td><AlertBadge alert={order.alert} /><small className={`risk ${order.severity}`}>{order.severity === "critical" ? "紧急" : order.severity === "high" ? "高" : "中"}</small></td>
              <td><strong>{order.fulfillmentNo}</strong><small>{order.orderNo} · {order.platform}</small></td>
              <td>
                <a href={`https://t.17track.net/zh-cn#nums=${order.trackingNo}`} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                  {order.trackingNo}<ArrowUpRight size={12} />
                </a>
                <small>{order.carrier}</small>
              </td>
              <td><StatusBadge status={order.status} /><code>{order.subStatus}</code></td>
              <td><strong>{order.channel}</strong><small>{order.country} · {order.warehouse}</small></td>
              <td><strong>{order.abnormalAge}</strong><small>运输 {order.elapsed}</small></td>
              <td><strong className="track-copy">{order.latestTrack}</strong><small>{order.latestAt}</small></td>
              <td><button className="icon-button" aria-label="查看物流详情"><ChevronRight size={17} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty-state"><Search size={22} /><strong>没有匹配的异常运单</strong><span>试试调整关键词或筛选条件</span></div>}
    </div>
  );
}

function Monitor({ onOpen, onImport, notify }: { onOpen: (order: Order) => void; onImport: () => void; notify: (text: string) => void }) {
  const [activeAlert, setActiveAlert] = useState<AlertKey>("all");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("全部国家");

  const rows = useMemo(() => ORDERS.filter((order) => {
    const text = `${order.fulfillmentNo} ${order.orderNo} ${order.trackingNo}`.toLowerCase();
    return (activeAlert === "all" || order.alert === activeAlert)
      && (country === "全部国家" || order.country === country)
      && (!query || text.includes(query.toLowerCase()));
  }), [activeAlert, country, query]);

  return (
    <>
      <PageHeader
        eyebrow="LOGISTICS WATCH"
        title="物流轨迹预警监控"
        description="只展示需要跟进的异常包裹；状态恢复后自动移出，已签收自动归档。"
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

      <section className="alert-cards" aria-label="异常类型">
        <button className={activeAlert === "all" ? "active" : ""} onClick={() => setActiveAlert("all")}>
          <span className="alert-icon all"><Radar size={17} /></span><div><small>全部预警</small><strong>112</strong><em>按风险和时长排序</em></div>
        </button>
        {(Object.entries(ALERT_META) as [Exclude<AlertKey, "all">, typeof ALERT_META[Exclude<AlertKey, "all">]][]).map(([key, item]) => (
          <button key={key} className={activeAlert === key ? "active" : ""} onClick={() => setActiveAlert(key)}>
            <span className={`alert-icon ${key}`}><AlertTriangle size={16} /></span><div><small>{item.label}</small><strong>{item.count}</strong><em>{item.hint}</em></div>
          </button>
        ))}
      </section>

      <section className="panel monitor-panel">
        <div className="panel-toolbar">
          <div className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索运单号、订单号、履约单号" /></div>
          <select aria-label="物流渠道"><option>全部渠道</option><option>WYT-USPS GA</option><option>WYT-WF5日达 Zonal</option><option>云途英国专线</option></select>
          <select value={country} onChange={(event) => setCountry(event.target.value)} aria-label="目的国家"><option>全部国家</option><option>US</option><option>GB</option></select>
          <select aria-label="团队"><option>全部团队</option><option>北美客服一组</option><option>北美客服二组</option><option>欧洲客服组</option></select>
          <button className="filter-button"><SlidersHorizontal size={14} />更多筛选</button>
          <span className="result-count">显示 {rows.length} 条示例 · 共 {activeAlert === "all" ? 112 : ALERT_META[activeAlert].count} 条</span>
        </div>
        <div className="rule-note"><ShieldCheck size={14} /><span>断更规则自动排除“派送失败”和“等待自提”；未上网严格以ERP签出时间 + <code>InTransit_PickedUp</code> 判断。</span></div>
        <OrderTable rows={rows} onOpen={onOpen} />
        <div className="table-footer"><span>默认监控30天 · 超期未解决保留 · 已签收自动归档</span><div><button className="active">1</button><button>2</button><button>3</button><button>下一页</button></div></div>
      </section>
    </>
  );
}

function Tracking({ onOpen, onImport }: { onOpen: (order: Order) => void; onImport: () => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<MainStatus | "all">("all");
  const rows = ORDERS.filter((order) => (status === "all" || order.status === status) && (!query || `${order.fulfillmentNo}${order.orderNo}${order.trackingNo}`.toLowerCase().includes(query.toLowerCase())));
  return (
    <>
      <PageHeader eyebrow="17TRACK STATUS" title="运单追踪" description="ERP履约数据与17TRACK主状态、子状态和完整轨迹统一查看。" actions={<><button className="button secondary" onClick={onImport}><FileSpreadsheet size={15} />导入数据</button><button className="button secondary"><Download size={15} />导出结果</button></>} />
      <section className="status-grid">
        {(Object.entries(STATUS_META) as [MainStatus, typeof STATUS_META[MainStatus]][]).map(([key, meta]) => <button key={key} className={status === key ? `active ${meta.tone}` : meta.tone} onClick={() => setStatus(status === key ? "all" : key)}><span><i />{meta.label}</span><strong>{meta.count.toLocaleString()}</strong><small>{key}</small></button>)}
      </section>
      <section className="panel">
        <div className="panel-toolbar roomy"><div className="search-box wide"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入运单号、订单号或履约单号精准查询" /></div><select><option>全部物流渠道</option><option>USPS Ground Advantage</option><option>云途英国专线</option></select><select><option>全部发货仓</option><option>USKY3-WINIT</option><option>XC01</option><option>JY01</option></select><button className="filter-button"><Filter size={14} />筛选</button><span className="result-count">共 4,704 个有效运单</span></div>
        <OrderTable rows={rows} onOpen={onOpen} />
      </section>
    </>
  );
}

function Analysis() {
  const [days, setDays] = useState(7);
  const rates: Record<number, string> = { 3: "54.2%", 5: "81.7%", 7: "93.7%", 10: "97.9%" };
  const rate = rates[days] ?? `${Math.min(98.6, 68 + days * 3.7).toFixed(1)}%`;
  const trend = [84, 87, 86, 89, 91, 90, 93, 92, 94, 93, 95, 96];
  return (
    <>
      <PageHeader eyebrow="FULFILLMENT PERFORMANCE" title="时效分析" description="用少量核心指标回答：是否准时、问题集中在哪个渠道。" actions={<button className="button secondary"><Download size={15} />导出分析</button>} />
      <section className="analysis-filter panel"><select><option>按物流渠道</option><option>按团队</option><option>按发货仓</option><option>按国家</option><option>按创建日期</option><option>按签出日期</option></select><select><option>全部国家</option><option>US · 美国</option><option>GB · 英国</option></select><select><option>全部发货仓</option><option>USKY3-WINIT</option><option>XC01</option></select><label><input type="number" min="1" max="30" value={days} onChange={(event) => setDays(Number(event.target.value) || 1)} /><span>天达成率</span></label><button className="button primary">应用</button></section>
      <section className="metric-grid">
        <article className="metric-card primary-metric"><div><span>{days}天达成率</span><Gauge size={18} /></div><strong>{rate}</strong><small><b>↑ 1.8%</b> 较上周期</small></article>
        <article className="metric-card"><div><span>平均妥投时效</span><Clock3 size={18} /></div><strong>4.6<em>天</em></strong><small>已妥投履约单 2,480</small></article>
        <article className="metric-card"><div><span>已妥投超时率</span><Activity size={18} /></div><strong>6.3%</strong><small>较上周期下降 0.7%</small></article>
        <article className="metric-card"><div><span>派送失败率</span><AlertTriangle size={18} /></div><strong>0.49%</strong><small>23 / 4,704 个有效运单</small></article>
      </section>
      <section className="analysis-layout">
        <article className="panel chart-panel"><div className="panel-title"><div><h2>{days}天达成率趋势</h2><p>最近12周 · 按签出日期</p></div><span>目标 ≥ 92%</span></div><div className="trend-chart">{trend.map((value, index) => <div key={index}><b>{value}%</b><i style={{ height: `${(value - 72) * 7}px` }} /><small>W{index + 21}</small></div>)}</div></article>
        <article className="panel channel-panel"><div className="panel-title"><div><h2>渠道时效达成率</h2><p>仅显示样本量 ≥ 30 的渠道</p></div></div>{[
          ["WYT-WF5日达 Zonal", 96.2, 1420], ["Luvme Express", 94.8, 486], ["SpeedX Zonal", 93.4, 352], ["云途英国专线", 89.6, 148], ["USPS GA", 84.1, 100],
        ].map(([name, value, count]) => <div className="channel-rank" key={String(name)}><div><strong>{name}</strong><small>{count}单</small></div><span><i style={{ width: `${Number(value)}%` }} /></span><b className={Number(value) < 90 ? "bad" : ""}>{value}%</b></div>)}</article>
      </section>
      <section className="quality-row"><article className="panel"><div className="panel-title"><div><h2>超时分布</h2><p>已妥投订单 · 相对承诺时效</p></div></div><div className="segments"><span style={{ width: "42%" }}>1–2天 42%</span><span style={{ width: "27%" }}>3–4天 27%</span><span style={{ width: "18%" }}>5–6天 18%</span><span style={{ width: "13%" }}>≥7天 13%</span></div></article><article className="panel"><div className="panel-title"><div><h2>轨迹稳定性</h2><p>运输途中无有效轨迹间隔</p></div></div><div className="stability"><div><b>2.8%</b><span>2–3天无更新</span></div><div><b>1.1%</b><span>4–6天无更新</span></div><div><b>0.3%</b><span>7–10天无更新</span></div><div><b>0.08%</b><span>10天以上</span></div></div></article></section>
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
        ["履约单号 *", "现有字段", "业务标识"], ["订单号 *", "新增", "支持订单精准查询"], ["快递单号 *", "现有字段", "文本格式 / 去重键"], ["团队", "新增", "用于团队筛选"], ["发货仓代码 *", "仓库代码", "字段重命名"], ["目的国家ISO *", "目的国家", "US / GB / DE"], ["物流渠道 *", "当前渠道", "匹配SLA规则"], ["签出时间 *", "现有字段", "预警计算唯一起点"],
      ].map((item) => <div className="mapping-row" key={item[0]}><strong>{item[0]}</strong><span>{item[1]}</span><code>{item[2]}</code></div>)}</div><div className="mapping-foot"><CircleCheck size={15} /><span>17TRACK主状态、子状态、轨迹和异常类型由系统生成，不写回Excel主表。</span></div></section>
      <aside className="panel ingest-rules"><h2>导入处理规则</h2>{[
        ["19 → 空值", "历史数据兼容；新数据禁止使用19占位"], ["运单号强制文本", "保留前导零，阻止科学计数法和精度丢失"], ["履约单号 + 运单号", "完全相同则跳过，不按履约单号单独去重"], ["缺失签出时间", "保留并标记数据不完整，不参与时间规则"], ["国家转ISO", "中文国家名在导入时标准化"],
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
        <div className="drawer-status"><AlertBadge alert={order.alert} /><StatusBadge status={order.status} /><code>{order.subStatus}</code></div>
        <div className="drawer-body">
          <section className="drawer-summary"><div><span>物流渠道</span><strong>{order.channel}</strong></div><div><span>发货仓 / 国家</span><strong>{order.warehouse} → {order.country}</strong></div><div><span>签出时间</span><strong>{order.shippedAt}</strong></div><div><span>运输时长 / SLA</span><strong>{order.elapsed} / {order.sla}</strong></div></section>
          <div className="diagnosis"><AlertTriangle size={17} /><div><strong>异常判断</strong><p>{ALERT_META[order.alert].label}：{ALERT_META[order.alert].hint}。系统将持续监听后续轨迹，恢复后自动移出监控列表。</p></div></div>
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
        {!validated ? <div className="import-ready"><div className="upload-zone"><FileSpreadsheet size={30} /><strong>履约单导入模板.xlsx</strong><span>已识别：履约单导入 · 6,948行 · 13列</span><button className="button primary" onClick={() => setValidated(true)}>开始校验</button></div><div className="import-hints"><div><Check size={14} /><span>按表头名称匹配，不依赖固定列顺序</span></div><div><Check size={14} /><span>长运单号以文本读取，保留完整精度</span></div><div><Check size={14} /><span>同一履约单可对应多个不同运单</span></div></div></div> : <div className="validation-result"><div className="validation-summary"><span className="success-ring"><Check size={24} /></span><div><strong>校验完成</strong><p>可安全写入的记录已与问题数据分开。</p></div></div><div className="validation-grid"><article><span>原始行数</span><strong>6,948</strong><small>100%</small></article><article className="good"><span>有效唯一运单</span><strong>4,704</strong><small>进入轨迹监控</small></article><article className="warn"><span>跳过重复</span><strong>1,998</strong><small>完全相同行</small></article><article className="bad"><span>拒绝导入</span><strong>238</strong><small>运单号缺失/为19</small></article></div><div className="validation-lines"><div><span>签出时间缺失</span><strong>314行</strong><em>导入但不参与时间类预警</em></div><div><span>超15位纯数字运单</span><strong>704行</strong><em>已强制转换为文本</em></div><div><span>历史占位值“19”</span><strong>6,003行</strong><em>已统一转换为空值</em></div></div><div className="modal-actions"><button className="button secondary" onClick={() => setValidated(false)}>返回</button><button className="button primary" onClick={() => { notify("4,704个有效运单已进入监控"); onClose(); }}>确认导入有效记录</button></div></div>}
      </section>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("monitor");
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
          {view === "monitor" && <Monitor onOpen={setSelectedOrder} onImport={() => setShowImport(true)} notify={notify} />}
          {view === "tracking" && <Tracking onOpen={setSelectedOrder} onImport={() => setShowImport(true)} />}
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
