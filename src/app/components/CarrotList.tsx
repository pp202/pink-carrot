'use client';

import { List } from '@/app/generated/prisma/client';
import { Box, Flex, IconButton, Tooltip, Text } from '@radix-ui/themes'
import axios from 'axios';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import { FaArchive } from 'react-icons/fa'

const CarrotList = () => {
    const [state, setState] = useState<List[]>([])

    useEffect(() => {
        fetch("/api/lists", { cache: "no-cache" })
            .then(res => res.json())
            .then(data => setState(data))
    }, [])


    function handleRemove(id: number): void {
        axios.delete(`/api/lists/${id}`).then(() => {
            if (!state)
                return
            const newState = state.filter((item) => item.id !== id)
            setState(newState)
        });
    }
    return <Carrots carrotList={state} onRemove={handleRemove} />;
};

const Carrots = ({ carrotList, onRemove }: { carrotList: List[], onRemove: (id: number) => void }) => (
    <ul>
        {carrotList.length>0 && carrotList.map((item) => (
            <li key={item.id}>
                <Flex className='mr-2'>
                    <Box className='grow'><Text>{item.name}</Text></Box>
                    <Box><Tooltip content="Archive">
                        <IconButton size={"1"} variant="ghost" >
                            <Link href='' onClick={() => onRemove(item.id)}><FaArchive /></Link>
                        </IconButton>
                    </Tooltip>
                    </Box>
                </Flex>
            </li>
        ))}
    </ul>
)


export default CarrotList
