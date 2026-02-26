'use client'

import React, { Suspense, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Button, Callout, TextField } from '@radix-ui/themes'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { createListSchema } from '@/app/schema/createListSchema'
import { z } from 'zod'
import TextErrorMessage from '@/app/components/TextErrorMessage'
import Spinner from '@/app/components/Spinner'

type NewListForm = z.infer<typeof createListSchema>

const NewListForm = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { register, control, handleSubmit, formState: { errors } } = useForm<NewListForm>({
        resolver: zodResolver(createListSchema),
        defaultValues: {
            name: '',
            carrots: []
        }
    })
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'carrots'
    })
    const [error, setError] = useState('');
    const [isSubmitting, setSubmitting] = useState(false)

    const cancelPath = searchParams.get('from') === 'dashboard' ? '/dashboard' : '/my-lists'
    return (
        <section className="min-h-[calc(100vh-5rem)] bg-zinc-950">
            <div className="container mx-auto flex min-h-[calc(100vh-5rem)] items-center justify-center px-6 py-12">
                <div className="w-full max-w-md rounded-2xl border border-zinc-600/30 bg-zinc-800 px-8 py-10 shadow-2xl shadow-black/40 md:px-10 md:py-12">
                    <header className="mb-8 text-center">
                        <h1 className="text-2xl font-semibold text-zinc-100">Create list</h1>
                        <p className="mt-2 text-sm text-zinc-300">
                            Save a new list so you can keep track of your carrots.
                        </p>
                    </header>

                    {error && <Callout.Root color='red' className='mb-5'>
                        <Callout.Text>{error}</Callout.Text>
                    </Callout.Root>}
                    <form
                        className='space-y-3'
                        onSubmit={handleSubmit(async (data) => {
                            try {
                                setSubmitting(true)
                                await axios.post('/api/lists', data)
                                router.push('/my-lists')
                            } catch (error) {
                                setError('Validation error')
                                setSubmitting(false)
                            }

                        })}
                    >
                        <TextField.Root placeholder='Title' {...register('name')} />
                        <TextErrorMessage>{errors.name?.message}</TextErrorMessage>
                        <div className='space-y-2'>
                            {fields.map((field, index) => (
                                <div key={field.id} className='space-y-1'>
                                    <div className='flex gap-2'>
                                        <TextField.Root
                                            className='grow'
                                            placeholder={`Carrot item ${index + 1}`}
                                            {...register(`carrots.${index}.label`)}
                                        />
                                        <Button
                                            type='button'
                                            variant='soft'
                                            color='red'
                                            onClick={() => remove(index)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                    <TextErrorMessage>{errors.carrots?.[index]?.label?.message}</TextErrorMessage>
                                </div>
                            ))}

                            <Button
                                type='button'
                                variant='soft'
                                color='gray'
                                onClick={() => append({ label: '' })}
                            >
                                Add carrot item
                            </Button>
                        </div>
                        <div className='flex gap-3'>
                            <Button disabled={isSubmitting}>Create List {isSubmitting && <Spinner />}</Button>
                            <Button
                                type='button'
                                variant='soft'
                                color='gray'
                                disabled={isSubmitting}
                                onClick={() => router.push(cancelPath)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    )
}

const NewListPage = () => (
    <Suspense fallback={<div className="min-h-[calc(100vh-5rem)] bg-zinc-950" />}>
        <NewListForm />
    </Suspense>
)

export default NewListPage
