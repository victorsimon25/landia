import { useRef, useState, useEffect } from 'react'
import { Sparkles, Send, Loader2 } from 'lucide-react'

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[70%] bg-brand text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed">
        {text}
      </div>
    </div>
  )
}

function AiBubble({ text, loading }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-brand" />
      </div>
      <div className="max-w-[70%] bg-white border border-slate-200 text-slate-800 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm leading-relaxed shadow-sm">
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : text}
      </div>
    </div>
  )
}

export default function LanzerPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text }])
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
      // Then set: setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'ai', text: answer }])
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
    <div className="h-full flex flex-col max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">Lanzer AI</h1>
          <p className="text-xs text-slate-500">Ask questions about the state map and land acquisition data</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-brand" />
            </div>
            <p className="text-base font-semibold text-slate-700 mb-2">Ask Lanzer anything</p>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Ask about state-wise acquisition progress, pending projects, timelines, or any data from the interactive map.
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
      <div className="flex-shrink-0 pt-3">
        <div className="flex items-end gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the map…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none outline-none leading-relaxed max-h-32"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center text-white flex-shrink-0 hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  )
}
