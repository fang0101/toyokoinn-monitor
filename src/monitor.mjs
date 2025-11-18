const cards = page.locator('[class*="SearchResultRoomPlanParentCard_card-wrapper"]');
const count = await cards.count();

if (count > 0) {
  console.log(`🎉 有房！共 ${count} 種房型`);

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);

    // 房型名稱
    const name = await card.locator("h2").innerText();

    // // 價格（可能有多個 price → 取第一個）
    // let price = "價格未標示";
    // try {
    //   price = await card.locator('[class*="price"]').first().innerText();
    // } catch {}

    // 功能資訊（吸菸 / 12㎡ / 床型）
    const features = await card
      .locator(".SearchResultRoomPlanIconList_icon__BhMQs p")
      .allInnerTexts();

    // 首張房型圖片 URL
    const imgUrl = await card.locator("img").first().getAttribute("src");

    // LINE 推播文字
    const message =
      `🏨 【${name}】\n` +
      // `💰 價格：${price}\n` +
      `📌 房型資訊：${features.join(" / ")}\n` +
      `🖼️ 圖片：${imgUrl}`;

    await sendText(message);

    // Screenshot 截圖
    const imgBuf = await card.screenshot();
    await sendImage(imgBuf);
  }
}
