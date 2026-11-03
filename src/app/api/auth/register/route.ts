import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role = 'Analyst' } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!['Admin', 'Analyst'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either Admin or Analyst' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await query('SELECT user_id FROM app_user WHERE email = $1;', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password and insert
    const passwordHash = await hashPassword(password);
    const userRes = await query(
      `INSERT INTO app_user (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, name, email, role, created_at;`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, role]
    );

    const newUser = userRes.rows[0];

    // Create default watchlist for new user
    await query(
      `INSERT INTO watchlist (user_id, name) VALUES ($1, $2);`,
      [newUser.user_id, 'My Primary Watchlist']
    );

    const session = {
      userId: newUser.user_id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as 'Admin' | 'Analyst',
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
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('[Register API Error]:', error);
    return NextResponse.json(
      { error: 'Registration failed: ' + (error.message || 'Internal server error') },
      { status: 500 }
    );
  }
}
