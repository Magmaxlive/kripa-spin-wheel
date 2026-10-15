'use client'
import React, { useState } from 'react'
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase/client';

const loginSchema = z.object({
    email: z.email({ error: "Please enter a valid email address" }),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

function FormInput({ field, ...props }) {
    const error = field.state.meta.errors[0];
    return (
        <>
            <input
                {...props}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className='p-3 bg-button/80 rounded-lg'
            />
            {error && (
                <span className="text-sm text-red-500">{error}</span>
            )}
        </>
    );
}

function AdminLoginForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const form = useForm({
        defaultValues: {
            email: '',
            password: '',
        },
        
        onSubmit: async ({ value }) => {
            setServerError("");
            setSubmitting(true);

            try {
                const { error: loginError } =
                    await supabase.auth.signInWithPassword({
                        email: value.email.trim(),
                        password: value.password,
                    });

                if (loginError) {
                    setServerError("Invalid email or password.");
                    return;
                }

                // Verify admin authorization on the server.
                const response = await fetch("/api/admin/me", {
                    method: "GET",
                    cache: "no-store",
                });

                if (!response.ok) {
                    // Sign out users who are not authorized admins.
                    await supabase.auth.signOut();

                    if (response.status === 403) {
                        setServerError(
                            "You are not authorized to access the admin dashboard."
                        );
                    } else {
                        setServerError(
                            "Unable to verify admin access. Please try again."
                        );
                    }

                    return;
                }

                router.replace("/admin");
                router.refresh();
            } catch (err) {
                console.error("Admin login error:", err);
                setServerError("Something went wrong. Please try again.");
            } finally {
                setSubmitting(false);
            }
        },

    });

    const handleFormSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
    };

    const validateField = (schema) => ({ value }) => {
        const result = schema.safeParse(value);
        return result.success ? undefined : result.error.issues[0]?.message;
    };

    return (
        <div className='px-8 py-10 bg-white rounded-xl border border-primary/20'>
            <form className='flex flex-col gap-6' onSubmit={handleFormSubmit}>
                <form.Field name='email' validators={{
                    onChange: validateField(loginSchema.shape.email)
                }}>
                    {(field) => (
                        <div className="flex flex-col gap-2">
                            <label htmlFor="email" className='text-semibold capitalize'>Email</label>
                            <FormInput field={field} type="email" id='email' placeholder='admin@example.com' autoComplete='email' />
                        </div>
                    )}
                </form.Field>

                <form.Field name='password' validators={{
                    onChange: validateField(loginSchema.shape.password)
                }}>
                    {(field) => (
                        <div className="flex flex-col gap-2">
                            <label htmlFor="password" className='text-semibold capitalize'>Password</label>
                            <FormInput field={field} type="password" id='password' placeholder='Enter your password' autoComplete='current-password' />
                        </div>
                    )}
                </form.Field>

                {serverError && (
                    <span className="text-sm text-red-500">{serverError}</span>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className='py-2 hover:bg-accent hover:text-primary h-fit rounded-sm cursor-pointer capitalize font-semibold text-base text-white px-4 bg-primary disabled:opacity-60 disabled:cursor-not-allowed'
                >
                    {submitting ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
        </div>
    );
}

export default AdminLoginForm
