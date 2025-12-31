# HAY-5: Perplexity API Integration

**Status:** Completed
**Branch:** `feature/hay-5-perplexity`

## Done

- [x] Fixed Linear CLI (wrapper script for direnv)
- [x] Set up progress tracking
- [x] Added PERPLEXITY_API_KEY to .envrc
- [x] Created Perplexity API client with comments
- [x] Created CLI wrapper (`./ai/tools/perplexity/perplexity`)
- [x] Tested all commands (search, news, crypto, sentiment)

## Commands Available

```bash
./ai/tools/perplexity/perplexity search "query"
./ai/tools/perplexity/perplexity news "Bitcoin"
./ai/tools/perplexity/perplexity crypto BTC
./ai/tools/perplexity/perplexity sentiment ETH
```

## Next (HAY-11: n8n Integration)

- [ ] Set up n8n locally
- [ ] Create workflow to call Perplexity client
- [ ] Output signals to trading bot

## Blocked

(none)
