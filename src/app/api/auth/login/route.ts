import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, createToken, ensureDemoUsersExist } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Ensure demo users exist if testing fresh instance
    await ensureDemoUsersExist();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const res = await query(
      `SELECT user_id, name, email, password_hash, role, is_active
       FROM app_user 
       WHERE LOWER(email) = LOWER($1);`,
      [email.trim()]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = res.rows[0];

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const session = {
      userId: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role as 'Admin' | 'Analyst',
    };

    const token = createToken(session);

    const response = NextResponse.json({
      success: true,
      user: session,
      token,
    });

    response.cookies.set({
      name: 'marketguard_token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('[Login API Error]:', error);
    return NextResponse.json(
      { error: 'Login failed: ' + (error.message || 'Internal server error') },
      { status: 500 }
    );
  }
}
