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

        <button style={styles.skipButton} onClick={onSkip}>
          Pay Later
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f0f4f8" },
  card: { backgroundColor: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "400px" },
  title: { color: "#003580", marginBottom: "16px", textAlign: "center" },
  info: { backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" },
  input: { width: "100%", padding: "10px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box" },
  button: { width: "100%", padding: "12px", backgroundColor: "#003580", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer", marginBottom: "10px" },
  skipButton: { width: "100%", padding: "12px", backgroundColor: "white", color: "#003580", border: "1px solid #003580", borderRadius: "8px", fontSize: "16px", cursor: "pointer" },
  error: { color: "red", fontSize: "13px", marginBottom: "10px" }
}

export default Payment
