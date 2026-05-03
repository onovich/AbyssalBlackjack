import { Play } from 'lucide-react';

export function StartScreen({ onStart }) {
  return (
    <section className="screen screen--centered">
      <div className="intro-card">
        <p>构建你的深潜牌组，追上越来越苛刻的目标点数，在 21 点边缘完成压制。</p>
        <ul className="intro-list">
          <li>抽牌直到点数大于等于目标，但不能超过 21。</li>
          <li>每次胜利会奖励金币，失败会失去生命。</li>
          <li>局间商店可补强牌组，也能删除拖累节奏的废牌。</li>
        </ul>
      </div>

      <button type="button" className="cta-button" onClick={onStart}>
        <Play size={20} />
        <span>开始下潜</span>
      </button>
    </section>
  );
}