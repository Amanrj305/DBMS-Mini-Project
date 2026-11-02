'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface OHLCVPoint {
  trade_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma_20?: number;
  anomaly_id?: number;
  anomaly_type?: string;
  severity_level?: string;
  anomaly_score?: number;
  anomaly_desc?: string;
}

interface StockChartProps {
  ticker: string;
  currency: string;
  history: OHLCVPoint[];
}

export default function StockChart({ ticker, currency, history }: StockChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!history || history.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-[#111827] border border-slate-800 rounded-xl text-slate-500">
        No historical market data available for {ticker}.
      </div>
    );
  }

  // Display the most recent 60 trading days for clear candlestick resolution
  const visibleData = history.slice(-60);

  // Determine min and max prices for chart scale
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let maxVolume = 0;

  visibleData.forEach((d) => {
    if (d.low < minPrice) minPrice = d.low;
    if (d.high > maxPrice) maxPrice = d.high;
    if (d.volume > maxVolume) maxVolume = d.volume;
  });

  const pricePadding = (maxPrice - minPrice) * 0.1 || 5;
  const chartMin = Math.max(0, minPrice - pricePadding);
  const chartMax = maxPrice + pricePadding;
  const priceRange = chartMax - chartMin || 1;

  const width = 800;
  const height = 360;
  const chartHeight = 260; // Top part for price
  const volumeHeight = 70; // Bottom part for volume
  const paddingLeft = 45;
  const paddingRight = 45;
  const plotWidth = width - paddingLeft - paddingRight;
  const step = plotWidth / Math.max(1, visibleData.length - 1);
  const candleWidth = Math.max(3, Math.min(10, step * 0.65));

  const hoveredPoint = hoveredIndex !== null ? visibleData[hoveredIndex] : null;

  // Generate SMA path
  let smaPath = '';
  visibleData.forEach((d, i) => {
    if (d.sma_20) {
      const x = paddingLeft + i * step;
      const y = chartHeight - ((d.sma_20 - chartMin) / priceRange) * chartHeight;
      if (!smaPath) {
        smaPath += `M ${x} ${y}`;
      } else {
        smaPath += ` L ${x} ${y}`;
      }
    }
  });

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-md">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-base">{ticker}</span>
          <span className="text-slate-400">Currency: {currency}</span>
          <span className="flex items-center gap-1 text-cyan-400 font-medium">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block"></span>
            20-Day SMA
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
            Anomaly Flag
          </span>
        </div>

        {/* Hover info badge */}
        {hoveredPoint ? (
          <div className="flex items-center gap-3 font-mono text-xs text-slate-300">
            <span>Date: {hoveredPoint.trade_date}</span>
            <span>O: {hoveredPoint.open.toFixed(2)}</span>
            <span>H: {hoveredPoint.high.toFixed(2)}</span>
            <span>L: {hoveredPoint.low.toFixed(2)}</span>
            <span className={hoveredPoint.close >= hoveredPoint.open ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              C: {hoveredPoint.close.toFixed(2)}
            </span>
            <span>Vol: {(hoveredPoint.volume / 1000).toFixed(0)}k</span>
            {hoveredPoint.severity_level && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-700">
                {hoveredPoint.severity_level}
              </span>
            )}
          </div>
        ) : (
          <div className="text-slate-500 italic">Hover over chart bars to inspect daily quotes</div>
        )}
      </div>

      {/* SVG Candlestick Canvas */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = chartHeight * (1 - pct);
            const priceLabel = (chartMin + priceRange * pct).toFixed(1);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                />
                <text
                  x={width - paddingRight + 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {priceLabel}
                </text>
              </g>
            );
          })}

          {/* Volume Separator line */}
          <line
            x1={paddingLeft}
            y1={chartHeight + 15}
            x2={width - paddingRight}
            y2={chartHeight + 15}
            stroke="#334155"
          />

          {/* Candlesticks & Volume Bars */}
          {visibleData.map((d, i) => {
            const x = paddingLeft + i * step;
            const isBullish = d.close >= d.open;
            const candleColor = isBullish ? '#10b981' : '#f43f5e';

            // Wick Y positions
            const yHigh = chartHeight - ((d.high - chartMin) / priceRange) * chartHeight;
            const yLow = chartHeight - ((d.low - chartMin) / priceRange) * chartHeight;

            // Body Y positions
            const yOpen = chartHeight - ((d.open - chartMin) / priceRange) * chartHeight;
            const yClose = chartHeight - ((d.close - chartMin) / priceRange) * chartHeight;
            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

            // Volume bar position
            const volBarHeight = Math.max(2, (d.volume / maxVolume) * volumeHeight);
            const volY = height - volBarHeight;

            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
              >
                {/* Hover Guide line */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={height}
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                )}

                {/* Candlestick Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={candleColor}
                  strokeWidth="1.2"
                />

                {/* Candlestick Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={candleColor}
                  rx="1"
                />

                {/* Volume Bar */}
                <rect
                  x={x - candleWidth / 2}
                  y={volY}
                  width={candleWidth}
                  height={volBarHeight}
                  fill={isBullish ? '#065f46' : '#881337'}
                  opacity={isHovered ? '1' : '0.75'}
                />

                {/* Anomaly Marker Flag */}
                {d.severity_level && (
                  <g transform={`translate(${x - 6}, ${Math.max(12, yHigh - 16)})`}>
                    <circle cx="6" cy="6" r="6" fill="#dc2626" />
                    <text
                      x="6"
                      y="9"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="bold"
                    >
                      !
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* SMA Line Path */}
          {smaPath && (
            <path
              d={smaPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.8"
              opacity="0.9"
            />
          )}
        </svg>
      </div>

      {/* Date Axis Sample Labels */}
      <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2 px-10">
        <span>{visibleData[0]?.trade_date}</span>
        <span>{visibleData[Math.floor(visibleData.length / 2)]?.trade_date}</span>
        <span>{visibleData[visibleData.length - 1]?.trade_date}</span>
      </div>
    </div>
  );
}
