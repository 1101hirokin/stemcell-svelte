# Switcher threshold 実測(2026-07-21)

layout.md §9 の未決「threshold の単位選択(px / rem)」の裁定材料と、
純 CSS 実装の検証(Switcher の実装 Done の条件)。方法は [measure.ts](./measure.ts) が持つ。
実 Chromium(headless)で、実装そのものの CSS(Switcher.css + tokens ビルド出力)を読み込み、
Switcher が描画する DOM と同一のマークアップで器の幅を走査した。

## 1. 機構検証: flex-basis 算術は契約の意味論を正確に実装する

threshold=30rem・root=16px で、切替点は実測 480px。479px で縦、480px で横。
契約の「器の幅がこれ未満で縦」(未満 = 閾値ちょうどは横)と一致する。
コンテナクエリを採らなかった理由は Switcher.css 冒頭に記録した
(`@container` の条件部は custom property を受けないため、prop 駆動の閾値を運べない)。

## 2. 単位×文字拡大(root font-size 変更)での切替点の移動

| root | 30rem の切替点 | 480px の切替点 |
|---|---|---|
| 16px | 480px | 480px |
| 20px | 600px | 480px |
| 24px | 720px | 480px |

rem はブラウザの文字設定に追従して実効閾値が動く。px は動かない。定義どおりの確認である。

## 3. 実害: 文字拡大時、px 閾値は横のまま中身が崩れる

器 490px(px 閾値 480 の直上)・実物の Button 3個(日本語ラベル)で観測:

| root | 480px 閾値 | 30rem 閾値 |
|---|---|---|
| 16px | 横(部品高 51px) | 横(部品高 51px) |
| 20px | 横(部品高 63px) | 縦(部品高 63px) |
| 24px | 横・ラベルが部品内で折返し 2行化(部品高 104px) | 縦・ラベル 1行のまま(部品高 76px) |

px 閾値は「同じデバイス幅なら同じ形」を守る代わりに、文字を拡大したユーザーの画面で
横形のまま中身が育ち、ラベルが部品内で折れて崩れる。rem 閾値は同じ条件で縦へ退避し、
部品の中身は健全なまま。行が器から溢れる(scrollWidth 超過)ことは両者ともなかった
(flex の min-width:auto と折返しが先に効く)。

## 4. gap 語彙の解決

段 md → 16px、大域の原始 8 → 32px。契約の tokensRequired と layout.md §6 の値域どおり。

## 読み(裁定は仕様側)

- rem 側: 文字拡大は「同じ幅」の中身を実質狭くする。rem は閾値をそれに追従させ、
  §3 の崩れを防ぐ。container が rem を選んだ理由(本文相対)と同じ側。
- px 側: 「同じ幅なら同じ形」がユーザーの文字設定に依存しなくなる(500px の器は誰の環境でも同じ形)。
  breakpoint が px を維持した理由(デバイス基準の同一性)と同じ側。SwiftUI / Compose に
  rem の対応物が無く、px(≈pt/dp)なら閾値がそのまま移植できるのに対し、rem は
  「root font-size 相当×係数」の再定義が要る。
