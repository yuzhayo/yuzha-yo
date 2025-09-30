import rawConfig from "./ConfigYuzha.json";
const config = rawConfig
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
export function loadLayerConfig() {
    return config;
}
