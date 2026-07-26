/**
 * JS で動きを作るときの時間の解決(motion.md §6)。
 * 部品は reduced-motion で分岐しない。環境の設定は `--motion-scale`(通常 1、reduced で 0)として
 * 降りてくるので、CSS と同じように意味層の duration へ掛ける。0 になったら動かさない(= instant)。
 * 値が読めない環境(トークン未読込)でも 0 に落ちるので、動かないだけで壊れない。
 */
export type MotionSemantic = 'feedback' | 'transition' | 'entrance' | 'exit' | 'expand';

export const resolveMotion = (
  style: Pick<CSSStyleDeclaration, 'getPropertyValue'>,
  semantic: MotionSemantic,
): { duration: number; easing: string } => {
  const duration = parseFloat(style.getPropertyValue(`--motion-${semantic}-duration`));
  const scale = parseFloat(style.getPropertyValue('--motion-scale'));
  const easing = style.getPropertyValue(`--motion-${semantic}-easing`).trim() || 'linear';
  if (!Number.isFinite(duration) || !Number.isFinite(scale)) return { duration: 0, easing };
  return { duration: duration * scale, easing };
};
