# pragma pylint: disable=missing-docstring, invalid-name, pointless-string-statement
# --- Do not remove these imports ---
import numpy as np
import pandas as pd
from pandas import DataFrame
from datetime import datetime
from typing import Optional, Union

from freqtrade.strategy import IStrategy, IntParameter, DecimalParameter


class SampleStrategy(IStrategy):
    """
    Sample Strategy for One Percent Trading Bot

    This is a simple RSI-based strategy for demonstration/dry-run purposes.
    NOT for live trading without proper backtesting and optimization.
    """

    # Strategy interface version
    INTERFACE_VERSION = 3

    # Optimal timeframe for the strategy
    timeframe = '5m'

    # ROI table
    minimal_roi = {
        "60": 0.01,    # 1% after 60 minutes
        "30": 0.02,    # 2% after 30 minutes
        "0": 0.04      # 4% immediately
    }

    # Stoploss
    stoploss = -0.10  # -10%

    # Trailing stoploss
    trailing_stop = False

    # Run on new candles only
    process_only_new_candles = True

    # Use exit signal
    use_exit_signal = True
    exit_profit_only = False
    ignore_roi_if_entry_signal = False

    # Number of candles for startup
    startup_candle_count: int = 30

    # Strategy parameters
    buy_rsi = IntParameter(20, 40, default=30, space="buy")
    sell_rsi = IntParameter(60, 80, default=70, space="sell")

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Adds RSI indicator to the dataframe
        """
        # RSI
        dataframe['rsi'] = self.rsi(dataframe['close'], 14)

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Entry signal: RSI below threshold
        """
        dataframe.loc[
            (
                (dataframe['rsi'] < self.buy_rsi.value) &
                (dataframe['volume'] > 0)
            ),
            'enter_long'] = 1

        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Exit signal: RSI above threshold
        """
        dataframe.loc[
            (
                (dataframe['rsi'] > self.sell_rsi.value) &
                (dataframe['volume'] > 0)
            ),
            'exit_long'] = 1

        return dataframe

    @staticmethod
    def rsi(series: pd.Series, period: int = 14) -> pd.Series:
        """
        Calculate RSI indicator
        """
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
