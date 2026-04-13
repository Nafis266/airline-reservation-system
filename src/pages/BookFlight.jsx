import { useState, useEffect } from "react"
import { supabase } from "../config/supabaseClient"

function BookFlight({ flight, onBack, onBooked }) {
  const [passengerId, setPassengerId] = useState(null)
  const [seatNumber, setSeatNumber] = useState("")
  const [seatClassId, setSeatClassId] = useState("1")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Auto-fetch passenger ID based on logged-in email
  useEffect(() => {
    async function fetchPassenger() {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from("passengers")
        .select("passenger_id")
        .eq("email", user.email)
        .single()

      if (error) setError("No passenger found for this account.")
      else setPassengerId(data.passenger_id)
    }

    fetchPassenger()
  }, [])

  const handleBook = async () => {
    if (!passengerId) {
      setError("No passenger linked to this account.")
      return
    }

    setLoading(true)
    setError("")

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        passenger_id: passengerId,
        schedule_id: flight.schedule_id,
        booking_date: new Date().toISOString(),
        booking_status: "Confirmed"
      })
      .select()
      .single()

    if (bookingError) {
      setError(bookingError.message)
      setLoading(false)
      return
    }

    const { error: ticketError } = await supabase
      .from("tickets")
      .insert({
        booking_id: booking.booking_id,
        seat_number: seatNumber,
        seat_class_id: parseInt(seatClassId),
        ticket_price: 5000
      })

    if (ticketError) setError(ticketError.message)
    else onBooked()
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.back} onClick={onBack}>← Back</button>
        <h2 style={styles.title}>Book Flight</h2>

        <div style={styles.info}>
          <p><b>Flight:</b> {flight.flights.flight_number}</p>
          <p><b>From:</b> {flight.flights.source.city} ({flight.flights.source.airport_code})</p>
          <p><b>To:</b> {flight.flights.destination.city} ({flight.flights.destination.airport_code})</p>
          <p><b>Departure:</b> {new Date(flight.departure_time).toLocaleString()}</p>
        </div>

        <input
          style={styles.input}
          type="text"
          placeholder="Seat Number (e.g. A1)"
          value={seatNumber}
          onChange={(e) => setSeatNumber(e.target.value)}
        />
        <select
          style={styles.input}
          value={seatClassId}
          onChange={(e) => setSeatClassId(e.target.value)}
        >
          <option value="1">Economy</option>
          <option value="2">Business</option>
          <option value="3">First Class</option>
          <option value="4">Premium Economy</option>
          <option value="5">Luxury</option>
          <option value="6">Budget</option>
        </select>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={handleBook} disabled={loading || !passengerId}>
          {loading ? "Booking..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f0f4f8" },
  card: { backgroundColor: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "400px" },
  title: { color: "#003580", marginBottom: "16px" },
  info: { backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" },
  input: { width: "100%", padding: "10px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box" },
  button: { width: "100%", padding: "12px", backgroundColor: "#003580", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer" },
  error: { color: "red", fontSize: "13px", marginBottom: "10px" },
  back: { background: "none", border: "none", color: "#003580", cursor: "pointer", fontSize: "14px", marginBottom: "16px", padding: 0 }
}

export default BookFlight
