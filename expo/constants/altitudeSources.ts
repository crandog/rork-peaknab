export interface OxygenSource {
  title: string;
  detail: string;
  url: string;
}

export const OXYGEN_SOURCES: OxygenSource[] = [
  {
    title: 'U.S. Standard Atmosphere, 1976 (NOAA / NASA / U.S. Air Force)',
    detail: 'The atmospheric-pressure model our estimate is based on.',
    url: 'https://en.wikipedia.org/wiki/U.S._Standard_Atmosphere',
  },
  {
    title: 'Portland State Aerospace Society — pressure-altitude derivation',
    detail: 'Derives the exact formula and constants PeakNab uses.',
    url: 'https://archive.psas.pdx.edu/RocketScience/PressureAltitude_Derived.pdf',
  },
  {
    title: 'CDC Yellow Book — High-Altitude Travel & Altitude Illness',
    detail: 'U.S. CDC guidance on altitude and its health effects.',
    url: 'https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html',
  },
  {
    title: 'Wilderness Medical Society — Acute Altitude Illness Guidelines (2024 Update)',
    detail: 'Clinical practice guidelines for prevention, diagnosis and treatment.',
    url: 'https://journals.sagepub.com/doi/10.1016/j.wem.2023.05.013',
  },
  {
    title: 'West JB — High-Altitude Medicine (Am J Respir Crit Care Med, 2012)',
    detail: 'Peer-reviewed review of altitude physiology and oxygen availability.',
    url: 'https://www.atsjournals.org/doi/full/10.1164/rccm.201207-1323CI',
  },
];

export const OXYGEN_EXPLAINER =
  'PeakNab estimates the air pressure at a peak\'s elevation as a percentage of sea-level pressure, using the standard barometric formula from the U.S. Standard Atmosphere (1976). Because air is about 20.9% oxygen at every altitude, this percentage also reflects the oxygen available to breathe relative to sea level.';

export const OXYGEN_DISCLAIMER =
  'This figure is general information for planning, not medical advice. Altitude affects people differently and altitude illness can be serious. Acclimatize gradually and consult a clinician or the guidelines below before high-altitude travel.';
