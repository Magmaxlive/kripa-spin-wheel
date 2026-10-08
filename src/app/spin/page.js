'use client';
import React from 'react'
import { useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';

function page() {
    const router = useRouter();
    const [participant,setParticipant] = useState(null)
    const [loading,setLoading] = useState(true)

    useEffect(()=>{
        const verifyParticipant = async ()=>{
            try {
                const response = await fetch ('/api/participant');

                if (!response.ok){
                    router.replace('/register');
                    return;
                }

                const data = await response.json();

                if (!data.authenticated){
                    router.replace('/register');
                    return;
                }

                setParticipant(data.participant)

            } catch (error) {
                console.error('verification failed :',error)
                router.replace('/register')
            }finally{
                setLoading(false)
            }
        };

        verifyParticipant();

        

    },[router]);

    if (loading){
        return <div>Loading...</div>
    }

    if (!participant) {
        return null;
    }


  return (
    <div className='bg-neutral min-h-screen py-15 px-8'>
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
             <h1 className="text-3xl font-bold">
                    Welcome, {participant.name}
                </h1>

                <p>
                    You are eligible to spin.
                </p>
        </div>
      
    </div>
  )
}

export default page
