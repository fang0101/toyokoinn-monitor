# 使用 Playwright 官方 image（內建瀏覽器）
FROM mcr.microsoft.com/playwright:v1.47.0-focal

# 工作目錄
WORKDIR /app

# 複製 package.json，安裝依賴
COPY package.json ./
RUN npm install

# 複製程式碼
COPY src ./src

# 預設啟動指令
CMD ["node", "src/monitor.mjs"]
