import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const STATE_KEY = 'pool-hall-pos:state';
const SESSIONS_KEY = 'pool-hall-pos:sessions';
const ORDERS_KEY = 'pool-hall-pos:orders';
const RETAIL_SALES_KEY = 'pool-hall-pos:retailSales';

// TTL for sessions and orders: 100 days  
const TEMP_DATA_TTL = 60 * 60 * 24 * 100;
// TTL for persistent data: 10 years
const PERSISTENT_TTL = 60 * 60 * 24 * 365 * 10;

interface PersistentData {
  tables: any[];
  retailItems: any[];
  hourlyRate: number;
  updatedAt: number;
}

export async function GET() {
  try {
    // Get persistent data
    const persistentData = (await kv.get(STATE_KEY)) as PersistentData | null;
    const sessionsData = (await kv.get(SESSIONS_KEY)) as any[] | null;
    const ordersData = (await kv.get(ORDERS_KEY)) as any[] | null;
    const retailSalesData = (await kv.get(RETAIL_SALES_KEY)) as any[] | null;

    const initial = {
      tables: persistentData?.tables || [],
      sessions: sessionsData || [],
      retailItems: persistentData?.retailItems || [],
      retailSales: retailSalesData || [],
      orders: ordersData || [],
      hourlyRate: persistentData?.hourlyRate || 15,
      updatedAt: Date.now(),
    };
    return NextResponse.json(initial);
  } catch (err) {
    console.error('KV GET error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Store persistent data separately from temporary data
    const persistentData = {
      tables: body.tables,
      retailItems: body.retailItems,
      hourlyRate: body.hourlyRate,
      updatedAt: Date.now(),
    };

    // Store data with appropriate TTLs
    await Promise.all([
      kv.set(STATE_KEY, persistentData, { ex: PERSISTENT_TTL }),
      kv.set(SESSIONS_KEY, body.sessions, { ex: TEMP_DATA_TTL }),
      kv.set(ORDERS_KEY, body.orders, { ex: TEMP_DATA_TTL }),
      kv.set(RETAIL_SALES_KEY, body.retailSales, { ex: TEMP_DATA_TTL }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('KV POST error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
