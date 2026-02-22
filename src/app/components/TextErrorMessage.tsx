import { Text } from '@radix-ui/themes'
import React, { PropsWithChildren } from 'react'

const TextErrorMessage = ({ children }: PropsWithChildren) => {
    if (!children) return null
    return (
        <Text color='red' as='p'>{children}</Text>
    )
}

export default TextErrorMessage