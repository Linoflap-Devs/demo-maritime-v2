export const dynamic = 'force-dynamic';

import { Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ThemeInitializer from "@/src/utils/ThemeInitializer";
import { getSiteSettings } from "@/src/services/settings/settings.helpers";

async function getSettingsConfig() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      console.error("API_URL environment variable is missing");
      return { success: false, data: [] };
    }

    const res = await fetch(`${apiUrl}/config`, { 
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Failed to fetch config: ${res.status} ${res.statusText}`);
      return { success: false, data: [] };
    }

    const data = await res.json();

    return {
      success: true,
      data: Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [],
    };

  } catch (error) {
    console.error("Error fetching settings config in layout:", error);
    return { success: false, data: [] };
  }
}

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settingsConfig = await getSettingsConfig();

  const { companyAbbreviation: siteTitle = "Default Title", 
          companyAppName: siteDescription = "Default Description" } = 
    getSiteSettings(settingsConfig.data || []);

  return (
    <html lang="en">
      <head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
      </head>
      <body className={`${montserrat.variable} antialiased`}>
        <ThemeInitializer settingsConfig={settingsConfig.data || []} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}