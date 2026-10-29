import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/jwt';
import { findUserById } from '@/lib/db';
import { Logo } from '@/components/ui/Logo';
import { LogOut, MapPin, ChevronRight } from 'lucide-react';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/');
  }

  const session = await verifySessionToken(token);
  if (!session) {
    redirect('/');
  }

  // If admin lands on /dashboard, redirect to admin dashboard
  if (session.role === 'admin' || session.role === 'zeesip_admin') {
    redirect('/admin/dashboard');
  }

  // Re-verify that user is active in DB
  const user = await findUserById(session.userId);
  if (!user || !user.is_active) {
    redirect('/api/auth/logout');
  }

  const isDistributor = session.role === 'distributor';
  const roleLabel = isDistributor ? 'Distributor' : 'Zee Sip staff';

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size="sm" />

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-medium text-black block truncate max-w-[130px] sm:max-w-none">
                {user.name}
              </span>
              <span className="text-[11px] text-[#555555] block">{roleLabel}</span>
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-xs font-medium text-black bg-white border border-[#E5E5E5] hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-3.5 h-3.5 text-[#555555]" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        {/* Welcome Card */}
        <div className="border border-[#E5E5E5] rounded-[8px] p-5 sm:p-6 mb-6">
          <div className="text-xs text-[#555555] mb-1 font-medium">{roleLabel}</div>
          <h1 className="text-xl sm:text-2xl font-semibold text-black tracking-tight">
            Welcome, {user.name}
          </h1>
          <p className="mt-1 text-xs text-[#555555]">
            Signed in to the Zee Sip portal.
          </p>
        </div>

        {/* Distributor Module Card */}
        {isDistributor && (
          <div className="space-y-3">
            <Link
              href="/dashboard/locations"
              className="group block border border-[#E5E5E5] rounded-[8px] p-4 sm:p-5 hover:border-black active:bg-neutral-50 transition-all min-h-[44px]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-[8px] bg-neutral-100 flex items-center justify-center text-black shrink-0">
                    <MapPin className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-black group-hover:underline">
                      Delivered Locations
                    </h2>
                    <p className="text-xs text-[#555555] mt-0.5">
                      Record where you delivered
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#737373] group-hover:text-black transition-colors shrink-0" />
              </div>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
