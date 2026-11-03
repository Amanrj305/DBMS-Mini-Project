import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_dbms_level3';
const TOKEN_COOKIE_NAME = 'marketguard_token';

export interface UserSession {
  userId: number;
  email: string;
  name: string;
  role: 'Admin' | 'Analyst';
}

/**
 * Hashes a plaintext password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares plaintext password against stored hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Issues signed JWT session token valid for 7 days
 */
export function createToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies JWT token and decodes user session payload
 */
export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the authenticated user from Request headers or cookies
 */
export async function getAuthUser(req?: Request): Promise<UserSession | null> {
  let token: string | null = null;

  // 1. Check Authorization header: Bearer <token>
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // 2. Check HTTP-only cookie if no header token
  if (!token) {
    try {
      const cookieStore = cookies();
      const cookieToken = cookieStore.get(TOKEN_COOKIE_NAME);
      if (cookieToken) {
        token = cookieToken.value;
      }
    } catch {
      // cookies() may throw outside Next.js request context
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

/**
 * Ensures demo users exist in app_user for quick evaluator testing
 */
export async function ensureDemoUsersExist(): Promise<void> {
  try {
    const adminCheck = await query('SELECT user_id FROM app_user WHERE email = $1;', ['admin@pes.edu']);
    if (adminCheck.rows.length === 0) {
      const adminHash = await hashPassword('admin123');
      const res = await query(
        `INSERT INTO app_user (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id;`,
        ['Amrit Raj (Admin)', 'admin@pes.edu', adminHash, 'Admin']
      );
      const adminId = res.rows[0].user_id;

      // Create default watchlist with AAPL, NVDA, TSLA
      const wlRes = await query(
        `INSERT INTO watchlist (user_id, name) VALUES ($1, $2) RETURNING watchlist_id;`,
        [adminId, 'Tech & AI Watchlist']
      );
      const wlId = wlRes.rows[0].watchlist_id;

      await query(
        `INSERT INTO watchlist_item (watchlist_id, stock_id)
         SELECT $1, stock_id FROM stock WHERE ticker IN ('AAPL', 'NVDA', 'TSLA')
         ON CONFLICT DO NOTHING;`,
        [wlId]
      );
    }

    const analystCheck = await query('SELECT user_id FROM app_user WHERE email = $1;', ['analyst@pes.edu']);
    if (analystCheck.rows.length === 0) {
      const analystHash = await hashPassword('analyst123');
      const res = await query(
        `INSERT INTO app_user (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id;`,
        ['Market Analyst', 'analyst@pes.edu', analystHash, 'Analyst']
      );
      const analystId = res.rows[0].user_id;

      // Create default watchlist with JPM, BAC, RELIANCE
      const wlRes = await query(
        `INSERT INTO watchlist (user_id, name) VALUES ($1, $2) RETURNING watchlist_id;`,
        [analystId, 'Financials & Energy Watchlist']
      );
      const wlId = wlRes.rows[0].watchlist_id;

      await query(
        `INSERT INTO watchlist_item (watchlist_id, stock_id)
         SELECT $1, stock_id FROM stock WHERE ticker IN ('JPM', 'BAC', 'RELIANCE')
         ON CONFLICT DO NOTHING;`,
        [wlId]
      );
    }
  } catch (error) {
    console.error('[Auth] Failed to seed demo users:', error);
  }
}
