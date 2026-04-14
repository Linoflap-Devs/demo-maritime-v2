export const dynamic = 'force-dynamic';

import AppHomeClient from "@/components/pages/AppHomeClient";
import { SettingsItem } from "@/src/services/settings/settings.api";

async function getSettingsConfig(): Promise<SettingsItem[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      console.error("API_URL is missing");
      return [];
    }

    const res = await fetch(`${apiUrl}/config`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",   // important for dynamic
    });

    if (!res.ok) {
      console.error(`Backend error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  } catch (error) {
    console.error("Error fetching settings config:", error);
    return [];
  }
}

export default async function Home() {
  const settingsConfig: SettingsItem[] = await getSettingsConfig();
  return <AppHomeClient settingsConfig={settingsConfig} />;
}