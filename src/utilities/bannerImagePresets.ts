export const bannerImagePresets = [
  { dimension: 960, name: 'bannerPreview', quality: 100 },
  { dimension: 1920, name: 'bannerMedium', quality: 100 },
  { dimension: 3230, name: 'bannerLarge', quality: 100 },
] as const

export type BannerImagePresetName = (typeof bannerImagePresets)[number]['name']
