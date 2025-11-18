import { chromium } from "playwright";

async function sendLineMessage(msg) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = process.env.LINE_USER_ID;

  if (!token || !to) {
    console.error("❌ LINE env 未設定");
    return;
  }

  await fetch("https://api.line.me/v2/bot/message/push", {
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
}

async function main() {
  const url = process.env.TOYOKO_URL;
  if (!url) {
    console.error("❌ 未設定 TOYOKO_URL");
    return;
  }

  console.log("🔍 開始檢查 Toyoko:", url);

  // 在 Docker image 裡，Playwright 已經安裝好瀏覽器，不用指定 executablePath
  const browser = await chromium.launch({ headless: true });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });

  const noResult = page.locator(".room_plan_no-result__VE5k_");
  const isNoRoom = await noResult.isVisible().catch(() => false);

  if (isNoRoom) {
    console.log("❌ 沒房");
  } else {
    console.log("🎉 有房！！！");
    await sendLineMessage("🎉 Toyoko Inn 有房間了！！快去搶！！");
  }

  await browser.close();
}

main();
