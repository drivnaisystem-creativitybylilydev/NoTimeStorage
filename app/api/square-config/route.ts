import { NextResponse } from 'next/server';

export async function GET() {
  const isSandbox = process.env.SQUARE_ENV !== 'production';
  const applicationId = isSandbox
    ? process.env.SQUARE_SANDBOX_APPLICATION_ID
    : process.env.SQUARE_APPLICATION_ID;
  const locationId = isSandbox
    ? process.env.SQUARE_SANDBOX_LOCATION_ID
    : process.env.SQUARE_LOCATION_ID;

  if (!applicationId || !locationId) {
    return NextResponse.json({ error: 'Square not configured.' }, { status: 500 });
  }

  return NextResponse.json({ applicationId, locationId, isSandbox });
}
