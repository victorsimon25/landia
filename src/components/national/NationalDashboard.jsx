import { useNationalStats } from '../../hooks/useNationalStats.js'
import ErrorState from '../ui/ErrorState.jsx'

function fmt(n) {
  return n.toLocaleString('en-IN')
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        {title}
      </h3>
      {children}
    </div>
  )
}

function ProgressRow({ label, value, percent, color }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-semibold text-slate-700">{value}</span>
      </div>
      {percent != null && (
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function ProjectsCard({ data }) {
  const { total, active, completed, stalled } = data
  return (
    <SectionCard title="Total Projects">
      <div className="mb-5">
        <span className="text-3xl font-bold text-slate-900">{fmt(total)}</span>
      </div>
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-600 flex-shrink-0" />
            <span className="text-xs text-slate-500">Active</span>
          </div>
          <span className="text-xs font-semibold text-slate-700">{fmt(active)}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-xs text-slate-500">Completed</span>
          </div>
          <span className="text-xs font-semibold text-slate-700">{fmt(completed)}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="text-xs text-slate-500">Stalled</span>
          </div>
          <span className="text-xs font-semibold text-slate-700">{fmt(stalled)}</span>
        </div>
      </div>
    </SectionCard>
  )
}

function LandCard({ data }) {
  const { proposedHa, acquiredHa, acquiredPercent, possessionHa, possessionPercent } = data
  return (
    <SectionCard title="Land Acquisition">
      <div className="space-y-3">
        <ProgressRow
          label="Proposed"
          value={`${fmt(proposedHa)} ha`}
          percent={null}
        />
        <ProgressRow
          label="Acquired"
          value={`${fmt(acquiredHa)} ha (${acquiredPercent}%)`}
          percent={acquiredPercent}
          color="bg-blue-500"
        />
        <ProgressRow
          label="Possession Complete"
          value={`${fmt(possessionHa)} ha (${possessionPercent}%)`}
          percent={possessionPercent}
          color="bg-emerald-500"
        />
      </div>
    </SectionCard>
  )
}

function CompensationCard({ data }) {
  const { assessedCr, disbursedCr, disbursedPercent, pendingCr } = data
  return (
    <SectionCard title="Compensation">
      <div className="space-y-3">
        <ProgressRow
          label="Total Assessed"
          value={`₹${fmt(assessedCr)} Cr`}
          percent={null}
        />
        <ProgressRow
          label="Disbursed"
          value={`₹${fmt(disbursedCr)} Cr (${disbursedPercent}%)`}
          percent={disbursedPercent}
          color="bg-emerald-500"
        />
        <ProgressRow
          label="Pending"
          value={`₹${fmt(pendingCr)} Cr`}
          percent={null}
        />
      </div>
    </SectionCard>
  )
}

function PopulationCard({ data }) {
  const { affectedFamilies, displacedFamilies, rrBeneficiaries, rrCompletionPercent } = data
  return (
    <SectionCard title="Affected Population">
      <div className="space-y-3">
        <ProgressRow
          label="Affected Families"
          value={fmt(affectedFamilies)}
          percent={null}
        />
        <ProgressRow
          label="Displaced Families"
          value={fmt(displacedFamilies)}
          percent={null}
        />
        <ProgressRow
          label="R&R Beneficiaries"
          value={fmt(rrBeneficiaries)}
          percent={null}
        />
        <ProgressRow
          label="R&R Completion"
          value={`${rrCompletionPercent}%`}
          percent={rrCompletionPercent}
          color="bg-purple-500"
        />
      </div>
    </SectionCard>
  )
}

function TimelineCard({ data }) {
  const { onSchedule, onSchedulePercent, delayed, delayedPercent, atRisk, atRiskPercent } = data
  return (
    <SectionCard title="Timeline Performance">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700 mb-0.5">{fmt(onSchedule)}</div>
          <div className="text-xs font-medium text-green-600 mb-0.5">On Schedule</div>
          <div className="text-xs text-green-500">{onSchedulePercent}% of projects</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-700 mb-0.5">{fmt(delayed)}</div>
          <div className="text-xs font-medium text-red-600 mb-0.5">Delayed</div>
          <div className="text-xs text-red-500">{delayedPercent}% of projects</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-700 mb-0.5">{fmt(atRisk)}</div>
          <div className="text-xs font-medium text-amber-600 mb-0.5">At Risk</div>
          <div className="text-xs text-amber-500">{atRiskPercent}% of projects</div>
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

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />
  }

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
