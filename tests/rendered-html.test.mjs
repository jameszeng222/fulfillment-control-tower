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
    "履约准备异常",
    "未上网异常",
    "运输异常",
    "派送异常",
    "包裹退运",
    "其他异常",
  ]) {
    assert.match(page, new RegExp(category));
  }

  for (const team of ["LM", "FD", "LM_TT", "INFLUENCER"]) {
    assert.match(page, new RegExp(`\\b${team}\\b`));
  }

  assert.match(page, /万邑通仓/);
  assert.match(page, /国内仓/);
  assert.match(page, /Exception_Delayed/);
  assert.match(page, /InTransit_CustomsRequiringInformation|CustomsRequiringInformation/);
  assert.match(page, /DeliveryFailure_Rejected|Exception_Rejected/);
  assert.match(page, /reasonTag: "订单缺货"/);
  assert.match(page, /ERP_STOCK_INSUFFICIENT/);
  assert.match(page, /stock_shortage: "fulfillment_preparation"/);
  assert.match(page, /label: "商品缺货"/);
  assert.match(page, /11条底层判断规则/);
  assert.match(page, /transport_timeout: "transit_exception"/);
  assert.match(page, /no_update: "transit_exception"/);
  assert.match(page, /stagnation: "transit_exception"/);
  assert.match(page, /customs_hold: "transit_exception"/);
  assert.match(page, /delivery_failure: "delivery_failure"/);
  assert.match(page, /returning: "returning"/);
  assert.match(page, /const primaryAlert = alerts\[0\]/);
  assert.match(page, /primaryCategory === activeAlert/);
  assert.match(page, /function ruleHitState/);
  assert.match(page, /order\.alertHistory\?\.some/);
  assert.match(page, /ruleHitState\(order, ruleFilter\)/);
  assert.match(page, /当前命中/);
  assert.match(page, /历史命中/);
  assert.match(page, /全部业务预警/);
  assert.match(page, /aria-label="业务预警"/);
  assert.doesNotMatch(page, /<optgroup/);
  assert.doesNotMatch(page, /ALERT_META\[rule\]\.label} ·/);
});

test("项目元信息不再包含脚手架占位内容", async () => {
  const [packageJson, readme, layout] = await Promise.all([
    readFile(new URL("package.json", root), "utf8"),
    readFile(new URL("README.md", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
  ]);

  assert.equal(JSON.parse(packageJson).name, "fulfillment-control-tower");
  assert.match(readme, /^# 履约雷达 · 物流轨迹预警监控/m);
  assert.match(layout, /履约雷达 · 物流轨迹预警监控/);
  assert.doesNotMatch(`${packageJson}\n${readme}`, /site-creator-vinext-starter/);
});
