/**
 * Profile constants: preset avatars, age ranges, gender options,
 * screenname validation, and onboarding flag key.
 */

export interface PresetAvatar {
  id: string;
  label: string;
  url: string;
}

// Curated set of famous-peak icons used as preset avatar choices.
export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'everest', label: 'Everest', url: 'https://r2-pub.rork.com/attachments/x1chc1y6k54qosh9osqno.png' },
  { id: 'k2', label: 'K2', url: 'https://r2-pub.rork.com/projects/0flxsf6ncoo30x7j7rdu6/assets/2cc3597e-ea2d-45a8-afe3-8103ca9c030a.png' },
  { id: 'matterhorn', label: 'Matterhorn', url: 'https://r2-pub.rork.com/attachments/c4m5cgdok7k4ybmdri4u7.png' },
  { id: 'mont-blanc', label: 'Mont Blanc', url: 'https://r2-pub.rork.com/attachments/o7mrjs8o2u5acz0da1anv.png' },
  { id: 'denali', label: 'Denali', url: 'https://r2-pub.rork.com/attachments/5s7mfefmflpexl7zallek.png' },
  { id: 'kilimanjaro', label: 'Kilimanjaro', url: 'https://r2-pub.rork.com/attachments/uu6jostj2pc1ssed3bcr7.png' },
  { id: 'aconcagua', label: 'Aconcagua', url: 'https://r2-pub.rork.com/projects/0flxsf6ncoo30x7j7rdu6/assets/add61dce-94bb-40ee-86e8-7a3321146969.png' },
  { id: 'elbrus', label: 'Elbrus', url: 'https://r2-pub.rork.com/projects/0flxsf6ncoo30x7j7rdu6/assets/cc6b0aba-e189-465e-aa38-b1c7ac8c2169.png' },
  { id: 'vinson', label: 'Vinson', url: 'https://r2-pub.rork.com/attachments/gdtoldn0m0j27ma521smi.png' },
  { id: 'carstensz', label: 'Carstensz', url: 'https://r2-pub.rork.com/attachments/d92r7o90v9io4ui5lxvt1.png' },
  { id: 'lhotse', label: 'Lhotse', url: 'https://r2-pub.rork.com/projects/0flxsf6ncoo30x7j7rdu6/assets/aa0c4eca-f7f5-439c-b7af-b0bc2dc2efc6.png' },
  { id: 'makalu', label: 'Makalu', url: 'https://r2-pub.rork.com/generated-images/35b259ee-2118-42e9-9deb-b52d3ed0305d.png' },
];

export const AGE_RANGES: string[] = [
  '18–24',
  '25–34',
  '35–44',
  '45–54',
  '55–64',
  '65+',
  'Prefer not to say',
];

export const GENDER_OPTIONS: string[] = [
  'Male',
  'Female',
  'Non-binary',
  'Other',
  'Prefer not to say',
];

/** Allowed characters: lowercase letters, digits, underscore, hyphen. 3–20 chars. */
export const SCREENNAME_REGEX = /^[a-z0-9_-]{3,20}$/;

/** Onboarding flag stored in AsyncStorage per user. */
export const ONBOARDING_KEY_PREFIX = 'peaknab_onboarded_';

/**
 * Validate a screenname string.
 * Returns an error message string, or null if valid.
 */
export function validateScreenname(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) return 'Choose a screenname';
  if (trimmed.length < 3) return 'At least 3 characters';
  if (trimmed.length > 20) return 'At most 20 characters';
  if (!SCREENNAME_REGEX.test(trimmed)) {
    return 'Only letters, numbers, _ and - allowed';
  }
  return null;
}
