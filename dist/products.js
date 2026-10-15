(() => {
  const root = document.getElementById('data-in-practice');
  if (!root) return;
  const products = window.dataProducts;
  const excerpts = window.productExcerpts;
  const panel = document.getElementById('product-panel');
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const dialog = document.getElementById('product-image-dialog');
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  let active = 'game';
  let controller;
  let loadObserver;
  let imageTrigger;

  function windowBar(name) {
    return `<div class="code-window-bar"><i></i><i></i><i></i><span>${escape(name)}</span></div>`;
  }
  function artifact(product) {
    if (['legal', 'industrial', 'research', 'rsi'].includes(product.type)) return window.productRecordViews.render(product.type);
    if (product.type === 'game') return `<div class="artifact-view game-view"><div class="game-controls" aria-label="选择三维素材"><button type="button" data-game="scene" aria-pressed="true">浮空圣域</button><button type="button" data-game="dragon" aria-pressed="false">角色素材</button></div><div class="game-scene"></div><div class="game-loading" role="status"><span aria-hidden="true"></span>正在载入原始三维素材</div><span class="game-help">拖动 / 方向键旋转 · 原始 GLB</span></div>`;
    if (product.type === 'office') return `<div class="artifact-view office-view"><div class="artifact-controls" aria-label="选择参考成品页面"><button type="button" data-slide="cover" aria-pressed="true">成品封面</button><button type="button" data-slide="evidence" aria-pressed="false">材料证据</button><button type="button" data-slide="analysis" aria-pressed="false">费用分析</button></div><button type="button" class="artifact-zoom" data-zoom aria-label="放大办公采购参考成品"><img src="assets/products/office-cover.jpg" alt="真实参考成品：办公家具采购比选与审批建议" width="1334" height="750"></button></div>`;
    if (product.type === 'lean') return `<div class="artifact-view lean-view"><div class="code-window">${windowBar('samples/items-2.12/Main.lean')}<pre><code>${escape(excerpts.lean).replace('theorem reverse_chernoff_binomial','<span class="code-accent">theorem reverse_chernoff_binomial</span>')}</code></pre></div><div class="lean-caption"><span>ℒ</span> Lean 4 · Mathlib · 原始形式化陈述</div></div>`;
    return `<div class="artifact-view terminal-view"><div class="code-window">${windowBar('firewall-synthesis / instruction.md')}<pre><code><span class="code-comment"># Firewall policy synthesis</span>\n\nProduce an ordered first-match firewall policy.\nWrite policy.json with at most 22 rules.\n\n<span class="code-accent">{
  "src": [0, 3], "dst": [0, 11],
  "protocols": [0, 1], "services": [2, 4],
  "epochs": [0, 2], "action": "allow"
}</span>\n\n<span class="code-comment">// acceptance: replay every listed traffic class</span></code></pre></div><div class="task-files"><span>01 / TASK<br>instruction.md<br>environment/</span><span>02 / SOLUTION<br>solution/<br>tests/</span><span>03 / TRACE<br>rollouts/<br>summary.json</span></div></div>`;
  }

  function select(id, { focus = false, scroll = false } = {}) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    controller?.abort();
    loadObserver?.disconnect();
    controller = new AbortController();
    const signal = controller.signal;
    active = id;
    tabs.forEach(tab => {
      const selected = tab.dataset.product === id;
      tab.setAttribute('aria-selected', selected);
      tab.tabIndex = selected ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `product-tab-${id}`);
    panel.innerHTML = `<div class="product-story"><p class="product-label">${escape(product.label)}</p><h3>${escape(product.title).replace('\n','<br>')}</h3><p class="product-description">${escape(product.description)}</p><div class="product-formats">${product.formats.map(x=>`<span>${escape(x)}</span>`).join('')}</div><ul class="product-delivery" aria-label="交付内容">${product.contents.map(x=>`<li>${escape(x)}</li>`).join('')}</ul><p class="product-use">${escape(product.use)}</p><a class="product-cta" href="#contact">讨论 ${escape(product.name)} 数据需求 <span aria-hidden="true">↗</span></a></div><div class="product-artifact"><div class="artifact-top"><span>${escape(product.example)}</span><span class="artifact-badge">${escape(product.count)}</span></div>${artifact(product)}<div class="artifact-footer"><span>${escape(product.caption)}</span><strong>SOURCE / EXAMPLE</strong></div></div>`;
    root.querySelector('#product-selection-status').textContent = `已选择${product.name}数据样例`;
    if (focus) tabs.find(tab=>tab.dataset.product===id).focus();
    if (scroll) root.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    window.productRecordViews.mount(panel, product.type, signal);
    if (id === 'game') {
      const host = panel.querySelector('.game-scene');
      loadObserver = new IntersectionObserver(entries => {
        if (entries.some(entry=>entry.isIntersecting)) {
          loadObserver.disconnect();
          loadGame(host, 'scene', signal);
        }
      }, { rootMargin: '100px' });
      loadObserver.observe(host);
    }
  }

  async function loadGame(host, kind, signal) {
    try {
      const { mountViewer } = await import('./showcase-viewer.js?v=a2bf5be1eb6b');
      if (signal.aborted) return;
      await mountViewer(host, { asset: `assets/products/${kind === 'scene' ? 'sanctuary' : 'dragon'}.glb`, kind, signal });
    } catch {
      if (signal.aborted) return;
      host.parentElement.querySelector('.game-loading').textContent = '此浏览器暂不支持三维预览；可切换查看其他数据样例。';
      host.parentElement.querySelector('.game-help').textContent = '原始 GLB · 3D 素材';
    }
  }

  root.addEventListener('click', event => {
    const tab = event.target.closest('[data-product]');
    if (tab) select(tab.dataset.product);
    const related = event.target.closest('[data-related]');
    if (related) select(related.dataset.related, { focus: true, scroll: true });
    const slide = event.target.closest('[data-slide]');
    if (slide) {
      panel.querySelectorAll('[data-slide]').forEach(button => button.setAttribute('aria-pressed', button === slide));
      const image = panel.querySelector('.artifact-zoom img');
      image.src = `assets/products/office-${slide.dataset.slide}.jpg`;
      image.alt = `原始办公采购参考成品：${slide.textContent}`;
    }
    const game = event.target.closest('[data-game]');
    if (game && game.getAttribute('aria-pressed') !== 'true') {
      controller.abort();
      controller = new AbortController();
      panel.querySelectorAll('[data-game]').forEach(button => button.setAttribute('aria-pressed', button === game));
      panel.querySelector('.artifact-top > span').textContent = game.dataset.game === 'scene' ? '星穹浮空圣域 · 原始场景素材' : '星穹之约 · 原始角色素材';
      const host = panel.querySelector('.game-scene');
      delete host.dataset.ready;
      loadGame(host, game.dataset.game, controller.signal);
    }
    const zoom = event.target.closest('[data-zoom]');
    if (zoom) {
      const image = zoom.querySelector('img');
      const large = dialog.querySelector('img');
      large.src = image.src;
      large.alt = image.alt;
      dialog.querySelector('p').textContent = image.alt;
      imageTrigger = zoom;
      dialog.showModal();
    }
  });
  root.querySelector('.product-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const current = products.findIndex(x=>x.id === active);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? products.length-1 : (current + (event.key==='ArrowRight'?1:-1)+products.length)%products.length;
    select(products[index].id, { focus: true });
  });
  dialog.querySelector('button').addEventListener('click', ()=>dialog.close());
  dialog.addEventListener('close', ()=>imageTrigger?.focus());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  window.addEventListener('pagehide', ()=>{ controller?.abort(); loadObserver?.disconnect(); });
  window.addEventListener('pageshow', event=>{ if (event.persisted) select(active); });
  select('game');
})();
