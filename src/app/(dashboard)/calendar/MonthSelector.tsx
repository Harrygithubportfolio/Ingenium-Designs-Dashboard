'use client';

interface Props {
  month: number;
  year: number;
  onChange: (month: number, year: number, direction: number) => void;
}

export default function MonthSelector({ month, year, onChange }: Props) {
  const prev = () => {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    onChange(newMonth, newYear, -1);
  };

  const next = () => {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    onChange(newMonth, newYear, 1);
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <button onClick={prev} className="text-gray-300 hover:text-white">← Prev</button>
      <h3 className="text-lg font-semibold text-white">
        {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
      </h3>
      <button onClick={next} className="text-gray-300 hover:text-white">Next →</button>
    </div>
  );
}