import { Coins, Heart } from 'lucide-react';
import { MAX_HP } from '../../../game/config';

export function StatBar({ hp, coins, stage }) {
  return (
    <div className="panel stat-bar">
      <div className="stat-bar__group">
        <div className="stat-pill stat-pill--danger">
          <Heart size={18} className={hp === 1 ? 'pulse' : ''} />
          <span>
            {hp}/{MAX_HP}
          </span>
        </div>
        <div className="stat-pill stat-pill--gold">
          <Coins size={18} />
          <span>{coins}</span>
        </div>
      </div>
      <div className="stat-bar__stage">第 {stage + 1} 阶段</div>
    </div>
  );
}