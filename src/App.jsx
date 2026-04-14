import { useEffect, useState } from "react"
import { supabase } from "./config/supabaseClient"
import Login from "./pages/Login"
import FlightList from "./pages/FlightList"
import AdminPanel from "./pages/AdminPanel"

function App() {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) setRole("user")
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) setRole("user")
    })
  }, [])

  const handleLogin = (userRole) => {
    setRole(userRole)
    if (userRole !== "admin") {
      supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    }
  }

  const handleLogout = () => {
    setRole(null)
    setSession(null)
  }

  if (loading) return <p style={{ textAlign: "center", marginTop: "40px", color: "white" }}>Loading...</p>

  if (!session && role !== "admin") return <Login onLogin={handleLogin} />
  if (role === "admin") return <AdminPanel onLogout={handleLogout} />
  return <FlightList />
}

export default App
