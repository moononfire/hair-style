const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending:   { label: "Oczekuje",     classes: "bg-gray-100 text-gray-700" },
  confirmed: { label: "Potwierdzona", classes: "bg-blue-100 text-blue-700" },
  arrived:   { label: "Przybyła",     classes: "bg-green-100 text-green-700" },
  no_show:   { label: "Nieobecność",  classes: "bg-red-100 text-red-700" },
  cancelled: { label: "Anulowana",    classes: "bg-gray-100 text-gray-400 line-through" },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, classes: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}
