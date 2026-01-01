# n8n Workflows

## Crypto Sentiment Pipeline

Automated pipeline: Perplexity (research) → Gemini (analysis) → Signal

### Setup Instructions

#### 1. Create Credentials in n8n

Go to **Settings → Credentials** and create:

**Perplexity API** (HTTP Header Auth):

- Name: `Perplexity API`
- Header Name: `Authorization`
- Header Value: `Bearer YOUR_PERPLEXITY_API_KEY`

**Gemini API** (HTTP Query Auth):

- Name: `Gemini API`
- Query Parameter Name: `key`
- Query Parameter Value: `YOUR_GEMINI_API_KEY`

**Trading DB** (PostgreSQL):

- Name: `Trading DB`
- Host: `postgres` (or `trading-postgres` if outside Docker)
- Port: `5432`
- Database: `trading_bot`
- User: `trading`
- Password: `trading_local`

#### 2. Create Signals Table

Run this SQL in PostgreSQL:

```sql
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

CREATE INDEX idx_signals_symbol ON signals(symbol);
CREATE INDEX idx_signals_timestamp ON signals(timestamp);
CREATE INDEX idx_signals_sentiment ON signals(sentiment);
```

#### 3. Import Workflow

1. Go to **Workflows** in n8n
2. Click **Add Workflow** → **Import from File**
3. Select `crypto-sentiment-pipeline.json`
4. Update credential references in each node
5. Save and activate

### Pipeline Flow

```
┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│  Trigger    │────▶│  Perplexity   │────▶│   Gemini    │
│  (Manual/   │     │  (Research)   │     │ (Analysis)  │
│   Cron)     │     │               │     │             │
└─────────────┘     └───────────────┘     └──────┬──────┘
                                                 │
     ┌───────────────┐     ┌─────────────┐      │
     │   Database    │◀────│   Filter    │◀─────┘
     │   (signals)   │     │ (conf>0.7)  │
     └───────────────┘     └─────────────┘
```

### Testing

1. Open the workflow in n8n
2. Click **Test Workflow**
3. Check the output at each node
4. Verify signal saved in database:

```sql
SELECT * FROM signals ORDER BY timestamp DESC LIMIT 5;
```
