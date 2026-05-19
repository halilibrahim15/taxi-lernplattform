import { useState } from 'react'
import { supabase } from '../../lib/supabase/client'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleLogin() {
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('Login Fehler: ' + error.message)
    } else {
      setMessage('Login erfolgreich')
    }
  }

  async function handleSignUp() {
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage('Registrierung Fehler: ' + error.message)
    } else {
      setMessage('Registrierung erfolgreich')
    }
  }

  return (
    <div
      style={{
        maxWidth: '520px',
        margin: '40px auto',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          backgroundColor: '#e8f0ff',
          color: '#1d4ed8',
          padding: '8px 14px',
          borderRadius: '999px',
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '16px',
        }}
      >
        Taxi Lernplattform
      </div>

      <h1
        style={{
          margin: '0 0 12px 0',
          fontSize: '36px',
          color: '#0f172a',
        }}
      >
        Login
      </h1>

      <p
        style={{
          margin: '0 0 24px 0',
          color: '#64748b',
          fontSize: '16px',
        }}
      >
        Melde dich an oder registriere dich.
      </p>

      {message && (
        <div
          style={{
            marginBottom: '16px',
            padding: '14px 16px',
            borderRadius: '12px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1d4ed8',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gap: '12px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email || ''}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: '14px 16px',
            borderRadius: '12px',
            border: '1px solid #d1d5db',
            fontSize: '16px',
            outline: 'none',
          }}
        />

        <input
          type="password"
          placeholder="Passwort"
          value={password || ''}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: '14px 16px',
            borderRadius: '12px',
            border: '1px solid #d1d5db',
            fontSize: '16px',
            outline: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginTop: '8px',
          }}
        >
          <button
            onClick={handleLogin}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Login
          </button>

          <button
            onClick={handleSignUp}
            style={{
              backgroundColor: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Registrieren
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage