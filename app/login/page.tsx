import { login, signup } from './actions'

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Ungültige Anmeldedaten.',
  'Email not confirmed': 'E-Mail-Adresse noch nicht bestätigt.',
  'User already registered': 'Diese E-Mail ist bereits registriert.',
  'Password should be at least 6 characters': 'Passwort muss mindestens 6 Zeichen haben.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorMessage = error
    ? (ERROR_MESSAGES[decodeURIComponent(error)] ?? 'Anmeldung fehlgeschlagen.')
    : undefined

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-[#ff6600] mb-2">MotoTrack</h1>
        <p className="text-[#888] mb-8 text-sm">Betriebsstunden & Service Tracker</p>

        {errorMessage && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {errorMessage}
          </div>
        )}

        <form className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="E-Mail"
            required
            className="bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ff6600]"
          />
          <input
            name="password"
            type="password"
            placeholder="Passwort"
            required
            minLength={6}
            className="bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ff6600]"
          />
          <button
            type="submit"
            formAction={login}
            className="bg-[#ff6600] text-black font-semibold rounded-lg py-3 text-sm mt-1"
          >
            Einloggen
          </button>
          <button
            type="submit"
            formAction={signup}
            className="bg-[#1a1a1a] border border-[#333] text-white rounded-lg py-3 text-sm"
          >
            Registrieren
          </button>
        </form>
      </div>
    </div>
  )
}
