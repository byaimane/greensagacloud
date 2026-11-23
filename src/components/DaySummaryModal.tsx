import React from 'react';
import { CloudRain, Sun } from 'lucide-react';
import { t } from '../i18n/translations';
import { DaySummary, Language } from '../types/game';

interface DaySummaryModalProps {
  language: Language;
  summary: DaySummary;
  onClose: () => void;
}

export const DaySummaryModal: React.FC<DaySummaryModalProps> = ({ language, summary, onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="rpg-panel modal-card"
        style={{ maxWidth: 430, textAlign: 'center', padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          {summary.weather === 'rainy' ? (
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid #38bdf8',
              }}
            >
              <CloudRain size={28} color="#0284c7" />
            </div>
          ) : (
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: '#fef9c3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid #facc15',
              }}
            >
              <Sun size={28} color="#eab308" />
            </div>
          )}
        </div>

        <h2 className="font-display" style={{ margin: '0 0 4px', fontSize: 25, color: '#78350f' }}>
          {t(language, 'goodMorning')} {summary.day}
        </h2>
        <p style={{ margin: '0 0 14px', fontSize: 13.5, color: '#57534e' }}>
          {summary.weather === 'rainy'
            ? t(language, 'rainyMorningDesc')
            : t(language, 'sunnyMorningDesc')}
        </p>

        <div
          style={{
            background: '#ffffff',
            border: '2px solid #fde68a',
            borderRadius: 12,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            fontSize: 13,
            marginBottom: 16,
            textAlign: 'start',
          }}
        >
          <div>⚡ {t(language, 'staminaRestored')}: <b>+{Math.round(summary.staminaRestored)}</b></div>
          <div>🌾 {t(language, 'cropsMatured')}: <b>{summary.cropsMatured}</b></div>
          <div>🍎 {t(language, 'fruitsGrown')}: <b>{summary.fruitsGrown}</b></div>
          <div>🥚 {t(language, 'productsReady')}: <b>{summary.productsReady}</b></div>
          {summary.sprinklerWatered > 0 && (
            <div>💧 {t(language, 'sprinklerWatered')}: <b>{summary.sprinklerWatered}</b></div>
          )}
          <div style={{ color: '#16a34a', fontWeight: 700, marginTop: 2 }}>💾 {t(language, 'autoSaved')}</div>
        </div>

        <button className="rpg-btn rpg-btn-primary" style={{ width: '100%', padding: 11 }} onClick={onClose}>
          {t(language, 'startDay')} {summary.day}
        </button>
      </div>
    </div>
  );
};
