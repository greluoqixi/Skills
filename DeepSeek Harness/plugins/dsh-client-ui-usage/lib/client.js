window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-usage",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var React = require("react");
		var primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		var Tooltip = primitives.Tooltip;
		var h = React.createElement;

		// ---------------------------------------------------------------------
		// Styles (original usage-meter CSS + per-model / rate-card additions).
		// ---------------------------------------------------------------------
		const css = ".dshu_root{display:inline-flex;position:relative;align-items:center}.dshu_pill{display:inline-flex;align-items:center;gap:8px;height:28px;box-sizing:border-box;padding:0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-specific-tip);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:16px;cursor:pointer;font-variant-numeric:tabular-nums;white-space:nowrap}.dshu_pill:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshu_pill[data-open=true]{border-color:var(--dsw-alias-border-l3);background:var(--dsw-alias-interactive-bg-hover)}.dshu_live{width:6px;height:6px;border-radius:999px;background:var(--dsw-static-blue-450);flex:none}.dshu_live[data-pulse=true]{animation:dshuPulse 1.2s ease-in-out infinite}@keyframes dshuPulse{0%,100%{opacity:1}50%{opacity:.2}}.dshu_miniTrack{width:64px;height:6px;border-radius:999px;background:var(--dsw-alias-interactive-bg-hover);position:relative;overflow:hidden;flex:none}.dshu_miniFill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:var(--dsw-alias-label-tertiary)}.dshu_miniFill[data-hot=true]{background:#f59e0b}.dshu_figure{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}.dshu_sep{width:1px;height:12px;background:var(--dsw-alias-border-l2);flex:none}.dshu_panel{position:absolute;top:calc(100% + 8px);right:0;z-index:100;box-sizing:border-box;width:304px;border:1px solid var(--dsw-alias-border-inverted);background:var(--dsw-specific-menu);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-secondary);border-radius:12px;padding:12px;font-size:12px;line-height:20px;cursor:default;text-align:left}.dshu_section{margin:0 0 12px}.dshu_section:last-child{margin:0 0 4px}.dshu_section+.dshu_section{border-top:1px solid var(--dsw-alias-border-l1);padding-top:12px}.dshu_sectionTitle{display:flex;align-items:center;gap:6px;margin:0 0 8px;color:var(--dsw-alias-label-primary);font-size:11px;font-weight:600;letter-spacing:.02em}.dshu_sectionTitle::before{content:'';width:6px;height:6px;border-radius:999px;flex:none;background:var(--dsw-alias-label-tertiary)}.dshu_sectionTitle[data-section=context]::before{background:var(--dsw-static-blue-450)}.dshu_sectionTitle[data-section=billing]::before{background:#f59e0b}.dshu_sectionTitle[data-section=rates]::before{background:#10b981}.dshu_bar{height:4px;border-radius:999px;background:var(--dsw-alias-interactive-bg-hover);gap:1px;margin:8px 0 10px;display:flex;overflow:hidden}.dshu_segment{background:var(--meter-tint,var(--dsw-alias-label-tertiary));border-radius:1px;flex:none;min-width:2px;height:100%}.dshu_swatch{background:var(--meter-tint);vertical-align:baseline;border-radius:2px;width:8px;height:8px;margin-right:6px;display:inline-block}.dshu_colorSystem{--meter-tint:var(--dsw-static-neutral-bluish-400)}.dshu_colorTools{--meter-tint:#a78bfa}.dshu_colorMessages{--meter-tint:var(--dsw-static-blue-450)}.dshu_rows{margin:6px 0 0}.dshu_row{justify-content:space-between;align-items:center;gap:12px;padding:2px 0;display:flex}.dshu_row dt{color:var(--dsw-alias-label-secondary)}.dshu_row dd{margin:0;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary)}.dshu_total dd{color:var(--dsw-alias-label-primary);font-weight:600}.dshu_empty{color:var(--dsw-alias-label-tertiary);padding:2px 0}.dshu_note{display:flex;align-items:flex-start;gap:6px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;border-top:1px solid var(--dsw-alias-border-l1);margin:8px 0 0;padding:6px 0 0}.dshu_noteIcon{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:999px;background:rgba(245,158,11,.15);color:#f59e0b;font-size:10px;font-weight:700;line-height:1;flex:none;margin-top:1px}.dshu_panel{max-height:calc(100vh - 120px);overflow-y:auto}.dshu_tierBadge{display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:999px;font-size:10px;line-height:14px;font-weight:600;flex:none;border:1px solid var(--dsw-alias-border-l1)}.dshu_tierBadge[data-tier=peak]{color:#f59e0b;border-color:rgba(245,158,11,.45);background:rgba(245,158,11,.12)}.dshu_tierBadge[data-tier=offpeak]{color:var(--dsw-static-blue-450);border-color:rgba(59,130,246,.4);background:rgba(59,130,246,.1)}.dshu_tierBadge[data-tier=legacy]{color:var(--dsw-alias-label-tertiary)}.dshu_modelBlock{margin:0 0 8px}.dshu_modelName{color:var(--dsw-alias-label-primary);font-weight:600;margin:2px 0}.dshu_subtotal dd{color:var(--dsw-alias-label-primary)}.dshu_peakMark{display:flex;align-items:center;gap:6px;flex-wrap:wrap;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;margin:0 0 8px}.dshu_rateModel{margin:0 0 8px}.dshu_rateLine{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:2px 4px;border-radius:6px}.dshu_rateLineActive{background:var(--dsw-alias-interactive-bg-hover)}.dshu_rateTierLabel{color:var(--dsw-alias-label-secondary);font-size:11px;flex:none;white-space:nowrap;font-variant-numeric:tabular-nums}.dshu_rateValues{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;text-align:right;font-variant-numeric:tabular-nums}.dshu_rateLineActive .dshu_rateTierLabel{color:var(--dsw-alias-label-primary);font-weight:600}.dshu_tabs{display:flex;gap:4px;margin:0 0 6px}.dshu_tab{flex:1;border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:6px;padding:3px 6px;font-size:11px;line-height:16px;cursor:pointer;font-variant-numeric:tabular-nums;white-space:nowrap}.dshu_tab:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshu_tab[data-active=true]{border-color:var(--dsw-alias-border-l3);background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-weight:600}.dshu_rateCaption{color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:14px;margin:0 0 6px}.dshu_rateTable{width:100%;border-collapse:collapse;font-size:11px;line-height:16px;font-variant-numeric:tabular-nums}.dshu_rateTable thead th{color:var(--dsw-alias-label-tertiary);font-weight:500;text-align:right;padding:0 2px;font-size:10px}.dshu_rateTable thead th:first-child{text-align:left}.dshu_rateTable td{text-align:right;color:var(--dsw-alias-label-primary);padding:1px 2px}.dshu_rateTable td:first-child{text-align:left;color:var(--dsw-alias-label-secondary);padding-left:0}.dshu_rateModelRow th{text-align:left;color:var(--dsw-alias-label-primary);font-weight:600;padding:4px 2px 1px;font-size:11px}.dshu_rateRowActive td{background:var(--dsw-alias-interactive-bg-hover)}.dshu_rateRowActive td:first-child{color:var(--dsw-alias-label-primary);font-weight:600}";
		const tagId = "@deepseek-ai/dsh-client-ui-usage/UsageMeter.module.css";
		if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="' + tagId + '"]') === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-usage";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		const C = {
			root: "dshu_root",
			pill: "dshu_pill",
			live: "dshu_live",
			miniTrack: "dshu_miniTrack",
			miniFill: "dshu_miniFill",
			figure: "dshu_figure",
			sep: "dshu_sep",
			panel: "dshu_panel",
			section: "dshu_section",
			sectionTitle: "dshu_sectionTitle",
			bar: "dshu_bar",
			segment: "dshu_segment",
			swatch: "dshu_swatch",
			colorSystem: "dshu_colorSystem",
			colorTools: "dshu_colorTools",
			colorMessages: "dshu_colorMessages",
			rows: "dshu_rows",
			row: "dshu_row",
			total: "dshu_total",
			empty: "dshu_empty",
			note: "dshu_note",
			noteIcon: "dshu_noteIcon",
			tierBadge: "dshu_tierBadge",
			modelBlock: "dshu_modelBlock",
			modelName: "dshu_modelName",
			subtotal: "dshu_subtotal",
			peakMark: "dshu_peakMark",
			rateModel: "dshu_rateModel",
			rateLine: "dshu_rateLine",
			rateLineActive: "dshu_rateLineActive",
			rateTierLabel: "dshu_rateTierLabel",
			rateValues: "dshu_rateValues",
			tabs: "dshu_tabs",
			tab: "dshu_tab",
			rateCaption: "dshu_rateCaption",
			rateTable: "dshu_rateTable",
			rateModelRow: "dshu_rateModelRow",
			rateRowActive: "dshu_rateRowActive"
		};

		// ---------------------------------------------------------------------
		// Pricing — official DeepSeek CNY list prices (¥ / 1M tokens).
		// Legacy flat rates apply until 2026-08-17 00:00 Beijing time; then
		// peak (9:00–12:00 & 14:00–18:00) / off-peak rates by Beijing hour.
		// ---------------------------------------------------------------------
		const PRICES_LEGACY = {
			"deepseek-v4-flash": { inputUncached: 1, inputCacheRead: 0.02, output: 2 },
			"deepseek-v4-pro": { inputUncached: 3, inputCacheRead: 0.025, output: 6 }
		};
		const PRICES_PEAK = {
			"deepseek-v4-flash": { inputUncached: 3, inputCacheRead: 0.1, output: 9 },
			"deepseek-v4-pro": { inputUncached: 9, inputCacheRead: 0.3, output: 27 }
		};
		const PRICES_OFFPEAK = {
			"deepseek-v4-flash": { inputUncached: 1.5, inputCacheRead: 0.05, output: 4.5 },
			"deepseek-v4-pro": { inputUncached: 4.5, inputCacheRead: 0.15, output: 13.5 }
		};
		const TIER_DEFS = [
			{ id: "legacy", price: PRICES_LEGACY },
			{ id: "peak", price: PRICES_PEAK },
			{ id: "offpeak", price: PRICES_OFFPEAK }
		];
		const MODELS = ["deepseek-v4-pro", "deepseek-v4-flash"];
		const MODEL_NAMES = { "deepseek-v4-flash": "DeepSeek-V4-Flash", "deepseek-v4-pro": "DeepSeek-V4-Pro" };
		const DEFAULT_PRICE = PRICES_LEGACY["deepseek-v4-flash"];
		const PEAK_EFFECTIVE_MS = Date.UTC(2026, 7, 16, 16, 0, 0);

		function pricingTier(now = Date.now()) {
			if (now < PEAK_EFFECTIVE_MS) return { tier: "legacy", price: PRICES_LEGACY };
			const beijingHour = new Date(now + 8 * 3600 * 1000).getUTCHours();
			const peak = (beijingHour >= 9 && beijingHour < 12) || (beijingHour >= 14 && beijingHour < 18);
			return peak ? { tier: "peak", price: PRICES_PEAK } : { tier: "offpeak", price: PRICES_OFFPEAK };
		}

		function modelName(model) {
			return MODEL_NAMES[model] ?? model;
		}
		function formatTokens(n) {
			const scaled = (v) => v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10);
			if (n < 1e3) return String(n);
			if (n < 1e6) return `${scaled(n / 1e3)}K`;
			return `${scaled(n / 1e6)}M`;
		}
		function formatCny(v) {
			if (v <= 0) return "¥0.0000";
			if (v < 0.0001) return "<¥0.0001";
			return `¥${v.toFixed(4)}`;
		}
		function num(v) {
			return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0;
		}

		// ---------------------------------------------------------------------
		// Per-model token accounting.
		//
		// The `tokenUsage` projection is session-wide and has no model split,
		// and the chat `legacy.nodes` assistant nodes do not carry the model in
		// this build. The trajectory view's `eventNodes`, however, keeps one
		// settled assistant node per message with BOTH its final `usage` and its
		// `provenance.model`, so it is the authoritative per-model source.
		// ---------------------------------------------------------------------
		function bucketsOf(usage) {
			return {
				uncached: num(usage.uncachedInputTokens ?? usage.inputTokens),
				cacheRead: num(usage.cacheReadTokens),
				output: num(usage.outputTokens)
			};
		}
		function addBuckets(a, b) {
			return {
				uncached: a.uncached + b.uncached,
				cacheRead: a.cacheRead + b.cacheRead,
				output: a.output + b.output
			};
		}
		function modelIdOf(node) {
			return node.provenance?.model ?? node.requestConfig?.model ?? "deepseek-v4-flash";
		}
		function usageByModel(nodes) {
			const byModel = new Map();
			for (const node of nodes ?? []) {
				if (node == null || node.kind !== "assistant") continue;
				if (node.usage == null || typeof node.usage !== "object") continue;
				const model = modelIdOf(node);
				const buckets = bucketsOf(node.usage);
				const previous = byModel.get(model);
				byModel.set(model, previous === void 0 ? buckets : addBuckets(previous, buckets));
			}
			return byModel;
		}
		function billOf(buckets, model, tierInfo) {
			const price = tierInfo.price[model] ?? DEFAULT_PRICE;
			const uncached = buckets.uncached;
			const cacheRead = buckets.cacheRead;
			const output = buckets.output;
			const billedInput = uncached + cacheRead;
			const cny = uncached / 1e6 * price.inputUncached
				+ cacheRead / 1e6 * price.inputCacheRead
				+ output / 1e6 * price.output;
			return {
				price,
				tier: tierInfo.tier,
				uncached,
				cacheRead,
				output,
				billedInput,
				cny,
				cacheRate: billedInput === 0 ? null : Math.round(cacheRead / billedInput * 100)
			};
		}
		function modelOrder(model) {
			const index = MODELS.indexOf(model);
			return index === -1 ? MODELS.length : index;
		}
		function billsOf(nodes) {
			const tierInfo = pricingTier();
			const byModel = usageByModel(nodes);
			const rows = [];
			const totals = { uncached: 0, cacheRead: 0, output: 0, billedInput: 0, cny: 0 };
			for (const [model, buckets] of byModel) {
				const bill = billOf(buckets, model, tierInfo);
				rows.push({ model, bill });
				totals.uncached += bill.uncached;
				totals.cacheRead += bill.cacheRead;
				totals.output += bill.output;
				totals.billedInput += bill.billedInput;
				totals.cny += bill.cny;
			}
			rows.sort((a, b) => modelOrder(a.model) - modelOrder(b.model) || (a.model < b.model ? -1 : a.model > b.model ? 1 : 0));
			return {
				tierInfo,
				rows,
				totals,
				cacheRate: totals.billedInput === 0 ? null : Math.round(totals.cacheRead / totals.billedInput * 100),
				hasUsage: totals.billedInput > 0 || totals.output > 0
			};
		}
		function bucketRowsOf(bill) {
			return [
				{ key: "uncached", labelKey: "billing.uncached", tokens: bill.uncached, cost: bill.uncached / 1e6 * bill.price.inputUncached },
				{ key: "cacheRead", labelKey: "billing.cacheRead", tokens: bill.cacheRead, cost: bill.cacheRead / 1e6 * bill.price.inputCacheRead },
				{ key: "output", labelKey: "billing.output", tokens: bill.output, cost: bill.output / 1e6 * bill.price.output }
			];
		}
		function contextOccupancy(pressure) {
			const usedTokens = pressure?.projectedTokens ?? pressure?.pressureTokens;
			if (usedTokens === void 0 || pressure?.contextWindow === void 0) return null;
			return {
				percent: Math.min(100, Math.round(usedTokens / pressure.contextWindow * 100)),
				usedTokens,
				contextWindow: pressure.contextWindow
			};
		}
		const ROWS = [
			{ key: "systemTokens", label: "context.system", color: C.colorSystem },
			{ key: "toolsTokens", label: "context.tools", color: C.colorTools },
			{ key: "messageTokens", label: "context.messages", color: C.colorMessages }
		];

		// ---------------------------------------------------------------------
		// Component.
		// ---------------------------------------------------------------------
		function UsageMeter({ useSession, useProjection, t }) {
			const pressure = useProjection("contextPressure");
			const breakdown = useProjection("contextBreakdown");
			const trajectory = useSession((s) => {
				const views = s && s.views;
				return views && typeof views.get === "function" ? views.get("trajectory") : void 0;
			});
			const legacyNodes = useSession((s) => s.chat.legacy.nodes);
			const running = useSession((s) => s.running) ?? false;

			const [open, setOpen] = React.useState(false);
			const [activeModel, setActiveModel] = React.useState(null);
			const rootRef = React.useRef(null);

			const occupancy = contextOccupancy(pressure);
			const sourceNodes = trajectory && Array.isArray(trajectory.eventNodes) && trajectory.eventNodes.length > 0
				? trajectory.eventNodes
				: legacyNodes ?? [];
			const { tierInfo, rows, totals, cacheRate, hasUsage } = React.useMemo(() => billsOf(sourceNodes), [sourceNodes]);

			const hasContext = occupancy !== null;
			const available = hasContext || hasUsage || sourceNodes.length > 0;

			React.useEffect(() => {
				if (!available && open) setOpen(false);
			}, [available, open]);
			React.useEffect(() => {
				if (!open || !available) return;
				const onPointerDown = (e) => {
					if (e.target instanceof Node && rootRef.current?.contains(e.target) === true) return;
					setOpen(false);
				};
				const onKeyDown = (e) => {
					if (e.key === "Escape") setOpen(false);
				};
				document.addEventListener("pointerdown", onPointerDown);
				document.addEventListener("keydown", onKeyDown);
				return () => {
					document.removeEventListener("pointerdown", onPointerDown);
					document.removeEventListener("keydown", onKeyDown);
				};
			}, [available, open]);

			if (!available) return null;

			const selectedModel = rows.some((r) => r.model === activeModel) ? activeModel : rows[0]?.model ?? null;
			const selectedRow = selectedModel === null ? null : rows.find((r) => r.model === selectedModel) ?? null;

			const percent = occupancy === null ? 0 : occupancy.percent;
			const costText = hasUsage ? formatCny(totals.cny) : "—";
			const tierKey = tierInfo.tier;
			const tierText = t(tierKey === "legacy" ? "tier.legacy" : tierKey === "peak" ? "tier.peak" : "tier.offpeak");
			const aria = t("usage.aria", {
				used: occupancy === null ? "—" : formatTokens(occupancy.usedTokens),
				total: occupancy === null ? "—" : formatTokens(occupancy.contextWindow),
				percent: occupancy === null ? "—" : `${percent}%`,
				cost: costText,
				tier: tierText
			});

			const bd = breakdown ?? { systemTokens: 0, toolsTokens: 0, messageTokens: 0 };
			const breakdownTotal = bd.systemTokens + bd.toolsTokens + bd.messageTokens;
			const segments = occupancy !== null && breakdownTotal > 0
				? ROWS.map((row) => ({ key: row.key, color: row.color, width: percent * bd[row.key] / breakdownTotal })).filter((part) => part.width > 0)
				: [];

			return h("span", { ref: rootRef, className: C.root },
				h(Tooltip, { label: aria, side: "top", delayMs: 200, disabled: open },
					h("button", {
						type: "button",
						className: C.pill,
						"data-open": open,
						"aria-label": aria,
						"aria-haspopup": "dialog",
						"aria-expanded": open,
						onClick: () => { setOpen(!open); },
						children: [
							running && h("span", { key: "live", className: C.live, "data-pulse": true, "aria-hidden": true }),
							hasContext && h("span", { key: "track", className: C.miniTrack, "aria-hidden": true },
								h("span", { className: C.miniFill, "data-hot": percent >= 90, style: { width: `${percent}%` } })),
							h("span", { key: "ctx", className: C.figure },
								hasContext ? `${formatTokens(occupancy.usedTokens)}/${formatTokens(occupancy.contextWindow)}` : "—"),
							h("span", { key: "sep", className: C.sep, "aria-hidden": true }),
							h("span", { key: "cost", className: C.figure }, costText),
							h("span", { key: "tier", className: C.tierBadge, "data-tier": tierKey }, tierText)
						]
					})
				),
				open && h("div", { className: C.panel, role: "dialog", "aria-label": aria },
					// ---- context section -------------------------------------------------
					h("section", { className: C.section },
						h("h4", { className: C.sectionTitle, "data-section": "context" }, t("context.title")),
						hasContext ? h(React.Fragment, {},
							h("div", { className: C.bar, "aria-hidden": true },
								segments.length === 0
									? h("span", { className: C.segment, style: { width: `${percent}%` } })
									: segments.map((part) => h("span", { key: part.key, className: C.segment + " " + part.color, style: { width: `${part.width}%` } }))),
							h("dl", { className: C.rows },
								h("div", { className: C.row },
									h("dt", null, t("context.used")),
									h("dd", null, `${formatTokens(occupancy.usedTokens)} / ${formatTokens(occupancy.contextWindow)}（${percent}%）`)),
								pressure?.pressureTokens !== void 0 && h("div", { className: C.row },
									h("dt", null, t("context.pressure")),
									h("dd", null, formatTokens(pressure.pressureTokens))),
								pressure?.projectedTokens !== void 0 && h("div", { className: C.row },
									h("dt", null, t("context.projected")),
									h("dd", null, formatTokens(pressure.projectedTokens))),
								ROWS.map((row) => h("div", { key: row.key, className: C.row },
									h("dt", null,
										h("span", { className: C.swatch + " " + row.color, "aria-hidden": true }),
										t(row.label)),
									h("dd", null, formatTokens(bd[row.key] ?? 0))))
							)
						) : h("div", { className: C.empty }, t("usage.empty"))
					),
					// ---- billing section (per model) ---------------------------------------
					h("section", { className: C.section },
						h("h4", { className: C.sectionTitle, "data-section": "billing" },
							t("billing.title"),
							h("span", { className: C.tierBadge, "data-tier": tierKey }, tierText)),
						hasUsage ? h(React.Fragment, {},
							rows.length > 1 && h("div", { className: C.tabs },
								rows.map((row) => h("button", {
									key: row.model,
									type: "button",
									className: C.tab,
									"data-active": row.model === selectedModel,
									onClick: () => { setActiveModel(row.model); }
								}, modelName(row.model)))),
							selectedRow !== null && h("div", { className: C.modelBlock },
								h("div", { className: C.modelName }, modelName(selectedRow.model)),
								h("dl", { className: C.rows },
									bucketRowsOf(selectedRow.bill).map((b) => h("div", { key: b.key, className: C.row },
										h("dt", null, t(b.labelKey)),
										h("dd", null, `${formatTokens(b.tokens)} · ${formatCny(b.cost)}`))),
									h("div", { className: C.row + " " + C.subtotal },
										h("dt", null, t("billing.subtotal")),
										h("dd", null, formatCny(selectedRow.bill.cny))))),
							h("div", { className: C.row + " " + C.total },
								h("dt", null, t("billing.total")),
								h("dd", null, formatCny(totals.cny))),
							cacheRate !== null && h("div", { className: C.row },
								h("dt", null, t("billing.cacheRate")),
								h("dd", null, `${cacheRate}%`))
						) : h("div", { className: C.empty }, t("usage.empty"))
					),
					// ---- official rate card -------------------------------------------------
					h("section", { className: C.section },
						h("h4", { className: C.sectionTitle, "data-section": "rates" }, t("rates.title")),
						h("div", { className: C.rateCaption }, t("rates.unit") + " · " + t("rates.peakWindow")),
						h("table", { className: C.rateTable },
							h("thead", null,
								h("tr", null,
									h("th", { scope: "col" }, t("rates.colTier")),
									h("th", { scope: "col" }, t("rates.colInput")),
									h("th", { scope: "col" }, t("rates.colHit")),
									h("th", { scope: "col" }, t("rates.colOutput")))),
							h("tbody", null,
								MODELS.map((model) => h(React.Fragment, { key: model },
									h("tr", { className: C.rateModelRow },
										h("th", { colSpan: 4, scope: "rowgroup" }, modelName(model))),
									TIER_DEFS.map((td) => {
										const p = td.price[model] ?? DEFAULT_PRICE;
										const active = tierKey === td.id;
										return h("tr", { key: td.id, className: active ? C.rateRowActive : void 0 },
											h("td", null, t("tier." + td.id)),
											h("td", null, String(p.inputUncached)),
											h("td", null, String(p.inputCacheRead)),
											h("td", null, String(p.output)));
									})))))
					)
				)
			);
		}

		// ---------------------------------------------------------------------
		// Locale dictionaries.
		// ---------------------------------------------------------------------
		const NS = "usage";
		const zh = {
			"context.title": "上下文窗口",
			"context.used": "已用",
			"context.pressure": "本请求提示词",
			"context.projected": "下一请求预估",
			"context.system": "系统提示",
			"context.tools": "工具定义",
			"context.messages": "对话内容",
			"billing.title": "实时计费统计",
			"billing.uncached": "输入（未命中缓存）",
			"billing.cacheRead": "输入（缓存命中）",
			"billing.output": "输出",
			"billing.subtotal": "小计",
			"billing.total": "本会话合计",
			"billing.cacheRate": "缓存命中率",
			"tier.legacy": "现行",
			"tier.peak": "高峰",
			"tier.offpeak": "空闲",
			"rates.title": "官方收费标准",
			"rates.unit": "元/百万 tokens",
			"rates.colTier": "档位",
			"rates.colInput": "输入",
			"rates.colHit": "命中",
			"rates.colOutput": "输出",
			"rates.peakWindow": "高峰 9:00–12:00、14:00–18:00（北京时间）",
			"usage.empty": "暂无数据",
			"usage.aria": "用量：上下文 {used}/{total}（{percent}%），费用约 {cost}，档位 {tier}"
		};
		const en = {
			"context.title": "Context window",
			"context.used": "Used",
			"context.pressure": "Request prompt",
			"context.projected": "Next request (est.)",
			"context.system": "System prompt",
			"context.tools": "Tool schemas",
			"context.messages": "Conversation",
			"billing.title": "Billing (live estimate)",
			"billing.uncached": "Input (cache miss)",
			"billing.cacheRead": "Input (cache hit)",
			"billing.output": "Output",
			"billing.subtotal": "Subtotal",
			"billing.total": "Session total",
			"billing.cacheRate": "Cache hit rate",
			"tier.legacy": "Legacy",
			"tier.peak": "Peak",
			"tier.offpeak": "Off-peak",
			"rates.title": "Official rate card",
			"rates.unit": "¥/1M tokens",
			"rates.colTier": "Tier",
			"rates.colInput": "Input",
			"rates.colHit": "Hit",
			"rates.colOutput": "Output",
			"rates.peakWindow": "Peak 9:00–12:00 & 14:00–18:00 Beijing time",
			"usage.empty": "No data yet",
			"usage.aria": "Usage: context {used}/{total} ({percent}%), cost ≈ {cost}, tier {tier}"
		};

		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "ui-usage: dictionaries");
			ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
				name: "conversation.session.header.utilities",
				id: "usage-meter",
				order: 100,
				locale: NS
			}, UsageMeter));
		}

		exports.UsageMeter = UsageMeter;
		exports.apply = apply;
		exports.inject = ["slots", "locale"];
		return module.exports;
	}
});
