import React from 'react'
import assets from '../assets/assets'
import {useNavigate} from 'react-router-dom'



const Sidebar = ({ selectedUser, setSelectedUser, users, onlineUsers, onLogout, currentUser }) => {
  const navigate=useNavigate();
  return (
    <div className={`h-full px-5 pt-5 pb-4 text-white bg-white/5 border-r border-white/10 overflow-y-auto ${selectedUser ? "max-md:hidden" : ''}`}>
      <div className='pb-5 border-b border-white/10'>
        <div className='flex justify-between items-center'>
          <img src={assets.logo} alt="Logo" className='max-w-40'/>
          <div className="relative py-2 group">
            <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer'/>
            <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block'>
              <p onClick={()=>navigate('/profile')} className='cursor-pointer text-sm'>Edit Profile</p>
              <hr className='my-2 border-t border-gray-500'/>
              <p onClick={() => navigate('/login')} className='cursor-pointer text-sm'>Switch Account</p>
              <hr className='my-2 border-t border-gray-500'/>
              <p onClick={onLogout} className='cursor-pointer text-sm'>Logout</p>
            </div>
          </div>
        </div>

        <div className='mt-4 rounded-xl bg-white/10 px-3 py-2 flex items-center gap-3'>
          <img src={currentUser?.profilePic || assets.avatar_icon} alt="My profile" className='w-10 h-10 rounded-full object-cover'/>
          <div className='min-w-0'>
            <p className='text-sm font-medium truncate'>{currentUser?.displayName || 'My Profile'}</p>
            <p className='text-[11px] text-white/60'>You</p>
          </div>
        </div>

        <div className='mt-4 bg-white/10 rounded-full flex items-center gap-2 py-3 px-4'>
          <img src={assets.search_icon}  alt="Search" className='w-3 opacity-80' />
          <input
            type="text"
            placeholder="Search User..."
            className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1'
          />
        </div>
      </div>
      <div className='mt-4 flex flex-col gap-1'>
        {users.length === 0 ? (
          <div className="text-xs text-white/50 px-2">No users available.</div>
        ) : (
          users.map((user,index)=>(
            <div className={`relative flex items-center gap-3 p-2 pl-3 rounded-lg cursor-pointer max-sm:text-sm transition ${selectedUser?.id===user.id ? 'bg-white/10' : 'hover:bg-white/5'}`} key={user.id} onClick={()=>setSelectedUser(user)}>
              <img src={user?.profilePic || assets.avatar_icon} alt="" className='w-[36px] aspect-[1/1] rounded-full object-cover'/>
              <div className='flex flex-col leading-5'>
                <p>{user.displayName}</p>
                {
                  onlineUsers.has(user.id) ? <span className='text-green-400 text-xs'>Online</span> : <span className='text-neutral-400 text-xs'>Offline</span>

                }
              </div>
               {index>2 && <p className='absolute right-3 top-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/60'>{index}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Sidebar
