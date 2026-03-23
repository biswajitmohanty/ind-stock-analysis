import type { IndicatorWeights, PatternWeights } from "./types/index.js";

/** Directory for CSV/JSON output files */
export const CSV_DIR = "public";

/** Currency symbol for Indian Rupee */
export const CURRENCY_SYMBOL = "₹";

/** Default exchange suffix for NSE */
export const DEFAULT_EXCHANGE = "NS";

/** Default indicator weights */
export const INDICATOR_WEIGHTS: IndicatorWeights = {
	rsi: 79,
	stochastic: 76,
	bollinger: 78,
	donchian: 74,
	williamsR: 72,
	indiaVix: 50,
	macd: 75,
	sma: 60,
	ema: 65,
};

/** Default pattern weights */
export const PATTERN_WEIGHTS: PatternWeights = {
	ascendingTriangle: 75,
	bullishFlag: 75,
	doubleBottom: 70,
	fallingWedge: 70,
	islandReversal: 73,
	descendingTriangle: -75,
	bearishFlag: -75,
	doubleTop: -70,
	risingWedge: -70,
	headAndShoulders: -73,
};

/** Scoring thresholds */
export const BUY_THRESHOLD = 200;
export const SELL_THRESHOLD = 200;

/** Risk management multipliers */
export const RISK_MULTIPLIER = 1.5;
export const REWARD_MULTIPLIER = 2;
export const TRAILING_MULTIPLIER = 1.2;
export const TRAILING_ACTIVATION_MULTIPLIER = 0.5;

/** India VIX thresholds (replaces US Fear & Greed Index)
 *  India VIX > 20 = High fear/volatility = Bullish contrarian signal
 *  India VIX < 13 = Low fear/complacency = Bearish contrarian signal
 */
export const INDIA_VIX_HIGH_THRESHOLD = 20;
export const INDIA_VIX_LOW_THRESHOLD = 13;

/** Default tickers for Indian market (Nifty 50 blue chips) */
export const DEFAULT_INDIAN_TICKERS = [
	"RELIANCE.NS",
	"TCS.NS",
	"INFY.NS",
	"HDFCBANK.NS",
	"ICICIBANK.NS",
	"HINDUNILVR.NS",
	"BHARTIARTL.NS",
	"ITC.NS",
	"KOTAKBANK.NS",
	"LT.NS",
	"SBIN.NS",
	"AXISBANK.NS",
	"BAJFINANCE.NS",
	"MARUTI.NS",
	"TATAMOTORS.NS",
	"SUNPHARMA.NS",
	"TITAN.NS",
	"WIPRO.NS",
	"ADANIENT.NS",
	"HCLTECH.NS",
];

/** Learning loop tickers */
export const LEARN_TICKERS = [
	"RELIANCE.NS",
	"TCS.NS",
	"INFY.NS",
	"HDFCBANK.NS",
	"ICICIBANK.NS",
	"SBIN.NS",
	"BAJFINANCE.NS",
	"TATAMOTORS.NS",
];

/** Transaction cost for Indian market (STT + brokerage + stamp duty) */
export const TRANSACTION_COST_PERCENT = 0.15;

/** NSE circuit breaker limits */
export const CIRCUIT_LIMIT_PERCENT = 20;

/** Default calibration parameters */
export const DEFAULT_CALIBRATION = {
	slope: 0.01,
	intercept: -1.0,
};

/**
 * Data source priority order.
 * The data fetcher tries sources in this order and uses the first that succeeds.
 *
 * Environment variables:
 *   UPSTOX_ACCESS_TOKEN  - Upstox OAuth2 access token (enables Upstox as primary source)
 *
 * If UPSTOX_ACCESS_TOKEN is not set, Upstox is skipped and NSE scraping is tried first.
 */
export const DATA_SOURCE_PRIORITY = ["upstox", "nse", "yahoo"] as const;
