'use client'

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  color = "primary",
  description 
}) {
  const colorClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-info'
  }

  const bgColorClasses = {
    primary: 'bg-primary bg-opacity-10',
    success: 'bg-success bg-opacity-10',
    warning: 'bg-warning bg-opacity-10',
    danger: 'bg-danger bg-opacity-10',
    info: 'bg-info bg-opacity-10'
  }

  const trendColorClass = trend === 'up' ? 'text-success' : 'text-danger'
  const trendBgClass = trend === 'up' ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'

  return (
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className={`rounded-3 d-flex align-items-center justify-content-center ${bgColorClasses[color]}`}
               style={{ width: '48px', height: '48px' }}>
            <i className={`${icon} fs-4 ${colorClasses[color]}`}></i>
          </div>
          
          {trend && trendValue && (
            <div className={`badge ${trendBgClass} ${trendColorClass} border-0`}>
              <i className={`bi bi-arrow-${trend === 'up' ? 'up' : 'down'}-right me-1`}></i>
              {trendValue}
            </div>
          )}
        </div>

        <div>
          <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '1.75rem' }}>
            {value}
          </h3>
          <p className="text-muted mb-1 fw-medium" style={{ fontSize: '0.9rem' }}>
            {title}
          </p>
          {description && (
            <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}