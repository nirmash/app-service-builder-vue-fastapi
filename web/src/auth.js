export const loginUrl = `/.auth/login/aad?${new URLSearchParams({
  post_login_redirect_uri: '/',
})}`

export const logoutUrl = `/.auth/logout?${new URLSearchParams({
  post_logout_redirect_uri: loginUrl,
})}`

export async function getSessionStatus(hostname, signal) {
  if (
    ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname) ||
    hostname.endsWith('.localhost')
  ) {
    return 'local'
  }

  const response = await fetch('/.auth/me', {
    signal,
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'error',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Authentication endpoint returned HTTP ${response.status}.`)
  }

  const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (contentType !== 'application/json') {
    throw new Error('The host did not return a Builder authentication response.')
  }

  const identities = await response.json()
  if (
    !Array.isArray(identities) ||
    identities.some((identity) =>
      !identity || typeof identity !== 'object' || Array.isArray(identity),
    )
  ) {
    throw new Error('The host returned an invalid Builder identity response.')
  }

  return identities.length ? 'signed-in' : 'signed-out'
}
