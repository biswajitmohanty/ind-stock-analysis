import type { PatternResult, PatternWeights } from "../types/index.js";
import { PATTERN_WEIGHTS } from "../constants.js";

/**
 * Detect chart patterns from OHLCV data and return weighted score.
 */
export function detectPatterns(
	highs: number[],
	lows: number[],
	closes: number[],
	weights: PatternWeights = PATTERN_WEIGHTS,
): PatternResult {
	let score = 0;
	const patterns: string[] = [];

	// Bullish patterns
	if (isAscendingTriangle(highs, lows)) {
		score += weights.ascendingTriangle;
		patterns.push("Ascending Triangle");
	}
	if (isBullishFlag(closes)) {
		score += weights.bullishFlag;
		patterns.push("Bullish Flag");
	}
	if (isDoubleBottom(lows)) {
		score += weights.doubleBottom;
		patterns.push("Double Bottom");
	}
	if (isFallingWedge(highs, lows)) {
		score += weights.fallingWedge;
		patterns.push("Falling Wedge");
	}
	if (isIslandReversal(closes)) {
		score += weights.islandReversal;
		patterns.push("Island Reversal (Bullish)");
	}

	// Bearish patterns
	if (isDescendingTriangle(highs, lows)) {
		score += weights.descendingTriangle;
		patterns.push("Descending Triangle");
	}
	if (isBearishFlag(closes)) {
		score += weights.bearishFlag;
		patterns.push("Bearish Flag");
	}
	if (isDoubleTop(highs)) {
		score += weights.doubleTop;
		patterns.push("Double Top");
	}
	if (isRisingWedge(highs, lows)) {
		score += weights.risingWedge;
		patterns.push("Rising Wedge");
	}
	if (isHeadAndShoulders(highs)) {
		score += weights.headAndShoulders;
		patterns.push("Head & Shoulders");
	}

	return { score, patterns };
}

/** Flat resistance top + rising lows over last 5 bars */
function isAscendingTriangle(highs: number[], lows: number[]): boolean {
	if (highs.length < 5) return false;
	const recent = highs.slice(-5);
	const recentLows = lows.slice(-5);
	const maxHigh = Math.max(...recent);
	const minHigh = Math.min(...recent);
	const flatTop = (maxHigh - minHigh) / maxHigh < 0.02;
	let risingLows = true;
	for (let i = 1; i < recentLows.length; i++) {
		if (recentLows[i] < recentLows[i - 1]) {
			risingLows = false;
			break;
		}
	}
	return flatTop && risingLows;
}

/** >5% gain over 10 bars + tight consolidation (<5% range) */
function isBullishFlag(closes: number[]): boolean {
	if (closes.length < 15) return false;
	const pole = closes.slice(-15, -5);
	const flag = closes.slice(-5);
	const poleGain = (pole[pole.length - 1] - pole[0]) / pole[0];
	const flagRange = (Math.max(...flag) - Math.min(...flag)) / Math.min(...flag);
	return poleGain > 0.05 && flagRange < 0.05;
}

/** Two nearly equal lows (<2% diff) in 20-bar window */
function isDoubleBottom(lows: number[]): boolean {
	if (lows.length < 20) return false;
	const recent = lows.slice(-20);
	const min1 = Math.min(...recent.slice(0, 10));
	const min2 = Math.min(...recent.slice(10));
	return Math.abs(min1 - min2) / min1 < 0.02;
}

/** Descending highs and lows with highs falling faster over 6 bars */
function isFallingWedge(highs: number[], lows: number[]): boolean {
	if (highs.length < 6) return false;
	const recentH = highs.slice(-6);
	const recentL = lows.slice(-6);
	let descendingHighs = true;
	let descendingLows = true;
	for (let i = 1; i < recentH.length; i++) {
		if (recentH[i] >= recentH[i - 1]) descendingHighs = false;
		if (recentL[i] >= recentL[i - 1]) descendingLows = false;
	}
	const highDrop = (recentH[0] - recentH[recentH.length - 1]) / recentH[0];
	const lowDrop = (recentL[0] - recentL[recentL.length - 1]) / recentL[0];
	return descendingHighs && descendingLows && highDrop > lowDrop;
}

/** Gap down then gap up within 5 bars (>5% gaps) */
function isIslandReversal(closes: number[]): boolean {
	if (closes.length < 7) return false;
	const recent = closes.slice(-7);
	for (let i = 1; i < recent.length - 1; i++) {
		const gapDown = (recent[i - 1] - recent[i]) / recent[i - 1] > 0.05;
		for (let j = i + 1; j < Math.min(i + 5, recent.length); j++) {
			const gapUp = (recent[j] - recent[j - 1]) / recent[j - 1] > 0.05;
			if (gapDown && gapUp) return true;
		}
	}
	return false;
}

/** Flat support bottom + falling highs over 5 bars */
function isDescendingTriangle(highs: number[], lows: number[]): boolean {
	if (highs.length < 5) return false;
	const recentH = highs.slice(-5);
	const recentL = lows.slice(-5);
	const maxLow = Math.max(...recentL);
	const minLow = Math.min(...recentL);
	const flatBottom = (maxLow - minLow) / maxLow < 0.02;
	let fallingHighs = true;
	for (let i = 1; i < recentH.length; i++) {
		if (recentH[i] > recentH[i - 1]) {
			fallingHighs = false;
			break;
		}
	}
	return flatBottom && fallingHighs;
}

/** >5% drop over 10 bars + tight consolidation */
function isBearishFlag(closes: number[]): boolean {
	if (closes.length < 15) return false;
	const pole = closes.slice(-15, -5);
	const flag = closes.slice(-5);
	const poleDrop = (pole[0] - pole[pole.length - 1]) / pole[0];
	const flagRange = (Math.max(...flag) - Math.min(...flag)) / Math.min(...flag);
	return poleDrop > 0.05 && flagRange < 0.05;
}

/** Two nearly equal highs (<2% diff) in 20-bar window */
function isDoubleTop(highs: number[]): boolean {
	if (highs.length < 20) return false;
	const recent = highs.slice(-20);
	const max1 = Math.max(...recent.slice(0, 10));
	const max2 = Math.max(...recent.slice(10));
	return Math.abs(max1 - max2) / max1 < 0.02;
}

/** Rising highs and lows with lows rising faster over 6 bars */
function isRisingWedge(highs: number[], lows: number[]): boolean {
	if (highs.length < 6) return false;
	const recentH = highs.slice(-6);
	const recentL = lows.slice(-6);
	let risingHighs = true;
	let risingLows = true;
	for (let i = 1; i < recentH.length; i++) {
		if (recentH[i] <= recentH[i - 1]) risingHighs = false;
		if (recentL[i] <= recentL[i - 1]) risingLows = false;
	}
	const highRise = (recentH[recentH.length - 1] - recentH[0]) / recentH[0];
	const lowRise = (recentL[recentL.length - 1] - recentL[0]) / recentL[0];
	return risingHighs && risingLows && lowRise > highRise;
}

/** Head peak > left/right shoulders + shoulders within 3% of each other */
function isHeadAndShoulders(highs: number[]): boolean {
	if (highs.length < 15) return false;
	const recent = highs.slice(-15);
	const third = Math.floor(recent.length / 3);
	const leftShoulder = Math.max(...recent.slice(0, third));
	const head = Math.max(...recent.slice(third, third * 2));
	const rightShoulder = Math.max(...recent.slice(third * 2));
	const shoulderDiff = Math.abs(leftShoulder - rightShoulder) / leftShoulder;
	return head > leftShoulder && head > rightShoulder && shoulderDiff < 0.03;
}
