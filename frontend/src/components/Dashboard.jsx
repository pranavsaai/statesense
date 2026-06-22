import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, FileText, Bug } from 'lucide-react'
import { getStats, getCycles } from '../api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStats(), getCycles()])
      .then(([statsRes, cyclesRes]) => {
        setStats(statsRes.data)
        setCycles(cyclesRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pieData = stats ? [
    { name: 'Passed', value: stats.passed, color: '#22c55e' },
    { name: 'Failed', value: stats.failed, color: '#ef4444' },
    { name: 'Blocked', value: stats.blocked, color: '#f59e0b' },
    { name: 'Not Executed', value: stats.total_test_cases - stats.passed - stats.failed - stats.blocked, color: '#6b7280' }
  ].filter(d => d.value > 0) : []

  const cycleChartData = cycles.slice(0, 6).map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '...' : c.name,
    passed: c.passed,
    failed: c.failed,
    blocked: c.blocked
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(20,20,30,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <p className="text-white font-semibold text-sm mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-xs" style={{ color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 pulse-glow"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Shield size={28} className="text-white animate-pulse" />
          </div>
          <p className="text-white font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            color: '#a78bfa'
          }}
        >
          <Shield size={12} />
          QA Analytics Dashboard
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2"
          style={{ letterSpacing: '-0.02em' }}
        >
          Statement<span className="gradient-text">Sense</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>
          AI-Powered Billing Statement QA & Compliance Platform
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { label: 'Total Test Cases', value: stats?.total_test_cases || 0, icon: FileText, color: '#6366f1', glow: 'rgba(99,102,241,0.2)' },
          { label: 'Pass Rate', value: `${stats?.pass_rate || 0}%`, icon: CheckCircle, color: '#22c55e', glow: 'rgba(34,197,94,0.2)' },
          { label: 'Open Defects', value: stats?.open_defects || 0, icon: Bug, color: '#ef4444', glow: 'rgba(239,68,68,0.2)' },
          { label: 'SLA Adherence', value: `${stats?.sla_adherence || 0}%`, icon: Clock, color: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
        ].map(({ label, value, icon: Icon, color, glow }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="ios-card p-5"
            style={{ boxShadow: `0 0 30px ${glow}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${color}20` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <div className="text-3xl font-bold" style={{ color }}>{value}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Second Row Stats */}
      <motion.div
        className="grid grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {[
          { label: 'Test Cycles', value: stats?.total_cycles || 0, color: '#6366f1' },
          { label: 'Passed', value: stats?.passed || 0, color: '#22c55e' },
          { label: 'Failed', value: stats?.failed || 0, color: '#ef4444' },
          { label: 'Critical Defects', value: stats?.critical_defects || 0, color: '#f97316' },
        ].map(({ label, value, color }, i) => (
          <div key={label} className="ios-card p-4">
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }} className="mb-1">{label}</div>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Pie Chart */}
        <div className="ios-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: '#6366f1' }} />
            <span className="text-sm font-medium text-white">Test Execution Status</span>
          </div>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{d.name}</span>
                    <span className="text-white font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center"
              style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}
            >
              No test data yet
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="ios-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart size={16} style={{ color: '#6366f1' }} />
            <span className="text-sm font-medium text-white">Test Cycles Performance</span>
          </div>
          {cycleChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={cycleChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="passed" name="Passed" fill="#22c55e" opacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="failed" name="Failed" fill="#ef4444" opacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="blocked" name="Blocked" fill="#f59e0b" opacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center"
              style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}
            >
              No cycle data yet
            </div>
          )}
        </div>
      </motion.div>

      {/* SLA Metrics */}
      <motion.div
        className="ios-card p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} style={{ color: '#f59e0b' }} />
          <span className="text-sm font-medium text-white">SLA Compliance Metrics</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Execution Completion', target: '100%', actual: '85%', pass: false },
            { label: 'Pass Rate Target', target: '95%', actual: `${stats?.pass_rate || 0}%`, pass: (stats?.pass_rate || 0) >= 95 },
            { label: 'Critical Defects', target: '0', actual: `${stats?.critical_defects || 0}`, pass: (stats?.critical_defects || 0) === 0 },
            { label: 'Defect Leakage', target: '<5%', actual: '2.3%', pass: true },
          ].map(({ label, target, actual, pass }, i) => (
            <div key={i} className="p-3 rounded-2xl"
              style={{
                background: pass ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${pass ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`
              }}
            >
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }} className="mb-2">{label}</div>
              <div className="flex justify-between items-center">
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>Target: {target}</div>
                  <div className="text-white font-semibold text-sm">Actual: {actual}</div>
                </div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded-lg ${pass ? 'badge-low' : 'badge-high'}`}>
                  {pass ? 'PASS' : 'FAIL'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}