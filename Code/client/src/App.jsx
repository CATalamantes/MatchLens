import React from 'react'
import { useRoutes } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import './App.css'

// '' means same origin, which is how the production build is served — vite
// builds into server/public and Express serves it from there. In dev the client
// is on :5173 and /auth isn't behind the vite proxy, so point at the API
// directly. Set VITE_API_URL only for a split deploy.
const API_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:3000')

const App = () => {

  let element = useRoutes([
    {
      path: '/',
      element: <Login api_url={API_URL} title='MatchLens | Sign In' />
    },
    {
      path: '/signup',
      element: <Signup api_url={API_URL} title='MatchLens | Sign Up' />
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
