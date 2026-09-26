import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  Clock3,
  LogOut,
  Plus,
  Search,
  Users,
  X
} from 'lucide-react'

const initialForm = {
  name: '',
  age: '',
  gender: 'Not specified',
  symptoms: '',
  severity: '3'
}

function severityLabel(severity) {
  const labels = {
    1: 'Critical',
    2: 'High',
    3: 'Moderate',
    4: 'Low',
    5: 'Minor'
  }

  return labels[severity] || 'Unknown'
}

function App() {
  const [patients, setPatients] = useState([])
  const [history, setHistory] = useState([])
  const [form, setForm] = useState(initialForm)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPatients = async () => {
    setLoading(true)

    try {
      const waitingResponse = await fetch('/api/patients?status=waiting')
      const allResponse = await fetch('/api/patients?status=all')

      const waitingData = await waitingResponse.json()
      const allData = await allResponse.json()

      setPatients(waitingData.patients || [])

      const dischargedPatients = (allData.patients || []).filter(
        patient => patient.status === 'discharged'
      )

      setHistory(dischargedPatients)
      setError('')
    } catch (error) {
      setError(
        'Could not connect to the server. Start the backend with npm run dev.'
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    loadPatients()
  }, [])

  const filteredPatients = useMemo(() => {
    const searchText = search.toLowerCase()

    return patients.filter(patient => {
      const patientName = (patient.name || '').toLowerCase()
      const patientSymptoms = (patient.symptoms || '').toLowerCase()

      const matchesSearch =
        patientName.includes(searchText) ||
        patientSymptoms.includes(searchText)

      const matchesFilter =
        filter === 'all' || String(patient.severity) === filter

      return matchesSearch && matchesFilter
    })
  }, [patients, search, filter])

  const handleFormChange = event => {
    const { name, value } = event.target

    setForm({
      ...form,
      [name]: value
    })
  }

  const submitPatient = async event => {
    event.preventDefault()

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          severity: Number(form.severity)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to admit patient')
      }

      setForm(initialForm)
      setShowModal(false)
      setError('')

      await loadPatients()
    } catch (error) {
      setError(error.message)
    }
  }

  const dischargePatient = async patient => {
    const confirmDischarge = window.confirm(
      `Discharge ${patient.name}?`
    )

    if (!confirmDischarge) {
      return
    }

    try {
      const response = await fetch(
        `/api/patients/${patient.id}/discharge`,
        {
          method: 'POST'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to discharge patient')
      }

      setError('')
      await loadPatients()
    } catch (error) {
      setError(error.message)
    }
  }

  const criticalPatients = patients.filter(
    patient => patient.severity === 1
  ).length

  const highPriorityPatients = patients.filter(
    patient => patient.severity === 2
  ).length

  return (
    <div className="app-shell">

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            <Activity size={25} />
          </div>

          <div>
            <strong>ER Care</strong>
            <span>Patient Management</span>
          </div>
        </div>

        <nav>
          <a className="active">Dashboard</a>
          <a>Patients</a>
          <a>Patient History</a>
          <a>Reports</a>
        </nav>

        <div className="side-note">
          <AlertCircle size={18} />

          <div>
            <b>Priority rule</b>

            <p>
              Severity 1 is treated before severity 2–5.
            </p>
          </div>
        </div>

      </aside>

      <main className="main">

        <header className="topbar">

          <div>
            <h1>Emergency Room Dashboard</h1>

            <p>
              Real-time patient triage and priority management
            </p>
          </div>

          <button
            className="primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} />
            Admit Patient
          </button>

        </header>

        {error && (
          <div className="error">

            <AlertCircle size={18} />

            <span>{error}</span>

            <button onClick={() => setError('')}>
              <X size={17} />
            </button>

          </div>
        )}

        <section className="stats">

          <Stat
            icon={<Users />}
            label="Waiting Patients"
            value={patients.length}
          />

          <Stat
            icon={<AlertCircle />}
            label="Critical"
            value={criticalPatients}
          />

          <Stat
            icon={<Clock3 />}
            label="High Priority"
            value={highPriorityPatients}
          />

          <Stat
            icon={<LogOut />}
            label="Total Discharged"
            value={history.length}
          />

        </section>

        <section className="panel">

          <div className="panel-head">

            <div>
              <h2>Waiting Patients</h2>

              <p>
                Patients are automatically ordered by severity.
              </p>
            </div>

            {patients.length > 0 && (
              <button
                className="danger"
                onClick={() => dischargePatient(patients[0])}
              >
                Discharge Highest Priority
              </button>
            )}

          </div>

          <div className="toolbar">

            <div className="search">

              <Search size={18} />

              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search patient or symptoms..."
              />

            </div>

            <select
              value={filter}
              onChange={event => setFilter(event.target.value)}
            >

              <option value="all">
                All severity
              </option>

              <option value="1">
                1 - Critical
              </option>

              <option value="2">
                2 - High
              </option>

              <option value="3">
                3 - Moderate
              </option>

              <option value="4">
                4 - Low
              </option>

              <option value="5">
                5 - Minor
              </option>

            </select>

          </div>

          {loading && (
            <div className="empty">
              Loading patients...
            </div>
          )}

          {!loading && filteredPatients.length === 0 && (
            <div className="empty">
              No waiting patients found.
            </div>
          )}

          {!loading && filteredPatients.length > 0 && (
            <div className="table-wrap">

              <table>

                <thead>

                  <tr>
                    <th>Priority</th>
                    <th>Patient</th>
                    <th>Age / Gender</th>
                    <th>Symptoms</th>
                    <th>Admitted</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredPatients.map((patient, index) => (

                    <tr key={patient.id}>

                      <td>

                        <span
                          className={`priority p${patient.severity}`}
                        >
                          #{index + 1} ·{' '}
                          {severityLabel(patient.severity)}
                        </span>

                      </td>

                      <td>

                        <b>{patient.name}</b>

                        <small>
                          ID: {patient.id.slice(0, 8)}
                        </small>

                      </td>

                      <td>
                        {patient.age || '—'} / {patient.gender}
                      </td>

                      <td>
                        {patient.symptoms || 'Not specified'}
                      </td>

                      <td>
                        {new Date(
                          patient.admittedAt
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td>

                        <button
                          className="link-btn"
                          onClick={() =>
                            dischargePatient(patient)
                          }
                        >
                          Discharge
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </section>

        <section className="panel history">

          <div className="panel-head">

            <div>

              <h2>Recent Discharges</h2>

              <p>
                Completed patient visits
              </p>

            </div>

          </div>

          {history.length === 0 && (
            <div className="empty">
              No discharged patients yet.
            </div>
          )}

          {history.length > 0 && (
            <div className="history-grid">

              {history.slice(0, 6).map(patient => (

                <div
                  className="history-card"
                  key={patient.id}
                >

                  <div>

                    <b>{patient.name}</b>

                    <span>
                      {patient.symptoms ||
                        'No symptoms recorded'}
                    </span>

                  </div>

                  <span className="done">
                    Discharged
                  </span>

                </div>

              ))}

            </div>
          )}

        </section>

      </main>

      {showModal && (

        <div className="modal-backdrop">

          <div className="modal">

            <div className="modal-head">

              <div>

                <h2>Admit New Patient</h2>

                <p>
                  Enter triage information
                </p>

              </div>

              <button
                onClick={() => setShowModal(false)}
              >
                <X />
              </button>

            </div>

            <form onSubmit={submitPatient}>

              <label>
                Patient Name

                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleFormChange}
                />

              </label>

              <div className="two">

                <label>
                  Age

                  <input
                    type="number"
                    name="age"
                    min="0"
                    max="130"
                    value={form.age}
                    onChange={handleFormChange}
                  />

                </label>

                <label>
                  Gender

                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleFormChange}
                  >

                    <option value="Not specified">
                      Not specified
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </label>

              </div>

              <label>
                Symptoms

                <textarea
                  name="symptoms"
                  rows="3"
                  value={form.symptoms}
                  onChange={handleFormChange}
                />

              </label>

              <label>
                Severity Level

                <select
                  name="severity"
                  required
                  value={form.severity}
                  onChange={handleFormChange}
                >

                  <option value="1">
                    1 — Critical / Highest urgency
                  </option>

                  <option value="2">
                    2 — High urgency
                  </option>

                  <option value="3">
                    3 — Moderate urgency
                  </option>

                  <option value="4">
                    4 — Low urgency
                  </option>

                  <option value="5">
                    5 — Minor / Lowest urgency
                  </option>

                </select>

              </label>

              <button
                className="primary full"
                type="submit"
              >
                Admit Patient
              </button>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">

      <div className="stat-icon">
        {icon}
      </div>

      <div>

        <span>{label}</span>

        <strong>{value}</strong>

      </div>

    </div>
  )
}

export default App
