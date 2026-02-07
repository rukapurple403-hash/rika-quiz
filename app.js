const DB = [
  {
    unit: "生物",
    items: [
      {
        id: "bio-001",
        q: "植物が光を受けてデンプンなどをつくるはたらきは？",
        a: ["呼吸", "蒸散", "光合成", "受粉"],
        correct: 2,
        ex: "二酸化炭素と水から、光エネルギーを使って有機物（デンプンなど）をつくり、酸素を放出する。"
      },
      {
        id: "bio-002",
        q: "食物連鎖で、植物を食べる動物は何という？",
        a: ["生産者", "一次消費者", "二次消費者", "分解者"],
        correct: 1,
        ex: "植物（生産者）を食べる動物は一次消費者。一次消費者を食べるのが二次消費者。"
      },
    ],
  },
  {
    unit: "化学",
    items: [
      {
        id: "chem-001",
        q: "水にとけた物質をふくむ液体を何という？",
        a: ["溶媒", "溶液", "飽和水溶液", "混合物"],
        correct: 1,
        ex: "溶質が溶媒に溶けたもの全体を溶液という。"
      },
    ],
  },
];

const $ = (id) => document.getElementById(id);
const unitSel = $("unit");
const meta = $("meta");
const qEl = $("q");
const choicesEl = $("choices");
const resultEl = $("result");
const exBox = $("exBox");
const exEl = $("ex");

const LS_WRONG = "rikaQuizWrongIds";

let mode = "all"; // all | wrong
let current = null;

function getWrongSet() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_WRONG) || "[]")); }
  catch { return new Set(); }
}
function saveWrongSet(set) {
  localStorage.setItem(LS_WRONG, JSON.stringify([...set]));
}

function units() {
  return DB.map(x => x.unit);
}

function itemsByUnit(unit) {
  return DB.find(x => x.unit === unit)?.items || [];
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pool(unit) {
  const items = itemsByUnit(unit);
  if (mode === "all") return items;
  const wrong = getWrongSet();
  return items.filter(x => wrong.has(x.id));
}

function renderQuestion() {
  const unit = unitSel.value;
  const p = pool(unit);
  if (p.length === 0) {
    qEl.textContent = (mode === "wrong")
      ? "間違いリストが空です。まずは通常モードで解いてね。"
      : "問題がありません。";
    choicesEl.innerHTML = "";
    resultEl.textContent = "";
    exBox.classList.add("hidden");
    meta.textContent = `単元：${unit} / モード：${mode}`;
    return;
  }

  current = pickRandom(p);
  meta.textContent = `単元：${unit} / モード：${mode} / ID：${current.id}`;
  qEl.textContent = current.q;
  resultEl.textContent = "";
  exBox.classList.add("hidden");
  exEl.textContent = "";

  choicesEl.innerHTML = "";
  current.a.forEach((text, idx) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = `${idx + 1}. ${text}`;
    btn.onclick = () => answer(idx, btn);
    choicesEl.appendChild(btn);
  });
}

function answer(idx, btn) {
  const wrong = getWrongSet();

  // disable all
  [...choicesEl.querySelectorAll("button")].forEach(b => b.disabled = true);

  const correct = current.correct;
  const buttons = [...choicesEl.querySelectorAll("button")];
  buttons[correct].classList.add("correct");

  if (idx === correct) {
    resultEl.textContent = "⭕ 正解！";
    wrong.delete(current.id);
  } else {
    resultEl.textContent = "❌ 不正解…（復習リストに追加）";
    btn.classList.add("wrong");
    wrong.add(current.id);
  }
  saveWrongSet(wrong);

  exEl.textContent = current.ex;
  exBox.classList.remove("hidden");
}

$("btnNext").onclick = renderQuestion;
$("btnWrong").onclick = () => { mode = (mode === "wrong") ? "all" : "wrong"; renderQuestion(); };
$("btnReset").onclick = () => { localStorage.removeItem(LS_WRONG); renderQuestion(); };

function init() {
  units().forEach(u => {
    const opt = document.createElement("option");
    opt.value = u; opt.textContent = u;
    unitSel.appendChild(opt);
  });
  unitSel.onchange = renderQuestion;
  renderQuestion();
}
init();
