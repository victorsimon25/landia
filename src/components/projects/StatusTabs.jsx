const TABS = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
]

export default function StatusTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex gap-1 border-b border-slate-200 mb-6">
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px',
              isActive
                ? 'text-primary-600 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
