import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session || (session.role !== 'admin' && session.role !== 'zeesip_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
