import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { Text, Spinner } from '../atoms';

export interface OHLCData {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickChartProps {
  data: OHLCData[];
  pair?: string;
  isLoading?: boolean;
  height?: number;
  className?: string;
}

// Chart theme matching our design system
const chartColors = {
  background: '#0D0D0D',
  text: 'rgba(255, 255, 255, 0.6)',
  grid: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  upColor: '#00FF88',
  downColor: '#FF4D4D',
  wickUpColor: '#00FF88',
  wickDownColor: '#FF4D4D',
};

export function CandlestickChart({
  data,
  pair = 'BTC/USDT',
  isLoading = false,
  height = 400,
  className = '',
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: chartColors.background },
        textColor: chartColors.text,
      },
      grid: {
        vertLines: { color: chartColors.grid },
        horzLines: { color: chartColors.grid },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: chartColors.border,
      },
      timeScale: {
        borderColor: chartColors.border,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: chartColors.upColor,
      downColor: chartColors.downColor,
      borderVisible: false,
      wickUpColor: chartColors.wickUpColor,
      wickDownColor: chartColors.wickDownColor,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height]);

  // Update data
  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    const formattedData = data.map((item) => ({
      time: (typeof item.time === 'string' ? new Date(item.time).getTime() / 1000 : item.time),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    seriesRef.current.setData(formattedData);

    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  if (isLoading) {
    return (
      <div
        className={`glass-card flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <Spinner size="lg" className="text-profit" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div
        className={`glass-card flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <Text color="muted">No chart data available</Text>
      </div>
    );
  }

  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <Text variant="h4">{pair}</Text>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-profit" />
            <Text variant="caption" color="muted">Bullish</Text>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-loss" />
            <Text variant="caption" color="muted">Bearish</Text>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} />
    </div>
  );
}
