import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get('days') || '1';
  
  const walletAddress = process.env.WALLET_ADDRESS;
  const apiUrl = process.env.WALLET_API_URL;

  if (!walletAddress || !apiUrl) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${apiUrl}?address=${walletAddress}&days=${days}`,
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch wallet data');
    }

    const data = await response.json();
    
return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    );
  }
}
