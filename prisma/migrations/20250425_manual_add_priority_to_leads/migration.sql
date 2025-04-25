-- Add isPriority column to the Lead table
ALTER TABLE [dbo].[Lead] ADD [isPriority] BIT NOT NULL DEFAULT 0;
