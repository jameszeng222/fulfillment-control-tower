"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BellRing,
  Box,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  CloudCog,
  Download,
  Eye,
  FileSearch,
  Filter,
  Gauge,
  Globe2,
  LayoutDashboard,
  MapPin,
  PackageCheck,
  PackageSearch,
  PauseCircle,
  Radar,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  TimerReset,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type AlertType = "超时未上网" | "轨迹停滞3天" | "7天未妥投" | "10天未妥投" | "海关停留超时" | "派送失败";
type Risk = "紧急" | "高" | "中";
type MonitorState = "预警中" | "持续监控" | "已恢复";

type EventItem = {
  time: string;
  title: string;
  detail: string;
  location?: string;
  abnormal?: boolean;
};

type AlertItem = {
  id: string;
  type: AlertType;
  risk: Risk;
  state: MonitorState;
  fulfillmentNo: string;
  orderNo: string;
  platform: string;
  trackingNo: string;
  carrier: string;
  channel: string;
  team: string;
  warehouse: string;
  destination: string;
  region: string;
  postcode: string;
  shippedAt: string;
  triggeredAt: string;
  duration: string;
  lastEvent: string;
  lastEventAt: string;
  triggerReason: string;
  diagnosis: string;
  events: EventItem[];
};

type RuleItem = {
  id: string;
  name: AlertType;
  description: string;
  basis: string;
  threshold: number;
  unit: "小时" | "天" | "状态";
  level: Risk;
  enabled: boolean;
  hits: number;
};

const ALERTS: AlertItem[] = [
  {
    id: "ALT-260812-086", type: "10天未妥投", risk: "紧急", state: "持续监控",
    fulfillmentNo: "F26073100482", orderNo: "LM-5831049", platform: "Shopify US", trackingNo: "SPXJFK2607318452",
    carrier: "SpeedX", channel: "美东7日达", team: "北美一组", warehouse: "USKY3", destination: "美国", region: "New York", postcode: "10013",
    shippedAt: "2026-08-01 09:42", triggeredAt: "今天 08:02", duration: "10天 18小时", lastEvent: "Departed from regional facility", lastEventAt: "08-08 18:20",
    triggerReason: "签出后超过240小时仍无Delivered轨迹，同时最后有效轨迹已停滞65小时。",
    diagnosis: "包裹已进入目的州但未到达末端派送站，存在分拨积压或转运丢扫风险。",
    events: [
      { time: "08-08 18:20", title: "离开区域中心", detail: "Departed from regional facility", location: "Newark, NJ", abnormal: true },
      { time: "08-08 03:45", title: "到达区域中心", detail: "Arrived at regional facility", location: "Newark, NJ" },
      { time: "08-03 11:12", title: "干线运输", detail: "Departed from origin airport", location: "Los Angeles, CA" },
      { time: "08-01 14:36", title: "物流商揽收", detail: "Shipment picked up", location: "Ontario, CA" },
      { time: "08-01 09:42", title: "仓库签出", detail: "包裹从 USKY3 仓库签出" },
    ],
  },
  {
    id: "ALT-260812-085", type: "轨迹停滞3天", risk: "高", state: "预警中",
    fulfillmentNo: "F26080400916", orderNo: "LM-5836721", platform: "TikTok Shop", trackingNo: "GFUS260804993028",
    carrier: "GOFO", channel: "美西5日达", team: "北美二组", warehouse: "USWC2", destination: "美国", region: "California", postcode: "94107",
    shippedAt: "2026-08-04 16:18", triggeredAt: "今天 06:15", duration: "停滞3天 7小时", lastEvent: "In transit to next facility", lastEventAt: "08-08 23:15",
    triggerReason: "最后一个有效移动节点距当前超过72小时，期间无新的承运商轨迹。",
    diagnosis: "轨迹停留在州内转运阶段，同渠道历史P90停滞时长为39小时，当前已显著偏离。",
    events: [
      { time: "08-08 23:15", title: "运输至下一站", detail: "In transit to next facility", location: "Stockton, CA", abnormal: true },
      { time: "08-07 08:12", title: "离开分拨中心", detail: "Departed sort facility", location: "Los Angeles, CA" },
      { time: "08-05 03:20", title: "物流商揽收", detail: "Picked up by carrier", location: "Ontario, CA" },
      { time: "08-04 16:18", title: "仓库签出", detail: "包裹从 USWC2 仓库签出" },
    ],
  },
  {
    id: "ALT-260812-081", type: "超时未上网", risk: "高", state: "预警中",
    fulfillmentNo: "F26080900311", orderNo: "LM-5841028", platform: "Shopify US", trackingNo: "3PE260809412095",
    carrier: "3PE EXPRESS", channel: "Luvme Express", team: "北美一组", warehouse: "WH01", destination: "美国", region: "Texas", postcode: "75201",
    shippedAt: "2026-08-09 08:30", triggeredAt: "今天 02:00", duration: "等待3天 2小时", lastEvent: "Shipping label created", lastEventAt: "08-09 10:02",
    triggerReason: "ERP签出后超过48小时，仅存在InfoReceived预报轨迹，未出现InTransit_PickedUp。",
    diagnosis: "订单已完成仓库签出，但物流商尚未确认实物揽收，建议核对交接批次与扫描记录。",
    events: [
      { time: "08-09 10:02", title: "收到预报信息", detail: "Shipping label created", abnormal: true },
      { time: "08-09 08:30", title: "仓库签出", detail: "包裹从 WH01 仓库签出" },
    ],
  },
  {
    id: "ALT-260812-078", type: "派送失败", risk: "高", state: "持续监控",
    fulfillmentNo: "F26080500622", orderNo: "LM-5837904", platform: "Amazon US", trackingNo: "1LS260805009127",
    carrier: "OnTrac", channel: "美西3日达", team: "北美二组", warehouse: "USWC2", destination: "美国", region: "Nevada", postcode: "89109",
    shippedAt: "2026-08-05 12:17", triggeredAt: "昨天 17:45", duration: "第2次派送失败", lastEvent: "Delivery attempted - incorrect address", lastEventAt: "昨天 17:42",
    triggerReason: "检测到DeliveryFailure结构化状态，失败原因归类为地址信息不完整。",
    diagnosis: "连续两次派送失败，最新失败原因一致；当前包裹仍处于末端派送站，继续追踪后续重派或退回。",
    events: [
      { time: "昨天 17:42", title: "派送失败", detail: "Incorrect or incomplete address", location: "Las Vegas, NV", abnormal: true },
      { time: "昨天 09:10", title: "派送途中", detail: "Out for delivery", location: "Las Vegas, NV" },
      { time: "08-09 22:06", title: "到达派送站", detail: "Arrived at delivery facility", location: "Las Vegas, NV" },
      { time: "08-09 15:21", title: "首次派送失败", detail: "Recipient unavailable", location: "Las Vegas, NV", abnormal: true },
    ],
  },
  {
    id: "ALT-260812-074", type: "海关停留超时", risk: "中", state: "持续监控",
    fulfillmentNo: "F26080300176", orderNo: "LM-5835620", platform: "Shopify UK", trackingNo: "YT260803881729",
    carrier: "云途物流", channel: "英国专线", team: "欧洲组", warehouse: "JY01", destination: "英国", region: "England", postcode: "SW1A 1AA",
    shippedAt: "2026-08-03 15:42", triggeredAt: "昨天 23:12", duration: "海关停留2天 9小时", lastEvent: "Customs clearance processing", lastEventAt: "08-09 23:11",
    triggerReason: "进入CustomsProcessing后超过48小时未出现CustomsReleased或ClearanceCompleted。",
    diagnosis: "该目的国同渠道近30天平均清关时长21小时，当前时长位于P95以上，疑似查验或资料缺失。",
    events: [
      { time: "08-09 23:11", title: "海关处理中", detail: "Customs clearance processing", location: "Heathrow, GB", abnormal: true },
      { time: "08-09 18:25", title: "到达目的国", detail: "Arrived at destination airport", location: "London, GB" },
      { time: "08-07 03:40", title: "国际运输", detail: "Departed from origin airport", location: "Shenzhen, CN" },
    ],
  },
  {
    id: "ALT-260812-071", type: "7天未妥投", risk: "中", state: "预警中",
    fulfillmentNo: "F26080400328", orderNo: "LM-5836104", platform: "Shopify CA", trackingNo: "DHL260804661327",
    carrier: "DHL", channel: "加拿大标准", team: "北美一组", warehouse: "WH01", destination: "加拿大", region: "Ontario", postcode: "M5V 3A8",
    shippedAt: "2026-08-04 11:28", triggeredAt: "今天 11:30", duration: "7天 1小时", lastEvent: "Processed at transit facility", lastEventAt: "昨天 04:18",
    triggerReason: "签出后超过168小时仍无Delivered轨迹，当前未达到10天升级阈值。",
    diagnosis: "包裹已到达目的国，处于省内转运环节，轨迹仍有更新，主要风险为渠道时效超标。",
    events: [
      { time: "昨天 04:18", title: "目的国转运", detail: "Processed at transit facility", location: "Hamilton, ON", abnormal: true },
      { time: "08-09 07:26", title: "清关放行", detail: "Customs clearance completed", location: "Toronto, ON" },
      { time: "08-08 23:13", title: "到达目的国", detail: "Arrived at destination facility", location: "Toronto, ON" },
    ],
  },
  {
    id: "ALT-260812-066", type: "轨迹停滞3天", risk: "高", state: "已恢复",
    fulfillmentNo: "F26080200812", orderNo: "LM-5834482", platform: "Amazon CA", trackingNo: "DHL260802661834",
    carrier: "DHL", channel: "加拿大标准", team: "北美一组", warehouse: "WH01", destination: "加拿大", region: "Ontario", postcode: "M5V 3A8",
    shippedAt: "2026-08-02 13:58", triggeredAt: "昨天 14:00", duration: "停滞已恢复", lastEvent: "Delivered", lastEventAt: "今天 07:28",
    triggerReason: "历史轨迹曾停滞76小时；系统检测到新的Delivered节点后自动恢复。",
    diagnosis: "预警已解除，停滞发生在目的国分拨阶段；本记录保留用于渠道复盘与统计。",
    events: [
      { time: "今天 07:28", title: "已签收", detail: "Delivered", location: "Toronto, ON" },
      { time: "昨天 09:06", title: "派送途中", detail: "With delivery courier", location: "Toronto, ON" },
      { time: "08-07 05:10", title: "停滞前轨迹", detail: "Processed at facility", location: "Toronto, ON", abnormal: true },
    ],
  },
];

const INITIAL_RULES: RuleItem[] = [
  { id: "R-01", name: "超时未上网", description: "仓库签出后未出现真实揽收轨迹", basis: "ERP签出 → InTransit_PickedUp", threshold: 48, unit: "小时", level: "高", enabled: true, hits: 18 },
  { id: "R-02", name: "轨迹停滞3天", description: "最后一个有效移动节点长时间未更新", basis: "最后有效轨迹 → 当前时间", threshold: 72, unit: "小时", level: "高", enabled: true, hits: 31 },
  { id: "R-03", name: "7天未妥投", description: "签出后7天仍无妥投轨迹", basis: "ERP签出 → Delivered", threshold: 7, unit: "天", level: "中", enabled: true, hits: 42 },
  { id: "R-04", name: "10天未妥投", description: "7天预警进一步升级为紧急", basis: "ERP签出 → Delivered", threshold: 10, unit: "天", level: "紧急", enabled: true, hits: 12 },
  { id: "R-05", name: "海关停留超时", description: "进入海关后未出现放行节点", basis: "CustomsProcessing → Released", threshold: 48, unit: "小时", level: "中", enabled: true, hits: 9 },
  { id: "R-06", name: "派送失败", description: "识别物流商派送失败结构化状态", basis: "DeliveryFailure", threshold: 0, unit: "状态", level: "高", enabled: true, hits: 23 },
];

const NAV = [
  { id: "overview", label: "监控总览", icon: LayoutDashboard },
  { id: "alerts", label: "预警中心", icon: BellRing, badge: 112 },
  { id: "diagnosis", label: "轨迹诊断", icon: FileSearch },
  { id: "rules", label: "监控规则", icon: CloudCog },
  { id: "analytics", label: "履约分析", icon: BarChart3 },
];

const riskTone: Record<Risk, string> = { 紧急: "critical", 高: "high", 中: "medium" };
const stateTone: Record<MonitorState, string> = { 预警中: "alert", 持续监控: "watching", 已恢复: "recovered" };

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><div className="header-actions">{actions}</div></div>;
}

function Metric({ label, value, meta, icon: Icon, tone, trend }: { label: string; value: string; meta: string; icon: typeof Activity; tone: string; trend?: string }) {
  return <div className={`metric metric-${tone}`}><div className="metric-top"><span>{label}</span><i><Icon size={18}/></i></div><strong>{value}</strong><div className="metric-meta"><span>{meta}</span>{trend && <b>{trend}</b>}</div></div>;
}

function MonitorHeader({ showToast }: { showToast: (text: string) => void }) {
  return <div className="monitor-header">
    <div className="monitor-live"><i/><div><strong>全链路监控运行中</strong><span>最后扫描 11:45:12 · 用时 4.2 秒</span></div></div>
    <div className="monitor-stat"><span>监控订单</span><strong>12,486</strong></div>
    <div className="monitor-stat"><span>有效规则</span><strong>6</strong></div>
    <div className="monitor-stat"><span>轨迹覆盖率</span><strong>99.2%</strong></div>
    <div className="monitor-stat"><span>数据延迟</span><strong>2.8 min</strong></div>
    <button onClick={() => showToast("已启动全量扫描，结果将自动刷新")}><RefreshCw size={15}/>立即扫描</button>
  </div>;
}

function AlertTable({ items, onOpen, dense = false }: { items: AlertItem[]; onOpen: (item: AlertItem) => void; dense?: boolean }) {
  return <div className="table-scroll"><table className={`alert-table ${dense ? "dense" : ""}`}><thead><tr><th>预警类型</th><th>履约单 / 订单</th><th>物流信息</th><th>触发时长</th><th>最新轨迹</th><th>监控状态</th><th></th></tr></thead><tbody>
    {items.map(item => <tr key={item.id} onClick={() => onOpen(item)}>
      <td><div className="alert-type"><i className={riskTone[item.risk]}/><div><strong>{item.type}</strong><span>{item.id}</span></div></div></td>
      <td><div className="cell-stack"><strong>{item.fulfillmentNo}</strong><span>{item.orderNo} · {item.platform}</span></div></td>
      <td><div className="cell-stack"><strong>{item.carrier} · {item.channel}</strong><span>{item.trackingNo}</span></div></td>
      <td><div className="duration-cell"><strong>{item.duration}</strong><span>签出 {item.shippedAt.split(" ")[0]}</span></div></td>
      <td><div className="cell-stack latest"><strong>{item.lastEvent}</strong><span>{item.lastEventAt}</span></div></td>
      <td><Badge tone={stateTone[item.state]}>{item.state}</Badge></td>
      <td><button className="row-open" aria-label={`查看${item.id}`}><ChevronRight size={16}/></button></td>
    </tr>)}
  </tbody></table></div>;
}

function Overview({ alerts, onOpen, onNavigate, showToast }: { alerts: AlertItem[]; onOpen: (item: AlertItem) => void; onNavigate: (id: string) => void; showToast: (text: string) => void }) {
  return <>
    <PageHeader eyebrow="FULFILLMENT MONITORING COCKPIT" title="履约监控驾驶舱" description="实时识别履约链路中的上网、轨迹、时效、海关与派送风险" actions={<><button className="btn secondary"><CalendarDays size={15}/>近30天</button><button className="btn primary" onClick={() => onNavigate("alerts")}><BellRing size={15}/>查看全部预警</button></>}/>
    <MonitorHeader showToast={showToast}/>
    <div className="metrics-grid">
      <Metric label="活跃预警" value="112" meta="涉及98个履约单" icon={AlertTriangle} tone="red" trend="↓ 8.6%"/>
      <Metric label="超时未上网" value="18" meta="平均等待2.7天" icon={PackageSearch} tone="orange"/>
      <Metric label="轨迹停滞" value="31" meta="6个超过5天" icon={TimerReset} tone="purple"/>
      <Metric label="7 / 10天未妥投" value="54" meta="10天以上12个" icon={Clock3} tone="blue"/>
      <Metric label="海关 / 派送异常" value="22" meta="较昨日新增4个" icon={Globe2} tone="yellow"/>
      <Metric label="自动恢复率" value="76.8%" meta="近30天无需人工干预" icon={CheckCircle2} tone="green" trend="↑ 3.2%"/>
    </div>

    <div className="overview-grid main-charts">
      <section className="panel trend-panel"><div className="panel-title"><div><h2>预警趋势与恢复</h2><p>最近14天新增预警、活跃预警与自动恢复数量</p></div><div className="legend"><span><i className="l-new"/>新增</span><span><i className="l-active"/>活跃</span><span><i className="l-recovered"/>恢复</span></div></div>
        <div className="trend-chart"><div className="y-axis"><span>60</span><span>45</span><span>30</span><span>15</span><span>0</span></div><div className="trend-plot">{[31,38,34,42,39,48,44,53,46,41,37,35,29,26].map((n,i)=><div className="trend-column" key={i}><div className="bars"><i style={{height:`${n*2}px`}}/><i style={{height:`${(n+10-(i%4)*3)*1.75}px`}}/><i style={{height:`${(n-7+(i%3))*1.5}px`}}/></div><span>{i%2===0?`07/${30+i}`:""}</span></div>)}</div></div>
      </section>
      <section className="panel distribution-panel"><div className="panel-title"><div><h2>异常结构</h2><p>活跃预警按类型分布</p></div><button className="text-btn" onClick={() => onNavigate("alerts")}>明细<ArrowRight size={13}/></button></div>
        <div className="donut-layout"><div className="donut"><div><strong>112</strong><span>活跃预警</span></div></div><div className="donut-legend">{[["7/10天未妥投","48%","blue"],["轨迹停滞","28%","purple"],["超时未上网","16%","orange"],["海关/派送","8%","red"]].map(r=><div key={r[0]}><i className={`dot-${r[2]}`}/><span>{r[0]}</span><strong>{r[1]}</strong></div>)}</div></div>
      </section>
    </div>

    <div className="overview-grid secondary-charts">
      <section className="panel aging-panel"><div className="panel-title"><div><h2>预警老化分布</h2><p>当前预警持续时间区间</p></div><Badge tone="warning">14个超过5天</Badge></div>
        <div className="aging-bars">{[["< 12小时",21,35,"green"],["12—24小时",27,46,"blue"],["1—3天",34,58,"purple"],["3—5天",16,28,"orange"],["> 5天",14,24,"red"]].map(([name,count,width,tone])=><div key={String(name)}><div><span>{name}</span><strong>{count}</strong></div><div className="track"><i className={`fill-${tone}`} style={{width:`${width}%`}}/></div></div>)}</div>
      </section>
      <section className="panel risk-matrix"><div className="panel-title"><div><h2>渠道风险矩阵</h2><p>预警率 × 订单量，气泡越大订单量越高</p></div><select><option>按物流渠道</option><option>按团队</option><option>按仓库</option></select></div>
        <div className="matrix"><span className="axis-y">预警率 ↑</span><span className="axis-x">订单量 →</span><i className="quadrant qv"/><i className="quadrant qh"/>
          <button className="bubble b1"><strong>3PE</strong><span>3.8%</span></button><button className="bubble b2"><strong>SpeedX</strong><span>1.9%</span></button><button className="bubble b3"><strong>GOFO</strong><span>1.4%</span></button><button className="bubble b4"><strong>DHL</strong><span>0.7%</span></button><button className="bubble b5"><strong>云途</strong><span>2.6%</span></button>
        </div>
      </section>
    </div>

    <section className="panel priority-alerts"><div className="panel-title padded"><div><h2>高风险预警</h2><p>按风险等级、持续时长和渠道基线偏离度排序</p></div><button className="text-btn" onClick={() => onNavigate("alerts")}>进入预警中心<ArrowRight size={13}/></button></div><AlertTable items={alerts.filter(a => a.state !== "已恢复").slice(0,5)} onOpen={onOpen} dense/></section>

    <div className="overview-grid bottom-grid">
      <section className="panel dimension-rank"><div className="panel-title"><div><h2>风险维度排行</h2><p>近30天预警率最高的维度</p></div><div className="segmented"><button className="active">渠道</button><button>团队</button><button>仓库</button></div></div>{[["3PE · Luvme Express","3.8%","189 / 4,972"],["云途 · 英国专线","2.6%","41 / 1,576"],["SpeedX · 美西5日达","1.9%","86 / 4,526"],["GOFO · 美东7日达","1.4%","74 / 5,281"]].map((r,i)=><div className="rank-row" key={r[0]}><b>{i+1}</b><div><strong>{r[0]}</strong><span>{r[2]} 单触发</span></div><div className="mini-track"><i style={{width:r[1]}}/></div><strong>{r[1]}</strong></div>)}</section>
      <section className="panel data-quality"><div className="panel-title"><div><h2>监控数据质量</h2><p>数据完整度决定预警准确性</p></div><Badge tone="success"><ShieldCheck size={12}/>健康</Badge></div>{[["ERP履约单匹配率","99.8%","12,461 / 12,486"],["物流轨迹覆盖率","99.2%","12,386 / 12,486"],["PICK UP节点识别率","96.4%","结构化状态优先"],["目的州/邮编完整率","94.1%","缺失736单"]].map(([a,b,c])=><div className="quality-row" key={a}><div><strong>{a}</strong><span>{c}</span></div><b>{b}</b><div className="quality-track"><i style={{width:b}}/></div></div>)}</section>
    </div>
  </>;
}

function AlertsPage({ alerts, onOpen }: { alerts: AlertItem[]; onOpen: (item: AlertItem) => void }) {
  const [query,setQuery]=useState(""); const [type,setType]=useState("全部预警"); const [state,setState]=useState("活跃预警"); const [risk,setRisk]=useState("全部风险");
  const filtered=alerts.filter(a => (!query || [a.fulfillmentNo,a.orderNo,a.trackingNo,a.carrier].join(" ").toLowerCase().includes(query.toLowerCase())) && (type==="全部预警" || a.type===type) && (risk==="全部风险" || a.risk===risk) && (state==="全部状态" || (state==="活跃预警" ? a.state!=="已恢复" : a.state===state)));
  return <>
    <PageHeader eyebrow="ALERT MONITORING CENTER" title="履约预警中心" description="集中查看所有规则命中的订单、触发原因与最新轨迹变化" actions={<><button className="btn secondary"><Download size={15}/>导出当前结果</button><button className="btn primary"><Eye size={15}/>重点关注列表</button></>}/>
    <div className="alert-stats">{[["活跃预警","112","red"],["今日新增","26","orange"],["持续监控","48","purple"],["今日恢复","21","green"],["5天以上","14","critical"]].map(([a,b,c])=><div key={a} className={`alert-stat stat-${c}`}><span>{a}</span><strong>{b}</strong></div>)}</div>
    <section className="panel alert-center"><div className="alert-tabs">{["全部预警","超时未上网","轨迹停滞3天","7天未妥投","10天未妥投","海关停留超时","派送失败"].map(t=><button key={t} className={type===t?"active":""} onClick={()=>setType(t)}>{t}{t==="全部预警"&&<b>112</b>}</button>)}</div>
      <div className="filters"><div className="search"><Search size={15}/><input aria-label="搜索预警" value={query} onChange={e=>setQuery(e.target.value)} placeholder="履约单、订单号、运单号、物流商..."/></div><select value={state} onChange={e=>setState(e.target.value)}><option>活跃预警</option><option>预警中</option><option>持续监控</option><option>已恢复</option><option>全部状态</option></select><select value={risk} onChange={e=>setRisk(e.target.value)}><option>全部风险</option><option>紧急</option><option>高</option><option>中</option></select><select><option>全部物流商</option><option>GOFO</option><option>SpeedX</option><option>3PE EXPRESS</option></select><select><option>签出日期 · 近30天</option></select><button><Filter size={14}/>更多</button><span>{filtered.length} 条</span></div>
      <AlertTable items={filtered} onOpen={onOpen}/>{filtered.length===0&&<div className="empty"><Search size={24}/><strong>没有匹配的预警</strong><span>尝试调整搜索或筛选条件</span></div>}
      <div className="pagination"><span>显示 1—{filtered.length} 条，共112条</span><div><button disabled>上一页</button><button className="active">1</button><button>2</button><button>3</button><button>下一页</button></div></div>
    </section>
  </>;
}

function DiagnosisPage({ alerts, onOpen, showToast }: { alerts: AlertItem[]; onOpen: (item: AlertItem) => void; showToast:(text:string)=>void }) {
  const [tracking,setTracking]=useState("SPXJFK2607318452"); const [result,setResult]=useState<AlertItem|null>(alerts[0]); const [loading,setLoading]=useState(false);
  const run=()=>{setLoading(true);setTimeout(()=>{setLoading(false);setResult(alerts.find(a=>a.trackingNo.toLowerCase()===tracking.toLowerCase())||alerts[1]);showToast("诊断完成：已检查6类监控规则和全部轨迹节点")},700)};
  return <>
    <PageHeader eyebrow="TRACK DIAGNOSTICS" title="轨迹诊断" description="输入运单号，快速还原履约节点、计算停滞区间并解释预警原因" actions={<button className="btn secondary"><Download size={15}/>批量诊断模板</button>}/>
    <section className="diagnosis-search"><div><Search size={18}/><input value={tracking} onChange={e=>setTracking(e.target.value)} placeholder="输入运单号或履约单号" onKeyDown={e=>{if(e.key==="Enter")run()}}/></div><button className="btn primary" onClick={run} disabled={loading}>{loading?<><RefreshCw className="spin" size={15}/>分析中</>:<><Radar size={15}/>开始诊断</>}</button><span>支持17TRACK已注册运单</span></section>
    {result&&<>
      <div className="diagnosis-summary">
        <div className="diag-order"><div className="carrier-logo"><Truck size={21}/></div><div><span>{result.carrier} · {result.channel}</span><strong>{result.trackingNo}</strong><small>{result.fulfillmentNo} · {result.orderNo}</small></div></div>
        <div><span>当前状态</span><Badge tone={stateTone[result.state]}>{result.state}</Badge></div><div><span>签出至今</span><strong>{result.duration.replace("停滞","")}</strong></div><div><span>最新轨迹</span><strong>{result.lastEventAt}</strong></div><button className="btn secondary" onClick={()=>onOpen(result)}>查看完整详情<ChevronRight size={14}/></button>
      </div>
      <div className="diagnosis-grid">
        <section className="panel diagnostic-card"><div className="panel-title"><div><h2>规则诊断结果</h2><p>已检查全部6条启用规则</p></div><Badge tone="danger">命中2条</Badge></div>
          <div className="diagnostic-result hit"><div><AlertTriangle size={19}/></div><section><span>命中 · {result.type}</span><strong>{result.triggerReason}</strong><p>{result.diagnosis}</p></section><Badge tone={riskTone[result.risk]}>{result.risk}</Badge></div>
          {[["超时未上网","已检测到PICK UP节点","pass"],["海关停留超时","未处于海关环节","pass"],["派送失败","未检测到DeliveryFailure","pass"],["数据完整性","关键字段完整，轨迹覆盖正常","pass"]].map(([a,b,c])=><div className={`diagnostic-result ${c}`} key={a}><div><CheckCircle2 size={18}/></div><section><span>{a}</span><strong>{b}</strong></section><Badge tone="success">未命中</Badge></div>)}
        </section>
        <section className="panel baseline-card"><div className="panel-title"><div><h2>渠道基线对比</h2><p>{result.channel} · {result.destination}</p></div><Badge tone="warning">显著偏离</Badge></div>
          <div className="baseline-main"><div><span>当前履约时长</span><strong>10.8<small>天</small></strong></div><div className="baseline-scale"><i className="safe"/><i className="warn"/><i className="danger"/><span className="marker" style={{left:"82%"}}><b>当前</b></span></div><div className="scale-labels"><span>P50 4.2天</span><span>P90 6.1天</span><span>P95 7.3天</span></div></div>
          <div className="baseline-facts">{[["同渠道样本","2,418单"],["7天达成率","93.7%"],["当前分位","P99+"],["超出P90","4.7天"]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div>
        </section>
      </div>
      <section className="panel journey-card"><div className="panel-title padded"><div><h2>履约节点诊断</h2><p>ERP节点与物流轨迹合并；红色区间为异常停滞</p></div><div className="journey-legend"><span><i className="done"/>已完成</span><span><i className="abnormal"/>异常区间</span><span><i className="pending"/>未发生</span></div></div>
        <div className="journey">{result.events.slice().reverse().map((e,i)=><div className={`journey-node ${e.abnormal?"abnormal":"done"}`} key={e.time}><div className="journey-line"><i>{e.abnormal?<AlertTriangle size={13}/>:<Check size={13}/>}</i></div><strong>{e.title}</strong><span>{e.time}</span><small>{e.location||e.detail}</small>{e.abnormal&&<b>停滞 {result.type.includes("10天")?"65小时":"79小时"}</b>}</div>)}<div className="journey-node pending"><div className="journey-line"><i><CircleDot size={12}/></i></div><strong>派送</strong><span>待发生</span></div><div className="journey-node pending"><div className="journey-line"><i><PackageCheck size={12}/></i></div><strong>妥投</strong><span>待发生</span></div></div>
      </section>
    </>}
  </>;
}

function RulesPage({ rules, setRules, showToast }: { rules: RuleItem[]; setRules: React.Dispatch<React.SetStateAction<RuleItem[]>>; showToast:(text:string)=>void }) {
  return <>
    <PageHeader eyebrow="MONITORING RULE ENGINE" title="监控规则配置" description="统一定义监控起点、结构化轨迹终点、阈值与自动恢复条件" actions={<><button className="btn secondary" onClick={()=>showToast("规则回放完成：近30天预计命中135个履约单")}><Activity size={15}/>历史回放</button><button className="btn primary" onClick={()=>showToast("规则已保存，将在下一轮扫描生效")}><Check size={15}/>保存配置</button></>}/>
    <MonitorHeader showToast={showToast}/>
    <div className="rule-summary"><div><Gauge size={22}/><section><strong>6条监控规则</strong><span>全部启用，覆盖上网、轨迹、时效、海关和派送环节</span></section></div><div><span>近30天命中</span><strong>135</strong></div><div><span>自动恢复</span><strong>76.8%</strong></div><div><span>误报反馈</span><strong>1.2%</strong></div></div>
    <section className="panel rules-panel"><div className="rules-header"><div><h2>确定性监控规则</h2><p>优先使用17TRACK结构化状态，关键词仅作为兼容回退</p></div><button className="btn secondary"><Settings2 size={15}/>扫描频率 · 15分钟</button></div>
      <div className="rules-table"><div className="rule-row rule-head"><span>状态</span><span>规则与监控口径</span><span>触发阈值</span><span>风险级别</span><span>近30天命中</span><span></span></div>{rules.map(rule=><div className={`rule-row ${!rule.enabled?"disabled":""}`} key={rule.id}>
        <button aria-label={`${rule.name}开关`} className={`switch ${rule.enabled?"on":""}`} onClick={()=>setRules(prev=>prev.map(r=>r.id===rule.id?{...r,enabled:!r.enabled}:r))}><i/></button>
        <div className="rule-name"><div className={`rule-icon ${riskTone[rule.level]}`}>{rule.name.includes("上网")?<PackageSearch size={17}/>:rule.name.includes("停滞")?<TimerReset size={17}/>:rule.name.includes("海关")?<Globe2 size={17}/>:rule.name.includes("派送")?<Truck size={17}/>:<Clock3 size={17}/>}</div><section><strong>{rule.name}</strong><p>{rule.description}</p><span>{rule.basis}</span></section></div>
        <div className="threshold">{rule.unit==="状态"?<strong>状态触发</strong>:<><input type="number" value={rule.threshold} onChange={e=>setRules(prev=>prev.map(r=>r.id===rule.id?{...r,threshold:Number(e.target.value)}:r))}/><span>{rule.unit}</span></>}</div>
        <Badge tone={riskTone[rule.level]}>{rule.level}</Badge><div className="hit-count"><strong>{rule.hits}</strong><span>个履约单</span></div><button className="more"><SlidersHorizontal size={16}/></button>
      </div>)}</div>
    </section>
    <div className="rules-bottom"><section className="panel"><div className="panel-title"><div><h2>节点识别口径</h2><p>关键履约节点的唯一判定标准</p></div></div>{[["签出","ERP checkout_time","不回退到物流商时间"],["真实上网","InTransit_PickedUp","InfoReceived不计入"],["进入海关","CustomsProcessing / Held","记录首次进入时间"],["海关放行","CustomsReleased / ClearanceCompleted","出现后自动恢复"],["妥投","Delivered主状态","使用首次妥投时间"]].map(r=><div className="mapping-row" key={r[0]}><strong>{r[0]}</strong><code>{r[1]}</code><span>{r[2]}</span></div>)}</section><section className="panel"><div className="panel-title"><div><h2>自动恢复策略</h2><p>后续轨迹变化后自动解除预警</p></div></div>{[["超时未上网","出现PICK UP节点"],["轨迹停滞","出现新的有效移动轨迹"],["7/10天未妥投","出现Delivered节点"],["海关停留","出现海关放行节点"],["派送失败","后续妥投或退回终态"]].map(r=><div className="recover-row" key={r[0]}><CheckCircle2 size={15}/><div><strong>{r[0]}</strong><span>{r[1]}</span></div></div>)}</section></div>
  </>;
}

function AnalyticsPage() {
  const [dimension,setDimension]=useState("物流渠道"); const [days,setDays]=useState(7); const rate=days<=3?"54.2%":days<=5?"81.6%":days<=7?"93.8%":"97.1%";
  const rows=[["GOFO · 美东7日达","2,418","93.7%","4.2天","6.1天","1.4%"],["SpeedX · 美西5日达","1,864","95.1%","3.8天","5.4天","1.1%"],["3PE · Luvme Express","936","89.4%","5.1天","7.8天","3.8%"],["DHL · 全球快递","722","97.2%","2.9天","4.0天","0.7%"],["云途 · 英国专线","614","92.6%","4.8天","6.9天","2.6%"]];
  return <>
    <PageHeader eyebrow="FULFILLMENT PERFORMANCE ANALYTICS" title="履约时效分析" description="从团队、仓库、渠道、国家、州和邮编下钻履约达成与预警表现" actions={<button className="btn secondary"><Download size={15}/>导出分析报告</button>}/>
    <div className="analysis-filters"><div><label>分析维度</label><select value={dimension} onChange={e=>setDimension(e.target.value)}>{["团队","发货仓","目的仓","物流渠道","国家","州","邮编"].map(v=><option key={v}>{v}</option>)}</select></div><div><label>自定义达成率</label><div className="n-days"><input type="number" min={1} max={30} value={days} onChange={e=>setDays(Number(e.target.value))}/><span>天达成率</span></div></div><div><label>时间口径</label><select><option>签出日期 · 近30天</option><option>创建日期 · 近30天</option></select></div><div><label>订单成熟度</label><select><option>仅统计已成熟订单</option></select></div><div><label>国家</label><select><option>全部国家</option><option>美国</option><option>英国</option><option>加拿大</option></select></div><button className="btn primary"><Filter size={15}/>应用</button></div>
    <div className="metrics-grid analytics-metrics"><Metric label={`${days}天达成率`} value={rate} meta="成熟订单6,842单" icon={PackageCheck} tone="green" trend="↑ 2.4%"/><Metric label="平均妥投时效" value="4.3天" meta="较上期缩短0.4天" icon={Clock3} tone="blue"/><Metric label="P90妥投时效" value="6.8天" meta="目标不超过7天" icon={Gauge} tone="purple"/><Metric label="预警发生率" value="1.8%" meta="142 / 7,821单" icon={AlertTriangle} tone="red" trend="↓ 0.3%"/><Metric label="真实上网率" value="98.6%" meta="48小时内PICK UP" icon={PackageSearch} tone="orange"/><Metric label="轨迹完整率" value="99.2%" meta="可分析订单12,386单" icon={Activity} tone="yellow"/></div>
    <div className="analysis-grid"><section className="panel rate-trend"><div className="panel-title"><div><h2>{days}天达成率趋势</h2><p>按签出批次，仅统计已达到{days}天观察窗口的订单</p></div><Badge tone="success">当前 {rate}</Badge></div><div className="line-chart"><div className="line-y"><span>100%</span><span>95%</span><span>90%</span><span>85%</span><span>80%</span></div><div className="line-plot"><i className="goal-line"><b>目标 92%</b></i>{[88,90,89,92,93,91,94,95,93,94,96,94].map((v,i)=><div className="line-point" key={i} style={{left:`${i*8.8}%`,bottom:`${(v-80)*5}%`}}><i/><span/></div>)}<div className="line-x"><span>07/14</span><span>07/21</span><span>07/28</span><span>08/04</span><span>08/11</span></div></div></div></section>
      <section className="panel alert-rate"><div className="panel-title"><div><h2>{dimension}预警率</h2><p>预警订单 / 有效履约订单</p></div></div>{rows.map((r,i)=><div className="comparison-row" key={r[0]}><div><strong>{r[0]}</strong><span>{r[1]}单</span></div><div className="comparison-track"><i style={{width:`${Math.max(18,100-i*13)}%`}}/></div><b className={Number(r[5].replace("%",""))>3?"bad":""}>{r[5]}</b></div>)}</section></div>
    <div className="analysis-grid second"><section className="panel stage-performance"><div className="panel-title"><div><h2>履约阶段时效</h2><p>各阶段平均用时与P90用时</p></div></div>{[["仓库签出 → PICK UP","6.4h","18.2h","正常"],["PICK UP → 出境","1.2天","2.4天","正常"],["国际运输","2.1天","3.8天","正常"],["目的国清关","21h","49h","关注"],["末端派送","1.3天","2.6天","正常"]].map(r=><div className="stage-row" key={r[0]}><strong>{r[0]}</strong><div><span>平均</span><b>{r[1]}</b></div><div><span>P90</span><b>{r[2]}</b></div><Badge tone={r[3]==="正常"?"success":"warning"}>{r[3]}</Badge></div>)}</section>
      <section className="panel geo-risk"><div className="panel-title"><div><h2>区域预警热度</h2><p>按目的州与邮编聚合</p></div><select><option>美国 · 州</option><option>英国 · 地区</option></select></div><div className="geo-grid">{[["CA","1.2%","low"],["TX","2.1%","mid"],["NY","3.8%","high"],["FL","2.9%","mid-high"],["WA","1.6%","low"],["NV","4.2%","high"],["NJ","3.1%","mid-high"],["IL","1.8%","mid"]].map(r=><button key={r[0]} className={`geo-cell ${r[2]}`}><strong>{r[0]}</strong><span>{r[1]}</span></button>)}</div><div className="geo-legend"><span>低</span><i/><i/><i/><i/><span>高</span></div></section></div>
    <section className="panel detail-analysis"><div className="panel-title padded"><div><h2>{dimension}明细分析</h2><p>点击指标可进一步查看命中预警的订单</p></div><button className="text-btn"><Settings2 size={13}/>配置列</button></div><table><thead><tr><th>{dimension}</th><th>有效订单</th><th>{days}天达成率</th><th>平均时效</th><th>P90时效</th><th>预警率</th><th>趋势</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r[0]}>{r.map((c,j)=><td key={j}>{j===0?<strong>{c}</strong>:j===2?<Badge tone={Number(c.replace("%",""))>=93?"success":"warning"}>{c}</Badge>:c}</td>)}<td><span className={i===2?"down":"up"}>{i===2?<><ArrowDown size={12}/>1.4%</>:<><ArrowUp size={12}/>2.1%</>}</span></td></tr>)}</tbody></table></section>
  </>;
}

function AlertDrawer({ item, onClose, showToast }: { item: AlertItem; onClose:()=>void; showToast:(text:string)=>void }) {
  const [focused,setFocused]=useState(false);
  return <div className="drawer-mask" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><aside className="drawer"><div className="drawer-head"><div><div><i className={riskTone[item.risk]}/><h2>{item.type}</h2><Badge tone={riskTone[item.risk]}>{item.risk}风险</Badge></div><p>{item.id} · 触发于 {item.triggeredAt}</p></div><button onClick={onClose}><X size={19}/></button></div>
    <div className="drawer-toolbar"><Badge tone={stateTone[item.state]}>{item.state}</Badge><span>系统每15分钟持续检查后续轨迹</span><button className={`focus-btn ${focused?"active":""}`} onClick={()=>{setFocused(!focused);showToast(focused?"已移出重点关注":"已加入重点关注")}}><Eye size={14}/>{focused?"已关注":"重点关注"}</button><button onClick={()=>showToast("轨迹诊断报告已生成")}><Download size={14}/>导出诊断</button></div>
    <div className="drawer-body"><section className="diagnosis-block"><div><AlertTriangle size={19}/><strong>规则命中说明</strong></div><p>{item.triggerReason}</p><div className="diagnosis-insight"><Radar size={17}/><span>{item.diagnosis}</span></div></section>
      <section className="drawer-section"><div className="section-head"><h3>履约与物流信息</h3><span>数据更新时间 2分钟前</span></div><div className="info-grid">{[["履约单号",item.fulfillmentNo],["订单号",item.orderNo],["销售平台",item.platform],["运单号",item.trackingNo],["物流商",item.carrier],["物流渠道",item.channel],["团队",item.team],["发货仓",item.warehouse],["目的地",`${item.destination} · ${item.region}`],["邮编",item.postcode],["签出时间",item.shippedAt],["预警持续",item.duration]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div></section>
      <section className="drawer-section"><div className="section-head"><h3>完整轨迹时间线</h3><Badge tone="neutral">{item.events.length}个有效节点</Badge></div><div className="timeline">{item.events.map((e,i)=><div className={`event ${e.abnormal?"abnormal":""}`} key={e.time+e.title}><div className="event-line"><i>{i===0?<CircleDot size={14}/>:<span/>}</i></div><time>{e.time}</time><div><strong>{e.title}{e.abnormal&&<Badge tone="danger">异常区间起点</Badge>}</strong><p>{e.detail}</p>{e.location&&<span><MapPin size={12}/>{e.location}</span>}</div></div>)}</div></section>
      <section className="drawer-section"><div className="section-head"><h3>监控检查记录</h3><span>自动生成</span></div>{[["11:45","轨迹未更新，预警继续保持",false],["11:30","未检测到恢复条件",false],["08:02",`首次命中“${item.type}”规则`,true]].map(r=><div className="scan-row" key={String(r[0])}><i className={r[2]?"hit":""}/><time>{r[0]}</time><span>{r[1]}</span></div>)}</section>
    </div></aside></div>;
}

export default function Home() {
  const [active,setActive]=useState("overview"); const [selected,setSelected]=useState<AlertItem|null>(null); const [rules,setRules]=useState(INITIAL_RULES); const [toast,setToast]=useState("");
  const showToast=(text:string)=>{setToast(text);setTimeout(()=>setToast(""),2400)};
  const content=useMemo(()=>{
    if(active==="overview") return <Overview alerts={ALERTS} onOpen={setSelected} onNavigate={setActive} showToast={showToast}/>;
    if(active==="alerts") return <AlertsPage alerts={ALERTS} onOpen={setSelected}/>;
    if(active==="diagnosis") return <DiagnosisPage alerts={ALERTS} onOpen={setSelected} showToast={showToast}/>;
    if(active==="rules") return <RulesPage rules={rules} setRules={setRules} showToast={showToast}/>;
    return <AnalyticsPage/>;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[active,rules]);
  return <div className="shell"><aside className="sidebar"><div className="brand"><div><Radar size={22}/></div><section><strong>履约雷达</strong><span>FULFILLMENT RADAR</span></section></div><nav>{NAV.map(({id,label,icon:Icon,badge})=><button key={id} onClick={()=>setActive(id)} className={active===id?"active":""}><Icon size={18}/><span>{label}</span>{badge&&<b>{badge}</b>}</button>)}</nav><div className="side-label">监控状态</div><div className="side-health"><div><i/><section><strong>实时扫描正常</strong><span>12,486个订单</span></section></div><div><span>ERP数据</span><b>正常</b></div><div><span>物流轨迹</span><b>正常</b></div><div><span>规则引擎</span><b>正常</b></div></div><button className="side-setting" onClick={()=>showToast("数据源与扫描设置运行正常")}><Settings2 size={17}/><span>监控设置</span><ChevronRight size={14}/></button><div className="profile"><span>Z</span><section><strong>张敏</strong><small>履约运营经理</small></section><ChevronDown size={14}/></div></aside>
    <main><header className="topbar"><div><span>履约监控</span><ChevronRight size={12}/><strong>{NAV.find(n=>n.id===active)?.label}</strong></div><section><div className="global-search"><Search size={14}/><span>搜索履约单或运单</span><kbd>⌘ K</kbd></div><button><BellRing size={17}/><i>3</i></button><button className="help">?</button></section></header><div className="content">{content}</div></main>
    {selected&&<AlertDrawer item={selected} onClose={()=>setSelected(null)} showToast={showToast}/>} {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}
