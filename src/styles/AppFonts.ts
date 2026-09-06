export interface AppFontConfig {
  interRegular?: string;
  interMedium?: string;
  interBold?: string;
  Sfprotext?: string;
}

export const AppFonts: AppFontConfig = {
  interRegular: undefined,
  interMedium: undefined,
  interBold: undefined,
  Sfprotext: undefined,
};

/**
 * Configure or override font families used across all inspector screens.
 * Useful when integrating into apps with custom font setups or system fonts.
 */
export const setAppFonts = (customFonts: Partial<AppFontConfig>): void => {
  if (!customFonts || typeof customFonts !== 'object') return;
  Object.assign(AppFonts, customFonts);
};

export default AppFonts;
