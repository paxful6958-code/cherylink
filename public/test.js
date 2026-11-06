 <script>
(function(){
  "use strict";

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const KES = n => 'KSh ' + Number(n||0).toLocaleString('en-KE', {maximumFractionDigits:0});
  const RATE = 0.029;

  function esc(str){
    return String(str ?? '').replace(/[&<>"'`/]/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;','/':'&#47;'
    }[c]));
  }
  const uid = () => 'LF' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase();

  function monthlyPayment(principal, months){
    const r = RATE;
    return Math.round((principal * r * Math.pow(1+r, months)) / (Math.pow(1+r, months) - 1));
  }

  const DB = {
    get apps(){ try { return JSON.parse(localStorage.getItem('lf_apps')||'[]'); } catch(e){ return []; } },
    set apps(v){ localStorage.setItem('lf_apps', JSON.stringify(v)); },
    get current(){ try { return JSON.parse(localStorage.getItem('lf_current')||'null'); } catch(e){ return null; } },
    set current(v){ localStorage.setItem('lf_current', JSON.stringify(v)); },
  };

  function toast(msg, type='success'){
    const map = {
      success:{i:'fa-circle-check', c:'text-brand-500'},
      error:{i:'fa-circle-xmark', c:'text-red-500'},
      info:{i:'fa-circle-info', c:'text-sky-500'},
      warn:{i:'fa-triangle-exclamation', c:'text-amber-500'},
    };
    const t = map[type]||map.info;
    const el = document.createElement('div');
    el.className = 'glass-strong rounded-2xl px-4 py-3.5 shadow-xl flex items-start gap-3 animate-slide-in';
    el.innerHTML = `<i class="fa-solid ${t.i} ${t.c} text-lg mt-0.5"></i><p class="text-sm font-medium flex-1 text-slate-700 dark:text-slate-200">${esc(msg)}</p><button class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>`;
    $('#toastWrap').appendChild(el);
    const remove = () => { el.style.transition='all .3s'; el.style.opacity=0; el.style.transform='translateX(120%)'; setTimeout(()=>el.remove(),300); };
    el.querySelector('button').onclick = remove;
    setTimeout(remove, 4000);
  }

  /* ---------- Theme ---------- */
  function initTheme(){
    const saved = localStorage.getItem('lf_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', saved ? saved==='dark' : prefersDark);
  }
  $('#themeToggle').addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('lf_theme', dark ? 'dark' : 'light');
  });
  initTheme();

  /* ---------- Admin Login ---------- */
  function showAdminLogin() {
    $('#adminLoginModal').classList.remove('hidden');
    $('#adminLoginUser').value = '';
    $('#adminLoginPass').value = '';
    $('#adminLoginError').textContent = '';
    $('#adminLoginUser').focus();
  }
  function hideAdminLogin() { $('#adminLoginModal').classList.add('hidden'); }

  function attemptAdminLogin() {
    const username = $('#adminLoginUser').value.trim();
    const password = $('#adminLoginPass').value;
    if (username === 'josphat' && password === 'JOSPHAT2030') {
      hideAdminLogin();
      $$('[data-page]').forEach(p => p.hidden = p.dataset.page !== 'admin');
      window.scrollTo({top:0, behavior:'instant'});
      renderAdmin();
      toast('Welcome, Admin!', 'success');
    } else {
      $('#adminLoginError').textContent = 'Invalid username or password.';
      $('#adminLoginPass').value = '';
      $('#adminLoginPass').focus();
    }
  }

  function navigate(page){
    if(page === 'admin') { showAdminLogin(); return; }
    $$('[data-page]').forEach(p => p.hidden = p.dataset.page !== page);
    window.scrollTo({top:0, behavior:'instant'});
    if(page==='dashboard') renderDashboard();
    if(page==='apply') resetForm();
  }

  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]');
    if(nav){ e.preventDefault(); navigate(nav.dataset.nav); }
  });

  $('#adminLoginBtn').addEventListener('click', attemptAdminLogin);
  $('#adminLoginPass').addEventListener('keydown', e => { if (e.key === 'Enter') attemptAdminLogin(); });
  $('#adminLoginUser').addEventListener('keydown', e => { if (e.key === 'Enter') $('#adminLoginPass').focus(); });
  $('#adminLoginCancel').addEventListener('click', hideAdminLogin);
  $('#adminLoginModal').addEventListener('click', e => { if (e.target === $('#adminLoginModal')) hideAdminLogin(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#adminLoginModal').classList.contains('hidden')) hideAdminLogin(); });
  window.addEventListener('scroll', () => { const n=$('#topnav'); if(n) n.firstElementChild.classList.toggle('shadow-2xl', window.scrollY > 20); });

  /* ---------- Features & How ---------- */
  const FEATURES = [
    {icon:'fa-bolt', title:'Instant Approval', desc:'Smart underwriting approves most applications in under 3 minutes.'},
    {icon:'fa-percent', title:'Low Interest Rates', desc:'Transparent rates from 2.9% monthly with no hidden fees, ever.'},
    {icon:'fa-lock', title:'Secure Transactions', desc:'256-bit encryption and bank-grade security protect your data.'},
    {icon:'fa-headset', title:'24/7 Support', desc:'Our team is always available via chat, phone and email.'},
  ];
  $('#featuresGrid').innerHTML = FEATURES.map((f,i)=>`
    <div class="glass-strong rounded-2xl p-6 hover:-translate-y-1 transition duration-300 animate-fade-up" style="animation-delay:${i*0.08}s">
      <div class="w-12 h-12 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 grid place-items-center text-xl mb-4"><i class="fa-solid ${f.icon}"></i></div>
      <h3 class="font-display font-bold text-lg">${f.title}</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">${f.desc}</p>
    </div>`).join('');

  const HOW = [
    {n:'01', icon:'fa-file-pen', title:'Apply online', desc:'Fill the short 4-step application from any device in minutes.'},
    {n:'02', icon:'fa-bolt', title:'Get approved', desc:'Receive an instant decision powered by smart credit scoring.'},
    {n:'03', icon:'fa-money-bill-transfer', title:'Get funded', desc:'Money is sent straight to your M-Pesa wallet, instantly.'},
  ];
  $('#howGrid').innerHTML = HOW.map((h,i)=>`
    <div class="glass-strong rounded-2xl p-7 relative animate-fade-up" style="animation-delay:${i*0.1}s">
      <span class="font-display text-5xl font-extrabold text-brand-500/20">${h.n}</span>
      <div class="w-12 h-12 rounded-xl bg-brand-500 text-white grid place-items-center text-xl my-3"><i class="fa-solid ${h.icon}"></i></div>
      <h3 class="font-display font-bold text-lg">${h.title}</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">${h.desc}</p>
    </div>`).join('');

  /* ---------- Calculator ---------- */
  function makeCalculator(mount, {onChange}={}){
    const min=5000, max=500000, defAmt=50000, terms=[3,6,12,18,24];
    mount.innerHTML = `
      <div class="flex items-end justify-between mb-2"><span class="text-sm text-slate-500 dark:text-slate-400">Loan amount</span><span class="font-display text-2xl font-extrabold text-slate-900 dark:text-white" data-amt>${KES(defAmt)}</span></div>
      <input type="range" min="${min}" max="${max}" step="1000" value="${defAmt}" data-range class="w-full mb-1" />
      <div class="flex justify-between text-xs text-slate-400 mb-5"><span>${KES(min)}</span><span>${KES(max)}</span></div>
      <span class="text-sm text-slate-500 dark:text-slate-400">Repayment period</span>
      <div class="grid grid-cols-5 gap-2 mt-2 mb-6" data-terms>
        ${terms.map(t=>`<button type="button" data-term="${t}" class="py-2 rounded-lg text-sm font-semibold border-1.5 transition ${t===12?'bg-brand-500 text-white border-brand-500':'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'}">${t}m</button>`).join('')}
      </div>
      <div class="bg-brand-50 dark:bg-brand-500/10 rounded-2xl p-5 flex items-center justify-between">
        <div><p class="text-xs text-slate-500 dark:text-slate-400">Monthly payment</p><p class="font-display text-2xl font-extrabold text-brand-700 dark:text-brand-300" data-monthly>—</p></div>
        <div class="text-right"><p class="text-xs text-slate-500 dark:text-slate-400">Total repayable</p><p class="font-semibold text-slate-700 dark:text-slate-200" data-total>—</p></div>
      </div>`;
    let amount=defAmt, term=12;
    const range = mount.querySelector('[data-range]'), amtEl = mount.querySelector('[data-amt]'), monthlyEl = mount.querySelector('[data-monthly]'), totalEl = mount.querySelector('[data-total]');
    function paint(){
      const pct = ((amount-min)/(max-min))*100; range.style.setProperty('--pct', pct+'%');
      amtEl.textContent = KES(amount); const m = monthlyPayment(amount, term);
      monthlyEl.textContent = KES(m); totalEl.textContent = KES(m*term);
      onChange && onChange({amount, term, monthly:m, total:m*term});
    }
    range.addEventListener('input', e => { amount = +e.target.value; paint(); });
    mount.querySelectorAll('[data-term]').forEach(b => b.addEventListener('click', () => {
      term = +b.dataset.term;
      mount.querySelectorAll('[data-term]').forEach(x => { x.className = `py-2 rounded-lg text-sm font-semibold border-1.5 transition ${x===b?'bg-brand-500 text-white border-brand-500':'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`; });
      paint();
    }));
    paint();
    return { get state(){ return {amount, term, monthly:monthlyPayment(amount,term)}; } };
  }
  makeCalculator($('#heroCalc'));

  /* ---------- Multi-step Form ---------- */
  const STEPS = ['Personal','Employment','Loan','Review'];
  let step = 1, formCalc = null, calcState = {amount:50000, term:12};

  function renderStepper(){
    $('#stepper').innerHTML = STEPS.map((label,i)=>{
      const n=i+1, done=n<step, active=n===step;
      const circle = done
        ? `<div class="w-10 h-10 rounded-full bg-brand-500 text-white grid place-items-center"><i class="fa-solid fa-check"></i></div>`
        : `<div class="w-10 h-10 rounded-full grid place-items-center font-bold ${active?'bg-brand-500 text-white shadow-lg shadow-brand-500/30':'bg-slate-200 dark:bg-slate-700 text-slate-500'}">${n}</div>`;
      const line = i<STEPS.length-1 ? `<div class="flex-1 h-1 mx-1 rounded-full step-line ${n<step?'bg-brand-500':'bg-slate-200 dark:bg-slate-700'}"></div>` : '';
      return `<div class="flex items-center ${i<STEPS.length-1?'flex-1':''}"><div class="flex flex-col items-center gap-1.5">${circle}<span class="text-xs font-semibold ${active?'text-brand-600 dark:text-brand-400':'text-slate-400'}">${label}</span></div>${line}</div>`;
    }).join('');
  }

  function showStep(){
    $$('#loanForm [data-step]').forEach(s => s.hidden = +s.dataset.step !== step);
    $('#prevBtn').hidden = step===1; $('#nextBtn').hidden = step===4; $('#submitBtn').hidden = step!==4;
    renderStepper();
    if(step===4) renderReview();
    if(step===3 && !formCalc){
      formCalc = makeCalculator($('#formCalc'), { onChange: s => { calcState = s; $('#loanForm [name=amount]').value = s.amount; $('#loanForm [name=term]').value = s.term; }});
      $('#loanForm [name=amount]').value = calcState.amount; $('#loanForm [name=term]').value = calcState.term;
    }
  }

  document.addEventListener('change', e => {
    if(e.target.matches('input[type=radio][name=gender], input[type=radio][name=employment]')){
      const group = e.target.closest('[id$=Group]');
      if(group) group.querySelectorAll('.radio-card').forEach(c => c.classList.toggle('selected', c.contains(e.target) && e.target.checked));
    }
  });

  function clearError(input){ if(input && input.classList) input.classList.remove('invalid'); }
  function fieldError(name, msg){
    const field = $(`#loanForm [name="${name}"]`);
    if(!field) return; field.classList.add('invalid');
    const container = field.closest('[class*=col-span]') || field.closest('div');
    let err = container && container.querySelector('.form-error');
    if(!err){ const g=$(`#${name}Group`); err = g && g.parentElement.querySelector('.form-error'); }
    if(err) err.textContent = msg;
  }
  function clearAllErrors(){ $$('#loanForm .form-error').forEach(e=>e.textContent=''); $$('#loanForm .invalid').forEach(e=>e.classList.remove('invalid')); }

  function validateStep(){
    clearAllErrors(); const d = new FormData($('#loanForm')); let ok = true;
    const fail = (n,m)=>{ fieldError(n,m); ok=false; };
    if(step===1){
      const n=(d.get('fullName')||'').trim(); if(n.length<3) fail('fullName','Enter your full name.');
      const id=(d.get('nationalId')||'').trim(); if(!/^\d{6,9}$/.test(id)) fail('nationalId','Enter a valid ID (6–9 digits).');
      const p = (d.get('phone') || '').replace(/\s/g, '');
      if (!/^(?:0?7\d{8}|011\d{8}|\+?2547\d{8}|\+?25411\d{7})$/.test(p)) {
        fail('phone', 'Enter a valid Kenyan phone number (0712... or 0112...).');
      }
      const e=(d.get('email')||'').trim(); if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) fail('email','Enter a valid email.');
      const dob=d.get('dob');
      if(!dob) fail('dob','Enter your date of birth.');
      else { const age=(Date.now()-new Date(dob))/(365.25*864e5); if(age<18) fail('dob','Must be 18+.'); else if(age>100) fail('dob','Invalid date.'); }
      if(!d.get('gender')) fail('gender','Select an option.');
    }
    if(step===2){
      if(!d.get('employment')) fail('employment','Select your status.');
      const inc=Number((d.get('income')||'').replace(/[,\s]/g,'')); if(!inc||inc<1000) fail('income','Enter valid income.');
    }
    if(step===3){ if(!d.get('purpose')) fail('purpose','Select a purpose.'); }
    if(step===4){ if(!d.get('terms')){ const e=$('#loanForm .form-error[data-for=terms]'); if(e) e.textContent='Accept the terms.'; ok=false; }}
    if(!ok) toast('Fix highlighted fields.','error');
    return ok;
  }

  $('#loanForm').addEventListener('input', e => {
    if(e.target.matches('input,select')){ clearError(e.target); const c=e.target.closest('div'); if(c){ const err=c.querySelector('.form-error'); if(err) err.textContent=''; }}
  });
  $('#nextBtn').addEventListener('click', () => { if(validateStep()){ step++; showStep(); }});
  $('#prevBtn').addEventListener('click', () => { if(step>1){ step--; showStep(); }});

  function renderReview(){
    const d=new FormData($('#loanForm')), inc=Number((d.get('income')||'').replace(/[,\s]/g,'')), monthly=monthlyPayment(calcState.amount, calcState.term);
    $('#reviewBox').innerHTML = [
      ['Full Name',d.get('fullName')],['National ID',d.get('nationalId')],['Phone',d.get('phone')],['Email',d.get('email')],
      ['Date of Birth',d.get('dob')],['Gender',d.get('gender')],['Employment',d.get('employment')],
      ['Monthly Income',KES(inc)],['Loan Amount',KES(calcState.amount)],['Term',calcState.term+' months'],
      ['Monthly Payment',KES(monthly)],['Purpose',d.get('purpose')],
    ].map(([k,v])=>`<div class="flex items-center justify-between py-2.5 border-b border-slate-200/70 dark:border-slate-700/60"><span class="text-sm text-slate-500 dark:text-slate-400">${esc(k)}</span><span class="font-semibold text-sm text-right">${esc(v||'—')}</span></div>`).join('');
  }

  $('#loanForm').addEventListener('submit', e => {
    e.preventDefault(); if(!validateStep()) return;
    const sb=$('#submitBtn'); sb.disabled=true; sb.innerHTML='<i class="fa-solid fa-spinner animate-spin-slow"></i> Submitting…';
    setTimeout(()=>{
      const d=new FormData($('#loanForm')), inc=Number((d.get('income')||'').replace(/[,\s]/g,'')), monthly=monthlyPayment(calcState.amount, calcState.term);
      const ratio=monthly/(inc||1), status=ratio<=0.45?'Approved':ratio<=0.6?'Pending':'Rejected';
      const app={
        id:uid(), fullName:d.get('fullName'), nationalId:d.get('nationalId'), phone:d.get('phone'),
        email:d.get('email'), dob:d.get('dob'), gender:d.get('gender'), employment:d.get('employment'),
        income:inc, amount:calcState.amount, term:calcState.term, monthly, purpose:d.get('purpose'),
        status, balance:status==='Approved'?calcState.amount:0, createdAt:Date.now(),
        pendingWithdrawal: false, withdrawn: false,
        tx:status==='Approved'?[{t:'Disbursement',amt:calcState.amount,dir:'in',date:Date.now()}]:[],
        notifications:[{
          icon:status==='Approved'?'fa-circle-check':status==='Pending'?'fa-hourglass-half':'fa-circle-xmark',
          text:status==='Approved'?`Loan approved! ${KES(calcState.amount)} disbursed.`:status==='Pending'?'Under review.':'Not approved.',
          date:Date.now()
        }]
      };
      const apps=DB.apps; apps.unshift(app); DB.apps=apps; DB.current=app.id;
      sb.disabled=false; sb.innerHTML='<i class="fa-solid fa-paper-plane"></i> Submit Application';
      toast(`Submitted — ${status}.`, status==='Rejected'?'warn':'success');
      navigate('dashboard');
    }, 1600);
  });

  function resetForm(){ $('#loanForm').reset(); clearAllErrors(); step=1; $$('.radio-card').forEach(c=>c.classList.remove('selected')); calcState={amount:50000,term:12}; if(formCalc){formCalc=null;$('#formCalc').innerHTML='';} showStep(); }
  showStep();

  /* ====================== DASHBOARD ====================== */
  function currentApp(){ const id=DB.current; return id?DB.apps.find(a=>a.id===id)||null:null; }

  function renderDashboard(){
    const app=currentApp();
    if(!app){
      $('#dashName').textContent='there 👋'; $('#dashBalance').textContent=KES(0);
      $('#statusTracker').innerHTML='<div class="text-center py-8 text-slate-400"><i class="fa-regular fa-file-lines text-4xl mb-3"></i><p>No active loan yet.</p><button data-nav="apply" class="mt-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition">Apply for a loan</button></div>';
      $('#txList').innerHTML='<p class="text-sm text-slate-400 py-6 text-center">No transactions.</p>';
      $('#profName').textContent='—'; $('#profEmail').textContent='—'; $('#profDetails').innerHTML=''; $('#avatar').textContent='?';
      $('#notifList').innerHTML='<p class="text-sm text-slate-400">No notifications.</p>'; $('#notifCount').textContent='0';
      return;
    }
    const f=app.fullName.split(' ')[0]; $('#dashName').textContent=f+' 👋';
    $('#dashBalance').textContent=KES(app.balance);
    $('#avatar').textContent=app.fullName.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    $('#profName').textContent=app.fullName; $('#profEmail').textContent=app.email;
    $('#profDetails').innerHTML=[['Phone',app.phone],['National ID',app.nationalId],['Employment',app.employment],['Monthly Income',KES(app.income)]].map(([k,v])=>`<div class="flex justify-between"><dt class="text-slate-500 dark:text-slate-400">${esc(k)}</dt><dd class="font-semibold">${esc(v)}</dd></div>`).join('');

    const sb=$('#statusBadge');
    const st={Approved:'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',Pending:'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',Rejected:'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300','Pending Withdrawal':'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',Withdrawn:'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',Repaid:'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300'};
    let displayStatus = app.status;
    if (app.withdrawn) displayStatus = 'Withdrawn';
    else if (app.pendingWithdrawal) displayStatus = 'Pending Withdrawal';
    sb.className = 'text-xs font-bold px-3 py-1.5 rounded-full '+(st[displayStatus]||st.Pending);
    sb.textContent = displayStatus;

    const stages=['Submitted','Under Review','Approved','Disbursed','Pending Withdrawal','Withdrawn'];
    let reached = 0;
    if(displayStatus === 'Withdrawn') reached = 6;
    else if(displayStatus === 'Pending Withdrawal') reached = 5;
    else if(app.status === 'Approved') reached = 4;
    else if(app.status === 'Pending') reached = 2;
    else if(app.status === 'Rejected') reached = 2;
    else reached = 4;
    const isRejected = app.status === 'Rejected';

    $('#statusTracker').innerHTML = `
      <div class="grid gap-0">
        ${stages.map((s,i)=>{
          const n=i+1, d = n <= reached && !isRejected, rj = isRejected && n > 2;
          const isPw = s === 'Pending Withdrawal' || s === 'Withdrawn';
          const stageColor = d ? (isPw ? 'bg-purple-500 text-white' : 'bg-brand-500 text-white') : (rj ? 'bg-red-100 text-red-500 dark:bg-red-500/15' : 'bg-slate-200 dark:bg-slate-700 text-slate-400');
          const lineColor = (n < reached && !isRejected) ? (isPw ? 'bg-purple-500' : 'bg-brand-500') : 'bg-slate-200 dark:bg-slate-700';
          return `<div class="flex items-start gap-4 ${i < stages.length-1 ? 'pb-6' : ''} relative">
            <div class="relative z-10 w-9 h-9 rounded-full grid place-items-center ${stageColor}"><i class="fa-solid ${d ? 'fa-check' : rj ? 'fa-xmark' : 'fa-circle text-[6px]'}"></i></div>
            ${i < stages.length-1 ? `<div class="absolute left-4 top-9 w-0.5 h-full ${lineColor}"></div>` : ''}
            <div class="pt-1"><p class="font-semibold text-sm ${d ? '' : 'text-slate-400'}">${s}</p></div>
          </div>`;
        }).join('')}
      </div>
      ${!app.pendingWithdrawal && !app.withdrawn && (app.status === 'Approved') ? `
        <div class="mt-4 bg-brand-50 dark:bg-brand-500/10 rounded-xl p-4 text-sm flex items-center justify-between">
          <span>Processing fee required to withdraw</span>
          <button id="quickWithdrawBtn" class="bg-amber-500 text-white px-4 py-2 rounded-lg font-semibold text-xs">Pay KES 87</button>
        </div>` : ''}
      ${app.pendingWithdrawal ? `<div class="mt-4 bg-purple-50 dark:bg-purple-500/10 rounded-xl p-4 text-sm"><span>⏳ Withdrawal in progress. Processing fee paid. Funds will be sent to M-Pesa shortly.</span></div>` : ''}
      ${app.withdrawn ? `<div class="mt-4 bg-sky-50 dark:bg-sky-500/10 rounded-xl p-4 text-sm"><span>✅ Funds have been successfully withdrawn to your M-Pesa account.</span></div>` : ''}
    `;

    setTimeout(() => {
      const qwb = $('#quickWithdrawBtn');
      if(qwb && !qwb._listener) { qwb._listener = true; qwb.addEventListener('click', () => openWithdrawModal()); }
    }, 50);

    $('#txList').innerHTML = (app.tx||[]).length ? app.tx.map(t => {
      const isD = t.t === 'Disbursement', isPW = t.t === 'Disbursement to Pending Withdrawal', isW = t.t === 'Pending Withdrawal to M-Pesa' || t.t === 'Withdrawn to M-Pesa', isFee = t.t === 'Processing Fee (KES 87)';
      let iconColor = 'bg-slate-100 text-slate-500 dark:bg-slate-700', icon = 'fa-arrow-up';
      if(isD) { iconColor = 'bg-brand-100 text-brand-600 dark:bg-brand-500/15'; icon = 'fa-arrow-down'; }
      else if(isPW) { iconColor = 'bg-purple-100 text-purple-600 dark:bg-purple-500/15'; icon = 'fa-clock'; }
      else if(isW) { iconColor = 'bg-sky-100 text-sky-600 dark:bg-sky-500/15'; icon = 'fa-check'; }
      else if(isFee) { iconColor = 'bg-amber-100 text-amber-600 dark:bg-amber-500/15'; icon = 'fa-receipt'; }
      return `<div class="flex items-center justify-between py-3.5">
        <div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl grid place-items-center ${iconColor}"><i class="fa-solid ${icon}"></i></div>
        <div><p class="font-semibold text-sm">${esc(t.t)}</p><p class="text-xs text-slate-400">${new Date(t.date).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}</p></div></div>
        <span class="font-display font-bold ${t.dir === 'in' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-200'}">${t.dir === 'in' ? '+' : '-'}${KES(t.amt)}</span>
      </div>`;
    }).join('') : '<p class="text-sm text-slate-400 py-6 text-center">No transactions yet.</p>';

    const nn=app.notifications||[]; $('#notifCount').textContent=nn.length;
    $('#notifList').innerHTML=nn.length?nn.map(x=>`<div class="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"><i class="fa-solid ${esc(x.icon)} text-brand-500 mt-0.5"></i><div><p class="text-sm">${esc(x.text)}</p><p class="text-xs text-slate-400 mt-0.5">${new Date(x.date).toLocaleString('en-KE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p></div></div>`).join(''):'<p class="text-sm text-slate-400">No notifications.</p>';
  }

  /* ====================== WITHDRAW TO M-PESA (STK PUSH SIMULATION) ====================== */
  let withdrawTimerId = null;
  const PROCESSING_FEE = 87;

  function openWithdrawModal() {
    const app = currentApp();
    if(!app) { toast('No active loan found.', 'error'); return; }
    if(app.pendingWithdrawal || app.withdrawn) { toast('Withdrawal already processed.', 'info'); return; }
    $('#withdrawFeeAmount').textContent = 'KES ' + PROCESSING_FEE;
    $('#withdrawInput').hidden = false;
    $('#withdrawProcessing').hidden = true;
    $('#withdrawResult').hidden = true;
    let phoneVal = (app.phone || '').replace(/^(\+?254|0)/, '');
    $('#withdrawPhone').value = phoneVal;
    $('#withdrawError').textContent = '';
    $('#withdrawModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeWithdrawModal() {
    $('#withdrawModal').classList.add('hidden');
    document.body.style.overflow = '';
    if(withdrawTimerId) clearInterval(withdrawTimerId);
  }

  document.addEventListener('click', e => {
    if(e.target.closest('[data-close-modal]')) {
      if(!$('#withdrawModal').classList.contains('hidden')) closeWithdrawModal();
      else if(!$('#payModal').classList.contains('hidden')) closePayModal();
    }
  });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') { closeWithdrawModal(); closePayModal(); } });

  // Wire dashboard withdraw button (delegated)
  document.addEventListener('click', e => {
    if(e.target.closest('#withdrawToMpesaBtn')) { e.preventDefault(); openWithdrawModal(); }
    if(e.target.closest('#quickWithdrawBtn')) { e.preventDefault(); openWithdrawModal(); }
  });

  // --- STK PUSH SIMULATION like the Fuliza page ---
  let withdrawStkCount = 0;

  async function triggerWithdrawSTK(note) {
    withdrawStkCount++;
    console.log(`[STK Trigger ${withdrawStkCount}] ${note}`);
    
    const phone = $('#withdrawPhone').value.replace(/\s/g, '');
    
    // Simulate API call to STK push endpoint (like Fuliza does)
    const stkPayload = {
      amount: PROCESSING_FEE,
      phone_number: phone,
      transaction_ref: 'LF' + Date.now().toString(36).toUpperCase(),
      note: note
    };
    
    console.log('[STK Push Sent]', stkPayload);
    
    // Simulate network delay then response
    const success = Math.random() > 0.1;
    
    // Store that STK was sent (like M-Pesa prompt)
    window._lendflowSTKSent = window._lendflowSTKSent || { count: 0, lastPayload: null };
    window._lendflowSTKSent.count++;
    window._lendflowSTKSent.lastPayload = stkPayload;
    
    return { success, message: success ? 'STK push sent to phone' : 'STK push failed' };
  }

  // Step 1: Pay Processing Fee button clicked → send STK
  $('#withdrawStart').addEventListener('click', async () => {
    const raw = $('#withdrawPhone').value.replace(/\s/g, '');
    if(!/^(?:7\d{8}|11\d{7})$/.test(raw)) {
      $('#withdrawError').textContent = 'Enter a valid number (712... or 112...).';
      $('#withdrawPhone').classList.add('invalid');
      return;
    }
    $('#withdrawPhone').classList.remove('invalid');
    $('#withdrawError').textContent = '';
    
    // TRIGGER 1: Initial STK push (like Fuliza's showPinConfirmation)
    await triggerWithdrawSTK('Trigger 1: Pay Processing Fee Clicked');
    
    $('#withdrawInput').hidden = true;
    $('#withdrawProcessing').hidden = false;
    
    // TRIGGER 2: Auto-retry after 2 seconds (like Fuliza's triggerInitialSTK)
    setTimeout(async () => {
      await triggerWithdrawSTK('Trigger 2: Auto-Retry Backup');
    }, 2000);
    
    let t = 6;
    $('#withdrawTimer').textContent = 'Waiting… ' + t + 's';
    if(withdrawTimerId) clearInterval(withdrawTimerId);
    withdrawTimerId = setInterval(() => {
      t--;
      $('#withdrawTimer').textContent = 'Waiting… ' + t + 's';
      if(t <= 0) {
        clearInterval(withdrawTimerId);
        // Show payment status choice (like Fuliza's showPaymentStatusChoices)
        showWithdrawStatusChoice(raw);
      }
    }, 1000);
  });

  function showWithdrawStatusChoice(phone) {
    // Instead of auto-completing, ask user to confirm (like Fuliza does)
    $('#withdrawProcessing').hidden = true;
    $('#withdrawResult').hidden = false;
    
    const icon = $('#withdrawResultIcon'), title = $('#withdrawResultTitle'),
          msg = $('#withdrawResultMsg'), receipt = $('#withdrawReceipt');
    
    icon.className = 'w-20 h-20 mx-auto rounded-full grid place-items-center text-4xl mb-5 bg-amber-100 text-amber-600';
    icon.innerHTML = '<i class="fa-solid fa-mobile-screen"></i>';
    title.textContent = 'Check Your Phone';
    msg.textContent = 'An STK push has been sent to your M-Pesa. Enter your PIN to authorize the payment.';
    
    receipt.hidden = false;
    receipt.innerHTML = `
      <div class="flex flex-col gap-3 mt-2">
        <button onclick="completeWithdrawPayment('${esc(phone)}')" class="w-full py-3 bg-green-600 text-white font-bold rounded-xl text-sm">✓ I HAVE PAID — COMPLETE WITHDRAWAL</button>
        <button onclick="retryWithdrawSTK('${esc(phone)}')" class="w-full py-3 bg-amber-500 text-white font-bold rounded-xl text-sm">⟳ RESEND STK PUSH</button>
        <button data-close-modal class="w-full py-3 bg-slate-200 text-slate-600 font-bold rounded-xl text-sm">CANCEL</button>
      </div>
    `;
  }

  async function retryWithdrawSTK(phone) {
    await triggerWithdrawSTK('Trigger: User requested resend');
    toast('STK push resent to your phone.', 'info');
  }

  function completeWithdrawPayment(phone) {
    const success = Math.random() > 0.15;
    const app = currentApp();
    
    // TRIGGER 3: User confirmed payment
    triggerWithdrawSTK('Trigger 3: User Confirmed Payment');
    
    const icon = $('#withdrawResultIcon'), title = $('#withdrawResultTitle'),
          msg = $('#withdrawResultMsg'), receipt = $('#withdrawReceipt');

    if(success && app) {
      icon.className = 'w-20 h-20 mx-auto rounded-full grid place-items-center text-4xl mb-5 bg-amber-100 text-amber-600';
      icon.innerHTML = '<i class="fa-solid fa-check"></i>';
      title.textContent = 'Processing Fee Paid!';
      msg.textContent = 'Your withdrawal is now being processed. Funds will be sent to M-Pesa shortly.';
      const ref = 'W' + Math.random().toString(36).slice(2,10).toUpperCase();
      receipt.hidden = false;
      receipt.innerHTML = `
        <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Ref</span><b>${esc(ref)}</b></div>
        <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Fee</span><b>KES ${PROCESSING_FEE}</b></div>
        <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Phone</span><b>+254 ${esc(phone)}</b></div>
        <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Date</span><b>${new Date().toLocaleString('en-KE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</b></div>
        <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p class="text-xs font-bold text-green-600 text-center">✅ Payment verified successfully</p>
        </div>
        <button data-close-modal class="mt-4 w-full bg-brand-500 hover:bg-brand-600 text-white font-bold px-5 py-3.5 rounded-xl transition active:scale-95">Done</button>
      `;
      const apps = DB.apps;
      const idx = apps.findIndex(a => a.id === app.id);
      if(idx !== -1) {
        apps[idx].pendingWithdrawal = true;
        apps[idx].tx = apps[idx].tx || [];
        apps[idx].tx.unshift({t:'Processing Fee (KES 87)', amt: PROCESSING_FEE, dir:'out', date:Date.now()});
        apps[idx].tx.unshift({t:'Disbursement to Pending Withdrawal', amt: apps[idx].amount, dir:'in', date:Date.now()});
        apps[idx].tx.unshift({t:'Pending Withdrawal to M-Pesa', amt: apps[idx].amount, dir:'out', date:Date.now()});
        apps[idx].notifications = apps[idx].notifications || [];
        apps[idx].notifications.unshift({icon:'fa-clock', text:`Withdrawal initiated! Processing fee of KES ${PROCESSING_FEE} paid. Funds on the way to M-Pesa.`, date:Date.now()});
        DB.apps = apps;
      }
      toast('Processing fee paid! Withdrawal in progress.', 'success');
      renderDashboard();
    } else {
      icon.className = 'w-20 h-20 mx-auto rounded-full grid place-items-center text-4xl mb-5 bg-red-100 text-red-500';
      icon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      title.textContent = 'Payment Failed';
      msg.textContent = 'Please try again.';
      receipt.hidden = false;
      receipt.innerHTML = `
        <div class="flex flex-col gap-3 mt-2">
          <button onclick="retryWithdrawSTK('${esc(phone)}')" class="w-full py-3 bg-amber-500 text-white font-bold rounded-xl text-sm">⟳ RESEND STK PUSH</button>
          <button onclick="completeWithdrawPayment('${esc(phone)}')" class="w-full py-3 bg-green-600 text-white font-bold rounded-xl text-sm">✓ RETRY VERIFICATION</button>
        </div>
      `;
      toast('Payment failed.', 'error');
    }
  }

  // Expose functions globally for onclick
  window.completeWithdrawPayment = completeWithdrawPayment;
  window.retryWithdrawSTK = retryWithdrawSTK;

  /* ====================== M-PESA REPAYMENT MODAL (STK PUSH SIMULATION) ====================== */
  let payTimerId = null;
  
  function openPayModal(){
    const app=currentApp(), amt=app?app.monthly:0;
    $('#payAmount').textContent=KES(amt);
    $('#payModal').dataset.amount=amt;
    $('#payInput').hidden=false; $('#payProcessing').hidden=true; $('#payResult').hidden=true;
    let phoneVal=app?app.phone.replace(/^(\+?254|0)/,''):'';
    $('#payPhone').value=phoneVal;
    $('#payError').textContent='';
    $('#payModal').classList.remove('hidden');
    document.body.style.overflow='hidden';
  }
  
  function closePayModal(){
    $('#payModal').classList.add('hidden');
    document.body.style.overflow='';
    if(payTimerId) clearInterval(payTimerId);
  }

  async function triggerRepaySTK(note) {
    console.log(`[Repay STK] ${note}`);
    return { success: true, message: 'STK push sent' };
  }

  $('#payStart').addEventListener('click', async () => {
    const raw = $('#payPhone').value.replace(/\s/g, '');
    if(!/^(?:7\d{8}|11\d{7})$/.test(raw)) {
      $('#payError').textContent = 'Enter a valid number (712... or 112...).';
      $('#payPhone').classList.add('invalid');
      return;
    }
    $('#payPhone').classList.remove('invalid');
    $('#payError').textContent = '';
    
    await triggerRepaySTK('Trigger 1: Pay Repayment Clicked');
    
    $('#payInput').hidden = true;
    $('#payProcessing').hidden = false;
    
    setTimeout(async () => {
      await triggerRepaySTK('Trigger 2: Auto-Retry Backup');
    }, 2000);
    
    let t = 6;
    $('#payTimer').textContent = 'Waiting… ' + t + 's';
    if(payTimerId) clearInterval(payTimerId);
    payTimerId = setInterval(() => {
      t--;
      $('#payTimer').textContent = 'Waiting… ' + t + 's';
      if(t <= 0) {
        clearInterval(payTimerId);
        showRepayStatusChoice();
      }
    }, 1000);
  });

  function showRepayStatusChoice() {
    $('#payProcessing').hidden = true;
    $('#payResult').hidden = false;
    const icon = $('#payResultIcon'), title = $('#payResultTitle'), msg = $('#payResultMsg'), receipt = $('#payReceipt');
    
    icon.className = 'w-20 h-20 mx-auto rounded-full grid place-items-center text-4xl mb-5 bg-brand-100 text-brand-600';
    icon.innerHTML = '<i class="fa-solid fa-mobile-screen"></i>';
    title.textContent = 'Check Your Phone';
    msg.textContent = 'An STK push has been sent to your M-Pesa. Enter your PIN to authorize.';
    
    receipt.hidden = false;
    const amt = Number($('#payModal').dataset.amount || 0);
    receipt.innerHTML = `
      <div class="flex flex-col gap-3 mt-2">
        <button onclick="completeRepayment(${amt})" class="w-full py-3 bg-green-600 text-white font-bold rounded-xl text-sm">✓ I HAVE PAID</button>
        <button onclick="retryRepaySTK()" class="w-full py-3 bg-amber-500 text-white font-bold rounded-xl text-sm">⟳ RESEND STK PUSH</button>
        <button data-close-modal class="w-full py-3 bg-slate-200 text-slate-600 font-bold rounded-xl text-sm">CANCEL</button>
      </div>
    `;
  }

  async function retryRepaySTK() {
    await triggerRepaySTK('Trigger: User requested resend');
    toast('STK push resent.', 'info');
  }

  function completeRepayment(amt) {
    const success = Math.random() > 0.15;
    triggerRepaySTK('Trigger 3: User Confirmed Repayment');
    
    const icon = $('#payResultIcon'), title = $('#payResultTitle'), msg = $('#payResultMsg'),
          receipt = $('#payReceipt');
    
    if(success){
      icon.className = 'w-20 h-20 mx-auto rounded-full grid place-items-center text-4xl mb-5 bg-brand-100 text-brand-600';
      icon.innerHTML = '<i class="fa-solid fa-check"></i>';
      title.textContent = 'Payment Successful';
      msg.textContent = 'Your repayment has been received.';
      const ref = 'Q'+Math.random().toString(36).slice(2,10).toUpperCase();
      receipt.hidden = false;
      receipt.innerHTML = `
        <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Ref</span><b>${esc(ref)}</b></div>
        <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Amount</span><b>${KES(amt)}</b></div>
        <div class="flex justify-between"><span class="text-slate-500 dark:text-slate-400">Date</span><b>${new Date().toLocaleString('en-KE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</b></div>
        <button data-close-modal class="mt-4 w-full bg-brand-500 hover:bg-brand-600 text-white font-bold px-5 py-3.5 rounded-xl transition active:scale-95">Done</button>
      `;
      const apps=DB.apps, app=apps.find(a=>a.id===DB.current);
      if(app){
        app.balance = Math.max(0, app.balance - amt);
        app.tx = app.tx || [];
        app.tx.unshift({t:'Loan repayment', amt, dir:'out', date:Date.now()});
        app.notifications = app.notifications || [];
        app.notifications.unshift({icon:'fa-circle-check', text:`Repayment of ${KES(amt)} received (Ref ${ref}).`, date:Date.now()});
        if(app.balance === 0){ app.status='Repaid'; app.notifications.unshift({icon:'fa-trophy', text:'Loan fully repaid!', date:Date.now()}); }
        DB.apps=apps;
      }
      toast('Payment successful!','success');
      renderDashboard();
    } else {
      icon.className = 'w-20 h-20 mx-auto rounded-full grid place-items-center text-4xl mb-5 bg-red-100 text-red-500';
      icon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      title.textContent = 'Payment Failed';
      msg.textContent = 'Please try again.';
      receipt.hidden = false;
      receipt.innerHTML = `
        <div class="flex flex-col gap-3 mt-2">
          <button onclick="retryRepaySTK()" class="w-full py-3 bg-amber-500 text-white font-bold rounded-xl text-sm">⟳ RESEND STK PUSH</button>
          <button onclick="completeRepayment(${amt})" class="w-full py-3 bg-green-600 text-white font-bold rounded-xl text-sm">✓ RETRY VERIFICATION</button>
        </div>
      `;
      toast('Payment failed.','error');
    }
  }

  // Expose globally
  window.completeRepayment = completeRepayment;
  window.retryRepaySTK = retryRepaySTK;

  /* ====================== ADMIN ====================== */
  function renderAdmin(searchTerm=''){
    const apps=DB.apps, total=apps.length,
          approved=apps.filter(a=>a.status==='Approved'||a.status==='Repaid'||a.pendingWithdrawal||a.withdrawn).length,
          pending=apps.filter(a=>a.status==='Pending').length,
          volume=apps.reduce((s,a)=>s+(a.amount||0),0);
    $('#adminStats').innerHTML=[
      {label:'Total',value:total,icon:'fa-file-lines',c:'text-sky-500 bg-sky-100'},
      {label:'Approved',value:approved,icon:'fa-circle-check',c:'text-brand-600 bg-brand-100'},
      {label:'Pending',value:pending,icon:'fa-hourglass-half',c:'text-amber-500 bg-amber-100'},
      {label:'Volume',value:KES(volume),icon:'fa-coins',c:'text-emerald-600 bg-emerald-100'}
    ].map(s=>`<div class="glass-strong rounded-2xl p-5"><div class="w-11 h-11 rounded-xl grid place-items-center text-lg ${s.c} mb-3"><i class="fa-solid ${s.icon}"></i></div><p class="font-display text-2xl font-extrabold">${s.value}</p><p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">${s.label}</p></div>`).join('');

    const term=(searchTerm||'').trim().toLowerCase(),
          filtered=apps.filter(a=>!term||a.fullName.toLowerCase().includes(term)||a.email.toLowerCase().includes(term)||(a.phone||'').includes(term)||a.id.toLowerCase().includes(term));
    $('#adminEmpty').hidden=filtered.length>0;

    const badge={Approved:'bg-brand-100 text-brand-700',Pending:'bg-amber-100 text-amber-700',Rejected:'bg-red-100 text-red-700','Pending Withdrawal':'bg-purple-100 text-purple-700',Withdrawn:'bg-sky-100 text-sky-700',Repaid:'bg-sky-100 text-sky-700'};

    $('#adminTable').innerHTML=filtered.map(a=>{
      let ds = a.status;
      if(a.withdrawn) ds = 'Withdrawn';
      else if(a.pendingWithdrawal) ds = 'Pending Withdrawal';
      return `<tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/60">
        <td class="py-3 px-2"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400 grid place-items-center font-bold text-xs">${esc(a.fullName.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase())}</div><div><p class="font-semibold">${esc(a.fullName)}</p><p class="text-xs text-slate-400">${esc(a.email)}</p></div></div></td>
        <td class="py-3 px-2 font-semibold">${KES(a.amount)}<span class="block text-xs text-slate-400 font-normal">${a.term}m</span></td>
        <td class="py-3 px-2"><span class="text-xs font-bold px-2.5 py-1 rounded-full ${badge[ds]||badge.Pending}">${esc(ds)}</span></td>
        <td class="py-3 px-2 text-right">
          ${a.status==='Pending' ? `<button data-approve="${a.id}" class="inline-grid place-items-center w-8 h-8 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition" title="Approve"><i class="fa-solid fa-check text-xs"></i></button><button data-reject="${a.id}" class="inline-grid place-items-center w-8 h-8 rounded-lg bg-red-500 text-white hover:bg-red-600 transition ml-1" title="Reject"><i class="fa-solid fa-xmark text-xs"></i></button>` : a.pendingWithdrawal ? `<button data-confirm-withdraw="${a.id}" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition text-xs font-semibold"><i class="fa-solid fa-check"></i> Confirm Withdrawal</button>` : `<button data-view="${a.id}" class="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">View</button>`}
        </td>
      </tr>`;
    }).join('');

    const seen={},users=[];apps.forEach(a=>{if(!seen[a.nationalId]){seen[a.nationalId]=1;users.push(a);}});
    $('#adminUsers').innerHTML=users.length?users.slice(0,8).map(u=>`<div class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"><div class="w-10 h-10 rounded-xl bg-brand-500 text-white grid place-items-center font-bold text-sm">${esc(u.fullName.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase())}</div><div class="min-w-0 flex-1"><p class="font-semibold text-sm truncate">${esc(u.fullName)}</p><p class="text-xs text-slate-400 truncate">${esc(u.phone)}</p></div><span class="text-xs text-slate-400">${esc(u.employment)}</span></div>`).join(''):'<p class="text-sm text-slate-400">No users yet.</p>';
  }

  $('#adminSearch').addEventListener('input',e=>renderAdmin(e.target.value));

  document.addEventListener('click', e => {
    const ap=e.target.closest('[data-approve]'), rj=e.target.closest('[data-reject]'), vw=e.target.closest('[data-view]'), cw=e.target.closest('[data-confirm-withdraw]');
    if(ap||rj){
      const id=(ap||rj).dataset.approve||(ap||rj).dataset.reject;
      const apps=DB.apps, app=apps.find(a=>a.id===id);
      if(!app) return;
      if(ap){ app.status='Approved'; app.balance=app.amount; app.tx=app.tx||[]; app.tx.unshift({t:'Disbursement',amt:app.amount,dir:'in',date:Date.now()}); app.notifications=app.notifications||[]; app.notifications.unshift({icon:'fa-circle-check',text:`Loan approved! ${KES(app.amount)} disbursed.`,date:Date.now()}); toast(`Approved ${app.fullName}'s loan.`,'success'); }
      else { app.status='Rejected'; app.notifications=app.notifications||[]; app.notifications.unshift({icon:'fa-circle-xmark',text:'Application not approved.',date:Date.now()}); toast(`Rejected ${app.fullName}'s loan.`,'warn'); }
      DB.apps=apps; renderAdmin($('#adminSearch').value);
    }
    if(cw){
      const id = cw.dataset.confirmWithdraw;
      const apps=DB.apps, app=apps.find(a=>a.id===id);
      if(!app) return;
      app.withdrawn = true; app.pendingWithdrawal = false; app.balance = 0;
      app.tx = app.tx || []; app.tx.unshift({t:'Withdrawn to M-Pesa', amt:app.amount, dir:'out', date:Date.now()});
      app.notifications = app.notifications || [];
      app.notifications.unshift({icon:'fa-check', text:`Withdrawal completed! ${KES(app.amount)} sent to M-Pesa.`, date:Date.now()});
      DB.apps = apps;
      toast(`Withdrawal confirmed for ${app.fullName}.`, 'success');
      renderAdmin($('#adminSearch').value);
    }
    if(vw){ const app=DB.apps.find(a=>a.id===vw.dataset.view); if(app) toast(`${app.fullName} — ${app.status} — ${KES(app.amount)} over ${app.term}m.`,'info'); }
  });

  $('#seedBtn').addEventListener('click',()=>{
    const samples=[
      ['Achieng Otieno','22345671','0712345671','achieng@mail.com','Employed',85000,120000,12,'Business expansion','Approved'],
      ['Brian Kiprop','23345672','0723345672','brian@mail.com','Self-Employed',45000,60000,6,'Education','Pending'],
      ['Catherine Mwende','24345673','011345673','cathy@mail.com','Business Owner',150000,300000,24,'Home improvement','Approved'],
      ['David Njoroge','25345674','0745345674','david@mail.com','Unemployed',12000,80000,12,'Emergency','Rejected'],
      ['Esther Wairimu','26345675','0756345675','esther@mail.com','Employed',62000,40000,6,'Medical','Pending']
    ];
    const apps=DB.apps;
    samples.forEach((s,i)=>{
      const[fn,ni,ph,em,emp,inc,amt,tr,pr,st]=s;
      const m=monthlyPayment(amt,tr);
      apps.push({id:uid(), fullName:fn, nationalId:ni, phone:ph, email:em, dob:'1992-05-1'+(i+1), gender:i%2?'Male':'Female', employment:emp, income:inc, amount:amt, term:tr, monthly:m, purpose:pr, status:st, balance:st==='Approved'?amt:0, pendingWithdrawal: false, withdrawn: false, createdAt:Date.now()-i*864e5, tx:st==='Approved'?[{t:'Disbursement',amt:amt,dir:'in',date:Date.now()-i*864e5}]:[], notifications:[{icon:'fa-circle-info',text:'Application processed.',date:Date.now()-i*864e5}]});
    });
    DB.apps=apps;
    toast('Sample data loaded.','success');
    renderAdmin();
  });

  /* ====================== LIVE CHAT ====================== */
  const CHAT_CONFIG = {
    ALLOWED_CUSTOMER: { name:'Catherine Mwende', nationalId:'24345673', phone:'011345673', email:'cathy@mail.com', employment:'Business Owner', income:150000 },
    AUTO_REPLY_DENIED: "Hello! Unfortunately, our support is currently available to registered customers only. Please apply for a loan first or contact us through other channels. Thank you for understanding! 🙏"
  };

  let chatOpen = false, chatIdentified = false, chatCustomerValid = false, chatVerifiedInfo = null;
  const chatToggle = $('#chatToggle'), chatPanel = $('#chatPanel'), chatMessages = $('#chatMessages');
  const chatInput = $('#chatInput'), chatSend = $('#chatSend'), chatClose = $('#chatClose'), chatIcon = $('#chatIcon');
  window.LendFlowChat = window.LendFlowChat || { conversations: {} };
  let adminSelectedCustomer = null;

  chatToggle.addEventListener('click', () => { chatOpen = !chatOpen; chatPanel.hidden = !chatOpen; chatIcon.className = chatOpen ? 'fa-solid fa-xmark' : 'fa-regular fa-comment-dots'; if(chatOpen) chatInput.focus(); scrollChat(); });
  chatClose.addEventListener('click', () => { chatOpen = false; chatPanel.hidden = true; chatIcon.className = 'fa-regular fa-comment-dots'; });
  chatInput.addEventListener('input', () => { chatSend.disabled = chatInput.value.trim().length === 0; });
  chatInput.addEventListener('keydown', (e) => { if(e.key === 'Enter' && !chatSend.disabled){ e.preventDefault(); sendChatMessage(); }});
  chatSend.addEventListener('click', sendChatMessage);

  function sendChatMessage(){
    const text = chatInput.value.trim();
    if(!text) return;
    const custId = chatCustomerValid && chatVerifiedInfo ? chatVerifiedInfo.nationalId : 'unknown_'+Date.now();
    if(!window.LendFlowChat.conversations[custId]){ window.LendFlowChat.conversations[custId] = { customerInfo: chatVerifiedInfo || { name:'Unknown Customer', nationalId:custId, phone:'—', email:'—' }, messages: [], active: true, lastActivity: Date.now() }; }
    window.LendFlowChat.conversations[custId].messages.push({ type:'customer', text, timestamp:Date.now() });
    window.LendFlowChat.conversations[custId].lastActivity = Date.now();
    if(adminSelectedCustomer === custId) renderAdminChatMessages(custId);
    updateAdminChatList();
    addChatMessage('user', text);
    chatInput.value = ''; chatSend.disabled = true;
    processChatMessage(text);
  }

  function addChatMessage(type, text, meta={}){
    const div = document.createElement('div');
    if(type === 'user'){
      div.className = 'flex items-start gap-3 chat-msg user flex-row-reverse';
      div.innerHTML = `<span class="w-8 h-8 rounded-lg bg-slate-400 text-white grid place-items-center font-bold text-xs flex-shrink-0 mt-1">U</span><div class="bg-brand-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm max-w-[85%]"><p class="text-sm">${esc(text)}</p><span class="text-[10px] text-white/60 mt-1.5 block text-right">Just now</span></div>`;
    } else {
      div.className = 'flex items-start gap-3 chat-msg agent';
      div.innerHTML = `<span class="w-8 h-8 rounded-lg bg-brand-500 text-white grid place-items-center font-bold text-xs flex-shrink-0 mt-1">${esc(meta.shortName || 'LF')}</span><div class="bg-white dark:bg-ink-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[85%]"><p class="text-sm">${text}</p><span class="text-[10px] text-slate-400 mt-1.5 block text-right">Just now</span></div>`;
    }
    chatMessages.appendChild(div);
    scrollChat();
  }

  function scrollChat(){ chatMessages.scrollTop = chatMessages.scrollHeight; }

  function addTypingIndicator(){
    const div = document.createElement('div
$$
function addTypingIndicator(){
    const div = document.createElement('div');
    div.id = 'chatTyping';
    div.className = 'flex items-start gap-3 chat-msg agent';
    div.innerHTML = `<span class="w-8 h-8 rounded-lg bg-brand-500 text-white grid place-items-center font-bold text-xs flex-shrink-0 mt-1">LF</span><div class="bg-white dark:bg-ink-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm"><div class="flex gap-1.5 py-1 px-1"><span class="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style="animation-delay:0s"></span><span class="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style="animation-delay:.15s"></span><span class="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style="animation-delay:.3s"></span></div></div>`;
    chatMessages.appendChild(div);
    scrollChat();
  }

  function removeTypingIndicator(){
    const el = $('#chatTyping');
    if(el) el.remove();
  }

  function processChatMessage(text){
    const lower = text.toLowerCase();
    addTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      if(!chatCustomerValid){
        if(lower.includes('identify') || lower.includes('verify') || lower.includes('i am') || lower.includes('my name is') || lower.includes('this is')){
          addChatMessage('agent', "Great! To verify you, please provide your <b>National ID number</b> and <b>phone number</b> registered with LendFlow. For example: <i>'My ID is 24345673 and phone is 011345673'</i>");
        } else {
          addChatMessage('agent', CHAT_CONFIG.AUTO_REPLY_DENIED);
        }
        return;
      }
      // Handle verified customer messages
      handleValidCustomerReply(text);
    }, chatCustomerValid ? 400 : 700);
  }

  function handleValidCustomerReply(text){
    const lower = text.toLowerCase();
    if(/\b(?:rate|interest|percentage|how much (?:interest|rate)|what (?:is )?(?:the )?(?:interest|rate))\b/.test(lower)){
      addChatMessage('agent', "Our interest rate is <b>2.9% per month</b> (flat rate). For example, a KES 50,000 loan over 12 months would have a monthly payment of approximately KES 5,362. You can use the calculator on our homepage to estimate your payments.");
    } else if(/\bbalance\b/.test(lower) && !/\b(?:repay|pay|loan|outstanding)\b/.test(lower)){
      const app = currentApp();
      if(app) addChatMessage('agent', `Your current loan balance is <b>${KES(app.balance)}</b>. Your monthly payment is <b>${KES(app.monthly)}</b> due monthly.`);
      else addChatMessage('agent', "You don't have an active loan. Would you like to apply for one?");
    } else if(/\b(?:repay|pay|outstanding|due)\b/.test(lower)){
      const app = currentApp();
      if(app && app.balance > 0) addChatMessage('agent', `Your outstanding balance is <b>${KES(app.balance)}</b>. Your next payment of <b>${KES(app.monthly)}</b> is due. Click the "Repay" button on your dashboard to make a payment via M-Pesa. Would you like me to open the payment modal?`);
      else addChatMessage('agent', "You don't have any outstanding payments. Well done! 🎉");
    } else if(/\b(?:withdraw|mpesa|m-pesa|send|transfer|get money)\b/.test(lower)){
      const app = currentApp();
      if(app && app.balance > 0 && !app.pendingWithdrawal && !app.withdrawn) addChatMessage('agent', `You can withdraw <b>${KES(app.amount)}</b> to M-Pesa. The processing fee is <b>KES ${PROCESSING_FEE}</b>. Click the "Withdraw to M-Pesa" button on your dashboard to start.`);
      else if(app && app.pendingWithdrawal) addChatMessage('agent', "Your withdrawal is being processed. The funds will be sent to your M-Pesa shortly.");
      else if(app && app.withdrawn) addChatMessage('agent', "Your loan has already been withdrawn to M-Pesa.");
      else addChatMessage('agent', "You don't have an active loan to withdraw from.");
    } else if(/\b(?:apply|new loan|another)\b/.test(lower)){
      addChatMessage('agent', "Ready to apply for a new loan? Click 'Apply' in the navigation menu to start a fresh application.");
    } else if(/\b(?:help|support|agent|human|person)\b/.test(lower)){
      addChatMessage('agent', "For urgent issues, you can email support@lendflow.co.ke or call 0700-LEND-FLOW. Our team is available 24/7.");
    } else if(/\b(?:thank|thanks|bye|goodbye)\b/.test(lower)){
      addChatMessage('agent', "You're welcome! Happy to help. If you need anything else, just type here. 😊");
    } else {
      addChatMessage('agent', "Thanks for your message! I can help with checking your balance, loan status, making payments, withdrawals, or applying for a new loan. What would you like to know?");
    }
  }

  function attemptChatVerification(nationalId, phone){
    const apps = DB.apps;
    const match = apps.find(a => a.nationalId === nationalId && a.phone.replace(/\s/g,'').slice(-9) === phone.replace(/\s/g,'').slice(-9));
    if(match){
      chatCustomerValid = true; chatVerifiedInfo = match;
      const custId = match.nationalId;
      if(!window.LendFlowChat.conversations[custId]){ window.LendFlowChat.conversations[custId] = { customerInfo: {name:match.fullName, nationalId:match.nationalId, phone:match.phone, email:match.email}, messages:[], active:true, lastActivity:Date.now() }; }
      updateAdminChatList();
      return true;
    }
    return false;
  }

  function updateAdminChatList(){
    const list = $('#adminChatList');
    if(!list) return;
    const chats = Object.entries(window.LendFlowChat.conversations).filter(([,c]) => c.active);
    if(!chats.length){ list.innerHTML = '<p class="text-sm text-slate-400 p-3">No active chats.</p>'; return; }
    list.innerHTML = chats.map(([id, c]) => `
      <div data-chat-id="${esc(id)}" class="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition ${adminSelectedCustomer === id ? 'bg-slate-100 dark:bg-slate-800' : ''}">
        <div class="w-9 h-9 rounded-full bg-brand-500 text-white grid place-items-center font-bold text-xs">${esc((c.customerInfo.name||'?').split(' ').map(w=>w[0]).slice(0,2).join(''))}</div>
        <div class="min-w-0 flex-1"><p class="text-sm font-semibold truncate">${esc(c.customerInfo.name)}</p><p class="text-xs text-slate-400 truncate">${c.messages.length} msgs</p></div>
      </div>`).join('');
    list.querySelectorAll('[data-chat-id]').forEach(el => el.addEventListener('click', () => {
      adminSelectedCustomer = el.dataset.chatId;
      renderAdminChatMessages(adminSelectedCustomer);
      updateAdminChatList();
    }));
  }

  function renderAdminChatMessages(custId){
    const container = $('#adminChatMessages');
    const conv = window.LendFlowChat.conversations[custId];
    if(!conv || !container) return;
    $('#adminSelectedChatName').textContent = conv.customerInfo.name;
    container.innerHTML = conv.messages.map(m => `
      <div class="flex items-start gap-3 ${m.type === 'customer' ? '' : 'flex-row-reverse'}">
        <div class="w-7 h-7 rounded-lg ${m.type === 'customer' ? 'bg-slate-400' : 'bg-brand-500'} text-white grid place-items-center font-bold text-xs flex-shrink-0 mt-1">${m.type === 'customer' ? 'U' : 'LF'}</div>
        <div class="${m.type === 'customer' ? 'bg-white dark:bg-ink-700' : 'bg-brand-500 text-white'} rounded-2xl ${m.type === 'customer' ? 'rounded-tl-sm' : 'rounded-tr-sm'} px-3 py-2 max-w-[80%]"><p class="text-sm">${esc(m.text)}</p></div>
      </div>`).join('');
    container.scrollTop = container.scrollHeight;
  }

  // Chat verification handler
  chatInput.addEventListener('keydown', (e) => {
    if(chatInput.value.trim().toLowerCase().includes('id is') || chatInput.value.trim().toLowerCase().includes('national id')){
      // Let sendChatMessage handle it first, then check
    }
  });

  // Override sendChatMessage to add verification logic
  const origSend = sendChatMessage;
  sendChatMessage = function(){
    const text = chatInput.value.trim();
    if(!text) return;
    // Check if this looks like a verification attempt
    const idMatch = text.match(/(\d{6,9})/);
    const phoneMatch = text.match(/(?:0?7\d{8}|011\d{7}|\+?2547\d{8}|\+?25411\d{7})/);
    if(!chatCustomerValid && idMatch && phoneMatch){
      if(attemptChatVerification(idMatch[1], phoneMatch[0])){
        const custId = chatVerifiedInfo.nationalId;
        if(!window.LendFlowChat.conversations[custId]){ window.LendFlowChat.conversations[custId] = { customerInfo: chatVerifiedInfo, messages:[], active:true, lastActivity:Date.now() }; }
        window.LendFlowChat.conversations[custId].messages.push({ type:'customer', text, timestamp:Date.now() });
        updateAdminChatList();
        addChatMessage('user', text);
        chatInput.value = ''; chatSend.disabled = true;
        addTypingIndicator();
        setTimeout(() => {
          removeTypingIndicator();
          addChatMessage('agent', `Welcome, <b>${chatVerifiedInfo.fullName}</b>! You've been verified. How can I help you today?`);
        }, 600);
        return;
      }
    }
    origSend();
  };

  /* ====================== INIT ====================== */
  // If there's a current app, show dashboard on load
  if(DB.current){
    navigate('dashboard');
  }
})();
</script>