import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { isSupportedColorSpec } from "./style";

export type ColorSpec = string;
export type ColorSource = "theme" | "terminal";

export type ColorSourcesConfig = {
	starship: ColorSource;
	editor: ColorSource;
	userMessages: ColorSource;
};

export type ExtensionStatusPlacement = "off" | "left" | "middle" | "right" | "contextLabel" | "editorRight";

export type ExtensionStatusesConfig = {
	defaultPlacement: ExtensionStatusPlacement;
	placements: Record<string, ExtensionStatusPlacement>;
};

export type IntegrationSlotsConfig = {
	contextLabel: boolean;
	editorRight: boolean;
};

export type IntegrationWidgetPlacement = "off" | "contextLabel" | "editorRight";

export type IntegrationWidgetsConfig = {
	placements: Record<string, IntegrationWidgetPlacement>;
};

const DEFAULT_PROJECT_REFRESH_INTERVAL_MS = 30_000;
const MIN_PROJECT_REFRESH_INTERVAL_MS = 5_000;

export type PolishedTuiConfig = {
	projectRefreshIntervalMs: number;
	editorExtraText?: string;
	icons: {
		cwd: string;
		git: string;
		ahead: string;
		behind: string;
		diverged: string;
		conflicted: string;
		untracked: string;
		stashed: string;
		modified: string;
		staged: string;
		renamed: string;
		deleted: string;
		typechanged: string;
	};
	colors: {
		cwd: ColorSpec;
		gitBranch: ColorSpec;
		gitStatus: ColorSpec;
		contextNormal: ColorSpec;
		contextWarning: ColorSpec;
		contextError: ColorSpec;
		tokens: ColorSpec;
		cost: ColorSpec;
		separator: ColorSpec;
		runtimePrefix: ColorSpec;
		extensionStatus: ColorSpec;
		editorAccent?: ColorSpec;
		editorBorder?: ColorSpec;
		editorModel?: ColorSpec;
		editorProvider?: ColorSpec;
		editorThinking?: ColorSpec;
		editorThinkingMinimal?: ColorSpec;
		editorThinkingLow?: ColorSpec;
		editorThinkingMedium?: ColorSpec;
		editorThinkingHigh?: ColorSpec;
		editorThinkingXhigh?: ColorSpec;
		editorExtra?: ColorSpec;
	};
	colorSources: ColorSourcesConfig;
	extensionStatuses: ExtensionStatusesConfig;
	integrationSlots: IntegrationSlotsConfig;
	integrationWidgets: IntegrationWidgetsConfig;
};

export const configPath = join(getAgentDir(), "zentui.json");

export const defaultConfig: PolishedTuiConfig = {
	projectRefreshIntervalMs: DEFAULT_PROJECT_REFRESH_INTERVAL_MS,
	icons: {
		cwd: "󰝰",
		git: "",
		ahead: "↑",
		behind: "↓",
		diverged: "⇕",
		conflicted: "=",
		untracked: "?",
		stashed: "$",
		modified: "!",
		staged: "+",
		renamed: "»",
		deleted: "✘",
		typechanged: "T",
	},
	colors: {
		cwd: "bold cyan",
		gitBranch: "bold purple",
		gitStatus: "bold red",
		contextNormal: "bright-black",
		contextWarning: "bold yellow",
		contextError: "bold red",
		tokens: "bright-black",
		cost: "bold green",
		separator: "bright-black",
		runtimePrefix: "",
		extensionStatus: "bright-black",
	},
	colorSources: {
		starship: "theme",
		editor: "theme",
		userMessages: "theme",
	},
	extensionStatuses: {
		defaultPlacement: "right",
		placements: {},
	},
	integrationSlots: {
		contextLabel: true,
		editorRight: true,
	},
	integrationWidgets: {
		placements: {},
	},
};

const iconKeys = [
	"cwd",
	"git",
	"ahead",
	"behind",
	"diverged",
	"conflicted",
	"untracked",
	"stashed",
	"modified",
	"staged",
	"renamed",
	"deleted",
	"typechanged",
] as const satisfies readonly (keyof PolishedTuiConfig["icons"])[];

type ConfigRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ConfigRecord {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseProjectRefreshIntervalMs(value: unknown): number {
	if (value === 0) return 0;
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return defaultConfig.projectRefreshIntervalMs;
	}

	const interval = Math.round(value);
	return interval >= MIN_PROJECT_REFRESH_INTERVAL_MS
		? interval
		: defaultConfig.projectRefreshIntervalMs;
}

function stringValue(record: Record<string, unknown>, key: string): string | undefined {
	const value = record[key];
	return typeof value === "string" ? value : undefined;
}

function colorValue(record: Record<string, unknown>, key: string): string | undefined {
	const value = stringValue(record, key);
	return value !== undefined && isSupportedColorSpec(value) ? value : undefined;
}

function colorSourceValue(
	record: Record<string, unknown>,
	key: keyof ColorSourcesConfig,
): ColorSource {
	const value = record[key];
	return value === "terminal" || value === "theme" ? value : defaultConfig.colorSources[key];
}

function definedColors(
	colors: Partial<Record<keyof PolishedTuiConfig["colors"], string | undefined>>,
): Partial<PolishedTuiConfig["colors"]> {
	return Object.fromEntries(
		Object.entries(colors).filter(
			(entry): entry is [keyof PolishedTuiConfig["colors"], string] => typeof entry[1] === "string",
		),
	) as Partial<PolishedTuiConfig["colors"]>;
}

function normalizeIcons(record: Record<string, unknown>): Partial<PolishedTuiConfig["icons"]> {
	return Object.fromEntries(
		iconKeys.flatMap((key) => {
			const value = stringValue(record, key);
			return value === undefined ? [] : [[key, value]];
		}),
	) as Partial<PolishedTuiConfig["icons"]>;
}

function normalizeColors(record: Record<string, unknown>): Partial<PolishedTuiConfig["colors"]> {
	return definedColors({
		cwd: colorValue(record, "cwd") ?? colorValue(record, "cwdText"),
		gitBranch: colorValue(record, "gitBranch") ?? colorValue(record, "git"),
		gitStatus: colorValue(record, "gitStatus"),
		contextNormal: colorValue(record, "contextNormal"),
		contextWarning: colorValue(record, "contextWarning"),
		contextError: colorValue(record, "contextError"),
		tokens: colorValue(record, "tokens"),
		cost: colorValue(record, "cost"),
		separator: colorValue(record, "separator"),
		runtimePrefix: colorValue(record, "runtimePrefix"),
		extensionStatus: colorValue(record, "extensionStatus"),
		editorAccent: colorValue(record, "editorAccent"),
		editorBorder: colorValue(record, "editorBorder"),
		editorModel: colorValue(record, "editorModel"),
		editorProvider: colorValue(record, "editorProvider"),
		editorThinking: colorValue(record, "editorThinking"),
		editorThinkingMinimal: colorValue(record, "editorThinkingMinimal"),
		editorThinkingLow: colorValue(record, "editorThinkingLow"),
		editorThinkingMedium: colorValue(record, "editorThinkingMedium"),
		editorThinkingHigh: colorValue(record, "editorThinkingHigh"),
		editorThinkingXhigh: colorValue(record, "editorThinkingXhigh"),
		editorExtra: colorValue(record, "editorExtra"),
	});
}

function normalizeColorSources(record: Record<string, unknown>): ColorSourcesConfig {
	return {
		starship: colorSourceValue(record, "starship"),
		editor: colorSourceValue(record, "editor"),
		userMessages: colorSourceValue(record, "userMessages"),
	};
}

export function isExtensionStatusPlacement(value: unknown): value is ExtensionStatusPlacement {
	return (
		value === "off" ||
		value === "left" ||
		value === "middle" ||
		value === "right" ||
		value === "contextLabel" ||
		value === "editorRight"
	);
}

function booleanValue(record: Record<string, unknown>, key: keyof IntegrationSlotsConfig): boolean {
	return typeof record[key] === "boolean" ? record[key] : defaultConfig.integrationSlots[key];
}

function normalizeIntegrationSlots(record: Record<string, unknown>): IntegrationSlotsConfig {
	return {
		contextLabel: booleanValue(record, "contextLabel"),
		editorRight: booleanValue(record, "editorRight"),
	};
}

export function isIntegrationWidgetPlacement(value: unknown): value is IntegrationWidgetPlacement {
	return value === "off" || value === "contextLabel" || value === "editorRight";
}

function normalizeIntegrationWidgets(record: Record<string, unknown>): IntegrationWidgetsConfig {
	const placements = isRecord(record.placements)
		? Object.fromEntries(
				Object.entries(record.placements).filter(
					(entry): entry is [string, IntegrationWidgetPlacement] =>
						isIntegrationWidgetPlacement(entry[1]),
				),
			)
		: {};

	return { placements };
}

function normalizeExtensionStatuses(record: Record<string, unknown>): ExtensionStatusesConfig {
	const defaultPlacement = isExtensionStatusPlacement(record.defaultPlacement)
		? record.defaultPlacement
		: defaultConfig.extensionStatuses.defaultPlacement;
	const placements = isRecord(record.placements)
		? Object.fromEntries(
				Object.entries(record.placements).filter(
					(entry): entry is [string, ExtensionStatusPlacement] =>
						isExtensionStatusPlacement(entry[1]),
				),
			)
		: {};

	return {
		defaultPlacement,
		placements,
	};
}

function isColorSourceKey(value: string): value is keyof ColorSourcesConfig {
	return value === "starship" || value === "editor" || value === "userMessages";
}

function validColorSourceEntries(record: Record<string, unknown>): Partial<ColorSourcesConfig> {
	return Object.fromEntries(
		Object.entries(record).filter((entry): entry is [keyof ColorSourcesConfig, ColorSource] => {
			const [key, value] = entry;
			return isColorSourceKey(key) && (value === "theme" || value === "terminal");
		}),
	) as Partial<ColorSourcesConfig>;
}

function readConfigRecord(path = configPath): ConfigRecord {
	try {
		if (!existsSync(path)) return {};
		const parsed = JSON.parse(readFileSync(path, "utf8"));
		return isRecord(parsed) ? parsed : {};
	} catch {
		return {};
	}
}

export function ensureConfigExists(): void {
	// Intentionally left as a no-op. Zentui config is user-owned and
	// compatibility-sensitive: runtime defaults come from `mergeConfig({})`, and
	// the extension should not persist opinionated defaults unless the user
	// explicitly changes a setting.
}

export function mergeConfig(parsed: unknown): PolishedTuiConfig {
	const config = isRecord(parsed) ? parsed : {};
	const icons = isRecord(config.icons)
		? normalizeIcons(config.icons as Record<string, unknown>)
		: {};
	const colors = isRecord(config.colors)
		? normalizeColors(config.colors as Record<string, unknown>)
		: {};
	const colorSources = isRecord(config.colorSources)
		? normalizeColorSources(config.colorSources as Record<string, unknown>)
		: defaultConfig.colorSources;
	const extensionStatuses = isRecord(config.extensionStatuses)
		? normalizeExtensionStatuses(config.extensionStatuses as Record<string, unknown>)
		: defaultConfig.extensionStatuses;
	const integrationSlots = isRecord(config.integrationSlots)
		? normalizeIntegrationSlots(config.integrationSlots as Record<string, unknown>)
		: defaultConfig.integrationSlots;
	const integrationWidgets = isRecord(config.integrationWidgets)
		? normalizeIntegrationWidgets(config.integrationWidgets as Record<string, unknown>)
		: defaultConfig.integrationWidgets;
	return {
		projectRefreshIntervalMs: parseProjectRefreshIntervalMs(config.projectRefreshIntervalMs),
		editorExtraText: stringValue(config, "editorExtraText"),
		icons: {
			...defaultConfig.icons,
			...icons,
		},
		colors: {
			...defaultConfig.colors,
			...colors,
		},
		colorSources: { ...colorSources },
		extensionStatuses: {
			defaultPlacement: extensionStatuses.defaultPlacement,
			placements: { ...extensionStatuses.placements },
		},
		integrationSlots: { ...integrationSlots },
		integrationWidgets: {
			placements: { ...integrationWidgets.placements },
		},
	};
}

export function getExtensionStatusPlacement(
	config: PolishedTuiConfig,
	key: string,
): ExtensionStatusPlacement {
	return config.extensionStatuses.placements[key] ?? config.extensionStatuses.defaultPlacement;
}

export function getIntegrationWidgetPlacement(
	config: PolishedTuiConfig,
	key: string,
): IntegrationWidgetPlacement {
	return config.integrationWidgets.placements[key] ?? "off";
}

export function loadConfig(): PolishedTuiConfig {
	try {
		if (!existsSync(configPath)) return mergeConfig({});
		return mergeConfig(JSON.parse(readFileSync(configPath, "utf8")));
	} catch {
		return mergeConfig({});
	}
}

export function saveColorSourcesPatch(
	patch: Partial<ColorSourcesConfig>,
	path = configPath,
): PolishedTuiConfig {
	const record = readConfigRecord(path);
	const existing = isRecord(record.colorSources)
		? { ...(record.colorSources as Record<string, unknown>) }
		: {};
	record.colorSources = {
		...existing,
		...validColorSourceEntries(patch),
	};
	writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`, "utf8");
	return mergeConfig(record);
}

function savePlacementRecord(
	record: ConfigRecord,
	section: "extensionStatuses" | "integrationWidgets",
	key: string,
	placement: string,
): void {
	const existingSection = isRecord(record[section])
		? { ...(record[section] as Record<string, unknown>) }
		: {};
	const existingPlacements = isRecord(existingSection.placements)
		? { ...(existingSection.placements as Record<string, unknown>) }
		: {};

	Object.defineProperty(existingPlacements, key, {
		value: placement,
		enumerable: true,
		configurable: true,
		writable: true,
	});

	record[section] = {
		...existingSection,
		placements: existingPlacements,
	};
}

export function saveExtensionStatusPlacement(
	key: string,
	placement: ExtensionStatusPlacement,
	path = configPath,
): PolishedTuiConfig {
	const record = readConfigRecord(path);
	savePlacementRecord(record, "extensionStatuses", key, placement);
	writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`, "utf8");
	return mergeConfig(record);
}

export function saveIntegrationWidgetPlacement(
	key: string,
	placement: IntegrationWidgetPlacement,
	path = configPath,
): PolishedTuiConfig {
	const record = readConfigRecord(path);
	savePlacementRecord(record, "integrationWidgets", key, placement);
	writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`, "utf8");
	return mergeConfig(record);
}
