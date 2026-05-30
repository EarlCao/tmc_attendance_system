FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/
COPY prisma.config.ts ./

ENV DATABASE_URL="mysql://root:passcode@mysql:3306/tmc_choir_system_db"

RUN npx prisma generate

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3002

ENTRYPOINT ["sh", "entrypoint.sh"]
