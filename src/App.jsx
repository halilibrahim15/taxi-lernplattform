import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase/client'
import Layout from './app/layout/Layout'
import LoginPage from './features/auth/LoginPage'
import HomePage from './features/home/HomePage'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function loadSession() {
    const { data } = await supabase.auth.getSession()
    setUser(data.session?.user ?? null)
    setLoading(false)
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '40px 0', fontSize: '18px' }}>Lade...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      {user ? <HomePage user={user} /> : <LoginPage />}
    </Layout>
  )
}

export default App