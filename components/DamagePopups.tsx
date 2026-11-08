import React from 'react';
import type { DamagePopup } from '../types';

const DamagePopups: React.FC<{ damagePopups: DamagePopup[] }> = ({ damagePopups }) => (
  <>
    {damagePopups.map(p => (
      <div key={p.id} className={`damage-popup damage-popup-${p.type}`} style={{ left: p.x, top: p.y }}>
        {p.text}
      </div>
    ))}
  </>
);

export default DamagePopups;
