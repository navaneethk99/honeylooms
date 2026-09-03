export const bannerImagePresets = [
  { dimension: 1920, name: 'bannerPreview', quality: 100 },
  { dimension: 3230, name: 'bannerMedium', quality: 100 },
  { dimension: 3230, name: 'bannerLarge', quality: 100 },
] as const

export type BannerImagePresetName = (typeof bannerImagePresets)[number]['name']
