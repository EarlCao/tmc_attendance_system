-- Add the GRADUATED value to the MemberStatus and OfficerStatus enums so the
-- database matches the Prisma schema (the enums were originally created without
-- GRADUATED in the init migration). IF NOT EXISTS makes this idempotent and
-- safe to re-run.

-- AlterEnum
ALTER TYPE "MemberStatus" ADD VALUE IF NOT EXISTS 'GRADUATED';

-- AlterEnum
ALTER TYPE "OfficerStatus" ADD VALUE IF NOT EXISTS 'GRADUATED';
