import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/jwt';
import { Logo } from '@/components/ui/Logo';
import { LogOut, Package, ShoppingBag, Truck, CheckCircle2, Shield } from 'lucide-react';

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

  const roleLabel = session.role === 'distributor' ? 'Authorized Distributor' : 'Zee Sip Staff';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo size="md" />

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-900">{session.name}</span>
              <span className="text-xs text-emerald-700 font-medium">@{session.username}</span>
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 transition-colors"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Log out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Hero Card */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 rounded-l-full pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 text-xs font-semibold mb-4">
              <Shield className="w-3.5 h-3.5 text-emerald-300" />
              <span>{roleLabel}</span>
              <span className="inline-block w-1 h-1 rounded-full bg-emerald-300"></span>
              <span className="flex items-center gap-1 text-emerald-100">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Active Account
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome, {session.name}
            </h1>
            <p className="mt-3 text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              You are signed in to the Zee Sip Partner & Distribution Network. Your distributor account
              is verified and ready for operations.
            </p>
          </div>
        </div>

        {/* Phase 2 Feature Previews */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Distribution Modules</h2>
          <p className="text-sm text-slate-500">
            Phase 1 is focused on authentication & user access. The following operations modules will be activated in upcoming phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Purchase Orders</h3>
              <p className="mt-1 text-sm text-slate-500">
                Browse catalogue, place wholesale orders, and view order receipts.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Coming in Phase 2
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-4">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Stock & Inventory</h3>
              <p className="mt-1 text-sm text-slate-500">
                Real-time batch allocations, warehouse availability, and SKU listings.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Coming in Phase 2
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Logistics & Shipments</h3>
              <p className="mt-1 text-sm text-slate-500">
                Track dispatched consignments, dispatch notes, and delivery confirmations.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Coming in Phase 2
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
