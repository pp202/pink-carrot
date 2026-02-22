import React, { Fragment } from 'react'
import { getLists } from '@/backend/lists';
import CarrotList from '@/app/components/CarrotList';

const myCarrotsPage = async () => {
  return (
    <div>
      <CarrotList/>
    </div>
  )
}

export default myCarrotsPage