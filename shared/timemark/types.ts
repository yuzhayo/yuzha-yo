export type TimemarkEditType = 
  | 0  // Auto-generated (Time, Weather, Altitude, Compass, Lat/Long, Map)
  | 2  // Editable preset text (Title, Tags, Business Card, Styled Note)
  | 3  // Custom user input (Notes, Project, Area, custom fields)
  | 4  // Location-based (Address)
  | 6; // Special (Time with specific format, Map interactive)

export type TimemarkHourFormat = 
  | 0  // 24-hour format
  | 1; // 12-hour format

export type TimemarkTempUnits = 
  | 0  // Celsius
  | 1; // Fahrenheit

export interface BusinessCardItem {
  id: number;
  title: string;
  content: string;
  switchStatus: boolean;
  logoTintColor?: string;
}

export interface TimemarkItem {
  id: number;
  title: string;
  content: string;
  editType: TimemarkEditType;
  style: number;
  switchStatus: boolean;
  userCustom: boolean;
  showArea?: number;
  hourFormat?: TimemarkHourFormat;
  tempUnits?: TimemarkTempUnits;
  isRequired?: boolean;
  type?: string;
  maxLine?: number;
  unit?: string;
  options?: string[];
  iconStyle?: number;
  iconConfig?: Record<string, unknown>;
}

export interface TimemarkTheme {
  id: number;
  switchStatus: boolean;
  color: string;
  alpha: string;
  textColor: string;
  fontScale: string;
  sizeScale: string;
  widthScale: string;
  iconStyle?: number;
  iconConfig?: Record<string, unknown>;
  borderRadius?: number;
  padding?: number;
}

export interface TimemarkLogo {
  id: number;
  switchStatus: boolean;
  url: string;
  alpha: string;
  scale: string;
  gravity?: number;
}

export interface TimemarkTemplate {
  id: string;
  base_id: string;
  name: string;
  version?: string;
  watermarkType?: number;
  createTime?: string;
  update_time?: string;
  items: TimemarkItem[];
  theme: TimemarkTheme;
  logo: TimemarkLogo;
  logoList?: TimemarkLogo[];
}

export interface TimemarkTemplateWrapper {
  name: string;
  coverImageURL: string;
  watermarkContent: string;
}

export const TIMEMARK_ITEM_IDS = {
  TIME: 1,
  ADDRESS: 2,
  LAT_LONG: 3,
  WEATHER: 4,
  ALTITUDE: 5,
  COMPASS: 6,
  TITLE: 11,
  NOTES: 12,
  TITLE_ALT: 13,
  PROJECT: 14,
  AREA: 15,
  INSPECTION: 16,
  INSPECTOR: 17,
  STYLED_NOTE: 88,
  MAP: 210,
  COMPANY: 550,
  STAFF_NAME: 510,
  WORK_ID: 520,
  BUSINESS_CARD: 620,
  TAGS: 630,
  PHOTO_CODE: 640,
  CONSTRUCTION_CONTENT: 1201,
  EXECUTOR: 1202,
  CONSTRUCTION_AREA: 1203,
  OPERATOR: 1204,
  INSPECTOR_ALT: 1205,
  INSPECTION_ALT: 1206,
  CONSTRUCTION_DESCRIPTION: 1210,
  DEVELOPER: 1211,
} as const;

export const TIMEMARK_STYLES = {
  DEFAULT: 0,
  TIME_LARGE: 130,
  TIME_WITH_DATE: 132,
  WEATHER: 200,
  ADDRESS: 300,
  ALTITUDE: 400,
  LAT_LONG: 500,
  COMPASS: 600,
  MAP: 2100,
} as const;

export const TIMEMARK_FONTS = [
  "BebasDaka",
  "BigShouldersText-Medium",
  "Handlee-Regular",
  "Montserrat-Black",
  "PTMono-Bold",
  "PTMono-Regular",
  "RobotoCondensed-Bold",
  "RobotoCondensed-Medium",
  "RobotoCondensed-Regular",
  "TypoDigitDemo",
  "XiaoHeiNumber",
] as const;

export type TimemarkFontName = typeof TIMEMARK_FONTS[number];

export const TIMEMARK_LOGOS = [
  "amazon_logo.png",
  "dhl_logo.png",
  "doordash_logo.png",
  "fed_logo.png",
  "grubhub_logo.png",
  "instacart_logo.png",
  "ubereats_logo.png",
  "ups_logo.png",
] as const;

export type TimemarkLogoName = typeof TIMEMARK_LOGOS[number];

export function parseTimemarkTemplate(wrapper: TimemarkTemplateWrapper): TimemarkTemplate {
  const parsed = JSON.parse(wrapper.watermarkContent);
  return parsed as TimemarkTemplate;
}

export function parseTimemarkTemplates(wrappers: TimemarkTemplateWrapper[]): TimemarkTemplate[] {
  return wrappers.map(parseTimemarkTemplate);
}

/**
 * Generates a random alphanumeric photo verification code.
 * 
 * WARNING: This function uses Math.random() which is NOT cryptographically secure.
 * Do NOT use this for security-critical tamper-proof verification.
 * For production security needs, use crypto.getRandomValues() instead.
 * 
 * @param length - Length of the code (default: 14)
 * @returns Random uppercase alphanumeric string
 */
export function generatePhotoCode(length: number = 14): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getVisibleItems(template: TimemarkTemplate): TimemarkItem[] {
  return template.items.filter(item => item.switchStatus);
}

export function getItemById(template: TimemarkTemplate, id: number): TimemarkItem | undefined {
  return template.items.find(item => item.id === id);
}
