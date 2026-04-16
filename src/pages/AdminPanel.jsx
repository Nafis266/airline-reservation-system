import { useState, useEffect } from "react"
import { supabase } from "../config/supabaseClient"

function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState("flights")

  const [flights, setFlights] = useState([])
  const [airports, setAirports] = useState([])
  const [newFlight, setNewFlight] = useState({ flight_id: "", flight_number: "", source_airport_id: "", destination_airport_id: "", aircraft_type: "" })

  const [schedules, setSchedules] = useState([])
  const [newSchedule, setNewSchedule] = useState({ flight_id: "", departure_time: "", arrival_time: "", schedule_date: "", status: "On Time" })

  const [crew, setCrew] = useState([])
  const [newCrew, setNewCrew] = useState({ crew_id: "",name: "", role: "", license_number: "" })

  const [assignments, setAssignments] = useState([])
  const [newAssignment, setNewAssignment] = useState({ crew_id: "", flight_id: "" })

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
    const { data: c } = await supabase.from("crew").select("*").order("name", { ascending: true })
    const { data: asgn } = await supabase.from("flight_crew").select(`
      crew_id, flight_id,
      crew(name, role),
      flights(flight_number)
    `)

    setFlights(f || [])
    setAirports(a || [])
    setSchedules(s || [])
    setCrew(c || [])
    setAssignments(asgn || [])
  }

  async function addFlight() {
    setError("");
    const { error } = await supabase.from("flights").insert({
      ...newFlight,
      flight_id: parseInt(newFlight.flight_id),
      source_airport_id: parseInt(newFlight.source_airport_id),
      destination_airport_id: parseInt(newFlight.destination_airport_id),
    })
    if (error) setError(error.message)
    else {
      setNewFlight({ flight_id: "", flight_number: "", source_airport_id: "", destination_airport_id: "", aircraft_type: "" })
      fetchAll()
    }
  }

  async function addSchedule() {
    setError("");
    const { error } = await supabase.from("flight_schedule").insert({
      ...newSchedule,
      flight_id: parseInt(newSchedule.flight_id),
      departure_time: new Date(newSchedule.departure_time).toISOString(),
      arrival_time: new Date(newSchedule.arrival_time).toISOString(),
      schedule_date: newSchedule.schedule_date,
    })
    if (error) setError(error.message)
    else {
      setNewSchedule({ flight_id: "", departure_time: "", arrival_time: "", schedule_date: "", status: "On Time" })
      fetchAll()
    }
  }

  async function addCrew() {
    setError("");
    if (!newCrew.crew_id || !newCrew.name || !newCrew.role || !newCrew.license_number) {
      setError("All crew fields are required.")
      return
    }
    const { error } = await supabase.from("crew").insert({
    crew_id: parseInt(newCrew.crew_id),
    name: newCrew.name,
    role: newCrew.role,
    license_number: newCrew.license_number
    })
    if (error) setError(error.message)
    else {
      setNewCrew({ crew_id: "", name: "", role: "", license_number: "" })
      fetchAll()
    }
  }

  async function deleteCrew(id) {
    setError("");
    const { error: assignError } = await supabase
    .from("flight_crew")
    .delete()
    .eq("crew_id", id);

    if (assignError) {
      setError(assignError.message);
      return;
    }
    const { error: crewError } = await supabase
    .from("crew")
    .delete()
    .eq("crew_id", id);
    
    if (crewError) setError(crewError.message)
    else fetchAll()
  }

  async function addAssignment() {
    setError("");
    if (!newAssignment.crew_id || !newAssignment.flight_id) {
      setError("Please select both a crew member and a flight.")
      return
    }
    const alreadyAssigned = assignments.some(
      a => String(a.crew_id) === String(newAssignment.crew_id) && String(a.flight_id) === String(newAssignment.flight_id)
    )
    if (alreadyAssigned) {
      setError("This crew member is already assigned to that flight.")
      return
    }
    const { error } = await supabase.from("flight_crew").insert({
      crew_id: parseInt(newAssignment.crew_id),
      flight_id: parseInt(newAssignment.flight_id),
    })
    if (error) setError(error.message)
    else {
      setNewAssignment({ crew_id: "", flight_id: "" })
      fetchAll()
    }
  }

  async function deleteAssignment(crew_id, flight_id) {
    setError("");
    const { error } = await supabase.from("flight_crew")
      .delete()
      .eq("crew_id", crew_id)
      .eq("flight_id", flight_id)
    if (error) setError(error.message)
    else fetchAll()
  }

  async function deleteFlight(id) {
    setError(""); setMessage("")
    const { error } = await supabase.from("flights").delete().eq("flight_id", id)
    if (error) setError(error.message)
    else fetchAll()
  }

  async function deleteSchedule(id) {
    setError("");
    const { error } = await supabase.from("flight_schedule").delete().eq("schedule_id", id)
    if (error) setError(error.message)
    else fetchAll()
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial", backgroundColor: "#003580", minHeight: "100vh" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ color: "white", margin: 0 }}>Admin Panel</h1>
        <button onClick={onLogout} style={{ padding: "8px 16px", backgroundColor: "#dc3545", color: "white", border: "none", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      <div style={{ marginBottom: "24px" }}>
        {["flights", "schedules", "crew", "assign_crew"].map(t => (
          <button key={t} onClick={() => { setError("");setTab(t) }} style={{
            padding: "10px 24px", marginRight: "8px", border: "none", cursor: "pointer",
            backgroundColor: tab === t ? "white" : "#002766",
            color: tab === t ? "#003580" : "white",
            fontWeight: tab === t ? "bold" : "normal"
          }}>
            {t === "flights" ? "Flights" : t === "schedules" ? "Schedules" : t === "crew" ? "Crew" : "Assign Crew"}
          </button>
        ))}
      </div>

      {error && <p style={{ backgroundColor: "#f8d7da", padding: "10px", color: "#721c24", borderRadius: "6px", marginBottom: "16px" }}>{error}</p>}

      {tab === "flights" && (
        <div>
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Add New Flight</h3>
            <div style={styles.formRow}>
              <input style={styles.input} placeholder="Flight ID (e.g. 101)" value={newFlight.flight_id} onChange={e => setNewFlight({ ...newFlight, flight_id: e.target.value })} />
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
                <th style={th}>Flight ID</th><th style={th}>Flight No.</th><th style={th}>From</th>
                <th style={th}>To</th><th style={th}>Aircraft</th><th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {flights.map(f => (
                <tr key={f.flight_id} style={styles.row}>
                  <td style={td}>{f.flight_id}</td>
                  <td style={td}>{f.flight_number}</td>
                  <td style={td}>{f.source.city} ({f.source.airport_code})</td>
                  <td style={td}>{f.destination.city} ({f.destination.airport_code})</td>
                  <td style={td}>{f.aircraft_type}</td>
                  <td style={td}><button onClick={() => deleteFlight(f.flight_id)} style={styles.deleteBtn}>Delete</button></td>
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
                <th style={th}>Flight</th><th style={th}>Departure</th><th style={th}>Arrival</th>
                <th style={th}>Status</th><th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map(s => (
                <tr key={s.schedule_id} style={styles.row}>
                  <td style={td}>{s.flights.flight_number}</td>
                  <td style={td}>{new Date(s.departure_time).toLocaleString()}</td>
                  <td style={td}>{new Date(s.arrival_time).toLocaleString()}</td>
                  <td style={td}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold",
                      backgroundColor: s.status === "On Time" ? "#d4edda" : s.status === "Delayed" ? "#fff3cd" : "#f8d7da",
                      color: s.status === "On Time" ? "#155724" : s.status === "Delayed" ? "#856404" : "#721c24"
                    }}>{s.status}</span>
                  </td>
                  <td style={td}><button onClick={() => deleteSchedule(s.schedule_id)} style={styles.deleteBtn}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "crew" && (
        <div>
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Add New Crew Member</h3>
            <div style={styles.formRow}>
              <input style={styles.input} placeholder="crew id (e.g 1)" value={newCrew.crew_id} onChange={e => setNewCrew({...newCrew, crew_id: e.target.value})} />
              <input style={styles.input} placeholder="Full Name" value={newCrew.name} onChange={e => setNewCrew({ ...newCrew, name: e.target.value })} />
              <select style={styles.input} value={newCrew.role} onChange={e => setNewCrew({ ...newCrew, role: e.target.value })}>
                <option value="">Select Role</option>
                <option value="Pilot">Pilot</option>
                <option value="Co-Pilot">Co-Pilot</option>
                <option value="Flight Attendant">Flight Attendant</option>
                <option value="Engineer">Engineer</option>
                <option value="Ground Staff">Ground Staff</option>
              </select>
              <input style={styles.input} placeholder="License Number" value={newCrew.license_number} onChange={e => setNewCrew({ ...newCrew, license_number: e.target.value })} />
            </div>
            <button style={styles.button} onClick={addCrew}>Add Crew Member</button>
          </div>

          <table style={styles.table}>
            <thead style={{ backgroundColor: "#002766", color: "white" }}>
              <tr>
                <th style={th}>Crew ID</th><th style={th}>Name</th><th style={th}>Role</th>
                <th style={th}>License Number</th><th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {crew.length === 0 && (
                <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: "#666" }}>No crew members found.</td></tr>
              )}
              {crew.map(c => (
                <tr key={c.crew_id} style={styles.row}>
                  <td style={td}>{c.crew_id}</td>
                  <td style={td}>{c.name}</td>
                  <td style={td}>{c.role}</td>
                  <td style={td}>{c.license_number}</td>
                  <td style={td}><button onClick={() => deleteCrew(c.crew_id)} style={styles.deleteBtn}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "assign_crew" && (
        <div>
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Assign Crew to Flight</h3>
            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Crew Member</label>
                <select style={styles.input} value={newAssignment.crew_id} onChange={e => setNewAssignment({ ...newAssignment, crew_id: e.target.value })}>
                  <option value="">Select Crew Member</option>
                  {crew.map(c => (
                    <option key={c.crew_id} value={c.crew_id}>{c.name} — {c.role}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Flight</label>
                <select style={styles.input} value={newAssignment.flight_id} onChange={e => setNewAssignment({ ...newAssignment, flight_id: e.target.value })}>
                  <option value="">Select Flight</option>
                  {flights.map(f => (
                    <option key={f.flight_id} value={f.flight_id}>
                      {f.flight_number} ({f.source?.airport_code} → {f.destination?.airport_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button style={styles.button} onClick={addAssignment}>Assign Crew</button>
          </div>

          <table style={styles.table}>
            <thead style={{ backgroundColor: "#002766", color: "white" }}>
              <tr>
                <th style={th}>Crew Member</th><th style={th}>Role</th>
                <th style={th}>Flight</th><th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 && (
                <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: "#666" }}>No assignments found.</td></tr>
              )}
              {assignments.map((a, idx) => (
                <tr key={idx} style={styles.row}>
                  <td style={td}>{a.crew?.name}</td>
                  <td style={td}>{a.crew?.role}</td>
                  <td style={td}>{a.flights?.flight_number}</td>
                  <td style={td}>
                    <button onClick={() => deleteAssignment(a.crew_id, a.flight_id)} style={styles.deleteBtn}>Remove</button>
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

function roleColor(role) {
  switch (role) {
    case "Pilot":            return { bg: "#cce5ff", text: "#004085" }
    case "Co-Pilot":         return { bg: "#d1ecf1", text: "#0c5460" }
    case "Flight Attendant": return { bg: "#d4edda", text: "#155724" }
    case "Engineer":         return { bg: "#fff3cd", text: "#856404" }
    case "Ground Staff":     return { bg: "#f8d7da", text: "#721c24" }
    default:                 return { bg: "#e2e3e5", text: "#383d41" }
  }
}

const th = { padding: "12px", textAlign: "left" }
const td = { padding: "12px" }

const styles = {
  formCard:  { backgroundColor: "#001f4d", padding: "24px", marginBottom: "24px" },
  formTitle: { color: "white", marginTop: 0, marginBottom: "16px" },
  formRow:   { display: "flex", gap: "12px", marginBottom: "12px" },
  label:     { color: "#ccd9ff", fontSize: "12px", display: "block", marginBottom: "4px" },
  input:     { flex: 1, padding: "10px", border: "1px solid #1a3a6b", backgroundColor: "#002766", color: "white", fontSize: "14px", boxSizing: "border-box", width: "100%" },
  button:    { padding: "10px 24px", backgroundColor: "#1a56db", color: "white", border: "none", cursor: "pointer", fontSize: "14px", marginTop: "8px" },
  table:     { width: "100%", borderCollapse: "collapse", backgroundColor: "white", overflow: "hidden" },
  row:       { borderBottom: "1px solid #ddd" },
  deleteBtn: { padding: "6px 14px", backgroundColor: "#dc3545", color: "white", border: "none", cursor: "pointer" }
}

export default AdminPanel
