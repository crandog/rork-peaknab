const MOUNTAIN_ICON_URLS = [
  'https://r2-pub.rork.com/generated-images/fb61542f-c407-4717-b9ab-f42d94ac06bf.png',
  'https://r2-pub.rork.com/generated-images/02e2b0d1-e26a-44ce-8e43-f06de6f8be3b.png',
  'https://r2-pub.rork.com/generated-images/b3555bb3-f443-4fb5-a977-12d4ff72007c.png',
  'https://r2-pub.rork.com/generated-images/6605ced7-8326-4f65-b536-eecc82a6e144.png',
  'https://r2-pub.rork.com/generated-images/b0aeafe8-0ecc-4ef4-a9b4-e8f1fbfb4e73.png',
  'https://r2-pub.rork.com/generated-images/67e48080-4b6c-4b6f-956a-b87382fd9e94.png',
  'https://r2-pub.rork.com/generated-images/3026bd50-e8b9-4af2-b233-b515729806cf.png',
  'https://r2-pub.rork.com/generated-images/8cf06ae5-dafa-4e4e-a3e9-dd0866d1d0c1.png',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getMountainIconUrl(mountainId: string): string {
  const index = hashString(mountainId) % MOUNTAIN_ICON_URLS.length;
  return MOUNTAIN_ICON_URLS[index];
}
