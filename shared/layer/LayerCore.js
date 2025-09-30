export function compute2DTransform(entry, stageSize) {
    const [sx, sy] = normalizePair(entry.scale, 1, 1);
    const defaultCenter = stageSize / 2;
    const [px, py] = normalizePair(entry.position, defaultCenter, defaultCenter);
    return {
        position: { x: px, y: py },
        scale: { x: sx, y: sy },
    };
}
function normalizePair(value, fallbackX, fallbackY) {
    if (!Array.isArray(value) || value.length === 0)
        return [fallbackX, fallbackY];
    const [first, second] = value;
    const x = typeof first === "number" && Number.isFinite(first) ? first : fallbackX;
    const y = typeof second === "number" && Number.isFinite(second) ? second : fallbackY;
    return [x, y];
}
export function is2DLayer(entry) {
    return entry.renderer === "2D";
}
