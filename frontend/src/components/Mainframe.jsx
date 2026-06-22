// src/components/Mainframe.jsx
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const BOOT_SEQUENCE = [
  'IBM 3270 TERMINAL EMULATOR v2.1.4',
  'COPYRIGHT (C) IBM CORP. 1978, 2024',
  '════════════════════════════════════════════════════════════════════════════════',
  'CONNECTING TO SYNCHRONY FINANCIAL MAINFRAME...',
  'HOST: SYF-PROD-MF01.SYNCHRONY.COM',
  'PORT: 23 (TN3270)',
  '',
  'AUTHENTICATING...',
  'SESSION ESTABLISHED — CICS REGION: SYFPROD1',
  '════════════════════════════════════════════════════════════════════════════════',
  '',
  'WELCOME TO SYNCHRONY FINANCIAL STATEMENT TESTING SYSTEM',
  'STATEMENTSENSE QA PLATFORM — MARKETING ACTIVATION DIVISION',
  '',
  'TYPE "HELP" FOR AVAILABLE COMMANDS',
  'TYPE "STATUS" FOR SYSTEM STATUS',
  'TYPE "QUERY" TO RUN VALIDATION QUERIES',
  '',
]

const COMMANDS = {
  help: [
    '════════════════════════════════════════════════════════════',
    ' AVAILABLE COMMANDS                                         ',
    '════════════════════════════════════════════════════════════',
    ' STATUS    — System and SLA status                         ',
    ' QUERY     — Run SQL validation query                      ',
    ' CYCLES    — List all test cycles                          ',
    ' DEFECTS   — Show open defects                             ',
    ' SLA       — SLA adherence report                          ',
    ' COMPLIANCE— Compliance score summary                      ',
    ' CLEAR     — Clear terminal                                ',
    '════════════════════════════════════════════════════════════',
    '',
  ],
  status: [
    '════════════════════════════════════════════════════════════',
    ' SYSTEM STATUS — SYNCHRONY STATEMENT TESTING               ',
    '════════════════════════════════════════════════════════════',
    ' CICS REGION    : SYFPROD1          STATUS: ACTIVE         ',
    ' DB2 DATABASE   : STATEMENTSENSE    STATUS: CONNECTED      ',
    ' GROQ AI ENGINE : LLAMA-3.1-8B      STATUS: ONLINE         ',
    ' LAST SYNC      : ' + new Date().toISOString().slice(0,19).replace('T',' '),
    '════════════════════════════════════════════════════════════',
    ' SLA ADHERENCE  : 94.5%             TARGET: 95%            ',
    ' OPEN DEFECTS   : FETCHING...                              ',
    ' COMPLIANCE     : 85/100            RISK: MEDIUM           ',
    '════════════════════════════════════════════════════════════',
    '',
  ],
  sla: [
    '════════════════════════════════════════════════════════════',
    ' SLA ADHERENCE REPORT                                       ',
    '════════════════════════════════════════════════════════════',
    ' METRIC                  TARGET    ACTUAL    STATUS         ',
    ' ─────────────────────────────────────────────────────────  ',
    ' TEST EXECUTION COMPLETE  100%      85.0%    ** FAIL **     ',
    ' PASS RATE                95%       87.5%    ** FAIL **     ',
    ' CRITICAL DEFECTS         0         0        PASS           ',
    ' DEFECT LEAKAGE RATE      <5%       2.3%     PASS           ',
    ' COMPLIANCE SCORE         90+       85       ** WARN **     ',
    '════════════════════════════════════════════════════════════',
    '',
  ],
  compliance: [
    '════════════════════════════════════════════════════════════',
    ' COMPLIANCE SCORE SUMMARY                                   ',
    '════════════════════════════════════════════════════════════',
    ' LAST STATEMENT COMPARISON RESULTS:                         ',
    '                                                            ',
    ' OVERALL COMPLIANCE SCORE : 85/100                         ',
    ' RISK LEVEL               : MEDIUM                         ',
    '                                                            ',
    ' CHANGES DETECTED:                                          ',
    '  [HIGH]   APR CHANGED: 19.99% → 21.99%                   ',
    '  [HIGH]   LATE PAYMENT WARNING TEXT MODIFIED              ',
    '  [MEDIUM] SCRA DISCLOSURE RELOCATED TO PAGE 3             ',
    '                                                            ',
    ' MISSING CLAUSES:                                           ',
    '  [HIGH]   SCRA MILITARY DISCLOSURE                        ',
    '  [HIGH]   ANNUAL PERCENTAGE RATE TABLE                    ',
    '  [MEDIUM] DISPUTE RESOLUTION NOTICE                       ',
    '════════════════════════════════════════════════════════════',
    '',
  ],
  query: [
    ' ENTERING QUERY MODE...',
    ' TYPE YOUR SQL QUERY AND PRESS ENTER',
    ' TYPE "EXIT" TO RETURN TO MAIN MENU',
    '',
  ],
  cycles: [
    '════════════════════════════════════════════════════════════',
    ' TEST CYCLES — STATEMENTSENSE QA PLATFORM                  ',
    '════════════════════════════════════════════════════════════',
    ' FETCHING FROM DB2... PLEASE WAIT                          ',
    '',
  ],
  defects: [
    '════════════════════════════════════════════════════════════',
    ' OPEN DEFECTS REPORT                                        ',
    '════════════════════════════════════════════════════════════',
    ' FETCHING FROM DB2... PLEASE WAIT                          ',
    '',
  ],
}

export default function Mainframe() {
  const [lines, setLines] = useState([])
  const [input, setInput] = useState('')
  const [booting, setBooting] = useState(true)
  const [bootIndex, setBootIndex] = useState(0)
  const [cursor, setCursor] = useState(true)
  const [queryMode, setQueryMode] = useState(false)
  const terminalRef = useRef()
  const inputRef = useRef()

  // Boot sequence
  useEffect(() => {
    if (bootIndex < BOOT_SEQUENCE.length) {
      const timeout = setTimeout(() => {
        setLines(prev => [...prev, { text: BOOT_SEQUENCE[bootIndex], type: 'system' }])
        setBootIndex(v => v + 1)
      }, bootIndex < 3 ? 80 : 40)
      return () => clearTimeout(timeout)
    } else {
      setBooting(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [bootIndex])

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setCursor(v => !v), 530)
    return () => clearInterval(interval)
  }, [])

  // Auto scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  const addLines = (newLines, type = 'output') => {
    setLines(prev => [...prev, ...newLines.map(text => ({ text, type }))])
  }

  const handleCommand = async (cmd) => {
    const command = cmd.trim().toLowerCase()

    // Echo the command
    setLines(prev => [...prev, { text: `> ${cmd.toUpperCase()}`, type: 'input' }])
    setInput('')

    if (!command) return

    if (command === 'clear') {
      setLines([])
      setQueryMode(false)
      return
    }

    if (command === 'exit') {
      setQueryMode(false)
      addLines([' RETURNING TO MAIN MENU...', ''], 'system')
      return
    }

    if (queryMode) {
      // Execute SQL via backend
      try {
        addLines([' EXECUTING QUERY...', ''], 'system')
        const res = await fetch('http://127.0.0.1:8000/api/sql/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: cmd })
        })
        const data = await res.json()
        if (data.columns && data.rows) {
          const header = ' ' + data.columns.join('  |  ')
          const divider = ' ' + '─'.repeat(Math.min(header.length, 76))
          addLines([
            '════════════════════════════════════════════════════════════',
            ` QUERY RESULTS — ${data.count} ROWS RETURNED`,
            '════════════════════════════════════════════════════════════',
            header,
            divider,
            ...data.rows.slice(0, 15).map(row =>
              ' ' + data.columns.map(c => String(row[c] ?? 'NULL').padEnd(15)).join(' | ')
            ),
            data.count > 15 ? ` ... ${data.count - 15} MORE ROWS` : '',
            '════════════════════════════════════════════════════════════',
            '',
          ], 'output')
        } else {
          addLines([` ERROR: ${data.detail || 'Query failed'}`, ''], 'error')
        }
      } catch (e) {
        addLines([' ERROR: CANNOT CONNECT TO DB2', ''], 'error')
      }
      return
    }

    if (COMMANDS[command]) {
      addLines(COMMANDS[command])
      if (command === 'query') setQueryMode(true)

      // Live data for cycles and defects
      if (command === 'cycles') {
        try {
          const res = await fetch('http://127.0.0.1:8000/api/cycles')
          const data = await res.json()
          const rows = data.length === 0
            ? [' NO CYCLES FOUND']
            : data.map(c =>
                ` ${String(c.id).padEnd(4)} ${c.name.slice(0,30).padEnd(30)} ${String(c.pass_percentage?.toFixed(1) + '%').padEnd(8)} ${c.status}`
              )
          addLines([
            ' ID   NAME                           PASS%    STATUS',
            ' ─────────────────────────────────────────────────── ',
            ...rows,
            '════════════════════════════════════════════════════════════',
            '',
          ])
        } catch (e) {
          addLines([' ERROR: COULD NOT FETCH CYCLES', ''], 'error')
        }
      }

      if (command === 'defects') {
        try {
          const res = await fetch('http://127.0.0.1:8000/api/defects')
          const data = await res.json()
          const open = data.filter(d => d.status === 'Open')
          const rows = open.length === 0
            ? [' NO OPEN DEFECTS — ALL CLEAR']
            : open.map(d =>
                ` ${String(d.id).padEnd(4)} [${d.severity.toUpperCase().padEnd(8)}] ${d.title.slice(0,40)}`
              )
          addLines([
            ' ID   SEVERITY    TITLE',
            ' ─────────────────────────────────────────────────── ',
            ...rows,
            '════════════════════════════════════════════════════════════',
            '',
          ])
        } catch (e) {
          addLines([' ERROR: COULD NOT FETCH DEFECTS', ''], 'error')
        }
      }
      return
    }

    addLines([
      ` UNKNOWN COMMAND: ${command.toUpperCase()}`,
      ' TYPE "HELP" FOR AVAILABLE COMMANDS',
      '',
    ], 'error')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input)
    }
  }

  const getLineColor = (type) => {
    switch (type) {
      case 'input':  return '#22c55e'
      case 'error':  return '#ef4444'
      case 'system': return '#86efac'
      default:       return '#4ade80'
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
        <span className="text-sm font-mono font-semibold" style={{ color: '#22c55e' }}>
          IBM 3270 — SYNCHRONY MAINFRAME TERMINAL
        </span>
        <span className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
          SESSION ACTIVE
        </span>
      </div>

      {/* Terminal */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          background: '#000',
          border: '2px solid #22c55e',
          borderRadius: '8px',
          boxShadow: '0 0 30px rgba(34,197,94,0.15), inset 0 0 60px rgba(0,0,0,0.5)',
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '13px',
          lineHeight: '1.5',
          minHeight: '520px',
          cursor: 'text',
          position: 'relative',
          overflow: 'hidden',
        }}>

        {/* Scanlines overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)'
        }} />

        {/* Screen content */}
        <div ref={terminalRef} style={{
          padding: '16px', height: '480px', overflowY: 'auto',
          position: 'relative', zIndex: 2,
          scrollbarWidth: 'none',
        }}>
          {lines.map((line, i) => (
            <div key={i} style={{ color: getLineColor(line.type), whiteSpace: 'pre' }}>
              {line.text}
            </div>
          ))}

          {/* Input line */}
          {!booting && (
            <div style={{ display: 'flex', alignItems: 'center', color: '#22c55e' }}>
              <span>{queryMode ? 'SQL> ' : '> '}</span>
              <span style={{ whiteSpace: 'pre' }}>{input}</span>
              <span style={{
                display: 'inline-block', width: '8px', height: '14px',
                background: cursor ? '#22c55e' : 'transparent',
                marginLeft: '1px', verticalAlign: 'middle'
              }} />
            </div>
          )}
        </div>

        {/* Hidden input */}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />
      </div>

      {/* Quick command buttons */}
      <div className="flex flex-wrap gap-2">
        {['HELP', 'STATUS', 'CYCLES', 'DEFECTS', 'SLA', 'COMPLIANCE', 'QUERY', 'CLEAR'].map(cmd => (
          <button key={cmd}
            onClick={() => handleCommand(cmd)}
            className="text-xs px-3 py-1.5 rounded font-mono transition-all"
            style={{
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.25)',
              color: '#4ade80'
            }}>
            {cmd}
          </button>
        ))}
      </div>
    </div>
  )
}