export const REGION_LABELS: Record<string, string> = {
  'region-1': 'Denver Metro',
  'region-2': 'region-2',
};

export const REGION_OPTIONS = Object.entries(REGION_LABELS).map(([value, label]) => ({
  value,
  label,
}));
