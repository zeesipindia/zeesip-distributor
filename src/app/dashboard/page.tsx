import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/jwt';
import { Logo } from '@/components/ui/Logo';
import { LogOut, Package, ShoppingBag, Truck } from 'lucide-react';

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

  // If admin lands on /dashboard, redirect to admin
  if (session.role === 'admin') {
    redirect('/admin/users');
  }

  const roleLabel = session.role === 'distributor' ? 'Distributor' : 'Zee Sip staff';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Logo size="sm" />

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs font-medium text-black block">{session.name}</span>
              <span className="text-[11px] text-[#555555]">@{session.username}</span>
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium text-black bg-white border border-[#E5E5E5] hover:bg-neutral-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-[#555555]" />
                <span>Log out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Section */}
        <div className="border border-[#E5E5E5] rounded-[8px] p-6 mb-8">
          <div className="text-xs text-[#555555] mb-1">
            {roleLabel}
          </div>
          <h1 className="text-xl font-semibold text-black tracking-tight">
            Welcome, {session.name}
          </h1>
          <p className="mt-1 text-xs text-[#555555]">
            Signed in to the Zee Sip portal.
          </p>
        </div>

        {/* Modules Section */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-black">Modules</h2>
          <p className="text-xs text-[#555555]">
            Additional modules will be enabled in upcoming releases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E5E5E5] rounded-[8px] p-4">
            <div className="w-8 h-8 rounded-[6px] bg-neutral-100 flex items-center justify-center text-black mb-3">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-medium text-black">Orders</h3>
            <p className="mt-1 text-xs text-[#555555]">
              Browse catalog and place wholesale orders.
            </p>
            <div className="mt-3 pt-3 border-t border-[#E5E5E5]">
              <span className="text-[10px] text-[#555555]">
                Coming soon
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E5] rounded-[8px] p-4">
            <div className="w-8 h-8 rounded-[6px] bg-neutral-100 flex items-center justify-center text-black mb-3">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-medium text-black">Inventory</h3>
            <p className="mt-1 text-xs text-[#555555]">
              Check stock allocations and product listings.
            </p>
            <div className="mt-3 pt-3 border-t border-[#E5E5E5]">
              <span className="text-[10px] text-[#555555]">
                Coming soon
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E5] rounded-[8px] p-4">
            <div className="w-8 h-8 rounded-[6px] bg-neutral-100 flex items-center justify-center text-black mb-3">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-medium text-black">Shipments</h3>
            <p className="mt-1 text-xs text-[#555555]">
              Track deliveries and dispatch notes.
            </p>
            <div className="mt-3 pt-3 border-t border-[#E5E5E5]">
              <span className="text-[10px] text-[#555555]">
                Coming soon
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
