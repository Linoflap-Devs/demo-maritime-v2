import type { SettingsItem } from "./settings.api";

const DEFAULT_SITE_LOGO_URL = "/company-logo.png";
const DEFAULT_SITE_TITLE = "Linoflap Technology Philippines Inc.";
const DEFAULT_COMPANY_ABBREVIATION = "Linoflap";
const DEFAULT_COMPANY_APP_NAME = "Crew Payroll System";

export interface SiteSettings {
  siteLogoRaw?: SettingsItem["ImageDetails"];
  siteLogoUrl: string;
  siteTitle: string;
  companyAbbreviation: string;
  companyAppName: string;
}

export const createSettingsMap = (settingsConfig: SettingsItem[]) =>
  new Map(settingsConfig.map((item) => [item.ConfigurationKey, item]));

export const getSettingsValue = (
  settingsMap: Map<string, SettingsItem>,
  key: string,
  fallback = ""
) => settingsMap.get(key)?.ConfigurationValue ?? fallback;

export const getSiteSettings = (settingsConfig: SettingsItem[]): SiteSettings => {
  const settingsMap = createSettingsMap(settingsConfig);
  const siteLogoRaw = settingsMap.get("CompanyLogo")?.ImageDetails;

  return {
    siteLogoRaw,
    siteLogoUrl: siteLogoRaw?.FileContent
      ? `data:${siteLogoRaw.ContentType};base64,${siteLogoRaw.FileContent}`
      : DEFAULT_SITE_LOGO_URL,
    siteTitle: getSettingsValue(settingsMap, "CompanyName", DEFAULT_SITE_TITLE),
    companyAbbreviation: getSettingsValue(
      settingsMap,
      "CompanyAbbreviation",
      DEFAULT_COMPANY_ABBREVIATION
    ),
    companyAppName: getSettingsValue(settingsMap, "AppName", DEFAULT_COMPANY_APP_NAME),
  };
};
