import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/db';

interface ForgotPasswordRequest {
  username: string;
  email: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json();
    const { username, email } = body;

    // Validate input
    if (!username || !email) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Username și email sunt obligatorii' 
        },
        { status: 400 }
      );
    }

    // Get database connection
    const db = getDb();
    
    // Find user by username AND email (both must match)
    const user = db.prepare(`
      SELECT id, name, email 
      FROM users 
      WHERE name = ? AND email = ?
    `).get(username, email) as User | undefined;

    if (!user) {
      // For security, always return success even if user not found
      return NextResponse.json({
        success: true,
        message: 'Dacă datele sunt corecte, veți primi un email cu instrucțiuni pentru resetarea parolei.'
      });
    }

    // Generate password reset token
    const resetToken = `reset_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // For development - log the token
    console.log(`Password reset token for user ${user.name}: ${resetToken}`);

    return NextResponse.json({
      success: true,
      message: 'Dacă datele sunt corecte, veți primi un email cu instrucțiuni pentru resetarea parolei.',
      // Remove this in production
      developmentToken: resetToken
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Eroare la procesarea cererii' 
      },
      { status: 500 }
    );
  }
}