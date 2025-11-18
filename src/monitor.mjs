import { chromium } from 'playwright-core';

async function sendLineMessage(msg) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = process.env.LINE_USER_ID;

  if (!token) {
    console.error("❌ 沒有設定 LINE_CHANNEL_ACCESS_TOKEN");
    return;
  }
  if (!to) {
    console.error("❌ 沒有設定 LINE_USER_ID");
    return;
  }

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      to,
      messages: [{ type: "text", text: msg }]
    })
  });

  if (!res.ok) {
    console.error("❌ LINE 推播失敗", await res.text());
  } else {
    console.log("✅ LINE 推播成功");
  }
}

async function main() {
  const url = process.env.TOYOKO_URL;
  if (!url) {
    console.error("❌ 沒有設定 TOYOKO_URL");
    return;
  }

  console.log("🔍 開始檢查 Toyoko:", url);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle" });

    // 抓「沒房」的 DOM
    const noResult = page.locator('.room_plan_no-result__VE5k_');
    const isNoResult = await noResult.isVisible().catch(() => false);

    if (isNoResult) {
      console.log("❌ 目前沒房");
      // 你要不要沒房也推播就看你，如果不要，就註解掉
      // await sendLineMessage("Toyoko 目前還是沒房 QQ");
    } else {
      console.log("🎉 有房！！！");
      await sendLineMessage("🎉 Toyoko Inn 有房間了！！快去搶！！");
    }
  } catch (e) {
    console.error("⚠️ 檢查過程發生錯誤：", e);
  } finally {
    await browser.close();
  }
}

// 直接執行
main();
