import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { message } = await request.json();
  
  return NextResponse.json({
    response: `VERA received: "${message}". [Add API keys to enable AI]`,
    success: true
  });
}
