import { useMemo, useState } from 'react';
import { useSchools } from './hooks/useSchools.js';
import Header from './components/Header.jsx';
import StatCards from './components/StatCards.jsx';
import SchoolMap from './components/SchoolMap.jsx';
import Filters from './components/Filters.jsx';
import SchoolList from './components/SchoolList.jsx';
import SchoolDetail from './components/SchoolDetail.jsx';
import SubmitForm from './components/SubmitForm.jsx';
import Footer from './components/Footer.jsx';
import Admin from './components/Admin.jsx';

const EMPTY_FILTERS = { q: '', method: 'all', sector: 'all', county: 'all', year: 'all' };

export default function App() {
  if (typeof window !== 'undefined' && window.location.pathname.replace(/\/$/, '') === '/admin') {
    return <Admin />;
  }
  return <Tracker />;
}

function Tracker() {
  const { schools, updatedAt, status } = useSchools();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return schools.filter((s) => {
      if (filters.method !== 'all' && s.storage?.category !== filters.method) return false;
      if (filters.sector !== 'all' && s.sector !== filters.sector) return false;
      if (filters.county !== 'all' && s.county !== filters.county) return false;
      if (filters.year !== 'all' && String(s.year) !== filters.year) return false;
      if (q) {
        const hay = [s.name, s.town, s.county, s.storage?.raw, s.notes].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [schools, filters]);

  const filtersActive = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <>
      <Header updatedAt={updatedAt} onSubmit={() => setSubmitting(true)} />
      <main className="main-content">
        {status === 'error' && <p className="notice">Couldn’t load the data. Please refresh.</p>}

        <div className="law-banner">
          <span className="law-banner-tag">Pending bill</span>
          <p>
            Similar <strong>bell-to-bell</strong> cell phone legislation has passed both the Pennsylvania{' '}
            <strong>Senate</strong> and <strong>House</strong>, and Gov. Shapiro has called for a bill to
            reach his desk. If enacted, every district would need a phone-free policy by the{' '}
            <strong>2027–28 school year</strong> — the schools below are already ahead.{' '}
            <a href="https://whyy.org/articles/pennsylvania-cellphone-ban-schools-k-12/" target="_blank" rel="noopener noreferrer">
              Learn more →
            </a>
          </p>
        </div>

        <StatCards schools={schools} />

        <section className="section">
          <SchoolMap
            schools={schools}
            highlightCounty={filters.county !== 'all' ? filters.county : null}
            onCountyClick={(county) =>
              setFilters((f) => ({ ...f, county: f.county === county ? 'all' : county }))
            }
          />
        </section>

        <section className="section" id="list">
          <Filters
            schools={schools}
            filters={filters}
            setFilters={setFilters}
            resultCount={filtered.length}
            onReset={() => setFilters(EMPTY_FILTERS)}
            filtersActive={filtersActive}
          />
          <SchoolList schools={filtered} onSelect={setSelected} />
        </section>
      </main>

      <Footer onSubmit={() => setSubmitting(true)} />

      {selected && <SchoolDetail school={selected} onClose={() => setSelected(null)} />}
      {submitting && <SubmitForm onClose={() => setSubmitting(false)} />}
    </>
  );
}
