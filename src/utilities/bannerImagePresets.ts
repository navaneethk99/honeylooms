export const bannerImagePresets = [
  { dimension: 640, name: 'bannerPreview', quality: 40 },
  { dimension: 960, name: 'bannerMedium', quality: 60 },
  { dimension: 1920, name: 'bannerLarge', quality: 75 },
] as const

export type BannerImagePresetName = (typeof bannerImagePresets)[number]['name']
