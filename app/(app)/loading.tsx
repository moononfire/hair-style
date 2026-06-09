export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-md bg-muted" />
          <div className="h-4 w-24 rounded-md bg-muted" />
        </div>
        <div className="h-9 w-32 rounded-md bg-muted" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
