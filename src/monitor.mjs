import playwright from "playwright";
import express from "express";

// ====== 啟動 Express 讓 Render 健康檢查通過 ======
const app = express();
app.get("/", (req, res) => {
  res.send("Toyoko Monitor Running");
});
app.listen(process.env.PORT || 3000, () => {
  console.log(`🌍 Web server running on port ${process.env.PORT || 3000}`);
});


// ====== LINE 訊息 ======
async function sendLineMessage(message) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = process.env.LINE_USER_ID;

  if (!token) throw new Error("❌ CHANNEL_ACCESS_TOKEN 沒設定");
  if (!to) throw new Error("❌ LINE_USER_ID 沒設定");

  const body = {
    to,
    messages: [{ type: "text", text: message }]
  };

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`❌ LINE 推播失敗：${res.status} ${res.statusText}`);
    console.error("回傳內容：", errorBody);
  } else {
    console.log("✅ LINE 推播成功");
  }
}


// ====== 主監控程式 ======
async function monitorToyoko() {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url =
    'https://www.toyoko-inn.com/search/result/room_plan/?hotel=00053&start=2026-04-08&end=2026-04-11&room=1&people=2&smoking=all&tab=roomType&sort=recommend&r_avail_only=true';

  let counter = 0;

  while (true) {
    counter++;
    console.log(`[${new Date().toLocaleString()}] 第 ${counter} 次檢查房間...`);

    try {
      await page.goto(url, { timeout: 60000 });
      await page.waitForLoadState("networkidle");

      const noResult = await page.locator(".room_plan_no-result__VE5k_").isVisible();

      if (noResult) {
        console.log("❌ 沒房");
        //await sendLineMessage("Toyoko Inn 目前沒有房間…");
      } else {
        console.log("🎉 有房！！！");
        await sendLineMessage("🎉 Toyoko Inn 有房間了！！快去搶！！");
        // ※ 若你只想通知一次並停止 → 可加 break
      }

    } catch (err) {
      console.error("⚠️ 錯誤：", err);
    }

    console.log("⏳ 等 30 秒後再檢查...");
    await page.waitForTimeout(30000);
  }
}


monitorToyoko();
