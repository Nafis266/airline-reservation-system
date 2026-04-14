import { useState, useEffect } from "react"
import { supabase } from "../config/supabaseClient"

function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState("flights")

  const [flights, setFlights] = useState([])
  const [airports, setAirports] = useState([])
  const [newFlight, setNewFlight] = useState({ flight_number: "", source_airport_id: "", destination_airport_id: "", aircraft_type: "" })

  const [schedules, setSchedules] = useState([])
  const [newSchedule, setNewSchedule] = useState({ flight_id: "", departure_time: "", arrival_time: "", schedule_date: "", status: "On Time" })

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const { data: f } = await supabase.from("flights").select(`
      flight_id, flight_number, aircraft_type,
      source:airports!fk_source_airport(city, airport_code),
      destination:airports!fk_destination_airport(city, airport_code)
    `)
    const { data: a } = await supabase.from("airports").select("*")
    const { data: s } = await supabase.from("flight_schedule").select(`
      schedule_id, departure_time, arrival_time, schedule_date, status,
      flights!fk_flight_schedule_flight(flight_number)
    `).order("departure_time", { ascending: true })

    setFlights(f || [])
    setAirports(a || [])
    setSchedules(s || [])
  }

  async function addFlight() {
    setError(""); setMessage("")
    const { error } = await supabase.from("flights").insert(newFlight)
    if (error) setError(error.message)
    else { setMessage("Flight added!"); setNewFlight({ flight_number: "", source_airport_id: "", destination_airport_id: "", aircraft_type: "" }); fetchAll() }
  }

  async function addSchedule() {
    setError(""); setMessage("")
    const { error } = await supabase.from("flight_schedule").insert({
      ...newSchedule,
      flight_id: parseInt(newSchedule.flight_id),
      departure_time: new Date(newSchedule.departure_time).toISOString(),
      arrival_time: new Date(newSchedule.arrival_time).toISOString(),
      schedule_date: new Date(newSchedule.schedule_date).toISOString(),
    })
    if (error) setError(error.message)
    else { setMessage("Schedule added!"); setNewSchedule({ flight_id: "", departure_time: "", arrival_time: "", schedule_date: "", status: "On Time" }); fetchAll() }
  }

  async function deleteFlight(id) {
    const { error } = await supabase.from("flights").delete().eq("flight_id", id)
    if (error) setError(error.message)
    else { setMessage("Flight deleted!"); fetchAll() }
  }

  async function deleteSchedule(id) {
    const { error } = await supabase.from("flight_schedule").delete().eq("schedule_id", id)
    if (error) setError(error.message)
    else { setMessage("Schedule deleted!"); fetchAll() }
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial", backgroundColor: "#003580", minHeight: "100vh" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ color: "white", margin: 0 }}>Admin Panel</h1>
        <button onClick={onLogout} style={{ padding: "8px 16px", backgroundColor: "#dc3545", color: "white", border: "none", cursor: "pointer"}}>
          Logout
        </button>
      </div>

      <div style={{ marginBottom: "24px" }}>
        {["flights", "schedules"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 24px", marginRight: "8px", border: "none", cursor: "pointer",
            backgroundColor: tab === t ? "white" : "#002766",
            color: tab === t ? "#003580" : "white",
            fontWeight: tab === t ? "bold" : "normal"
          }}>
            {t === "flights" ? "Flights" : "Schedules"}
          </button>
        ))}
      </div>

      {message && <p style={{ backgroundColor: "#d4edda", padding: "10px", color: "#155724", borderRadius: "6px", marginBottom: "16px" }}>{message}</p>}
      {error && <p style={{ backgroundColor: "#f8d7da", padding: "10px", color: "#721c24", borderRadius: "6px", marginBottom: "16px" }}>{error}</p>}

      {tab === "flights" && (
        <div>
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Add New Flight</h3>
            <div style={styles.formRow}>
              <input style={styles.input} placeholder="Flight Number (e.g. AI101)" value={newFlight.flight_number} onChange={e => setNewFlight({ ...newFlight, flight_number: e.target.value })} />
              <input style={styles.input} placeholder="Aircraft Type (e.g. Boeing 737)" value={newFlight.aircraft_type} onChange={e => setNewFlight({ ...newFlight, aircraft_type: e.target.value })} />
            </div>
            <div style={styles.formRow}>
              <select style={styles.input} value={newFlight.source_airport_id} onChange={e => setNewFlight({ ...newFlight, source_airport_id: e.target.value })}>
                <option value="">Source Airport</option>
                {airports.map(a => <option key={a.airport_id} value={a.airport_id}>{a.city} ({a.airport_code})</option>)}
              </select>
              <select style={styles.input} value={newFlight.destination_airport_id} onChange={e => setNewFlight({ ...newFlight, destination_airport_id: e.target.value })}>
                <option value="">Destination Airport</option>
                {airports.map(a => <option key={a.airport_id} value={a.airport_id}>{a.city} ({a.airport_code})</option>)}
              </select>
            </div>
            <button style={styles.button} onClick={addFlight}>Add Flight</button>
          </div>

          <table style={styles.table}>
            <thead style={{ backgroundColor: "#002766", color: "white" }}>
              <tr>
                <th style={th}>Flight No.</th>
                <th style={th}>From</th>
                <th style={th}>To</th>
                <th style={th}>Aircraft</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {flights.map(f => (
                <tr key={f.flight_id} style={styles.row}>
                  <td style={td}>{f.flight_number}</td>
                  <td style={td}>{f.source.city} ({f.source.airport_code})</td>
                  <td style={td}>{f.destination.city} ({f.destination.airport_code})</td>
                  <td style={td}>{f.aircraft_type}</td>
                  <td style={td}>
                    <button onClick={() => deleteFlight(f.flight_id)} style={styles.deleteBtn}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "schedules" && (
        <div>
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Add New Schedule</h3>
            <div style={styles.formRow}>
              <select style={styles.input} value={newSchedule.flight_id} onChange={e => setNewSchedule({ ...newSchedule, flight_id: e.target.value })}>
                <option value="">Select Flight</option>
                {flights.map(f => <option key={f.flight_id} value={f.flight_id}>{f.flight_number}</option>)}
              </select>
              <select style={styles.input} value={newSchedule.status} onChange={e => setNewSchedule({ ...newSchedule, status: e.target.value })}>
                <option value="On Time">On Time</option>
                <option value="Delayed">Delayed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Departure Time</label>
                <input style={styles.input} type="datetime-local" value={newSchedule.departure_time} onChange={e => setNewSchedule({ ...newSchedule, departure_time: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Arrival Time</label>
                <input style={styles.input} type="datetime-local" value={newSchedule.arrival_time} onChange={e => setNewSchedule({ ...newSchedule, arrival_time: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={styles.label}>Schedule Date</label>
              <input style={{ ...styles.input, width: "48%" }} type="date" value={newSchedule.schedule_date} onChange={e => setNewSchedule({ ...newSchedule, schedule_date: e.target.value })} />
            </div>
            <button style={styles.button} onClick={addSchedule}>Add Schedule</button>
          </div>

          <table style={styles.table}>
            <thead style={{ backgroundColor: "#002766", color: "white" }}>
              <tr>
                <th style={th}>Flight</th>
                <th style={th}>Departure</th>
                <th style={th}>Arrival</th>
                <th style={th}>Status</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map(s => (
                <tr key={s.schedule_id} style={styles.row}>
                  <td style={td}>{s.flights.flight_number}</td>
                  <td style={td}>{new Date(s.departure_time).toLocaleString()}</td>
                  <td style={td}>{new Date(s.arrival_time).toLocaleString()}</td>
                  <td style={td}>{s.status}</td>
                  <td style={td}>
                    <button onClick={() => deleteSchedule(s.schedule_id)} style={styles.deleteBtn}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const th = { padding: "12px", textAlign: "left" }
const td = { padding: "12px" }

const styles = {
  formCard: { backgroundColor: "#001f4d", padding: "24px", marginBottom: "24px" },
  formTitle: { color: "white", marginTop: 0, marginBottom: "16px" },
  formRow: { display: "flex", gap: "12px", marginBottom: "12px" },
  label: { color: "#ccd9ff", fontSize: "12px", display: "block", marginBottom: "4px" },
  input: { flex: 1, padding: "10px", border: "1px solid #1a3a6b", backgroundColor: "#002766", color: "white", fontSize: "14px", boxSizing: "border-box", width: "100%" },
  button: { padding: "10px 24px", backgroundColor: "#1a56db", color: "white", border: "none", cursor: "pointer", fontSize: "14px", marginTop: "8px" },
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "white", overflow: "hidden" },
  row: { borderBottom: "1px solid #ddd" },
  deleteBtn: { padding: "6px 14px", backgroundColor: "#dc3545", color: "white", border: "none", cursor: "pointer" }
}

export default AdminPanel
