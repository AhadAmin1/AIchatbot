import { useEffect, useRef, useState } from 'react'
import { assets } from '../assets/assets'
import { useAppcontext } from '../context/AppContext'
import Message from './Message'
import toast from 'react-hot-toast'

const suggestions = [
  { title: 'Explain a concept', prompt: 'Explain a complex idea in simple terms', detail: 'Clear, step-by-step answers' },
  { title: 'Write something', prompt: 'Help me write a polished email about ', detail: 'Drafts, edits, and ideas' },
  { title: 'Plan my next steps', prompt: 'Help me make a practical plan for ', detail: 'Turn goals into an action plan' },
  { title: 'Brainstorm ideas', prompt: 'Give me some creative ideas for ', detail: 'Explore fresh possibilities' },
]

const ChatBox = () => {
  const { selectedChat, user, setUser, token, axios } = useAppcontext()
  const containerRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState('text')
  const [isPublished, setIsPublished] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!user) return toast('Log in to send a message')
    if (!selectedChat) return toast.error('Your chat is still loading. Please try again.')

    const promptText = prompt.trim()
    if (!promptText) return

    setLoading(true)
    setPrompt('')
    setMessages((previousMessages) => [
      ...previousMessages,
      { role: 'user', content: promptText, timestamp: Date.now(), isImage: false },
    ])

    try {
      const { data } = await axios.post(
        `/api/message/${mode}`,
        { chatId: selectedChat._id, prompt: promptText, isPublished },
        { headers: { Authorization: token } },
      )

      if (data.success) {
        setMessages((previousMessages) => [...previousMessages, data.reply])
        if (!user.unlimitedCredits) {
          setUser((previousUser) => ({
            ...previousUser,
            credits: previousUser.credits - (mode === 'image' ? 2 : 1),
          }))
        }
      } else {
        toast.error(data.message)
        setPrompt(promptText)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
      setPrompt(promptText)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMessages(selectedChat?.messages || [])
  }, [selectedChat])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages, loading])

  return (
    <section className="chat-page" aria-label="AI chat">
      <header className="chat-header">
        <div className="chat-header-title">
          <span className="chat-header-eyebrow">QuickGPT workspace</span>
          <strong>{user?.name ? `Welcome, ${user.name.split(' ')[0]}` : 'Your AI assistant'}</strong>
        </div>
        <div className="chat-header-right">
          <div className="chat-credit-pill">
            <img src={assets.diamond_icon} alt="" />
            <strong>{user?.unlimitedCredits ? 'Unlimited' : user?.credits ?? 0}</strong>
            <span>{user?.unlimitedCredits ? 'usage' : 'credits available'}</span>
          </div>
        </div>
      </header>

      <div ref={containerRef} className="chat-feed">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-mark" aria-hidden="true">✦</div>
            <h1>What can I help with?</h1>
            <p>
              Ask a question, explore an idea, or get help with something you’re working on.
              Start wherever you are.
            </p>
            <div className="chat-suggestions">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  className="chat-suggestion"
                  key={suggestion.title}
                  onClick={() => setPrompt(suggestion.prompt)}
                >
                  <strong>{suggestion.title}</strong>
                  <span>{suggestion.detail}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((message, index) => (
              <Message key={message._id || `${message.timestamp || 'message'}-${index}`} message={message} />
            ))}
            {loading && (
              <div className="assistant-typing" role="status" aria-label="QuickGPT is responding">
                <span className="assistant-avatar" aria-hidden="true">✦</span>
                <span className="typing-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span>Thinking…</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="composer-area">
        {mode === 'image' && (
          <label className="composer-publish">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
            />
            Share generated images with the community
          </label>
        )}
        <form className="composer" onSubmit={onSubmit}>
          <select
            className="composer-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            aria-label="Choose generation mode"
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
          </select>
          <input
            type="text"
            className="composer-input"
            placeholder={mode === 'image' ? 'Describe the image you want…' : 'Message QuickGPT…'}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            aria-label="Your message"
            required
          />
          <button
            type="submit"
            className="composer-send"
            disabled={loading || !prompt.trim()}
            aria-label={loading ? 'Generating response' : 'Send message'}
          >
            <img src={assets.send_icon} alt="" />
          </button>
        </form>
        <div className="composer-footnote">QuickGPT can make mistakes. Check important information.</div>
      </div>
    </section>
  )
}

export default ChatBox
