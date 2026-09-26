import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  BarChart3,
  Clock3,
  FileText,
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

function severityLabel(s) {
  return {
    1: 'Critical',
    2: 'High',
    3: 'Moderate',
    4: 'Low',
    5: 'Minor'
  }[s] || 'Unknown'
}

function App() {
  const [page, setPage] = useState('dashboard')

  const [patients, setPatients] = useState([])
  const [history, setHistory] = useState([])

  const [form, setForm] = useState(initialForm)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)

      const [waitingResponse, allResponse] = await Promise.all([
        fetch('/api/patients?status=waiting'),
        fetch('/api/patients?status=all')
      ])

      if (!waitingResponse.ok || !allResponse.ok) {
        throw new Error('Unable to load patient data')
      }

      const waitingData = await waitingResponse.json()
      const allData = await allResponse.json()

      setPatients(waitingData.patients || [])

      setHistory(
        (allData.patients || []).filter(
          patient => patient.status === 'discharged'
        )
      )

      setError('')
    } catch {
      setError(
        'Could not connect to the server. Start the backend with npm run dev.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    return patients.filter(patient => {
      const name = patient.name || ''
      const symptoms = patient.symptoms || ''

      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        symptoms.toLowerCase().includes(search.toLowerCase())

      const matchesFilter =
        filter === 'all' || String(patient.severity) === filter

      return matchesSearch && matchesFilter
    })
  }, [patients, search, filter])

  const submit = async event => {
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

      await load()
      setPage('patients')
    } catch (err) {
      setError(err.message)
    }
  }

  const discharge = async id => {
    if (!window.confirm('Discharge this patient?')) return

    try {
      const response = await fetch(`/api/patients/${id}/discharge`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to discharge patient')
      }

      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const critical = patients.filter(patient => patient.severity === 1).length
  const high = patients.filter(patient => patient.severity === 2).length

  const totalPatients = patients.length + history.length

  const severityCounts = {
    1: patients.filter(p => p.severity === 1).length,
    2: patients.filter(p => p.severity === 2).length,
    3: patients.filter(p => p.severity === 3).length,
    4: patients.filter(p => p.severity === 4).length,
    5: patients.filter(p => p.severity === 5).length
  }

  const navigate = selectedPage => {
    setPage(selectedPage)
    setSearch('')
    setFilter('all')
    setError('')
  }

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
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

          <a
            className={page === 'dashboard' ? 'active' : ''}
            onClick={() => navigate('dashboard')}
          >
            Dashboard
          </a>

          <a
            className={page === 'patients' ? 'active' : ''}
            onClick={() => navigate('patients')}
          >
            Patients
          </a>

          <a
            className={page === 'history' ? 'active' : ''}
            onClick={() => navigate('history')}
          >
            Patient History
          </a>

          <a
            className={page === 'reports' ? 'active' : ''}
            onClick={() => navigate('reports')}
          >
            Reports
          </a>

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

      {/* MAIN CONTENT */}
      <main className="main">

        {error && (
          <div className="error">
            <AlertCircle size={18} />

            {error}

            <button onClick={() => setError('')}>
              <X size={17} />
            </button>
          </div>
        )}

        {/* DASHBOARD */}
        {page === 'dashboard' && (
          <Dashboard
            patients={patients}
            history={history}
            critical={critical}
            high={high}
            loading={loading}
            filtered={filtered}
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            discharge={discharge}
            setShowModal={setShowModal}
          />
        )}

        {/* PATIENTS */}
        {page === 'patients' && (
          <PatientsPage
            patients={patients}
            filtered={filtered}
            loading={loading}
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            discharge={discharge}
            setShowModal={setShowModal}
          />
        )}

        {/* PATIENT HISTORY */}
        {page === 'history' && (
          <HistoryPage
            history={history}
            search={search}
            setSearch={setSearch}
          />
        )}

        {/* REPORTS */}
        {page === 'reports' && (
          <ReportsPage
            patients={patients}
            history={history}
            totalPatients={totalPatients}
            critical={critical}
            high={high}
            severityCounts={severityCounts}
          />
        )}

      </main>

      {/* ADMIT PATIENT MODAL */}
      {showModal && (
        <div className="modal-backdrop">

          <div className="modal">

            <div className="modal-head">

              <div>
                <h2>Admit New Patient</h2>
                <p>Enter triage information</p>
              </div>

              <button onClick={() => setShowModal(false)}>
                <X />
              </button>

            </div>

            <form onSubmit={submit}>

              <label>
                Patient Name

                <input
                  required
                  value={form.name}
                  onChange={event =>
                    setForm({
                      ...form,
                      name: event.target.value
                    })
                  }
                />
              </label>

              <div className="two">

                <label>
                  Age

                  <input
                    type="number"
                    min="0"
                    max="130"
                    value={form.age}
                    onChange={event =>
                      setForm({
                        ...form,
                        age: event.target.value
                      })
                    }
                  />
                </label>

                <label>
                  Gender

                  <select
                    value={form.gender}
                    onChange={event =>
                      setForm({
                        ...form,
                        gender: event.target.value
                      })
                    }
                  >
                    <option>Not specified</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>

                </label>

              </div>

              <label>
                Symptoms

                <textarea
                  rows="3"
                  value={form.symptoms}
                  onChange={event =>
                    setForm({
                      ...form,
                      symptoms: event.target.value
                    })
                  }
                />
              </label>

              <label>
                Severity Level

                <select
                  required
                  value={form.severity}
                  onChange={event =>
                    setForm({
                      ...form,
                      severity: event.target.value
                    })
                  }
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

function Dashboard({
  patients,
  history,
  critical,
  high,
  loading,
  filtered,
  search,
  setSearch,
  filter,
  setFilter,
  discharge,
  setShowModal
}) {
  return (
    <>
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

      <section className="stats">

        <Stat
          icon={<Users />}
          label="Waiting Patients"
          value={patients.length}
        />

        <Stat
          icon={<AlertCircle />}
          label="Critical"
          value={critical}
        />

        <Stat
          icon={<Clock3 />}
          label="High Priority"
          value={high}
        />

        <Stat
          icon={<LogOut />}
          label="Discharged"
          value={history.length}
        />

      </section>

      <PatientTable
        title="Waiting Patients"
        description="Patients are automatically ordered by severity."
        patients={filtered}
        loading={loading}
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        discharge={discharge}
        showDischargeHighest
        allPatients={patients}
      />

      <section className="panel history">

        <div className="panel-head">

          <div>
            <h2>Recent Discharges</h2>
            <p>Completed patient visits</p>
          </div>

        </div>

        {history.length === 0 ? (
          <div className="empty">
            No discharged patients yet.
          </div>
        ) : (
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
    </>
  )
}
function PatientsPage({
  patients,
  filtered,
  loading,
  search,
  setSearch,
  filter,
  setFilter,
  discharge,
  setShowModal
}) {
  return (
    <>
      <header className="topbar">

        <div>
          <h1>Patients</h1>

          <p>
            View and manage currently admitted patients
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

      <section className="stats">

        <Stat
          icon={<Users />}
          label="Waiting Patients"
          value={patients.length}
        />

        <Stat
          icon={<AlertCircle />}
          label="Critical"
          value={patients.filter(p => p.severity === 1).length}
        />

        <Stat
          icon={<Clock3 />}
          label="High Priority"
          value={patients.filter(p => p.severity === 2).length}
        />

      </section>

      <PatientTable
        title="All Waiting Patients"
        description="Search, filter and discharge patients."
        patients={filtered}
        loading={loading}
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        discharge={discharge}
        allPatients={patients}
      />
    </>
  )
}

function PatientTable({
  title,
  description,
  patients,
  loading,
  search,
  setSearch,
  filter,
  setFilter,
  discharge,
  showDischargeHighest,
  allPatients
}) {
  return (
    <section className="panel">

      <div className="panel-head">

        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        {showDischargeHighest && allPatients[0] && (
          <button
            className="danger"
            onClick={() => discharge(allPatients[0].id)}
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
            onChange={event =>
              setSearch(event.target.value)
            }
            placeholder="Search patient or symptoms..."
          />

        </div>

        <select
          value={filter}
          onChange={event =>
            setFilter(event.target.value)
          }
        >
          <option value="all">All severity</option>
          <option value="1">1 - Critical</option>
          <option value="2">2 - High</option>
          <option value="3">3 - Moderate</option>
          <option value="4">4 - Low</option>
          <option value="5">5 - Minor</option>
        </select>

      </div>

      {loading ? (
        <div className="empty">
          Loading patients...
        </div>
      ) : patients.length === 0 ? (
        <div className="empty">
          No waiting patients found.
        </div>
      ) : (

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

              {patients.map((patient, index) => (

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
                      ID:{' '}
                      {patient.id?.slice(0, 8)}
                    </small>

                  </td>

                  <td>
                    {patient.age || '—'} /{' '}
                    {patient.gender}
                  </td>

                  <td>
                    {patient.symptoms ||
                      'Not specified'}
                  </td>

                  <td>
                    {patient.admittedAt
                      ? new Date(
                          patient.admittedAt
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '—'}
                  </td>

                  <td>

                    <button
                      className="link-btn"
                      onClick={() =>
                        discharge(patient.id)
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
  )
}

function HistoryPage({
  history,
  search,
  setSearch
}) {
  const filteredHistory = history.filter(patient => {

    const name = patient.name || ''
    const symptoms = patient.symptoms || ''

    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      symptoms.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <>
      <header className="topbar">

        <div>

          <h1>Patient History</h1>

          <p>
            View completed and discharged patient visits
          </p>

        </div>

      </header>

      <section className="panel">

        <div className="panel-head">

          <div>
            <h2>Discharged Patients</h2>

            <p>
              Previous emergency room visits
            </p>
          </div>

        </div>

        <div className="toolbar">

          <div className="search">

            <Search size={18} />

            <input
              value={search}
              onChange={event =>
                setSearch(event.target.value)
              }
              placeholder="Search patient history..."
            />

          </div>

        </div>

        {filteredHistory.length === 0 ? (

          <div className="empty">
            No patient history found.
          </div>

        ) : (

          <div className="table-wrap">

            <table>

              <thead>

                <tr>
                  <th>Patient</th>
                  <th>Age / Gender</th>
                  <th>Symptoms</th>
                  <th>Severity</th>
                  <th>Admitted</th>
                  <th>Discharged</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                {filteredHistory.map(patient => (

                  <tr key={patient.id}>

                    <td>

                      <b>{patient.name}</b>

                      <small>
                        ID:{' '}
                        {patient.id?.slice(0, 8)}
                      </small>

                    </td>

                    <td>
                      {patient.age || '—'} /{' '}
                      {patient.gender}
                    </td>

                    <td>
                      {patient.symptoms ||
                        'Not specified'}
                    </td>

                    <td>

                      <span
                        className={`priority p${patient.severity}`}
                      >
                        {severityLabel(
                          patient.severity
                        )}
                      </span>

                    </td>

                    <td>
                      {patient.admittedAt
                        ? new Date(
                            patient.admittedAt
                          ).toLocaleString()
                        : '—'}
                    </td>

                    <td>
                      {patient.dischargedAt
                        ? new Date(
                            patient.dischargedAt
                          ).toLocaleString()
                        : '—'}
                    </td>

                    <td>

                      <span className="done">
                        Discharged
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>
    </>
  )
}

function ReportsPage({
  patients,
  history,
  totalPatients,
  critical,
  high,
  severityCounts
}) {
  return (
    <>
      <header className="topbar">

        <div>

          <h1>Reports</h1>

          <p>
            Emergency room patient statistics and reports
          </p>

        </div>

      </header>

      <section className="stats">

        <Stat
          icon={<Users />}
          label="Total Patients"
          value={totalPatients}
        />

        <Stat
          icon={<Clock3 />}
          label="Currently Waiting"
          value={patients.length}
        />

        <Stat
          icon={<AlertCircle />}
          label="Critical Patients"
          value={critical}
        />

        <Stat
          icon={<LogOut />}
          label="Discharged"
          value={history.length}
        />

      </section>

      <section className="panel">

        <div className="panel-head">

          <div>

            <h2>
              Patient Severity Report
            </h2>

            <p>
              Current waiting patients by severity level
            </p>

          </div>

          <BarChart3 size={22} />

        </div>

        <div className="history-grid">

          {[1, 2, 3, 4, 5].map(level => (

            <div
              className="history-card"
              key={level}
            >

              <div>

                <b>
                  Severity {level}
                </b>

                <span>
                  {severityLabel(level)}
                </span>

              </div>

              <span className={`priority p${level}`}>
                {severityCounts[level]}
              </span>

            </div>

          ))}

        </div>

      </section>

      <section className="panel">

        <div className="panel-head">

          <div>

            <h2>
              Emergency Room Summary
            </h2>

            <p>
              Current patient management summary
            </p>

          </div>

          <FileText size={22} />

        </div>

        <div className="history-grid">

          <div className="history-card">

            <div>
              <b>Waiting Patients</b>
              <span>
                Patients currently waiting for treatment
              </span>
            </div>

            <strong>
              {patients.length}
            </strong>

          </div>

          <div className="history-card">

            <div>
              <b>High Priority</b>
              <span>
                Severity 2 patients
              </span>
            </div>

            <strong>
              {high}
            </strong>

          </div>

          <div className="history-card">

            <div>
              <b>Completed Visits</b>
              <span>
                Patients who have been discharged
              </span>
            </div>

            <strong>
              {history.length}
            </strong>

          </div>

        </div>

      </section>
    </>
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
