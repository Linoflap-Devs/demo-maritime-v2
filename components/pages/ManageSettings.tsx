"use client"

import { useEffect, useState } from "react"
import { getSettingsConfig, SettingsItem, updateSettingsConfig, UpdateSettingsConfigPayload } from "@/src/services/settings/settings.api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { toast } from "../ui/use-toast"

export default function SettingsPage() {
  const [config, setConfig] = useState<SettingsItem[]>([])
  const [isDisabled, setDisabled] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [initialConfig, setInitialConfig] = useState<SettingsItem[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await getSettingsConfig();

        if (res.success) {
          setConfig(res.data);
          setInitialConfig(res.data);
        } else {
          console.error("Failed to fetch settings data:", res.message);
        }
      } catch (err) {
        console.error("Error fetching settings data:", err);
      } finally {
        setLoading(false); // always stop loading
      }
    };

    fetchConfig();
  }, []);

  const handleEdit = () => {
    setDisabled((prev) => !prev)
  }

  const resetValues = () => {
    setConfig(initialConfig);
  };

  const handleChange = (key: string, value: string) => {
    setConfig(prev =>
      prev.map(item =>
        item.ConfigurationKey === key ? { ...item, ConfigurationValue: value } : item
      )
    )
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogoFile(e.target.files[0])
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const payload: UpdateSettingsConfigPayload = {
        companyName: config.find(c => c.ConfigurationKey === "CompanyName")?.ConfigurationValue ?? "",
        companyAbbreviation: config.find(c => c.ConfigurationKey === "CompanyAbbreviation")?.ConfigurationValue ?? "",
        primaryColor: config.find(c => c.ConfigurationKey === "primary")?.ConfigurationValue ?? "",
        backgroundColor: config.find(c => c.ConfigurationKey === "background")?.ConfigurationValue ?? "",
        ring: config.find(c => c.ConfigurationKey === "ring")?.ConfigurationValue ?? "",
        searchBackground: config.find(c => c.ConfigurationKey === "searchBackground")?.ConfigurationValue ?? "",
        appName: config.find(c => c.ConfigurationKey === "AppName")?.ConfigurationValue ?? "",
        logo: logoFile,
      }

      const res = await updateSettingsConfig(payload);

      if (res.success) {
        toast({
          title: "Success",
          description: "Configuration Settings successfully edited.",
          variant: "success",
        });
        setDisabled(false);
      } else {
        toast({
          title: "Error",
          description: res.message,
          variant: "destructive",
        });
        setDisabled(false);
      }
    } catch (err) {
      console.error("Error saving config:", err);
      toast({
        title: "Error",
        description: "Something went wrong while saving settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsSaving(false); // fixed
    }
  }

  return (
    <div className="p-6 grid gap-6">
      <div>
        <div className="flex justify-between border-b">
          <div className="text-2xl font-semibold p-4 pt-2">
            Manage Settings
          </div>
          <div>
            <Button
              variant={isDisabled ? "default" : "outline"}
              className="flex justify-end p-4 gap-3"
              onClick={handleEdit}
            >
              <Settings />
              {isDisabled ? "Enable" : "Disable"} Edit Settings
            </Button>
          </div>
        </div>

        {config.map((item) => (
          <div
            key={item.ConfigurationKey}
            className="grid grid-cols-2 items-start gap-6 py-4 px-4 border-b"
          >
            {/* Label Section */}
            <div className="flex flex-col">
              <span className="text-lg font-semibold items-center">
                {item.ConfigurationKey.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, str => str.toUpperCase())}
              </span>
              <span className="text-sm text-gray-500">
                {item.ConfigurationKey === "CompanyLogo"
                  ? item.ImageDetails?.Filename
                  : item.ConfigurationValue}
              </span>
            </div>

            {/* Value Section */}
            <div className="flex items-start gap-4">
              {item.ConfigurationKey === "CompanyLogo" ? (
                <div className="flex items-center gap-4">
                  {item.ConfigurationKey === "CompanyLogo" && item.ImageDetails?.FileContent && (
                    <img
                      src={`data:${item.ImageDetails.ContentType};base64,${item.ImageDetails.FileContent}`}
                      alt={item.ImageDetails.Filename}
                      className="h-16 w-16 rounded-md border object-cover"
                    />
                  )}
                  <Input
                    type="file"
                    disabled={isDisabled}
                    onChange={handleLogoChange}
                    className="h-10 w-56 p-1"
                  />
                </div>
              ) : item.ConfigurationValue.startsWith("#") ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      disabled={isDisabled}
                      value={item.ConfigurationValue}
                      onChange={(e) =>
                        handleChange(item.ConfigurationKey, e.target.value)
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="h-10 w-10 rounded-full border shadow-sm"
                      style={{ backgroundColor: item.ConfigurationValue }}
                    />
                  </div>
                  <span className="text-lg font-semibold">{item.ConfigurationValue.toUpperCase()}</span>
                </div>
              ) : (
                <Input
                  type="text"
                  disabled={isDisabled}
                  value={item.ConfigurationValue}
                  onChange={(e) =>
                    handleChange(item.ConfigurationKey, e.target.value)
                  }
                  className="h-10 w-56 p-1"
                />
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>
      <div className="flex justify-end p-4 gap-3">
        <Button variant="outline" onClick={resetValues}>Reset Values</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  )
}
