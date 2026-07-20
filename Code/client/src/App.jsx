import React from 'react'
import { useRoutes } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
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
    }
  ])

  return (
    <div className='app'>
      { element }
    </div>
  )
}

export default App
