import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bug, RefreshCw, Plus, Zap, X, CheckCircle } from 'lucide-react'
import { getDefects, createDefect, updateDefect, getCycles } from '../api'

export default function Defects() {
  const [defects, setDefects] = useState([])
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'Medium',
    cycle_id: ''
  })

  useEffect(() => {
    fetchDefects()
    fetchCycles()
  }, [])

  const fetchDefects = async () => {
    setLoading(true)
    try {
      const res = await getDefects()
      setDefects(res.data)
    } catch (e) {}
    setLoading(false)
  }

  const fetchCycles = async () => {
    try {
      const res = await getCycles()
      setCycles(res.data)
    } catch (e) {}
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      await createDefect({
        title: form.title,
        description: form.description,
        severity: form.severity,
        cycle_id: form.cycle_id ? parseInt(form.cycle_id) : null
      })
      setForm({ title: '', description: '', severity: 'Medium', cycle_id: '' })
      setShowForm(false)
      fetchDefects()
    } catch (e) {}
    setSubmitting(false)
  }

  const handleStatusChange = async (id, status) => {
    try {
      await updateDefect(id, { status })
      setDefects(prev => prev.map(d => d.id === id ? { ...d, status } : d))
    } catch (e) {}
  }

  const severityConfig = {
    Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
    High:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
    Medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
    Low:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  }

  const statusConfig = {
    Open:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
    Fixed:  { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)' },
    Closed: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' },
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bug size={20} style={{ color: '#ef4444' }} />
          <h2 className="text-lg font-semibold text-white">Defect Management</h2>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
            {defects.length} defects
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDefects} className="p-2 rounded-xl ios-button"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
            <RefreshCw size={14} />
          </button>
          <motion.button
            onClick={() => setShowForm(v => !v)}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: showForm ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
              color: showForm ? 'rgba(255,255,255,0.5)' : '#fff',
              border: showForm ? '1px solid rgba(255,255,255,0.1)' : 'none',
              boxShadow: showForm ? 'none' : '0 4px 15px rgba(239,68,68,0.3)'
            }}>
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancel' : 'Log Defect'}
          </motion.button>
        </div>
      </div>

      {/* Log Defect Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="ios-card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Log New Defect</h3>

              {/* Title */}
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Defect title..."
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />

              {/* Description */}
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe the defect — what failed, what was expected..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />

              {/* Link to Cycle */}
              <div>
                <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  LINK TO TEST CYCLE
                </p>
                <select
                  value={form.cycle_id}
                  onChange={e => setForm(p => ({ ...p, cycle_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                  <option value="">— No cycle (standalone defect) —</option>
                  {cycles.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>SEVERITY:</span>
                {['Low', 'Medium', 'High', 'Critical'].map(s => {
                  const cfg = severityConfig[s]
                  return (
                    <button key={s}
                      onClick={() => setForm(p => ({ ...p, severity: s }))}
                      className="text-xs px-3 py-1.5 rounded-xl font-medium transition-all"
                      style={{
                        background: form.severity === s ? cfg.bg : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.severity === s ? cfg.border : 'rgba(255,255,255,0.08)'}`,
                        color: form.severity === s ? cfg.color : 'rgba(255,255,255,0.3)'
                      }}>
                      {s}
                    </button>
                  )
                })}
              </div>

              {/* Submit */}
              <motion.button
                onClick={handleSubmit}
                disabled={submitting || !form.title.trim()}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{
                  background: submitting || !form.title.trim()
                    ? 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg,#ef4444,#dc2626)',
                  color: submitting || !form.title.trim() ? 'rgba(255,255,255,0.25)' : '#fff',
                  boxShadow: submitting || !form.title.trim() ? 'none' : '0 4px 15px rgba(239,68,68,0.3)'
                }}>
                {submitting
                  ? <><RefreshCw size={14} className="animate-spin" /> Generating AI RCA...</>
                  : <><Zap size={14} /> Log Defect + AI RCA</>}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Defect List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <RefreshCw size={18} className="animate-spin" />
          <span className="text-sm">Loading defects...</span>
        </div>
      ) : defects.length === 0 ? (
        <div className="text-center py-16 rounded-3xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Bug size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No defects logged</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Log your first defect above!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {defects.map((defect, i) => {
            const sev = severityConfig[defect.severity] || severityConfig.Medium
            const sta = statusConfig[defect.status] || statusConfig.Open
            return (
              <motion.div key={defect.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="ios-card p-5"
                style={{ borderLeft: `3px solid ${sev.color}` }}>

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        #{String(defect.id).padStart(3, '0')}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color }}>
                        {defect.severity}
                      </span>
                      {defect.cycle_id && (
                        <span className="text-xs px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a78bfa' }}>
                          Cycle #{defect.cycle_id}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{defect.title}</h3>
                    {defect.description && (
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {defect.description}
                      </p>
                    )}
                  </div>

                  {/* Status controls */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-lg"
                      style={{ background: sta.bg, border: `1px solid ${sta.border}`, color: sta.color }}>
                      {defect.status}
                    </span>
                    <div className="flex gap-1">
                      {['Open', 'Fixed', 'Closed'].map(s => (
                        <button key={s}
                          onClick={() => handleStatusChange(defect.id, s)}
                          className="text-xs px-2 py-1 rounded-lg ios-button transition-all"
                          style={{
                            background: defect.status === s ? statusConfig[s].bg : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${defect.status === s ? statusConfig[s].border : 'rgba(255,255,255,0.08)'}`,
                            color: defect.status === s ? statusConfig[s].color : 'rgba(255,255,255,0.3)'
                          }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Root Cause */}
                {defect.ai_root_cause && (
                  <div className="mt-2 p-3 rounded-2xl"
                    style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={12} style={{ color: '#a78bfa' }} />
                      <span className="text-xs font-medium" style={{ color: '#a78bfa' }}>AI Root Cause Analysis</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {defect.ai_root_cause}
                    </p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}