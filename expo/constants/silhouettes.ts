export interface SilhouetteData {
  path: string;
  snowPath?: string;
}

export const silhouettes: Record<string, SilhouetteData> = {
  everest: {
    path: 'M0,65 L12,52 L22,44 L30,46 L38,32 L44,22 L50,12 L54,20 L58,28 L64,30 L72,38 L82,48 L100,65 Z',
    snowPath: 'M44,22 L50,12 L54,20 L58,28 L56,26 L52,18 L48,16 Z',
  },
  k2: {
    path: 'M8,65 L28,48 L38,35 L44,22 L48,14 L50,8 L52,14 L56,24 L62,34 L72,46 L92,65 Z',
    snowPath: 'M44,22 L48,14 L50,8 L52,14 L56,24 L54,22 L50,12 L46,20 Z',
  },
  matterhorn: {
    path: 'M12,65 L30,52 L38,42 L44,28 L48,16 L50,5 L52,16 L56,30 L62,42 L70,52 L88,65 Z',
    snowPath: 'M46,20 L48,16 L50,5 L52,16 L54,22 L52,14 L50,8 L48,14 Z',
  },
  kilimanjaro: {
    path: 'M0,65 L8,50 L16,38 L26,28 L35,22 L42,18 L48,16 L52,16 L58,18 L65,22 L74,28 L84,38 L92,50 L100,65 Z',
    snowPath: 'M35,22 L42,18 L48,16 L52,16 L58,18 L65,22 L60,20 L52,17 L48,17 L42,19 L38,22 Z',
  },
  denali: {
    path: 'M0,65 L6,54 L14,44 L24,34 L32,26 L40,20 L48,15 L50,12 L52,15 L58,18 L66,24 L74,32 L84,42 L92,52 L100,65 Z',
    snowPath: 'M40,20 L48,15 L50,12 L52,15 L58,18 L56,17 L52,14 L48,13 L44,17 Z',
  },
  fuji: {
    path: 'M2,65 L22,44 L35,30 L44,20 L48,14 L50,10 L52,14 L56,20 L65,30 L78,44 L98,65 Z',
    snowPath: 'M44,20 L48,14 L50,10 L52,14 L56,20 L54,18 L50,12 L46,18 Z',
  },
  fitz_roy: {
    path: 'M2,65 L12,52 L18,46 L22,38 L25,28 L28,22 L30,30 L34,18 L37,10 L40,18 L44,24 L47,14 L50,5 L53,14 L57,22 L60,16 L63,8 L66,18 L70,30 L74,42 L80,50 L90,58 L100,65 Z',
    snowPath: 'M34,18 L37,10 L40,18 L38,14 Z M47,14 L50,5 L53,14 L51,10 Z M60,16 L63,8 L66,18 L64,14 Z',
  },
  aconcagua: {
    path: 'M0,65 L14,50 L26,38 L36,28 L44,20 L50,14 L54,12 L58,18 L64,26 L72,36 L84,50 L100,65 Z',
    snowPath: 'M44,20 L50,14 L54,12 L58,18 L56,16 L52,13 L48,16 Z',
  },
  mont_blanc: {
    path: 'M0,65 L10,50 L22,38 L32,28 L40,22 L46,18 L50,16 L54,16 L58,18 L64,22 L72,30 L82,40 L92,52 L100,65 Z',
    snowPath: 'M40,22 L46,18 L50,16 L54,16 L58,18 L64,22 L60,20 L54,17 L50,17 L46,19 Z',
  },
  eiger: {
    path: 'M2,65 L16,60 L26,54 L32,38 L36,24 L40,16 L46,10 L52,14 L58,22 L64,32 L72,44 L82,54 L100,65 Z',
    snowPath: 'M36,24 L40,16 L46,10 L52,14 L50,12 L44,12 L38,20 Z',
  },
  ama_dablam: {
    path: 'M5,65 L16,50 L24,42 L30,36 L36,30 L42,22 L46,14 L50,6 L54,14 L58,24 L64,32 L70,24 L74,32 L80,42 L88,52 L95,65 Z',
    snowPath: 'M42,22 L46,14 L50,6 L54,14 L52,12 L50,8 L48,12 Z',
  },
  cotopaxi: {
    path: 'M4,65 L18,46 L30,32 L40,22 L46,16 L50,11 L54,16 L60,22 L70,32 L82,46 L96,65 Z',
    snowPath: 'M40,22 L46,16 L50,11 L54,16 L60,22 L56,18 L50,13 L44,18 Z',
  },
  kangchenjunga: {
    path: 'M0,65 L8,50 L16,40 L22,32 L26,26 L30,20 L34,24 L38,18 L42,12 L46,8 L50,12 L54,16 L58,12 L62,18 L66,24 L72,32 L80,42 L90,54 L100,65 Z',
    snowPath: 'M38,18 L42,12 L46,8 L50,12 L48,10 L44,10 L40,16 Z M54,16 L58,12 L62,18 L60,16 L56,14 Z',
  },
  cerro_torre: {
    path: 'M22,65 L32,52 L38,44 L42,34 L44,26 L46,18 L48,12 L50,4 L52,12 L54,18 L56,26 L58,34 L62,44 L68,52 L78,65 Z',
    snowPath: 'M46,18 L48,12 L50,4 L52,12 L54,18 L52,14 L50,6 L48,14 Z',
  },
  volcano_cone: {
    path: 'M2,65 L20,44 L34,30 L44,20 L50,12 L56,20 L66,30 L80,44 L98,65 Z',
    snowPath: 'M44,20 L50,12 L56,20 L54,18 L50,14 L46,18 Z',
  },
  broad_dome: {
    path: 'M0,65 L12,48 L26,34 L38,24 L46,19 L50,17 L54,17 L58,19 L66,24 L78,34 L90,48 L100,65 Z',
    snowPath: 'M38,24 L46,19 L50,17 L54,17 L58,19 L66,24 L62,22 L54,18 L50,18 L46,20 L40,24 Z',
  },
  gentle_slope: {
    path: 'M0,65 L12,54 L28,42 L40,34 L48,28 L50,26 L52,28 L58,32 L70,40 L84,50 L100,65 Z',
    snowPath: 'M48,28 L50,26 L52,28 L51,27 Z',
  },
  rugged_ridge: {
    path: 'M0,65 L10,54 L18,46 L24,40 L28,34 L32,28 L36,24 L40,18 L44,14 L48,10 L52,14 L56,18 L60,24 L66,32 L72,40 L80,48 L90,56 L100,65 Z',
    snowPath: 'M40,18 L44,14 L48,10 L52,14 L50,12 L46,12 L42,16 Z',
  },
  twin_peaks: {
    path: 'M0,65 L10,50 L20,38 L28,26 L34,18 L37,12 L40,18 L46,26 L50,28 L54,26 L60,18 L63,12 L66,18 L72,26 L80,38 L90,50 L100,65 Z',
    snowPath: 'M28,26 L34,18 L37,12 L40,18 L38,16 L35,14 L30,22 Z M54,26 L60,18 L63,12 L66,18 L64,16 L61,14 L56,22 Z',
  },
  massive_wall: {
    path: 'M0,65 L8,56 L16,44 L22,34 L28,24 L34,16 L42,10 L50,8 L58,12 L66,20 L74,32 L82,44 L92,56 L100,65 Z',
    snowPath: 'M34,16 L42,10 L50,8 L58,12 L54,10 L48,9 L42,12 L36,16 Z',
  },
  pyramid_classic: {
    path: 'M4,65 L18,50 L32,36 L42,24 L48,16 L50,10 L52,16 L58,24 L68,36 L82,50 L96,65 Z',
    snowPath: 'M42,24 L48,16 L50,10 L52,16 L58,24 L56,22 L50,12 L44,22 Z',
  },
  stepped_ridge: {
    path: 'M0,65 L8,52 L18,42 L26,34 L32,30 L38,24 L42,20 L48,14 L50,10 L54,16 L58,20 L64,26 L72,34 L80,42 L88,52 L100,65 Z',
    snowPath: 'M42,20 L48,14 L50,10 L54,16 L52,14 L50,12 L46,16 Z',
  },
  diamond_face: {
    path: 'M6,65 L18,54 L28,44 L34,34 L38,26 L42,18 L46,12 L50,8 L54,14 L56,10 L60,18 L66,28 L74,40 L84,52 L96,65 Z',
    snowPath: 'M42,18 L46,12 L50,8 L54,14 L52,12 L50,10 L48,12 L44,16 Z M54,14 L56,10 L60,18 L58,16 L56,12 Z',
  },
  table_top: {
    path: 'M2,65 L16,46 L26,32 L34,24 L40,18 L44,16 L56,16 L60,18 L66,24 L74,32 L84,46 L98,65 Z',
    snowPath: 'M40,18 L44,16 L56,16 L60,18 L58,17 L44,17 L42,18 Z',
  },
  carstensz: {
    path: 'M12,65 L24,52 L32,44 L36,34 L40,26 L43,20 L46,14 L48,8 L50,4 L52,8 L54,16 L58,26 L62,36 L68,46 L76,54 L88,65 Z',
    snowPath: 'M46,14 L48,8 L50,4 L52,8 L54,16 L52,12 L50,6 L48,12 Z',
  },
  fishtail: {
    path: 'M6,65 L18,50 L28,40 L36,30 L40,22 L43,14 L46,10 L48,16 L50,20 L52,16 L54,8 L57,14 L60,22 L66,32 L76,44 L88,56 L96,65 Z',
    snowPath: 'M40,22 L43,14 L46,10 L48,16 L46,14 L44,12 Z M50,20 L52,16 L54,8 L57,14 L55,12 L53,10 Z',
  },
};

export const mountainSilhouetteMap: Record<string, string> = {
  'everest': 'everest',
  'aconcagua': 'aconcagua',
  'denali': 'denali',
  'kilimanjaro': 'kilimanjaro',
  'elbrus': 'twin_peaks',
  'vinson': 'massive_wall',
  'carstensz': 'carstensz',

  'k2': 'k2',
  'kangchenjunga': 'kangchenjunga',
  'lhotse': 'pyramid_classic',
  'makalu': 'pyramid_classic',
  'cho-oyu': 'broad_dome',
  'dhaulagiri': 'massive_wall',
  'manaslu': 'broad_dome',
  'nanga-parbat': 'massive_wall',
  'annapurna': 'stepped_ridge',
  'gasherbrum1': 'pyramid_classic',
  'broad-peak': 'table_top',
  'gasherbrum2': 'pyramid_classic',
  'shishapangma': 'broad_dome',

  'mt-elbert': 'gentle_slope',
  'mt-massive': 'broad_dome',
  'mt-harvard': 'pyramid_classic',
  'blanca-peak': 'rugged_ridge',
  'la-plata': 'gentle_slope',
  'uncompahgre': 'table_top',
  'crestone-peak': 'rugged_ridge',
  'mt-lincoln': 'gentle_slope',
  'grays-peak': 'gentle_slope',
  'torreys-peak': 'pyramid_classic',
  'quandary-peak': 'gentle_slope',
  'longs-peak': 'diamond_face',
  'pikes-peak': 'broad_dome',
  'capitol-peak': 'rugged_ridge',
  'maroon-peak': 'twin_peaks',
  'cascade-14er-1': 'gentle_slope',
  'mt-bierstadt': 'gentle_slope',
  'mt-sneffels': 'pyramid_classic',

  'mont-blanc': 'mont_blanc',
  'matterhorn': 'matterhorn',
  'eiger': 'eiger',
  'jungfrau': 'pyramid_classic',
  'gran-paradiso': 'broad_dome',
  'monte-rosa': 'kangchenjunga',
  'weisshorn': 'matterhorn',
  'dom': 'pyramid_classic',
  'grossglockner': 'pyramid_classic',
  'zugspitze': 'rugged_ridge',
  'dent-blanche': 'matterhorn',
  'aiguille-verte': 'k2',
  'grandes-jorasses': 'eiger',
  'triglav': 'rugged_ridge',
  'mt-blanc-du-tacul': 'pyramid_classic',
  'lyskamm': 'rugged_ridge',
  'mt-blanc-chamomix': 'cerro_torre',

  'ojos-del-salado': 'volcano_cone',
  'huascaran': 'twin_peaks',
  'chimborazo': 'broad_dome',
  'cotopaxi': 'cotopaxi',
  'illimani': 'kangchenjunga',
  'huayna-potosi': 'pyramid_classic',
  'alpamayo': 'matterhorn',
  'fitz-roy': 'fitz_roy',
  'cerro-torre': 'cerro_torre',
  'sajama': 'volcano_cone',
  'volcan-lanin': 'cotopaxi',
  'mercedario': 'aconcagua',
  'iliniza-sur': 'twin_peaks',
  'iliniza-norte': 'twin_peaks',

  'ama-dablam': 'ama_dablam',
  'island-peak': 'gentle_slope',
  'mera-peak': 'broad_dome',
  'pumori': 'pyramid_classic',
  'baruntse': 'stepped_ridge',
  'lobuche-east': 'gentle_slope',
  'annapurna-south': 'stepped_ridge',
  'machapuchare': 'fishtail',
  'tilicho-peak': 'massive_wall',

  'mt-rainier': 'volcano_cone',
  'mt-hood': 'cotopaxi',
  'mt-shasta': 'volcano_cone',
  'mt-whitney': 'rugged_ridge',
  'mt-fuji': 'fuji',
  'aoraki': 'pyramid_classic',
  'mt-kenya': 'rugged_ridge',
  'mt-stanley': 'broad_dome',
  'toubkal': 'gentle_slope',
  'mt-olympus': 'rugged_ridge',
  'ben-nevis': 'gentle_slope',
  'mt-elbrus-west': 'volcano_cone',
  'mt-kinabalu': 'table_top',
  'orizaba': 'volcano_cone',
  'iztaccihuatl': 'stepped_ridge',
  'mt-cook': 'matterhorn',
  'mt-temple': 'pyramid_classic',
  'mt-robson': 'massive_wall',
  'mt-logan': 'denali',
  'mt-elbrus-traverse': 'volcano_cone',
  'musala': 'gentle_slope',
  'gerlachovsky': 'pyramid_classic',
  'mt-baker': 'volcano_cone',
  'volcano-teide': 'volcano_cone',
};

export function getSilhouette(mountainId: string): SilhouetteData {
  const key = mountainSilhouetteMap[mountainId] ?? 'pyramid_classic';
  return silhouettes[key] ?? silhouettes['pyramid_classic'];
}
