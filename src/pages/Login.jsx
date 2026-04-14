import { useState } from "react"
import { supabase } from "../config/supabaseClient"

function Login({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignup, setIsSignup] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [gender, setGender] = useState("Male")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [dob, setDob] = useState("")
  const [passnum, setPassnum] = useState("")

  const handleSubmit = async () => {
    setLoading(true)
    setError("")

    if (isSignup) {
      // 1. Create auth account
      const { data, error: signupError } = await supabase.auth.signUp({ email, password })

      if (signupError) {
        setError(signupError.message)
        setLoading(false)
        return
      }

      // 2. Insert into passengers table
      const { error: passengerError } = await supabase
        .from("passengers")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          gender: gender,
          date_of_birth: dob,
          passport_number: passnum,
        })

      if (passengerError) {
        setError(passengerError.message)
        setLoading(false)
        return
      }

      onLogin()
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else onLogin()
    }

    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>AirReserve</h2>
        <p style={styles.subtitle}>{isSignup ? "Create an account" : "Sign in to your account"}</p>

        {isSignup && (
          <>
            <input
              style={styles.input}
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <input
              style={styles.input}
              type="text"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <select
              style={styles.input}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <input
              style={styles.input}
              type="date"
              placeholder="date of birth"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />

            <input
              style={styles.input}
              type="text"
              placeholder="Passport number"
              value={passnum}
              onChange={(e) => setPassnum(e.target.value)}
            />

          </>
        )}

       
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
        </button>

        <p style={styles.toggle}>
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span style={styles.link} onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#003580", fontFamily: "Arial" },
  card: { backgroundColor: "#001f4d", padding: "40px", borderRadius: "8px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", width: "380px" },
  title: { color: "white", marginBottom: "4px", textAlign: "center" },
  subtitle: { textAlign: "center", color: "#ccd9ff", marginBottom: "24px", fontSize: "14px" },
  label: { fontSize: "12px", color: "#ccd9ff", marginBottom: "4px", display: "block" },
  input: { width: "100%", padding: "10px", marginBottom: "12px", border: "1px solid #1a3a6b", backgroundColor: "#002766", color: "white", fontSize: "14px", boxSizing: "border-box" },
  button: { width: "100%", padding: "12px", backgroundColor: "#1a56db", color: "white", border: "none", fontSize: "16px", cursor: "pointer", marginTop: "4px" },
  error: { color: "#ff6b6b", fontSize: "13px", marginBottom: "10px" },
  toggle: { textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#ccd9ff" },
  link: { color: "#7ab3ff", cursor: "pointer", fontWeight: "bold" }
}

export default Login
