// src/App.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import Compare from './components/Compare'
import TestCycles from './components/TestCycles'
import Defects from './components/Defects'
import Mainframe from './components/Mainframe'
import { getStats } from './api'
import SQLValidator from './components/SQLValidator'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [cycleRefresh, setCycleRefresh] = useState(0)

  useEffect(() => {
    fetchStats()
  }, [cycleRefresh])

  const fetchStats = async () => {
    try {
      const res = await getStats()
      setStats(res.data)
    } catch (e) {}
  }

  const handleCycleCreated = () => {
    setCycleRefresh(v => v + 1)
    setTimeout(() => setActivePage('cycles'), 800)
  }


  const pages = {
    dashboard: <Dashboard />,
    compare: <Compare onCycleCreated={handleCycleCreated} />,
    cycles: <TestCycles key={cycleRefresh} />,
    defects: <Defects />,
    sql: <SQLValidator />,
    mainframe: <Mainframe />,
  }

  return (
    <div className="min-h-screen bg-animated">
      <Navbar activePage={activePage} setActivePage={setActivePage} stats={stats} />

      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {pages[activePage]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}