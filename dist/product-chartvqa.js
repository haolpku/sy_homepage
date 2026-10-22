/* Homepage-native ChartVQA exhibit. The replay is an editorial demonstration. */
(() => {
  const data=window.chartVqaExample;
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ranked=[...data.readings].sort((a,b)=>(a[1]-a[3]/a[2])-(b[1]-b[3]/b[2]));
  function body(step) {
    if(step===1)return `<h4>按名称关联，避免位置误配。</h4><p>三个面板里的林区顺序不同，以 Sector 名称对齐。</p><table><thead><tr><th>林区</th><th>A · t/ha</th><th>B · ha</th><th>C · t</th></tr></thead><tbody>${data.readings.map(r=>`<tr>${r.map((v,i)=>`<td>${i?Number(v).toFixed(1):escape(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    if(step===2)return `<h4>先统一单位，再计算排序。</h4><p>将采伐量除以面积，再从现存木材密度中扣除。</p><div class="vqa-formula">净密度 = A − C / B <span>t/ha</span></div><div class="vqa-ranking">${ranked.map((r,i)=>{const net=r[1]-r[3]/r[2];return `<div><small>${String(i+1).padStart(2,'0')}</small><span>${escape(r[0])}</span><i><b style="width:${net/(ranked[6][1]-ranked[6][3]/ranked[6][2])*100}%"></b></i><strong>${net.toFixed(2)}</strong></div>`;}).join('')}</div>`;
    if(step===3)return `<h4>从多图证据，到结构化答案。</h4><p>按净密度升序排列，返回 7 个林区名称。</p><pre class="vqa-answer">${escape(JSON.stringify(JSON.parse(data.oracle),null,2))}</pre><span class="vqa-verified">✓ 本例排序与原始 Oracle 一致</span>`;
    return `<h4>一题，连接三种图表。</h4><p>点击字段，在原图中定位解题所需的证据。</p><div class="vqa-evidence">${[['A','现存木材密度','Standing Timber','t/ha'],['B','样地面积','Plot Area','ha'],['C','采伐量','Harvest Rate','t']].map(([id,name,en,unit])=>`<button type="button" data-vqa-panel="${id}" aria-pressed="false"><b>${id}</b><span>${name}<small>${en}</small></span><em>${unit} ↗</em></button>`).join('')}</div>`;
  }
  function render(){return `<div class="artifact-view vqa-view"><div class="vqa-question"><span>QUESTION / 原题中文释义</span><h4>扣除单位面积采伐量后，七个林区的净木材密度如何从小到大排序？</h4></div><div class="vqa-workspace"><div class="vqa-image"><div class="vqa-image-inner"><button class="vqa-zoom" type="button" data-zoom aria-label="放大 ChartVQA 原始森林调查图"><img src="${escape(data.image)}" alt="原始森林调查三面板图：A现存木材密度、B样地面积、C采伐量" width="1700" height="1600"></button>${['A','B','C'].map(id=>`<span class="vqa-focus vqa-focus-${id}" data-vqa-focus="${id}" aria-hidden="true"></span>`).join('')}</div><span class="vqa-image-hint">原始三面板图 · 点击放大 ↗</span></div><div class="vqa-process"><div class="vqa-replay"><span>FOLLOW THE EVIDENCE</span><button type="button" data-vqa-play aria-pressed="false">播放演示 ▷</button></div><div class="vqa-steps" aria-label="选择图文推理展示步骤">${['读图','对齐','计算','答案'].map((s,i)=>`<button type="button" data-vqa-step="${i}" aria-pressed="${i===0}"><span>${String(i+1).padStart(2,'0')}</span>${s}</button>`).join('')}</div><div class="vqa-progress" aria-hidden="true"><span></span></div><div class="vqa-body">${body(0)}</div><span class="vqa-editorial">演示步骤据图整理，非在线模型生成</span></div></div><div class="vqa-original"><details><summary>原题与原始回答 <span>QUESTION / RESPONSE</span></summary><p class="vqa-source-question">${escape(data.question)}</p><pre tabindex="0">${escape(data.response)}</pre></details><details><summary>原始推理轨迹 <span>CoT / 未改写</span></summary><pre tabindex="0">${escape(data.cot)}</pre></details></div></div>`;}
  function mount(panel,signal){
    const root=panel.querySelector('.vqa-view');if(!root)return;
    const content=root.querySelector('.vqa-body'),play=root.querySelector('[data-vqa-play]'),bar=root.querySelector('.vqa-progress span');
    let step=0,playing=false,elapsed=0,last=null,frame=0,visible=true;
    function pause(){playing=false;last=null;play.textContent='播放演示 ▷';play.setAttribute('aria-pressed','false');}
    function show(i){step=i;elapsed=0;bar.style.width='0%';root.querySelectorAll('[data-vqa-step]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.vqaStep)===i));content.innerHTML=body(i);root.querySelectorAll('[data-vqa-focus]').forEach(e=>e.classList.remove('vqa-highlight'));}
    root.addEventListener('click',event=>{
      const button=event.target.closest('[data-vqa-step]');if(button){pause();show(Number(button.dataset.vqaStep));}
      const evidence=event.target.closest('[data-vqa-panel]');if(evidence){pause();root.querySelectorAll('[data-vqa-focus]').forEach(e=>e.classList.toggle('vqa-highlight',e.dataset.vqaFocus===evidence.dataset.vqaPanel));root.querySelectorAll('[data-vqa-panel]').forEach(e=>e.setAttribute('aria-pressed',e===evidence));}
    },{signal});
    play.addEventListener('click',()=>{if(playing)pause();else{playing=true;last=null;play.textContent='暂停演示 Ⅱ';play.setAttribute('aria-pressed','true');}},{signal});
    const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);last=null;});observer.observe(root);
    document.addEventListener('visibilitychange',()=>{last=null;},{signal});
    function tick(now){
      if(signal.aborted)return;
      if(playing&&visible&&!document.hidden&&!document.getElementById('product-image-dialog').open){
        if(last!==null)elapsed+=Math.min(now-last,300);last=now;
        if(elapsed>=6000)show((step+1)%4);
        bar.style.width=`${elapsed/6000*100}%`;
      }else last=null;
      frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
    signal.addEventListener('abort',()=>{cancelAnimationFrame(frame);observer.disconnect();},{once:true});
  }
  window.chartVqaView={render,mount};
})();
