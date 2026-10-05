export const SPORTS = [
  { id: 'wheelchair_basketball', label: 'Wheelchair Basketball' },
  { id: 'wheelchair_tennis', label: 'Wheelchair Tennis' },
  { id: 'wheelchair_badminton', label: 'Wheelchair Badminton' },
  { id: 'para_athletics', label: 'Para-Athletics (Racing)' },
  { id: 'wheelchair_table_tennis', label: 'Wheelchair Table Tennis' },
  { id: 'para_cricket', label: 'Para-Cricket' },
];
export const IPC_CLASSES = [
  'T51','T52','T53','T54','T55','T56',
  'F40','F41','F42','F44','F46','F57','F58',
  'S1','S2','S3','S4','S5','S6','S7','S14',
  'B1','B2','B3',
  'WC1','WC2','WC3',
  'C1','C2','C3','C4','C5',
];
export const DISABILITY_TYPES = [
  'Spinal Cord Injury','Cerebral Palsy','Amputee',
  'Visual Impairment','Intellectual Disability',
  'Traumatic Brain Injury','Other',
];
export const SPORT_PILLAR_MAP: Record<string, string[]> = {
  wheelchair_basketball: ['P1','P2','P3','P4','P5','P6','P7','P8','P9','P10','P11','P12','P13','P14'],
  wheelchair_tennis:     ['P1','P2','P3','P4','P5','P6','P7','P8','P9','P10','P11','P12','P13','P14'],
  para_athletics:        ['P1','P2','P4','P5','P7','P8','P10','P11','P12','P13','P14'],
  wheelchair_table_tennis:['P3','P4','P5','P6','P7','P8','P9','P14'],
  para_cricket:          ['P4','P5','P6','P7','P8','P9','P14'],
};
