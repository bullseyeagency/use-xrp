export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { readStore, writeStore, appendStore } from '@/lib/storage'
import { ReferralCode, ReferralCredit } from '@/lib/types/referral'

const DROPS_PER_REFERRAL = 1

export async function POST(req: NextRequest) {
  // Internal route only
  const internalHeader = req.headers.get('x-internal-call')
  if (internalHeader !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const { referralCode, referredAddress, creditTxHash } = await req.json()

    if (!referralCode || !referredAddress || !creditTxHash) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const referrals = await readStore<ReferralCode>('referrals.json')
    const referral = referrals.find((r) => r.code === referralCode)

    if (!referral) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 })
    }

    if (referral.referredAddresses.includes(referredAddress)) {
      return NextResponse.json({ error: 'Address already credited' }, { status: 409 })
    }

    // Update referral record
    const updated = referrals.map((r) =>
      r.code === referralCode
        ? {
            ...r,
            totalEarned: r.totalEarned + DROPS_PER_REFERRAL,
            referredAddresses: [...r.referredAddresses, referredAddress],
          }
        : r
    )
    await writeStore('referrals.json', updated)

    const credit: ReferralCredit = {
      id: randomUUID(),
      referralCode,
      referredAddress,
      creditTxHash,
      dropsEarned: DROPS_PER_REFERRAL,
      creditedAt: Date.now(),
    }

    await appendStore('credits.json', credit)

    return NextResponse.json({ success: true, dropsEarned: DROPS_PER_REFERRAL })
  } catch (err) {
    console.error('Referral credit error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
