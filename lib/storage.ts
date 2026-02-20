import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true })
}

export async function readStore<T>(filename: string): Promise<T[]> {
  await ensureDir()
  const filePath = path.join(DATA_DIR, filename)
  try {
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T[]
  } catch {
    return []
  }
}

export async function writeStore<T>(filename: string, data: T[]): Promise<void> {
  await ensureDir()
  const filePath = path.join(DATA_DIR, filename)
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function appendStore<T>(filename: string, record: T): Promise<void> {
  const existing = await readStore<T>(filename)
  existing.push(record)
  await writeStore(filename, existing)
}

export async function updateStore<T extends { id: string }>(
  filename: string,
  id: string,
  updater: (record: T) => T
): Promise<T | null> {
  const existing = await readStore<T>(filename)
  const index = existing.findIndex((r) => r.id === id)
  if (index === -1) return null
  existing[index] = updater(existing[index])
  await writeStore(filename, existing)
  return existing[index]
}
