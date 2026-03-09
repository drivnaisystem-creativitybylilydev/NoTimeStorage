import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  const filePath = join(process.cwd(), 'public', '.well-known', 'apple-developer-merchantid-domain-association');
  const fileContents = readFileSync(filePath);
  return new NextResponse(fileContents, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="apple-developer-merchantid-domain-association"',
    },
  });
}
