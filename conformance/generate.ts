/**
 * 契約(../stemcell-component-prompts/contracts)から適合テストを生成する。
 * GOVERNANCE §6-2 の「契約の props 名 / enum 値 / 既定値 / 必須トークン参照が実装と一致するか」を、
 * 実装側の meta.ts(既定値の単一の源)と CSS に対して照合する。
 * extends は仕様側スキーマの意味論どおり props / states / tokensRequired を1段だけ解決する。
 * 実装が存在しない契約は失敗にせず、未実装として一覧に出す(実装は門を通った契約から順に増える)。
 */
import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SPEC = join(import.meta.dirname, '../../stemcell-component-prompts/contracts');
const OUT = join(import.meta.dirname, 'generated');
const LIB = join(import.meta.dirname, '../src/lib');

type Prop = { type: string; values?: string[]; default?: unknown; optional?: boolean };
type Contract = {
  component: string; extends?: string;
  props?: Record<string, Prop>; states?: string[]; tokensRequired?: string[];
};

const load = (name: string): Contract =>
  JSON.parse(readFileSync(join(SPEC, name, 'contract.json'), 'utf-8'));

const resolve = (c: Contract): Contract => {
  if (!c.extends) return c;
  const p = load(c.extends);
  return {
    ...c,
    props: { ...(p.props ?? {}), ...(c.props ?? {}) },
    states: c.states ?? p.states,
    tokensRequired: [...new Set([...(p.tokensRequired ?? []), ...(c.tokensRequired ?? [])])],
  };
};

/** color.semantic.{color}.bg -> --color-semantic-primary-bg 等、prop 値で展開した CSS 変数名の集合。 */
const cssVars = (c: Contract): string[] => {
  let out: string[] = [];
  for (const t of c.tokensRequired ?? []) {
    let names = [t];
    for (const m of t.matchAll(/\{([^}]+)\}/g)) {
      const values = c.props?.[m[1]!]?.values ?? [];
      names = names.flatMap((n) => values.map((v) => n.replace(`{${m[1]}}`, v)));
    }
    out.push(...names.map((n) => `--${n.replaceAll('.', '-')}`));
  }
  return [...new Set(out)];
};

mkdirSync(OUT, { recursive: true });
const dirs = readdirSync(SPEC, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const implemented: string[] = [];
const missing: string[] = [];

for (const name of dirs) {
  if (!existsSync(join(LIB, name, 'meta.ts'))) { missing.push(name); continue; }
  implemented.push(name);
  const c = resolve(load(name));
  const spec = {
    props: Object.fromEntries(Object.entries(c.props ?? {}).map(([k, p]) => [k,
      { type: p.type, values: p.values ?? null, default: p.default ?? null, optional: p.optional ?? false }])),
    states: c.states ?? [],
    cssVars: cssVars(c),
  };
  writeFileSync(join(OUT, `${name}.test.ts`), `// 自動生成。編集しない(源は契約)。
import { describe, it, expect } from 'vitest';
import { META } from '../../src/lib/${name}/meta';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SPEC = ${JSON.stringify(spec, null, 2)} as const;

describe('${name} conformance', () => {
  it('props: 名前の集合が契約と過不足なく一致する', () => {
    expect(Object.keys(META.props).sort()).toEqual(Object.keys(SPEC.props).sort());
  });
  for (const [name, p] of Object.entries(SPEC.props)) {
    it(\`props.\${name}: enum 値と既定値が契約と一致する\`, () => {
      const m = (META.props as Record<string, any>)[name];
      if (p.values) expect([...m.values].sort()).toEqual([...p.values].sort());
      if (p.default !== null) expect(m.default).toEqual(p.default);
    });
  }
  it('tokensRequired: 必須トークンの CSS 変数が実装 CSS に現れる', () => {
    const cssPath = join(__dirname, '../../src/lib/${name}/${name}.css');
    const css = existsSync(cssPath) ? readFileSync(cssPath, 'utf-8') : '';
    for (const v of SPEC.cssVars) expect(css, \`missing \${v}\`).toContain(\`var(\${v}\`);
  });
});
`);
}
writeFileSync(join(OUT, '_coverage.txt'),
  `implemented: ${implemented.join(', ') || '(none)'}\nnot yet: ${missing.join(', ') || '(none)'}\n`);
console.log(`generated ${implemented.length} conformance tests; not yet implemented: ${missing.length}`);
