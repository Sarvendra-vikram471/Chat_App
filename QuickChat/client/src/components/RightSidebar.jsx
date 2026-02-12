import React from 'react'
import assets from '../assets/assets'

function RightSidebar({ selectedUser, messages }) {
  if (!selectedUser) return null

  const sharedMedia = messages.filter((message) => message.imageUrl)

  return (
    <div className="h-full w-full text-white border-l border-white/10 bg-white/5">
      <div className="px-6 pt-6 pb-4 border-b border-white/10">
        <div className="flex flex-col items-center text-center gap-3">
          <img
            src={selectedUser.profilePic || assets.avatar_icon}
            alt={selectedUser.displayName}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <p className="text-lg font-semibold text-white">{selectedUser.displayName}</p>
          </div>
          <p className="text-sm text-white/70">{selectedUser.bio}</p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-full bg-violet-500/80 text-xs text-white hover:bg-violet-500">
              Mute
            </button>
            <button className="px-4 py-2 rounded-full bg-white/10 text-xs text-white hover:bg-white/20">
              Block
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Shared Media</p>
        {sharedMedia.length ? (
          <div className="grid grid-cols-3 gap-3">
            {sharedMedia.map((message) => (
              <div key={message.id} className="rounded-xl overflow-hidden border border-white/10">
                <img src={message.imageUrl} alt="Shared" className="w-full h-20 object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-white/40">No shared media yet.</div>
        )}
      </div>
    </div>
  )
}

export default RightSidebar
