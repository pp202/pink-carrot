import React from 'react'
import { Button, Flex, Link } from '@radix-ui/themes'

const actionItems = [
  { name: 'Create new list', href: '/my-lists/new' },
  { name: 'Go to my lists', href: '/my-lists' }
]

const page = () => {
  return (
    <div>
      <Flex direction="column" gap='3'>
        {actionItems.map(item => navItem(item.href, item.name))}
      </Flex>
    </div>
  )
}

const navItem = (href: string, name: string) => {
  return (
    <Button key={name}>
      <Link href={href}>{name}</Link>
    </Button>
  )
}

export default page