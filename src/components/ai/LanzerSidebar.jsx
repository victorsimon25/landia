import { useRef, useState, useEffect } from 'react'
import { X, Send, Sparkles, Loader2 } from 'lucide-react'

// Message shape: { id: string, role: 'user' | 'ai', text: string }

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-brand text-white text-sm px-3.5 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed">
        {text}
      </div>
    </div>
  )
}

function AiBubble({ text, loading }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-brand" />
      </div>
      <div className="max-w-[80%] bg-slate-100 text-slate-800 text-sm px-3.5 py-2.5 rounded-2xl rounded-tl-sm leading-relaxed">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          text
        )}
      </div>
    </div>
  )
}

export default function LanzerSidebar({ open, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // ── BACKEND INTEGRATION POINT ──────────────────────────────────────────
      // Replace this block with your actual API call, e.g.:
      //
      //   const res = await fetch('/api/lanzer/ask', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ question: text }),
      //   })
      //   const { answer } = await res.json()
      //
      // Then replace the placeholder below with `answer`.
      // ───────────────────────────────────────────────────────────────────────
      await new Promise(r => setTimeout(r, 800))
      const answer = 'Backend not yet connected. Wire up POST /api/lanzer/ask to get real answers.'

      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'ai', text: answer }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div
      className={`flex flex-col h-full bg-white border-l border-slate-200 transition-all duration-200 overflow-hidden ${
        open ? 'w-80' : 'w-0'
      }`}
    >
      {open && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 leading-tight">Lanzer AI</p>
                <p className="text-xs text-slate-400">Ask about the map</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-brand" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">Ask Lanzer anything</p>
                <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
                  Ask questions about land acquisition progress across states.
                </p>
              </div>
            )}

            {messages.map(msg =>
              msg.role === 'user'
                ? <UserBubble key={msg.id} text={msg.text} />
                : <AiBubble key={msg.id} text={msg.text} />
            )}

            {loading && <AiBubble loading />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-100 flex-shrink-0">
            <div className="flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about the map…"
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none outline-none leading-relaxed max-h-28"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white flex-shrink-0 hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-300 text-center mt-1.5">Enter to send · Shift+Enter for newline</p>
          </div>
        </>
      )}
    </div>
  )
}
