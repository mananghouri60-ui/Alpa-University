/* ---------- Data ---------- */
const DEPTS = [
  { id:'ai', name:'Artificial Intelligence', main:true, text:'Neural networks, intelligent agents and modern AI systems.', teacher:'Muneeb ur Rehman' },
  { id:'ml', name:'Machine Learning', main:true, text:'Train models that learn from data, from regression to deep learning.', teacher:'Muhammad Waqar' },
  { id:'ds', name:'Data Science', main:true, text:'Collect, clean, analyse and visualise data to find answers.' },
  { id:'robotics', name:'Robotics', main:true, text:'Build and train robots using machine learning.' },
  { id:'se', name:'Software Engineering', text:'Design, build, test and ship reliable software.' },
  { id:'web', name:'Web Development', text:'Create fast, modern websites and web apps.', teacher:'Umer' },
  { id:'python', name:'Python Programming', text:'The core language of AI, from basics to real projects.', teacher:'Muhammad Ali' },
  { id:'hrm', name:'Human Resource Management', text:'People, hiring and organisations in the age of AI.', teacher:'Moheeb' },
  { id:'bba', name:'BBA', text:'Business administration, finance and marketing foundations.' },
  { id:'english', name:'English', text:'Communication, writing and presentation skills.' },
  { id:'pak', name:'Pak Studies', text:'History, culture and constitution of Pakistan.' },
  { id:'physics', name:'Physics', text:'Mechanics, electricity and the science behind hardware.' },
  { id:'chem', name:'Chemistry', text:'Core chemistry for science and research programs.' },
  { id:'botany', name:'Botany', text:'Plant science, including data-driven agriculture.' },
];
const FACULTY = [
  ['Muhammad Ali','Python Programming'], ['Umer','Web Development'], ['Muneeb ur Rehman','Artificial Intelligence'],
  ['Muhammad Waqar','Machine Learning'], ['Moheeb','Human Resource Management'], ['Hamza','Faculty member'],
  ['Adnan','Faculty member'], ['Ahmad','Faculty member'],
];

/* ---------- Render departments & faculty ---------- */
document.getElementById('deptGrid').innerHTML = DEPTS.map(d => `
  <article id="dept-${d.id}" class="dept ${d.main ? 'main' : ''}">
    ${d.main ? '<span class="badge">Main focus</span>' : ''}
    <h3 class="h3">${d.name}</h3>
    <p class="mt-2 text-sm text-slate-600">${d.text}</p>
    ${d.teacher ? `<p class="mt-3 text-xs text-slate-500">Taught by ${d.teacher}</p>` : ''}
  </article>`).join('');

document.getElementById('facultyGrid').innerHTML = FACULTY.map(([n, s]) => `
  <article class="fac">
    <div class="avatar">${n.split(' ').map(w => w[0]).slice(0,2).join('')}</div>
    <h3 class="font-display font-semibold mt-4">${n}</h3>
    <p class="text-cyan text-sm">${s}</p>
    <p class="text-white/60 text-xs mt-2">Master's / PhD qualified &middot; experienced teacher</p>
  </article>`).join('');

const sel = document.querySelector('select[name=program]');
DEPTS.forEach(d => sel.insertAdjacentHTML('beforeend', `<option>${d.name}</option>`));

/* ---------- Sidebar (mobile) + active link ---------- */
const sidebar = document.getElementById('sidebar'), scrim = document.getElementById('scrim');
const toggleMenu = open => { sidebar.classList.toggle('open', open); scrim.classList.toggle('hidden', !open); };
document.getElementById('menuBtn').onclick = () => toggleMenu(true);
scrim.onclick = () => toggleMenu(false);
document.querySelectorAll('.nav-link').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

const links = [...document.querySelectorAll('.nav-link')];
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-30% 0px -60% 0px' });
links.forEach(l => { const t = document.querySelector(l.getAttribute('href')); if (t) io.observe(t); });

/* ---------- Hero neural network animation ---------- */
(function () {
  const c = document.getElementById('neural'), x = c.getContext('2d');
  const layers = [4, 6, 6, 3]; let nodes = [], t = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function layout() {
    c.width = c.offsetWidth * devicePixelRatio; c.height = c.offsetHeight * devicePixelRatio;
    const W = c.width, H = c.height, left = W * 0.52, span = W * 0.44;
    nodes = layers.map((n, li) => Array.from({ length: n }, (_, i) => ({
      x: left + span * li / (layers.length - 1), y: H * 0.18 + (H * 0.64) * (i + .5) / n, p: Math.random() * 6 })));
  }
  function draw() {
    x.clearRect(0, 0, c.width, c.height); t += 0.02;
    for (let l = 0; l < nodes.length - 1; l++) for (const a of nodes[l]) for (const b of nodes[l + 1]) {
      const k = (Math.sin(t + a.p + b.p) + 1) / 2;
      x.strokeStyle = `rgba(31,209,224,${0.06 + k * 0.22})`; x.lineWidth = devicePixelRatio;
      x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
    }
    nodes.flat().forEach(n => {
      const k = (Math.sin(t * 1.5 + n.p) + 1) / 2;
      x.fillStyle = `rgba(${108 + k * 100 | 0},${77 + k * 130 | 0},255,${0.6 + k * 0.4})`;
      x.beginPath(); x.arc(n.x, n.y, (5 + k * 3) * devicePixelRatio, 0, 7); x.fill();
    });
    if (!reduce) requestAnimationFrame(draw);
  }
  layout(); draw(); addEventListener('resize', () => { layout(); if (reduce) draw(); });
})();

/* ---------- Admission form ---------- */
const form = document.getElementById('applyForm'), msg = document.getElementById('formMsg');
const pct = document.getElementById('pct'), pctNote = document.getElementById('pctNote');
function updatePct() {
  const t = +form.totalMarks.value, o = +form.obtainedMarks.value;
  if (!t || form.obtainedMarks.value === '') { pct.textContent = '–'; pctNote.textContent = ''; return; }
  const p = o / t * 100; pct.textContent = p.toFixed(2) + '%';
  const aiml = /artificial|machine/i.test(form.program.value), need = aiml ? 80 : 65;
  pctNote.textContent = p >= need ? `Meets the ${need}% requirement for this program.` : `Below the ${need}% requirement. Selection depends on your qualification.`;
}
['totalMarks', 'obtainedMarks', 'program'].forEach(n => form[n].addEventListener('input', updatePct));

form.addEventListener('submit', async e => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('[required]').forEach(el => { const bad = el.type === 'checkbox' ? !el.checked : !el.value.trim(); el.classList.toggle('bad', bad); if (bad) ok = false; });
  const show = (text, good) => { msg.className = 'rounded-xl p-4 text-sm ' + (good ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'); msg.textContent = text; msg.classList.remove('hidden'); };
  if (!ok) return show('Please fill all required fields (marked in red) and accept the declaration.', false);
  try {
    const r = await fetch('/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const d = await r.json();
    if (!d.ok) return show(d.error || 'Could not submit. Please try again.', false);
    show(`Application submitted. Reference number: ${d.ref}. ${d.message}`, true);
    form.reset(); updatePct();
  } catch { show('Could not reach the server. Make sure it is running (npm start).', false); }
});

/* ---------- Chat widget ---------- */
const box = document.getElementById('chatBox'), log = document.getElementById('chatLog'), input = document.getElementById('chatInput');
const history = [];
const add = (text, who) => { const d = document.createElement('div'); d.className = 'msg ' + who; d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
const openChat = open => { box.classList.toggle('hidden', !open); if (open) { if (!log.children.length) add('Hello! I am the Alpa University assistant. Ask me about departments, fees, hostel, teachers or admission.', 'bot'); input.focus(); } };
document.getElementById('chatToggle').onclick = () => openChat(box.classList.contains('hidden'));
document.getElementById('chatClose').onclick = () => openChat(false);

const SUGGEST = ['Semester fee?', 'Hostel details', 'Selection criteria', 'Required documents', 'Who teaches AI?'];
document.getElementById('chips').innerHTML = SUGGEST.map(s => `<button type="button" class="sugg">${s}</button>`).join('');
document.getElementById('chips').addEventListener('click', e => { if (e.target.classList.contains('sugg')) send(e.target.textContent); });

async function send(text) {
  text = text.trim(); if (!text) return;
  add(text, 'user'); input.value = '';
  const typing = add('', 'bot'); typing.innerHTML = '<span class="dots"><span></span><span></span><span></span></span>';
  try {
    const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history }) });
    const d = await r.json();
    typing.textContent = d.reply;
    history.push({ role: 'user', content: text }, { role: 'assistant', content: d.reply });
  } catch { typing.textContent = 'I cannot connect to the server right now. Please try again.'; }
  log.scrollTop = log.scrollHeight;
}
document.getElementById('chatForm').addEventListener('submit', e => { e.preventDefault(); send(input.value); });
