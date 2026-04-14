import { useState } from "react"
import { supabase } from "../config/supabaseClient"

function Payment({ booking, onPaid, onSkip }) {
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePay = async () => {
    if (!cardNumber || !expiry || !cvv) {
      setError("Please fill in all payment details.")
      return
    }

    setLoading(true)
    setError("")

    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        booking_id: booking.booking_id,
        payment_date: new Date().toISOString(),
        amount: booking.ticket_price,
        payment_status: "Paid"
      })

    if (paymentError) setError(paymentError.message)
    else onPaid()
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Payment</h2>

        <div style={styles.info}>
          <p><b>Flight:</b> {booking.flight_number}</p>
          <p><b>From:</b> {booking.from}</p>
          <p><b>To:</b> {booking.to}</p>
          <p><b>Seat:</b> {booking.seat_number}</p>
          <p><b>Class:</b> {booking.class_name}</p>
          <p style={{ fontSize: "18px", marginTop: "8px" }}><b>Amount: ₹{booking.ticket_price}</b></p>
        </div>

        <input
          style={styles.input}
          type="text"
          placeholder="Card Number (e.g. 1234 5678 9012 3456)"
          maxLength={19}
          value={cardNumber}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 16)
            setCardNumber(val.replace(/(.{4})/g, "$1 ").trim())
          }}
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            style={{ ...styles.input, flex: 1 }}
            type="text"
            placeholder="MM/YY"
            maxLength={5}
            value={expiry}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4)
              setExpiry(val.length > 2 ? val.slice(0, 2) + "/" + val.slice(2) : val)
            }}
          />
          <input
            style={{ ...styles.input, flex: 1 }}
            type="password"
            placeholder="CVV"
            maxLength={3}
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={handlePay} disabled={loading}>
          {loading ? "Processing..." : `Pay ₹${booking.ticket_price}`}
        </button>

      </div>
    </div>
  )
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#003580" },
  card: { backgroundColor: "#001f4d", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", width: "400px" },
  title: { color: "white", marginBottom: "16px", textAlign: "center" },
  info: { backgroundColor: "#002766", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", color: "#ccd9ff" },
  input: { width: "100%", padding: "10px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #1a3a6b", backgroundColor: "#002766", color: "white", fontSize: "14px", boxSizing: "border-box" },
  button: { width: "100%", padding: "12px", backgroundColor: "#1a56db", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer" },
  error: { color: "#ff6b6b", fontSize: "13px", marginBottom: "10px" },
  back: { background: "none", border: "none", color: "#7ab3ff", cursor: "pointer", fontSize: "14px", marginBottom: "16px", padding: 0 }
}

export default Payment
