import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const STATE_KEY = 'pool-hall-pos:state';

export async function GET() {
  try {
    const data = await kv.get(STATE_KEY);
    if (!data) {
      const initial = {
        tables: [],
        sessions: [],
        retailItems: [],
        retailSales: [],
        hourlyRate: 15,
        updatedAt: Date.now(),
      };
      return NextResponse.json(initial);
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('KV GET error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await kv.set(STATE_KEY, body, { ex: 60 * 60 * 24 * 365 }); // 1 year TTL
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('KV POST error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
