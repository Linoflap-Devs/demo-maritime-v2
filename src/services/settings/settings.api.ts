import axiosInstance from "@/src/lib/axios"

interface ImageItem {
  ImageId?: number
  ImageType?: number
  FileSize?: number
  FileExtension?: string
  ContentType?: string
  Filename?: string
  FileContent?: string
}

export interface SettingsItem {
  ConfigurationKey: string
  ConfigurationValue: string
  ImageDetails?: ImageItem
}

interface SettingsConfigResponse {
  success: boolean
  data: SettingsItem[]
  message: string
}

export const getSettingsConfig = async (): Promise<SettingsConfigResponse> => {
  try {
    const response = await axiosInstance.get<SettingsConfigResponse>("/config")
    return response.data
  } catch (error: any) {
    console.error("Error fetching settings config:", error.response?.data || error.message)
    throw error
  }
}

export interface UpdateSettingsConfigPayload {
  companyName: string
  logo?: File | null
  primaryColor: string
  companyAbbreviation: string
  backgroundColor: string
  ring: string
  searchBackground: string,
  appName: string
}

export const updateSettingsConfig = async (
  payload: UpdateSettingsConfigPayload
): Promise<SettingsConfigResponse> => {
  const formData = new FormData()
  formData.append("companyName", payload.companyName)
  formData.append("primaryColor", payload.primaryColor)
  formData.append("companyAbbreviation", payload.companyAbbreviation)
  formData.append("backgroundColor", payload.backgroundColor)
  formData.append("ring", payload.ring)
  formData.append("searchBackground", payload.searchBackground)
  formData.append("appName", payload.appName)

  // Attach the actual file only if it exists
  if (payload.logo) {
    formData.append("logo", payload.logo)
  }


  const response = await axiosInstance.patch<SettingsConfigResponse>("/config", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })

  return response.data
}
