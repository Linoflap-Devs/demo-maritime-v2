"use client";

import { useEffect, useState } from "react";
import Login from "@/components/Login";
import Image from "next/image";
import axiosInstance from "@/src/lib/axios";
import { SettingsItem } from "@/src/services/settings/settings.api";
import { getSiteSettings } from "@/src/services/settings/settings.helpers";

export default function Home() {
  const [settingsConfig, setSettingsConfig] = useState<SettingsItem[]>([]);

  useEffect(() => {
    axiosInstance.get("/config").then((res) => {
      if (res.data.success) setSettingsConfig(res.data.data);
    });
  }, []);

  const { siteLogoUrl, siteTitle, companyAbbreviation, companyAppName } =
    getSiteSettings(settingsConfig);
  
  const formatSiteTitle = (title: string) => {
    if (title.endsWith("Philippines Inc.")) {
      const withoutMaritime = title.replace(/Philippines Inc.$/, "").trim();
      const lines = withoutMaritime.split(" "); // split the rest by space
      return [...lines, "Philippines Inc."]; // append the last part as one line
    }
    return title.split(" "); // fallback: split all words
  };

  return (
    <main className="flex h-screen relative">
      <div className="bg-primary hidden lg:block lg:w-3/4 relative pl-5">
        <Image
          src="/boat-image.jpg"
          alt="Ship Background"
          fill
          className="object-cover opacity-20"
        />
        <div className="relative z-10 p-12 text-white">
          <div className="flex items-center gap-3 mb-20">
            <Image
              src={siteLogoUrl}
              alt={`Company Logo`}
              width={70}
              height={70}
            />
            <span className="text-2xl font-medium">{companyAbbreviation}</span>
          </div>
          <div className="flex justify-center flex-col gap-1">
            <h1 className="text-8xl font-bold leading-tight mb-1 mt-16">
              {formatSiteTitle(siteTitle).map((title, idx) => (
                <div key={idx}>{title.toUpperCase()}</div>
              ))}
            </h1>
            <p className="font-bold text-5xl mt-0">{companyAppName}</p>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/4 bg-background" />
      <div className="absolute inset-y-0 left-[75%] -translate-x-1/2 flex items-center z-20">
        <Login />
      </div>
    </main>
  );
}
