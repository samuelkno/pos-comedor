FROM node:20-alpine

# better-sqlite3 necesita compilar módulos nativos
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
