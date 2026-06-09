export type ZentuiIntegrationSlot = "contextLabel" | "editorRight";

export type ZentuiIntegrationRegistry = Partial<Record<ZentuiIntegrationSlot, string>>;

declare global {
	// eslint-disable-next-line no-var
	var piZentui: ZentuiIntegrationRegistry | undefined;
	// Legacy one-off globals kept for local extension compatibility.
	// eslint-disable-next-line no-var
	var piZentuiContextLabel: string | undefined;
	// eslint-disable-next-line no-var
	var piZentuiEditorExtraText: string | undefined;
}

export function getZentuiSlot(slot: ZentuiIntegrationSlot): string | undefined {
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
