import React from 'react'
import assets from '../assets/assets.js'

const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const ChatContainer = ({ selectedUser, setSelectedUser, currentUser, messages, onSendMessage }) => {
  const [draft, setDraft] = React.useState('')
  const [uploadError, setUploadError] = React.useState('')
  const fileInputRef = React.useRef(null)

  const handlePickImage = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setUploadError('')
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.')
      return
    }

    if (file.size > 1024 * 1024) {
      setUploadError('Image must be 1MB or smaller.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const imageUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!imageUrl) {
        setUploadError('Failed to read image.')
        return
      }
      onSendMessage({ imageUrl })
    }
    reader.onerror = () => {
      setUploadError('Failed to read image.')
    }
    reader.readAsDataURL(file)
  }

  if (!selectedUser) {
    return (
      <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
        <img src={assets.logo_icon} alt=" " className='max-w-16' />
        <p className='txt-lg font-medium text-white'>Chat anytime, anywhere</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 py-3 px-4 border-b border-white/10">
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className="w-9 rounded-full" />
        <div className="flex-1">
          <p className='text-lg text-white flex items-center gap-2'>
            {selectedUser.displayName}
            <span className='w-2 h-2 rounded-full bg-green-500'></span>
          </p>
          <p className="text-xs text-white/50">Active now</p>
        </div>
        <img
          src={assets.help_icon}
          alt="Help"
          className="w-5 opacity-80 hover:opacity-100 cursor-pointer"
        />
        <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7 cursor-pointer' />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/40 text-sm">
            No messages yet. Start the conversation.
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === currentUser?.id
            return (
              <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-lg ${isMe ? 'bg-violet-500/80 text-white rounded-br-md' : 'bg-white/10 text-white/90 rounded-bl-md'}`}>
                  {message.imageUrl ? (
                    <img src={message.imageUrl} alt="Shared" className="rounded-xl max-w-[280px] w-full" />
                  ) : (
                    <p>{message.text}</p>
                  )}
                  <p className={`mt-1 text-[10px] ${isMe ? 'text-white/70' : 'text-white/40'}`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <img
            src={assets.gallery_icon}
            alt="Gallery"
            className="w-5 opacity-80 cursor-pointer"
            onClick={handlePickImage}
          />
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && draft.trim()) {
                onSendMessage({ text: draft.trim() })
                setDraft('')
              }
            }}
          />
          <button
            className="h-9 w-9 rounded-full bg-violet-500/80 hover:bg-violet-500 flex items-center justify-center"
            onClick={() => {
              if (!draft.trim()) return
              onSendMessage({ text: draft.trim() })
              setDraft('')
            }}
          >
            <img src={assets.send_button} alt="Send" className="w-4" />
          </button>
        </div>
        {uploadError ? <p className="mt-2 text-xs text-red-300">{uploadError}</p> : null}
      </div>
    </div>
  )
}

export default ChatContainer
