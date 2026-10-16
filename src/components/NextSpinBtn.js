import React from 'react'

function NextSpinBtn() {
    const handleLogout = async()=>{
        try {
            const response = await fetch('/api/participant/logout',{
                method:'POST'
            });

            if (!response.ok){
                throw new Error('Logout failed')
            }

            window.location.replace('/register')
        } catch (error) {
            console.error("Logout error:", error);
            alert("Unable to log out. Please try again.");
        }
    }
  return (
    <button onClick={handleLogout} className='rounded-full cursor-pointer bg-red-800 px-4 py-2 font-medium text-white hover:bg-red-700'>
      Next Participant
    </button>
  )
}

export default NextSpinBtn
