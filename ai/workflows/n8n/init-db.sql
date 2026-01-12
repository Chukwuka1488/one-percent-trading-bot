-- Trading Bot Database Schema
-- Run this in PostgreSQL to set up tables

-- Signals table: stores AI-generated trading signals
CREATE TABLE IF NOT EXISTS signals (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  sentiment VARCHAR(10) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  recommendation VARCHAR(10) NOT NULL,
  risk_level VARCHAR(10) NOT NULL,
  reasoning TEXT,
  key_points JSONB,
  source VARCHAR(50),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);
CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals(timestamp);
CREATE INDEX IF NOT EXISTS idx_signals_sentiment ON signals(sentiment);

-- Example query: Get latest signal for BTC
-- SELECT * FROM signals WHERE symbol = 'BTC' ORDER BY timestamp DESC LIMIT 1;
