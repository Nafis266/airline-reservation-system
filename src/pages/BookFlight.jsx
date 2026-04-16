import { useState, useEffect } from "react"
import { supabase } from "../config/supabaseClient"
import Payment from "./Payment"

function BookFlight({ flight, onBack, onBooked, onSkipped}) {
  const [passengerId, setPassengerId] = useState(null)
  const [seatNumber, setSeatNumber] = useState("")
  const [seatClassId, setSeatClassId] = useState("1")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [bookingData, setBookingData] = useState(null)

  const seatClasses = {
    "1": { name: "Economy", price: 5000 },
    "2": { name: "Business", price: 12000 },
    "3": { name: "First Class", price: 20000 },
    "4": { name: "Premium Economy", price: 8000 },
    "5": { name: "Luxury", price: 25000 },
    "6": { name: "Budget", price: 3000 },
  }

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
    if (!passengerId) { setError("No passenger linked to this account."); return }
    if (!seatNumber) { setError("Please enter a seat number."); return }

    setLoading(true)
    setError("")

    const { data: existingTickets } = await supabase
      .from("tickets")
      .select(`
        ticket_id,
        seat_number,
        bookings!fk_ticket_booking (
          schedule_id
        )
      `)
      .eq("seat_number", seatNumber)

    const isTaken = existingTickets?.some(t => t.bookings?.schedule_id === flight.schedule_id)

    if (isTaken) {
      setError("This seat is already taken for this flight. Please choose another seat.")
      setLoading(false)
      return
    }

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

    const selectedClass = seatClasses[seatClassId]

    const { error: ticketError } = await supabase
      .from("tickets")
      .insert({
        booking_id: booking.booking_id,
        seat_number: seatNumber,
        seat_class_id: parseInt(seatClassId),
        ticket_price: selectedClass.price
      })

    if (ticketError) {
      setError(ticketError.message)
      setLoading(false)
      return
    }

    setBookingData({
      booking_id: booking.booking_id,
      flight_number: flight.flights.flight_number,
      from: `${flight.flights.source.city} (${flight.flights.source.airport_code})`,
      to: `${flight.flights.destination.city} (${flight.flights.destination.airport_code})`,
      seat_number: seatNumber,
      class_name: selectedClass.name,
      ticket_price: selectedClass.price
    })

    setLoading(false)
  }

  if (bookingData) return (
    <Payment
      booking={bookingData}
      onPaid={onBooked}
      onSkip={onSkipped}
    />
  )

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
          {Object.entries(seatClasses).map(([id, { name, price }]) => (
            <option key={id} value={id}>{name} - ₹{price}</option>
          ))}
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
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#003580" },
  card: { backgroundColor: "#001f4d", padding: "40px",boxShadow: "0 4px 20px rgba(0,0,0,0.4)", width: "400px" },
  title: { color: "white", marginBottom: "16px", textAlign: "center" },
  info: { backgroundColor: "#002766", padding: "12px",marginBottom: "20px", fontSize: "14px", color: "#ccd9ff" },
  input: { width: "100%", padding: "10px", marginBottom: "12px", border: "1px solid #1a3a6b", backgroundColor: "#002766", color: "white", fontSize: "14px", boxSizing: "border-box" },
  button: { width: "100%", padding: "12px", backgroundColor: "#1a56db", color: "white", border: "none", fontSize: "16px", cursor: "pointer" },
  error: { color: "#ff6b6b", fontSize: "13px", marginBottom: "10px" },
  back: { background: "none", border: "none", color: "#7ab3ff", cursor: "pointer", fontSize: "14px", marginBottom: "16px", padding: 0 }
}
export default BookFlight
