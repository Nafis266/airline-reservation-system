import { useEffect, useState } from "react"
import { supabase } from "../config/supabaseClient"
import BookFlight from "./BookFlight"

function FlightList() {
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    fetchFlights()
  },[])

  async function fetchFlights() {
    const { data, error } = await supabase
      .from("flight_schedule")
      .select(`
        schedule_id,
        departure_time,
        arrival_time,
        status,
        flights!fk_flight_schedule_flight (
          flight_number,
          aircraft_type,
          source:airports!fk_source_airport(city, airport_code),
          destination:airports!fk_destination_airport (city, airport_code)
        )
      `)
      .neq("status", "Cancelled")
      .order("departure_time", { ascending: true })

    if (error) console.error(error)
    else setFlights(data)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (selectedFlight) return (
    <BookFlight
      flight={selectedFlight}
      onBack={() => setSelectedFlight(null)}
      onBooked={() => { setSelectedFlight(null); setBooked(true) }}
      onSkipped={() => {setSelectedFlight(null) }}
    />
  )


  if (loading) return <p style={{ textAlign: "center", marginTop: "40px" }}>Loading flights...</p>

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "#003580" }}>Available Flights</h1>
        <button onClick={handleLogout} style={{ padding: "8px 16px", backgroundColor: "#dc3545", color: "white", border: "none",cursor: "pointer" }}>
          Logout
        </button>
      </div>

      {booked && <p style={{ backgroundColor: "#d4edda", padding: "12px", color: "#155724" }}>Flight booked successfully!</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ backgroundColor: "#003580", color: "white" }}>
          <tr>
            <th style={th}>Flight</th>
            <th style={th}>From</th>
            <th style={th}>To</th>
            <th style={th}>Departure</th>
            <th style={th}>Arrival</th>
            <th style={th}>Aircraft</th>
            <th style={th}>Status</th>
            <th style={th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {flights.map((s) => (
            <tr key={s.schedule_id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={td}>{s.flights.flight_number}</td>
              <td style={td}>{s.flights.source.city} ({s.flights.source.airport_code})</td>
              <td style={td}>{s.flights.destination.city} ({s.flights.destination.airport_code})</td>
              <td style={td}>{new Date(s.departure_time).toLocaleString()}</td>
              <td style={td}>{new Date(s.arrival_time).toLocaleString()}</td>
              <td style={td}>{s.flights.aircraft_type}</td>
              <td style={td}>{s.status}</td>
              <td style={td}>
                <button
                  onClick={() => setSelectedFlight(s)}
                  style={{ padding: "6px 14px", backgroundColor: "#003580", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  Book
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const th = { padding: "12px", textAlign: "left" }
const td = { padding: "12px" }

export default FlightList
