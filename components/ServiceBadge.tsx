export default function ServiceBadge({
  status,
}: {
  status: 'ok' | 'soon' | 'overdue'
}) {
  const styles = {
    ok: 'bg-green-900/40 text-green-400 border border-green-800',
    soon: 'bg-orange-900/40 text-orange-400 border border-orange-800',
    overdue: 'bg-red-900/40 text-red-400 border border-red-800',
  }
  const labels = {
    ok: 'OK',
    soon: 'Bald fällig',
    overdue: 'Überfällig',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
