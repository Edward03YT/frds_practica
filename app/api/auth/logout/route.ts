import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Creezi un răspuns care șterge cookie-ul
  const response = NextResponse.json({
    success: true,
    message: 'Deconectare reușită'
  });

  // Ștergi cookie-ul authToken (pui maxAge 0)
  response.cookies.set('authToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}