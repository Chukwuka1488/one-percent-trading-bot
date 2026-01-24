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
        # Protect against division by zero
        dataframe['bb_width'] = (dataframe['bb_upper'] - dataframe['bb_lower']) / dataframe['bb_middle'].replace(0, np.nan)

        # BB Width percentile (rolling) - low values indicate squeeze
        dataframe['bb_width_pct'] = dataframe['bb_width'].rolling(window=50).apply(
            lambda x: pd.Series(x).rank(pct=True).iloc[-1] * 100, raw=False
        )

        # ===== BREAKOUT INDICATORS =====

        # Volume SMA for surge detection
        dataframe['volume_sma'] = ta.SMA(dataframe['volume'], timeperiod=20)
        # Protect against division by zero
        dataframe['volume_surge'] = dataframe['volume'] / dataframe['volume_sma'].replace(0, np.nan)

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
            # Was a breakout entry: verify we were in squeeze/low-ADX regime
            (dataframe['regime_squeeze'].shift(5) == 1) &
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
