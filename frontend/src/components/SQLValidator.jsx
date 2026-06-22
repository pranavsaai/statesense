import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Play, RefreshCw, ChevronRight, AlertTriangle, CheckCircle, Copy, Check } from 'lucide-react'
import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:8000'

const PRESET_QUERIES = [
  {
    label: 'All Test Cycles',
    description: 'View all test cycles with pass rates',
    query: `SELECT id, name, status, total_cases, passed, failed, blocked,
ROUND(pass_percentage::numeric, 2) as pass_rate
FROM test_cycles
ORDER BY created_at DESC;`
  },
  {
    label: 'Failed Test Cases',
    description: 'All failed test cases across cycles',
    query: `SELECT tc.id, tc.title, tc.category, tc.priority,
tc.actual_result, cy.name as cycle_name
FROM test_cases tc
JOIN test_cycles cy ON tc.cycle_id = cy.id
WHERE tc.status = 'Fail'
ORDER BY tc.created_at DESC;`
  },
  {
    label: 'Defect Summary',
    description: 'All defects with severity and AI RCA',
    query: `SELECT id, title, severity, status,
ai_root_cause, created_at
FROM defects
ORDER BY
  CASE severity
    WHEN 'Critical' THEN 1
    WHEN 'High' THEN 2
    WHEN 'Medium' THEN 3
    ELSE 4
  END;`
  },
  {
    label: 'SLA Compliance Check',
    description: 'Cycles vs SLA deadline status',
    query: `SELECT name, status, pass_percentage,
sla_deadline,
CASE
  WHEN sla_deadline IS NULL THEN 'No SLA Set'
  WHEN NOW() > sla_deadline AND status != 'Completed' THEN 'SLA BREACHED'
  ELSE 'On Track'
END as sla_status
FROM test_cycles
ORDER BY created_at DESC;`
  },
  {
    label: 'Compliance Score Report',
    description: 'Statement comparison compliance scores',
    query: `SELECT id, old_filename, new_filename,
compliance_score, risk_level, ai_summary,
created_at
FROM statement_comparisons
ORDER BY compliance_score ASC;`
  },
  {
    label: 'Defect Leakage Rate',
    description: 'Defects per test cycle for leakage analysis',
    query: `SELECT cy.name as cycle_name,
COUNT(d.id) as total_defects,
SUM(CASE WHEN d.severity = 'Critical' THEN 1 ELSE 0 END) as critical,
SUM(CASE WHEN d.severity = 'High' THEN 1 ELSE 0 END) as high,
SUM(CASE WHEN d.status = 'Open' THEN 1 ELSE 0 END) as open_defects
FROM test_cycles cy
LEFT JOIN defects d ON d.cycle_id = cy.id
GROUP BY cy.id, cy.name
ORDER BY total_defects DESC;`
  },
  {
    label: 'Execution Progress',
    description: 'Test execution status breakdown',
    query: `SELECT
  SUM(CASE WHEN status = 'Pass' THEN 1 ELSE 0 END) as passed,
  SUM(CASE WHEN status = 'Fail' THEN 1 ELSE 0 END) as failed,
  SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) as blocked,
  SUM(CASE WHEN status = 'Not Executed' THEN 1 ELSE 0 END) as not_executed,
  COUNT(*) as total,
  ROUND(
    SUM(CASE WHEN status = 'Pass' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1
  ) as pass_rate_pct
FROM test_cases;`
  },
  {
    label: 'Root Cause Analysis',
    description: 'All defects with AI root cause',
    query: `SELECT d.title, d.severity, d.status,
d.ai_root_cause, cy.name as linked_cycle
FROM defects d
LEFT JOIN test_cycles cy ON d.cycle_id = cy.id
WHERE d.ai_root_cause IS NOT NULL
ORDER BY d.created_at DESC;`
  },
]

export default function SQLValidator() {
  const [query, setQuery] = useState(PRESET_QUERIES[0].query)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [activePreset, setActivePreset] = useState(0)
  const [executionTime, setExecutionTime] = useState(null)

  const handleRun = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResults(null)
    const start = Date.now()
    try {
      const res = await axios.post(`${BASE_URL}/api/sql/execute`, { query })
      setResults(res.data)
      setExecutionTime(Date.now() - start)
    } catch (e) {
      setError(e.response?.data?.detail || 'Query failed. Check your SQL syntax.')
    }
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePreset = (i) => {
    setActivePreset(i)
    setQuery(PRESET_QUERIES[i].query)
    setResults(null)
    setError(null)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a78bfa' }}>
          <Database size={12} /> SQL Validation Layer
        </div>
        <h2 className="text-3xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
          SQL <span className="gradient-text">Validator</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
          Run queries directly against PostgreSQL for reconciliation & validation
        </p>
      </motion.div>

      <div className="grid grid-cols-12 gap-4">

        {/* Preset Queries Sidebar */}
        <motion.div className="col-span-4 space-y-2"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-xs font-semibold px-1 mb-3"
            style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
            PRESET QUERIES
          </p>
          {PRESET_QUERIES.map((p, i) => (
            <motion.button key={i} onClick={() => handlePreset(i)}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full text-left p-3 rounded-2xl transition-all"
              style={{
                background: activePreset === i ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activePreset === i ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)'}`,
              }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold"
                  style={{ color: activePreset === i ? '#a78bfa' : 'rgba(255,255,255,0.7)' }}>
                  {p.label}
                </span>
                {activePreset === i && <ChevronRight size={12} style={{ color: '#a78bfa' }} />}
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{p.description}</p>
            </motion.button>
          ))}
        </motion.div>

        {/* Query Editor + Results */}
        <div className="col-span-8 space-y-4">

          {/* Editor */}
          <motion.div className="ios-card overflow-hidden"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>

            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
                </div>
                <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  query.sql
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs ios-button"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                  {copied ? <Check size={12} style={{ color: '#22c55e' }} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <motion.button onClick={handleRun} disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.03 }} whileTap={{ scale: loading ? 1 : 0.97 }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold"
                  style={{
                    background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    color: loading ? 'rgba(255,255,255,0.3)' : '#fff',
                    boxShadow: loading ? 'none' : '0 4px 12px rgba(99,102,241,0.3)'
                  }}>
                  {loading
                    ? <><RefreshCw size={12} className="animate-spin" /> Running...</>
                    : <><Play size={12} /> Run Query</>}
                </motion.button>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleRun() }}
              rows={10}
              spellCheck={false}
              className="w-full px-5 py-4 text-sm font-mono outline-none resize-none"
              style={{
                background: 'transparent',
                color: '#a78bfa',
                lineHeight: '1.7',
                caretColor: '#6366f1'
              }}
              placeholder="-- Write your SQL query here
-- Ctrl + Enter to run

SELECT * FROM test_cycles;"
            />

            {/* Footer hint */}
            <div className="px-4 py-2 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                PostgreSQL · statementsense
              </span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Ctrl + Enter to run
              </span>
            </div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={16} style={{ color: '#f87171', marginTop: 1 }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#f87171' }}>Query Error</p>
                  <p className="text-xs mt-1 font-mono" style={{ color: 'rgba(239,68,68,0.7)' }}>{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="ios-card overflow-hidden">

                {/* Results Header */}
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={15} style={{ color: '#22c55e' }} />
                    <span className="text-sm font-medium text-white">
                      {results.rows?.length || 0} rows returned
                    </span>
                  </div>
                  {executionTime && (
                    <span className="text-xs font-mono"
                      style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {executionTime}ms
                    </span>
                  )}
                </div>

                {/* Table */}
                {results.rows?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                          {results.columns?.map((col, i) => (
                            <th key={i} className="px-4 py-3 text-left font-semibold"
                              style={{ color: '#a78bfa', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.rows.map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                            className="transition-colors hover:bg-white/5">
                            {results.columns?.map((col, j) => (
                              <td key={j} className="px-4 py-3 font-mono"
                                style={{
                                  color: row[col] === null ? 'rgba(255,255,255,0.2)'
                                    : col.includes('status') || col.includes('sla_status')
                                      ? row[col] === 'Pass' || row[col] === 'On Track' || row[col] === 'Fixed' || row[col] === 'Closed' ? '#22c55e'
                                        : row[col] === 'Fail' || row[col] === 'SLA BREACHED' || row[col] === 'Open' ? '#ef4444'
                                          : '#f59e0b'
                                      : col.includes('score') || col.includes('rate') || col.includes('pct') ? '#6366f1'
                                        : 'rgba(255,255,255,0.7)',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '250px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                {row[col] === null ? 'NULL' : String(row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                    Query executed successfully — 0 rows returned
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}