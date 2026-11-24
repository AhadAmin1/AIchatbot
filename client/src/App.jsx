import React, { useState } from 'react'
import Sidebar from './component/Sidebar.jsx'
import { Route, Routes, useLocation } from 'react-router-dom'
import ChatBox from './component/ChatBox.jsx'
import Credits from './pages/Credits.jsx'
import Community from './pages/Community.jsx'
import { assets } from './assets/assets.js'
import './assets/prism.css'
import Loading from './pages/Loading.jsx'
import { useAppcontext } from './context/AppContext.jsx'
import Login from './pages/Login.jsx'
import { Toaster } from 'react-hot-toast'

const App = () => {
  const { user, loadingUser } = useAppcontext()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            color: 'var(--text)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          },
        }}
      />
      {pathname === '/loading' || loadingUser ? <Loading /> : user ? (
        <div className="app-shell">
          <div className="app-layout">
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            {isMenuOpen && (
              <button
                type="button"
                className="sidebar-backdrop"
                aria-label="Close navigation menu"
                onClick={() => setIsMenuOpen(false)}
              />
            )}
            <main className="app-main">
              <button
                type="button"
                className="mobile-menu"
                aria-label="Open navigation menu"
                onClick={() => setIsMenuOpen(true)}
              >
                <img src={assets.menu_icon} alt="" />
              </button>
              <Routes>
                <Route path="/" element={<ChatBox />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="/community" element={<Community />} />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <Login />
      )}
    </>
  )
}

export default App