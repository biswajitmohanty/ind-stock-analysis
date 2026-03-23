/** CLI input options */
export interface CliOptions {
	tickers: string[];
	slackWebhook?: string;
	sort: "asc" | "desc";
	portfolioAction?: string;
	portfolioTicker?: string;
	fundamentals?: boolean;
	news?: boolean;
	options?: boolean;
	dividends?: boolean;
	earnings?: boolean;
	format?: "csv" | "json";
	exchange?: "NSE" | "BSE";
}

/** Raw indicator values from calculateAllIndicators() */
export interface IndicatorValues {
	rsi: number;
	stochasticK: number;
	bbLower: number;
	bbUpper: number;
	donchLower: number;
	donchUpper: number;
	williamsR: number;
	atr: number;
	macd: number;
	macdSignal: number;
	macdHistogram: number;
	sma20: number;
	ema20: number;
}

/** Output of detectPatterns() */
export interface PatternResult {
	score: number;
	patterns: string[];
}

/** Full per-ticker output row */
export interface TickerResult {
	ticker: string;
	date: string;
	close: number;
	volume: number;
	rsi: number;
	stochasticK: number;
	bbLower: number;
	bbUpper: number;
	donchLower: number;
	donchUpper: number;
	williamsR: number;
	indiaVix: number;
	patterns: string;
	score: number;
	opinion: string;
	atr: number;
	stopLoss: number;
	takeProfit: number;
	trailingStop: number;
	trailingStart: number;
	macd: number;
	macdSignal: number;
	macdHistogram: number;
	sma20: number;
	ema20: number;
	buyProbability?: number;
	sellProbability?: number;
	holdProbability?: number;
	confidence?: string;
}

/** Saved to data/feedback/ for learning loop */
export interface PredictionRecord {
	ticker: string;
	date: string;
	opinion: string;
	score: number;
	buyProbability: number;
	sellProbability: number;
	holdProbability: number;
	confidence: string;
	close: number;
	indicators: {
		rsi: number;
		stochasticK: number;
		williamsR: number;
		patternScore: number;
		macd: number;
		macdSignal: number;
		macdHistogram: number;
		sma20: number;
		ema20: number;
	};
}

/** Fundamental data from Yahoo Finance */
export interface FundamentalData {
	ticker: string;
	pe: number | null;
	dividendYield: number | null;
	nextEarningsDate: string | null;
	marketCap: number | null;
	bookValue: number | null;
	priceToBook: number | null;
	debtToEquity: number | null;
	roe: number | null;
	promoterHolding?: number | null;
}

/** Earnings data */
export interface EarningsData {
	ticker: string;
	nextEarningsDate: string | null;
	nextEarningsEstimate: EarningsEstimate | null;
	earningsHistory: EarningsActual[];
	earningsTrend: EarningsEstimate[];
	currentQuarterEstimate: EarningsEstimate | null;
	currentYearEstimate: EarningsEstimate | null;
}

export interface EarningsEstimate {
	avg: number | null;
	low: number | null;
	high: number | null;
	yearAgoEps: number | null;
	numberOfAnalysts: number | null;
}

export interface EarningsActual {
	reportDate: string;
	epsActual: number | null;
	epsEstimate: number | null;
	epsDifference: number | null;
	surprisePercent: number | null;
}

/** Dividend data */
export interface DividendSummary {
	ticker: string;
	dividendYield: number | null;
	payoutRatio: number | null;
	annualDividendRate: number | null;
	trailingAnnualDividendYield: number | null;
	lastDividendDate: string | null;
	dividendHistory: DividendRecord[];
}

export interface DividendRecord {
	date: string;
	amount: number;
}

/** Options chain data */
export interface OptionsChainData {
	ticker: string;
	expirationDates: string[];
	strikes: number[];
	options: {
		calls: OptionContract[];
		puts: OptionContract[];
	};
	underlyingPrice: number;
	currency: string;
}

export interface OptionContract {
	contractSymbol: string;
	strike: number;
	lastPrice: number;
	volume: number;
	openInterest: number;
	bid: number;
	ask: number;
	impliedVolatility: number;
	inTheMoney: boolean;
}

/** News item */
export interface NewsItem {
	title: string;
	url: string;
	publishedAt: string;
	summary: string;
}

/** Probability calculation result */
export interface ProbabilityResult {
	buyProbability: number;
	sellProbability: number;
	holdProbability: number;
	confidence: string;
}

/** Calibration result from Platt scaling */
export interface CalibrationResult {
	slope: number;
	intercept: number;
	brierScore: number;
}

/** Prediction accuracy metrics */
export interface AccuracyMetrics {
	hitRate: number;
	precision: number;
	recall: number;
	f1Score: number;
	totalPredictions: number;
	correctPredictions: number;
}

/** Matched prediction with outcome */
export interface MatchedPrediction {
	ticker: string;
	date: string;
	opinion: string;
	score: number;
	buyProbability: number;
	sellProbability: number;
	holdProbability: number;
	confidence: string;
	close: number;
	futurePrice: number;
	outcomeDate: string;
	change: number;
	isCorrect: boolean;
}

/** Historical price data from Yahoo Finance */
export interface HistoricalPrice {
	date: Date;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	adjClose?: number;
}

/** Portfolio structure */
export interface Portfolio {
	assets: string[];
	createdAt: string;
}

/** Opinion result from analysis */
export interface OpinionResult {
	opinion: string;
	buyScore: number;
	sellScore: number;
}

/** Indicator weights configuration */
export interface IndicatorWeights {
	rsi: number;
	stochastic: number;
	bollinger: number;
	donchian: number;
	williamsR: number;
	indiaVix: number;
	macd: number;
	sma: number;
	ema: number;
}

/** Pattern weights configuration */
export interface PatternWeights {
	ascendingTriangle: number;
	bullishFlag: number;
	doubleBottom: number;
	fallingWedge: number;
	islandReversal: number;
	descendingTriangle: number;
	bearishFlag: number;
	doubleTop: number;
	risingWedge: number;
	headAndShoulders: number;
}
