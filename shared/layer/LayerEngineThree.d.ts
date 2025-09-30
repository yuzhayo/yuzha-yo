import * as THREE from "three";
import type { LayerConfigEntry } from "../config/Config";
export declare function mountThreeLayers(scene: THREE.Scene, entries: LayerConfigEntry[]): Promise<() => void>;
