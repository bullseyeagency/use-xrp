import { NextResponse } from 'next/server'
import { PRODUCTS } from '@/lib/products'

export async function GET() {
  return NextResponse.json({
    products: PRODUCTS,
    merchantAddress: process.env.NEXT_PUBLIC_MERCHANT_WALLET_ADDRESS || process.env.MERCHANT_WALLET_ADDRESS,
    network: 'mainnet',
  })
}
