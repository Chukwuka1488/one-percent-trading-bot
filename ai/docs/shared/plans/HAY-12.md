# HAY-12: Adaptive Trading Strategy Implementation Plan

## Overview

Implement an adaptive trading strategy for Freqtrade that automatically switches between three trading modes based on market regime detection using ADX (Average Directional Index):

1. **Trend-Following Mode** (ADX > 25): EMA crossover with MACD confirmation
2. **Mean-Reversion Mode** (ADX < 20, stable volatility): RSI + Bollinger Bands
3. **Breakout Mode** (ADX < 20, expanding volatility): Bollinger Band squeeze breakout

This approach is supported by academic research showing 50/50 blended strategies achieve Sharpe ratios of 1.71 and up to 56% annualized returns.

## Current State Analysis

**Existing Infrastructure:**

- Freqtrade configured with dry-run mode (`freqtrade/user_data/config.template.json`)
- Sample strategies exist (`freqtrade/user_data/strategies/SampleStrategy.py`, `sample_strategy.py`)
- Trading pairs: BTC/USDT, ETH/USDT (matches HAY-12 requirements)
- Docker orchestration ready (`docker-compose.yml:96-108`)
- API server on port 8080

**Key Discoveries from Research:**

- ADX > 25 indicates trending market (use trend-following)
- ADX < 20 indicates ranging market (use mean-reversion or watch for breakout)
- Optimal ADX period: 13-14 based on Bitcoin backtests
- EMA 9/21 crossover with RSI > 55 filter performs well
- RSI 30/70 with Bollinger Bands for mean-reversion
- Bollinger Band width expansion signals breakout opportunities

**Research Sources:**

- [QuantPedia: Trend-following and Mean-reversion in Bitcoin](https://quantpedia.com/revisiting-trend-following-and-mean-reversion-strategies-in-bitcoin/)
- [arXiv: Technical Analysis Meets Machine Learning](https://arxiv.org/html/2511.00665v1)
- [Freqtrade ADXMomentum Strategy](https://github.com/freqtrade/freqtrade-strategies/blob/main/user_data/strategies/berlinguyinca/ADXMomentum.py)

## Desired End State

A fully functional adaptive trading strategy that:

1. Detects market regime using ADX
2. Applies appropriate strategy for each regime
3. Runs in paper trading mode on BTC/USDT and ETH/USDT
4. Includes proper risk management (stoploss, trailing stop, ROI targets)
5. Can be backtested and hyperopt-optimized

**Verification:**

- Strategy loads without errors in Freqtrade
- Backtesting produces valid results
- Paper trading generates signals on both pairs
- All three modes trigger based on market conditions

## What We're NOT Doing

- Live trading (dry_run stays true)
- Short positions (long only for initial version)
- Multi-timeframe analysis (single 5m timeframe)
- Machine learning/FreqAI integration
- Custom hyperopt loss functions
- Integration with n8n sentiment signals (future enhancement)

## Implementation Approach

Create a single strategy file `OnePercentAdaptive.py` that:

1. Calculates all required indicators in `populate_indicators()`
2. Detects market regime using ADX and Bollinger Band width
3. Applies regime-specific entry logic in `populate_entry_trend()`
4. Applies regime-specific exit logic in `populate_exit_trend()`
5. Uses hyperoptable parameters for future optimization

---

## Phase 1: Create Strategy File with Indicators

### Overview

Create the base strategy file with all required indicators for regime detection and signal generation.

### Changes Required:

#### 1. Create Strategy File

**File**: `freqtrade/user_data/strategies/OnePercentAdaptive.py`

```python
# pragma pylint: disable=missing-docstring, invalid-name, pointless-string-statement
# flake8: noqa: F401
# isort: skip_file

"""
OnePercentAdaptive Strategy
===========================
An adaptive trading strategy that switches between:
1. Trend-Following (ADX > 25): EMA crossover + MACD
2. Mean-Reversion (ADX < 20, stable BB): RSI + Bollinger Bands
3. Breakout (ADX < 20, expanding BB): BB squeeze breakout

Research basis:
- QuantPedia: 50/50 blended strategies achieve Sharpe 1.71
- arXiv: Optimal ADX period 13, MACD+ADX achieved 35.45% return
- Freqtrade community: ADXMomentum pattern
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from pandas import DataFrame
from typing import Optional, Union

from freqtrade.strategy import (
    IStrategy,
    IntParameter,
    DecimalParameter,
    BooleanParameter,
)

import talib.abstract as ta
from technical import qtpylib


class OnePercentAdaptive(IStrategy):
    """
    Adaptive strategy that detects market regime and applies appropriate logic.

    Regimes:
    - TRENDING: ADX > 25 → Use EMA crossover + MACD
    - RANGING: ADX < 20, BB width stable → Use RSI + BB mean reversion
    - BREAKOUT: ADX < 20, BB width expanding → Catch breakout moves
    """

    # Strategy interface version
    INTERFACE_VERSION = 3

    # Can this strategy go short?
    can_short: bool = False

    # Optimal timeframe for the strategy
    timeframe = '5m'

    # Minimal ROI - tiered exit for 5m scalping
    minimal_roi = {
        "0": 0.02,      # 2% immediate
        "15": 0.01,     # 1% after 15 min
        "30": 0.005,    # 0.5% after 30 min
        "60": 0.0       # Breakeven after 60 min
    }

    # Stoploss
    stoploss = -0.05  # 5% stoploss

    # Trailing stoploss
    trailing_stop = True
    trailing_stop_positive = 0.02       # 2% trailing when profitable
    trailing_stop_positive_offset = 0.03  # Activate after 3% gain
    trailing_only_offset_is_reached = True

    # Run on new candles only
    process_only_new_candles = True

    # Use exit signal
    use_exit_signal = True
    exit_profit_only = False
    ignore_roi_if_entry_signal = False

    # Number of candles for startup (need enough for indicators)
    startup_candle_count: int = 50

    # ==================== HYPEROPTABLE PARAMETERS ====================

    # Regime Detection
    adx_period = IntParameter(10, 20, default=14, space="buy", optimize=True)
    adx_trending_threshold = IntParameter(20, 35, default=25, space="buy", optimize=True)
    adx_ranging_threshold = IntParameter(15, 25, default=20, space="buy", optimize=True)

    # Trend-Following Parameters
    ema_fast = IntParameter(5, 15, default=9, space="buy", optimize=True)
    ema_slow = IntParameter(15, 30, default=21, space="buy", optimize=True)

    # Mean-Reversion Parameters
    rsi_period = IntParameter(10, 20, default=14, space="buy", optimize=True)
    rsi_oversold = IntParameter(20, 40, default=30, space="buy", optimize=True)
    rsi_overbought = IntParameter(60, 80, default=70, space="sell", optimize=True)

    # Bollinger Band Parameters
    bb_period = IntParameter(15, 25, default=20, space="buy", optimize=True)
    bb_std = DecimalParameter(1.5, 2.5, default=2.0, decimals=1, space="buy", optimize=True)

    # Breakout Parameters
    bb_width_percentile = IntParameter(10, 30, default=20, space="buy", optimize=True)
    volume_surge_mult = DecimalParameter(1.2, 2.0, default=1.5, decimals=1, space="buy", optimize=True)

    # ==================== INDICATOR CALCULATION ====================

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Calculate all indicators needed for regime detection and signal generation.
        """

        # ===== REGIME DETECTION INDICATORS =====

        # ADX - Average Directional Index (trend strength)
        dataframe['adx'] = ta.ADX(dataframe, timeperiod=self.adx_period.value)

        # Plus/Minus Directional Indicators (trend direction)
        dataframe['plus_di'] = ta.PLUS_DI(dataframe, timeperiod=self.adx_period.value)
        dataframe['minus_di'] = ta.MINUS_DI(dataframe, timeperiod=self.adx_period.value)

        # ===== TREND-FOLLOWING INDICATORS =====

        # EMA - Exponential Moving Averages
        dataframe['ema_fast'] = ta.EMA(dataframe, timeperiod=self.ema_fast.value)
        dataframe['ema_slow'] = ta.EMA(dataframe, timeperiod=self.ema_slow.value)

        # MACD
        macd = ta.MACD(dataframe)
        dataframe['macd'] = macd['macd']
        dataframe['macd_signal'] = macd['macdsignal']
        dataframe['macd_hist'] = macd['macdhist']

        # ===== MEAN-REVERSION INDICATORS =====

        # RSI
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=self.rsi_period.value)

        # Bollinger Bands
        bollinger = qtpylib.bollinger_bands(
            qtpylib.typical_price(dataframe),
            window=self.bb_period.value,
            stds=self.bb_std.value
        )
        dataframe['bb_lower'] = bollinger['lower']
        dataframe['bb_middle'] = bollinger['mid']
        dataframe['bb_upper'] = bollinger['upper']

        # Bollinger Band Width (for breakout detection)
        dataframe['bb_width'] = (dataframe['bb_upper'] - dataframe['bb_lower']) / dataframe['bb_middle']

        # BB Width percentile (rolling) - low values indicate squeeze
        dataframe['bb_width_pct'] = dataframe['bb_width'].rolling(window=50).apply(
            lambda x: pd.Series(x).rank(pct=True).iloc[-1] * 100, raw=False
        )

        # ===== BREAKOUT INDICATORS =====

        # Volume SMA for surge detection
        dataframe['volume_sma'] = ta.SMA(dataframe['volume'], timeperiod=20)
        dataframe['volume_surge'] = dataframe['volume'] / dataframe['volume_sma']

        # Price momentum for breakout direction
        dataframe['momentum'] = ta.MOM(dataframe, timeperiod=10)

        # ===== REGIME CLASSIFICATION =====

        # Regime flags (for debugging/analysis)
        dataframe['regime_trending'] = (dataframe['adx'] > self.adx_trending_threshold.value).astype(int)
        dataframe['regime_ranging'] = (dataframe['adx'] < self.adx_ranging_threshold.value).astype(int)
        dataframe['regime_squeeze'] = (
            (dataframe['adx'] < self.adx_ranging_threshold.value) &
            (dataframe['bb_width_pct'] < self.bb_width_percentile.value)
        ).astype(int)

        return dataframe

    # ==================== ENTRY LOGIC ====================

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Entry signals based on detected market regime.

        1. TRENDING (ADX > 25): EMA crossover + MACD confirmation
        2. RANGING (ADX < 20): RSI oversold + price at lower BB
        3. BREAKOUT (ADX < 20, BB squeeze): BB width expanding + volume surge
        """

        # Initialize entry column
        dataframe.loc[:, 'enter_long'] = 0

        # ===== MODE 1: TREND-FOLLOWING (ADX > 25) =====
        trend_conditions = (
            # Regime: Strong trend
            (dataframe['adx'] > self.adx_trending_threshold.value) &
            # Signal: EMA fast crosses above slow
            (qtpylib.crossed_above(dataframe['ema_fast'], dataframe['ema_slow'])) &
            # Confirmation: MACD histogram positive
            (dataframe['macd_hist'] > 0) &
            # Direction: Plus DI > Minus DI (uptrend)
            (dataframe['plus_di'] > dataframe['minus_di']) &
            # Safety: Volume present
            (dataframe['volume'] > 0)
        )

        dataframe.loc[trend_conditions, 'enter_long'] = 1

        # ===== MODE 2: MEAN-REVERSION (ADX < 20, stable BB) =====
        reversion_conditions = (
            # Regime: Ranging market
            (dataframe['adx'] < self.adx_ranging_threshold.value) &
            # NOT in squeeze (BB width above threshold)
            (dataframe['bb_width_pct'] >= self.bb_width_percentile.value) &
            # Signal: RSI oversold
            (dataframe['rsi'] < self.rsi_oversold.value) &
            # Confirmation: Price at or below lower BB
            (dataframe['close'] <= dataframe['bb_lower']) &
            # Safety: Volume present
            (dataframe['volume'] > 0)
        )

        dataframe.loc[reversion_conditions, 'enter_long'] = 1

        # ===== MODE 3: BREAKOUT (ADX < 20, BB squeeze + expansion) =====
        breakout_conditions = (
            # Regime: Low ADX (pre-breakout)
            (dataframe['adx'] < self.adx_ranging_threshold.value) &
            # Setup: Was in BB squeeze
            (dataframe['bb_width_pct'].shift(1) < self.bb_width_percentile.value) &
            # Trigger: BB width expanding
            (dataframe['bb_width'] > dataframe['bb_width'].shift(1)) &
            # Direction: Bullish breakout (price above middle BB)
            (dataframe['close'] > dataframe['bb_middle']) &
            # Confirmation: Volume surge
            (dataframe['volume_surge'] > self.volume_surge_mult.value) &
            # Momentum: Positive
            (dataframe['momentum'] > 0) &
            # Safety: Volume present
            (dataframe['volume'] > 0)
        )

        dataframe.loc[breakout_conditions, 'enter_long'] = 1

        return dataframe

    # ==================== EXIT LOGIC ====================

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Exit signals based on detected market regime.

        1. TRENDING: EMA crossover down or MACD reversal
        2. RANGING: RSI overbought or price at upper BB
        3. BREAKOUT: Momentum reversal or volume dry-up
        """

        # Initialize exit column
        dataframe.loc[:, 'exit_long'] = 0

        # ===== TREND-FOLLOWING EXIT =====
        trend_exit = (
            # Regime was trending
            (dataframe['adx'] > self.adx_trending_threshold.value) &
            (
                # Signal: EMA fast crosses below slow
                (qtpylib.crossed_below(dataframe['ema_fast'], dataframe['ema_slow'])) |
                # OR: MACD histogram turns negative
                (qtpylib.crossed_below(dataframe['macd_hist'], 0)) |
                # OR: Trend reversal (Minus DI crosses above Plus DI)
                (qtpylib.crossed_above(dataframe['minus_di'], dataframe['plus_di']))
            ) &
            (dataframe['volume'] > 0)
        )

        dataframe.loc[trend_exit, 'exit_long'] = 1

        # ===== MEAN-REVERSION EXIT =====
        reversion_exit = (
            # Regime: Ranging market
            (dataframe['adx'] < self.adx_trending_threshold.value) &
            (
                # Signal: RSI overbought
                (dataframe['rsi'] > self.rsi_overbought.value) |
                # OR: Price at or above upper BB
                (dataframe['close'] >= dataframe['bb_upper'])
            ) &
            (dataframe['volume'] > 0)
        )

        dataframe.loc[reversion_exit, 'exit_long'] = 1

        # ===== BREAKOUT EXIT =====
        breakout_exit = (
            # Was a breakout entry (momentum was positive)
            (dataframe['momentum'].shift(5) > 0) &
            (
                # Signal: Momentum reversal
                (dataframe['momentum'] < 0) |
                # OR: Volume dries up
                (dataframe['volume_surge'] < 0.8) |
                # OR: Price falls back below middle BB
                (dataframe['close'] < dataframe['bb_middle'])
            ) &
            (dataframe['volume'] > 0)
        )

        dataframe.loc[breakout_exit, 'exit_long'] = 1

        return dataframe

    # ==================== PLOTTING CONFIG ====================

    plot_config = {
        'main_plot': {
            'ema_fast': {'color': 'blue'},
            'ema_slow': {'color': 'orange'},
            'bb_lower': {'color': 'grey'},
            'bb_middle': {'color': 'grey'},
            'bb_upper': {'color': 'grey'},
        },
        'subplots': {
            'ADX': {
                'adx': {'color': 'purple'},
                'plus_di': {'color': 'green'},
                'minus_di': {'color': 'red'},
            },
            'RSI': {
                'rsi': {'color': 'blue'},
            },
            'MACD': {
                'macd': {'color': 'blue'},
                'macd_signal': {'color': 'orange'},
                'macd_hist': {'color': 'grey'},
            },
            'Regime': {
                'regime_trending': {'color': 'green'},
                'regime_ranging': {'color': 'blue'},
                'regime_squeeze': {'color': 'red'},
            },
        },
    }
```

### Success Criteria:

#### Automated Verification:

- [x] Strategy file exists: `ls freqtrade/user_data/strategies/OnePercentAdaptive.py`
- [x] Python syntax valid: `python -m py_compile freqtrade/user_data/strategies/OnePercentAdaptive.py`
- [x] Strategy loads in Freqtrade: `docker compose run --rm freqtrade list-strategies`

#### Manual Verification:

- [ ] Review strategy code for logic correctness
- [ ] Verify all three modes have distinct entry/exit conditions

---

## Phase 2: Update Docker Configuration

### Overview

Update the docker-compose.yml to use the new strategy and ensure proper configuration.

### Changes Required:

#### 1. Update Freqtrade Command

**File**: `docker-compose.yml`

Find the freqtrade service and update the command to use the new strategy:

```yaml
# In the freqtrade service section, update command:
command: trade --config user_data/config.json --strategy OnePercentAdaptive
```

### Success Criteria:

#### Automated Verification:

- [x] Docker compose config valid: `docker compose config --quiet`
- [ ] Freqtrade container starts: `docker compose up -d freqtrade && sleep 5 && docker compose ps freqtrade`

#### Manual Verification:

- [ ] Check container logs show strategy loading: `docker compose logs freqtrade | grep OnePercentAdaptive`

---

## Phase 3: Backtesting Validation

### Overview

Run backtests to validate the strategy works and produces reasonable results.

### Commands to Run:

```bash
# Download test data (if not already present)
docker compose run --rm freqtrade download-data \
    --pairs BTC/USDT ETH/USDT \
    --timeframe 5m \
    --days 60

# Run backtest
docker compose run --rm freqtrade backtesting \
    --config user_data/config.json \
    --strategy OnePercentAdaptive \
    --timeframe 5m \
    --timerange 20251101-20260101
```

### Success Criteria:

#### Automated Verification:

- [ ] Backtest completes without errors
- [ ] Backtest produces trades (trade count > 0)
- [ ] No negative expectancy (profit factor > 0.5)

#### Manual Verification:

- [ ] Review backtest results for reasonable metrics:
  - Win rate > 40%
  - Max drawdown < 20%
  - Sharpe ratio > 0.5
- [ ] Verify trades occur in all three modes (check regime distribution)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation that the backtest results are acceptable before proceeding.

---

## Phase 4: Paper Trading Activation

### Overview

Start the bot in dry-run mode for paper trading validation.

### Commands to Run:

```bash
# Generate config from template
./scripts/generate-freqtrade-config.sh

# Start Freqtrade in dry-run mode
docker compose up -d freqtrade

# Monitor logs
docker compose logs -f freqtrade
```

### Success Criteria:

#### Automated Verification:

- [ ] Freqtrade API responds: `curl -s http://localhost:8080/api/v1/ping`
- [ ] Strategy is active: `curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/show_config | jq '.strategy'`
- [ ] Pairs are loaded: `curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/status`

#### Manual Verification:

- [ ] Monitor for 1-2 hours to see if signals are generated
- [ ] Check that different regimes are being detected
- [ ] Verify no error messages in logs

---

## Phase 5: Documentation and Progress Update

### Overview

Update progress tracking and documentation.

### Changes Required:

#### 1. Update Progress File

**File**: `ai/docs/shared/progress/HAY-12.md`

Update status to Complete and document results.

#### 2. Update SPRINT.md

**File**: `ai/docs/shared/SPRINT.md`

Mark HAY-12 as Complete.

### Success Criteria:

#### Automated Verification:

- [ ] Progress file updated: `grep "Complete" ai/docs/shared/progress/HAY-12.md`
- [ ] Git status clean: `git status --porcelain | wc -l` should show only expected changes

#### Manual Verification:

- [ ] Progress file has backtest results documented
- [ ] Any learnings or parameter adjustments noted

---

## Testing Strategy

### Unit Tests (Future Enhancement)

- Test indicator calculations
- Test regime detection logic
- Test entry/exit signal generation

### Integration Tests

- Backtest with historical data
- Validate trades match expected regime

### Manual Testing Steps

1. Run backtest and review trade distribution across regimes
2. Start paper trading and monitor for 24-48 hours
3. Verify API endpoints return correct strategy info
4. Check logs for any warnings or errors

---

## Performance Considerations

- **Indicator Efficiency**: All indicators use TA-Lib which is C-optimized
- **Memory Usage**: `startup_candle_count = 50` is reasonable for 5m timeframe
- **Processing**: `process_only_new_candles = True` prevents redundant calculations

---

## Risk Management Summary

| Parameter       | Value       | Rationale                          |
| --------------- | ----------- | ---------------------------------- |
| Stoploss        | -5%         | Conservative for crypto volatility |
| Trailing Stop   | 2% positive | Lock in gains                      |
| Trailing Offset | 3%          | Activate after 3% profit           |
| Max Open Trades | 3           | From config (default)              |
| ROI             | 2%→0.5%→0%  | Tiered for 5m scalping             |

---

## References

- Research document: `ai/docs/shared/research/2026-01-24-HAY-12-freqtrade-strategy-implementation.md`
- Original ticket: Linear HAY-12
- Freqtrade docs: https://www.freqtrade.io/en/stable/strategy-customization/
- ADXMomentum pattern: https://github.com/freqtrade/freqtrade-strategies/blob/main/user_data/strategies/berlinguyinca/ADXMomentum.py
- QuantPedia research: https://quantpedia.com/revisiting-trend-following-and-mean-reversion-strategies-in-bitcoin/
