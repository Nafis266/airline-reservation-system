import { useEffect, useState } from "react"
import { supabase } from "../config/supabaseClient"

function FlightList() {
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFlights() {
      const { data, error } = await supabase
        .from("flight_schedule")
        .select(`
          schedule_id,
          departure_time,
          arrival_time,
          status,
          flights (
            flight_number,
            aircraft_type,
            source:airports!flights_source_airport_id_fkey (city, airport_code),
            destination:airports!flights_destination_airport_id_fkey (city, airport_code)
          )
        `)
        .neq("status", "Cancelled")
        .order("departure_time", { ascending: true })

      if (error) console.error(error)
      else setFlights(data)
      setLoading(false)
    }

    fetchFlights()
  }, [])

  if (loading) return <p style={{ textAlign: "center" }}>Loading flights...</p>

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Available Flights</h1>
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
              <td style={td}>
                <span style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  backgroundColor: s.status === "On Time" ? "#d4edda" : "#fff3cd",
                  color: s.status === "On Time" ? "#155724" : "#856404"
                }}>
                  {s.status}
                </span>
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
