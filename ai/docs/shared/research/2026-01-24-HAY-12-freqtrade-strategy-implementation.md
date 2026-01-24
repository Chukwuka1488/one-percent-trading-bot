---
date: 2026-01-24T11:49:11-06:00
researcher: Chukwuka Akibor
git_commit: 11e226fc7674747a06924868e8090582d7a27adc
branch: feature/hay-12-basic-trading-strategy
repository: one-percent-trading-meister
topic: "HAY-12 Basic Trading Strategy - Freqtrade Strategy Implementation Patterns"
tags: [research, codebase, freqtrade, trading-strategy, hay-12]
status: complete
last_updated: 2026-01-24
last_updated_by: Chukwuka Akibor
---

# Research: HAY-12 Basic Trading Strategy - Freqtrade Strategy Implementation Patterns

**Date**: 2026-01-24T11:49:11-06:00
**Researcher**: Chukwuka Akibor
**Git Commit**: 11e226fc7674747a06924868e8090582d7a27adc
**Branch**: feature/hay-12-basic-trading-strategy
**Repository**: one-percent-trading-meister

## Research Question

How to implement a custom trading strategy for HAY-12 using Freqtrade's framework? What are the existing patterns, configuration structure, available technical indicators, and proper strategy file organization?

## Summary

The codebase contains a complete Freqtrade setup with two example strategy implementations that demonstrate the IStrategy interface. Strategies are implemented as Python classes inheriting from `IStrategy`, with three required methods: `populate_indicators()`, `populate_entry_trend()`, and `populate_exit_trend()`. The existing configuration supports dry-run mode with BTC/USDT and ETH/USDT pairs, and includes comprehensive examples of RSI-based trading with Bollinger Bands, TEMA, and MACD indicators. All strategies are stored in `freqtrade/user_data/strategies/`, and the system includes shell scripts for config generation, Docker orchestration, and Makefile automation for testing and monitoring.

## Detailed Findings

### 1. Freqtrade Directory Structure

```
freqtrade/
└── user_data/
    ├── config.template.json          - Configuration template with env vars
    ├── strategies/                   - Trading strategy implementations
    │   ├── SampleStrategy.py        - Simple RSI strategy
    │   └── sample_strategy.py       - Comprehensive multi-indicator strategy
    ├── hyperopts/                    - Hyperparameter optimization
    │   └── sample_hyperopt_loss.py
    ├── notebooks/                    - Strategy analysis
    │   └── strategy_analysis_example.ipynb
    └── logs/                         - Runtime logs
        └── freqtrade.log
```

**Key Locations**:

- Configuration: `freqtrade/user_data/config.template.json`
- Strategies: `freqtrade/user_data/strategies/`
- Config generator: `scripts/generate-freqtrade-config.sh`
- Docker setup: `docker-compose.yml:96-108`

### 2. Configuration Structure

**File**: `freqtrade/user_data/config.template.json`

**Current Configuration**:

```json
{
  "max_open_trades": 3,
  "stake_currency": "USDT",
  "stake_amount": "unlimited",
  "tradable_balance_ratio": 0.99,
  "dry_run": true,
  "dry_run_wallet": 1000,
  "trading_mode": "spot",
  "exchange": {
    "name": "$EXCHANGE_NAME",
    "pair_whitelist": ["BTC/USDT", "ETH/USDT"],
    "pair_blacklist": []
  },
  "pairlists": [{ "method": "StaticPairList" }],
  "api_server": {
    "enabled": true,
    "listen_port": 8080
  },
  "timeframe": "5m"
}
```

**Key Parameters**:

- **dry_run**: `true` (paper trading mode enabled)
- **dry_run_wallet**: `1000` USDT starting balance
- **max_open_trades**: `3` concurrent positions
- **stake_currency**: USDT
- **pair_whitelist**: BTC/USDT, ETH/USDT (matches HAY-12 requirements)
- **API port**: `8080`

**Environment Variables** (from `.env.example`):

- `EXCHANGE_NAME`, `EXCHANGE_API_KEY`, `EXCHANGE_API_SECRET`
- `FREQTRADE_JWT_SECRET`, `FREQTRADE_WS_TOKEN`
- `FREQTRADE_API_USER`, `FREQTRADE_API_PASSWORD`

**Config Generation**:

```bash
# Script: scripts/generate-freqtrade-config.sh
# - Substitutes environment variables
# - Generates secure defaults (JWT, WebSocket tokens, passwords)
# - Creates freqtrade/user_data/config.json
```

### 3. Strategy Class Structure

**Base Pattern** (both strategy files follow this):

```python
from freqtrade.strategy import IStrategy, IntParameter, DecimalParameter
import talib.abstract as ta
from technical import qtpylib

class StrategyName(IStrategy):
    # Required: Interface version
    INTERFACE_VERSION = 3

    # Required: Timeframe
    timeframe = '5m'

    # Required: Risk management
    minimal_roi = {
        "60": 0.01,    # 1% after 60 minutes
        "30": 0.02,    # 2% after 30 minutes
        "0": 0.04      # 4% immediately
    }
    stoploss = -0.10  # -10%

    # Required: Candles needed for indicators
    startup_candle_count: int = 30

    # Optional: Hyperparameters
    buy_rsi = IntParameter(20, 40, default=30, space="buy")
    sell_rsi = IntParameter(60, 80, default=70, space="sell")

    # Required method 1: Calculate indicators
    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe['rsi'] = ta.RSI(dataframe)
        return dataframe

    # Required method 2: Entry signals
    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[(dataframe['rsi'] < self.buy_rsi.value), 'enter_long'] = 1
        return dataframe

    # Required method 3: Exit signals
    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[(dataframe['rsi'] > self.sell_rsi.value), 'exit_long'] = 1
        return dataframe
```

**Required Attributes**:

- `INTERFACE_VERSION = 3`
- `timeframe` (e.g., '1m', '5m', '15m', '1h')
- `minimal_roi` (dict with time:profit mappings)
- `stoploss` (negative decimal, e.g., -0.10 for -10%)
- `startup_candle_count` (int, candles needed before signals)

**Required Methods**:

1. `populate_indicators()` - Add technical indicators to dataframe
2. `populate_entry_trend()` - Define buy/long entry conditions
3. `populate_exit_trend()` - Define sell/exit conditions

**Optional Attributes**:

- `trailing_stop` (bool)
- `can_short` (bool)
- `order_types` (dict)
- `plot_config` (dict for charting)

### 4. Existing Strategy Examples

#### Simple Strategy: `SampleStrategy.py`

**Location**: `freqtrade/user_data/strategies/SampleStrategy.py`

**Strategy Type**: RSI-based mean reversion
**Indicators**: RSI (14-period, custom calculation)
**Entry**: RSI < 30 (oversold)
**Exit**: RSI > 70 (overbought)
**Lines**: 101

**Key Features**:

- Custom RSI calculation (`SampleStrategy.py:89-100`)
- Simple buy/sell logic
- No hyperopt optimization flags
- Minimal dependencies

**Custom RSI Implementation**:

```python
@staticmethod
def rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi
```

#### Comprehensive Strategy: `sample_strategy.py`

**Location**: `freqtrade/user_data/strategies/sample_strategy.py`

**Strategy Type**: Multi-indicator confirmation strategy
**Indicators**: RSI, MACD, Bollinger Bands, TEMA, ADX, Stochastic, MFI, SAR
**Entry**: RSI crossover + TEMA position + BB confirmation
**Exit**: RSI crossover + TEMA reversal
**Lines**: 429

**Active Indicators** (`sample_strategy.py:146-364`):

- **RSI** (line 201): Overbought/oversold
- **MACD** (lines 228-231): Trend and momentum
- **Bollinger Bands** (lines 243-252): Volatility bands
- **TEMA** (line 290): Triple EMA for trend
- **ADX** (line 162): Trend strength
- **Stochastic Fast** (lines 217-218): Momentum oscillator
- **MFI** (line 234): Volume-weighted RSI
- **Parabolic SAR** (line 287): Trailing stop levels
- **Hilbert Transform** (lines 296-297): Cycle detection

**Entry Logic Pattern** (`sample_strategy.py:373-382`):

```python
dataframe.loc[
    (
        # Primary signal: RSI crossover
        (qtpylib.crossed_above(dataframe["rsi"], self.buy_rsi.value))
        # Guard: TEMA below BB middle
        & (dataframe["tema"] <= dataframe["bb_middleband"])
        # Guard: TEMA rising
        & (dataframe["tema"] > dataframe["tema"].shift(1))
        # Safety: Volume present
        & (dataframe["volume"] > 0)
    ),
    "enter_long",
] = 1
```

**Key Patterns**:

- Uses `qtpylib.crossed_above()` for crossover detection
- Multiple guard conditions (TEMA position, direction, volume)
- `shift(1)` for comparing with previous candle
- Supports both long and short positions

### 5. Technical Indicator Library Usage

**TA-Lib** (imported as `ta`):

```python
import talib.abstract as ta

# Momentum indicators
dataframe['rsi'] = ta.RSI(dataframe)
dataframe['adx'] = ta.ADX(dataframe)
macd = ta.MACD(dataframe)  # Returns dict: macd, macdsignal, macdhist

# Moving averages
dataframe['ema50'] = ta.EMA(dataframe, timeperiod=50)
dataframe['sma20'] = ta.SMA(dataframe, timeperiod=20)
dataframe['tema'] = ta.TEMA(dataframe, timeperiod=9)

# Oscillators
stoch = ta.STOCHF(dataframe)  # Returns dict: fastk, fastd
dataframe['mfi'] = ta.MFI(dataframe)

# Pattern indicators
dataframe['sar'] = ta.SAR(dataframe)
```

**qtpylib** (from freqtrade-technical):

```python
from technical import qtpylib

# Helper functions
typical_price = qtpylib.typical_price(dataframe)  # (H+L+C)/3
bollinger = qtpylib.bollinger_bands(typical_price, window=20, stds=2)

# Crossover detection
qtpylib.crossed_above(series1, series2)  # True when series1 crosses above series2
qtpylib.crossed_below(series1, series2)  # True when series1 crosses below series2
```

**Available Indicators** (from `sample_strategy.py` commented sections):

- **Momentum**: ADX, RSI, Stochastic, MACD, MFI, CCI, ROC, Aroon
- **Overlap**: EMA, SMA, TEMA, Bollinger Bands, SAR
- **Volume**: MFI, Volume (raw)
- **Cycle**: Hilbert Transform Sine Wave
- **Patterns**: Candlestick patterns (50+ patterns in TA-Lib)

### 6. Parameter Optimization (Hyperopt)

**Pattern** (`sample_strategy.py:96-101`):

```python
from freqtrade.strategy import IntParameter, DecimalParameter, BooleanParameter

# Integer parameter (e.g., RSI thresholds)
buy_rsi = IntParameter(
    low=1,
    high=50,
    default=30,
    space="buy",
    optimize=True,
    load=True
)

# Decimal parameter (e.g., stop loss)
stoploss_param = DecimalParameter(
    low=-0.20,
    high=-0.05,
    default=-0.10,
    space="sell"
)

# Access in methods
self.buy_rsi.value  # Current parameter value
```

**Parameter Types**:

- `IntParameter`: Integer values
- `DecimalParameter`: Float values
- `BooleanParameter`: True/False
- `CategoricalParameter`: List of options
- `RealParameter`: Continuous float range

**Hyperopt Loss Function**: `freqtrade/user_data/hyperopts/sample_hyperopt_loss.py`

### 7. Signal Definition Patterns

**DataFrame Structure**:

- **Input columns**: open, high, low, close, volume (from exchange)
- **Indicator columns**: Added by `populate_indicators()`
- **Signal columns**: enter_long, exit_long, enter_short, exit_short

**Signal Assignment Pattern**:

```python
# Set signal to 1 where conditions are met
dataframe.loc[
    (
        (condition1) &
        (condition2) &
        (condition3)
    ),
    'enter_long'  # or 'exit_long', 'enter_short', 'exit_short'
] = 1
```

**Conditional Operators**:

- `&` - AND (use for pandas Series)
- `|` - OR
- `~` - NOT
- Comparison: `<`, `>`, `<=`, `>=`, `==`, `!=`

**Time Series Operations**:

```python
# Previous candle
dataframe['close'].shift(1)

# Rolling calculations
dataframe['close'].rolling(window=20).mean()
dataframe['close'].rolling(window=20).std()

# Crossover detection
qtpylib.crossed_above(series1, series2)
qtpylib.crossed_below(series1, series2)
```

### 8. Testing and Validation

**Backtesting**:

```bash
# Via Makefile
make test-freqtrade

# Runs pytest in Docker
# Location: Makefile:88-90
```

**Strategy Analysis**:

- Jupyter notebook: `freqtrade/user_data/notebooks/strategy_analysis_example.ipynb`
- Analyze backtest results, optimize parameters, visualize trades

**API Monitoring** (via Makefile):

```bash
make status   # GET /api/v1/status
make balance  # GET /api/v1/balance
make profit   # GET /api/v1/profit
make logs-freqtrade  # Tail container logs
```

**API Access**:

- Port: `8080`
- Default credentials: `freqtrade:freqtrade`
- Endpoints: `/api/v1/status`, `/api/v1/balance`, `/api/v1/profit`, etc.

### 9. Docker Orchestration

**Service Definition** (`docker-compose.yml:96-108`):

```yaml
freqtrade:
  image: freqtradeorg/freqtrade:stable
  volumes:
    - ./freqtrade/user_data:/freqtrade/user_data
    - ./freqtrade/user_data/logs:/freqtrade/logs:ro
  ports:
    - "8080:8080"
  environment:
    # From .env file
  command: trade --config user_data/config.json --strategy SampleStrategy
```

**Key Points**:

- Volume mount for strategies, configs, logs
- Port 8080 exposed for API
- Command specifies config file and strategy class name

### 10. Automation and Workflows

**n8n Integration** (`ai/workflows/n8n/`):

- `crypto-sentiment-pipeline.json`: Perplexity → Gemini → Trading signals
- `trade-alerts.json`: Trade notifications
- `system-alerts.json`: System monitoring
- `error-alerts.json`: Error handling

**Database Schema** (`ai/workflows/n8n/init-db.sql`):

```sql
CREATE TABLE signals (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20),
  direction VARCHAR(10),  -- bullish/bearish/neutral
  confidence INT,         -- 0-100
  summary TEXT,
  source VARCHAR(50),
  timestamp TIMESTAMPTZ,
  key_points TEXT[]
);
```

**Shell Script Automation**:

- Config generation: `scripts/generate-freqtrade-config.sh`
- AI tool wrappers: `ai/tools/linear/linear`, `ai/tools/perplexity/perplexity`, `ai/tools/gemini/gemini`

## Code References

### Configuration and Setup

- `freqtrade/user_data/config.template.json` - Main configuration template
- `scripts/generate-freqtrade-config.sh` - Config generation script
- `docker-compose.yml:96-108` - Freqtrade service definition
- `.env.example` - Required environment variables

### Strategy Implementation

- `freqtrade/user_data/strategies/SampleStrategy.py:12-101` - Simple RSI strategy
- `freqtrade/user_data/strategies/sample_strategy.py:40-429` - Comprehensive multi-indicator strategy
- `freqtrade/user_data/strategies/sample_strategy.py:146-364` - Indicator calculation examples
- `freqtrade/user_data/strategies/sample_strategy.py:366-395` - Entry signal patterns
- `freqtrade/user_data/strategies/sample_strategy.py:397-428` - Exit signal patterns

### Parameters and Optimization

- `freqtrade/user_data/strategies/sample_strategy.py:96-101` - Hyperopt parameter examples
- `freqtrade/user_data/hyperopts/sample_hyperopt_loss.py` - Custom loss function

### Testing and Analysis

- `freqtrade/user_data/notebooks/strategy_analysis_example.ipynb` - Strategy analysis notebook
- `Makefile:88-90` - Backtesting automation
- `Makefile:141-172` - Monitoring and API access

### Automation

- `ai/workflows/n8n/crypto-sentiment-pipeline.json` - Signal generation workflow
- `ai/workflows/n8n/init-db.sql` - Signals database schema

## Architecture Documentation

### Strategy Execution Flow

```
1. Freqtrade loads strategy class from user_data/strategies/
2. Calls populate_indicators() to calculate technical indicators
3. Calls populate_entry_trend() to identify buy signals
4. Calls populate_exit_trend() to identify sell signals
5. Executes trades based on signals and risk management rules
6. Logs trades to database and sends to dashboard via API
```

### Current Configuration Patterns

**Dry Run Mode** (Paper Trading):

- `dry_run: true`
- `dry_run_wallet: 1000` USDT
- No real funds at risk
- Simulates exchange operations

**Risk Management**:

- `stoploss: -0.10` (10% maximum loss per trade)
- `minimal_roi`: Tiered profit targets (4%, 2%, 1%)
- `max_open_trades: 3` (position limit)
- `tradable_balance_ratio: 0.99` (99% of balance available)

**Trading Pairs** (matches HAY-12 requirements):

- BTC/USDT
- ETH/USDT
- StaticPairList method (whitelist-based)

### Integration Points

**Dashboard ↔ Freqtrade**:

- Dashboard queries Freqtrade API on port 8080
- Displays trades, balance, profit/loss
- Signal types: `dashboard/src/components/organisms/SignalList.tsx:3-12`

**n8n ↔ Freqtrade**:

- n8n workflows generate trading signals
- Stored in PostgreSQL signals table
- Can trigger Freqtrade force-entry via API

**PostgreSQL**:

- Port: 5434
- Stores: trades, signals, workflow data
- Signals table: `ai/workflows/n8n/init-db.sql`

## Strategy Type Recommendations

Based on HAY-12 acceptance criteria ("Choose strategy: grid, DCA, or trend-following"):

### 1. Grid Trading

**Pattern**: Buy at support levels, sell at resistance
**Indicators**: Bollinger Bands, support/resistance levels
**Best for**: Ranging markets
**Example indicators**: BB, ATR for volatility

### 2. DCA (Dollar Cost Averaging)

**Pattern**: Regular purchases at fixed intervals or price drops
**Indicators**: RSI for oversold detection, price drops
**Best for**: Accumulation phase, bear markets
**Example indicators**: RSI, price percentage change

### 3. Trend Following

**Pattern**: Follow established trends, ride momentum
**Indicators**: Moving averages, MACD, ADX
**Best for**: Trending markets
**Example indicators**: EMA crossovers, MACD, ADX > 25
**Current example**: `sample_strategy.py` uses trend-following elements

## Related Research

- HAY-8 progress: Trading Bot Framework setup
- HAY-23 progress: User data configuration
- `docs/boris-workflow.md`: Freqtrade workflow documentation
- `CLAUDE.md:19-27`: Tech stack and architecture

## Open Questions

1. **Strategy selection**: Which of the three strategy types (grid, DCA, trend-following) should be implemented first?
2. **Timeframe**: Should we use 5m (current) or explore other timeframes (1m, 15m, 1h)?
3. **Additional pairs**: Should we add more trading pairs beyond BTC/USDT and ETH/USDT?
4. **Risk parameters**: Are current ROI targets (4%, 2%, 1%) and stoploss (-10%) appropriate?
5. **Hyperopt**: Should the initial strategy include hyperoptable parameters?
6. **Integration**: How should the strategy integrate with n8n sentiment analysis signals?
