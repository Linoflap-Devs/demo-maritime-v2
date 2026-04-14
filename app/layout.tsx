import { Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getSettingsConfig } from "@/src/services/settings/settings.api";
import { getSiteSettings } from "@/src/services/settings/settings.helpers";
import ThemeInitializer from "@/src/utils/ThemeInitializer";

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
  const { companyAbbreviation: siteTitle, companyAppName: siteDescription } =
    getSiteSettings(settingsConfig.data);

  return (
    <html lang="en">
      <head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
      </head>
      <body className={`${montserrat.variable} antialiased`}>
        <ThemeInitializer settingsConfig={settingsConfig.data} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
