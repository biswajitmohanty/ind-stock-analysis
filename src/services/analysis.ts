import {
	BUY_THRESHOLD,
	INDICATOR_WEIGHTS,
	INDIA_VIX_HIGH_THRESHOLD,
	INDIA_VIX_LOW_THRESHOLD,
	SELL_THRESHOLD,
} from "../constants.js";
import type { IndicatorWeights, OpinionResult } from "../types/index.js";

interface GetOpinionParams {
	rsi: number;
	stochasticK: number;
	close: number;
	bbLower: number;
	bbUpper: number;
	donchLower: number;
	donchUpper: number;
	williamsR: number;
	indiaVix: number;
	patternScore: number;
	macdHistogram: number;
	sma20: number;
	ema20: number;
	weights?: IndicatorWeights;
	buyThreshold?: number;
	sellThreshold?: number;
}

/**
 * Generate BUY/SELL/HOLD opinion based on weighted indicator scoring.
 *
 * Uses India VIX instead of US Fear & Greed Index:
 * - India VIX > 20 (high fear) = bullish contrarian signal (BUY)
 * - India VIX < 13 (low fear/complacency) = bearish contrarian signal (SELL)
 */
export function getOpinion(params: GetOpinionParams): OpinionResult {
	const {
		rsi,
		stochasticK,
		close,
		bbLower,
		bbUpper,
		donchLower,
		donchUpper,
		williamsR,
		indiaVix,
		patternScore,
		macdHistogram,
		sma20,
		ema20,
		weights = INDICATOR_WEIGHTS,
		buyThreshold = BUY_THRESHOLD,
		sellThreshold = SELL_THRESHOLD,
	} = params;

	let buyScore = 0;
	let sellScore = 0;

	// RSI
	if (rsi < 30) buyScore += weights.rsi;
	if (rsi > 70) sellScore += weights.rsi;

	// Stochastic %K
	if (stochasticK < 20) buyScore += weights.stochastic;
	if (stochasticK > 80) sellScore += weights.stochastic;

	// Bollinger Bands
	if (close <= bbLower) buyScore += weights.bollinger;
	if (close >= bbUpper) sellScore += weights.bollinger;

	// Donchian Channels
	if (close <= donchLower) buyScore += weights.donchian;
	if (close >= donchUpper) sellScore += weights.donchian;

	// Williams %R
	if (williamsR < -80) buyScore += weights.williamsR;
	if (williamsR > -20) sellScore += weights.williamsR;

	// India VIX (contrarian — high VIX = fear = buy signal)
	if (indiaVix > INDIA_VIX_HIGH_THRESHOLD) buyScore += weights.indiaVix;
	if (indiaVix < INDIA_VIX_LOW_THRESHOLD) sellScore += weights.indiaVix;

	// MACD Histogram
	if (macdHistogram > 0) buyScore += weights.macd;
	if (macdHistogram < 0) sellScore += weights.macd;

	// SMA 20
	if (close > sma20) buyScore += weights.sma;
	if (close < sma20) sellScore += weights.sma;

	// EMA 20
	if (close > ema20) buyScore += weights.ema;
	if (close < ema20) sellScore += weights.ema;

	// Pattern score
	if (patternScore > 0) buyScore += patternScore;
	if (patternScore < 0) sellScore += Math.abs(patternScore);

	// Decision
	let opinion: string;
	if (buyScore >= buyThreshold && buyScore >= sellScore) {
		opinion = "BUY";
	} else if (sellScore >= sellThreshold && sellScore > buyScore) {
		opinion = "SELL";
	} else {
		opinion = "HOLD";
	}

	return { opinion, buyScore, sellScore };
}
