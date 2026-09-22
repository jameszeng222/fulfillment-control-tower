import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function renderHome() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("首页能够由生产构建正常输出", async () => {
  const response = await renderHome();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>履约雷达 · 物流轨迹预警监控<\/title>/i);
  assert.match(html, /轨迹监控/);
  assert.match(html, /17TRACK/);
  assert.doesNotMatch(html, /Your site is taking shape|vinext-starter/i);
});

test("核心监控范围和异常路由配置完整", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");

  for (const category of [
    "订单 + 仓库异常",
    "物流异常",
    "履约单报错",
    "商品缺货",
    "拆单异常",
    "超时未签出",
    "物流未上网",
    "运输超时",
    "物流断更",
    "物流停滞",
    "海关卡关",
    "派送异常",
    "包裹退运",
    "其他异常",
  ]) {
    assert.ok(page.includes(category));
  }

  for (const team of ["LM", "FD", "LM_TT", "INFLUENCER"]) {
    assert.match(page, new RegExp(`\\b${team}\\b`));
  }

  assert.match(page, /万邑通仓/);
  assert.match(page, /国内仓/);
  assert.match(page, /Exception_Delayed/);
  assert.match(page, /Expired（运输过久）/);
  assert.match(page, /Exception_Delayed不单独触发超时/);
  assert.match(page, /InTransit_CustomsRequiringInformation|CustomsRequiringInformation/);
  assert.match(page, /DeliveryFailure_Rejected|Exception_Rejected/);
  assert.match(page, /reasonTag: "订单缺货"/);
  assert.match(page, /ERP_STOCK_INSUFFICIENT/);
  assert.match(page, /ORDER_WAREHOUSE_ALERT_KEYS/);
  assert.match(page, /label: "商品缺货"/);
  assert.match(page, /LOGISTICS_ALERT_KEYS/);
  assert.match(page, /label: "拆单异常"/);
  assert.match(page, /订单分配物流渠道失败/);
  assert.match(page, /ERP_LOGISTICS_CHANNEL_ASSIGN_FAILED/);
  assert.match(page, /12条底层判断规则/);
  assert.match(page, /label: "订单 \+ 仓库异常"/);
  assert.match(page, /label: "物流异常"/);
  assert.match(page, /运输超时、物流断更、物流停滞、海关卡关分别独立筛选/);
  assert.match(page, /alerts\.includes\(activeAlert\)/);
  assert.match(page, /function ruleHitState/);
  assert.match(page, /order\.alertHistory\?\.some/);
  assert.match(page, /order\.alertHistory\?\.length \? order\.alertHistory\.map/);
  assert.match(page, /alert-history-empty/);
  assert.match(page, /ruleHitState\(order, ruleFilter\)/);
  assert.match(page, /当前命中/);
  assert.match(page, /历史命中/);
  assert.match(page, /全部业务预警/);
  assert.match(page, /aria-label="业务预警"/);
  assert.match(page, /aria-label="监控范围筛选"/);
  assert.match(page, /<th>关键时间<\/th>/);
  for (const milestone of ["支付", "创建", "出库", "上网"]) {
    assert.match(page, new RegExp(`<dt>${milestone}<\\/dt>`));
  }
  assert.doesNotMatch(page, /<dt>派送<\/dt>/);
  for (const removedColumn of ["监控生命周期", "最新物流轨迹", "数据同步"]) {
    assert.doesNotMatch(page, new RegExp(`<th>${removedColumn}<\\/th>`));
  }
  assert.match(page, /function getOrderMilestones/);
  assert.match(page, /monitorLayer.*business.*track/);
  assert.match(page, /monitor-compact-bar/);
  assert.match(page, /scope-query-button/);
  assert.match(page, /签出日期/);
  assert.match(page, /17TRACK状态/);
  assert.doesNotMatch(page, /alert-total-card/);
  assert.match(page, /OMS \+ ERP \+ WMS \+ 17TRACK/);
  assert.match(page, /function getCurrentNode/);
  assert.match(page, /function getFulfillmentTimeline/);
  assert.doesNotMatch(page, /<optgroup/);
  assert.doesNotMatch(page, /ALERT_META\[rule\]\.label} ·/);
});

test("项目元信息不再包含脚手架占位内容", async () => {
  const [packageJson, readme, layout, readability] = await Promise.all([
    readFile(new URL("package.json", root), "utf8"),
    readFile(new URL("README.md", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/readability.css", root), "utf8"),
  ]);

  assert.equal(JSON.parse(packageJson).name, "fulfillment-control-tower");
  assert.match(readme, /^# 履约雷达 · 物流轨迹预警监控/m);
  assert.match(layout, /履约雷达 · 物流轨迹预警监控/);
  assert.match(layout, /readability\.css/);
  assert.match(readability, /\.data-table td\{[^}]*font-size:14px/);
  assert.match(readability, /\.page-header p\{[^}]*font-size:15px/);
  assert.doesNotMatch(`${packageJson}\n${readme}`, /site-creator-vinext-starter/);
});
