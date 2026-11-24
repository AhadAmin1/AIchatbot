import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import moment from 'moment'
import toast from 'react-hot-toast'
import { assets } from '../assets/assets'
import { useAppcontext } from '../context/AppContext'

const Sidebar = ({ isMenuOpen, setIsMenuOpen }) => {
    const {
        chats,
        selectedChat,
        setSelectedChat,
        theme,
        setTheme,
        user,
        navigate,
        createNewChat,
        axios,
        setChats,
        fetchUsersChats,
        setToken,
        token,
    } = useAppcontext()
    const [search, setSearch] = useState('')
    const { pathname } = useLocation()

    const closeMenu = () => setIsMenuOpen(false)

    const handleNewChat = () => {
        createNewChat()
        closeMenu()
    }

    const openChat = (chat) => {
        navigate('/')
        setSelectedChat(chat)
        closeMenu()
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        toast.success('Logged out successfully')
    }

    const deleteChat = async (event, chatId) => {
        event.stopPropagation()
        if (!window.confirm('Are you sure you want to delete this chat?')) return

        try {
            const { data } = await axios.post(
                '/api/chat/delete',
                { chatId },
                { headers: { Authorization: token } },
            )
            if (data.success) {
                setChats((previousChats) => previousChats.filter((chat) => chat._id !== chatId))
                await fetchUsersChats()
                toast.success(data.message)
            } else {
                toast.error(data.message || 'Could not delete this chat.')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const filteredChats = chats.filter((chat) => {
        const title = chat.messages?.[0]?.content || chat.name || ''
        return title.toLowerCase().includes(search.trim().toLowerCase())
    })

    return (
        <aside className={`sidebar ${isMenuOpen ? 'sidebar-open' : ''}`} aria-label="Main navigation">
            <div className="sidebar-brand">
                <img
                    src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
                    alt="QuickGPT"
                />
                <button
                    type="button"
                    className="sidebar-close"
                    aria-label="Close navigation menu"
                    onClick={closeMenu}
                >
                    ×
                </button>
            </div>

            <button type="button" className="sidebar-new-chat" onClick={handleNewChat}>
                <span aria-hidden="true">+</span>
                New chat
            </button>

            <label className="sidebar-search">
                <img src={assets.search_icon} alt="" />
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search conversations"
                    aria-label="Search conversations"
                />
            </label>

            <p className="sidebar-section-label">Recent chats</p>
            <div className="sidebar-chat-list">
                {filteredChats.map((chat) => {
                    const title = chat.messages?.[0]?.content || chat.name || 'New chat'
                    return (
                        <div
                            key={chat._id}
                            className={`sidebar-chat ${chat._id === selectedChat?._id ? 'sidebar-chat-active' : ''}`}
                        >
                            <button
                                type="button"
                                className="sidebar-chat-open"
                                onClick={() => openChat(chat)}
                            >
                                <span className="sidebar-chat-copy">
                                    <span className="sidebar-chat-title">{title}</span>
                                    <span className="sidebar-chat-time">
                                        {chat.updatedAt ? moment(chat.updatedAt).fromNow() : 'Recently'}
                                    </span>
                                </span>
                            </button>
                            <button
                                type="button"
                                className="sidebar-chat-delete"
                                aria-label={`Delete ${title}`}
                                onClick={(event) => void deleteChat(event, chat._id)}
                            >
                                <img src={assets.bin_icon} alt="" />
                            </button>
                        </div>
                    )
                })}
                {filteredChats.length === 0 && (
                    <div className="sidebar-empty">
                        {search ? 'No matching conversations.' : 'Your conversations will appear here.'}
                    </div>
                )}
            </div>

            <div className="sidebar-actions">
                <button
                    type="button"
                    className={`sidebar-action ${pathname === '/community' ? 'sidebar-action-active' : ''}`}
                    onClick={() => {
                        navigate('/community')
                        closeMenu()
                    }}
                >
                    <img src={assets.gallery_icon} alt="" />
                    <span className="sidebar-action-label">Community gallery</span>
                </button>
                <button
                    type="button"
                    className={`sidebar-action ${pathname === '/credits' ? 'sidebar-action-active' : ''}`}
                    onClick={() => {
                        navigate('/credits')
                        closeMenu()
                    }}
                >
                    <img src={assets.diamond_icon} alt="" />
                    <span className="sidebar-action-label">Credits</span>
                    <span className="sidebar-credit-count">{user?.credits ?? 0}</span>
                </button>
                <div className="sidebar-theme">
                    <span className="sidebar-theme-label">
                        <img src={assets.theme_icon} alt="" />
                        Dark mode
                    </span>
                    <button
                        type="button"
                        role="switch"
                        aria-label="Toggle dark mode"
                        aria-checked={theme === 'dark'}
                        className={`theme-switch ${theme === 'dark' ? 'theme-switch-on' : ''}`}
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    />
                </div>
            </div>

            <div className="sidebar-profile">
                <img src={assets.user_icon} alt="" />
                <span className="sidebar-profile-name">{user?.name || 'QuickGPT account'}</span>
                <button
                    type="button"
                    className="sidebar-logout"
                    aria-label="Log out"
                    onClick={logout}
                >
                    <img src={assets.logout_icon} alt="" />
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
