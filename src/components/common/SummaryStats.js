import React from 'react';

function SummaryStats({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="bg-surface-card rounded-xl p-4 border border-dorado-oscuro/25 hover-lift animate-fade-in-up"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="flex items-center justify-between gap-3 text-dorado-oscuro text-sm">
            <span>{stat.label}</span>
            <span className={`stat-chip ${stat.iconColor || 'text-dorado'}`} aria-hidden="true">
              {stat.icon}
            </span>
          </div>
          <div className={`font-inter text-3xl font-semibold tabular-nums mt-1 ${stat.valueColor || 'text-dorado'}`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SummaryStats;
