import { getChestpalsData } from '@/backend/user'
import ChestpalsClient from './ChestpalsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {
  searchParams?: Promise<{
    notice?: string
    minutes?: string
    alias?: string
  }>
}

const ChestpalsPage = async ({ searchParams }: Props) => {
  const data = await getChestpalsData()
  const params = searchParams ? await searchParams : undefined

  const remainingMinutes = params?.minutes ? Number.parseInt(params.minutes, 10) : Number.NaN
  const initialRemainingMinutes = Number.isFinite(remainingMinutes) && remainingMinutes > 0
    ? remainingMinutes
    : null

  return (
    <ChestpalsClient
      initialConnections={data.connections}
      initialNotice={params?.notice ?? null}
      initialRemainingMinutes={initialRemainingMinutes}
      initialNoticeAlias={params?.alias ?? null}
    />
  )
}

export default ChestpalsPage
