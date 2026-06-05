FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 3302

CMD ["sh", "./entrypoint.sh"]
