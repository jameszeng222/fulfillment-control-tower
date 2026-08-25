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
  assert.match(page, /rules: \["transport_timeout", "no_update", "stagnation", "customs_hold"\]/);
  assert.doesNotMatch(page, /rules: \["transport_timeout"[^\]]*"delivery_failure"/);
  assert.doesNotMatch(page, /rules: \["transport_timeout"[^\]]*"returning"/);
  assert.match(page, /全部业务预警/);
  assert.match(page, /细分业务预警/);
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
