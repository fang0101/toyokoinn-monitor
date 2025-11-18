import "dotenv/config";
import playwright from "playwright";
import express from "express";

// ========================
// Render 本地/雲端 健康檢查伺服器
// ========================
const app = express();
app.get("/", (req, res) => res.send("Toyoko Monitor Running"));
app.listen(process.env.PORT || 3000);

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// ========================
// LINE Notify 傳文字
// ========================
async function sendText(msg) {
  if (!LINE_TOKEN) return console.log("⚠️ 無 LINE TOKEN，跳過通知");

  await fetch("https://notify-api.line.me/api/notify", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LINE_TOKEN}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `message=${encodeURIComponent(msg)}`,
  });
}

// ========================
// LINE Notify 傳圖片
// ========================
async function sendImage(imageBuffer) {
  if (!LINE_TOKEN) return;

  const form = new FormData();
  form.append("message", "房型圖片如下：");
  form.append("imageFile", new Blob([imageBuffer]), "room.jpg");

  await fetch("https://notify-api.line.me/api/notify", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LINE_TOKEN}`,
    },
    body: form,
  });
}

// ========================
// Anti-bot browser launcher
// ========================
async function launchAntiBotBrowser() {
  const browser = await playwright.chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,SitePerProcess",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  const context = await browser.newContext({
    locale: "ja-JP",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  // 移除 webdriver 標記
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });

  return { browser, page };
}

// ========================
// 房況監控
// ========================
async function monitorToyoko() {
  let { browser, page } = await launchAntiBotBrowser();

  const url =
    "https://www.toyoko-inn.com/china/search/result/room_plan/?hotel=00066&start=2025-11-18&end=2025-11-19&room=1&people=1&smoking=all&tab=roomType&sort=recommend&r_avail_only=true";

  console.log("🚀 Toyoko 房況監控啟動（本地 Anti-bot 模式）");

  let loops = 0;

  while (true) {
    try {
      loops++;
      console.log(`🔍 第 ${loops} 次檢查`);

      await page.goto(url, { timeout: 60000 });
      await page.waitForLoadState("networkidle");

      // 有時 Next.js CSR 會延遲
      await page.waitForTimeout(3000);

      const selector =
        'div[class*="SearchResultRoomPlanParentCard_card-wrapper"] h2';

      const found = await page
        .locator(selector)
        .first()
        .isVisible()
        .catch(() => false);

      if (!found) {
        console.log("❌ 無房 或 Anti-bot 阻擋");
      } else {
        const cards = page.locator(
          'div[class*="SearchResultRoomPlanParentCard_card-wrapper"]'
        );
        const count = await cards.count();

        console.log(`🎉 找到 ${count} 種房型！`);

        await sendText(`🏨 Toyoko 有房！共 ${count} 種房型！`);

        for (let i = 0; i < count; i++) {
          const card = cards.nth(i);

          const name = await card.locator("h2").innerText();

          const features = await card
            .locator(".SearchResultRoomPlanIconList_icon__BhMQs p")
            .allInnerTexts();

          const screenshot = await card.screenshot();

          await sendText(`【${name}】\n${features.join(" / ")}`);
          await sendImage(screenshot);
        }
      }
    } catch (err) {
      console.log("⚠️ 錯誤：", err);
    }

    await page.waitForTimeout(30000);
  }
}

monitorToyoko();
