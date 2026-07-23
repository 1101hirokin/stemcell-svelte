/**
 * Playground のスモーク検証(再現可能な形の記録)。
 * 「実 Chromium で描画を確認した」という一過性の手動 QA 主張を、独立レビューが再実行できる
 * 検査に置き換える(WORKFLOW の証拠の規律。独立レビューの指摘への対応)。
 * 検証: (1) ライトで全部品が描画される (2) data-theme=standard-dark で地の面の色が変わる
 * (3) Switcher が狭い器(360px)で縦へ切り替わる (4) TextField のエラー文が light / dark とも
 * danger.soft-fg を実際に引いている(転用の実機確認。TextField.md §2)。
 * 前提: bun run playground:build 済み。実行: bun experiments/playground-smoke/smoke.ts
 * Chromium の場所は PW_CHROMIUM(環境変数)→ /opt/pw-browsers/chromium → playwright の
 * 既定キャッシュ、の順で解決する(リモート/ローカルの環境差)。
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const executablePath =
  process.env.PW_CHROMIUM ??
  (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : chromium.executablePath());

const PORT = 4311;
const preview = spawn('bunx', ['vite', 'preview', '--config', 'vite.playground.config.ts', '--port', String(PORT), '--strictPort'], {
  cwd: `${import.meta.dirname}/../..`,
  stdio: 'ignore',
});
try {
  // サーバの起動を待つ
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(`http://localhost:${PORT}/`);
      if (r.ok) break;
    } catch {
      if (i > 50) throw new Error('vite preview が起動しない');
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('.sc-button');

  const counts = await page.evaluate(() => ({
    button: document.querySelectorAll('.sc-button').length,
    switcher: document.querySelectorAll('.sc-switcher').length,
    box: document.querySelectorAll('.sc-box').length,
    stack: document.querySelectorAll('.sc-stack').length,
    cluster: document.querySelectorAll('.sc-cluster').length,
    textfield: document.querySelectorAll('.sc-textfield').length,
    grid: document.querySelectorAll('.sc-grid').length,
    sidebar: document.querySelectorAll('.sc-sidebar').length,
    checkbox: document.querySelectorAll('.sc-checkbox').length,
    textarea: document.querySelectorAll('.sc-textarea').length,
    switch: document.querySelectorAll('.sc-switch').length,
    icon: document.querySelectorAll('.sc-icon').length,
    radiogroup: document.querySelectorAll('.sc-radiogroup').length,
    radio: document.querySelectorAll('.sc-radio').length,
    card: document.querySelectorAll('.sc-card').length,
    link: document.querySelectorAll('.sc-link').length,
    badge: document.querySelectorAll('.sc-badge').length,
    avatar: document.querySelectorAll('.sc-avatar').length,
    tag: document.querySelectorAll('.sc-tag').length,
  }));
  for (const [k, v] of Object.entries(counts)) {
    if (v === 0) throw new Error(`描画されていない: ${k}`);
  }

  // TextField のエラー文が danger.soft-fg を実際に引いているか(転用の実機確認)
  const errorColor = () =>
    page.evaluate(() => {
      const el = document.querySelector('.sc-textfield-error') as HTMLElement | null;
      if (!el) return null;
      const probe = document.createElement('span');
      probe.style.color = 'var(--color-semantic-danger-soft-fg)';
      el.parentElement!.appendChild(probe);
      const r = { got: getComputedStyle(el).color, want: getComputedStyle(probe).color };
      probe.remove();
      return r;
    });
  const errLight = await errorColor();
  if (!errLight) throw new Error('TextField のエラー文が描画されていない');
  if (errLight.got !== errLight.want)
    throw new Error(`エラー文が danger.soft-fg を引いていない(light): ${JSON.stringify(errLight)}`);

  // disabled×invalid は disabled が勝つ(state.md §3.1)。CSS の後勝ちに依存するため回帰保護を置く
  // (独立レビュー major 指摘: 自動テストが無かった)
  const cascade = await page.evaluate(() => {
    const tf = document.querySelector(
      '.sc-textfield[data-disabled="true"][data-invalid="true"]',
    ) as HTMLElement | null;
    if (!tf) return null;
    const probe = (v: string) => {
      const s = document.createElement('span');
      s.style.color = `var(${v})`;
      tf.appendChild(s);
      const c = getComputedStyle(s).color;
      s.remove();
      return c;
    };
    return {
      border: getComputedStyle(tf.querySelector('.sc-textfield-control')!).borderTopColor,
      disabled: probe('--color-semantic-disabled-border'),
      danger: probe('--color-semantic-danger-border'),
    };
  });
  if (!cascade) throw new Error('disabled×invalid の TextField が playground に無い');
  if (cascade.border !== cascade.disabled || cascade.border === cascade.danger)
    throw new Error(`disabled×invalid で disabled が勝っていない: ${JSON.stringify(cascade)}`);

  // 中立 border の較正(裁定 2026-07。tokens alpha.2): resting の枠が地に対し 3:1 を満たす。
  // WCAG の相対輝度で light の control 枠 vs surface を実測する
  const borderContrast = await page.evaluate(() => {
    const tf = document.querySelector('.sc-textfield:not([data-invalid="true"]):not([data-disabled="true"])');
    const control = tf!.querySelector('.sc-textfield-control') as HTMLElement;
    const cs = getComputedStyle(control);
    const parse = (c: string) => (c.match(/\d+\.?\d*/g) ?? []).map(Number);
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
    };
    const lb = lum(parse(cs.borderTopColor)), ls = lum(parse(cs.backgroundColor));
    const hi = Math.max(lb, ls), lo = Math.min(lb, ls);
    return (hi + 0.05) / (lo + 0.05);
  });
  if (borderContrast < 3)
    throw new Error(`中立 border が地に対し 3:1 未満: ${borderContrast.toFixed(2)}:1(WCAG 2.2 SC 1.4.11)`);

  // フィールドは fill(横いっぱい。裁定 2026-07)。検出力を持たせるため、stretch しない文脈で測る:
  // Stack の align=stretch は全子を伸ばすので fill の有無を隠す(独立レビュー指摘)。ここでは
  // shrink-to-fit にならない固定幅の flex 行に clone を1つだけ置き、幅が器に一致するかを見る。
  // inline-size:100% が無ければ内容幅に縮むため、この検査は削除で RED 化する。
  const fillWidth = await page.evaluate(() => {
    const tf = document.querySelector('.sc-textfield') as HTMLElement;
    const box = document.createElement('div');
    box.style.cssText = 'display:flex; align-items:flex-start; inline-size:600px; position:absolute; left:-9999px';
    const clone = tf.cloneNode(true) as HTMLElement;
    box.appendChild(clone);
    document.body.appendChild(box);
    const w = clone.offsetWidth;
    box.remove();
    return w;
  });
  if (fillWidth < 590)
    throw new Error(`TextField が fill しない(600px の器で ${fillWidth}px。inline-size:100% を確認)`);

  // TextField: affix に内包した対話要素が器を押し上げない(高さは一次内容が所有。size.md §2 裁定)。
  // 内包ボタンは器の行高へ従属し、当たり判定は門(24px)を割らない
  const affix = await page.evaluate(() => {
    const all = [...document.querySelectorAll('.sc-textfield')] as HTMLElement[];
    const h = (tf: HTMLElement) => Math.round((tf.querySelector('.sc-textfield-control') as HTMLElement).getBoundingClientRect().height);
    const withBtn = all.find((tf) => tf.querySelector('.sc-textfield-end button'));
    const plain = all.find((tf) => tf.dataset.size === 'md' && !tf.querySelector('.sc-textfield-end') && !tf.querySelector('.sc-textfield-start'));
    if (!withBtn) return null;
    const btn = withBtn.querySelector('.sc-textfield-end button') as HTMLElement;
    return {
      withBtnH: h(withBtn),
      plainH: plain ? h(plain) : null,
      btnH: Math.round(btn.getBoundingClientRect().height),
      // 内包則の機構が生きているか(縦 inset を器が手放し、affix ボタンの padding-block が 0)。
      // 詳細度で負けると 0 にならず、器が押し上げられうる(独立レビュー blocker の回帰検査)
      btnPadBlock: getComputedStyle(btn).paddingBlockStart,
    };
  });
  if (!affix) throw new Error('TextField: affix にボタンを内包した例が playground に無い');
  if (affix.plainH !== null && affix.withBtnH !== affix.plainH)
    throw new Error(`TextField: affix 内包で器が膨らむ(${affix.withBtnH}px ≠ 素の md ${affix.plainH}px。size.md §2 内包則)`);
  if (affix.btnH < 24)
    throw new Error(`TextField: affix ボタンの当たり判定が門(24px)未満(${affix.btnH}px)`);
  if (affix.btnPadBlock !== '0px')
    throw new Error(`TextField: affix ボタンの padding-block が 0 でない(${affix.btnPadBlock}。内包則の縦 inset 手放しが詳細度負けで死んでいる)`);

  // Select: pointer 経路の custom combobox+listbox。native popover(top-layer)で描き、Escape/外側の
  // light dismiss は native が LIFO 管理(overlay.md §3)。dispatchEvent(untrusted)では native dismiss が
  // 発火しないので、実操作(page.keyboard/mouse)で検証する。jsdom で測れない層。
  const selTrigger = page.locator('.sc-select-trigger').first();
  if ((await selTrigger.count()) === 0)
    throw new Error('Select: custom トリガー(.sc-select-trigger)が playground に無い(pointer 経路)');
  await selTrigger.focus();
  await page.keyboard.press('ArrowDown'); // open(web-keys の open キー)
  await page.waitForTimeout(200);
  const selOpen = await page.evaluate(() => {
    const t = document.querySelector('.sc-select-trigger') as HTMLElement;
    const lb = document.querySelector('.sc-select-listbox') as HTMLElement | null;
    const content = lb?.closest('.sc-popover-content') as HTMLElement | null;
    const topLayer = content
      ? (() => {
          try {
            return content.matches(':popover-open');
          } catch {
            return false;
          }
        })()
      : false;
    const tr = t.getBoundingClientRect();
    const cr = content?.getBoundingClientRect();
    return {
      expanded: t.getAttribute('aria-expanded'),
      topLayer, // native popover の top-layer に出ている = overflow:hidden で切れない
      domFocusOnTrigger: document.activeElement === t, // 仮想 focus: DOM focus はトリガー据置
      ad: t.getAttribute('aria-activedescendant'),
      // CSS Anchor Positioning(Popover)が効いているか: dropdown がトリガーへ左揃え・同幅で錨る
      anchorSupported: CSS.supports('anchor-name: --x'),
      leftDelta: cr ? Math.abs(cr.left - tr.left) : 999,
      widthDelta: cr ? Math.abs(cr.width - tr.width) : 999,
    };
  });
  if (selOpen.expanded !== 'true' || !selOpen.topLayer)
    throw new Error(`Select: listbox が top-layer popover に開かない(${JSON.stringify(selOpen)})`);
  // Popover の位置決めが CSS Anchor Positioning(anchor()/anchor-size())でトリガーへ錨っているか。
  // 実 Chromium は anchor 対応なので、JS 計測を張らずに CSS だけで左揃え・同幅になることを守る(憲法 第2条)。
  if (!selOpen.anchorSupported)
    throw new Error('Select: 実ブラウザで CSS Anchor Positioning 非対応と報告された(前提が崩れている)');
  if (selOpen.leftDelta > 1.5 || selOpen.widthDelta > 1.5)
    throw new Error(`Select: dropdown がトリガーへ錨っていない(anchor 位置決め。left差 ${selOpen.leftDelta.toFixed(1)} / 幅差 ${selOpen.widthDelta.toFixed(1)})`);
  if (!selOpen.domFocusOnTrigger)
    throw new Error('Select: 開いても DOM focus はトリガーに留まるべき(activedescendant。overlay.md §4)');
  if (!selOpen.ad) throw new Error('Select: ArrowDown で aria-activedescendant が立たない(仮想 focus)');
  await page.keyboard.press('Escape'); // native light dismiss(LIFO。最上位1枚)
  await page.waitForTimeout(200);
  if ((await selTrigger.getAttribute('aria-expanded')) !== 'false')
    throw new Error('Select: Escape で閉じない(native light dismiss。overlay.md §3)');
  await selTrigger.focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  await page.mouse.click(5, 5); // 画面隅の外側を実クリック
  await page.waitForTimeout(200);
  if ((await selTrigger.getAttribute('aria-expanded')) !== 'false')
    throw new Error('Select: 外側クリックで閉じない(native light dismiss)');

  // Select(native/touch 経路): pointer:coarse では UA の <select>。UA ドロップダウンは <select> の箱に
  // 揃うので、(1) <select> が器の全幅を占める(選択肢幅=トリガー幅。inset を器でなく中身が持つ設計)、
  // (2) chevron の上を押しても背後の <select> に当たる(pointer-events:none で透過し、押下で開く)を守る。
  // 実 Chromium の coarse 文脈でしか測れない層(横 inset を器へ戻すと (1) が、chevron を flex 兄弟へ戻すと (2) が RED)。
  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const tp = await touch.newPage();
  await tp.goto(`http://localhost:${PORT}/`);
  await tp.waitForSelector('.sc-select-input');
  await tp.locator('.sc-select-control').first().scrollIntoViewIfNeeded();
  const nat = await tp.evaluate(() => {
    const ctrl = document.querySelector('.sc-select-control') as HTMLElement;
    const sel = ctrl.querySelector('select') as HTMLSelectElement;
    const chev = ctrl.querySelector('.sc-select-chevron') as HTMLElement;
    const cr = ctrl.getBoundingClientRect();
    const sr = sel.getBoundingClientRect();
    const r = chev.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      fillRatio: sr.width / cr.width,
      chevronHitsSelect: hit === sel || sel.contains(hit),
      chevronPE: getComputedStyle(chev).pointerEvents,
    };
  });
  await touch.close();
  if (nat.fillRatio < 0.98)
    throw new Error(
      `Select(native): <select> が器の全幅でない(fill ${(nat.fillRatio * 100).toFixed(0)}%。UA dropdown がトリガー幅に揃わない)`,
    );
  if (nat.chevronPE !== 'none' || !nat.chevronHitsSelect)
    throw new Error('Select(native): chevron の上のクリックが背後の <select> に届かない(押下で開けない)');

  // Menu(APG menu button + menu): 中への移動は実 DOM フォーカスの roving(overlay.md §4 の二形態のうち Menu 側。
  // Select の listbox が仮想フォーカスなのと対)。jsdom は popover API を持たないので top-layer と native dismiss は
  // ここ(実 Chromium)でしか測れない。ArrowDown で開き先頭項目を実フォーカス、矢印で移動、Enter で活性化して閉じ
  // フォーカスがトリガーへ戻る、Escape/外側で閉じる、を通す。
  const menuTrigger = page.locator('.sc-menu-trigger').first();
  if ((await menuTrigger.count()) === 0)
    throw new Error('Menu: トリガー(.sc-menu-trigger)が playground に無い');
  await menuTrigger.focus();
  await page.keyboard.press('ArrowDown'); // 開いて先頭 menuitem を実フォーカス
  await page.waitForTimeout(200);
  const menuOpen = await page.evaluate(() => {
    const t = document.querySelector('.sc-menu-trigger') as HTMLElement;
    const list = document.querySelector('.sc-menu-list') as HTMLElement | null;
    const content = list?.closest('.sc-popover-content') as HTMLElement | null;
    const topLayer = content
      ? (() => {
          try {
            return content.matches(':popover-open');
          } catch {
            return false;
          }
        })()
      : false;
    const items = [...(list?.querySelectorAll('[role="menuitem"]') ?? [])] as HTMLElement[];
    return {
      expanded: t.getAttribute('aria-expanded'),
      topLayer, // top-layer に出ている = overflow:hidden で切れない
      focusOnFirstItem: document.activeElement === items[0], // roving は実 DOM フォーカス(Select と対)
      firstTabindex: items[0]?.getAttribute('tabindex'),
    };
  });
  if (menuOpen.expanded !== 'true' || !menuOpen.topLayer)
    throw new Error(`Menu: メニューが top-layer popover に開かない(${JSON.stringify(menuOpen)})`);
  if (!menuOpen.focusOnFirstItem || menuOpen.firstTabindex !== '0')
    throw new Error('Menu: 開いても先頭 menuitem を実フォーカスしない(roving。overlay.md §4 の Menu 側)');
  await page.keyboard.press('ArrowDown'); // 次項目へ roving
  await page.waitForTimeout(80);
  const moved = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.sc-menu-list [role="menuitem"]')] as HTMLElement[];
    return document.activeElement === items[1];
  });
  if (!moved) throw new Error('Menu: ArrowDown で実フォーカスが次の menuitem へ移らない(roving)');
  await page.keyboard.press('Enter'); // 活性化して閉じる
  await page.waitForTimeout(150);
  const afterActivate = await page.evaluate(() => {
    const t = document.querySelector('.sc-menu-trigger') as HTMLElement;
    return { expanded: t.getAttribute('aria-expanded'), focusBackOnTrigger: document.activeElement === t };
  });
  if (afterActivate.expanded !== 'false')
    throw new Error('Menu: 活性化してもメニューが閉じない');
  if (!afterActivate.focusBackOnTrigger)
    throw new Error('Menu: 活性化後フォーカスがトリガーへ戻らない');
  await menuTrigger.focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(120);
  await page.keyboard.press('Escape'); // native light dismiss
  await page.waitForTimeout(150);
  if ((await menuTrigger.getAttribute('aria-expanded')) !== 'false')
    throw new Error('Menu: Escape で閉じない');
  await menuTrigger.focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(120);
  await page.mouse.click(5, 5); // 外側を実クリック(native light dismiss)
  await page.waitForTimeout(150);
  if ((await menuTrigger.getAttribute('aria-expanded')) !== 'false')
    throw new Error('Menu: 外側クリックで閉じない(native light dismiss)');

  // Dialog(native <dialog> + showModal): top-layer(:modal)・focus trap・Escape/背後クリックの light dismiss・
  // explicit は Escape/背後で閉じない・閉じたらトリガーへフォーカス復帰。jsdom は showModal を持たないので
  // これらは実 Chromium でしか測れない層(憲法 第2条 native の機構)。
  const openLight = page.locator('button', { hasText: 'light を開く' });
  await openLight.scrollIntoViewIfNeeded();
  await openLight.click();
  await page.waitForTimeout(200);
  const dlgState = await page.evaluate(() => {
    const d = document.querySelector('.sc-dialog') as HTMLDialogElement;
    return {
      open: d?.open ?? false,
      isModal: (() => { try { return d.matches(':modal'); } catch { return false; } })(),
      labelled: d?.getAttribute('aria-labelledby') === document.querySelector('.sc-dialog-title')?.id,
      focusInside: d?.contains(document.activeElement),
    };
  });
  if (!dlgState.open || !dlgState.isModal)
    throw new Error(`Dialog: showModal で top-layer(:modal)に開かない(${JSON.stringify(dlgState)})`);
  if (!dlgState.labelled) throw new Error('Dialog: aria-labelledby が title を指さない');
  if (!dlgState.focusInside) throw new Error('Dialog: 開いてもフォーカスが中に入らない(focus trap)');
  // 多重 modal の単一 scrim(RFC 0009)。light の中から確認を重ねて開くと、下の light に data-under が付き
  // ::backdrop が透過になる(見える scrim は最上位の一段だけ。native ::backdrop の積算を抑える)。
  await page.locator('button', { hasText: '確認を重ねて開く' }).click();
  // data-under の ::backdrop 透過は瞬間でなく遷移する(scrim のフラッシュ回避。entrance 240ms)。完了を待つ
  await page.waitForTimeout(450);
  const stacked = await page.evaluate(() => {
    const ds = [...document.querySelectorAll('.sc-dialog')] as HTMLDialogElement[];
    const openDs = ds.filter((d) => d.open);
    const under = ds.filter((d) => d.hasAttribute('data-under'));
    const underTransparent = under.every((d) => {
      const bg = getComputedStyle(d, '::backdrop').backgroundColor;
      return bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';
    });
    return {
      openCount: openDs.length,
      underCount: under.length,
      topmostNotUnder: openDs.length > 0 && !openDs[openDs.length - 1].hasAttribute('data-under'),
      underTransparent,
    };
  });
  if (stacked.openCount !== 2)
    throw new Error(`Dialog: 多重 modal が2枚開かない(${JSON.stringify(stacked)})`);
  if (stacked.underCount !== 1 || !stacked.topmostNotUnder)
    throw new Error(`Dialog: 単一 scrim の印(data-under)が最上位以外の1枚に付かない(${JSON.stringify(stacked)})`);
  if (!stacked.underTransparent)
    throw new Error('Dialog: 下の modal の ::backdrop が透過でない(scrim が積算する。RFC 0009 の単一に反する)');
  await page.locator('button', { hasText: '取消' }).click(); // 重ねた explicit を閉じる
  await page.waitForTimeout(200);
  const afterUnstack = await page.evaluate(() => ({
    openCount: [...document.querySelectorAll('.sc-dialog')].filter((d) => (d as HTMLDialogElement).open).length,
    underCount: document.querySelectorAll('.sc-dialog[data-under]').length,
  }));
  if (afterUnstack.openCount !== 1 || afterUnstack.underCount !== 0)
    throw new Error(`Dialog: 重ねた modal を閉じても data-under が残る(${JSON.stringify(afterUnstack)})`);
  // Escape で閉じ(light)、フォーカスがトリガーへ戻る
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const afterEsc = await page.evaluate(() => ({
    open: (document.querySelector('.sc-dialog') as HTMLDialogElement)?.open ?? false,
    focusOnTrigger: (document.activeElement as HTMLElement)?.textContent?.includes('light を開く') ?? false,
  }));
  if (afterEsc.open) throw new Error('Dialog(light): Escape で閉じない');
  if (!afterEsc.focusOnTrigger) throw new Error('Dialog: 閉じてもフォーカスがトリガーへ戻らない');
  // 再度開いて背後(scrim)クリックで閉じる(light)
  await openLight.click();
  await page.waitForTimeout(200);
  await page.mouse.click(5, 5); // パネル外 = 背後
  await page.waitForTimeout(200);
  if ((await page.evaluate(() => (document.querySelector('.sc-dialog') as HTMLDialogElement)?.open)) === true)
    throw new Error('Dialog(light): 背後クリックで閉じない');

  // explicit: Escape も背後クリックも閉じない。ボタンでのみ閉じる
  const openExplicit = page.locator('button', { hasText: 'explicit(削除確認)' });
  await openExplicit.click();
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  await page.mouse.click(5, 5);
  await page.waitForTimeout(150);
  const explicitDlg = () => page.evaluate(() => {
    const ds = [...document.querySelectorAll('.sc-dialog')] as HTMLDialogElement[];
    return ds.some((d) => d.open);
  });
  if (!(await explicitDlg()))
    throw new Error('Dialog(explicit): Escape/背後クリックで閉じてしまう(explicit は握りつぶすべき)');
  await page.locator('button', { hasText: '取消' }).click(); // ボタンで閉じる
  await page.waitForTimeout(200);
  if (await explicitDlg())
    throw new Error('Dialog(explicit): ボタンでも閉じない');

  // Drawer(端寄せ modal。Dialog と同じ native <dialog>。位置と入りの方向だけ違う)。inline-end で右端に貼り、
  // showModal で top-layer(:modal)・focus trap・Escape の light dismiss・閉じたらトリガーへ復帰を実機検証。
  const openDrawer = page.locator('button', { hasText: '右から開く' });
  await openDrawer.scrollIntoViewIfNeeded();
  await openDrawer.click();
  await page.waitForTimeout(300); // スライドの entrance
  const drawer = await page.evaluate(() => {
    const d = document.querySelector('.sc-drawer') as HTMLDialogElement;
    const r = d.getBoundingClientRect();
    return {
      open: d?.open ?? false,
      isModal: (() => { try { return d.matches(':modal'); } catch { return false; } })(),
      side: d.dataset.side,
      focusInside: d.contains(document.activeElement),
      atInlineEnd: Math.abs(r.right - window.innerWidth) < 2, // 右端に貼っている
      bounded: r.width < window.innerWidth, // 全幅でなく側パネル幅
      fullHeight: Math.abs(r.height - window.innerHeight) < 2, // inline 端は縦いっぱい
    };
  });
  if (!drawer.open || !drawer.isModal)
    throw new Error(`Drawer: showModal で top-layer(:modal)に開かない(${JSON.stringify(drawer)})`);
  if (drawer.side !== 'inline-end' || !drawer.atInlineEnd || !drawer.bounded || !drawer.fullHeight)
    throw new Error(`Drawer: inline-end で右端に縦いっぱい・側パネル幅で貼らない(${JSON.stringify(drawer)})`);
  if (!drawer.focusInside) throw new Error('Drawer: 開いてもフォーカスが中に入らない(focus trap)');
  await page.keyboard.press('Escape'); // light dismiss
  await page.waitForTimeout(300);
  const drawerAfter = await page.evaluate(() => ({
    open: (document.querySelector('.sc-drawer') as HTMLDialogElement)?.open ?? false,
    focusOnTrigger: (document.activeElement as HTMLElement)?.textContent?.includes('右から開く') ?? false,
  }));
  if (drawerAfter.open) throw new Error('Drawer(light): Escape で閉じない');
  if (!drawerAfter.focusOnTrigger) throw new Error('Drawer: 閉じてもフォーカスがトリガーへ戻らない');

  // Tooltip(補助ラベル。native popover top-layer + Anchor Positioning)。hover と focus の両方で開き、離脱と
  // Escape で閉じる。フォーカスを受け取らない(pointer-events:none)。aria-describedby がトリガーへ配線される。
  // jsdom では popover の表示を測れないので実 Chromium で見る(憲法 第2条 の native の機構)。
  const tipTrigger = page.locator('.sc-tooltip', { hasText: '保存' }).first();
  await tipTrigger.scrollIntoViewIfNeeded();
  await tipTrigger.hover(); // hover で開く
  await page.waitForTimeout(200);
  const tipState = await page.evaluate(() => {
    const wrap = [...document.querySelectorAll('.sc-tooltip')].find((w) => w.textContent?.includes('保存')) as HTMLElement;
    const tip = wrap?.querySelector('.sc-tooltip-content') as HTMLElement;
    const btn = wrap?.querySelector('button') as HTMLElement;
    const wr = wrap.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();
    return {
      shown: (() => { try { return tip.matches(':popover-open'); } catch { return false; } })(),
      role: tip.getAttribute('role'),
      describedby: btn?.getAttribute('aria-describedby') === tip.id,
      noPointerEvents: getComputedStyle(tip).pointerEvents === 'none',
      above: tr.bottom <= wr.top + 2, // block-start は上に出る
    };
  });
  if (!tipState.shown) throw new Error(`Tooltip: hover で top-layer popover に開かない(${JSON.stringify(tipState)})`);
  if (tipState.role !== 'tooltip' || !tipState.describedby)
    throw new Error(`Tooltip: role=tooltip / aria-describedby の配線が無い(${JSON.stringify(tipState)})`);
  if (!tipState.noPointerEvents) throw new Error('Tooltip: pointer-events:none でない(フォーカス/操作を受け取ってしまう)');
  if (!tipState.above) throw new Error('Tooltip: block-start でトリガーの上に出ない(anchor 位置決め)');
  await page.mouse.move(5, 5); // hover を外す
  await page.waitForTimeout(200);
  const tipAfterLeave = await page.evaluate(() => {
    const tip = [...document.querySelectorAll('.sc-tooltip')].find((w) => w.textContent?.includes('保存'))?.querySelector('.sc-tooltip-content') as HTMLElement;
    try { return tip.matches(':popover-open'); } catch { return false; }
  });
  if (tipAfterLeave) throw new Error('Tooltip: hover を外しても閉じない');
  // focus 経路でも開く(タッチに hover が無いため。overlay.md §4)
  await page.locator('.sc-tooltip button', { hasText: '保存' }).focus();
  await page.waitForTimeout(200);
  const tipOnFocus = await page.evaluate(() => {
    const tip = [...document.querySelectorAll('.sc-tooltip')].find((w) => w.textContent?.includes('保存'))?.querySelector('.sc-tooltip-content') as HTMLElement;
    try { return tip.matches(':popover-open'); } catch { return false; }
  });
  if (!tipOnFocus) throw new Error('Tooltip: focus で開かない(タッチのための focus 経路。overlay.md §4)');
  await page.keyboard.press('Escape'); // Escape で閉じる
  await page.waitForTimeout(150);
  const tipAfterEsc = await page.evaluate(() => {
    const tip = [...document.querySelectorAll('.sc-tooltip')].find((w) => w.textContent?.includes('保存'))?.querySelector('.sc-tooltip-content') as HTMLElement;
    try { return tip.matches(':popover-open'); } catch { return false; }
  });
  if (tipAfterEsc) throw new Error('Tooltip: Escape で閉じない');

  // Checkbox: 二重発火防止(リッチ label 内のリンククリックがトグルを発火させない)・disabled 抑制・
  // indeterminate=mixed。実 Chromium の native label 挙動でしか確認できない層(契約 a11y の核心)
  const cb = await page.evaluate(() => {
    const first = document.querySelector('.sc-checkbox') as HTMLElement; // 同意(リッチ label)
    const input = first.querySelector('.sc-checkbox-input') as HTMLInputElement;
    const link = first.querySelector('a') as HTMLAnchorElement;
    const text = first.querySelector('.sc-checkbox-label') as HTMLElement;
    // (1) リンク活性化はトグルしない(interactive descendant の例外)
    const before = input.checked;
    link.click();
    const afterLinkClick = input.checked;
    // (2) label のテキスト(リンク以外)クリックはトグルする = label 機構が生きている証拠。
    // これが無いと (1) は label 破壊時も自明に通る(何も繋がらないため)。両方で検出力を持たせる
    text.click();
    const toggledByText = input.checked !== afterLinkClick;

    // 親の indeterminate(集計表示): checked=false かつ indeterminate=true で aria mixed
    const parent = [...document.querySelectorAll('.sc-checkbox-input')].find(
      (i) => (i as HTMLInputElement).indeterminate,
    ) as HTMLInputElement | undefined;

    // disabled: click しても発火しない
    const disabled = [...document.querySelectorAll('.sc-checkbox-input')].find(
      (i) => (i as HTMLInputElement).disabled,
    ) as HTMLInputElement;
    const dBefore = disabled.checked;
    disabled.click();
    const dAfter = disabled.checked;

    return {
      linkNoToggle: before === afterLinkClick,
      toggledByText,
      hasIndeterminate: !!parent && parent.indeterminate && !parent.checked,
      disabledNoToggle: dBefore === dAfter,
    };
  });
  if (!cb.linkNoToggle) throw new Error('Checkbox: リッチ label 内のリンククリックがトグルを発火させた(二重発火)');
  if (!cb.toggledByText) throw new Error('Checkbox: label テキストのクリックがトグルしない(label 機構が死んでいる。二重発火検査の検出力の担保)');
  if (!cb.hasIndeterminate) throw new Error('Checkbox: indeterminate(集計表示)が mixed になっていない');
  if (!cb.disabledNoToggle) throw new Error('Checkbox: disabled が click を抑制していない');

  // 同意 Checkbox を「操作後に未チェック」= invalid へ運ぶ。前段の cb 検査でトグル済みのため
  // 現在値に依らず data-invalid になるまでクリックする(playground は field.md §3 どおり離脱後にだけ
  // invalid を立てる)
  await page.evaluate(async () => {
    const input = document.querySelector('.sc-checkbox-input') as HTMLElement;
    const field = document.querySelector('.sc-checkbox-field') as HTMLElement;
    for (let i = 0; i < 3 && field.dataset.invalid !== 'true'; i++) {
      input.click();
      await new Promise((r) => setTimeout(r, 20));
    }
  });
  await page.waitForTimeout(60);

  // invalid の未チェック Checkbox は hover でも danger の枠を保つ(state.md §3.2: invalid は
  // 抑制しない。独立レビュー major が実測した回帰。hover が中立 border を直書きすると赤枠が消えた)。
  // 実 hover を Playwright で当てて CSS :hover を発火させる
  const invalidField = page.locator('.sc-checkbox-field[data-invalid="true"]').first();
  if (await invalidField.count()) {
    const danger = await page.evaluate(() => {
      const f = document.querySelector('.sc-checkbox-field[data-invalid="true"]') as HTMLElement;
      const s = document.createElement('span'); s.style.color = 'var(--color-semantic-danger-border)';
      f.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c;
    });
    await invalidField.locator('.sc-checkbox').hover();
    await page.waitForTimeout(60);
    const hovered = await invalidField.locator('.sc-checkbox-box').evaluate((el) => getComputedStyle(el).borderTopColor);
    if (hovered !== danger)
      throw new Error(`Checkbox: invalid 未チェックの枠が hover で danger を失う(${hovered} ≠ ${danger}。state.md §3.2)`);
  }

  // Switch: role=switch・トグルでサムが動く(track の transition を待つ)・disabled 抑制
  const thumbX = () => page.evaluate(() => {
    const t = document.querySelector('.sc-switch-thumb') as HTMLElement;
    return t.getBoundingClientRect().x;
  });
  const swRole = await page.evaluate(() => document.querySelector('.sc-switch-input')!.getAttribute('role'));
  if (swRole !== 'switch') throw new Error(`Switch: role が switch でない(${swRole})`);
  const offX = await thumbX();
  await page.evaluate(() => (document.querySelector('.sc-switch-input') as HTMLElement).click());
  await page.waitForTimeout(250); // transition の完了を待つ
  const onX = await thumbX();
  if (Math.abs(onX - offX) < 4) throw new Error(`Switch: トグルでサムが動かない(${offX} → ${onX})`);
  const swDis = await page.evaluate(() => {
    const dis = [...document.querySelectorAll('.sc-switch-input')].find((i) => (i as HTMLInputElement).disabled) as HTMLInputElement;
    const before = dis.checked; dis.click(); return before === dis.checked;
  });
  if (!swDis) throw new Error('Switch: disabled が click を抑制していない');
  // Switch: サムの余白が全周均一(OFF 左・ON 右・縦が同値。裁定 2026-07。実 Chromium で幾何を測る)
  const swGap = await page.evaluate(async () => {
    const input = document.querySelector('.sc-switch-input') as HTMLInputElement;
    const track = input.nextElementSibling as HTMLElement;
    const thumb = track.querySelector('.sc-switch-thumb') as HTMLElement;
    const wait = () => new Promise((r) => setTimeout(r, 250));
    if (input.checked) { input.click(); await wait(); }
    const t1 = track.getBoundingClientRect(), h1 = thumb.getBoundingClientRect();
    const offLeft = +(h1.left - t1.left).toFixed(1);
    const vertical = +(h1.top - t1.top).toFixed(1);
    input.click(); await wait();
    const t2 = track.getBoundingClientRect(), h2 = thumb.getBoundingClientRect();
    const onRight = +(t2.right - h2.right).toFixed(1);
    return { offLeft, onRight, vertical };
  });
  if (Math.abs(swGap.offLeft - swGap.onRight) > 0.5 || Math.abs(swGap.offLeft - swGap.vertical) > 0.5)
    throw new Error(`Switch: サム余白が全周均一でない(左 ${swGap.offLeft} / 右 ${swGap.onRight} / 縦 ${swGap.vertical})`);

  // Textarea: textarea 要素で rows を持ち、複数行が入る
  const ta = await page.evaluate(() => {
    const el = document.querySelector('.sc-textarea-input') as HTMLTextAreaElement;
    return { tag: el.tagName, rows: el.rows };
  });
  if (ta.tag !== 'TEXTAREA' || ta.rows < 1) throw new Error(`Textarea が textarea/rows を持たない: ${JSON.stringify(ta)}`);

  // Icon: currentColor が文字色を継承・1em が font-size に追従・RTL でミラーグリフだけ反転・
  // 装飾/意味の a11y。実 Chromium でしか測れない currentColor と 1em を重点に
  const icon = await page.evaluate(() => {
    // currentColor: fill=currentColor が親の color を継承する。色付き span 内のアイコンの
    // 実効 fill が、親の color(非黒)と一致するかを見る
    let inherits = false;
    for (const s of document.querySelectorAll('span')) {
      const ic = s.querySelector('.sc-icon') as SVGElement | null;
      if (!ic) continue;
      const parentColor = getComputedStyle(s).color;
      if (parentColor === 'rgb(0, 0, 0)') continue; // 色を付けていない span は飛ばす
      if (getComputedStyle(ic).fill === parentColor) { inherits = true; break; }
    }
    // 1em: 全アイコンの実寸に font-size 由来の幅を持つ。最大と最小に十分な差があるか
    const widths = [...document.querySelectorAll('.sc-icon')].map((i) => i.getBoundingClientRect().width);
    const scales = widths.length > 0 && Math.max(...widths) > Math.min(...widths) + 10;
    const decorative = document.querySelector('.sc-icon[aria-hidden="true"]');
    const meaningful = document.querySelector('.sc-icon[role="img"]');
    return {
      inherits,
      scales,
      widthRange: [Math.min(...widths), Math.max(...widths)],
      hasDecorative: !!decorative,
      hasMeaningful: !!meaningful && !!meaningful.getAttribute('aria-label'),
    };
  });
  if (!icon.inherits) throw new Error('Icon: currentColor が文字色を継承していない');
  if (!icon.scales) throw new Error(`Icon: 1em が font-size に追従していない(幅 ${JSON.stringify(icon.widthRange)})`);
  if (!icon.hasDecorative) throw new Error('Icon: 装飾(aria-hidden)が無い');
  if (!icon.hasMeaningful) throw new Error('Icon: 意味(role=img + aria-label)が無い');

  // RTL: ミラーグリフ(arrow.left)は RTL で反転、非ミラー(text_align.left)は反転しない
  const iconRtl = await page.evaluate(() => {
    const rtlSpan = [...document.querySelectorAll('span[dir="rtl"]')].find((s) => s.querySelector('.sc-icon[data-mirror="true"]'));
    const mirror = rtlSpan?.querySelector('.sc-icon[data-mirror="true"]') as SVGElement;
    const nonMirrorSpan = [...document.querySelectorAll('span[dir="rtl"]')].find(
      (s) => s.querySelector('.sc-icon:not([data-mirror])'),
    );
    const nonMirror = nonMirrorSpan?.querySelector('.sc-icon:not([data-mirror])') as SVGElement;
    return {
      mirrored: mirror ? getComputedStyle(mirror).transform !== 'none' : false,
      nonMirrorUnchanged: nonMirror ? getComputedStyle(nonMirror).transform === 'none' : false,
    };
  });
  if (!iconRtl.mirrored) throw new Error('Icon: RTL でミラーグリフが反転しない');
  if (!iconRtl.nonMirrorUnchanged) throw new Error('Icon: RTL で非ミラーグリフまで反転している');

  // RadioGroup: native radio の矢印キー・roving tabindex・disabled スキップ(web-keys arrows.radiogroup)。
  // これは実 Chromium の native 挙動でしか確認できない(契約 a11y の核心)
  const radios = page.locator('.sc-radiogroup .sc-radio-input');
  // 最初の radio へフォーカス(roving: 未選択なら先頭が Tab 対象)
  await radios.nth(0).focus();
  const focus0 = await page.evaluate(() => (document.activeElement as HTMLInputElement)?.value);
  // 矢印下: 次へ移動=選択
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(50);
  const afterDown = await page.evaluate(() => {
    const el = document.activeElement as HTMLInputElement;
    return { value: el?.value, checked: el?.checked };
  });
  // さらに矢印下: disabled(large)を飛ばして先頭へ回る、または止まる(native の巡回)。disabled は選ばれない
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(50);
  const afterDown2 = await page.evaluate(() => {
    const el = document.activeElement as HTMLInputElement;
    const disabled = [...document.querySelectorAll('.sc-radio-input')].find((i) => (i as HTMLInputElement).disabled) as HTMLInputElement;
    return { value: el?.value, disabledChecked: disabled?.checked, disabledFocused: el === disabled };
  });
  if (focus0 !== 's') throw new Error(`Radio: 先頭(s)にフォーカスが乗らない: ${focus0}`);
  if (afterDown.value !== 'm' || !afterDown.checked) throw new Error(`Radio: 矢印下で移動=選択にならない: ${JSON.stringify(afterDown)}`);
  // disabled(large=l)を実際にスキップしたか: disabled input が checked/focused になっていない。
  // かつ、down2 でフォーカスが disabled を飛ばして別の有効項目へ動いた(l に止まらない)
  if (afterDown2.disabledFocused || afterDown2.disabledChecked) throw new Error(`Radio: disabled 項目が選択/フォーカスされた: ${JSON.stringify(afterDown2)}`);
  if (afterDown2.value === 'l') throw new Error('Radio: disabled(l)がフォーカスを受けた(スキップされていない)');

  // 選択済みかつグループ invalid のとき、選択済み項目の枠が danger になる(:checked の枠再宣言が
  // invalid override を潰さない。独立レビュー blocker)。playground の「選択済み × invalid」デモで測る
  const invalidRadio = await page.evaluate(() => {
    const group = [...document.querySelectorAll('.sc-radiogroup[data-invalid="true"]')].find((g) =>
      g.querySelector('.sc-radio-input:checked'),
    ) as HTMLElement | undefined;
    if (!group) return null;
    const checked = group.querySelector('.sc-radio-input:checked') as HTMLInputElement;
    const circle = (checked.nextElementSibling as HTMLElement); // .sc-radio-circle
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-semantic-danger-border)';
    group.appendChild(probe);
    const danger = getComputedStyle(probe).color;
    probe.remove();
    return { border: getComputedStyle(circle).borderTopColor, danger };
  });
  if (invalidRadio && invalidRadio.border !== invalidRadio.danger)
    throw new Error(`Radio: 選択済み×invalid で枠が danger にならない(${invalidRadio.border} ≠ ${invalidRadio.danger}。独立レビュー blocker)`);

  // リッチ label(リンク内包)の二重発火防止: リンク活性化は選択を発火させない(Checkbox と同型)。
  // playground の Radio には link が無いので、選択済み状態を触らず label テキストのクリックで選択が
  // 起きること(label 機構が生きている)だけ確認する
  const labelToggle = await page.evaluate(() => {
    const first = document.querySelector('.sc-radiogroup .sc-radio') as HTMLElement;
    const input = first.querySelector('.sc-radio-input') as HTMLInputElement;
    const before = input.checked;
    (first.querySelector('.sc-radio-label') as HTMLElement).click();
    return before !== input.checked || input.checked; // クリックで選択される(label 機構)
  });
  if (!labelToggle) throw new Error('Radio: label のクリックで選択されない(label 機構が死んでいる)');

  // Card: 既定は影の面(box-shadow あり・border 透明で寸法確保)、outlined は影を消し中立 border を可視化。
  // 切替で寸法が動かない(base の透明 border と outlined の可視 border が同幅)を実機で守る。
  const card = await page.evaluate(() => {
    const plain = document.querySelector('.sc-card:not([data-outlined="true"])') as HTMLElement;
    const outlined = document.querySelector('.sc-card[data-outlined="true"]') as HTMLElement;
    const cs = (el: HTMLElement) => getComputedStyle(el);
    const transparent = (c: string) => c === 'rgba(0, 0, 0, 0)' || c === 'transparent';
    return {
      plainHasShadow: cs(plain).boxShadow !== 'none',
      plainBorderTransparent: transparent(cs(plain).borderTopColor),
      outlinedNoShadow: cs(outlined).boxShadow === 'none',
      outlinedBorderVisible: !transparent(cs(outlined).borderTopColor),
      sameBorderWidth: cs(plain).borderTopWidth === cs(outlined).borderTopWidth,
    };
  });
  if (!card.plainHasShadow || !card.plainBorderTransparent)
    throw new Error(`Card: 既定が影の面(box-shadow + 透明 border)でない(${JSON.stringify(card)})`);
  if (!card.outlinedNoShadow || !card.outlinedBorderVisible)
    throw new Error(`Card: outlined が影を消して中立 border を可視化しない(${JSON.stringify(card)})`);
  if (!card.sameBorderWidth)
    throw new Error('Card: 影の面と枠の面で border 幅が違う(切替で寸法が動く。透明 border で揃えていない)');

  // Link: native <a> で下線(非色手がかり。WCAG 1.4.1)、大きさは周囲を継承(自分で主張しない。Link.md §2)。
  // external は target=_blank + rel=noopener(native の新文脈遷移と reverse-tabnabbing 防御)、視覚アイコンは
  // 装飾(aria-hidden)、告知は視覚的に隠した文字(clip されて幅ゼロ)が担う。
  const link = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.sc-link')] as HTMLAnchorElement[];
    const inBig = links.find((a) => {
      const p = a.closest('span');
      return p && parseFloat(getComputedStyle(p).fontSize) > 20;
    });
    const inNormal = links.find((a) => a.getAttribute('href') === '/docs' && a !== inBig);
    const ext = links.find((a) => a.target === '_blank') as HTMLAnchorElement;
    // house の Icon SSOT を使う(グリフ直書きでない)。装飾なので Icon 自身が aria-hidden を付ける
    const icon = ext?.querySelector('.sc-link-external .sc-icon') as SVGElement;
    const sr = ext?.querySelector('.sc-link-sr-only') as HTMLElement;
    return {
      isAnchor: links.every((a) => a.tagName === 'A'),
      underlined: getComputedStyle(links[0]).textDecorationLine.includes('underline'),
      inheritsSize:
        inBig && inNormal
          ? parseFloat(getComputedStyle(inBig).fontSize) > parseFloat(getComputedStyle(inNormal).fontSize) + 4
          : false,
      extTarget: ext?.target,
      extRel: ext?.getAttribute('rel') ?? '',
      iconIsHouseIcon: !!icon,
      iconHidden: icon?.getAttribute('aria-hidden') === 'true',
      srClipped: sr ? Math.round(sr.getBoundingClientRect().width) <= 1 : false,
      srText: sr?.textContent ?? '',
    };
  });
  if (!link.isAnchor) throw new Error('Link: native <a> で描画されていない');
  if (!link.underlined) throw new Error('Link: 下線(非色手がかり。WCAG 1.4.1)を持たない');
  if (!link.inheritsSize) throw new Error('Link: 周囲の文字サイズを継承しない(自分で大きさを主張している。Link.md §2)');
  if (link.extTarget !== '_blank' || !link.extRel.includes('noopener'))
    throw new Error(`Link(external): target=_blank / rel=noopener が無い(${JSON.stringify(link)})`);
  if (!link.iconIsHouseIcon) throw new Error('Link(external): 視覚アイコンが house の Icon(.sc-icon)でない(グリフ直書き)');
  if (!link.iconHidden) throw new Error('Link(external): 視覚アイコンが aria-hidden でない');
  if (!link.srClipped || !link.srText.includes('opens in new tab'))
    throw new Error(`Link(external): 告知が視覚的に隠されていない/文言が無い(${JSON.stringify(link)})`);

  // Badge: count>max の「99+」丸め(全実装で同じ見た目)、dot は数を出さず label を視覚的に隠した文字で
  // 支援技術へ届ける、anchor を包むと block-start/inline-end の隅へ絶対配置で重なる。
  const badge = await page.evaluate(() => {
    const badges = [...document.querySelectorAll('.sc-badge')] as HTMLElement[];
    const dot = document.querySelector('.sc-badge[data-dot="true"]') as HTMLElement | null;
    const dotSr = dot?.querySelector('.sc-badge-sr') as HTMLElement | null;
    const anchor = document.querySelector('.sc-badge-anchor') as HTMLElement | null;
    const anchored = anchor?.querySelector(':scope > .sc-badge') as HTMLElement | null;
    let overlaps = false;
    if (anchor && anchored) {
      const ar = anchor.getBoundingClientRect(), br = anchored.getBoundingClientRect();
      overlaps = br.top < ar.top + ar.height / 2 && br.right > ar.right - 2;
    }
    return {
      hasRounded: badges.some((b) => b.textContent === '99+'),
      dotClipped: dotSr ? Math.round(dotSr.getBoundingClientRect().width) <= 1 : false,
      dotSrText: dotSr?.textContent ?? '',
      anchoredPos: anchored ? getComputedStyle(anchored).position : null,
      overlaps,
    };
  });
  if (!badge.hasRounded) throw new Error('Badge: count>max の「99+」丸めが描かれない');
  if (!badge.dotClipped || !badge.dotSrText)
    throw new Error(`Badge: dot の label が視覚的に隠された文字で届かない(${JSON.stringify(badge)})`);
  if (badge.anchoredPos !== 'absolute' || !badge.overlaps)
    throw new Error(`Badge: anchor の block-start/inline-end の隅へ重ならない(${JSON.stringify(badge)})`);

  // Avatar: 器が role=img + name、寸法は avatar 段(lg=40px 相当。rem 建て)、src 無しは name のイニシャルへ
  // 退避し装飾(aria-hidden)。壊れた src → イニシャルの退避は unit(native onerror)で検査済み。
  const avatar = await page.evaluate(() => {
    const avatars = [...document.querySelectorAll('.sc-avatar')] as HTMLElement[];
    const lg = avatars.find((a) => a.dataset.size === 'lg');
    const noSrc = avatars.find((a) => a.querySelector('.sc-avatar-initials'));
    const ini = noSrc?.querySelector('.sc-avatar-initials') as HTMLElement | undefined;
    // meaningful(既定)は role=img + name、decorative は器ごと aria-hidden(role/aria-label なし)
    const meaningful = avatars.filter((a) => a.getAttribute('aria-hidden') !== 'true');
    const deco = avatars.find((a) => a.getAttribute('aria-hidden') === 'true');
    return {
      meaningfulRoleImg: meaningful.every((a) => a.getAttribute('role') === 'img' && !!a.getAttribute('aria-label')),
      hasDecorative: !!deco,
      decoHasNoName: deco ? deco.getAttribute('role') === null && deco.getAttribute('aria-label') === null : false,
      lgSize: lg ? Math.round(lg.getBoundingClientRect().width) : 0,
      lgSquare: lg ? Math.round(lg.getBoundingClientRect().width) === Math.round(lg.getBoundingClientRect().height) : false,
      initialsText: ini?.textContent ?? '',
      initialsHidden: ini?.getAttribute('aria-hidden') === 'true',
    };
  });
  if (!avatar.meaningfulRoleImg) throw new Error('Avatar: 意味を持つ既定で role=img + aria-label(name)が無い');
  if (!avatar.hasDecorative || !avatar.decoHasNoName)
    throw new Error(`Avatar: decorative が器ごと支援技術から隠れていない(${JSON.stringify(avatar)})`);
  if (avatar.lgSize < 36 || avatar.lgSize > 44 || !avatar.lgSquare)
    throw new Error(`Avatar: lg の実寸が avatar-lg(40px 相当の正方)でない(${avatar.lgSize}px square=${avatar.lgSquare})`);
  if (!avatar.initialsHidden || !avatar.initialsText)
    throw new Error('Avatar: src 無しで name のイニシャル退避(aria-hidden の文字)が無い');

  // Tag: 静的は span(非対話)、選べるは button+aria-pressed、消せるは本体と × を兄弟に持ち(入れ子でない)
  // × の名は本体ラベル + 削除語を aria-labelledby で合成、相互作用形は当たり判定の門(24px)を割らない。
  const tagStruct = await page.evaluate(() => {
    const tags = [...document.querySelectorAll('.sc-tag')] as HTMLElement[];
    const staticTag = tags.find(
      (t) => t.tagName === 'SPAN' && !t.hasAttribute('data-selected') && !t.hasAttribute('data-dismissible'),
    );
    const selectable = document.querySelector('button.sc-tag[aria-pressed]') as HTMLElement | null;
    const dismissRoot = document.querySelector('.sc-tag[data-dismissible]') as HTMLElement | null;
    const body = dismissRoot?.querySelector('.sc-tag-body') as HTMLElement | null;
    const x = dismissRoot?.querySelector('.sc-tag-dismiss') as HTMLElement | null;
    const labelledby = (x?.getAttribute('aria-labelledby') ?? '').split(' ');
    const suffix = labelledby[1] ? document.getElementById(labelledby[1]) : null;
    const h = (el: HTMLElement | null) => (el ? Math.round(el.getBoundingClientRect().height) : 0);
    const w = (el: HTMLElement | null) => (el ? Math.round(el.getBoundingClientRect().width) : 0);
    return {
      staticNoButton: !!staticTag && !staticTag.querySelector('button'),
      selectablePressed: !!selectable && selectable.hasAttribute('aria-pressed'),
      dismissSiblings: !!body && !!x && !body.contains(x), // × は本体の子孫でない = 入れ子でない
      labelledbyBodyFirst: !!body && labelledby[0] === body.id,
      suffixText: suffix?.textContent ?? '',
      gate: Math.min(h(body), h(x), w(x), h(selectable)),
    };
  });
  if (!tagStruct.staticNoButton) throw new Error('Tag: 静的な札が非対話(button 無し)でない');
  if (!tagStruct.selectablePressed) throw new Error('Tag: 選べる札が button + aria-pressed でない');
  if (!tagStruct.dismissSiblings) throw new Error('Tag: 消せる札の本体と × が兄弟でない(入れ子。§2 のアンチパターン)');
  if (!tagStruct.labelledbyBodyFirst || !tagStruct.suffixText)
    throw new Error(`Tag: × の名が本体ラベル + 削除語で合成されない(${JSON.stringify(tagStruct)})`);
  if (tagStruct.gate < 24)
    throw new Error(`Tag: 相互作用形が当たり判定の門(24px)を割る(${JSON.stringify(tagStruct)})`);

  // 選べる札を実クリックして aria-pressed がトグルする(選択はアプリが selected を更新して起こす)
  const svelteTag = page.locator('button.sc-tag', { hasText: 'Svelte' }).first();
  await svelteTag.scrollIntoViewIfNeeded();
  const pressedBefore = await svelteTag.getAttribute('aria-pressed');
  await svelteTag.click();
  await page.waitForTimeout(60);
  if ((await svelteTag.getAttribute('aria-pressed')) === pressedBefore)
    throw new Error(`Tag: 選べる札のクリックで aria-pressed がトグルしない(${pressedBefore} のまま)`);

  // 消せる札の × を実クリックしてチップが取り除かれる(取り除くのはアプリ。Tag は自分を消さない)
  const dismissBefore = await page.locator('.sc-tag-dismiss').count();
  await page.locator('.sc-tag[data-dismissible]:not([data-selected]):not([data-disabled]) .sc-tag-dismiss').first().click();
  await page.waitForTimeout(60);
  if ((await page.locator('.sc-tag-dismiss').count()) >= dismissBefore)
    throw new Error('Tag: × クリックでチップが取り除かれない(dismiss イベントが配線されていない)');

  // Tag disabled は減衰(opacity)でなく token 差し替え(state.md §7)。器ごと disabled 系の面になり、
  // 中身に opacity は残らない(dismissible では器=容器が :disabled になれないので data-disabled で駆動)
  const tagDisabled = await page.evaluate(() => {
    const dis = document.querySelector('.sc-tag[data-disabled][data-dismissible]') as HTMLElement | null;
    if (!dis) return null;
    const probe = document.createElement('span');
    probe.style.background = 'var(--color-semantic-disabled-soft-bg)';
    dis.appendChild(probe);
    const want = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return {
      bg: getComputedStyle(dis).backgroundColor,
      want,
      childOpacity: getComputedStyle(dis.querySelector('.sc-tag-dismiss') as HTMLElement).opacity,
    };
  });
  if (tagDisabled) {
    if (tagDisabled.bg !== tagDisabled.want)
      throw new Error(`Tag(disabled): 器が disabled 系の面にならない(${JSON.stringify(tagDisabled)}。state.md §7)`);
    if (tagDisabled.childOpacity !== '1')
      throw new Error('Tag(disabled): 中身に減衰(opacity<1)が残っている(state.md §7 は token 差し替え)');
  }

  const bgLight = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.selectOption('select >> nth=0', 'standard-dark');
  await page.waitForTimeout(100);
  const attr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const bgDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (attr !== 'standard-dark') throw new Error(`data-theme が立たない: ${attr}`);
  if (bgLight === bgDark) throw new Error(`テーマ切替で地の面が変わらない: ${bgLight}`);
  const errDark = await errorColor();
  if (!errDark || errDark.got === errLight.got || errDark.got !== errDark.want)
    throw new Error(`エラー文が dark で danger.soft-fg に追従しない: ${JSON.stringify(errDark)}`);

  await page.selectOption('select >> nth=0', 'auto');
  await page.evaluate(() => {
    (document.querySelectorAll('.pg-resizable')[0] as HTMLElement).style.width = '360px';
  });
  await page.waitForTimeout(100);
  const rows = await page.evaluate(() => {
    const sw = document.querySelector('.sc-switcher') as HTMLElement;
    return new Set([...sw.children].map((k) => (k as HTMLElement).offsetTop)).size;
  });
  if (rows !== 3) throw new Error(`360px で縦(3行)にならない: ${rows}行`);

  // Sidebar: 狭い器で縦へ折れ、DOM 順(side=start: 脇→本体)は折れても変わらない
  const sb = await page.evaluate(() => {
    const el = document.querySelector('.sc-sidebar') as HTMLElement;
    (el.parentElement as HTMLElement).style.width = '260px';
    const [a, b] = [...el.children] as HTMLElement[];
    return {
      folded: a!.offsetTop !== b!.offsetTop,
      order: [...el.children].map((k) => k.className),
    };
  });
  if (!sb.folded) throw new Error('Sidebar が 260px で折れない');
  if (sb.order.join(',') !== 'sc-sidebar-side,sc-sidebar-content')
    throw new Error(`Sidebar の DOM 順が視覚順と食い違う: ${sb.order.join(',')}`);

  // フォーム参加(name。field.md §5 / RFC 0011)。name を与えた form 部品が native の <form> 送信へ載る。
  // FormData を実機で組み、controlled の値がその名前で参加していること・Select の pointer 経路が隠し input で
  // 補われること・TextField の keyboard=email が native type=email になること・RadioGroup の required が各 radio
  // input へ配線されることを守る(第2条 / RFC 0010 の充足の実機検証。jsdom では form 送信の実挙動を測れない)。
  const form = await page.evaluate(() => {
    const f = document.getElementById('pg-form') as HTMLFormElement;
    const fd = new FormData(f);
    const emailInput = f.querySelector('.sc-textfield-input') as HTMLInputElement;
    const radios = [...f.querySelectorAll('.sc-radio-input')] as HTMLInputElement[];
    return {
      entries: Object.fromEntries(fd.entries()),
      emailType: emailInput?.type,
      radiosRequired: radios.length > 0 && radios.every((r) => r.required),
    };
  });
  // controlled の初期値(email=a@b.com / subscribe=on / notify=on / ship=exp(隠し input) / plan=pro)が名前で載る
  if (form.entries.email !== 'a@b.com')
    throw new Error(`Form: TextField の値が name=email で送信に載らない(${JSON.stringify(form.entries)})`);
  if (form.entries.subscribe !== 'on' || form.entries.notify !== 'on')
    throw new Error(`Form: Checkbox/Switch が checked のとき name で載らない(${JSON.stringify(form.entries)})`);
  if (form.entries.ship !== 'exp')
    throw new Error(`Form: Select(pointer 経路)の値が隠し input で name=ship に載らない(${JSON.stringify(form.entries)})`);
  if (form.entries.plan !== 'pro')
    throw new Error(`Form: RadioGroup の選択が name=plan で載らない(${JSON.stringify(form.entries)})`);
  if (form.emailType !== 'email')
    throw new Error(`Form: TextField keyboard=email が native type=email にならない(type=${form.emailType})`);
  if (!form.radiosRequired)
    throw new Error('Form: RadioGroup の required が各 radio input へ配線されていない(native 検証が効かない)');

  await browser.close();
  console.log(
    `smoke green: 部品描画 ${JSON.stringify(counts)} / dark 切替 ${bgLight} → ${bgDark} / 360px で縦(3行) / エラー文 = danger.soft-fg(light ${errLight.got} / dark ${errDark.got}) / 中立 border ${borderContrast.toFixed(2)}:1 / TextField fill・affix 非膨張(内包則) / Select custom: popover 開閉・activedescendant・light dismiss / Checkbox 二重発火防止・indeterminate・disabled 抑制 / Switch トグル・disabled・サム余白全周均一 / Textarea 複数行 / Icon currentColor・1em・RTL 反転 / Radio 矢印移動=選択・disabled スキップ`,
  );
} finally {
  preview.kill();
}
