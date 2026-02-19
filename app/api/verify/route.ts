import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment } from '@/lib/xrpl'
import { generateConversation } from '@/lib/anthropic'
import { getProductById } from '@/lib/products'

export async function POST(req: NextRequest) {
  try {
    const { txHash, productId } = await req.json()

    if (!txHash || !productId) {
      return NextResponse.json({ error: 'txHash and productId required' }, { status: 400 })
    }

    const product = getProductById(productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    if (!merchantAddress) {
      return NextResponse.json({ error: 'Merchant wallet not configured' }, { status: 500 })
    }

    const payment = await verifyPayment(txHash, product.drops, merchantAddress)

    if (!payment.verified) {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 402 })
    }

    const content = await generateConversation(product.prompt)

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
      },
      payment: {
        txHash,
        fromAddress: payment.fromAddress,
        drops: payment.drops,
      },
      output: content,
    })
  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
