FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "npm run prisma:generate && npm run prisma:push && npm run start"]
