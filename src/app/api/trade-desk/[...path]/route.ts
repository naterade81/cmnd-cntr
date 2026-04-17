import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, AuthError } from '@/lib/auth';
import { proxyRequest } from '@/lib/trade-desk';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { path } = await params;
    const apiPath = '/api/' + path.join('/');
    const body = req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.json().catch(() => undefined)
      : undefined;

    return proxyRequest(apiPath, req.method, body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
