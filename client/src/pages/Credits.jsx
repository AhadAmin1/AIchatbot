import { useCallback, useEffect, useState } from 'react'
import Loading from './Loading'
import { useAppcontext } from '../context/AppContext'
import { assets } from '../assets/assets'
import toast from 'react-hot-toast'

const Credits = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [paymentsEnabled, setPaymentsEnabled] = useState(false)
  const [purchasingPlan, setPurchasingPlan] = useState(null)
  const { token, axios, user } = useAppcontext()

  const fetchPlans = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/credit/plan', { headers: { Authorization: token } })
      if (data.success) {
        setPlans(data.plans)
        setPaymentsEnabled(data.paymentsEnabled === true)
      } else {
        toast.error(data.message || 'Failed to load plans.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }, [axios, token])

  const purchasePlan = async (planId) => {
    setPurchasingPlan(planId)
    try {
      const { data } = await axios.post(
        '/api/credit/purchase',
        { planId },
        { headers: { Authorization: token } },
      )
      if (data.success) {
        window.location.href = data.url
      } else {
        toast.error(data.message || 'Could not start checkout.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setPurchasingPlan(null)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  if (loading) return <Loading message="Loading credit plans..." />

  return (
    <main className="page-shell">
      <header className="page-heading">
        <div>
          <span className="page-eyebrow">Credits and plans</span>
          <h1>Keep your ideas flowing.</h1>
          <p>
            {user?.unlimitedCredits
              ? 'Enjoy unlimited chats and image generation while payments are unavailable.'
              : 'Choose a credit pack for chats and image generation. Your balance updates after payment is confirmed.'}
          </p>
        </div>
        <div className="balance-card">
          <div className="balance-icon">
            <img src={assets.diamond_icon} alt="" />
          </div>
          <div>
            <span>Available credits</span>
            <strong>{user?.unlimitedCredits ? 'Unlimited' : user?.credits ?? 0}</strong>
          </div>
        </div>
      </header>

      {!paymentsEnabled && (
        <div className="payment-coming-soon" role="status">
          <span className="payment-coming-soon-icon" aria-hidden="true">◇</span>
          <div>
            <strong>Payments coming soon</strong>
            <p>Credit purchases will be available once payment processing is ready.</p>
          </div>
        </div>
      )}

      {plans.length > 0 ? (
        <section className="plan-grid" aria-label="Available credit plans">
          {plans.map((plan) => {
            const featured = plan._id === 'pro'
            return (
              <article key={plan._id} className={`plan-card ${featured ? 'plan-card-featured' : ''}`}>
                {featured && <span className="plan-badge">Most popular</span>}
                <h2 className="plan-name">{plan.name}</h2>
                <p className="plan-description">
                  {featured ? 'A little more room for your best work.' : 'A flexible boost for your next ideas.'}
                </p>
                <div className="plan-price">
                  <strong>${plan.price}</strong>
                  <span>USD</span>
                </div>
                <div className="plan-credit-summary">{plan.credits} credits included</div>
                <ul className="plan-features">
                  {(plan.features || []).map((feature, index) => (
                    <li key={`${plan._id}-${index}`}>{feature}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="plan-buy"
                  disabled={!paymentsEnabled || purchasingPlan !== null}
                  onClick={() => purchasePlan(plan._id)}
                >
                  {purchasingPlan === plan._id
                    ? 'Opening secure checkout...'
                    : paymentsEnabled
                      ? 'Choose this plan'
                      : 'Payments coming soon'}
                </button>
              </article>
            )
          })}
        </section>
      ) : (
        <div className="page-empty">
          <span className="page-empty-mark" aria-hidden="true">◇</span>
          <h2>No plans available right now</h2>
          <p>Please check back in a little while.</p>
        </div>
      )}
    </main>
  )
}

export default Credits
