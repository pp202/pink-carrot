'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Callout, TextField } from '@radix-ui/themes'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { createListSchema } from '@/app/schema/createListSchema'
import { z } from 'zod'
import TextErrorMessage from '@/app/components/TextErrorMessage'
import Spinner from '@/app/components/Spinner'

type NewListForm = z.infer<typeof createListSchema>

const NewListPage = () => {
    const router = useRouter()
    const { register, handleSubmit, formState: { errors } } = useForm<NewListForm>({
        resolver: zodResolver(createListSchema)
    })
    const [error, setError] = useState('');
    const [isSubmitting, setSubmitting] = useState(false)
    return (
        <div className='max-w-xl space-y-3'>
            {error && <Callout.Root color='red' className='mb-5'>
                <Callout.Text>{error}</Callout.Text>
            </Callout.Root>}
            <form onSubmit={handleSubmit(async (data) => {
                try {
                    setSubmitting(true)
                    await axios.post('/api/lists', data)
                    router.push('/my-lists')
                } catch (error) {
                    setError('Validation error')
                    setSubmitting(false)
                }

            })}>
                <TextField.Root placeholder='Title' {...register('name')} />
                <TextErrorMessage>{errors.name?.message}</TextErrorMessage>
                <Button disabled={isSubmitting}>Create List {isSubmitting && <Spinner/>}</Button>
            </form>
        </div>
    )
}

export default NewListPage
