import { NextResponse } from 'next/server'
import { getMerchantWalletInfo } from '@/lib/xrpl'

export async function GET() {
  try {
    const info = await getMerchantWalletInfo()
    return NextResponse.json(info)
  } catch (err) {
    return NextResponse.json({ error: 'Wallet not configured or unreachable' }, { status: 503 })
  }
}
