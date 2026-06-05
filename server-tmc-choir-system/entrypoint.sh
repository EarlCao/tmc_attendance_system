#!/bin/sh

npx prisma generate
npx prisma migrate deploy

if [ "$NODE_ENV" = "production" ]; then
  npm start
else
  npm run dev
fi
