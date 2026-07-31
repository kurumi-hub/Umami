type Point = { label: string; value: number };

export default function MiniBarChart({
  data,
  colorClass = "bg-pink-400",
}: {
  data: Point[];
  colorClass?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div>
      <div className="flex items-end gap-[2px] h-[80px]">
        {data.map((d, i) => (
          <div
            key={i}
            title={`${d.label}: ${d.value}`}
            className={`flex-1 rounded-t-sm ${colorClass} transition-all`}
            style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10.5px] text-ink-soft">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
