import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.status && data.data.status === 'success') {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: data.message });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Verification failed' }, { status: 500 });
  }
}