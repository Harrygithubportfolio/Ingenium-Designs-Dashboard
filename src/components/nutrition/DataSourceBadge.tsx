const STYLES: Record<string, { bg: string; text: string; label: string }> = {
  claude: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    label: 'AI',
  },
  usda: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    label: 'USDA',
  },
  'claude+usda': {
    bg: 'bg-gradient-to-r from-purple-500/15 to-emerald-500/15',
    text: 'text-blue-300',
    label: 'AI+USDA',
  },
  nutritionix: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    label: 'Nutritionix',
  },
};

export default function DataSourceBadge({
  source,
}: {
  source: string;
}) {
  const style = STYLES[source] ?? STYLES.claude;

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
