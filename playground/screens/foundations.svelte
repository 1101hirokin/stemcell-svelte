<script lang="ts">
  import { Cluster, Text } from '../../src/lib';

  // 角の曲率の見比べ。既定は CSS 側の確定値と同じ
  let curvature = $state('1.8');
  $effect(() => {
    document.documentElement.style.setProperty('--_sc-corner-shape', `superellipse(${curvature})`);
  });

  // 半径スケールの見比べ(shape.md §9「値 adjust」の検討用)。
  // shape API の構造に沿う: 動かすのは原始5段の値だけで、カテゴリ→原始の割当(§6)は動かさない。
  // 配信されている --shape-semantic-* は原始を参照せず実値なので、割当に従ってこちらも書き換える。
  const RADIUS_SCALES = [
    { name: '現行', s: 2, m: 6, l: 10 },
    { name: '+1段', s: 4, m: 10, l: 14 },
    { name: '+2段', s: 6, m: 14, l: 20 },
    { name: '+3段', s: 8, m: 18, l: 26 },
  ] as const;
  // shape.md §6 のカテゴリ割当。pill は circular のままなので触らない
  const SHAPE_CATEGORIES = {
    control: 'm',
    selection: 's',
    card: 'm',
    dialog: 'l',
    popover: 'm',
    tag: 's',
  } as const;
  // 既定は上書きせず実装のまま見せる(連続曲率が出せる環境なら +2段、出せなければ現行)
  let radiusScale = $state('実装のまま');
  $effect(() => {
    const root = document.documentElement.style;
    const scale = RADIUS_SCALES.find((r) => r.name === radiusScale);
    if (!scale) {
      for (const name of ['s', 'm', 'l']) root.removeProperty(`--shape-rounded-${name}`);
      for (const category of Object.keys(SHAPE_CATEGORIES)) root.removeProperty(`--shape-semantic-${category}`);
      return;
    }
    root.setProperty('--shape-rounded-s', `${scale.s}px`);
    root.setProperty('--shape-rounded-m', `${scale.m}px`);
    root.setProperty('--shape-rounded-l', `${scale.l}px`);
    for (const [category, step] of Object.entries(SHAPE_CATEGORIES)) {
      root.setProperty(`--shape-semantic-${category}`, `${scale[step]}px`);
    }
  });
</script>

  <section>
    <Text as="h3" variant="title-lg">角の丸みと曲率</Text>
    <Text as="p" variant="body-sm" muted>
      shape.md §4 の MEME。すべての非ゼロ半径に連続曲率を当てる。Web の機構は corner-shape で、未対応環境は
      宣言ごと無視して素朴な円弧へ退避する(第7条。半径量は変わらず質感だけ変わる)。SSOT の正準は Figma 60% ≒
      iOS .continuous ≒ Compose 0.6f だが、CSS の引数はそれとは別の尺度なので、実機で見て決める。
      対応していない環境では下の見本がすべて同じ(円弧)に見える。
    </Text>
    <Text as="p" variant="body-sm" muted>
      角丸の量そのものが小さい面(現行だと control と card が 6px、tag が 2px)では、曲率を変えても差は
      1px 未満でほぼ見えない。曲率の MEME が読み取れるのは dialog(10px)と pill だけである。下の半径の
      見比べで丸みを増すと、曲率の差も見えるようになる。見本のボタンは半径 20px で描いている。
    </Text>

    <Text as="p" variant="body-sm">半径スケール: <code>{radiusScale}</code></Text>
    <Cluster gap="sm" align="center">
      <button
        type="button"
        class="pg-curve pg-scale"
        class:pg-curve-on={radiusScale === '実装のまま'}
        onclick={() => (radiusScale = '実装のまま')}
      >
        実装のまま<br /><small>環境で決まる</small>
      </button>
      {#each RADIUS_SCALES as scale (scale.name)}
        <button
          type="button"
          class="pg-curve pg-scale"
          class:pg-curve-on={radiusScale === scale.name}
          onclick={() => (radiusScale = scale.name)}
        >
          {scale.name}<br /><small>{scale.s} / {scale.m} / {scale.l}</small>
        </button>
      {/each}
    </Cluster>
    <Text as="p" variant="body-sm" muted>
      連続曲率が出せる環境では +2段(6 / 14 / 20)、出せない環境では現行(2 / 6 / 10)が既定である(裁定)。
      素朴な円弧のままで半径だけ大きくすると膨れて見えるが、連続曲率が乗ると同じ量でも締まって見えるため。
      「実装のまま」はその既定を見る。以降のボタンは強制的に上書きして見比べる用で、動かすのは原始5段の
      値だけ。カテゴリから原始への割当(shape.md §6)は動かさない。pill(circular)と angular(0px)は対象外。
      同心角丸(§7)の効き方も一緒に変わるので、Card の中の Button の角も見ておく。
    </Text>

    <Text as="p" variant="body-sm">いま効いている値: <code>superellipse({curvature})</code></Text>
    <Cluster gap="sm" align="center">
      {#each ['1', '1.4', '1.6', '1.8', '2', '2.4'] as k (k)}
        <button
          type="button"
          class="pg-curve"
          class:pg-curve-on={curvature === k}
          style="corner-shape: superellipse({k})"
          onclick={() => (curvature = k)}
        >
          {k}{k === '1' ? '(round)' : k === '2' ? '(squircle)' : ''}
        </button>
      {/each}
    </Cluster>

    <Text as="p" variant="body-sm" muted>
      押すと部品全体へ適用する。値を上げるほど四角へ寄る(1=円弧、2=squircle、∞=直角)。半径の
      カテゴリでは分けない(裁定)。差が読み取れるのは pill / circular と Dialog(10px)で、control と
      card(6px)や tag(2px)ではどの値でも見た目が変わらない。
    </Text>
  </section>
