import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppcontext } from '../context/AppContext'
import toast from 'react-hot-toast'

const Loading = ({ message = 'Getting things ready...' }) => {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { axios, fetchUser, token } = useAppcontext()
  const tracker = new URLSearchParams(search).get('tracker')
  const isPaymentVerification = pathname === '/loading'

  useEffect(() => {
    if (!isPaymentVerification) return undefined

    let cancelled = false
    const checkPayment = async () => {
      if (!tracker) {
        navigate('/credits', { replace: true })
        return
      }

      try {
        for (let attempt = 0; attempt < 15; attempt++) {
          const { data } = await axios.get(`/api/credit/status/${encodeURIComponent(tracker)}`, {
            headers: { Authorization: token },
          })
          if (data.success && data.paid) {
            await fetchUser()
            if (!cancelled) navigate('/', { replace: true })
            return
          }
          if (attempt < 14) {
            await new Promise((resolve) => setTimeout(resolve, 2000))
          }
        }

        await fetchUser()
        if (!cancelled) {
          toast.error('Payment is still processing. Credits will appear after confirmation.')
          navigate('/credits', { replace: true })
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error.response?.data?.message || 'Could not verify the payment status.')
          navigate('/credits', { replace: true })
        }
      }
    }

    checkPayment()
    return () => {
      cancelled = true
    }
  }, [axios, fetchUser, isPaymentVerification, navigate, token, tracker])

  return (
    <main className="loading-screen" role="status" aria-live="polite">
      <div className="loading-mark" aria-hidden="true">✦</div>
      <span>{isPaymentVerification ? 'Confirming your payment...' : message}</span>
    </main>
  )
}

export default Loading
