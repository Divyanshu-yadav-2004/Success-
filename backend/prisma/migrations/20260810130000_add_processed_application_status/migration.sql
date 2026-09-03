-- The admin workflow distinguishes a completed delivery from an application
-- that has been processed and is awaiting the next operational step.
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'PROCESSED';
