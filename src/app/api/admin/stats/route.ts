import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
  }

  // Logged-in user lacks admin role -> return 403 Forbidden
  if (session.role !== 'admin' && session.role !== 'zeesip_admin') {
    return NextResponse.json({ error: 'Forbidden: Admin privileges required' }, { status: 403 });
  }

  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ stats });
  } catch (error) {
    const errMsg = (error as Error).message || 'Failed to fetch statistics';
    console.error('[ADMIN_STATS_API_ERROR]', { message: errMsg });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
