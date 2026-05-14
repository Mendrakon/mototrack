import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { count: bikeCount } = await supabase
    .from('bikes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-6">Konto</h1>

      <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4 flex flex-col gap-3">
        <div>
          <p className="text-xs text-[#888] mb-0.5">E-Mail</p>
          <p className="text-white text-sm">{user.email}</p>
        </div>
        <div>
          <p className="text-xs text-[#888] mb-0.5">Bikes</p>
          <p className="text-white text-sm">{bikeCount ?? 0}</p>
        </div>
      </div>

      <LogoutButton />
    </main>
  )
}
