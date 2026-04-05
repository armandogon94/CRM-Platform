# ---- Dev Stage ----
FROM node:20-alpine AS dev

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 13000

# ---- Prod Stage ----
FROM node:20-alpine AS prod

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 13000

CMD ["node", "dist/server.js"]
