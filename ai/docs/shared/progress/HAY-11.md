# HAY-11: n8n Local Setup + Docker Environment

**Status:** Ready for Review
**Branch:** `feature/hay-11-n8n-docker`

## Done

- [x] Created docker-compose.yml with n8n + PostgreSQL
- [x] Set up local volume mounts in .docker/
- [x] Created .env.example for credentials
- [x] Added .docker/ to .gitignore
- [x] n8n running on http://localhost:5678
- [x] PostgreSQL running on localhost:5434
- [x] Created signals table in database
- [x] Created workflow JSON (Perplexity → Gemini → Signal)
- [x] Added Makefile targets (up, down, logs, ps)

## Next

- [ ] Import workflow into n8n UI
- [ ] Configure API credentials in n8n
- [ ] Test end-to-end pipeline

## Commands

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f n8n

# Stop services
docker compose down

# n8n UI
open http://localhost:5678
```

## Architecture

```
┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│   Cron/     │────▶│   Perplexity  │────▶│   Gemini    │
│   Trigger   │     │   (research)  │     │ (sentiment) │
└─────────────┘     └───────────────┘     └──────┬──────┘
                                                 │
                                                 ▼
                    ┌───────────────┐     ┌─────────────┐
                    │  Trading Bot  │◀────│   Signal    │
                    │   (future)    │     │   (JSON)    │
                    └───────────────┘     └─────────────┘
```

## Notes

- PostgreSQL stores n8n data + trading signals
- Volume data in `.docker/` directory (gitignored)
- API keys passed via environment variables
