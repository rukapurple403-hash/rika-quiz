// app.js
const $ = (id) => document.getElementById(id);

const gradeSel = $("grade");
const fieldSel = $("field");
const limitSel = $("limit");
const btnNext = $("btnNext");
const btnRestart = $("btnRestart");

const poolInfo = $("poolInfo");
const modePill = $("modePill");

const qEl = $("q");
const choicesEl = $("choices");
const resultText = $("resultText");
const exBox = $("exBox");
const exEl = $("ex");

const statCorrect = $("statCorrect");
const statTotal = $("statTotal");
const statAcc = $("statAcc");
const statStreak = $("statStreak");
const statBestStreak = $("statBestStreak");

const nicknameEl = $("nickname");
const btnSaveScore = $("btnSaveScore");
const boardEl = $("leaderboard");
const btnClearBoard = $("btnClearBoard");

const LS_BOARD = "rikaQuizBoard_v1";

let currentQ = null;
let locked = false;

let total = 0;
let correct = 0;
let streak = 0;
let bestStreak = 0;

function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function pickN(arr, n){
  const s = shuffle(arr);
  return s.slice(0, Math.min(n, s.length));
}
function bigrams(s){
  const t = [...String(s)];
  const out = [];
  for(let i=0;i<t.length-1;i++) out.push(t[i]+t[i+1]);
  return out;
}
function jaccard(a, b){
  const A = new Set(a), B = new Set(b);
  let inter = 0;
  for(const x of A) if(B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}
function similarityTerm(x, y){
  x = String(x); y = String(y);
  const bg = jaccard(bigrams(x), bigrams(y));
  const head = (x[0] && y[0] && x[0]===y[0]) ? 0.25 : 0;
  const tail = (x.at(-1) && y.at(-1) && x.at(-1)===y.at(-1)) ? 0.15 : 0;
  const len  = (Math.abs(x.length - y.length) <= 1) ? 0.10 : 0;
  return bg + head + tail + len;
}
function pickSimilarTerms(correct, candidates, n){
  const scored = candidates
    .filter(w => w !== correct)
    .map(w => ({ w, s: similarityTerm(correct, w) }))
    .sort((a,b)=> b.s - a.s);
  return scored.slice(0, 30).sort(()=>Math.random()-0.5).slice(0, n).map(x=>x.w);
}
function fieldName(f){
  return ({life:"生命", chem:"物質", phys:"エネルギー", earth:"地球"})[f] || "全分野";
}
function themeByField(f){
  if (f === "life") return "theme-life";
  if (f === "chem") return "theme-chem";
  if (f === "phys") return "theme-phys";
  if (f === "earth") return "theme-earth";
  return "theme-life";
}

function filteredTerms(){
  const g = gradeSel.value;
  const f = fieldSel.value;

  return TERMS.filter(t => {
    const okG = (g === "all") ? true : String(t.grade) === g;
    const okF = (f === "all") ? true : t.field === f;
    return okG && okF;
  });
}

function buildQuestion(){
  const pool = filteredTerms();
  if (pool.length < 4) return null;

  const item = pool[Math.floor(Math.random() * pool.length)];
  const correctTerm = item.term;

  const distractPool = pool
    .map(x => x.term)
    .filter(w => w !== correctTerm);

  const choices = shuffle([correctTerm, ...pickN(distractPool, 3)]);

  return {
    key: `${item.grade}-${item.field}-${item.term}`,
    prompt: `次の説明に当てはまる用語は？\n「${item.hint}」`,
    choices,
    correctIndex: choices.indexOf(correctTerm),
    explain: `答え：${correctTerm}`
  };
}

function updateStats(){
  statCorrect.textContent = String(correct);
  statTotal.textContent = String(total);
  const acc = total === 0 ? 0 : Math.round((correct/total)*100);
  statAcc.textContent = `${acc}%`;
  statStreak.textContent = String(streak);
  statBestStreak.textContent = String(bestStreak);

  const pool = filteredTerms();
  poolInfo.textContent = `対象：${gradeSel.value==="all"?"全学年":gradeSel.value+"年"} / ${fieldSel.value==="all"?"全分野":fieldName(fieldSel.value)} / 用語 ${pool.length}語`;
}

function setTheme(){
  document.body.className = themeByField(fieldSel.value === "all" ? "life" : fieldSel.value);
}

function resetUI(){
  choicesEl.innerHTML = "";
  resultText.textContent = "";
  exEl.textContent = "";
  exBox.classList.add("hidden");
}

function renderQuestion(){
  setTheme();
  updateStats();
  resetUI();

  const q = buildQuestion();
  if (!q){
    qEl.textContent = "用語が少なすぎて4択が作れません。学年/分野を広げるか、TERMSを増やしてね。";
    return;
  }

  currentQ = q;
  locked = false;

  qEl.textContent = q.prompt;

  q.choices.forEach((text, idx) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = `${idx+1}. ${text}`;
    btn.onclick = () => answer(idx, btn);
    choicesEl.appendChild(btn);
  });

  const limit = Number(limitSel.value);
  modePill.textContent = (limit === 0) ? "エンドレス" : `${limit}問チャレンジ`;
}

function answer(idx, btn){
  if (!currentQ || locked) return;
  locked = true;

  const buttons = [...choicesEl.querySelectorAll("button")];
  buttons.forEach(b => b.disabled = true);

  total += 1;

  const c = currentQ.correctIndex;
  buttons[c].classList.add("correct");

  if (idx === c){
    correct += 1;
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
    resultText.textContent = "⭕ 正解！";
  } else {
    streak = 0;
    btn.classList.add("wrong");
    resultText.textContent = "❌ 不正解…";
  }

  exEl.textContent = currentQ.explain;
  exBox.classList.remove("hidden");

  updateStats();

  const limit = Number(limitSel.value);
  if (limit !== 0 && total >= limit){
    resultText.textContent += `　（${limit}問終了！記録したいなら右の「記録」）`;
  }
}

function restart(){
  total = 0; correct = 0; streak = 0; bestStreak = 0;
  renderQuestion();
}

function loadBoard(){
  try{
    return JSON.parse(localStorage.getItem(LS_BOARD) || "[]");
  }catch{
    return [];
  }
}
function saveBoard(board){
  localStorage.setItem(LS_BOARD, JSON.stringify(board));
}
function renderBoard(){
  const board = loadBoard();
  boardEl.innerHTML = "";
  board.forEach(row => {
    const li = document.createElement("li");
    li.textContent = `${row.name}：${row.score}点（正答率${row.acc}% / ${row.total}問）`;
    boardEl.appendChild(li);
  });
}
function calcScore(){
  // スコア：正解×10 + 連続最高×2（おまけ）
  const acc = total === 0 ? 0 : Math.round((correct/total)*100);
  const score = correct*10 + bestStreak*2;
  return { score, acc };
}
function saveScore(){
  const name = (nicknameEl.value || "名無し").trim().slice(0,12) || "名無し";
  const limit = Number(limitSel.value);
  if (limit !== 0 && total < limit){
    alert(`まだ${limit}問に達していません（いま${total}問）。全部解いてから記録がおすすめ。`);
    return;
  }
  if (total === 0){
    alert("まだ解いていません。まず1問解こう。");
    return;
  }

  const {score, acc} = calcScore();
  const board = loadBoard();
  board.push({ name, score, acc, total, ts: Date.now() });

  board.sort((a,b)=> b.score - a.score);
  const top10 = board.slice(0,10);

  saveBoard(top10);
  renderBoard();
}

gradeSel.onchange = renderQuestion;
fieldSel.onchange = renderQuestion;
limitSel.onchange = restart;

btnNext.onclick = () => {
  const limit = Number(limitSel.value);
  if (limit !== 0 && total >= limit){
    alert("このチャレンジは終了！右の「記録」か「やり直し」をどうぞ。");
    return;
  }
  renderQuestion();
};
btnRestart.onclick = restart;

btnSaveScore.onclick = saveScore;
btnClearBoard.onclick = () => {
  localStorage.removeItem(LS_BOARD);
  renderBoard();
};

renderBoard();
renderQuestion();
