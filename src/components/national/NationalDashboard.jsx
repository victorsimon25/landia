import { useEffect, useState } from 'react'
import { useNationalStats } from '../../hooks/useNationalStats.js'
import ErrorState from '../ui/ErrorState.jsx'

const reducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

function fmt(n) {
  return n.toLocaleString('en-IN')
}

function useCountUp(target, duration = 900, delay = 0) {
  const [value, setValue] = useState(reducedMotion ? target : 0)
  useEffect(() => {
    if (reducedMotion) { setValue(target); return }
    setValue(0)
    let rafId
    const isFloat = target % 1 !== 0
    const timeoutId = setTimeout(() => {
      const startTime = performance.now()
      const tick = (now) => {
        const elapsed = now - startTime
        const t = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        const current = eased * target
        setValue(isFloat ? Math.round(current * 10) / 10 : Math.floor(current))
        if (t < 1) { rafId = requestAnimationFrame(tick) }
        else { setValue(target) }
      }
      rafId = requestAnimationFrame(tick)
    }, delay)
    return () => { clearTimeout(timeoutId); cancelAnimationFrame(rafId) }
  }, [target, duration, delay])
  return value
}

function useDelayedTrue(delay) {
  const [ready, setReady] = useState(reducedMotion)
  useEffect(() => {
    if (reducedMotion) { setReady(true); return }
    const t = setTimeout(() => setReady(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return ready
}

function AnimBar({ percent, color, delay }) {
  const ready = useDelayedTrue(delay)
  return (
    <div className="h-2 rounded-full bg-white/30 overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{
          width: ready ? `${Math.min(100, percent)}%` : '0%',
          transition: reducedMotion ? 'none' : 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  )
}

function SectionCard({ title, children, noHover = false, tint, accent, glowRgba, animDelay = 0, className = '' }) {
  const [hovered, setHovered] = useState(false)
  const isHovering = !noHover && hovered && !reducedMotion
  return (
    <div
      className={`rounded-2xl border border-white/50 overflow-hidden card-enter ${className}`}
      style={{
        animationDelay: `${animDelay}ms`,
        transform: isHovering ? 'translateY(-5px) scale(1.005)' : '',
        boxShadow: isHovering
          ? `0 20px 60px ${glowRgba}, 0 8px 24px rgba(0,0,0,0.10)`
          : '0 4px 20px rgba(0,0,0,0.08)',
        transition: reducedMotion ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
      }}
      onMouseEnter={() => !noHover && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {accent && <div className={`h-[3px] w-full ${accent}`} />}
      <div className={`${tint} backdrop-blur-xl p-5`}>
        <h3 className="text-[11px] font-semibold text-slate-400 tracking-wide mb-4 uppercase">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function ProjectsCard({ data }) {
  const { total, active, completed, stalled } = data
  const DELAY = 0
  const animTotal = useCountUp(total, 900, DELAY)
  const items = [
    { label: 'Active',    value: active,    pct: Math.round((active    / total) * 100), dot: 'bg-[#04C1BD]',   bar: 'bg-[#04C1BD]',   text: 'text-[#04C1BD]' },
    { label: 'Completed', value: completed, pct: Math.round((completed / total) * 100), dot: 'bg-emerald-500', bar: 'bg-emerald-500', text: 'text-emerald-600' },
    { label: 'Stalled',   value: stalled,   pct: Math.round((stalled   / total) * 100), dot: 'bg-amber-500',   bar: 'bg-amber-500',   text: 'text-amber-600' },
  ]
  return (
    <SectionCard
      title="Total Projects"
      tint="bg-gradient-to-br from-[#04C1BD]/20 via-[#04C1BD]/10 to-white/55"
      accent="bg-gradient-to-r from-[#04C1BD] to-cyan-400"
      glowRgba="rgba(4,193,189,0.32)"
      animDelay={DELAY}
    >
      <div className="mb-5">
        <span className="text-4xl font-bold tracking-tight text-slate-900 tabular-nums">{fmt(animTotal)}</span>
        <span className="text-xs text-slate-400 ml-2 font-medium">projects</span>
      </div>
      <div className="space-y-3.5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.dot}`} />
                <span className="text-xs text-slate-500">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold tabular-nums ${item.text}`}>{fmt(item.value)}</span>
                <span className="text-[10px] text-slate-400 tabular-nums">{item.pct}%</span>
              </div>
            </div>
            <AnimBar percent={item.pct} color={item.bar} delay={DELAY + 450} />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function LandCard({ data }) {
  const { proposedHa, acquiredHa, acquiredPercent, possessionHa, possessionPercent } = data
  const DELAY = 80
  const animPct = useCountUp(acquiredPercent, 900, DELAY)
  return (
    <SectionCard
      title="Land Acquisition"
      tint="bg-gradient-to-br from-blue-500/15 via-blue-400/10 to-white/55"
      accent="bg-gradient-to-r from-blue-500 to-sky-400"
      glowRgba="rgba(59,130,246,0.28)"
      animDelay={DELAY}
    >
      <div className="mb-4">
        <span className="text-4xl font-bold tracking-tight text-blue-600 tabular-nums">{animPct}%</span>
        <span className="text-xs text-slate-400 ml-2 font-medium">acquired</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-500">Proposed</span>
          <span className="text-xs font-semibold text-slate-700 tabular-nums">{fmt(proposedHa)} ha</span>
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs text-slate-500">Acquired</span>
            <span className="text-xs font-semibold text-slate-700 tabular-nums">{fmt(acquiredHa)} ha</span>
          </div>
          <AnimBar percent={acquiredPercent} color="bg-blue-500" delay={DELAY + 450} />
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs text-slate-500">Possession</span>
            <span className="text-xs font-semibold text-slate-700 tabular-nums">{fmt(possessionHa)} ha</span>
          </div>
          <AnimBar percent={possessionPercent} color="bg-emerald-500" delay={DELAY + 580} />
        </div>
      </div>
    </SectionCard>
  )
}

function CompensationCard({ data }) {
  const { assessedCr, disbursedCr, disbursedPercent, pendingCr } = data
  const DELAY = 160
  const animPct = useCountUp(disbursedPercent, 900, DELAY)
  return (
    <SectionCard
      title="Compensation"
      tint="bg-gradient-to-br from-emerald-500/15 via-emerald-400/10 to-white/55"
      accent="bg-gradient-to-r from-emerald-500 to-teal-400"
      glowRgba="rgba(16,185,129,0.28)"
      animDelay={DELAY}
    >
      <div className="mb-4">
        <span className="text-4xl font-bold tracking-tight text-emerald-600 tabular-nums">{animPct}%</span>
        <span className="text-xs text-slate-400 ml-2 font-medium">disbursed</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-500">Total Assessed</span>
          <span className="text-xs font-semibold text-slate-700 tabular-nums">₹{fmt(assessedCr)} Cr</span>
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs text-slate-500">Disbursed</span>
            <span className="text-xs font-semibold text-slate-700 tabular-nums">₹{fmt(disbursedCr)} Cr</span>
          </div>
          <AnimBar percent={disbursedPercent} color="bg-emerald-500" delay={DELAY + 450} />
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-500">Pending</span>
          <span className="text-xs font-semibold text-slate-700 tabular-nums">₹{fmt(pendingCr)} Cr</span>
        </div>
      </div>
    </SectionCard>
  )
}

function PopulationCard({ data }) {
  const { affectedFamilies, displacedFamilies, rrBeneficiaries, rrCompletionPercent } = data
  const DELAY = 240
  const animPct = useCountUp(rrCompletionPercent, 900, DELAY)
  return (
    <SectionCard
      title="Affected Population"
      tint="bg-gradient-to-br from-purple-500/15 via-violet-400/10 to-white/55"
      accent="bg-gradient-to-r from-purple-500 to-violet-400"
      glowRgba="rgba(168,85,247,0.28)"
      animDelay={DELAY}
    >
      <div className="mb-4">
        <span className="text-4xl font-bold tracking-tight text-purple-600 tabular-nums">{animPct}%</span>
        <span className="text-xs text-slate-400 ml-2 font-medium">R&amp;R complete</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-500">Affected Families</span>
          <span className="text-xs font-semibold text-slate-700 tabular-nums">{fmt(affectedFamilies)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-500">Displaced Families</span>
          <span className="text-xs font-semibold text-slate-700 tabular-nums">{fmt(displacedFamilies)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-500">R&amp;R Beneficiaries</span>
          <span className="text-xs font-semibold text-slate-700 tabular-nums">{fmt(rrBeneficiaries)}</span>
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs text-slate-500">R&amp;R Completion</span>
            <span className="text-xs font-semibold text-slate-700 tabular-nums">{rrCompletionPercent}%</span>
          </div>
          <AnimBar percent={rrCompletionPercent} color="bg-purple-500" delay={DELAY + 450} />
        </div>
      </div>
    </SectionCard>
  )
}

function TimelineCard({ data }) {
  const { onSchedule, onSchedulePercent, delayed, delayedPercent, atRisk, atRiskPercent } = data
  const DELAY = 320
  const animOnSchedule = useCountUp(onSchedule, 900, DELAY)
  const animDelayed    = useCountUp(delayed, 900, DELAY + 40)
  const animAtRisk     = useCountUp(atRisk, 900, DELAY + 80)
  return (
    <SectionCard
      title="Timeline Performance"
      noHover
      tint="bg-white/60"
      accent=""
      animDelay={DELAY}
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-400/5 border border-emerald-400/20 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold tracking-tight text-emerald-700 mb-1 tabular-nums">{fmt(animOnSchedule)}</div>
          <div className="text-xs font-semibold text-emerald-600 mb-0.5">On Schedule</div>
          <div className="text-[10px] text-emerald-500/80 tabular-nums">{onSchedulePercent}% of projects</div>
        </div>
        <div className="bg-gradient-to-br from-red-500/15 to-red-400/5 border border-red-400/20 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold tracking-tight text-red-700 mb-1 tabular-nums">{fmt(animDelayed)}</div>
          <div className="text-xs font-semibold text-red-600 mb-0.5">Delayed</div>
          <div className="text-[10px] text-red-500/80 tabular-nums">{delayedPercent}% of projects</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/15 to-amber-400/5 border border-amber-400/20 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold tracking-tight text-amber-700 mb-1 tabular-nums">{fmt(animAtRisk)}</div>
          <div className="text-xs font-semibold text-amber-600 mb-0.5">At Risk</div>
          <div className="text-[10px] text-amber-500/80 tabular-nums">{atRiskPercent}% of projects</div>
        </div>
      </div>
    </SectionCard>
  )
}

export default function NationalDashboard() {
  const { stats, loading, error, refetch } = useNationalStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-slate-500">Loading national statistics…</p>
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={refetch} />

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-slate-500">No data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <ProjectsCard data={stats.projects} />
        <LandCard data={stats.landAcquisition} />
        <CompensationCard data={stats.compensation} />
        <PopulationCard data={stats.affectedPopulation} />
      </div>
      <TimelineCard data={stats.timeline} />
    </div>
  )
}
