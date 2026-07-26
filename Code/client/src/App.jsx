import React from 'react'
import { useRoutes } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import './App.css'

const App = () => {
  const API_URL = `http://localhost:3000`

  let element = useRoutes([
    {
      path: '/',
      element: <Login api_url={API_URL} title='MatchLens | Sign In' />
    },
    {
      path: '/home',
      element: <Home api_url={API_URL} title='MatchLens | Home' />
    }
  ])

  return (
    <div className='app'>
      { element }
    </div>
  )
}

export default App
