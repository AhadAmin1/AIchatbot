import { useCallback, useEffect, useState } from 'react'
import Loading from './Loading'
import { useAppcontext } from '../context/AppContext'
import toast from 'react-hot-toast'

const Community = () => {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const { axios, navigate } = useAppcontext()

  const fetchImages = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/user/published-images')
      if (data.success) {
        setImages(data.images)
      } else {
        toast.error(data.message || 'Could not load community images.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }, [axios])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  if (loading) return <Loading message="Loading the community gallery..." />

  return (
    <main className="page-shell">
      <header className="page-heading">
        <div>
          <span className="page-eyebrow">Made with QuickGPT</span>
          <h1>Community gallery</h1>
          <p>Discover images shared by the community and find inspiration for your next creation.</p>
        </div>
      </header>

      {images.length > 0 ? (
        <section className="community-grid" aria-label="Community images">
          {images.map((item, index) => (
            <a
              href={item.imageUrl}
              key={item._id || `${item.imageUrl}-${index}`}
              target="_blank"
              rel="noreferrer"
              className="community-card"
              aria-label={`View image created by ${item.userName || 'a community member'}`}
            >
              <img src={item.imageUrl} alt={`AI image shared by ${item.userName || 'a community member'}`} loading="lazy" />
              <span className="community-card-caption">
                Created by {item.userName || 'a community member'}
              </span>
            </a>
          ))}
        </section>
      ) : (
        <div className="page-empty">
          <span className="page-empty-mark" aria-hidden="true">✦</span>
          <h2>The gallery is ready for its first creation</h2>
          <p>Generate an image in a chat and share it with the community.</p>
          <button type="button" className="plan-buy community-empty-action" onClick={() => navigate('/')}>
            Start creating
          </button>
        </div>
      )}
    </main>
  )
}

export default Community
