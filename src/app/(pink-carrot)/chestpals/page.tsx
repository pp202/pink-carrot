import { getChestpalsData } from '@/backend/user'
import ChestpalsClient from './ChestpalsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ChestpalsPage = async () => {
  const data = await getChestpalsData()

  return (
    <ChestpalsClient
      initialConnections={data.connections}
    />
  )
}

export default ChestpalsPage
