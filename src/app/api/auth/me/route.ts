import { NextResponse } from 'next/server';
import { getAuthUser, ensureDemoUsersExist } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await ensureDemoUsersExist();
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}
