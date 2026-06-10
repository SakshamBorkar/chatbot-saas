-- Run this ONCE in your PostgreSQL database before running prisma db push
-- Enables the pgvector extension for storing and searching embeddings

CREATE EXTENSION IF NOT EXISTS vector;

-- After running this, run: npx prisma db push
