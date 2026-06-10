import { useEffect, useState } from 'react';
import { methodMeta, sectorLabel } from '../lib/storage.js';

export default function SchoolDetail({ school, onClose }) {
  const [copied, setCopied] = useState(false);
  const meta = methodMeta(school.storage?.category);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const quote = school.notes || school.storage?.raw;
  const copyPolicy = () => {
    if (!quote) return;
    navigator.clipboard?.writeText(quote).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <span className="school-method-tag" style={{ background: meta.color }}>{meta.short}</span>
        <h2 className="modal-title">{school.name}</h2>
        <p className="modal-sub">
          {[school.town, school.county && `${school.county} County`].filter(Boolean).join(' · ')}
        </p>

        <dl className="detail-grid">
          <Row term="Type" val={sectorLabel(school.sector)} />
          <Row term="Grade levels" val={school.level} />
          <Row term="Students" val={school.students ? school.students.toLocaleString() : null} />
          <Row term="Storage method" val={school.storage?.raw || meta.label} />
          <Row term="In effect" val={school.effective} />
        </dl>

        {quote && (
          <div className="policy-box">
            <div className="policy-box-head">
              <span>Policy language &amp; notes</span>
              <button className="copy-btn" onClick={copyPolicy}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <blockquote>{quote}</blockquote>
          </div>
        )}

        {school.links?.length > 0 && (
          <div className="detail-links">
            <strong>Sources</strong>
            <ul>
              {school.links.map((l, i) => (
                <li key={i}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.kind === 'policy' ? '📄 ' : '📰 '}{l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {school.contact && (
          <div className="detail-contact">
            <strong>District contact</strong>
            <p>{school.contact}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ term, val }) {
  if (!val) return null;
  return (
    <>
      <dt>{term}</dt>
      <dd>{val}</dd>
    </>
  );
}
