import React from 'react'

function StepCards({items=[]}) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 tablet:grid-cols-3 gap-8'>

        {items.map((i,index)=>{
            const Icon = i.icon
            return (
            <div key={index} className={`flex flex-col gap-6 p-8 rounded-md ${index==1 ? 'bg-accent/20 border border-primary/20' :'bg-button'}`}>
                <div className="flex items-center justify-between">
                    {Icon && 
                    <div className={`${index==1 ? 'bg-primary' :'bg-accent'} text-accent text-white p-3 rounded-xl`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    }

                    <h3 className="font-bold text-primary/40 text-3xl ">
                        0{index+1}
                    </h3>
                    
                </div>
                <div className="flex gap-2 flex-col">
                    <h1 className="font-bold text-xl text-primary">
                    {i.title}
                </h1>
                 <p className="text-base">
                    {i.description}
                </p>
                </div>
            </div>
            )
        })}
      
    </div>
  )
}

export default StepCards
