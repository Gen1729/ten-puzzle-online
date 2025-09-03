import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ message: 'WebSocket endpoint. Use socket.io client to connect.' });
}

export async function POST() {
  return NextResponse.json({ message: 'WebSocket endpoint. Use socket.io client to connect.' });
}
