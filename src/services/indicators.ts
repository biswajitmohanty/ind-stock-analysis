import {
	ATR,
	BollingerBands,
	EMA,
	MACD,
	RSI,
	SMA,
	Stochastic,
	WilliamsR,
} from "technicalindicators";
import type { IndicatorValues } from "../types/index.js";

/**
 * Calculate all technical indicators from historical OHLCV data.
 * Returns the latest values for each indicator.
 */
export function calculateAllIndicators(
	closes: number[],
	highs: number[],
	lows: number[],
): IndicatorValues {
	// RSI - Relative Strength Index (Period 14)
	const rsiValues = RSI.calculate({ period: 14, values: closes });
	const rsi = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : 50;

	// Stochastic Oscillator (Period 14, Signal 3)
	const stochValues = Stochastic.calculate({
		high: highs,
		low: lows,
		close: closes,
		period: 14,
		signalPeriod: 3,
	});
	const stochasticK =
		stochValues.length > 0 ? (stochValues[stochValues.length - 1].k ?? 50) : 50;

	// Bollinger Bands (Period 20, 2 StdDev)
	const bbValues = BollingerBands.calculate({
		period: 20,
		values: closes,
		stdDev: 2,
	});
	const bb = bbValues.length > 0 ? bbValues[bbValues.length - 1] : null;
	const bbLower = bb?.lower ?? closes[closes.length - 1];
	const bbUpper = bb?.upper ?? closes[closes.length - 1];

	// Donchian Channels (20-day manual calculation)
	const donchianPeriod = 20;
	const recentHighs = highs.slice(-donchianPeriod);
	const recentLows = lows.slice(-donchianPeriod);
	const donchUpper = Math.max(...recentHighs);
	const donchLower = Math.min(...recentLows);

	// Williams %R (Period 14)
	const wrValues = WilliamsR.calculate({
		high: highs,
		low: lows,
		close: closes,
		period: 14,
	});
	const williamsR = wrValues.length > 0 ? wrValues[wrValues.length - 1] : -50;

	// ATR - Average True Range (Period 14)
	const atrValues = ATR.calculate({
		high: highs,
		low: lows,
		close: closes,
		period: 14,
	});
	const atr = atrValues.length > 0 ? atrValues[atrValues.length - 1] : 0;

	// MACD (Fast 12, Slow 26, Signal 9)
	const macdValues = MACD.calculate({
		values: closes,
		fastPeriod: 12,
		slowPeriod: 26,
		signalPeriod: 9,
		SimpleMAOscillator: true,
		SimpleMASignal: true,
	});
	const macdLatest =
		macdValues.length > 0 ? macdValues[macdValues.length - 1] : null;
	const macd = macdLatest?.MACD ?? 0;
	const macdSignal = macdLatest?.signal ?? 0;
	const macdHistogram = macdLatest?.histogram ?? 0;

	// SMA 20 - Simple Moving Average
	const smaValues = SMA.calculate({ period: 20, values: closes });
	const sma20 = smaValues.length > 0 ? smaValues[smaValues.length - 1] : closes[closes.length - 1];

	// EMA 20 - Exponential Moving Average
	const emaValues = EMA.calculate({ period: 20, values: closes });
	const ema20 = emaValues.length > 0 ? emaValues[emaValues.length - 1] : closes[closes.length - 1];

	return {
		rsi,
		stochasticK,
		bbLower,
		bbUpper,
		donchLower,
		donchUpper,
		williamsR,
		atr,
		macd,
		macdSignal,
		macdHistogram,
		sma20,
		ema20,
	};
}
