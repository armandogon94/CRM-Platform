# ---- Dev Stage ----
FROM node:20-alpine AS dev

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 13009

CMD ["npm", "run", "dev", "--", "--host"]

# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Prod Stage ----
FROM node:20-alpine AS prod

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 13009

CMD ["serve", "-s", "dist", "-l", "13009"]
