import { useMemo } from 'react';

export default function StatCards({ schools }) {
  const stats = useMemo(() => {
    const students = schools.reduce((sum, s) => sum + (s.students || 0), 0);
    return { total: schools.length, students };
  }, [schools]);

  if (!schools.length) return null;

  return (
    <div className="stat-cards">
      <Stat value={stats.total} label="schools & districts tracked" />
      <Stat value={`~${formatK(stats.students)}`} label="students phone-free" />
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function formatK(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}
