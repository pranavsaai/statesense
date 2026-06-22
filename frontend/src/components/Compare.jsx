import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, GitCompare, Shield, AlertTriangle, CheckCircle, Zap, FileText, Plus, Loader2, ChevronDown, ChevronUp, Code2 } from 'lucide-react'
import { compareStatements, createCycle, addBulkTestCases } from '../api'

export default function Compare({ onCycleCreated }) {
  const [oldFile, setOldFile]         = useState(null)
  const [newFile, setNewFile]         = useState(null)
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [cycleCreated, setCycleCreated] = useState(false)
  // Gap 3 fix: prompt panel toggle state
  const [showPrompt, setShowPrompt]   = useState(false)

  const handleCompare = async () => {
    if (!oldFile || !newFile) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('old_statement', oldFile)
      formData.append('new_statement', newFile)
      const res = await compareStatements(formData)
      setResult(res.data)
    } catch (e) {
      setError('Comparison failed. Make sure backend is running!')
    }
    setLoading(false)
  }

  const handleCreateCycle = async () => {
    if (!result) return
    try {
      const cycleRes = await createCycle({
        name:        `Statement Validation — ${new Date().toLocaleDateString()}`,
        description: `Auto-generated from AI comparison. Risk: ${result.risk_level}. Compliance Score: ${result.compliance_score}`
      })
      const cycleId = cycleRes.data.id
      await addBulkTestCases(cycleId, result.generated_test_cases)
      setCycleCreated(true)
      onCycleCreated?.()
    } catch (e) {}
  }

  const riskColor = {
    Low:      '#22c55e',
    Medium:   '#f59e0b',
    High:     '#ef4444',
    Critical: '#dc2626'
  }

  //fix: the actual prompt template sent to Groq — makes prompt engineering visible
  const getPromptPreview = () => `SYSTEM PROMPT (Compliance Analyst Role):
You are an expert financial services compliance analyst specializing 
in billing statement validation for consumer credit cards. You have 
deep knowledge of TILA, SCRA, FCBA, and Regulation Z requirements.

USER PROMPT (Structured Comparison Task):
Analyze the following two billing statements and return a JSON response.

OLD STATEMENT:
[Extracted PDF text — old version]

NEW STATEMENT:
[Extracted PDF text — new version]

Return ONLY valid JSON with this exact schema:
{
  "compliance_score": <0-100 integer>,
  "risk_level": <"Low" | "Medium" | "High" | "Critical">,
  "summary": <2-3 sentence plain English summary>,
  "root_cause": <root cause if score < 80, else null>,
  "changes_detected": [
    {
      "type": <change category>,
      "description": <what changed>,
      "severity": <"LOW" | "MEDIUM" | "HIGH">
    }
  ],
  "missing_clauses": [
    {
      "clause": <regulatory clause name>,
      "risk": <"LOW" | "MEDIUM" | "HIGH">
    }
  ],
  "marketing_offer_changes": [<list of detected marketing offer changes>]
}

PROMPT ENGINEERING TECHNIQUES APPLIED:
  - Role prompting: "expert financial services compliance analyst"
  - Schema enforcement: strict JSON output format specified
  - Few-shot structure: severity enum constrained to exact values
  - Domain grounding: TILA, SCRA, FCBA, Reg Z terminology seeded
  - Output validation: response parsed and schema-checked before DB write
  - Fallback handling: invalid JSON triggers retry with temperature=0`

  const FileUploadZone = ({ file, setFile, label }) => (
    <label className="block cursor-pointer">
      <div className="rounded-2xl p-6 text-center transition-all"
        style={{
          background: file ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
          border: `2px dashed ${file ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        {file ? (
          <div>
            <CheckCircle size={32} className="mx-auto mb-2" style={{ color: '#6366f1' }} />
            <p className="text-white font-medium text-sm">{file.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div>
            <Upload size={32} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.25)' }} />
            <p className="text-white font-medium text-sm">{label}</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>Click to upload PDF</p>
          </div>
        )}
      </div>
      <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
    </label>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
        <h2 className="text-3xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
          Statement <span className="gradient-text">Comparison</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
          Upload billing statements for AI-powered compliance analysis
        </p>
      </motion.div>

      {/* Upload Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ios-card p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>OLD STATEMENT</p>
            <FileUploadZone file={oldFile} setFile={setOldFile} label="Upload Old Statement" />
          </div>
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>NEW STATEMENT</p>
            <FileUploadZone file={newFile} setFile={setNewFile} label="Upload New Statement" />
          </div>
        </div>

        <motion.button
          onClick={handleCompare}
          disabled={loading || !oldFile || !newFile}
          whileHover={{ scale: loading || !oldFile || !newFile ? 1 : 1.02 }}
          whileTap={{ scale: loading || !oldFile || !newFile ? 1 : 0.98 }}
          className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{
            background: loading || !oldFile || !newFile ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color:      loading || !oldFile || !newFile ? 'rgba(255,255,255,0.25)' : '#ffffff',
            boxShadow:  loading || !oldFile || !newFile ? 'none' : '0 8px 25px rgba(99,102,241,0.35)',
            cursor:     loading || !oldFile || !newFile ? 'not-allowed' : 'pointer'
          }}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Analyzing with AI...</>
            : <><GitCompare size={16} /> Compare Statements</>
          }
        </motion.button>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertTriangle size={18} style={{ color: '#f87171' }} />
          <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Compliance Score + AI Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="ios-card p-5 col-span-1"
                style={{ boxShadow: `0 0 30px ${riskColor[result.risk_level] || '#6366f1'}20` }}
              >
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }} className="mb-2">Compliance Score</div>
                <div className="text-4xl font-bold mb-2" style={{ color: riskColor[result.risk_level] || '#6366f1' }}>
                  {result.compliance_score}
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: riskColor[result.risk_level] || '#6366f1' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.compliance_score}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded-lg inline-block ${
                  result.risk_level === 'Low' ? 'badge-low' :
                  result.risk_level === 'Medium' ? 'badge-medium' : 'badge-high'
                }`}>
                  {result.risk_level} Risk
                </div>
              </div>

              <div className="ios-card p-5 col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={15} style={{ color: '#a78bfa' }} />
                  <span className="text-sm font-medium" style={{ color: '#a78bfa' }}>AI Summary</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {result.summary}
                </p>
                {result.root_cause && (
                  <div className="mt-3 p-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
                  >
                    <span className="text-xs font-medium" style={{ color: '#f87171' }}>
                      Root Cause: {result.root_cause}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Changes Detected */}
            {result.changes_detected?.length > 0 && (
              <div className="ios-card overflow-hidden">
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <AlertTriangle size={15} style={{ color: '#f97316' }} />
                  <span className="text-sm font-medium text-white">Changes Detected ({result.changes_detected.length})</span>
                </div>
                {result.changes_detected.map((change, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="px-5 py-3 flex items-start gap-3"
                    style={{ borderBottom: i < result.changes_detected.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  >
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                      change.severity === 'HIGH' ? 'badge-high' : change.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                    }`}>{change.severity}</span>
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#a78bfa' }}>{change.type}</p>
                      <p className="text-sm text-white">{change.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Missing Clauses */}
            {result.missing_clauses?.length > 0 && (
              <div className="ios-card overflow-hidden">
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Shield size={15} style={{ color: '#ef4444' }} />
                  <span className="text-sm font-medium text-white">Missing Compliance Clauses ({result.missing_clauses.length})</span>
                </div>
                {result.missing_clauses.map((clause, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between"
                    style={{ borderBottom: i < result.missing_clauses.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
                      <span className="text-sm text-white">{clause.clause}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${clause.risk === 'HIGH' ? 'badge-high' : 'badge-medium'}`}>
                      {clause.risk} RISK
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Generated Test Cases */}
            {result.generated_test_cases?.length > 0 && (
              <div className="ios-card overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <FileText size={15} style={{ color: '#22c55e' }} />
                    <span className="text-sm font-medium text-white">
                      Auto-Generated Test Cases ({result.generated_test_cases.length})
                    </span>
                  </div>
                  <motion.button
                    onClick={handleCreateCycle}
                    disabled={cycleCreated}
                    whileHover={{ scale: cycleCreated ? 1 : 1.03 }}
                    whileTap={{ scale: cycleCreated ? 1 : 0.97 }}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold"
                    style={{
                      background: cycleCreated ? 'rgba(34,197,94,0.1)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color:      cycleCreated ? '#22c55e' : '#ffffff',
                      border:     cycleCreated ? '1px solid rgba(34,197,94,0.3)' : 'none',
                      boxShadow:  cycleCreated ? 'none' : '0 4px 12px rgba(34,197,94,0.3)'
                    }}
                  >
                    <Plus size={12} />
                    {cycleCreated ? 'Cycle Created!' : 'Create Test Cycle'}
                  </motion.button>
                </div>
                {result.generated_test_cases.map((tc, i) => (
                  <div key={i} className="px-5 py-3"
                    style={{ borderBottom: i < result.generated_test_cases.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono" style={{ color: '#6366f1' }}>{tc.id}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                        tc.priority === 'High' ? 'badge-high' : tc.priority === 'Medium' ? 'badge-medium' : 'badge-low'
                      }`}>{tc.priority}</span>
                      <span className="text-xs px-2 py-0.5 rounded-lg"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.2)' }}
                      >{tc.category}</span>
                    </div>
                    <p className="text-sm text-white">{tc.title}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Expected: {tc.expected_result}</p>
                  </div>
                ))}
              </div>
            )}
            
            <motion.div
              className="ios-card overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Toggle header */}
              <button
                onClick={() => setShowPrompt(v => !v)}
                className="w-full px-5 py-3 flex items-center justify-between"
                style={{ borderBottom: showPrompt ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
              >
                <div className="flex items-center gap-2">
                  <Code2 size={15} style={{ color: '#6366f1' }} />
                  <span className="text-sm font-medium text-white">Prompt Engineering — View AI Prompt Used</span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.1)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    Groq LLaMA 3.1
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {showPrompt ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              <AnimatePresence>
                {showPrompt && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="px-5 py-4">
                      {/* Technique badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {[
                          'Role Prompting',
                          'Schema Enforcement',
                          'Enum Constraints',
                          'Domain Grounding',
                          'Output Validation',
                          'Fallback Handling'
                        ].map(tag => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Prompt text */}
                      <pre className="text-xs leading-relaxed overflow-x-auto rounded-xl p-4 whitespace-pre-wrap"
                        style={{
                          background:  'rgba(0,0,0,0.4)',
                          border:      '1px solid rgba(255,255,255,0.08)',
                          color:       'rgba(255,255,255,0.65)',
                          fontFamily:  '"Courier New", Courier, monospace',
                          maxHeight:   '360px',
                          overflowY:   'auto'
                        }}
                      >
                        {getPromptPreview()}
                      </pre>

                      <p className="text-xs mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        The prompt is constructed dynamically in <code style={{ color: '#a78bfa' }}>analyzer.py</code> using
                        extracted PDF text. Response is JSON-parsed, schema-validated, and written to PostgreSQL.
                        Invalid or malformed responses trigger a structured fallback with safe defaults.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}