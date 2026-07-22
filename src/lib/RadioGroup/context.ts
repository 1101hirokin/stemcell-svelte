/**
 * RadioGroup が項目(Radio)へ渡す文脈。値はグループがひとつ持ち(field.md §5)、項目は
 * checked を持たず、選ばれているかはグループの value との一致から導く(Radio 契約)。
 * native の <input type=radio> を同一 name で束ねると、矢印キー・roving tabindex・disabled
 * スキップをブラウザが無償で提供する(web-keys.rules.json arrows.radiogroup。field.md の
 * 「native を使い再発明しない」)。name / 選択の通知 / グループの disabled・invalid をここで渡す。
 */
import { getContext, setContext } from 'svelte';

const KEY = Symbol('stemcell-radiogroup');

export interface RadioGroupContext {
  /** native radio を束ねる共有 name(ブラウザのグループ化のトリガー)。 */
  readonly name: string;
  /** 選択中の value(グループが所有。項目は自分の value との一致で checked を導く)。 */
  readonly value: string | undefined;
  /** グループ全体の無効(項目へ降りる)。 */
  readonly disabled: boolean;
  /** グループの invalid(danger が項目の描画へ降りる。Radio は invalid prop を持たない)。 */
  readonly invalid: boolean;
  /** 項目が選ばれたときに呼ぶ。グループが change を発火し、value の更新はアプリが行う。 */
  select(value: string): void;
}

export const setRadioGroupContext = (ctx: RadioGroupContext) => setContext(KEY, ctx);
export const getRadioGroupContext = (): RadioGroupContext | undefined => getContext(KEY);
