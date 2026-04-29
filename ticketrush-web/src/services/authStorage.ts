import type { TokenPair } from './userApi'

const STORAGE_KEY = 'ticketrush.tokens'

type SaveOptions = {
  persist?: boolean
}

function read(storage: Storage): TokenPair | null {
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as TokenPair
  } catch {
    return null
  }
}

export function loadTokens(): TokenPair | null {
  return read(localStorage) ?? read(sessionStorage)
}

export function saveTokens(tokens: TokenPair, options: SaveOptions = {}): void {
  const persist = options.persist ?? true
  const storage = persist ? localStorage : sessionStorage
  storage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
}
