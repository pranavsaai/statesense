import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, CheckCircle, XCircle, Clock, Download, RefreshCw,
  ChevronDown, ChevronUp, AlertTriangle, Play, X, Bug,
  Camera, ClipboardList, Zap
} from 'lucide-react'
import { getCycles, getTestCases, updateTestCase, exportReport, createDefect } from '../api'

export default function TestCycles() {
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCycle, setSelectedCycle] = useState(null)
  const [testCases, setTestCases] = useState([])
  const [loadingCases, setLoadingCases] = useState(false)

  // Execute modal
  const [executeModal, setExecuteModal] = useState(null) // the test case being executed
  const [actualResult, setActualResult] = useState('')
  const [execNotes, setExecNotes] = useState('')
  const [checkedSteps, setCheckedSteps] = useState({})
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef()

  // Defect quick-log modal
  const [defectModal, setDefectModal] = useState(null) // { tc, cycleId }
  const [defectTitle, setDefectTitle] = useState('')
  const [defectDesc, setDefectDesc] = useState('')
  const [defectSev, setDefectSev] = useState('High')
  const [loggingDefect, setLoggingDefect] = useState(false)
  const [defectDone, setDefectDone] = useState(false)

  useEffect(() => { fetchCycles() }, [])

  const fetchCycles = async () => {
    setLoading(true)
    try { const res = await getCycles(); setCycles(res.data) } catch (e) {}
    setLoading(false)
  }

  const handleSelectCycle = async (cycle) => {
    if (selectedCycle?.id === cycle.id) {
      setSelectedCycle(null); setTestCases([]); return
    }
    setSelectedCycle(cycle)
    setLoadingCases(true)
    try { const res = await getTestCases(cycle.id); setTestCases(res.data) } catch (e) {}
    setLoadingCases(false)
  }

  // Open execute modal
  const openExecute = (tc) => {
    setExecuteModal(tc)
    setActualResult('')
    setExecNotes('')
    setCheckedSteps({})
    setScreenshot(null)
    setScreenshotPreview(null)
  }

  const handleScreenshot = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setScreenshot(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }

  const handleExecute = async (status) => {
    if (!executeModal) return
    setSubmitting(true)
    try {
      await updateTestCase(executeModal.id, {
        status,
        actual_result: actualResult || `Executed — marked as ${status}`
      })
      setTestCases(prev => prev.map(tc =>
        tc.id === executeModal.id
          ? { ...tc, status, actual_result: actualResult }
          : tc
      ))
      setCycles(prev => prev.map(c => {
        if (c.id !== selectedCycle?.id) return c
        const updated = testCases.map(tc =>
          tc.id === executeModal.id ? { ...tc, status } : tc
        )
        const passed  = updated.filter(t => t.status === 'Pass').length
        const failed  = updated.filter(t => t.status === 'Fail').length
        const blocked = updated.filter(t => t.status === 'Blocked').length
        return { ...c, passed, failed, blocked,
          pass_percentage: updated.length > 0 ? (passed / updated.length * 100) : 0 }
      }))

      // if failed → open defect modal pre-filled
      if (status === 'Fail') {
        setDefectModal({ tc: executeModal, cycleId: selectedCycle?.id })
        setDefectTitle(`[FAIL] ${executeModal.title}`)
        setDefectDesc(actualResult || '')
        setDefectSev('High')
        setDefectDone(false)
      }
      setExecuteModal(null)
    } catch (e) {}
    setSubmitting(false)
  }

  const handleLogDefect = async () => {
    if (!defectTitle.trim() || !defectModal) return
    setLoggingDefect(true)
    try {
      await createDefect({
        title: defectTitle,
        description: defectDesc,
        severity: defectSev,
        cycle_id: defectModal.cycleId
      })
      setDefectDone(true)
    } catch (e) {}
    setLoggingDefect(false)
  }

  const handleExport = async (cycleId, cycleName) => {
    try {
      const res = await exportReport(cycleId)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url; link.download = `QA_Report_${cycleName}.xlsx`; link.click()
    } catch (e) {}
  }

  const statusConfig = {
    'Pass':         { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)' },
    'Fail':         { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
    'Blocked':      { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    'Not Executed': { color: '#6b7280', bg: 'rgba(107,114,128,0.1)',border: 'rgba(107,114,128,0.25)' },
  }
  const sevConfig = {
    Low:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)' },
    Medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
    High:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
    Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
  }

  // Parse steps string into array
  const parseSteps = (desc) => {
    if (!desc) return []
    return desc.split('\n').filter(s => s.trim()).map(s => s.replace(/^\d+\.\s*/, '').trim())
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={20} style={{ color: '#6366f1' }} />
          <h2 className="text-lg font-semibold text-white">Test Cycles</h2>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
            {cycles.length} cycles
          </span>
        </div>
        <button onClick={fetchCycles} className="p-2 rounded-xl ios-button"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 gap-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <RefreshCw size={18} className="animate-spin" /><span className="text-sm">Loading cycles...</span>
        </div>
      )}
      {!loading && cycles.length === 0 && (
        <div className="text-center py-16 rounded-3xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <FileText size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No test cycles yet</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Compare statements to create one!</p>
        </div>
      )}

      {/* Cycles */}
      <div className="space-y-3">
        {cycles.map((cycle, i) => (
          <motion.div key={cycle.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="ios-card p-4 cursor-pointer" onClick={() => handleSelectCycle(cycle)}
              style={{ borderColor: selectedCycle?.id === cycle.id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-white">{cycle.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-lg"
                      style={{
                        background: cycle.status === 'Completed' ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.1)',
                        color: cycle.status === 'Completed' ? '#22c55e' : '#a78bfa',
                        border: `1px solid ${cycle.status === 'Completed' ? 'rgba(34,197,94,0.25)' : 'rgba(99,102,241,0.25)'}`
                      }}>
                      {cycle.status}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${cycle.pass_percentage}%`, background: 'linear-gradient(90deg,#22c55e,#16a34a)' }} />
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span style={{ color: '#22c55e' }}>{cycle.passed} Pass</span>
                    <span style={{ color: '#ef4444' }}>{cycle.failed} Fail</span>
                    <span style={{ color: '#f59e0b' }}>{cycle.blocked} Blocked</span>
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>{cycle.total_cases} Total</span>
                    <span className="font-semibold" style={{ color: '#22c55e' }}>{cycle.pass_percentage?.toFixed(1)}% Pass Rate</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={(e) => { e.stopPropagation(); handleExport(cycle.id, cycle.name) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs ios-button"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                    <Download size={12} /> Export
                  </button>
                  {selectedCycle?.id === cycle.id
                    ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                </div>
              </div>
            </div>

            {/* Test Cases */}
            <AnimatePresence>
              {selectedCycle?.id === cycle.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-2 rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {loadingCases ? (
                      <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        <RefreshCw size={16} className="animate-spin" /><span className="text-sm">Loading...</span>
                      </div>
                    ) : testCases.length === 0 ? (
                      <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>
                        No test cases in this cycle
                      </div>
                    ) : testCases.map((tc, j) => {
                      const cfg = statusConfig[tc.status] || statusConfig['Not Executed']
                      return (
                        <div key={tc.id} className="p-4"
                          style={{ borderBottom: j < testCases.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs px-2 py-0.5 rounded-lg"
                                  style={{ background: 'rgba(99,102,241,0.1)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.2)' }}>
                                  {tc.category || 'General'}
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                                  tc.priority === 'High' ? 'badge-high' : tc.priority === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                                  {tc.priority}
                                </span>
                                {tc.status !== 'Not Executed' && (
                                  <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                                    {tc.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-white mb-1">{tc.title}</p>
                              {tc.actual_result && (
                                <p className="text-xs mt-1 px-2 py-1 rounded-lg"
                                  style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                  Actual: {tc.actual_result}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Execute button */}
                              <motion.button
                                onClick={() => openExecute(tc)}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ios-button"
                                style={{
                                  background: tc.status === 'Not Executed'
                                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                    : 'rgba(255,255,255,0.05)',
                                  color: tc.status === 'Not Executed' ? '#fff' : 'rgba(255,255,255,0.4)',
                                  border: tc.status === 'Not Executed' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                  boxShadow: tc.status === 'Not Executed' ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
                                }}>
                                <Play size={11} />
                                {tc.status === 'Not Executed' ? 'Execute' : 'Re-run'}
                              </motion.button>
                              {/* Fail → Log Defect shortcut */}
                              {tc.status === 'Fail' && (
                                <motion.button
                                  onClick={() => {
                                    setDefectModal({ tc, cycleId: cycle.id })
                                    setDefectTitle(`[FAIL] ${tc.title}`)
                                    setDefectDesc(tc.actual_result || '')
                                    setDefectSev('High')
                                    setDefectDone(false)
                                  }}
                                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                                  style={{
                                    background: 'rgba(239,68,68,0.1)',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    color: '#f87171'
                                  }}>
                                  <Bug size={11} /> Log Defect
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* ── Execute Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {executeModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setExecuteModal(null) }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl"
              style={{ background: '#0d0d1a', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}>

              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    <ClipboardList size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Execute Test Case</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {executeModal.category} · {executeModal.priority} Priority
                    </p>
                  </div>
                </div>
                <button onClick={() => setExecuteModal(null)} className="p-2 rounded-xl ios-button"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Test Title */}
                <div>
                  <p className="text-white font-medium text-sm mb-1">{executeModal.title}</p>
                  {executeModal.expected_result && (
                    <p className="text-xs px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(99,102,241,0.07)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      Expected: {executeModal.expected_result}
                    </p>
                  )}
                </div>

                {/* Step-by-step checklist */}
                {parseSteps(executeModal.description).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                      EXECUTION STEPS
                    </p>
                    <div className="space-y-2">
                      {parseSteps(executeModal.description).map((step, idx) => (
                        <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                          <div className="mt-0.5 shrink-0">
                            <input type="checkbox"
                              checked={!!checkedSteps[idx]}
                              onChange={e => setCheckedSteps(p => ({ ...p, [idx]: e.target.checked }))}
                              className="hidden" />
                            <div className="w-5 h-5 rounded-lg flex items-center justify-center transition-all"
                              style={{
                                background: checkedSteps[idx] ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                                border: `2px solid ${checkedSteps[idx] ? '#22c55e' : 'rgba(255,255,255,0.15)'}`
                              }}
                              onClick={() => setCheckedSteps(p => ({ ...p, [idx]: !p[idx] }))}>
                              {checkedSteps[idx] && <CheckCircle size={12} style={{ color: '#22c55e' }} />}
                            </div>
                          </div>
                          <span className="text-sm transition-all"
                            style={{ color: checkedSteps[idx] ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
                              textDecoration: checkedSteps[idx] ? 'line-through' : 'none' }}>
                            Step {idx + 1}: {step}
                          </span>
                        </label>
                      ))}
                    </div>
                    {/* Progress */}
                    <div className="mt-2">
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg,#6366f1,#22c55e)' }}
                          animate={{ width: `${(Object.values(checkedSteps).filter(Boolean).length / parseSteps(executeModal.description).length) * 100}%` }}
                          transition={{ duration: 0.3 }} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {Object.values(checkedSteps).filter(Boolean).length} / {parseSteps(executeModal.description).length} steps completed
                      </p>
                    </div>
                  </div>
                )}

                {/* Actual Result */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                    ACTUAL RESULT <span style={{ color: '#ef4444' }}>*</span>
                  </p>
                  <textarea
                    value={actualResult}
                    onChange={e => setActualResult(e.target.value)}
                    placeholder="What did you observe when executing this test? Describe exactly what happened..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>

                {/* Execution Notes */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                    NOTES (Optional)
                  </p>
                  <input
                    value={execNotes}
                    onChange={e => setExecNotes(e.target.value)}
                    placeholder="Any additional observations, environment details..."
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>

                {/* Screenshot Upload */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                    SCREENSHOT PROOF (Optional)
                  </p>
                  {screenshotPreview ? (
                    <div className="relative rounded-2xl overflow-hidden"
                      style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
                      <img src={screenshotPreview} alt="proof" className="w-full object-cover max-h-40" />
                      <button onClick={() => { setScreenshot(null); setScreenshotPreview(null) }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg"
                        style={{ background: 'rgba(0,0,0,0.7)' }}>
                        <X size={12} style={{ color: 'white' }} />
                      </button>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="flex items-center justify-center gap-3 py-4 rounded-2xl transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)' }}>
                        <Camera size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          Upload screenshot as proof
                        </span>
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
                    </label>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { status: 'Pass',    icon: CheckCircle, color: '#22c55e', bg: 'linear-gradient(135deg,#22c55e,#16a34a)', shadow: 'rgba(34,197,94,0.35)' },
                    { status: 'Fail',    icon: XCircle,     color: '#ef4444', bg: 'linear-gradient(135deg,#ef4444,#dc2626)', shadow: 'rgba(239,68,68,0.35)' },
                    { status: 'Blocked', icon: AlertTriangle,color:'#f59e0b', bg: 'linear-gradient(135deg,#f59e0b,#d97706)', shadow: 'rgba(245,158,11,0.35)' },
                  ].map(({ status, icon: Icon, color, bg, shadow }) => (
                    <motion.button key={status}
                      onClick={() => handleExecute(status)}
                      disabled={submitting}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                      style={{ background: bg, color: '#fff', boxShadow: `0 6px 20px ${shadow}` }}>
                      <Icon size={15} />
                      {status}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick Log Defect Modal ────────────────────────────────── */}
      <AnimatePresence>
        {defectModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setDefectModal(null) }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-3xl"
              style={{ background: '#0d0d1a', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}>

              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                    <Bug size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Log Defect</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Linked to this test cycle · AI RCA will be generated
                    </p>
                  </div>
                </div>
                <button onClick={() => setDefectModal(null)} className="p-2 rounded-xl ios-button"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                  <X size={16} />
                </button>
              </div>

              {defectDone ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <CheckCircle size={28} style={{ color: '#22c55e' }} />
                  </div>
                  <p className="text-white font-semibold mb-1">Defect Logged!</p>
                  <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    AI Root Cause Analysis generated and linked to this cycle.
                  </p>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs"
                    style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
                    <Zap size={12} />
                    Check the Defects tab to see the AI RCA
                  </div>
                  <button onClick={() => setDefectModal(null)}
                    className="mt-4 w-full py-2.5 rounded-2xl text-sm font-medium"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Close
                  </button>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  <input value={defectTitle} onChange={e => setDefectTitle(e.target.value)}
                    placeholder="Defect title..." className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                  <textarea value={defectDesc} onChange={e => setDefectDesc(e.target.value)}
                    placeholder="What failed? What was expected vs actual?" rows={3}
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Severity:</span>
                    {['Low','Medium','High','Critical'].map(s => {
                      const cfg = sevConfig[s]
                      return (
                        <button key={s} onClick={() => setDefectSev(s)}
                          className="text-xs px-3 py-1.5 rounded-xl font-medium transition-all"
                          style={{
                            background: defectSev === s ? cfg.bg : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${defectSev === s ? cfg.border : 'rgba(255,255,255,0.08)'}`,
                            color: defectSev === s ? cfg.color : 'rgba(255,255,255,0.3)'
                          }}>
                          {s}
                        </button>
                      )
                    })}
                  </div>
                  <motion.button onClick={handleLogDefect}
                    disabled={loggingDefect || !defectTitle.trim()}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
                    style={{
                      background: loggingDefect || !defectTitle.trim() ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
                      color: loggingDefect || !defectTitle.trim() ? 'rgba(255,255,255,0.25)' : '#fff',
                      boxShadow: loggingDefect || !defectTitle.trim() ? 'none' : '0 4px 15px rgba(239,68,68,0.3)'
                    }}>
                    {loggingDefect
                      ? <><RefreshCw size={14} className="animate-spin" /> Generating AI RCA...</>
                      : <><Zap size={14} /> Log Defect + AI RCA</>}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}