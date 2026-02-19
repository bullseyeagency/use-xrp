import { Client, Wallet, dropsToXrp, xrpToDrops } from 'xrpl'

const MAINNET_URL = 'wss://xrplcluster.com'

export async function getClient(): Promise<Client> {
  const client = new Client(MAINNET_URL)
  await client.connect()
  return client
}

export async function getMerchantWalletInfo() {
  const address = process.env.MERCHANT_WALLET_ADDRESS
  if (!address) throw new Error('MERCHANT_WALLET_ADDRESS not set')

  const client = await getClient()
  try {
    const response = await client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'current',
    })
    return {
      address,
      balance: dropsToXrp(response.result.account_data.Balance),
      sequence: response.result.account_data.Sequence,
    }
  } finally {
    await client.disconnect()
  }
}

export async function verifyPayment(
  txHash: string,
  expectedDrops: number,
  destinationAddress: string
): Promise<{ verified: boolean; fromAddress?: string; drops?: number }> {
  const client = await getClient()
  try {
    const response = await client.request({
      command: 'tx',
      transaction: txHash,
    })

    const tx = response.result as any

    if (
      tx.TransactionType !== 'Payment' ||
      tx.Destination !== destinationAddress ||
      !tx.validated
    ) {
      return { verified: false }
    }

    const actualDrops = Number(tx.Amount)

    if (actualDrops < expectedDrops) {
      return { verified: false }
    }

    return {
      verified: true,
      fromAddress: tx.Account,
      drops: actualDrops,
    }
  } catch {
    return { verified: false }
  } finally {
    await client.disconnect()
  }
}

export async function generateWallet(): Promise<{ address: string; secret: string }> {
  const wallet = Wallet.generate()
  return {
    address: wallet.address,
    secret: wallet.seed!,
  }
}

export { dropsToXrp, xrpToDrops }
