/**
 * AGENTS.md の生成器(v1)。エージェント向け配布物は契約から生成し、手で書かない
 * (裁定 2026-07: AI ネイティブ化の土台。第二の SSOT を作らないため)。
 *
 * 二層構成:
 * - 部品の事実(props / slots / events / 既定値 / 説明)は契約(../stemcell-component-prompts)
 *   から導出する。対象は実装済み部品のみ(conformance と同じ判定)。
 * - 契約 → Svelte の写像規則(イベント→callback prop、slot→snippet 等)は本ファイルの
 *   テンプレートが持つ。写像は土地の声であり(GOVERNANCE §6-2)、契約には書かれないため、
 *   その SSOT は実装リポのここに置く。
 *
 * 実行: bun run agents        → AGENTS.md を書き出す
 *       bun run agents:check  → 既存の AGENTS.md と一致するか検査(乖離の門)
 */
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SPEC = join(import.meta.dirname, '../../stemcell-component-prompts/contracts');
const LIB = join(import.meta.dirname, '../src/lib');
const OUT = join(import.meta.dirname, '../AGENTS.md');

type Prop = {
  type: string;
  values?: string[];
  default?: unknown;
  optional?: boolean;
  description?: string;
};
type Contract = {
  component: string;
  version: string;
  description?: string;
  extends?: string;
  props?: Record<string, Prop>;
  events?: Record<string, { payload?: string; description?: string }>;
  slots?: Record<string, { required?: boolean; description?: string }>;
  a11y?: { role?: string; focusRing?: boolean; notes?: string[] };
};

const load = (name: string): Contract =>
  JSON.parse(readFileSync(join(SPEC, name, 'contract.json'), 'utf-8'));

const resolve = (c: Contract): Contract => {
  if (!c.extends) return c;
  const p = load(c.extends);
  return { ...c, props: { ...(p.props ?? {}), ...(c.props ?? {}) } };
};

/** イベント名 → Svelte の callback prop 名。 */
const eventProp = (name: string) => `on${name}`;

const propRow = (name: string, p: Prop): string => {
  const type = p.values ? p.values.map((v) => `"${v}"`).join(' | ') : p.type;
  const dflt = p.default === undefined ? (p.optional ? '(省略可)' : '') : `既定 ${JSON.stringify(p.default)}`;
  return `- \`${name}\`: ${type}${dflt ? `(${dflt})` : ''}${p.description ? ` — ${p.description}` : ''}`;
};

const dirs = readdirSync(SPEC, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((name) => existsSync(join(LIB, name, 'meta.ts')))
  .sort();

const sections = dirs.map((name) => {
  const c = resolve(load(name));
  const lines: string[] = [`### ${name}(契約 ${c.version})`, ''];
  if (c.description) lines.push(c.description, '');
  const props = Object.entries(c.props ?? {});
  if (props.length) {
    lines.push('props:', '');
    for (const [n, p] of props) lines.push(propRow(n, p));
    lines.push('');
  }
  const events = Object.entries(c.events ?? {});
  if (events.length) {
    lines.push('events(Svelte では callback prop):', '');
    for (const [n, e] of events)
      lines.push(`- \`${eventProp(n)}\`: (payload: ${e.payload ?? 'void'}) => void${e.description ? ` — ${e.description}` : ''}`);
    lines.push('');
  }
  const slots = Object.entries(c.slots ?? {});
  if (slots.length) {
    lines.push('slots(Svelte では snippet。default は子要素をそのまま):', '');
    for (const [n, s] of slots)
      lines.push(`- \`${n}\`${s.required ? '(必須)' : ''}${s.description ? ` — ${s.description}` : ''}`);
    lines.push('');
  }
  if (c.a11y?.notes?.length) {
    lines.push('a11y(実装が保証する。アプリ側で aria を足さないこと):', '');
    for (const n of c.a11y.notes) lines.push(`- ${n}`);
    lines.push('');
  }
  return lines.join('\n');
});

const doc = `<!-- 自動生成。編集しない(源は契約と agents/generate.ts。再生成は bun run agents) -->
# @stemcell/svelte エージェント向けガイド

stemcell デザインシステムの Svelte 5 実装。部品の事実は機械可読契約
(stemcell-component-prompts)から生成されており、このファイルと契約が食い違ったら契約が正である。

## 前提(まずこれだけ守る)

- Svelte 5(runes)。named import: \`import { ${dirs.join(', ')} } from '@stemcell/svelte'\`
- tokens の CSS をアプリの入口で読み込む: \`import '@stemcell/tokens/standard.css'\`
  (密度切替を使うなら \`import '@stemcell/tokens/density-compact.css'\` も)
- \`StemcellProvider\` をアプリのルートに1回だけ、自己完結タグで置く: \`<StemcellProvider theme="auto" />\`。
  DOM を出さない副作用であり、子を包まない。複数回置かない。「入口」とはアプリの最上位
  (vite なら main.ts と最上位コンポーネント。単一ファイルの実験なら App.svelte でよい)
- 生成したコードは svelte-check(型)で検証できる。存在しない prop / snippet は型エラーになる

## 契約 → Svelte の写像(全部品共通)

- イベントは callback prop で受ける。契約の \`click\` は \`onclick={fn}\`、\`change\` は
  \`onchange={(value) => ...}\`(payload は第1引数)。\`on:click\` ディレクティブ形式ではない
- slot は snippet で渡す: \`{#snippet label()}氏名{/snippet}\`。default slot は子要素をそのまま書く
- \`value\` は \`bind:value\` に対応する(\$bindable)。アプリが値を所有して拒否・整形したい場合は
  bind + onchange で差し戻す。非 bind の value + onchange はキーストローク単位の拒否が効かない
- 間隔(gap / inset)の語彙は 段("sm" / "md" / "lg")または大域の原始("8"〜"24" の整数の文字列)。
  生の px・任意の CSS 値は受けず、warn して既定へ退避する
- 長さ(threshold / min / sideWidth)の単位は rem の文字列("30rem" 等)。px は受けない
- 色・寸法を style で直接上書きしない。トークンの外の値は使わない

## よくある誤り

- error slot は invalid が true のときだけ描画される。常時渡してよい(出し分けは部品がやる)
- placeholder を label の代わりに使わない(label は必須の snippet)
- Button に type="submit" は無い(フォーム参加は未決の仕様)。送信は onclick でアプリが行う
- blur / focus のイベントは契約に無い。確定タイミングが要るなら部品を包む要素で
  focusout / keydown を捕捉する
- autocomplete は WHATWG Autofill の語彙で書く(例: name / email / tel / postal-code /
  street-address / organization)。個人情報を集める欄では省略しない
- disabled と invalid が同時のときは disabled の見た目が勝つ(仕様)

## 部品

${sections.join('\n')}
`;

const mode = process.argv[2];
if (mode === '--check') {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf-8') : '';
  if (current !== doc) {
    console.error('AGENTS.md が契約から乖離している。bun run agents で再生成すること。');
    process.exit(1);
  }
  console.log('AGENTS.md is in sync with contracts');
} else {
  writeFileSync(OUT, doc);
  console.log(`AGENTS.md generated (${dirs.length} components)`);
}
