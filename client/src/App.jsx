import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertCircle, Clock3, LogOut, Plus, Search, Users, X } from 'lucide-react'

const initialForm = { name: '', age: '', gender: 'Not specified', symptoms: '', severity: '3' }

function severityLabel(s) {
  return ({1:'Critical',2:'High',3:'Moderate',4:'Low',5:'Minor'})[s] || 'Unknown'
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

  const load = async () => {
    try {
      setLoading(true)
      const [p, h] = await Promise.all([
        fetch('/api/patients?status=waiting').then(r => r.json()),
        fetch('/api/patients?status=all').then(r => r.json())
      ])
      setPatients(p.patients || [])
      setHistory((h.patients || []).filter(x => x.status === 'discharged'))
      setError('')
    } catch {
      setError('Could not connect to the server. Start the backend with npm run dev.')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.symptoms.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || String(p.severity) === filter
    return matchesSearch && matchesFilter
  }), [patients, search, filter])

  const submit = async e => {
    e.preventDefault()
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...form, age: Number(form.age), severity: Number(form.severity)})
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Unable to admit patient')
      setForm(initialForm); setShowModal(false); await load()
    } catch (err) { setError(err.message) }
  }

  const discharge = async id => {
    if (!window.confirm('Discharge the highest-priority selected patient?')) return
    try {
      const res = await fetch(`/api/patients/${id}/discharge`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      await load()
    } catch (err) { setError(err.message) }
  }

  const critical = patients.filter(p => p.severity === 1).length
  const high = patients.filter(p => p.severity === 2).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Activity size={25}/></div>
          <div><strong>ER Care</strong><span>Patient Management</span></div>
        </div>
        <nav>
          <a className="active">Dashboard</a>
          <a>Patients</a>
          <a>Patient History</a>
          <a>Reports</a>
        </nav>
        <div className="side-note">
          <AlertCircle size={18}/>
          <div><b>Priority rule</b><p>Severity 1 is treated before severity 2–5.</p></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><h1>Emergency Room Dashboard</h1><p>Real-time patient triage and priority management</p></div>
          <button className="primary" onClick={() => setShowModal(true)}><Plus size={18}/> Admit Patient</button>
        </header>

        {error && <div className="error"><AlertCircle size={18}/>{error}<button onClick={() => setError('')}><X size={17}/></button></div>}

        <section className="stats">
          <Stat icon={<Users/>} label="Waiting Patients" value={patients.length}/>
          <Stat icon={<AlertCircle/>} label="Critical" value={critical}/>
          <Stat icon={<Clock3/>} label="High Priority" value={high}/>
          <Stat icon={<LogOut/>} label="Discharged Today" value={history.length}/>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div><h2>Waiting Patients</h2><p>Patients are automatically ordered by severity.</p></div>
            {patients[0] && <button className="danger" onClick={() => discharge(patients[0].id)}>Discharge Highest Priority</button>}
          </div>
          <div className="toolbar">
            <div className="search"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient or symptoms..." /></div>
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All severity</option>
              <option value="1">1 - Critical</option>
              <option value="2">2 - High</option>
              <option value="3">3 - Moderate</option>
              <option value="4">4 - Low</option>
              <option value="5">5 - Minor</option>
            </select>
          </div>

          {loading ? <div className="empty">Loading patients...</div> : filtered.length === 0 ? <div className="empty">No waiting patients found.</div> :
          <div className="table-wrap"><table><thead><tr><th>Priority</th><th>Patient</th><th>Age / Gender</th><th>Symptoms</th><th>Admitted</th><th>Action</th></tr></thead>
          <tbody>{filtered.map((p, i) => <tr key={p.id}>
            <td><span className={`priority p${p.severity}`}>#{i+1} · {severityLabel(p.severity)}</span></td>
            <td><b>{p.name}</b><small>ID: {p.id.slice(0,8)}</small></td>
            <td>{p.age || '—'} / {p.gender}</td>
            <td>{p.symptoms || 'Not specified'}</td>
            <td>{new Date(p.admittedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
            <td><button className="link-btn" onClick={() => discharge(p.id)}>Discharge</button></td>
          </tr>)}</tbody></table></div>}
        </section>

        <section className="panel history">
          <div className="panel-head"><div><h2>Recent Discharges</h2><p>Completed patient visits</p></div></div>
          {history.length === 0 ? <div className="empty">No discharged patients yet.</div> :
          <div className="history-grid">{history.slice(0,6).map(p => <div className="history-card" key={p.id}><div><b>{p.name}</b><span>{p.symptoms || 'No symptoms recorded'}</span></div><span className="done">Discharged</span></div>)}</div>}
        </section>
      </main>

      {showModal && <div className="modal-backdrop"><div className="modal">
        <div className="modal-head"><div><h2>Admit New Patient</h2><p>Enter triage information</p></div><button onClick={() => setShowModal(false)}><X/></button></div>
        <form onSubmit={submit}>
          <label>Patient Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <div className="two"><label>Age<input type="number" min="0" max="130" value={form.age} onChange={e=>setForm({...form,age:e.target.value})}/></label>
          <label>Gender<select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option>Not specified</option><option>Female</option><option>Male</option><option>Other</option></select></label></div>
          <label>Symptoms<textarea rows="3" value={form.symptoms} onChange={e=>setForm({...form,symptoms:e.target.value})}/></label>
          <label>Severity Level<select required value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})}>
            <option value="1">1 — Critical / Highest urgency</option><option value="2">2 — High urgency</option><option value="3">3 — Moderate urgency</option><option value="4">4 — Low urgency</option><option value="5">5 — Minor / Lowest urgency</option>
          </select></label>
          <button className="primary full" type="submit">Admit Patient</button>
        </form>
      </div></div>}
    </div>
  )
}

function Stat({icon,label,value}) {
  return <div className="stat"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>
}

export default App
