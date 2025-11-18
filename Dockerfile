# 使用 Playwright 官方 image（與你本地版本相同）
FROM mcr.microsoft.com/playwright:v1.46.1-jammy

WORKDIR /app

# 先複製 package.json 讓 Render Cache npm install
COPY package*.json ./

RUN npm install

# 再複製程式碼
COPY . .

CMD ["node", "src/monitor.mjs"]
