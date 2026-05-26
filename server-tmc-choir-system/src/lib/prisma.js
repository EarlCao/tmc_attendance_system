import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/maria-db';
import { PrismaClient } from '../../generated/prisma/client.js';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

const prisma = new PrismaClient({ adapter });

export { prisma };