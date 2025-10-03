import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { NextResponse } from 'next/server';
import { generateAndSend2FACode } from '@/lib/auth/two-factor';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { method, email, phone } = await request.json();
    
    if (!method || (method === 'email' && !email) || (method === 'sms' && !phone)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await generateAndSend2FACode({
      userId: session.user.id,
      method,
      email,
      phone,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('Error sending 2FA code:', error);
    return NextResponse.json({ error: 'Failed to send 2FA code' }, { status: 500 });
  }
} 