import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const data = await req.json();
  // In a real app, you would save to a database here
  // For testing, just echo back the reservation
  return NextResponse.json({
    message: 'Reservation received',
    reservation: data,
    status: 'success',
  });
} 