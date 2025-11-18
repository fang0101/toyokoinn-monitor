import playwright from "playwright";
import express from "express";

// ========================
// Render 健康檢查
// ========================
const app = express();
app.get("/", (req, res) => res.send("Toyoko Monitor Running"));
app.listen(process.env.PORT || 3000);

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// ========================
// LINE 傳文字
// ========================
async function sendText(msg) {
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
// LINE 傳圖片
// ========================
async function sendImage(imageBuffer) {
  const form = new FormData();
  form.append("message", "房間圖片如下：");
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
// 監控邏輯
// ========================
async function monitorToyoko() {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url =
    "https://www.toyoko-inn.com/search/result/room_plan/?hotel=00053&start=2026-04-08&end=2026-04-11&room=1&people=2&smoking=all&tab=roomType&sort=recommend&r_avail_only=true";

  let notifiedOnce = false;

  console.log("🚀 Toyoko 監控開始運作");

  while (true) {
    try {
      await page.goto(url, { timeout: 60000 });
      await page.waitForLoadState("networkidle");

      // ⭐⭐ 等真正房型渲染完成（重點！）
      await page.waitForSelector(
        'div[class*="SearchResultRoomPlanParentCard_card-wrapper"] h2',
        { timeout: 10000 }
      );

      // 抓有房型的卡片
      const cards = page.locator('div[class*="SearchResultRoomPlanParentCard_card-wrapper"]');
      const count = await cards.count();

      if (count === 0) {
        console.log("❌ 無房");
      } else {
        console.log(`🎉 有房！！！共 ${count} 種房型`);
      }{


        for (let i = 0; i < count; i++) {
          const card = cards.nth(i);

          // 房型名稱
          const name = await card.locator("h2").innerText();

          // // 價格
          // let price = "未標示價格";
          // try {
          //   price = await card.locator('[class*="price"]').first().innerText();
          // } catch {}

          // 房型資訊（吸菸 / 12 ㎡ / 床型）
          const features = await card
            .locator(".SearchResultRoomPlanIconList_icon__BhMQs p")
            .allInnerTexts();

          // screenshot
          const screenshot = await card.screenshot();

          // LINE 推文字
          await sendText(
            `🏨【${name}】\n📌 ${features.join(
              " / "
            )}\n🖼️（附圖片）`
          );

          // LINE 傳圖片
          await sendImage(screenshot);
        }

        notifiedOnce = true;
      }
    } catch (err) {
      console.log("⚠️ 錯誤：", err);
    }

    console.log("⏳ 30 秒後再檢查...");
    await page.waitForTimeout(30000);
  }
}

monitorToyoko();
