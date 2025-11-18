FROM mcr.microsoft.com/playwright:latest

WORKDIR /app

COPY package*.json ./
RUN npm install --force

COPY . .

CMD ["node", "src/monitor.mjs"]
