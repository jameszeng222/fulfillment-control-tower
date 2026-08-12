"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock3,
  CloudCog,
  FileText,
  Filter,
  Globe2,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageSquareText,
  MoreHorizontal,
  PackageCheck,
  PackageSearch,
  Paperclip,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  Sparkles,
  TimerReset,
  Truck,
  UserRound,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type CaseStatus = "待跟进" | "已跟进" | "处理中" | "等待外部" | "已解决";
type Severity = "紧急" | "高" | "中" | "低";
type Department = "物流部" | "客服部" | "物流部 · 客服部";

type TrackingEvent = {
  time: string;
  title: string;
  description: string;
  location?: string;
  abnormal?: boolean;
};

type CaseItem = {
  id: string;
  type: string;
  severity: Severity;
  status: CaseStatus;
  department: Department;
  assignee: string;
  fulfillmentNo: string;
  orderNo: string;
  platform: string;
  trackingNo: string;
  carrier: string;
  channel: string;
  warehouse: string;
  country: string;
  state: string;
  postcode: string;
  shippedAt: string;
  waiting: string;
  lastEvent: string;
  lastEventAt: string;
  createdAt: string;
  summary: string;
  source: string;
  notes: { author: string; time: string; text: string }[];
  events: TrackingEvent[];
};

type RuleItem = {
  id: string;
  name: string;
  description: string;
  threshold: number;
  unit: "小时" | "天";
  department: Department;
  severity: Severity;
  enabled: boolean;
  hits: number;
};

const MOCK_CASES: CaseItem[] = [
  {
    id: "EXP-260812-086",
    type: "10天未妥投",
    severity: "紧急",
    status: "待跟进",
    department: "物流部 · 客服部",
    assignee: "待认领",
    fulfillmentNo: "F26073100482",
    orderNo: "LM-5831049",
    platform: "Shopify US",
    trackingNo: "SPXJFK2607318452",
    carrier: "SpeedX",
    channel: "美东7日达",
    warehouse: "USKY3",
    country: "美国",
    state: "New York",
    postcode: "10013",
    shippedAt: "2026-08-01 09:42",
    waiting: "10天 18小时",
    lastEvent: "Departed from regional facility",
    lastEventAt: "2026-08-08 18:20",
    createdAt: "今天 08:02",
    summary: "发货已超过10天仍未妥投，且轨迹已停滞3天。建议升级物流商并由客服主动联系客户。",
    source: "规则引擎",
    notes: [{ author: "系统", time: "今天 08:02", text: "7天未妥投工单自动升级为10天未妥投。" }],
    events: [
      { time: "08-08 18:20", title: "中转离港", description: "Departed from regional facility", location: "Newark, NJ", abnormal: true },
      { time: "08-08 03:45", title: "到达分拨中心", description: "Arrived at regional facility", location: "Newark, NJ" },
      { time: "08-03 11:12", title: "干线运输", description: "Departed from origin airport", location: "Los Angeles, CA" },
      { time: "08-01 14:36", title: "已揽收", description: "Shipment picked up", location: "Ontario, CA" },
      { time: "08-01 09:42", title: "仓库签出", description: "订单从 USKY3 仓库签出" },
    ],
  },
  {
    id: "EXP-260812-085",
    type: "轨迹停滞3天",
    severity: "高",
    status: "已跟进",
    department: "物流部",
    assignee: "陈可",
    fulfillmentNo: "F26080400916",
    orderNo: "LM-5836721",
    platform: "TikTok Shop",
    trackingNo: "GFUS260804993028",
    carrier: "GOFO",
    channel: "美西5日达",
    warehouse: "USWC2",
    country: "美国",
    state: "California",
    postcode: "94107",
    shippedAt: "2026-08-04 16:18",
    waiting: "3天 7小时",
    lastEvent: "In transit to next facility",
    lastEventAt: "2026-08-08 23:15",
    createdAt: "今天 06:15",
    summary: "最后有效移动轨迹超过72小时未更新，物流部已向GOFO发起查询。",
    source: "规则引擎",
    notes: [{ author: "陈可", time: "今天 09:18", text: "已提交物流商查询，预计24小时内回复。" }],
    events: [
      { time: "08-08 23:15", title: "运输途中", description: "In transit to next facility", location: "Stockton, CA", abnormal: true },
      { time: "08-07 08:12", title: "离开分拨中心", description: "Departed sort facility", location: "Los Angeles, CA" },
      { time: "08-05 03:20", title: "已揽收", description: "Picked up by carrier", location: "Ontario, CA" },
    ],
  },
  {
    id: "EXP-260812-081",
    type: "超时未上网",
    severity: "高",
    status: "待跟进",
    department: "物流部",
    assignee: "待认领",
    fulfillmentNo: "F26080900311",
    orderNo: "LM-5841028",
    platform: "Shopify US",
    trackingNo: "3PE260809412095",
    carrier: "3PE EXPRESS",
    channel: "Luvme Express",
    warehouse: "WH01",
    country: "美国",
    state: "Texas",
    postcode: "75201",
    shippedAt: "2026-08-09 08:30",
    waiting: "3天 2小时",
    lastEvent: "Shipping label created",
    lastEventAt: "2026-08-09 10:02",
    createdAt: "今天 02:00",
    summary: "仓库签出超过48小时，仅有预报信息，尚未出现物流商PICK UP轨迹。",
    source: "规则引擎",
    notes: [],
    events: [
      { time: "08-09 10:02", title: "收到信息", description: "Shipping label created", abnormal: true },
      { time: "08-09 08:30", title: "仓库签出", description: "订单从 WH01 仓库签出" },
    ],
  },
  {
    id: "EXP-260812-078",
    type: "派送失败",
    severity: "高",
    status: "处理中",
    department: "客服部",
    assignee: "林晓",
    fulfillmentNo: "F26080500622",
    orderNo: "LM-5837904",
    platform: "Amazon US",
    trackingNo: "1LS260805009127",
    carrier: "OnTrac",
    channel: "美西3日达",
    warehouse: "USWC2",
    country: "美国",
    state: "Nevada",
    postcode: "89109",
    shippedAt: "2026-08-05 12:17",
    waiting: "第2次派送",
    lastEvent: "Delivery attempted - incorrect address",
    lastEventAt: "昨天 17:42",
    createdAt: "昨天 17:45",
    summary: "承运商反馈地址信息不完整，客服正在联系收件人确认门牌号。",
    source: "物流轨迹",
    notes: [{ author: "林晓", time: "今天 09:31", text: "已邮件联系客户，并请求补充Apartment信息。" }],
    events: [
      { time: "昨天 17:42", title: "派送失败", description: "Incorrect or incomplete address", location: "Las Vegas, NV", abnormal: true },
      { time: "昨天 09:10", title: "派送途中", description: "Out for delivery", location: "Las Vegas, NV" },
      { time: "08-09 22:06", title: "到达派送站", description: "Arrived at delivery facility", location: "Las Vegas, NV" },
    ],
  },
  {
    id: "EXP-260812-074",
    type: "海关停留超时",
    severity: "中",
    status: "等待外部",
    department: "物流部",
    assignee: "周然",
    fulfillmentNo: "F26080300176",
    orderNo: "LM-5835620",
    platform: "Shopify UK",
    trackingNo: "YT260803881729",
    carrier: "云途物流",
    channel: "英国专线",
    warehouse: "JY01",
    country: "英国",
    state: "England",
    postcode: "SW1A 1AA",
    shippedAt: "2026-08-03 15:42",
    waiting: "海关停留 2天 9小时",
    lastEvent: "Customs clearance processing",
    lastEventAt: "2026-08-09 23:11",
    createdAt: "昨天 23:12",
    summary: "包裹进入海关处理后超过48小时未出现放行节点，正在等待物流商确认是否查验。",
    source: "规则引擎",
    notes: [{ author: "周然", time: "今天 08:44", text: "物流商已确认转关查验，等待海关反馈。" }],
    events: [
      { time: "08-09 23:11", title: "海关处理中", description: "Customs clearance processing", location: "Heathrow, GB", abnormal: true },
      { time: "08-09 18:25", title: "到达目的国", description: "Arrived at destination airport", location: "London, GB" },
      { time: "08-07 03:40", title: "国际运输", description: "Departed from origin airport", location: "Shenzhen, CN" },
    ],
  },
  {
    id: "EXP-260812-069",
    type: "物流破损",
    severity: "高",
    status: "处理中",
    department: "客服部",
    assignee: "苏瑾",
    fulfillmentNo: "F26072900743",
    orderNo: "LM-5828745",
    platform: "Shopify US",
    trackingNo: "GFUS260729083122",
    carrier: "GOFO",
    channel: "美东7日达",
    warehouse: "USKY3",
    country: "美国",
    state: "Florida",
    postcode: "33101",
    shippedAt: "2026-07-29 11:05",
    waiting: "索赔中",
    lastEvent: "Delivered",
    lastEventAt: "2026-08-04 14:26",
    createdAt: "昨天 14:08",
    summary: "客户反馈外包装挤压、商品断裂，已上传3张照片，等待向GOFO提交索赔。",
    source: "客服工单 CS-90142",
    notes: [{ author: "苏瑾", time: "昨天 15:22", text: "照片和客户声明已收齐，正在准备索赔材料。" }],
    events: [
      { time: "08-04 14:26", title: "已签收", description: "Delivered at front door", location: "Miami, FL" },
      { time: "08-04 08:03", title: "派送途中", description: "Out for delivery", location: "Miami, FL" },
      { time: "08-02 18:12", title: "运输途中", description: "In transit", location: "Orlando, FL" },
    ],
  },
  {
    id: "EXP-260812-064",
    type: "派送后丢件",
    severity: "紧急",
    status: "已跟进",
    department: "物流部",
    assignee: "陈可",
    fulfillmentNo: "F26072800218",
    orderNo: "LM-5826821",
    platform: "TikTok Shop",
    trackingNo: "SPX260728719042",
    carrier: "SpeedX",
    channel: "美西5日达",
    warehouse: "USWC2",
    country: "美国",
    state: "Washington",
    postcode: "98101",
    shippedAt: "2026-07-28 10:33",
    waiting: "调查 18小时",
    lastEvent: "Delivered - Lobby",
    lastEventAt: "2026-08-03 13:51",
    createdAt: "昨天 10:21",
    summary: "客户反馈公共区域未找到包裹，签收照片显示投递至公寓大堂，分类为公共区域丢失。",
    source: "客服工单 CS-90117",
    notes: [{ author: "陈可", time: "昨天 11:45", text: "已要求承运商提供完整POD和司机GPS定位。" }],
    events: [
      { time: "08-03 13:51", title: "已签收", description: "Delivered in lobby / reception", location: "Seattle, WA", abnormal: true },
      { time: "08-03 08:18", title: "派送途中", description: "Out for delivery", location: "Seattle, WA" },
    ],
  },
  {
    id: "EXP-260811-059",
    type: "7天未妥投",
    severity: "中",
    status: "已解决",
    department: "物流部 · 客服部",
    assignee: "林晓",
    fulfillmentNo: "F26080200812",
    orderNo: "LM-5834482",
    platform: "Amazon CA",
    trackingNo: "DHL260802661834",
    carrier: "DHL",
    channel: "加拿大标准",
    warehouse: "WH01",
    country: "加拿大",
    state: "Ontario",
    postcode: "M5V 3A8",
    shippedAt: "2026-08-02 13:58",
    waiting: "已妥投",
    lastEvent: "Delivered",
    lastEventAt: "今天 07:28",
    createdAt: "昨天 14:00",
    summary: "工单创建后轨迹恢复并完成妥投，系统自动解决。",
    source: "规则引擎",
    notes: [{ author: "系统", time: "今天 07:30", text: "检测到签收节点，工单自动标记已解决。" }],
    events: [
      { time: "今天 07:28", title: "已签收", description: "Delivered", location: "Toronto, ON" },
      { time: "昨天 09:06", title: "派送途中", description: "With delivery courier", location: "Toronto, ON" },
    ],
  },
];

const INITIAL_RULES: RuleItem[] = [
  { id: "r1", name: "超时未上网", description: "仓库签出后未出现PICK UP轨迹", threshold: 48, unit: "小时", department: "物流部", severity: "高", enabled: true, hits: 18 },
  { id: "r2", name: "轨迹停滞3天", description: "最后有效移动轨迹超过阈值未更新", threshold: 72, unit: "小时", department: "物流部", severity: "高", enabled: true, hits: 31 },
  { id: "r3", name: "7天未妥投", description: "签出后7天未出现签收轨迹", threshold: 7, unit: "天", department: "物流部 · 客服部", severity: "中", enabled: true, hits: 42 },
  { id: "r4", name: "10天未妥投", description: "7天预警自动升级至红色告警", threshold: 10, unit: "天", department: "物流部 · 客服部", severity: "紧急", enabled: true, hits: 12 },
  { id: "r5", name: "海关停留超时", description: "进入海关后未出现放行节点", threshold: 48, unit: "小时", department: "物流部", severity: "中", enabled: true, hits: 9 },
  { id: "r6", name: "派送失败", description: "识别DeliveryFailure结构化状态", threshold: 0, unit: "小时", department: "客服部", severity: "高", enabled: true, hits: 23 },
  { id: "r7", name: "签收后丢件", description: "已签收订单关联客服丢件反馈", threshold: 0, unit: "小时", department: "物流部", severity: "紧急", enabled: true, hits: 6 },
  { id: "r8", name: "物流破损", description: "已签收订单关联客服破损反馈", threshold: 0, unit: "小时", department: "客服部", severity: "高", enabled: true, hits: 11 },
];

const NAV_ITEMS = [
  { id: "overview", label: "异常控制塔", icon: LayoutDashboard },
  { id: "cases", label: "异常工单", icon: ClipboardCheck, badge: 26 },
  { id: "rules", label: "监控规则", icon: CloudCog },
  { id: "ai", label: "AI识别中心", icon: Bot, badge: 4 },
  { id: "notifications", label: "通知中心", icon: Bell, badge: 2 },
  { id: "claims", label: "丢损与索赔", icon: ShieldAlert, badge: 7 },
  { id: "analytics", label: "履约时效看板", icon: BarChart3 },
];

const severityClass: Record<Severity, string> = { 紧急: "critical", 高: "high", 中: "medium", 低: "low" };
const statusClass: Record<CaseStatus, string> = { 待跟进: "todo", 已跟进: "followed", 处理中: "doing", 等待外部: "waiting", 已解决: "resolved" };

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <Inbox size={26} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function KpiCard({ label, value, detail, icon: Icon, tone, trend }: { label: string; value: string; detail: string; icon: typeof Activity; tone: string; trend?: string }) {
  return (
    <div className={`kpi-card kpi-${tone}`}>
      <div className="kpi-top"><span>{label}</span><div className="kpi-icon"><Icon size={18} /></div></div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-detail"><span>{detail}</span>{trend && <strong>{trend}</strong>}</div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
      <div className="header-actions">{actions}</div>
    </div>
  );
}

function CaseTable({ items, onOpen, compact = false }: { items: CaseItem[]; onOpen: (item: CaseItem) => void; compact?: boolean }) {
  return (
    <div className="table-wrap">
      <table className="case-table">
        <thead><tr><th>异常工单</th><th>订单 / 运单</th><th>当前状态</th><th>时效</th><th>负责人</th>{!compact && <th>更新时间</th>}<th></th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} onClick={() => onOpen(item)}>
              <td><div className="case-name"><span className={`severity-dot ${severityClass[item.severity]}`} /><div><strong>{item.type}</strong><small>{item.id}</small></div></div></td>
              <td><div className="order-cell"><strong>{item.orderNo}</strong><small>{item.carrier} · {item.trackingNo}</small></div></td>
              <td><span className={`status-pill ${statusClass[item.status]}`}>{item.status}</span></td>
              <td><div className="waiting-cell"><strong>{item.waiting}</strong><small>{item.lastEvent}</small></div></td>
              <td>{item.assignee === "待认领" ? <span className="unassigned">待认领</span> : <div className="assignee"><span>{item.assignee.slice(0, 1)}</span>{item.assignee}</div>}</td>
              {!compact && <td><span className="muted">{item.createdAt}</span></td>}
              <td><button className="icon-button" aria-label={`查看${item.id}`}><ChevronRight size={17} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Overview({ cases, onOpen, onNavigate, showToast }: { cases: CaseItem[]; onOpen: (item: CaseItem) => void; onNavigate: (id: string) => void; showToast: (text: string) => void }) {
  const openCases = cases.filter((c) => c.status !== "已解决");
  return (
    <>
      <PageHeader
        eyebrow="FULFILLMENT EXCEPTION CONTROL TOWER"
        title="履约异常控制塔"
        description="把轨迹异常、客服反馈和部门协同放进同一个闭环"
        actions={<><button className="btn secondary" onClick={() => showToast("数据同步任务已启动，预计2分钟完成") }><RefreshCw size={16} />同步轨迹</button><button className="btn primary" onClick={() => onNavigate("cases")}><Plus size={16} />新建工单</button></>}
      />

      <div className="ops-strip">
        <div className="live"><span /><strong>监控运行中</strong><small>最近扫描 11:45 · 下次 12:00</small></div>
        <div className="ops-stat"><span>扫描订单</span><strong>12,486</strong></div>
        <div className="ops-stat"><span>今日新增</span><strong>26</strong></div>
        <div className="ops-stat"><span>规则命中率</span><strong>1.8%</strong></div>
        <div className="ops-stat"><span>消息送达率</span><strong>98.6%</strong></div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="待处理异常" value={String(openCases.length + 18)} detail="较昨日减少 3 个" icon={AlertTriangle} tone="red" trend="↓ 10.3%" />
        <KpiCard label="超时未上网" value="18" detail="平均等待 2.7 天" icon={PackageSearch} tone="orange" />
        <KpiCard label="轨迹停滞" value="31" detail="其中紧急 6 个" icon={TimerReset} tone="purple" />
        <KpiCard label="7/10天未妥投" value="54" detail="10天以上 12 个" icon={Clock3} tone="blue" />
        <KpiCard label="今日解决率" value="78.4%" detail="目标 85%" icon={CheckCircle2} tone="green" trend="↑ 4.2%" />
      </div>

      <div className="dashboard-grid">
        <section className="panel alert-overview">
          <div className="panel-head"><div><h2>异常类型分布</h2><p>按当前未解决工单统计</p></div><button className="text-button" onClick={() => onNavigate("cases")}>查看全部<ArrowRight size={14} /></button></div>
          <div className="alert-bars">
            {[
              ["轨迹停滞3天", 31, 74, "purple"], ["7天未妥投", 42, 100, "blue"], ["超时未上网", 18, 43, "orange"], ["派送失败", 13, 31, "red"], ["海关停留", 9, 22, "yellow"], ["丢件 / 破损", 7, 17, "pink"],
            ].map(([name, count, width, tone]) => <div className="alert-bar" key={String(name)}><div><span>{name}</span><strong>{count}</strong></div><div className="bar-track"><i className={`bar-${tone}`} style={{ width: `${width}%` }} /></div></div>)}
          </div>
        </section>
        <section className="panel trend-panel">
          <div className="panel-head"><div><h2>近7日异常趋势</h2><p>新增与解决工单</p></div><Badge tone="success">解决率 78.4%</Badge></div>
          <div className="legend"><span><i className="legend-new" />新增</span><span><i className="legend-done" />已解决</span></div>
          <div className="bar-chart">
            {[ [28,19,"08/06"], [35,24,"08/07"], [31,27,"08/08"], [44,32,"08/09"], [39,34,"08/10"], [33,30,"08/11"], [26,21,"今天"] ].map(([a,b,d]) => <div className="chart-col" key={String(d)}><div className="chart-bars"><i style={{height:`${Number(a)*2.2}px`}}/><i style={{height:`${Number(b)*2.2}px`}}/></div><span>{d}</span></div>)}
          </div>
        </section>
      </div>

      <section className="panel workbench-preview">
        <div className="panel-head"><div><h2>优先处理队列</h2><p>按严重程度、等待时长和客户影响自动排序</p></div><div className="head-meta"><span className="pulse-dot" />5个需要立即处理</div></div>
        <CaseTable items={cases.filter(c => c.status !== "已解决").slice(0, 5)} onOpen={onOpen} compact />
      </section>

      <div className="dashboard-grid bottom-grid">
        <section className="panel department-load">
          <div className="panel-head"><div><h2>部门处理负载</h2><p>待办与今日解决</p></div></div>
          {[["物流部", 36, 24, "72%"], ["客服部", 21, 18, "84%"], ["索赔专员", 7, 5, "68%"]].map(([name,pending,done,rate]) => <div className="dept-row" key={String(name)}><div className="dept-icon"><UsersRound size={17}/></div><div><strong>{name}</strong><span>待处理 {pending} · 今日解决 {done}</span></div><b>{rate}</b></div>)}
        </section>
        <section className="panel activity-feed">
          <div className="panel-head"><div><h2>实时动态</h2><p>最近的规则与处理动作</p></div></div>
          {[
            ["系统", "自动解决工单 EXP-260811-059", "检测到签收轨迹 · 4分钟前"],
            ["陈可", "认领了轨迹停滞工单", "EXP-260812-085 · 12分钟前"],
            ["AI", "从物流异常群识别出地址错误", "等待人工确认 · 18分钟前"],
            ["苏瑾", "上传索赔材料并提交物流商", "EXP-260812-069 · 26分钟前"],
          ].map(([who,title,meta]) => <div className="feed-row" key={title}><div className={`feed-avatar ${who === "AI" ? "ai" : ""}`}>{who === "AI" ? <Sparkles size={15}/> : who.slice(0,1)}</div><div><strong>{title}</strong><span>{meta}</span></div></div>)}
        </section>
      </div>
    </>
  );
}

function CasesPage({ cases, setCases, onOpen, showToast }: { cases: CaseItem[]; setCases: React.Dispatch<React.SetStateAction<CaseItem[]>>; onOpen: (item: CaseItem) => void; showToast: (text: string) => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [type, setType] = useState("全部类型");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const filtered = cases.filter((c) => {
    const q = search.toLowerCase();
    return (!q || [c.orderNo, c.trackingNo, c.id, c.fulfillmentNo].some(v => v.toLowerCase().includes(q))) && (status === "全部状态" || c.status === status) && (type === "全部类型" || c.type === type);
  });
  const createCase = () => {
    const item = { ...MOCK_CASES[2], id: `EXP-260812-${String(cases.length + 90).padStart(3,"0")}`, orderNo: `LM-${5842000 + cases.length}`, trackingNo: `NEW${Date.now().toString().slice(-9)}`, createdAt: "刚刚", notes: [], events: MOCK_CASES[2].events.map(e => ({...e})) };
    setCases((prev) => [item, ...prev]);
    showToast("已创建新的超时未上网工单");
    onOpen(item);
  };
  const batchClaim = () => {
    setCases(prev => prev.map(c => selectedIds.includes(c.id) ? {...c, assignee:"陈可", status:c.status === "待跟进" ? "已跟进" : c.status} : c));
    showToast(`已认领 ${selectedIds.length} 个工单`); setSelectedIds([]);
  };
  return <>
    <PageHeader eyebrow="EXCEPTION WORKBENCH" title="异常工单" description="发现、分派、跟进和关闭每一个履约异常" actions={<><button className="btn secondary"><FileText size={16}/>导出</button><button className="btn primary" onClick={createCase}><Plus size={16}/>新建工单</button></>} />
    <div className="case-summary-row">
      {[ ["全部工单", cases.length, "all"], ["待跟进", cases.filter(c=>c.status==="待跟进").length, "todo"], ["处理中", cases.filter(c=>c.status==="处理中"||c.status==="已跟进").length, "doing"], ["等待外部", cases.filter(c=>c.status==="等待外部").length, "waiting"], ["今日已解决", cases.filter(c=>c.status==="已解决").length+19, "resolved"] ].map(([label,count,tone]) => <div className={`case-summary ${tone}`} key={String(label)}><span>{label}</span><strong>{count}</strong></div>)}
    </div>
    <section className="panel case-workbench">
      <div className="filter-toolbar">
        <div className="search-box"><Search size={16}/><input aria-label="搜索工单" value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索履约单、订单号、运单号..."/></div>
        <select value={status} onChange={e=>setStatus(e.target.value)} aria-label="工单状态"><option>全部状态</option>{["待跟进","已跟进","处理中","等待外部","已解决"].map(v=><option key={v}>{v}</option>)}</select>
        <select value={type} onChange={e=>setType(e.target.value)} aria-label="异常类型"><option>全部类型</option>{Array.from(new Set(cases.map(c=>c.type))).map(v=><option key={v}>{v}</option>)}</select>
        <button className="btn ghost"><Filter size={15}/>更多筛选</button>
        <span className="filter-count">{filtered.length} 条结果</span>
      </div>
      {selectedIds.length > 0 && <div className="bulk-bar"><strong>已选择 {selectedIds.length} 条</strong><button onClick={batchClaim}><UserRound size={15}/>批量认领</button><button onClick={()=>{setCases(prev=>prev.map(c=>selectedIds.includes(c.id)?{...c,status:"已解决"}:c));showToast("所选工单已标记为解决");setSelectedIds([])}}><Check size={15}/>标记解决</button><button onClick={()=>setSelectedIds([])}>取消</button></div>}
      <div className="table-wrap">
        <table className="case-table full-table">
          <thead><tr><th className="check-col"><input type="checkbox" aria-label="选择全部" checked={selectedIds.length===filtered.length && filtered.length>0} onChange={e=>setSelectedIds(e.target.checked?filtered.map(c=>c.id):[])}/></th><th>异常工单</th><th>履约 / 订单信息</th><th>物流信息</th><th>时效与最新轨迹</th><th>状态</th><th>负责人</th><th></th></tr></thead>
          <tbody>{filtered.map(item=><tr key={item.id} onClick={()=>onOpen(item)}>
            <td onClick={e=>e.stopPropagation()}><input type="checkbox" aria-label={`选择${item.id}`} checked={selectedIds.includes(item.id)} onChange={e=>setSelectedIds(prev=>e.target.checked?[...prev,item.id]:prev.filter(id=>id!==item.id))}/></td>
            <td><div className="case-name"><span className={`severity-dot ${severityClass[item.severity]}`}/><div><strong>{item.type}</strong><small>{item.id} · {item.source}</small></div></div></td>
            <td><div className="order-cell"><strong>{item.orderNo}</strong><small>{item.fulfillmentNo} · {item.platform}</small></div></td>
            <td><div className="order-cell"><strong>{item.carrier}</strong><small>{item.trackingNo}</small><small>{item.country} · {item.warehouse}</small></div></td>
            <td><div className="waiting-cell"><strong>{item.waiting}</strong><small>{item.lastEvent}</small><small>{item.lastEventAt}</small></div></td>
            <td><span className={`status-pill ${statusClass[item.status]}`}>{item.status}</span></td>
            <td>{item.assignee==="待认领"?<span className="unassigned">待认领</span>:<div className="assignee"><span>{item.assignee.slice(0,1)}</span>{item.assignee}</div>}</td>
            <td><button className="icon-button"><MoreHorizontal size={17}/></button></td>
          </tr>)}</tbody>
        </table>
      </div>
      {filtered.length===0 && <EmptyState title="没有匹配的工单" description="尝试修改关键词或筛选条件"/>}
      <div className="pagination"><span>共 {filtered.length} 条</span><div><button disabled>上一页</button><button className="active">1</button><button>2</button><button>3</button><button>下一页</button></div></div>
    </section>
  </>;
}

function RulesPage({ rules, setRules, showToast }: { rules: RuleItem[]; setRules: React.Dispatch<React.SetStateAction<RuleItem[]>>; showToast:(text:string)=>void }) {
  const [tab,setTab]=useState("自动监控");
  return <>
    <PageHeader eyebrow="RULE ENGINE" title="履约监控规则" description="用结构化轨迹和业务时间基准持续识别异常" actions={<><button className="btn secondary" onClick={()=>showToast("已完成规则模拟：近30天预计命中 142 个工单")}><Play size={16}/>模拟运行</button><button className="btn primary" onClick={()=>showToast("所有规则已保存并将在下次扫描生效")}><Check size={16}/>保存规则</button></>}/>
    <div className="rule-health">
      <div><span className="health-icon"><Zap size={20}/></span><div><strong>规则引擎运行正常</strong><p>8条规则已启用 · 每15分钟扫描一次 · 最近执行耗时 4.2 秒</p></div></div>
      <button className="btn ghost"><Settings2 size={15}/>扫描设置</button>
    </div>
    <div className="segmented tabs"><button className={tab==="自动监控"?"active":""} onClick={()=>setTab("自动监控")}>自动监控规则</button><button className={tab==="AI规则"?"active":""} onClick={()=>setTab("AI规则")}>AI识别规则</button><button className={tab==="路由"?"active":""} onClick={()=>setTab("路由")}>通知与分派</button></div>
    {tab==="自动监控" && <section className="panel rules-panel">
      <div className="rules-head"><div><h2>确定性监控规则</h2><p>同一订单的7天和10天告警将合并为一张升级工单</p></div><button className="btn secondary"><Plus size={15}/>添加规则</button></div>
      <div className="rule-list">{rules.map(rule=><div className={`rule-row ${!rule.enabled?"disabled":""}`} key={rule.id}>
        <button className={`switch ${rule.enabled?"on":""}`} aria-label={`${rule.name}开关`} onClick={()=>setRules(prev=>prev.map(r=>r.id===rule.id?{...r,enabled:!r.enabled}:r))}><i/></button>
        <div className={`rule-symbol ${severityClass[rule.severity]}`}>{rule.name.includes("上网")?<PackageSearch size={18}/>:rule.name.includes("停滞")?<TimerReset size={18}/>:rule.name.includes("海关")?<Globe2 size={18}/>:rule.name.includes("破损")?<Box size={18}/>:<AlertTriangle size={18}/>}</div>
        <div className="rule-info"><div><strong>{rule.name}</strong><Badge tone={severityClass[rule.severity]}>{rule.severity}</Badge></div><p>{rule.description}</p><span>近30天命中 {rule.hits} 次</span></div>
        <div className="rule-threshold"><label>触发阈值</label><div>{rule.threshold>0?<><input type="number" value={rule.threshold} onChange={e=>setRules(prev=>prev.map(r=>r.id===rule.id?{...r,threshold:Number(e.target.value)}:r))}/><span>{rule.unit}</span></>:<strong>状态触发</strong>}</div></div>
        <div className="rule-route"><label>通知与分派</label><div><UsersRound size={14}/>{rule.department}</div></div>
        <button className="icon-button"><MoreHorizontal size={18}/></button>
      </div>)}</div>
    </section>}
    {tab==="AI规则" && <section className="panel config-view"><div className="config-hero"><Bot size={28}/><div><h2>AI异常分类策略</h2><p>从群消息和邮箱中识别丢件、破损、滞留、地址错误和拒收，并按置信度决定是否自动建单。</p></div></div><div className="config-grid">{[["自动建单置信度","≥ 90%"],["人工审核区间","60% — 89%"],["低置信度处理","仅归档，不建单"],["重复判断窗口","同订单 72 小时"]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong><button>编辑</button></div>)}</div></section>}
    {tab==="路由" && <section className="panel routing-view"><h2>异常路由矩阵</h2><p>命中规则后自动分派部门、通知群组和负责人。</p><table><thead><tr><th>异常类型</th><th>主责部门</th><th>同步通知</th><th>升级时限</th></tr></thead><tbody>{[["轨迹停滞3天","物流部","物流异常群","24小时"],["7/10天未妥投","物流部","客服部、物流经理","12小时"],["派送失败","客服部","客服异常群","4小时"],["物流破损","客服部","索赔专员","8小时"]].map(r=><tr key={r[0]}>{r.map(c=><td key={c}>{c}</td>)}</tr>)}</tbody></table></section>}
  </>;
}

function AiPage({ addCase, showToast }: { addCase:(item:CaseItem)=>void; showToast:(text:string)=>void }) {
  const [input,setInput]=useState("物流商邮件：订单 LM-5841852，运单号 GFUS260808771029。包裹在亚特兰大分拨中心发现外包装严重挤压，承运商已暂扣处理，请尽快联系客户确认商品情况。");
  const [result,setResult]=useState(false); const [loading,setLoading]=useState(false); const [created,setCreated]=useState(false);
  const analyze=()=>{setLoading(true);setResult(false);window.setTimeout(()=>{setLoading(false);setResult(true);},850)};
  const create=()=>{const item={...MOCK_CASES[5],id:"EXP-260812-AI01",orderNo:"LM-5841852",trackingNo:"GFUS260808771029",type:"物流破损",source:"AI · 物流商邮件",createdAt:"刚刚",status:"待跟进" as CaseStatus,assignee:"待认领",notes:[{author:"AI",time:"刚刚",text:"根据物流商邮件自动生成，建议客服部确认客户商品情况并准备索赔材料。"}]};addCase(item);setCreated(true);showToast("AI工单已生成并推送至客服部")};
  return <>
    <PageHeader eyebrow="AI EXCEPTION INTAKE" title="AI异常识别中心" description="把群消息和邮件变成结构化、可追踪的异常工单" actions={<button className="btn secondary"><Settings2 size={16}/>数据源设置</button>}/>
    <div className="ai-stats">{[["今日解析","186 条"],["识别异常","14 个"],["自动建单","9 个"],["人工审核","4 个"],["识别准确率","94.8%"]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div>
    <div className="ai-layout">
      <section className="panel ai-input-panel">
        <div className="panel-head"><div><h2>消息解析实验室</h2><p>粘贴群消息、邮件或客服反馈，查看AI如何提取异常</p></div><Badge tone="purple"><Sparkles size={12}/>AI在线</Badge></div>
        <label>原始消息</label><textarea value={input} onChange={e=>setInput(e.target.value)} />
        <div className="source-row"><span>来源</span><button className="source-chip active"><Mail size={14}/>物流部邮箱</button><button className="source-chip"><MessageSquareText size={14}/>异常沟通群</button><button className="source-chip"><UserRound size={14}/>客服反馈</button></div>
        <button className="btn primary analyze-button" onClick={analyze} disabled={loading}>{loading?<><RefreshCw className="spin" size={16}/>正在分析...</>:<><Sparkles size={16}/>开始AI识别</>}</button>
      </section>
      <section className="panel ai-result-panel">
        <div className="panel-head"><div><h2>识别结果</h2><p>结构化信息和处置建议</p></div>{result&&<Badge tone="success">置信度 96%</Badge>}</div>
        {!result && !loading && <EmptyState title="等待分析" description="输入消息后点击“开始AI识别”"/>}
        {loading && <div className="ai-loading"><Sparkles size={28}/><strong>正在理解上下文</strong><span>匹配订单、识别类型并生成摘要...</span></div>}
        {result && <div className="ai-result">
          <div className="ai-classification"><div className="rule-symbol high"><Box size={20}/></div><div><span>异常类型</span><strong>物流破损 · 高风险</strong></div></div>
          <div className="extract-grid"><div><span>订单号</span><strong>LM-5841852</strong></div><div><span>运单号</span><strong>GFUS260808771029</strong></div><div><span>物流商</span><strong>GOFO</strong></div><div><span>地点</span><strong>Atlanta, GA</strong></div><div><span>建议部门</span><strong>客服部</strong></div><div><span>建议负责人</span><strong>苏瑾</strong></div></div>
          <div className="ai-summary"><span>AI摘要</span><p>承运商在亚特兰大分拨中心发现包裹严重挤压并暂扣。建议客服确认商品情况，同时向物流商索取破损证明并准备索赔。</p></div>
          <div className="ai-actions"><button className="btn secondary">进入人工审核</button><button className="btn primary" onClick={create} disabled={created}>{created?<><Check size={16}/>已生成工单</>:<><Zap size={16}/>生成并推送工单</>}</button></div>
        </div>}
      </section>
    </div>
    <section className="panel review-queue"><div className="panel-head"><div><h2>待人工审核</h2><p>置信度60%—89%的识别结果</p></div><Badge tone="warning">4条待审核</Badge></div>
      {[ ["异常沟通群","可能地址错误","LM-5840991","82%","客户说搬家后没更新门牌号，快递显示派送失败..."], ["物流部邮箱","可能海关扣留","LM-5839920","77%","代理反馈该票需要补充申报价值证明..."], ["客服反馈","可能签收后丢件","LM-5838441","69%","用户称前台和邻居都没有代收包裹..."] ].map(r=><div className="review-row" key={r[2]}><div className="source-icon"><MessageSquareText size={17}/></div><div className="review-main"><strong>{r[1]} <small>{r[3]}</small></strong><p>{r[4]}</p><span>{r[0]} · {r[2]}</span></div><button className="btn ghost">审核<ChevronRight size={14}/></button></div>)}
    </section>
  </>;
}

function NotificationsPage({ showToast }:{showToast:(text:string)=>void}) {
  const [channels,setChannels]=useState({feishu:true,email:true,sms:false});
  return <>
    <PageHeader eyebrow="NOTIFICATION CENTER" title="通知中心" description="让正确的异常在正确的时间到达正确的人" actions={<button className="btn primary" onClick={()=>showToast("测试消息已发送至物流异常群")}><Send size={16}/>发送测试</button>}/>
    <div className="notification-grid">
      {[
        ["feishu","飞书群机器人","物流异常群、客服异常群","已连接",MessageSquareText],
        ["email","部门邮箱","logistics@company.com","已连接",Mail],
        ["sms","短信升级","仅P0紧急事件使用","未启用",Bell],
      ].map(([key,title,desc,state,Icon])=>{const k=String(key) as keyof typeof channels; const I=Icon as typeof Bell;return <div className="channel-card" key={k}><div className="channel-icon"><I size={21}/></div><div><strong>{String(title)}</strong><p>{String(desc)}</p><span className={channels[k]?"connected":"disconnected"}>{channels[k]?"已连接":"未启用"}</span></div><button className={`switch ${channels[k]?"on":""}`} onClick={()=>setChannels(prev=>({...prev,[k]:!prev[k]}))}><i/></button></div>})}
    </div>
    <div className="dashboard-grid notification-sections">
      <section className="panel"><div className="panel-head"><div><h2>通知路由</h2><p>按异常类型和严重程度推送</p></div><button className="text-button"><Plus size={14}/>添加路由</button></div>
        {[ ["轨迹停滞3天","物流异常群","即时","物流部"],["7天未妥投","物流 + 客服异常群","即时","物流部、客服部"],["10天未妥投","双部门 + 经理邮件","即时升级","部门经理"],["派送失败","客服异常群","即时","客服部"],["破损索赔","客服邮箱","每30分钟汇总","索赔专员"] ].map(r=><div className="route-row" key={r[0]}><div className="route-type"><CircleDot size={15}/><strong>{r[0]}</strong></div><div><span>{r[1]}</span><small>{r[3]}</small></div><Badge tone="neutral">{r[2]}</Badge><button className="icon-button"><MoreHorizontal size={16}/></button></div>)}
      </section>
      <section className="panel"><div className="panel-head"><div><h2>发送记录</h2><p>近24小时 98.6% 成功送达</p></div><Badge tone="danger">2条失败</Badge></div>
        {[ ["10天未妥投 · 12个工单","飞书 + 邮件","11:45","成功"],["派送失败 · EXP-260812-078","飞书","10:31","成功"],["海关停留 · EXP-260812-074","邮件","09:15","失败"],["AI破损工单 · EXP-260812-069","飞书","08:42","成功"] ].map(r=><div className="delivery-row" key={r[0]}><div className={`delivery-state ${r[3]==="成功"?"ok":"fail"}`}>{r[3]==="成功"?<Check size={14}/>:<X size={14}/>}</div><div><strong>{r[0]}</strong><span>{r[1]} · {r[2]}</span></div>{r[3]==="失败"&&<button onClick={()=>showToast("通知已重试并成功送达")}><RotateCcw size={14}/>重试</button>}</div>)}
      </section>
    </div>
  </>;
}

function ClaimsPage({ cases, onOpen, showToast }:{cases:CaseItem[];onOpen:(i:CaseItem)=>void;showToast:(t:string)=>void}) {
  const claimCases=cases.filter(c=>c.type.includes("丢件")||c.type.includes("破损"));
  return <>
    <PageHeader eyebrow="LOSS & DAMAGE CLAIMS" title="丢损与索赔" description="从客户反馈、证据收集到物流商赔付的全流程" actions={<button className="btn primary"><Plus size={16}/>登记异常</button>}/>
    <div className="claim-kpis">{[["待调查","5","需物流部核实"],["待收集材料","3","照片或客户声明"],["索赔中","7","预计金额 ¥8,420"],["本月已赔付","¥21,680","成功率 78.6%"]].map(([a,b,c])=><div key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></div>)}</div>
    <section className="panel claim-board"><div className="panel-head"><div><h2>索赔处理队列</h2><p>按阶段管理丢件和破损案件</p></div><div className="segmented small"><button className="active">全部</button><button>丢件</button><button>破损</button></div></div>
      <div className="claim-table-wrap"><table className="claim-table"><thead><tr><th>异常工单</th><th>类型 / 责任场景</th><th>证据材料</th><th>索赔金额</th><th>索赔进度</th><th>负责人</th><th></th></tr></thead><tbody>
        {claimCases.map((c,i)=><tr key={c.id} onClick={()=>onOpen(c)}><td><strong>{c.id}</strong><span>{c.orderNo} · {c.carrier}</span></td><td><Badge tone={c.type.includes("破损")?"danger":"purple"}>{c.type}</Badge><span>{c.type.includes("破损")?"外包装挤压 / 商品断裂":"公共区域投递后丢失"}</span></td><td><div className="evidence"><span><ImageIcon size={13}/>照片 {c.type.includes("破损")?3:1}</span><span><FileText size={13}/>声明 1</span></div></td><td><strong>¥{i===0?"1,280":"860"}</strong></td><td><div className="claim-progress"><div><i style={{width:i===0?"64%":"38%"}}/></div><span>{i===0?"索赔中":"调查取证"}</span></div></td><td><div className="assignee"><span>{c.assignee.slice(0,1)}</span>{c.assignee}</div></td><td><button className="btn ghost" onClick={e=>{e.stopPropagation();showToast("索赔进度已更新")}}>更新进度</button></td></tr>)}
        <tr><td><strong>CLM-260811-058</strong><span>LM-5839722 · DHL</span></td><td><Badge tone="danger">物流破损</Badge><span>包裹浸水</span></td><td><div className="evidence"><span><ImageIcon size={13}/>照片 5</span><span><FileText size={13}/>声明 1</span></div></td><td><strong>¥2,160</strong></td><td><div className="claim-progress"><div><i style={{width:"88%"}}/></div><span>物流商审核</span></div></td><td><div className="assignee"><span>苏</span>苏瑾</div></td><td><button className="btn ghost">更新进度</button></td></tr>
      </tbody></table></div>
    </section>
  </>;
}

function AnalyticsPage() {
  const [dimension,setDimension]=useState("物流渠道"); const [days,setDays]=useState(7);
  const rows=[ ["GOFO · 美东7日达","2,418","93.7%","4.2天","6.1天","1.4%"], ["SpeedX · 美西5日达","1,864","95.1%","3.8天","5.4天","1.1%"], ["3PE EXPRESS","936","89.4%","5.1天","7.8天","2.8%"], ["DHL · 全球快递","722","97.2%","2.9天","4.0天","0.7%"], ["云途 · 英国专线","614","92.6%","4.8天","6.9天","1.9%"] ];
  return <>
    <PageHeader eyebrow="FULFILLMENT ANALYTICS" title="履约时效看板" description="用同一套口径追踪时效达成、异常与处理表现" actions={<><button className="btn secondary"><FileText size={16}/>导出报告</button><button className="btn primary"><Plus size={16}/>保存看板</button></>}/>
    <div className="analytics-filter"><div><label>分析维度</label><select value={dimension} onChange={e=>setDimension(e.target.value)}>{["团队","发货仓","目的仓","物流渠道","国家","州","邮编"].map(v=><option key={v}>{v}</option>)}</select></div><div><label>时效指标</label><div className="n-day"><input type="number" value={days} min={1} max={30} onChange={e=>setDays(Number(e.target.value))}/><span>天达成率</span></div></div><div><label>订单批次</label><select><option>签出日期 · 近30天</option><option>创建日期 · 近30天</option></select></div><div><label>国家</label><select><option>全部国家</option><option>美国</option><option>英国</option><option>加拿大</option></select></div><button className="btn primary"><Filter size={15}/>应用筛选</button></div>
    <div className="kpi-grid analytics-kpis">
      <KpiCard label={`${days}天时效达成率`} value={days===7?"93.8%":days<7?"78.6%":"97.1%"} detail="成熟订单 6,842 单" icon={PackageCheck} tone="green" trend="↑ 2.4%"/>
      <KpiCard label="平均妥投时效" value="4.3天" detail="较上期缩短 0.4 天" icon={Clock3} tone="blue"/>
      <KpiCard label="P90 妥投时效" value="6.8天" detail="目标 ≤ 7 天" icon={Activity} tone="purple"/>
      <KpiCard label="异常发生率" value="1.8%" detail="142 / 7,821 单" icon={AlertTriangle} tone="red" trend="↓ 0.3%"/>
      <KpiCard label="工单平均解决" value="18.6h" detail="目标 ≤ 24 小时" icon={ClipboardCheck} tone="orange"/>
    </div>
    <div className="dashboard-grid analytics-charts">
      <section className="panel line-chart-panel"><div className="panel-head"><div><h2>{days}天达成率趋势</h2><p>按签出日期批次，仅统计已成熟订单</p></div><Badge tone="success">当前 93.8%</Badge></div>
        <div className="line-chart-css"><div className="y-labels"><span>100%</span><span>95%</span><span>90%</span><span>85%</span><span>80%</span></div><div className="plot"><i className="gridline g1"/><i className="gridline g2"/><i className="gridline g3"/><i className="gridline g4"/>{[88,90,89,92,93,92,94,95,93,94,96,94].map((v,i)=><div key={i} className="point-wrap" style={{left:`${i*8.7}%`,bottom:`${(v-80)*5}%`}}><span className="point"/><i className="segment" style={{width:"8.8vw",transform:`rotate(${i%3===0?"-6deg":i%3===1?"4deg":"-2deg"})`}}/></div>)}<div className="x-labels"><span>07/14</span><span>07/21</span><span>07/28</span><span>08/04</span><span>08/11</span></div></div></div>
      </section>
      <section className="panel dimension-chart"><div className="panel-head"><div><h2>{dimension}达成率对比</h2><p>Top 5 订单量维度</p></div></div>
        {rows.map((r,i)=><div className="dimension-row" key={r[0]}><div><strong>{r[0]}</strong><span>{r[1]} 单</span></div><div className="dimension-bar"><i style={{width:r[2]}}/></div><b>{r[2]}</b><small>{i<2?"领先":""}</small></div>)}
      </section>
    </div>
    <div className="dashboard-grid analytics-bottom">
      <section className="panel"><div className="panel-head"><div><h2>异常类型分布</h2><p>近30天共142个异常工单</p></div></div><div className="donut-area"><div className="donut"><div><strong>142</strong><span>异常工单</span></div></div><div className="donut-legend">{[["轨迹停滞","32%","purple"],["未妥投","28%","blue"],["未上网","18%","orange"],["派送失败","14%","red"],["丢损及其他","8%","gray"]].map(r=><div key={r[0]}><i className={`dot-${r[2]}`}/><span>{r[0]}</span><strong>{r[1]}</strong></div>)}</div></div></section>
      <section className="panel"><div className="panel-head"><div><h2>团队处理效率</h2><p>首次响应和平均解决时长</p></div></div>{[["物流一组","1.2h","16.8h","86%"],["物流二组","1.8h","21.4h","79%"],["客服北美组","0.6h","12.5h","91%"],["客服欧洲组","0.9h","15.2h","88%"]].map(r=><div className="team-efficiency" key={r[0]}><div className="team-avatar">{r[0].slice(0,1)}</div><strong>{r[0]}</strong><div><span>首次响应</span><b>{r[1]}</b></div><div><span>平均解决</span><b>{r[2]}</b></div><Badge tone="success">{r[3]} 按时</Badge></div>)}</section>
    </div>
    <section className="panel analytics-table"><div className="panel-head"><div><h2>{dimension}明细</h2><p>点击任一行可下钻至订单与异常工单</p></div><button className="text-button">配置列<Settings2 size={14}/></button></div><table><thead><tr><th>{dimension}</th><th>有效订单</th><th>{days}天达成率</th><th>平均时效</th><th>P90时效</th><th>异常率</th><th>趋势</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r[0]}>{r.map((c,j)=><td key={j}>{j===0?<strong>{c}</strong>:j===2?<Badge tone={Number(c.replace("%",""))>93?"success":"warning"}>{c}</Badge>:c}</td>)}<td><span className={i===2?"trend-down":"trend-up"}>{i===2?"↓ 1.4%":"↑ 2.1%"}</span></td></tr>)}</tbody></table></section>
  </>;
}

function DetailDrawer({ item, onClose, onUpdate, showToast }: { item: CaseItem; onClose:()=>void; onUpdate:(updates:Partial<CaseItem>)=>void; showToast:(text:string)=>void }) {
  const [note,setNote]=useState("");
  const addNote=()=>{if(!note.trim())return;onUpdate({notes:[...item.notes,{author:"当前用户",time:"刚刚",text:note.trim()}]});setNote("");showToast("跟进备注已添加")};
  return <div className="drawer-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><aside className="detail-drawer">
    <div className="drawer-head"><div><div className="drawer-title-line"><span className={`severity-dot ${severityClass[item.severity]}`}/><h2>{item.type}</h2><Badge tone={severityClass[item.severity]}>{item.severity}</Badge></div><p>{item.id} · 创建于 {item.createdAt}</p></div><button className="close-button" onClick={onClose}><X size={20}/></button></div>
    <div className="drawer-actions"><select value={item.status} onChange={e=>onUpdate({status:e.target.value as CaseStatus})}>{["待跟进","已跟进","处理中","等待外部","已解决"].map(v=><option key={v}>{v}</option>)}</select><select value={item.assignee} onChange={e=>onUpdate({assignee:e.target.value})}>{["待认领","陈可","林晓","周然","苏瑾"].map(v=><option key={v}>{v}</option>)}</select><button className="btn secondary" onClick={()=>showToast("已向相关处理群发送提醒")}><Bell size={15}/>再次提醒</button></div>
    <div className="drawer-scroll">
      <div className="incident-summary"><div><AlertTriangle size={19}/><strong>异常摘要</strong></div><p>{item.summary}</p><div className="summary-tags"><Badge tone="neutral">来源：{item.source}</Badge><Badge tone="neutral">主责：{item.department}</Badge><Badge tone="warning">{item.waiting}</Badge></div></div>
      <section className="drawer-section"><div className="section-title"><h3>订单与履约信息</h3><button>复制全部</button></div><div className="info-grid">
        {[["履约单号",item.fulfillmentNo],["平台订单号",item.orderNo],["平台",item.platform],["运单号",item.trackingNo],["物流商",item.carrier],["物流渠道",item.channel],["发货仓",item.warehouse],["签出时间",item.shippedAt],["目的地",`${item.country} · ${item.state}`],["邮编",item.postcode]].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}
      </div></section>
      {(item.type.includes("破损")||item.type.includes("丢件"))&&<section className="drawer-section"><div className="section-title"><h3>客服反馈与证据</h3><button><Paperclip size={14}/>添加附件</button></div><div className="evidence-cards"><div><ImageIcon size={22}/><strong>现场照片</strong><span>{item.type.includes("破损")?"3张破损照片":"1张签收照片"}</span></div><div><FileText size={22}/><strong>客户声明</strong><span>已收集</span></div><div><MapPin size={22}/><strong>POD / GPS</strong><span>{item.type.includes("丢件")?"等待物流商":"已获取"}</span></div></div></section>}
      <section className="drawer-section"><div className="section-title"><h3>完整物流轨迹</h3><span>最近更新 {item.lastEventAt}</span></div><div className="tracking-timeline">{item.events.map((e,i)=><div className={`tracking-event ${e.abnormal?"abnormal":""}`} key={`${e.time}-${e.title}`}><div className="timeline-marker">{i===0?<CircleDot size={15}/>:<span/>}</div><div className="event-time">{e.time}</div><div className="event-body"><strong>{e.title}{e.abnormal&&<Badge tone="danger">异常节点</Badge>}</strong><p>{e.description}</p>{e.location&&<span><MapPin size={12}/>{e.location}</span>}</div></div>)}</div></section>
      <section className="drawer-section"><div className="section-title"><h3>跟进记录</h3><span>{item.notes.length} 条</span></div>{item.notes.length===0?<EmptyState title="暂无跟进记录" description="添加第一条处理备注"/>:<div className="note-list">{item.notes.map((n,i)=><div className="note" key={i}><div className="note-avatar">{n.author.slice(0,1)}</div><div><strong>{n.author}<span>{n.time}</span></strong><p>{n.text}</p></div></div>)}</div>}<div className="note-editor"><textarea placeholder="记录调查进展、客户沟通或物流商反馈..." value={note} onChange={e=>setNote(e.target.value)}/><div><button><Paperclip size={15}/>附件</button><button className="btn primary" onClick={addNote}><Send size={15}/>添加备注</button></div></div></section>
      <section className="drawer-section"><div className="section-title"><h3>通知记录</h3><button>查看全部</button></div><div className="notification-log"><div className="delivery-state ok"><Check size={14}/></div><div><strong>飞书 · {item.department}</strong><span>首次告警已送达 · {item.createdAt}</span></div></div></section>
    </div>
    <div className="drawer-footer"><button className="btn secondary" onClick={()=>onUpdate({status:"已跟进",assignee:item.assignee==="待认领"?"陈可":item.assignee})}><UserRound size={16}/>认领并跟进</button><button className="btn primary" onClick={()=>{onUpdate({status:"已解决"});showToast("工单已解决并停止后续提醒")}}><CheckCircle2 size={16}/>解决工单</button></div>
  </aside></div>;
}

export default function Home() {
  const [active,setActive]=useState("overview");
  const [cases,setCases]=useState<CaseItem[]>(MOCK_CASES);
  const [rules,setRules]=useState<RuleItem[]>(INITIAL_RULES);
  const [selected,setSelected]=useState<CaseItem|null>(null);
  const [toast,setToast]=useState("");
  const showToast=(text:string)=>{setToast(text);window.setTimeout(()=>setToast(""),2600)};
  const openCase=(item:CaseItem)=>setSelected(cases.find(c=>c.id===item.id)||item);
  const updateSelected=(updates:Partial<CaseItem>)=>{if(!selected)return;const next={...selected,...updates};setSelected(next);setCases(prev=>prev.map(c=>c.id===selected.id?next:c));};
  const addCase=(item:CaseItem)=>setCases(prev=>prev.some(c=>c.id===item.id)?prev:[item,...prev]);
  const title = NAV_ITEMS.find(n=>n.id===active)?.label || "异常控制塔";
  const content=useMemo(()=>{
    if(active==="overview") return <Overview cases={cases} onOpen={openCase} onNavigate={setActive} showToast={showToast}/>;
    if(active==="cases") return <CasesPage cases={cases} setCases={setCases} onOpen={openCase} showToast={showToast}/>;
    if(active==="rules") return <RulesPage rules={rules} setRules={setRules} showToast={showToast}/>;
    if(active==="ai") return <AiPage addCase={addCase} showToast={showToast}/>;
    if(active==="notifications") return <NotificationsPage showToast={showToast}/>;
    if(active==="claims") return <ClaimsPage cases={cases} onOpen={openCase} showToast={showToast}/>;
    return <AnalyticsPage/>;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[active,cases,rules]);
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Truck size={22}/></div><div><strong>履约智控</strong><span>Fulfillment OS</span></div></div>
      <nav>{NAV_ITEMS.map(({id,label,icon:Icon,badge})=><button key={id} className={active===id?"active":""} onClick={()=>setActive(id)}><Icon size={18}/><span>{label}</span>{badge&&<b>{badge}</b>}</button>)}</nav>
      <div className="sidebar-section"><span>数据与系统</span><button onClick={()=>showToast("数据源状态：ERP、17TRACK、客服系统均正常")}><Activity size={18}/><span>数据源管理</span><i className="online-dot"/></button><button onClick={()=>showToast("系统设置将在正式版中接入权限中心")}><Settings2 size={18}/><span>系统设置</span></button></div>
      <div className="sync-card"><div><RefreshCw size={16}/><strong>数据实时同步</strong></div><p>ERP · 17TRACK · 客服系统</p><span><i/>全部正常</span></div>
      <div className="profile"><div className="profile-avatar">Z</div><div><strong>张敏</strong><span>履约运营经理</span></div><ChevronDown size={15}/></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb"><span>履约管理</span><ChevronRight size={13}/><strong>{title}</strong></div><div className="top-actions"><div className="global-search"><Search size={15}/><span>搜索订单或工单</span><kbd>⌘ K</kbd></div><button className="top-icon"><Bell size={18}/><i>2</i></button><button className="help-button">?</button></div></header>
      <div className="content">{content}</div>
    </main>
    {selected&&<DetailDrawer item={selected} onClose={()=>setSelected(null)} onUpdate={updateSelected} showToast={showToast}/>} 
    {toast&&<div className="toast"><CheckCircle2 size={18}/><span>{toast}</span></div>}
  </div>;
}
