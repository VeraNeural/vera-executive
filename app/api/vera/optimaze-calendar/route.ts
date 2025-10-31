import { NextRequest, NextResponse } from 'next/server';

// Deprecated route: redirect to /api/vera/optimize-calendar
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    return new NextResponse(body, {
      status: 308,
      headers: {
        'Location': '/api/vera/optimize-calendar',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return NextResponse.json({ events: [], recommendations: [], message: 'Use /api/vera/optimize-calendar' }, { status: 308 });
  }
}

export async function GET() {
  return NextResponse.json({
    deprecated: true,
    redirect: '/api/vera/optimize-calendar'
  }, { status: 308 });
}