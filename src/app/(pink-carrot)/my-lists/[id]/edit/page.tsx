'use client'

import React, { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Button, Callout, TextField } from '@radix-ui/themes'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { createListSchema } from '@/app/schema/createListSchema'
import { z } from 'zod'
import TextErrorMessage from '@/app/components/TextErrorMessage'
import Spinner from '@/app/components/Spinner'
import { GiCarrot } from 'react-icons/gi'
import { IoAdd, IoRemove } from 'react-icons/io5'

type EditListForm = z.input<typeof createListSchema>

type ChestResponse = {
  label: string
  carrots: Array<{ label: string }>
}

const EditListPage = () => {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setSubmitting] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditListForm>({
    resolver: zodResolver(createListSchema),
    defaultValues: {
      name: '',
      carrots: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'carrots',
  })

  useEffect(() => {
    axios
      .get<ChestResponse>(`/api/lists/${params.id}`)
      .then(({ data }) => {
        reset({
          name: data.label,
          carrots: data.carrots,
        })
      })
      .catch(() => {
        setError('Unable to load the list')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [params.id, reset])

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-zinc-950">
      <div className="container mx-auto flex min-h-[calc(100vh-5rem)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-600/30 bg-zinc-800 px-8 py-10 shadow-2xl shadow-black/40 md:px-10 md:py-12">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-zinc-100">Edit list</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Update your list title and carrots.
            </p>
          </header>

          {error && (
            <Callout.Root color="red" className="mb-5">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-300">
              <Spinner />
              <span>Loading list...</span>
            </div>
          ) : (
            <form
              className="space-y-3"
              onSubmit={handleSubmit(async (data) => {
                try {
                  setSubmitting(true)
                  await axios.patch(`/api/lists/${params.id}`, data)
                  router.push('/my-lists')
                } catch {
                  setError('Validation error')
                  setSubmitting(false)
                }
              })}
            >
              <TextField.Root placeholder="Title" {...register('name')} />
              <TextErrorMessage>{errors.name?.message}</TextErrorMessage>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-1">
                    <div className="flex gap-2">
                      <TextField.Root
                        className="grow"
                        placeholder={`Carrot item ${index + 1}`}
                        {...register(`carrots.${index}.label`)}
                      />
                      <Button
                        type="button"
                        variant="soft"
                        color="red"
                        aria-label={`Remove carrot item ${index + 1}`}
                        onClick={() => remove(index)}
                      >
                        <IoRemove />
                      </Button>
                    </div>
                    <TextErrorMessage>{errors.carrots?.[index]?.label?.message}</TextErrorMessage>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="soft"
                  color="gray"
                  aria-label="Add carrot item"
                  onClick={() => append({ label: '' })}
                >
                  <span className="inline-flex items-center gap-1">
                    <GiCarrot />
                    <IoAdd />
                  </span>
                </Button>
              </div>
              <div className="flex gap-3">
                <Button disabled={isSubmitting}>Save List {isSubmitting && <Spinner />}</Button>
                <Button
                  type="button"
                  variant="soft"
                  color="gray"
                  disabled={isSubmitting}
                  onClick={() => router.push('/my-lists')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default EditListPage
