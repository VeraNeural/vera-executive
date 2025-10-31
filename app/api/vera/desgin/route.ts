import { NextRequest, NextResponse } from 'next/server';

// Deprecated route: redirect to /api/vera/design
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    return new NextResponse(body, {
      status: 308,
      headers: {
        'Location': '/api/vera/design',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Use /api/vera/design' }, { status: 308 });
  }
}

export async function GET() {
  return NextResponse.json({
    deprecated: true,
    redirect: '/api/vera/design'
  }, { status: 308 });
}