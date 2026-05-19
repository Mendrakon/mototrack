import type { HourSession } from './GarageDashboardClient'

interface Props {
  sessions: HourSession[]
}

export default function SessionHistory({ sessions }: Props) {
  return (
    <div className="bg-[#111] rounded-xl p-5 flex flex-col gap-4 flex-1 min-h-0">
      <p className="text-[#555] text-sm font-medium uppercase tracking-wider shrink-0">Letzte Meldungen</p>

      {sessions.length === 0 ? (
        <p className="text-[#444] text-sm">Noch keine Daten</p>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto min-h-0">
          {sessions.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center justify-between py-2 ${i < sessions.length - 1 ? 'border-b border-[#1d1d1d]' : ''}`}
            >
              <div>
                <p className="text-white text-base font-medium">
                  {s.hours_reported.toFixed(2)} h
                </p>
                <p className="text-[#555] text-xs">
                  {new Date(s.reported_at).toLocaleString('de-AT', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#444] text-sm">Max Temp</p>
                <p className="text-[#555] text-sm">—</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
