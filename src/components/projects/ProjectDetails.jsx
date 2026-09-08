import { Check, AlertTriangle, Calendar, Ruler, Activity, Users } from 'lucide-react'

function SectionTitle({ children }) {
  return (
    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-3">
      {children}
    </h4>
  )
}

function MiniProgressBar({ percent, color = 'bg-blue-500' }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden bg-white/40 flex-1">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  )
}

function OverviewSection({ project }) {
  const fmt = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  }

  return (
    <div>
      <SectionTitle>Project Overview</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
        <div className="bg-white/50 rounded-xl border border-white/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Activity className="w-3.5 h-3.5" />
            Type
          </div>
          <div className="text-sm font-semibold text-slate-800">{project.type}</div>
        </div>
        <div className="bg-white/50 rounded-xl border border-white/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Ruler className="w-3.5 h-3.5" />
            Route Length
          </div>
          <div className="text-sm font-semibold text-slate-800">{project.routeLengthKm} km</div>
        </div>
        <div className="bg-white/50 rounded-xl border border-white/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            Started
          </div>
          <div className="text-sm font-semibold text-slate-800">{fmt(project.startDate)}</div>
        </div>
        <div className="bg-white/50 rounded-xl border border-white/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            Target Completion
          </div>
          <div className="text-sm font-semibold text-slate-800">{fmt(project.targetCompletionDate)}</div>
        </div>
      </div>
      {project.currentDelayMonths > 0 ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
          <AlertTriangle className="w-3.5 h-3.5" />
          Delayed by {project.currentDelayMonths} month{project.currentDelayMonths !== 1 ? 's' : ''}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-100">
          <Check className="w-3.5 h-3.5" />
          On Schedule
        </span>
      )}
    </div>
  )
}

function LandAcquisitionSection({ la }) {
  const rows = [
    {
      label: 'Required',
      value: `${la.requiredHa.toLocaleString('en-IN')} ha`,
      sub: `${la.requiredParcels.toLocaleString('en-IN')} parcels`,
      percent: null,
    },
    {
      label: 'Notified',
      value: `${la.notifiedHa.toLocaleString('en-IN')} ha`,
      sub: `${la.notifiedPercent}%`,
      percent: la.notifiedPercent,
      color: 'bg-blue-500',
    },
    {
      label: 'Awards Declared',
      value: `${la.awardsDeclaredHa.toLocaleString('en-IN')} ha`,
      sub: `${la.awardsDeclaredPercent}%`,
      percent: la.awardsDeclaredPercent,
      color: 'bg-amber-500',
    },
    {
      label: 'Possession',
      value: `${la.possessionHa.toLocaleString('en-IN')} ha`,
      sub: `${la.possessionPercent}%`,
      percent: la.possessionPercent,
      color: 'bg-emerald-500',
    },
  ]

  return (
    <div>
      <SectionTitle>Land Acquisition</SectionTitle>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <div className="w-32 sm:w-36 flex-shrink-0">
              <span className="text-xs text-slate-500">{row.label}</span>
            </div>
            <div className="flex-1 flex items-center gap-3 min-w-0">
              {row.percent !== null ? (
                <MiniProgressBar percent={row.percent} color={row.color} />
              ) : (
                <div className="flex-1" />
              )}
              <div className="text-right flex-shrink-0">
                <span className="text-xs font-semibold text-slate-700">{row.value}</span>
                <span className="text-xs text-slate-400 ml-1.5">{row.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompensationSection({ comp }) {
  const rows = [
    {
      label: 'Assessed',
      amount: comp.assessedCr,
      detail: `${comp.assessedAwards.toLocaleString('en-IN')} awards`,
      color: 'text-slate-700',
      dot: 'bg-slate-300',
    },
    {
      label: 'Disbursed',
      amount: comp.disbursedCr,
      detail: `${comp.disbursedBeneficiaries.toLocaleString('en-IN')} beneficiaries`,
      color: 'text-emerald-700',
      dot: 'bg-emerald-400',
    },
    {
      label: 'Pending',
      amount: comp.pendingCr,
      detail: `${comp.pendingBeneficiaries.toLocaleString('en-IN')} beneficiaries`,
      color: 'text-amber-700',
      dot: 'bg-amber-400',
    },
  ]

  return (
    <div>
      <SectionTitle>Compensation</SectionTitle>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${row.dot}`} />
              <span className="text-xs text-slate-500 w-20">{row.label}</span>
            </div>
            <div className="flex items-baseline gap-2 flex-1 justify-end flex-wrap">
              <span className={`text-sm font-semibold ${row.color}`}>
                ₹{row.amount.toLocaleString('en-IN')} Cr
              </span>
              <span className="text-xs text-slate-400">{row.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RRSection({ rr }) {
  const subItems = [
    {
      label: 'Land Allotted',
      done: rr.landAllotted,
      total: rr.landTotal,
      percent: rr.landTotal > 0 ? (rr.landAllotted / rr.landTotal) * 100 : 0,
    },
    {
      label: 'Houses Constructed',
      done: rr.housesConstructed,
      total: rr.housesTotal,
      percent: rr.housesTotal > 0 ? (rr.housesConstructed / rr.housesTotal) * 100 : 0,
    },
    {
      label: 'Employment Provided',
      done: rr.employmentProvided,
      total: rr.employmentTotal,
      percent: rr.employmentTotal > 0 ? (rr.employmentProvided / rr.employmentTotal) * 100 : 0,
    },
  ]

  return (
    <div>
      <SectionTitle>Rehabilitation &amp; Resettlement</SectionTitle>
      <div className="flex items-center gap-3 mb-4 p-3 bg-white/50 rounded-xl border border-white/40">
        <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-600 font-medium">
              {rr.displacedFamilies.toLocaleString('en-IN')} displaced families
            </span>
            <span className="text-slate-500 font-semibold">{rr.progressPercent}% overall</span>
          </div>
          <MiniProgressBar
            percent={rr.progressPercent}
            color={rr.progressPercent === 100 ? 'bg-green-500' : 'bg-purple-500'}
          />
        </div>
      </div>
      <div className="space-y-2.5">
        {subItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-36 sm:w-40 flex-shrink-0">
              <span className="text-xs text-slate-500">{item.label}</span>
            </div>
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <MiniProgressBar
                percent={item.percent}
                color={item.percent === 100 ? 'bg-green-500' : 'bg-purple-400'}
              />
              <span className="text-xs font-semibold text-slate-600 flex-shrink-0 w-16 text-right">
                {item.done}/{item.total}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineSection({ timeline }) {
  const colorMap = {
    completed: 'bg-green-500',
    in_progress: 'bg-blue-500',
    not_started: 'bg-slate-200',
  }

  return (
    <div>
      <SectionTitle>Acquisition Timeline</SectionTitle>
      <div className="space-y-2.5">
        {timeline.map((item) => (
          <div key={item.stage} className="flex items-center gap-3">
            <div className="w-24 sm:w-28 flex-shrink-0 flex items-center gap-1.5">
              {item.status === 'completed' ? (
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span className="text-xs text-slate-600 font-medium truncate">{item.stage}</span>
            </div>
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <div className="h-2 rounded-full overflow-hidden bg-white/40 flex-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colorMap[item.status] || 'bg-slate-200'}`}
                  style={{ width: `${Math.min(100, item.percent)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-500 flex-shrink-0 w-10 text-right">
                {item.percent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AlertsSection({ alerts }) {
  if (!alerts || alerts.length === 0) return null

  const bgMap = { high: 'bg-red-500/10 border-red-400/25', medium: 'bg-amber-500/10 border-amber-400/25' }
  const iconMap = { high: 'text-red-500', medium: 'text-amber-500' }
  const textMap = { high: 'text-red-700', medium: 'text-amber-700' }

  return (
    <div>
      <SectionTitle>Active Alerts</SectionTitle>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm ${bgMap[alert.severity] || 'bg-slate-50 border-slate-100'}`}
          >
            <AlertTriangle
              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconMap[alert.severity] || 'text-slate-400'}`}
            />
            <span className={`${textMap[alert.severity] || 'text-slate-700'} text-xs font-medium`}>
              {alert.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProjectDetails({ project }) {
  return (
    <div className="px-5 pb-6 pt-2 border-t border-white/30">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        <div className="space-y-8">
          <OverviewSection project={project} />
          <LandAcquisitionSection la={project.landAcquisition} />
          <CompensationSection comp={project.compensation} />
        </div>
        <div className="space-y-8">
          <RRSection rr={project.rr} />
          <TimelineSection timeline={project.timeline} />
          <AlertsSection alerts={project.alerts} />
        </div>
      </div>
    </div>
  )
}
