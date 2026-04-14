"use client";

import { useEffect } from "react";

interface ConfigItem {
  ConfigurationKey: string;
  ConfigurationValue: string;
}

export default function ThemeInitializer({
  settingsConfig,
}: {
  settingsConfig: ConfigItem[];
}) {
  useEffect(() => {
    const root = document.documentElement;

    settingsConfig.forEach((item) => {
      // Example: ConfigurationKey = "primary", ConfigurationValue = "#ff0000"
      root.style.setProperty(`--${item.ConfigurationKey}`, item.ConfigurationValue);
    });
  }, [settingsConfig]);

  return null; // nothing to render
}
