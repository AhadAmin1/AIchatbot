import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppcontext } from '../context/AppContext'
import toast from 'react-hot-toast'

const Login = () => {
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const buttonContainerRef = useRef(null)
  const { axios, setToken } = useAppcontext()
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response?.credential) {
      toast.error('Google did not return a sign-in credential. Please try again.')
      return
    }

    setSubmitting(true)
    setAuthError('')
    try {
      const { data } = await axios.post('/api/user/google', { credential: response.credential })
      if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
      } else {
        toast.error(data.message || 'Could not sign in with Google.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setSubmitting(false)
    }
  }, [axios, setToken])

  useEffect(() => {
    if (!clientId) {
      setAuthError('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to the client environment.')
      return undefined
    }

    let cancelled = false
    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !buttonContainerRef.current) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
        auto_select: false,
      })
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        width: Math.min(352, buttonContainerRef.current.clientWidth || 320),
      })
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton()
      return () => {
        cancelled = true
      }
    }

    let script = document.querySelector('script[data-google-identity]')
    const onLoad = () => {
      script.dataset.loaded = 'true'
      renderGoogleButton()
    }
    const onError = () => {
      if (!cancelled) setAuthError('Could not load Google Sign-In. Check your connection and try again.')
    }

    if (!script) {
      script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.dataset.googleIdentity = 'true'
      script.addEventListener('load', onLoad)
      script.addEventListener('error', onError)
      document.head.appendChild(script)
    } else if (script.dataset.loaded === 'true') {
      renderGoogleButton()
    } else {
      script.addEventListener('load', onLoad)
      script.addEventListener('error', onError)
    }

    return () => {
      cancelled = true
      script.removeEventListener('load', onLoad)
      script.removeEventListener('error', onError)
    }
  }, [clientId, handleGoogleCredential])

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="login-brand">
          <div className="login-brand-mark" aria-hidden="true">✦</div>
          <div>
            <strong>QuickGPT</strong>
            <span>Your ideas, in motion</span>
          </div>
        </div>

        <div className="login-hero">
          <span className="page-eyebrow">A little more done, every day</span>
          <h1>Make room for <span>better ideas.</span></h1>
          <p>
            Chat, create, and explore with an AI assistant designed to help you move from
            a first thought to your next great thing.
          </p>
          <div className="login-feature-list" aria-label="QuickGPT features">
            <span>Thoughtful answers</span>
            <span>Creative image tools</span>
            <span>Your ideas, all in one place</span>
          </div>
        </div>

        <div className="login-footer">Simple tools for curious minds.</div>
      </section>

      <section className="login-form-wrap">
        <div className="login-card">
          <span className="page-eyebrow">Secure access</span>
          <h2>Sign in with Google</h2>
          <p className="login-card-intro">
            Use a Google account with a verified email address to continue to QuickGPT.
          </p>

          <div
            ref={buttonContainerRef}
            className={`google-login-button ${submitting ? 'google-login-button-busy' : ''}`}
            aria-label="Continue with Google"
          />
          {submitting && <p className="login-auth-status">Verifying your Google account...</p>}
          {authError && <p className="login-auth-error" role="alert">{authError}</p>}
          <p className="login-auth-note">
            New users are added after Google verifies their account. Existing accounts with the same verified email are linked automatically.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Login
