#!/usr/bin/env bun
import { Command } from "commander";
import { DEFAULT_INDIAN_TICKERS } from "./constants.js";
import { learnCommand } from "./commands/learn.js";
import { optimizeCommand } from "./commands/optimize.js";
import { predictCommand } from "./commands/predict.js";
import {
	addAsset,
	getPortfolio,
	removeAsset,
} from "./portfolio/manager.js";

const program = new Command();

program
	.name("ind-stock-analysis")
	.description("Indian Stock Market Analysis Tool — Technical analysis for NSE/BSE stocks")
	.version("1.0.0");

// Predict command (default)
program
	.command("predict", { isDefault: true })
	.description("Run technical analysis and generate BUY/SELL/HOLD predictions")
	.option(
		"-t, --ticker <tickers>",
		"Comma-separated list of tickers (e.g., RELIANCE.NS,TCS.NS)",
		DEFAULT_INDIAN_TICKERS.slice(0, 5).join(","),
	)
	.option("-s, --sort <order>", "Sort order: asc or desc", "desc")
	.option("-f, --format <format>", "Output format: csv or json", "csv")
	.option("--slack-webhook <url>", "Slack webhook URL for notifications")
	.option("--fundamentals", "Show fundamental data for a ticker")
	.option("--news", "Show recent news for a ticker")
	.option("--earnings", "Show earnings data for a ticker")
	.option("--dividends", "Show dividend info for a ticker")
	.option("--options", "Show options chain for a ticker")
	.option(
		"--portfolio-action <action>",
		"Portfolio action: add, remove, list, report",
	)
	.option("--portfolio-ticker <ticker>", "Ticker for portfolio/data actions")
	.option("--exchange <exchange>", "Default exchange: NSE or BSE", "NSE")
	.action(async (opts) => {
		// Handle portfolio actions
		if (opts.portfolioAction) {
			switch (opts.portfolioAction) {
				case "add":
					if (!opts.portfolioTicker) {
						console.error("Error: --portfolio-ticker required for add action");
						process.exit(1);
					}
					const added = addAsset(opts.portfolioTicker);
					console.log("Portfolio:", JSON.stringify(added, null, 2));
					return;

				case "remove":
					if (!opts.portfolioTicker) {
						console.error("Error: --portfolio-ticker required for remove action");
						process.exit(1);
					}
					const removed = removeAsset(opts.portfolioTicker);
					console.log("Portfolio:", JSON.stringify(removed, null, 2));
					return;

				case "list":
					const portfolio = getPortfolio();
					console.log("Portfolio:", JSON.stringify(portfolio, null, 2));
					return;

				case "report":
					const reportPortfolio = getPortfolio();
					if (reportPortfolio.assets.length === 0) {
						console.log("Portfolio is empty. Add tickers with --portfolio-action=add");
						return;
					}
					await predictCommand({
						tickers: reportPortfolio.assets,
						sort: opts.sort,
						format: opts.format,
						slackWebhook: opts.slackWebhook,
					});
					return;

				default:
					console.error(`Unknown portfolio action: ${opts.portfolioAction}`);
					process.exit(1);
			}
		}

		const tickers = opts.ticker.split(",").map((t: string) => t.trim());

		await predictCommand({
			tickers,
			sort: opts.sort,
			format: opts.format,
			slackWebhook: opts.slackWebhook,
			fundamentals: opts.fundamentals,
			news: opts.news,
			earnings: opts.earnings,
			dividends: opts.dividends,
			options: opts.options,
			portfolioTicker: opts.portfolioTicker,
			exchange: opts.exchange,
		});
	});

// Optimize command
program
	.command("optimize [symbol]")
	.description("Optimize indicator weights for a symbol via random search backtesting")
	.option("--trials <n>", "Number of optimization trials", "200")
	.action(async (symbol, opts) => {
		const targetSymbol = symbol || "RELIANCE.NS";
		await optimizeCommand(targetSymbol, Number.parseInt(opts.trials, 10));
	});

// Learn command
program
	.command("learn")
	.description("Run the full self-improvement learning loop")
	.action(async () => {
		await learnCommand();
	});

program.parse();
