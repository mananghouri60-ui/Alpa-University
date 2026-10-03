const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
// Free, key-less, OpenAI-compatible endpoint (Pollinations). Override with env vars if you prefer another free API.
const AI_URL = process.env.AI_URL || 'https://text.pollinations.ai/openai';
const AI_KEY = process.env.AI_KEY || '';
const APPLICATIONS_FILE = path.join(__dirname, 'data', 'applications.json');

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ---------- University knowledge base ---------- */
const FACTS = `
Alpa University is a Pakistani university focused mainly on Artificial Intelligence (AI) and Machine Learning (ML). It is ranked among the Top 10 universities of Pakistan and is co-educational.
Departments: Artificial Intelligence, Machine Learning, Data Science, Software Engineering, Web Development, Python Programming, Robotics (trained robots using ML), Human Resource Management (HRM), BBA, English, Pak Studies, Physics, Chemistry, Botany.
Teachers: all are experienced teaching professionals with Master's and PhD qualifications, trained to deliver knowledge in the best way. Muhammad Ali (Python), Umer (Web Development), Muneeb ur Rehman (AI), Muhammad Waqar (ML), Moheeb (HRM). Other teachers: Hamza, Adnan, Ahmad and more.
Fee: Rs 75,000 per semester.
Hostel: available inside the university. Rs 15,000 per month. Fresh rooms and tasty food, two meals a day (breakfast and dinner).
Attendance: 75% attendance is required to sit the final term exam.
Selection: minimum 65% marks in ICS (Math and Computer must be included). The university takes an entry test; students who pass are ready for admission. AI and ML programs need merit above 80%. Chances of selection depend on the applicant's qualification.
Required documents: student CNIC or B-Form, ICS or FCS or Pre-Engineering degree with marks above 65%, and father's CNIC.
`;

const SYSTEM_PROMPT = `You are the friendly assistant of Alpa University. Answer ONLY using the facts below, in short clear sentences. If the answer is not in the facts, say you do not have that detail and suggest using the Apply Now form or contacting the admission office. If the question is not about the university, reply exactly: "I'm just tell about the university related question or confusion." Never invent fees, dates, phone numbers or names.\n\nFACTS:\n${FACTS}`;

const OFF_TOPIC = "I'm just tell about the university related question or confusion.";

const INTENTS = [
  { re: /\b(hi|hello|hey|salam|assalam|aoa)\b/i, a: "Hello! Welcome to Alpa University. Ask me about departments, fees, hostel, teachers, admission or the selection test." },
  { re: /(fee|fees|cost|tuition|semester)/i, a: "The fee is Rs 75,000 per semester." },
  { re: /(hostel|room|food|meal|breakfast|dinner|accommodation)/i, a: "Hostel is available inside the university for Rs 15,000 per month, with fresh rooms and tasty food. Two meals are served daily: breakfast and dinner." },
  { re: /(attendance|attend)/i, a: "You need at least 75% attendance to be allowed in the final term exam." },
  { re: /(document|cnic|b-?form|require)/i, a: "Required documents: student CNIC or B-Form, ICS / FCS / Pre-Engineering degree with marks above 65%, and the father's CNIC." },
  { re: /(merit|criteria|eligib|marks|percent|test|selection|chance|admission|admit)/i, a: "Selection criteria: at least 65% marks in ICS, with Math and Computer included. You then sit the university entry test; if you pass, you are ready for admission. AI and ML programs need merit above 80%. Your chance of selection depends on your qualification." },
  { re: /(rank|top|best university)/i, a: "Alpa University is ranked among the Top 10 universities of Pakistan." },
  { re: /(co-?ed|boys|girls|female|male)/i, a: "Alpa University is co-educational." },
  { re: /(department|dept|program|course|subject|faculty of)/i, a: "Departments: Artificial Intelligence, Machine Learning, Data Science, Software Engineering, Web Development, Python Programming, Robotics, HRM, BBA, English, Pak Studies, Physics, Chemistry and Botany. AI and ML are our main focus." },
  { re: /(teacher|faculty|professor|instructor|phd|master)/i, a: "All our teachers are experienced in teaching and hold Master's and PhD qualifications. Muhammad Ali teaches Python, Umer teaches Web Development, Muneeb ur Rehman teaches AI, Muhammad Waqar teaches ML and Moheeb teaches HRM. Hamza, Adnan, Ahmad and others teach the remaining subjects." },
  { re: /(robot)/i, a: "In our Robotics lab students train robots using machine learning, supported by Python and Data Science courses." },
];

const RELEVANT = /(alpa|universit|college|campus|fee|hostel|admission|apply|test|merit|teacher|faculty|department|program|course|subject|semester|attendance|document|cnic|degree|ics|fcs|ai\b|ml\b|artificial|machine learning|data science|software|web|python|robot|hrm|bba|english|pak|physics|chemistry|botany|rank|student|study|class|exam|result|scholarship|contact|location|co-?ed|hello|hi\b|hey|salam)/i;

function localAnswer(msg) {
  for (const i of INTENTS) if (i.re.test(msg)) return i.a;
  return null;
}

const hits = new Map(); // tiny rate limiter
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 20;
}

app.post('/api/chat', async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ reply: 'Too many messages. Please wait a minute and try again.' });
  const message = String(req.body.message || '').trim().slice(0, 500);
  if (!message) return res.status(400).json({ reply: 'Please type a question.' });
  if (!RELEVANT.test(message)) return res.json({ reply: OFF_TOPIC });

  const local = localAnswer(message);
  const history = Array.isArray(req.body.history) ? req.body.history.slice(-6) : [];

  try {
    const r = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(AI_KEY && { Authorization: `Bearer ${AI_KEY}` }) },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: String(h.content).slice(0, 500) })),
          { role: 'user', content: message },
        ],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) throw new Error('AI status ' + r.status);
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('empty');
    return res.json({ reply, source: 'ai' });
  } catch (e) {
    // Free API unavailable: fall back to the built-in answers so the chat never breaks.
    return res.json({
      reply: local || "I don't have that detail. Please use the Apply Now form or contact the admission office.",
      source: 'local',
    });
  }
});

/* ---------- Admission form ---------- */
app.post('/api/apply', (req, res) => {
  const b = req.body || {};
  const required = ['program','fullName','dob','gender','studentCnic','phone','email','address','fatherName','fatherCnic','fatherPhone','degree','board','year','totalMarks','obtainedMarks'];
  const missing = required.filter(k => !String(b[k] ?? '').trim());
  if (missing.length) return res.status(400).json({ ok: false, error: 'Please fill: ' + missing.join(', ') });

  const total = Number(b.totalMarks), got = Number(b.obtainedMarks);
  if (!(total > 0) || got < 0 || got > total) return res.status(400).json({ ok: false, error: 'Marks are not valid.' });
  const percent = +(got / total * 100).toFixed(2);
  const aiml = /artificial|machine/i.test(b.program);
  const needed = aiml ? 80 : 65;

  const ref = 'ALPA-' + new Date().getFullYear() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  const record = { ref, submittedAt: new Date().toISOString(), percent, ...b };

  let all = [];
  try { all = JSON.parse(fs.readFileSync(APPLICATIONS_FILE, 'utf8')); } catch {}
  all.push(record);
  fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(all, null, 2));

  const message = percent >= needed
    ? `Your marks (${percent}%) meet the ${needed}% requirement. You will be called for the entry test.`
    : `Your marks (${percent}%) are below the ${needed}% requirement for this program. Your application is saved, but selection depends on your qualification.`;
  res.json({ ok: true, ref, percent, needed, message });
});

app.listen(PORT, () => console.log(`Alpa University running at http://localhost:${PORT}`));
