import type { IntegrationWidgetPlacement, PolishedTuiConfig } from "./config";

export type ZentuiIntegrationSlot = Exclude<IntegrationWidgetPlacement, "off">;

export type ZentuiIntegrationRegistry = {
	widgets?: Record<string, string | undefined>;
	contextLabel?: string;
	editorRight?: string;
};

declare global {
	// eslint-disable-next-line no-var
	var piZentui: ZentuiIntegrationRegistry | undefined;
	// Legacy one-off globals kept for local extension compatibility.
	// eslint-disable-next-line no-var
	var piZentuiContextLabel: string | undefined;
	// eslint-disable-next-line no-var
	var piZentuiEditorExtraText: string | undefined;
}

export function getActiveZentuiIntegrations(): ReadonlyMap<string, string> {
	return new Map(
		Object.entries(globalThis.piZentui?.widgets ?? {}).filter(
			(entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0,
		),
	);
}

export function getZentuiSlot(
	slot: ZentuiIntegrationSlot,
	config?: PolishedTuiConfig,
): string | undefined {
	if (config) {
		for (const [key, value] of getActiveZentuiIntegrations()) {
			if (config.integrationWidgets.placements[key] === slot) return value;
		}
	}

	const value = globalThis.piZentui?.[slot];
	if (typeof value === "string" && value.length > 0) return value;

	if (slot === "contextLabel") {
		const legacy = globalThis.piZentuiContextLabel;
		return typeof legacy === "string" && legacy.length > 0 ? legacy : undefined;
	}

	if (slot === "editorRight") {
		const legacy = globalThis.piZentuiEditorExtraText;
		return typeof legacy === "string" && legacy.length > 0 ? legacy : undefined;
	}

	return undefined;
}
