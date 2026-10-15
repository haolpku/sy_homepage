/* Real record excerpts and sample-run replays for the homepage exhibition. */
(() => {
  const examples = window.productExamples;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function json(data) {
    const raw = JSON.stringify(data, null, 2);
    const token = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null|-?\d+(?:\.\d+)?)\b/g;
    let html = '', offset = 0, match;
    while ((match = token.exec(raw))) {
      html += escape(raw.slice(offset, match.index));
      const type = match[2] ? 'key' : match[1] ? 'string' : 'value';
      html += `<span class="record-${type}">${escape(match[0])}</span>`;
      offset = token.lastIndex;
    }
    return html + escape(raw.slice(offset));
  }
  const code = (text, formatted = false) => `<pre class="example-code" tabindex="0" aria-label="样例数据内容"><code>${formatted ? text : escape(text)}</code></pre>`;
  function editor(file, body, kind = 'SOURCE EXCERPT') {
    return `<div class="record-editor"><div class="record-editor-bar"><span class="record-file">${escape(file)}</span><span>${escape(kind)}</span></div>${body}</div>`;
  }
  function legalBody(step) {
    if (step === 1) return editor('PR13_continuity_menu.docx', `<div class="evidence-content"><div class="evidence-heading"><span>DOCX → TEXT</span><strong>PR13 continuity menu</strong></div>${examples.legal.evidence.paragraphs.map((text, i)=>`<div class="evidence-paragraph"><span>§ ${String(i+1).padStart(2,'0')}</span><p>${escape(text)}</p></div>`).join('')}</div>`, '原始证据节选');
    if (step === 2) return editor('HANDOFF.md → plan.json', code(json(examples.legal.output_contract), true), '输出接口规范');
    return editor('instruction.md + input files', code(json(examples.legal.record), true), '字段化展示');
  }
  function legal() {
    return `<div class="artifact-view record-view legal-record" data-record="legal"><div class="record-context"><span class="record-kicker">LEGAL / TASK → EVIDENCE → OUTPUT</span><h4>一条法律数据，怎样被组织？</h4><p>题面、合同条款与结构化交付接口，关联在同一个案例中。</p></div><div class="example-tabs" aria-label="查看法律样例内容"><button type="button" data-legal-step="0" aria-pressed="true">任务记录</button><button type="button" data-legal-step="1" aria-pressed="false">合同原文</button><button type="button" data-legal-step="2" aria-pressed="false">输出接口</button></div><div class="record-body">${legalBody(0)}</div><div class="record-trail"><span>instruction.md</span><b>→</b><span>contract / evidence</span><b>→</b><span>plan.json</span></div></div>`;
  }
  function researchBody(index) {
    const step = examples.research[index];
    return `<div class="process-caption"><div><span>STEP ${String(index+1).padStart(2,'0')} / ${escape(step.verb)}</span><h4>${escape(step.description)}</h4></div><span class="process-file-icon" aria-hidden="true">{ }</span></div>${editor(step.file, code(json(step.data), true), '真实运行字段节选')}`;
  }
  function research() {
    return `<div class="artifact-view record-view auto-record" data-record="research" data-step="0" data-playing="false"><div class="replay-header"><span class="record-kicker">AUTORESEARCH / SAMPLE RUN REPLAY</span><button type="button" class="replay-toggle" data-auto-play aria-pressed="false">播放自动流程</button></div><div class="auto-steps" aria-label="选择自动研究步骤">${examples.research.map((step,i)=>`<button type="button" data-auto-step="${i}" aria-pressed="${i===0}"><span>${String(i+1).padStart(2,'0')}</span>${escape(step.name)}</button>`).join('')}</div><div class="auto-progress" aria-hidden="true"><span></span></div><div class="record-body">${researchBody(0)}</div><div class="record-trail"><span>READ</span><b>→</b><span>EVOLVE</span><b>→</b><span>EXPERIMENT</span><b>→</b><span>REFLECT</span></div><span class="portfolio-sr" data-process-status role="status"></span></div>`;
  }
  function rewardStrip(iteration) {
    const history = window.productExcerpts.rsi;
    const points = history.map((entry,i)=>[6+i*25, 39-entry.reward*48]);
    return `<div class="reward-strip"><span>REFERENCE REWARD</span><svg viewBox="0 0 240 48" role="img" aria-label="样例参考运行的逐轮奖励"><polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#65828a" stroke-width="1.2"/>${points.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${i+1===iteration?3:1.5}" fill="${i+1===iteration?'#f4b28d':'#65828a'}"/>`).join('')}</svg><strong>ITER ${String(iteration).padStart(2,'0')}</strong></div>`;
  }
  function rsiBody(iterationIndex, tab) {
    const entry = examples.rsi[iterationIndex];
    if (tab === 1) return editor(entry.code_file, code(entry.code), entry.code_label);
    if (tab === 2) return editor('reference_run_traces.json / evaluation', code(json(entry.feedback), true), '原始评测字段');
    const description = entry.iteration === 7 ? '发现超时预算冲突与参数类型错误，据此改写 harness。' : '从单轮脚手架出发，增加多轮工作循环、文件工具和校验。';
    return `<div class="rsi-observation"><span>OBSERVE → PATCH → EVALUATE</span><h4>${description}</h4></div>${editor('reference_run_traces.json / proposer_response_summary', `<div class="trace-message"><span class="trace-role">PROPOSER / 原始改进记录</span><p>${escape(entry.summary)}</p></div>`)}`;
  }
  function rsi() {
    const entry = examples.rsi[1];
    return `<div class="artifact-view record-view rsi-record" data-record="rsi" data-iteration-index="1" data-rsi-tab="0"><div class="replay-header"><span class="record-kicker">HARNESS EVOLUTION / SAMPLE TRACE</span><div class="iteration-choices" aria-label="选择参考迭代"><button type="button" data-rsi-iteration="0" aria-pressed="false">ITER 01</button><button type="button" data-rsi-iteration="1" aria-pressed="true">ITER 07</button></div></div><div class="rsi-record-summary"><span>同一轮的观察、代码与反馈</span><strong>reward <b data-current-reward>${entry.feedback.reward.toFixed(2)}</b></strong></div><div class="example-tabs" aria-label="查看RSI样例数据"><button type="button" data-rsi-tab="0" aria-pressed="true">改进记录</button><button type="button" data-rsi-tab="1" aria-pressed="false">代码片段</button><button type="button" data-rsi-tab="2" aria-pressed="false">评测反馈</button></div><div class="record-body">${rsiBody(1,0)}</div><div data-reward-strip>${rewardStrip(7)}</div></div>`;
  }
  function industrial() {
    return `<div class="artifact-view assembly-record" data-record="industrial"><div class="assembly-controls" aria-label="三维装配操作"><button type="button" data-assembly-mode="cycle" aria-pressed="true" disabled>循环装配</button><button type="button" data-assembly-mode="exploded" aria-pressed="false" disabled>展开</button><button type="button" data-assembly-mode="assembled" aria-pressed="false" disabled>合拢</button><button type="button" data-assembly-pause aria-pressed="false" disabled>暂停</button><button type="button" data-assembly-reset disabled>复位视角</button></div><div class="industrial-scene"></div><div class="assembly-loading" role="status"><span></span>正在载入原始 STEP 曲面</div><div class="assembly-status"><span class="assembly-live-dot"></span><span data-assembly-phase>载入工件</span><small>BR-42 / STEP GEOMETRY</small></div><div class="assembly-help">拖动 / 方向键旋转 · 滚轮缩放</div><div class="assembly-legend"><span style="--part-color:#718c9a">底座</span><span style="--part-color:#9bb4be">背板</span><span style="--part-color:#608994">加强筋 A</span><span style="--part-color:#81a5ac">加强筋 B</span><span style="--part-color:#b8cccf">承载平台</span><span style="--part-color:#df9d78">服务接口</span></div></div>`;
  }

  function mount(panel, type, signal) {
    const host = panel.querySelector('[data-record]');
    if (!host) return;
    let observer;
    let industrialView;
    let animationPaused = false;
    let visible = true;
    let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    function updateResearch(index) {
      host.dataset.step = index;
      host.querySelectorAll('[data-auto-step]').forEach(button=>button.setAttribute('aria-pressed', Number(button.dataset.autoStep)===index));
      host.querySelector('.record-body').innerHTML = researchBody(index);
      host.querySelector('[data-process-status]').textContent = `研究回放：${examples.research[index].name}`;
      const progress = host.querySelector('.auto-progress span');
      progress.style.animation = 'none';
      requestAnimationFrame(()=>{ if (!signal.aborted) progress.style.animation = ''; });
    }
    function updatePlaying() {
      host.dataset.playing = playing;
      const button = host.querySelector('[data-auto-play]');
      button.setAttribute('aria-pressed', playing);
      button.textContent = playing ? '暂停回放 Ⅱ' : '继续回放 ▷';
    }
    function updateRsi() {
      const index = Number(host.dataset.iterationIndex), tab = Number(host.dataset.rsiTab);
      host.querySelector('.record-body').innerHTML = rsiBody(index,tab);
      host.querySelector('[data-current-reward]').textContent = examples.rsi[index].feedback.reward.toFixed(2);
      host.querySelector('[data-reward-strip]').innerHTML = rewardStrip(examples.rsi[index].iteration);
      host.querySelectorAll('[data-rsi-iteration]').forEach(button=>button.setAttribute('aria-pressed', Number(button.dataset.rsiIteration)===index));
      host.querySelectorAll('button[data-rsi-tab]').forEach(button=>button.setAttribute('aria-pressed', Number(button.dataset.rsiTab)===tab));
    }
    if (type === 'research') {
      updatePlaying();
      observer = new IntersectionObserver(([entry])=>{ visible=entry.isIntersecting; });
      observer.observe(host);
      const timer = setInterval(()=>{
        if (signal.aborted || !playing || !visible || document.hidden) return;
        updateResearch((Number(host.dataset.step)+1)%examples.research.length);
      },6500);
      signal.addEventListener('abort',()=>{ clearInterval(timer); observer.disconnect(); },{once:true});
    }
    if (type === 'industrial') {
      observer = new IntersectionObserver(async entries=>{
        if (!entries.some(entry=>entry.isIntersecting)) return;
        observer.disconnect();
        try {
          const module = await import('./showcase-viewer.js?v=a2bf5be1eb6b');
          if (signal.aborted) return;
          industrialView = await module.mountIndustrial(host.querySelector('.industrial-scene'), {
            asset: 'assets/products/industrial-model.json', signal,
            onPhase: phase=>{
              const labels = {assembled:'工件归位',exploding:'几何分区展开',exploded:'展开查看结构',assembling:'逐区拼接归位'};
              host.querySelector('[data-assembly-phase]').textContent = labels[phase] || phase;
            },
          });
          if (signal.aborted) return;
          host.querySelectorAll('.assembly-controls button').forEach(button=>button.disabled=false);
          const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (reduced) {
            host.querySelectorAll('[data-assembly-mode]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.assemblyMode==='assembled'));
            animationPaused = true;
            host.querySelector('[data-assembly-pause]').textContent='继续';
            host.querySelector('[data-assembly-pause]').setAttribute('aria-pressed','true');
          }
        } catch (error) {
          if (!signal.aborted) console.error('Industrial viewer failed:', error);
          if (!signal.aborted) host.querySelector('.assembly-loading').textContent='当前浏览器无法显示三维工件，可继续查看其他数据样例。';
        }
      },{rootMargin:'100px'});
      observer.observe(host);
      signal.addEventListener('abort',()=>observer.disconnect(),{once:true});
    }
    host.addEventListener('click',event=>{
      const legalStep = event.target.closest('[data-legal-step]');
      if (legalStep) {
        host.querySelectorAll('[data-legal-step]').forEach(button=>button.setAttribute('aria-pressed',button===legalStep));
        host.querySelector('.record-body').innerHTML=legalBody(Number(legalStep.dataset.legalStep));
      }
      const autoStep=event.target.closest('[data-auto-step]');
      if (autoStep) { playing=false; updatePlaying(); updateResearch(Number(autoStep.dataset.autoStep)); }
      if (event.target.closest('[data-auto-play]')) { playing=!playing; updatePlaying(); }
      const rsiIteration=event.target.closest('[data-rsi-iteration]');
      if (rsiIteration) { host.dataset.iterationIndex=rsiIteration.dataset.rsiIteration; updateRsi(); }
      const rsiTab=event.target.closest('button[data-rsi-tab]');
      if (rsiTab) { host.dataset.rsiTab=rsiTab.dataset.rsiTab; updateRsi(); }
      const assemblyMode=event.target.closest('[data-assembly-mode]');
      if (assemblyMode && industrialView) {
        industrialView.setMode(assemblyMode.dataset.assemblyMode);
        animationPaused=assemblyMode.dataset.assemblyMode!=='cycle';
        host.querySelectorAll('[data-assembly-mode]').forEach(button=>button.setAttribute('aria-pressed',button===assemblyMode));
        host.querySelector('[data-assembly-pause]').textContent=animationPaused?'继续':'暂停';
        host.querySelector('[data-assembly-pause]').setAttribute('aria-pressed',animationPaused);
      }
      if (event.target.closest('[data-assembly-pause]') && industrialView) {
        animationPaused=!animationPaused;
        if (!animationPaused && host.querySelector('[data-assembly-mode="cycle"]').getAttribute('aria-pressed')!=='true') {
          industrialView.setMode('cycle');
          host.querySelectorAll('[data-assembly-mode]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.assemblyMode==='cycle'));
        }
        industrialView.setPaused(animationPaused);
        host.querySelector('[data-assembly-pause]').textContent=animationPaused?'继续':'暂停';
        host.querySelector('[data-assembly-pause]').setAttribute('aria-pressed',animationPaused);
      }
      if (event.target.closest('[data-assembly-reset]')) industrialView?.resetView();
    },{signal});
  }
  window.productRecordViews = {render: type=>({legal, research, rsi, industrial}[type]?.()), mount};
})();
