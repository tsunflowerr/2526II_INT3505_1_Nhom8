export type ApiErrorResponse = {
  code: string
  message: string
  details: Record<string, unknown>
}

export class ApiError extends Error {
  status: number
  body?: ApiErrorResponse

  constructor(status: number, message: string, body?: ApiErrorResponse) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export type TokenPair = {
  access_token: string
  refresh_token: string
  token_type: string
}

export type User = {
  id: string
  email: string | null
  full_name: string
  avatar_url: string | null
  provider: string
  role: string
  status: string
  created_at: string
  updated_at: string
}

export type RegisterPayload = {
  email: string
  password: string
  full_name: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type RefreshPayload = {
  refresh_token: string
}

export type UpdateMePayload = {
  full_name?: string
  avatar_url?: string | null
}

const PROFILE_KEY = 'ticketrush.mock.user.profile'

function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function roleFromEmail(email: string): 'admin' | 'customer' {
  return email.toLowerCase().includes('admin') ? 'admin' : 'customer'
}

function makeUser(email: string, role = roleFromEmail(email), fullName?: string): User {
  const stored = readStoredProfile()
  const now = new Date().toISOString()
  return {
    id: role === 'admin' ? 'demo-admin' : 'demo-customer',
    email,
    full_name: stored?.full_name ?? fullName ?? (role === 'admin' ? 'Avery Admin' : 'Taylor Customer'),
    avatar_url:
      stored?.avatar_url ??
      (role === 'admin'
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80'
        : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80'),
    provider: 'mock',
    role,
    status: 'active',
    created_at: now,
    updated_at: now,
  }
}

function readStoredProfile(): UpdateMePayload | null {
  const raw = window.localStorage.getItem(PROFILE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UpdateMePayload
  } catch {
    return null
  }
}

function tokenFor(email: string): TokenPair {
  const role = roleFromEmail(email)
  return {
    access_token: `mock-${role}:${encodeURIComponent(email)}`,
    refresh_token: `refresh-${role}`,
    token_type: 'Bearer',
  }
}

function emailFromToken(accessToken: string): string {
  const [, encoded] = accessToken.split(':')
  if (!encoded) return accessToken.includes('admin') ? 'admin@ticketrush.test' : 'guest@ticketrush.test'
  return decodeURIComponent(encoded)
}

export async function register(payload: RegisterPayload): Promise<TokenPair> {
  await delay()
  if (payload.password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters.', {
      code: 'PASSWORD_TOO_SHORT',
      message: 'Password must be at least 8 characters.',
      details: {},
    })
  }
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ full_name: payload.full_name }))
  return tokenFor(payload.email)
}

export async function login(payload: LoginPayload): Promise<TokenPair> {
  await delay()
  if (!payload.email || !payload.password) {
    throw new ApiError(400, 'Email and password are required.', {
      code: 'INVALID_CREDENTIALS',
      message: 'Email and password are required.',
      details: {},
    })
  }
  return tokenFor(payload.email)
}

export async function refresh(payload: RefreshPayload): Promise<TokenPair> {
  await delay()
  return tokenFor(payload.refresh_token.includes('admin') ? 'admin@ticketrush.test' : 'guest@ticketrush.test')
}

export async function logout(payload: RefreshPayload): Promise<void> {
  await delay(payload.refresh_token ? 80 : 80)
}

export async function getMe(accessToken: string): Promise<User> {
  await delay(120)
  const email = emailFromToken(accessToken)
  return makeUser(email)
}

export async function updateMe(accessToken: string, payload: UpdateMePayload): Promise<User> {
  await delay(160)
  const current = readStoredProfile() ?? {}
  const next = { ...current, ...payload }
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
  const email = emailFromToken(accessToken)
  return makeUser(email)
}

export async function getUser(accessToken: string, userId: string): Promise<User> {
  if (!userId) throw new ApiError(404, 'User was not found.')
  return getMe(accessToken)
}
