import { useEffect, useState } from "react"
import { supabase } from "./config/supabaseClient"
import Login from "./pages/Login"
import FlightList from "./pages/FlightList"

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) return <p style={{ textAlign: "center", marginTop: "40px" }}>Loading...</p>

  return session
    ? <FlightList />
    : <Login onLogin={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} />
}

export default App
