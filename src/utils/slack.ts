import axios from "axios";
import pino from "pino";
import { CURRENCY_SYMBOL } from "../constants.js";
import type { TickerResult } from "../types/index.js";

const logger = pino({ name: "slack" });

/**
 * Send a Slack notification for BUY/SELL signals.
 * Only sends for actionable signals (not HOLD).
 */
export async function sendSlackNotification(
	webhookUrl: string,
	results: TickerResult[],
): Promise<void> {
	const actionableResults = results.filter(
		(r) => r.opinion === "BUY" || r.opinion === "SELL",
	);

	if (actionableResults.length === 0) {
		logger.info("No BUY/SELL signals to notify");
		return;
	}

	const blocks = actionableResults.map((r) => {
		const emoji = r.opinion === "BUY" ? "🟢" : "🔴";
		const probText = r.buyProbability !== undefined
			? `\nBuy: ${r.buyProbability}% | Sell: ${r.sellProbability}% | Hold: ${r.holdProbability}%`
			: "";

		return [
			`${emoji} *${r.ticker}* — ${r.opinion} (Score: ${r.score})`,
			`Close: ${CURRENCY_SYMBOL}${r.close.toFixed(2)} | RSI: ${r.rsi.toFixed(1)} | India VIX: ${r.indiaVix.toFixed(1)}`,
			`SL: ${CURRENCY_SYMBOL}${r.stopLoss.toFixed(2)} | TP: ${CURRENCY_SYMBOL}${r.takeProfit.toFixed(2)}`,
			r.patterns ? `Patterns: ${r.patterns}` : "",
			probText,
		]
			.filter(Boolean)
			.join("\n");
	});

	const text = `📊 *Indian Stock Analysis — ${actionableResults[0].date}*\n\n${blocks.join("\n\n───────────────\n\n")}`;

	try {
		await axios.post(webhookUrl, { text });
		logger.info(
			{ signals: actionableResults.length },
			"Slack notification sent",
		);
	} catch (error) {
		logger.error({ error }, "Failed to send Slack notification");
	}
}
