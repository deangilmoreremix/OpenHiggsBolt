import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-[#08090b] flex flex-col">
      <header className="h-14 bg-black border-b border-white/5 flex items-center px-6">
        <h1 className="text-lg font-bold text-white">Assistant</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
            <h2 className="text-2xl font-black text-white mb-2">AI Assistant</h2>
            <p className="text-muted text-sm mb-6">Your intelligent assistant for creative workflows</p>
            <div className="space-y-4">
              <textarea
                placeholder="Ask anything..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-muted resize-none focus:outline-none focus:border-primary/50"
              />
              <button className="px-6 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
