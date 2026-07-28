import React from 'react'
import { useRoutes } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import MatchDetail from './pages/MatchDetail'
import './App.css'

const App = () => {
  let element = useRoutes([
    {
      path: '/',
      element: <Login title='MatchLens | Sign In' />
    },
    {
      path: '/home',
      element: <Home title='MatchLens | Home' />
    },
    {
      path: '/matches/:apiMatchId',
      element: <MatchDetail title='MatchLens | Match Detail' />
    }
  ])

  return (
    <div className='app'>
      { element }
    </div>
  )
}

export default App
