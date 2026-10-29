import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { listDistributorsDeliverySummary } from '@/lib/db';

async function checkAdminAuth(request: NextRequest): Promise<{ ok: true } | { error: string; status: number }> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return { error: 'Unauthorized: Authentication required', status: 401 };
  }
  const session = await verifySessionToken(token);
  if (!session) {
    return { error: 'Unauthorized: Invalid session', status: 401 };
  }
  if (session.role !== 'admin' && session.role !== 'zeesip_admin') {
    return { error: 'Forbidden: Admin privileges required', status: 403 };
  }
  return { ok: true };
}

export async function GET(request: NextRequest) {
  const auth = await checkAdminAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ? searchParams.get('search')?.slice(0, 100) : undefined;

    const distributors = await listDistributorsDeliverySummary(search);
    return NextResponse.json({ distributors });
  } catch (error) {
    const errMsg = (error as Error).message || 'Failed to list distributors';
    console.error('[ADMIN_LOCATIONS_GET_ERROR]', { message: errMsg });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
