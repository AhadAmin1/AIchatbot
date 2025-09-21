import React, { useEffect, useState } from 'react'
import { dummyPublishedImages } from '../assets/assets'
import Loading from './Loading'
import { useAppcontext } from '../context/AppContext'
import toast from 'react-hot-toast'

const Community = () => {

  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)

  const { axios } = useAppcontext()

  const fetchImages = async () => {
    try {
      const { data } = await axios.get('/api/user/published-images')
      if (data.success) {
        setImages(data.images)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchImages()
  }, [])

  if (loading) return <Loading />

  return (
    <div className='p-6 pt-12 xl:p-12 2xl:p-20 w-full h-full mx-auto overflow-y-auto'>
      <h2 className='text-xl font-semibold mb-6 text-gray-800 dark:text-purple-100 '>Community</h2>

      {images.length > 0 ? (
        <div className='flex flex-wrap max-sm:justify-center gap-5'>
          {
            images.map((item, index) => (
              <a href={item.imageUrl} key={index} target='_blank' className='relative group block rounded-lg overflow-hidden border border-gray-200 dark:border-purple-700 shadow-sm hover:shadow-md transition-shadow duration-300' >
                <img src={item.imageUrl} className='w-full h-40 md:h-50 2xl:h-62 object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out' alt="" />
                <p className='absolute bottom-0 right-0 text-xs bg-black/50 backdrop-blur text-white px-4 py-1 rounded-tl-xl opacity-0 group-hover:opacity-100 transition duration-300'>Created By {item.userName}</p>
              </a>
            ))
          }
        </div>
      ) : (
        <p className='text-center text-gray-600 mt-10 dark:text-purple-200 '>No Image Available</p>
      )}

    </div>
  )
}

export default Community