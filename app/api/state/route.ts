import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const statePath = path.join(dataDir, 'state.json');
let writeLock = false;

async function ensureDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function GET() {
  try {
    await ensureDir();
    try {
      const contents = await fs.readFile(statePath, 'utf8');
      return NextResponse.json(JSON.parse(contents));
    } catch (e) {
      // file doesn't exist yet - return default shape
      const initial = {
        tables: [],
        sessions: [],
        retailItems: [],
        retailSales: [],
        hourlyRate: 15,
        updatedAt: Date.now(),
      };
      await fs.writeFile(statePath, JSON.stringify(initial, null, 2));
      return NextResponse.json(initial);
    }
  } catch (err) {
    console.error('GET /api/state error', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await ensureDir();

    const tmp = statePath + '.tmp';

    // simple in-process lock
    while (writeLock) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 50));
    }
    writeLock = true;

    try {
      await fs.writeFile(tmp, JSON.stringify(body, null, 2), 'utf8');
      await fs.rename(tmp, statePath);
      writeLock = false;
      return NextResponse.json({ ok: true });
    } catch (e) {
      writeLock = false;
      console.error('POST /api/state write error', e);
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
  } catch (err) {
    console.error('POST /api/state error', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
