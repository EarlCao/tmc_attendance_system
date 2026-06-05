import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

let prisma = new PrismaClient({ adapter });

export { prisma };
export const setPrisma = (enhanced) => { prisma = enhanced; };