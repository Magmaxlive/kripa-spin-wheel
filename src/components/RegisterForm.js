'use client'
import React from 'react'
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { supabase } from '@/lib/supabase/client';

const registrationSchema = z.object({
    name:z.string()
    .min(2,'Name must be at least 2 characters'),

    phone: z.string()
    .min(10,'Please enter valid phone number'),

    email: z.email({
        error: "Please enter valid email address",
        }),

    terms:z.boolean()
    .refine((value) => value === true, {
        message: 'You must accept the terms and conditions'
    })
});

function FormInput({field,...props}){
    const error = field.state.meta.errors[0];
        return(
            <>
            <input 
            {...props}
            value={field.state.value}
            onChange={(e)=>field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            className='p-3 bg-button/80 rounded-lg '
            />

            {error && (
                <span className="text-sm text-red-500">
                    {error}
                </span>
            )}
        </>
        );
    }

function FormCheckbox({ field, ...props }) {
return (
    <>
        <input
            {...props}
            type="checkbox"
            checked={field.state.value}
            onChange={(e) => field.handleChange(e.target.checked)}
            onBlur={field.handleBlur}
        />
    
       
    </>
   
);
}

function RegisterForm() {
    const form = useForm({
        defaultValues:{
            name:'',
            phone:'',
            email:'',
            terms:false
        },

        onSubmit: async({value}) => {
            const {data,error} = await supabase
                .from('participants')
                .insert({
                    name:value.name,
                    phone:value.phone,
                    email:value.email || null,
                })
               

                if (error){
                    console.error(error);
                    return;
                }

                console.log('participants registered : ',data)
        },
    });

    const handleFormSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
    }

    const validateField = (schema) => ({value}) => {
        const result = schema.safeParse(value);

        return result.success
        ? undefined
        : result.error.issues[0]?.message;
    };


  return (
    <div className='px-8 py-10 bg-white rounded-xl border border-primary/20'>
        <form className='flex flex-col gap-6' onSubmit={(handleFormSubmit)}>
            <form.Field name='name' validators={{
                onChange: validateField(registrationSchema.shape.name)
            }}>
                {(field)=>(
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name" className='text-semibold capitalize'>Full Name</label>
                        <FormInput field={field} type="text" id='name' placeholder='enter your name'  />
                    </div>
                )}

            </form.Field>

            <form.Field name='email' validators={{
                onChange: validateField(registrationSchema.shape.email)
            }}>
                {(field)=>(
                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" className='text-semibold capitalize'>Email</label>
                        <FormInput field={field} type="email" id='email' placeholder='enter your email address'  />
                    </div>
                )}

            </form.Field>

            <form.Field name='phone' validators={{
                onChange: validateField(registrationSchema.shape.phone)
            }}>

                {(field)=>(
                    <div className="flex flex-col gap-2">
                        <label htmlFor="phone" className='text-semibold capitalize'>phone</label>
                        <FormInput field={field} type="tel" id='phone' placeholder='enter your phone number'  />
                    </div>
                )}

            </form.Field>

             <form.Field name='terms' validators={{
                onChange: validateField(registrationSchema.shape.terms)
            }}>

                {(field)=>(
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                            <FormCheckbox field={field}
                        type="checkbox" id='terms'
                        className="h-5 w-5 cursor-pointer rounded-sm border border-primary"
                        
                    />  

                            <label htmlFor="terms" className='text-semibold capitalize'>I agree to the Terms & Conditions</label>

                        </div>
                    
                    
                        {field.state.meta.errors[0] && (
                            <span className="text-sm text-red-500">
                                {field.state.meta.errors[0]}
                            </span>
                        )}
    
                    
                </div>
                )}

            </form.Field>
            


            

            

            <button type="submit" className='py-2 hover:bg-accent hover:text-primary h-fit rounded-sm cursor-pointer capitalize font-semibold text-base text-white px-4 bg-primary'>continue to spin</button>

        </form>
      
    </div>
  )
}

export default RegisterForm
