/* 管業ドリル 2026 — 単元別 網羅問題集 */
(function(){
"use strict";

var EXAM = new Date(2026, 11, 6);
var KEY = "kangyo-drill-2026";
var FIELDS = [
  {name:"区分所有法",   c:"#27386B", w:"#EDF1F8", exam:8},
  {name:"標準管理規約", c:"#2F6B5E", w:"#E9F2EF", exam:7},
  {name:"委託契約書",   c:"#5B4B8A", w:"#EFECF6", exam:4},
  {name:"民法",         c:"#8A5A2B", w:"#F5EEE5", exam:6},
  {name:"その他法令",   c:"#6B5A3E", w:"#F2EEE6", exam:3},
  {name:"適正化法",     c:"#A3452F", w:"#F8ECE8", exam:5},
  {name:"会計・税務",   c:"#8A6E10", w:"#F6F1DF", exam:4},
  {name:"建築・設備",   c:"#2C6E8F", w:"#E8F1F6", exam:13}
];
var FMAP = {};
FIELDS.forEach(function(f){ FMAP[f.name] = f; });
function fc(n){ return (FMAP[n] || FIELDS[0]).c; }
function fw(n){ return (FMAP[n] || FIELDS[0]).w; }

/* ===== データ整形 ===== */
var UNITS = [], ALL = [], BYID = {};
(window.BANK || []).slice().sort(function(a,b){ return a.id < b.id ? -1 : 1; }).forEach(function(u){
  if(!u || !u.id) return;
  u.items = [];
  (u.ox || []).forEach(function(q, i){
    var it = {id:u.id + "-o" + i, type:"ox", unit:u, t:q.t, r:q.r, lv:q.lv || 2, q:q.q, a:!!q.a, e:q.e};
    u.items.push(it);
  });
  (u.mc || []).forEach(function(q, i){
    var it = {id:u.id + "-m" + i, type:"mc", unit:u, t:q.t, r:q.r, lv:q.lv || 2, q:q.stem, c:q.c, a:q.a, e:q.e};
    u.items.push(it);
  });
  if(!u.topics || !u.topics.length){
    var seen = {}; u.topics = [];
    u.items.forEach(function(it){ if(!seen[it.t]){ seen[it.t] = 1; u.topics.push(it.t); } });
  }
  u.items.forEach(function(it){ ALL.push(it); BYID[it.id] = it; });
  UNITS.push(u);
});

/* ===== 進捗 ===== */
var P = {v:1, q:{}, bm:{}, days:{}};
try{
  var raw = localStorage.getItem(KEY);
  if(raw){ var o = JSON.parse(raw); if(o && o.q){ P = o; P.bm = P.bm || {}; P.days = P.days || {}; } }
}catch(e){}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(P)); }catch(e){} }
function rec(id){ return P.q[id]; }
function today(){
  var d = new Date();
  return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
}
function record(id, ok){
  var r = P.q[id] || {n:0, c:0, l:0, s:0, t:0};
  r.n++; if(ok){ r.c++; r.s++; } else { r.s = 0; }
  r.l = ok ? 1 : 0; r.t = Date.now();
  P.q[id] = r;
  var d = today(); var day = P.days[d] || [0, 0];
  day[0]++; if(ok) day[1]++; P.days[d] = day;
  save();
}
function isMastered(id){ var r = P.q[id]; return !!(r && r.s >= 2); }
function isWrong(id){ var r = P.q[id]; return !!(r && r.l === 0); }
function isNew(id){ return !P.q[id]; }

function statsOf(items){
  var s = {total:items.length, done:0, mastered:0, wrong:0, n:0, c:0};
  items.forEach(function(it){
    var r = P.q[it.id];
    if(r){ s.done++; s.n += r.n; s.c += r.c; if(r.s >= 2) s.mastered++; if(r.l === 0) s.wrong++; }
  });
  s.rate = s.n ? Math.round(s.c / s.n * 100) : null;
  return s;
}

/* ===== ユーティリティ ===== */
var app = document.getElementById("app");
function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]; }); }
function meter(s){
  var a = s.total ? s.done / s.total * 100 : 0, m = s.total ? s.mastered / s.total * 100 : 0;
  return '<div class="meter"><i class="a" style="width:' + a + '%"></i><i class="m" style="width:' + m + '%"></i></div>';
}
function toast(msg){
  var t = document.getElementById("toast");
  if(!t){ t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("on");
  clearTimeout(t._h); t._h = setTimeout(function(){ t.classList.remove("on"); }, 1800);
}
function daysLeft(){
  var now = new Date(); now.setHours(0,0,0,0);
  return Math.round((EXAM - now) / 86400000);
}
function stars(lv){ return lv >= 3 ? "★★★" : lv === 2 ? "★★☆" : "★☆☆"; }
function lvName(lv){ return lv >= 3 ? "難" : lv === 2 ? "標準" : "基本"; }
function scrollTop(){ window.scrollTo(0, 0); }

/* ===== 画面：ホーム ===== */
function home(){
  stopTimer();
  var s = statsOf(ALL);
  var td = P.days[today()] || [0, 0];
  var wrong = ALL.filter(function(it){ return isWrong(it.id); }).length;
  var fresh = ALL.filter(function(it){ return isNew(it.id); }).length;
  var bms = Object.keys(P.bm).filter(function(k){ return BYID[k]; }).length;
  var nOx = ALL.filter(function(it){ return it.type === "ox"; }).length;
  var nMc = ALL.length - nOx;

  var h = '<section class="hero"><p class="eyebrow">管理業務主任者試験 2026.12.6</p>' +
    '<h1>単元別 網羅ドリル<span class="sub">全' + UNITS.length + '単元・' + ALL.length + '問（一問一答 ' + nOx + '／四肢択一 ' + nMc + '）</span></h1>' +
    '<div class="stats">' +
      '<div class="stat"><div class="v">' + s.done + '<small>/' + s.total + '</small></div><div class="k">解答済み</div></div>' +
      '<div class="stat"><div class="v">' + s.mastered + '</div><div class="k">習得（2連続正解）</div></div>' +
      '<div class="stat"><div class="v">' + (s.rate === null ? "—" : s.rate + '<small>%</small>') + '</div><div class="k">累計正答率</div></div>' +
      '<div class="stat"><div class="v">' + td[0] + '</div><div class="k">今日の解答数</div></div>' +
    '</div>' + meter(s) +
    '<div class="legend"><span style="--c:#C9D2E6">解答済み</span><span style="--c:var(--ok)">習得</span></div></section>';

  h += '<div class="quick">' +
    '<button class="qa primary" data-act="review"' + (wrong ? '' : ' disabled') + '><span class="t">復習：前回×の問題</span><span class="d">' + wrong + '問　新しく間違えた順に最大30問</span></button>' +
    '<button class="qa" data-act="fresh"' + (fresh ? '' : ' disabled') + '><span class="t">未解答から20問</span><span class="d">全単元からランダム（残り' + fresh + '問）</span></button>' +
    '<button class="qa" data-act="exam"><span class="t">本番形式 模試 50問</span><span class="d">四肢択一・2時間・本試験の分野配分</span></button>' +
    '<button class="qa" data-act="bm"' + (bms ? '' : ' disabled') + '><span class="t">ブックマーク</span><span class="d">' + bms + '問</span></button>' +
    '</div>';

  FIELDS.forEach(function(f){
    var us = UNITS.filter(function(u){ return u.field === f.name; });
    if(!us.length) return;
    var fitems = []; us.forEach(function(u){ fitems = fitems.concat(u.items); });
    var fs = statsOf(fitems);
    h += '<h2><span class="bar" style="background:' + f.c + '"></span>' + f.name +
      '<span class="sp"></span><button class="linkbtn" data-field="' + esc(f.name) + '">この分野から20問</button></h2>';
    h += '<div class="note" style="margin:-6px 0 10px">' + fitems.length + '問・習得 ' + fs.mastered + '・正答率 ' + (fs.rate === null ? "—" : fs.rate + "%") + '</div>';
    h += '<div class="units">';
    us.forEach(function(u){
      var st = statsOf(u.items);
      var pct = st.total ? Math.round(st.mastered / st.total * 100) : 0;
      h += '<div class="unit" style="--c:' + f.c + '" data-unit="' + u.id + '">' +
        '<div><div class="no">' + u.id.toUpperCase() + '・' + u.items.length + '問</div><div class="tt">' + u.title + '</div></div>' +
        '<div class="pc">' + pct + '%<small>習得</small></div>' + meter(st) + '</div>';
    });
    h += '</div>';
  });
  if(!UNITS.length) h += '<p class="empty">問題データが読み込めませんでした。</p>';
  h += footer();
  app.innerHTML = h; scrollTop();
}

function footer(){
  return '<div class="foot">2026年4月1日時点の施行法令（改正区分所有法・令和7年10月改正の標準管理規約 等）に基づいて作成しています。' +
    '学習用の問題集のため、最終確認は条文・国土交通省の公表資料で行ってください。進捗はこの端末のブラウザに保存されます（設定から別端末へ移行可）。</div>';
}

/* ===== 画面：単元 ===== */
var unitOpt = {type:"all", target:"all", order:"shuffle", count:20, topics:null};
function unitView(id){
  stopTimer();
  var u = UNITS.filter(function(x){ return x.id === id; })[0];
  if(!u) return home();
  if(!unitOpt.topics || unitOpt.uid !== id){ unitOpt.topics = {}; u.topics.forEach(function(t){ unitOpt.topics[t] = true; }); unitOpt.uid = id; }
  var st = statsOf(u.items);
  var h = '<button class="back" data-go="home">← 単元一覧</button>' +
    '<section class="hero" style="padding-top:16px"><span class="chip" style="--c:' + fc(u.field) + ';--w:' + fw(u.field) + '">' + u.field + '</span>' +
    '<h1 style="font-size:clamp(22px,5.4vw,30px);margin-top:8px">' + u.title + '</h1>' +
    '<div class="stats"><div class="stat"><div class="v">' + st.total + '</div><div class="k">収録</div></div>' +
    '<div class="stat"><div class="v">' + st.done + '</div><div class="k">解答済み</div></div>' +
    '<div class="stat"><div class="v">' + st.mastered + '</div><div class="k">習得</div></div>' +
    '<div class="stat"><div class="v">' + (st.rate === null ? "—" : st.rate + '<small>%</small>') + '</div><div class="k">正答率</div></div></div>' +
    meter(st) + '</section>';

  h += '<div class="opts">' +
    '<div class="lbl">出題形式</div><div class="seg" data-opt="type">' +
      seg("type", "all", "すべて") + seg("type", "ox", "一問一答") + seg("type", "mc", "四肢択一") + '</div>' +
    '<div class="lbl">対象</div><div class="seg" data-opt="target">' +
      seg("target", "all", "全問") + seg("target", "new", "未解答") + seg("target", "wrong", "前回×") + seg("target", "notm", "未習得") + '</div>' +
    '<div class="lbl">出題数・順番</div><div class="seg">' +
      seg("count", 10, "10問") + seg("count", 20, "20問") + seg("count", 0, "全部") +
      '<span style="width:10px"></span>' + seg("order", "shuffle", "シャッフル") + seg("order", "seq", "収録順") + '</div>' +
    '<button class="go" data-act="startUnit" data-uid="' + u.id + '" id="goBtn"></button></div>';

  h += '<h3>論点（チェックした論点から出題）　<button class="linkbtn" data-act="tAll">全選択</button>　<button class="linkbtn" data-act="tNone">全解除</button></h3><div class="topics">';
  u.topics.forEach(function(t){
    var its = u.items.filter(function(it){ return it.t === t; });
    var ts = statsOf(its);
    h += '<label class="topic"><input type="checkbox" data-topic="' + esc(t) + '"' + (unitOpt.topics[t] ? ' checked' : '') + '>' +
      '<span>' + t + '</span><span class="n">習得 ' + ts.mastered + '/' + ts.total + '</span>' + meter(ts) + '</label>';
  });
  h += '</div>' + footer();
  app.innerHTML = h; scrollTop();
  updateGo(u);
}
function seg(k, v, label){
  return '<button class="' + (unitOpt[k] === v ? 'on' : '') + '" data-seg="' + k + '" data-val="' + v + '">' + label + '</button>';
}
function unitPool(u){
  return u.items.filter(function(it){
    if(!unitOpt.topics[it.t]) return false;
    if(unitOpt.type !== "all" && it.type !== unitOpt.type) return false;
    if(unitOpt.target === "new" && !isNew(it.id)) return false;
    if(unitOpt.target === "wrong" && !isWrong(it.id)) return false;
    if(unitOpt.target === "notm" && isMastered(it.id)) return false;
    return true;
  });
}
function updateGo(u){
  var b = document.getElementById("goBtn"); if(!b) return;
  var n = unitPool(u).length;
  var k = unitOpt.count ? Math.min(unitOpt.count, n) : n;
  b.disabled = !k;
  b.textContent = k ? "演習を始める（" + k + "問）" : "該当する問題がありません";
}
function startUnit(u){
  var pool = unitPool(u);
  if(unitOpt.order === "shuffle") pool = shuffle(pool);
  if(unitOpt.count) pool = pool.slice(0, unitOpt.count);
  startSession({title:u.title, items:pool, mode:"drill", back:function(){ unitView(u.id); }});
}

/* ===== 演習セッション ===== */
var S = null, timerH = null;
function stopTimer(){ if(timerH){ clearInterval(timerH); timerH = null; } }

function startSession(o){
  if(!o.items.length){ toast("該当する問題がありません"); return; }
  S = {title:o.title, items:o.items, mode:o.mode, back:o.back, i:0, ans:[], picked:null, shown:false, start:Date.now(), limit:o.limit || 0};
  stopTimer();
  if(S.limit){ timerH = setInterval(tick, 1000); }
  renderQ();
}
function tick(){
  var el = document.getElementById("timer");
  var left = S.limit - (Date.now() - S.start);
  if(left <= 0){ stopTimer(); toast("試験時間終了"); finish(); return; }
  if(el){ var m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000); el.textContent = "残り " + m + ":" + ("0" + s).slice(-2); }
}

function renderQ(){
  var it = S.items[S.i], u = it.unit;
  var exam = S.mode === "exam";
  var h = '<div class="qhead"><span class="prog">' + (S.i + 1) + ' / ' + S.items.length + '</span><span>' + S.title + '</span>' +
    (S.limit ? '<span class="timer" id="timer"></span>' : '') + '</div>' +
    '<div class="qbar"><i style="width:' + (S.i / S.items.length * 100) + '%"></i></div>';
  h += '<div class="qcard"><div class="qmeta"><span class="chip" style="--c:' + fc(u.field) + ';--w:' + fw(u.field) + '">' + u.field + '</span>' +
    '<span class="tp">' + u.title + '／' + it.t + '</span><span class="lv" title="' + lvName(it.lv) + '">' + stars(it.lv) + '</span>' +
    '<button class="bm' + (P.bm[it.id] ? ' on' : '') + '" data-act="bmToggle" aria-label="ブックマーク">★</button></div>';
  h += '<div class="qtype">' + (it.type === "ox" ? "一問一答　正しければ○、誤りなら×" : "四肢択一") + '</div>';
  h += '<div class="qtext">' + it.q + '</div>';

  if(it.type === "ox"){
    h += '<div class="ox"><button class="o" data-ans="1">○</button><button class="x" data-ans="0">×</button></div>';
  } else {
    h += '<div class="choices">';
    it.c.forEach(function(c, i){
      h += '<button class="choice" data-ans="' + (i + 1) + '"><span class="num">' + (i + 1) + '</span><span>' + c + '</span></button>';
    });
    h += '</div>';
  }
  h += '<div id="fb"></div></div>';
  h += '<div class="qnav" id="qnav">' +
    '<button class="quit" data-act="quit">' + (exam ? "終了して採点" : "中断") + '</button>' +
    (exam ? '<button class="next" data-act="next" id="nextBtn" disabled>' + (S.i + 1 < S.items.length ? "次へ" : "採点する") + '</button>' : '') +
    '</div>';
  h += '<div class="kbd">キー操作：' + (it.type === "ox" ? "O＝○　X＝×" : "1〜4で選択") + '　Enter＝次へ</div>';
  app.innerHTML = h;
  S.picked = null; S.shown = false;
  if(S.limit) tick();
  scrollTop();
}

function answer(v){
  if(S.shown) return;
  var it = S.items[S.i];
  var exam = S.mode === "exam";
  if(exam){
    // 本番形式：選び直し可、判定は最後
    S.picked = v; S.ans[S.i] = v;
    var bs = app.querySelectorAll("[data-ans]");
    for(var k = 0; k < bs.length; k++) bs[k].classList.toggle("pick", bs[k].getAttribute("data-ans") === String(v));
    var nb = document.getElementById("nextBtn"); if(nb) nb.disabled = false;
    return;
  }
  S.shown = true;
  var ok = it.type === "ox" ? ((v === 1) === it.a) : (v === it.a);
  S.ans[S.i] = v;
  record(it.id, ok);
  showFeedback(it, v, ok);
}

function showFeedback(it, v, ok){
  var bs = app.querySelectorAll("[data-ans]");
  for(var k = 0; k < bs.length; k++){
    var b = bs[k], bv = +b.getAttribute("data-ans");
    b.disabled = true;
    if(it.type === "ox"){
      if((bv === 1) === it.a) b.classList.add("right");
      else if(bv === v) b.classList.add("pick");
    } else {
      if(bv === it.a) b.classList.add("right");
      else if(bv === v) b.classList.add("wrong");
    }
  }
  var correct = it.type === "ox" ? (it.a ? "○" : "×") : "正解 " + it.a;
  var fb = '<div class="verdict ' + (ok ? 'ok' : 'ng') + '"><span class="big">' + (ok ? "正解" : "不正解") + '</span><span>' + correct + '</span></div>' +
    '<div class="expl">' + (it.e || "") + (it.r ? '<span class="ref">根拠：' + it.r + '</span>' : '') + '</div>';
  document.getElementById("fb").innerHTML = fb;
  var last = S.i + 1 >= S.items.length;
  document.getElementById("qnav").innerHTML =
    '<button class="quit" data-act="quit">中断</button>' +
    '<button class="next" data-act="next" id="nextBtn">' + (last ? "結果を見る" : "次の問題") + '</button>';
  var fbEl = document.getElementById("fb");
  if(fbEl && fbEl.getBoundingClientRect().top > window.innerHeight * 0.6) fbEl.scrollIntoView({behavior:"smooth", block:"start"});
}

function next(){
  if(S.mode === "exam" && S.ans[S.i] === undefined) return;
  if(S.i + 1 >= S.items.length) return finish();
  S.i++; renderQ();
}

function finish(){
  stopTimer();
  var exam = S.mode === "exam";
  var rows = [], okN = 0, answered = 0, perField = {};
  S.items.forEach(function(it, i){
    var v = S.ans[i];
    if(v === undefined && !exam) return;
    var ok = v !== undefined && (it.type === "ox" ? ((v === 1) === it.a) : (v === it.a));
    if(exam && v !== undefined){ record(it.id, ok); }
    answered++; if(ok) okN++;
    var f = it.unit.field; perField[f] = perField[f] || [0, 0]; perField[f][0]++; if(ok) perField[f][1]++;
    rows.push({it:it, v:v, ok:ok});
  });
  var total = exam ? S.items.length : answered;
  var pct = total ? Math.round(okN / total * 100) : 0;
  var h = '<div class="score"><div class="lbl">' + S.title + '</div><div class="pct">' + okN + '<small> / ' + total + '</small></div>' +
    '<div class="sub">正答率 ' + pct + '%' + (exam ? '　所要 ' + Math.round((Date.now() - S.start) / 60000) + '分' : '') + '</div>';
  if(exam){
    var line = Math.round(35 * total / 50);
    h += '<span class="pass ' + (okN >= line ? 'ok' : 'ng') + '">合格目安 ' + line + '点 ' + (okN >= line ? 'クリア' : 'まであと' + (line - okN) + '点') + '</span>';
  }
  h += '</div>';
  if(exam){
    h += '<h3>分野別</h3><div class="topics">';
    FIELDS.forEach(function(f){
      var p = perField[f.name]; if(!p) return;
      h += '<div class="topic" style="grid-template-columns:1fr 86px;cursor:default"><span>' + f.name + '</span><span class="n">' + p[1] + ' / ' + p[0] + '</span></div>';
    });
    h += '</div>';
  }
  var wrongs = rows.filter(function(r){ return !r.ok; });
  h += '<div class="btnrow">' +
    (wrongs.length ? '<button class="btn pri" data-act="retryWrong">' + (exam ? '不正解・未解答の' : '間違えた') + wrongs.length + '問をもう一度</button>' : '') +
    '<button class="btn" data-act="backFromResult">戻る</button></div>';
  h += '<h3>解答一覧</h3><div class="rlist">';
  rows.forEach(function(r, i){
    var it = r.it;
    var your = r.v === undefined ? "未解答" : it.type === "ox" ? (r.v === 1 ? "○" : "×") : r.v;
    var cor = it.type === "ox" ? (it.a ? "○" : "×") : it.a;
    h += '<div class="ritem' + (r.ok ? ' ok' : '') + '"><div class="h">' + (i + 1) + '．' + it.unit.title + '／' + it.t + '　あなた：' + your + '　正解：<span class="ans">' + cor + '</span></div>' +
      '<div>' + it.q + '</div>' +
      (it.type === "mc" ? '<div class="note">' + it.c.map(function(c, k){ return (k + 1) + '．' + c; }).join('<br>') + '</div>' : '') +
      '<details' + (r.ok ? '' : ' open') + '><summary>解説</summary><div class="expl">' + (it.e || "") + (it.r ? '<span class="ref">根拠：' + it.r + '</span>' : '') + '</div></details></div>';
  });
  h += '</div>';
  S.wrongItems = wrongs.map(function(r){ return r.it; });
  app.innerHTML = h; scrollTop();
}

/* ===== 横断モード ===== */
function startReview(){
  var pool = ALL.filter(function(it){ return isWrong(it.id); })
    .sort(function(a, b){ return P.q[b.id].t - P.q[a.id].t; }).slice(0, 30);
  startSession({title:"復習：前回×", items:shuffle(pool), mode:"drill", back:home});
}
function startFresh(){
  var pool = shuffle(ALL.filter(function(it){ return isNew(it.id); })).slice(0, 20);
  startSession({title:"未解答から20問", items:pool, mode:"drill", back:home});
}
function startField(name){
  var pool = ALL.filter(function(it){ return it.unit.field === name; });
  var pri = shuffle(pool.filter(function(it){ return !isMastered(it.id); }));
  var rest = shuffle(pool.filter(function(it){ return isMastered(it.id); }));
  startSession({title:name + "から20問", items:pri.concat(rest).slice(0, 20), mode:"drill", back:home});
}
function startBm(){
  var pool = Object.keys(P.bm).map(function(k){ return BYID[k]; }).filter(Boolean);
  startSession({title:"ブックマーク", items:shuffle(pool), mode:"drill", back:home});
}
function startExam(){
  if(!confirm("本番形式の模試を始めます。\n四肢択一50問・制限時間2時間。解答中は正誤が表示されず、最後にまとめて採点します。")) return;
  var picked = [];
  FIELDS.forEach(function(f){
    var pool = ALL.filter(function(it){ return it.type === "mc" && it.unit.field === f.name; });
    // 未解答・前回×を優先
    var pri = shuffle(pool.filter(function(it){ return !isMastered(it.id); }));
    var rest = shuffle(pool.filter(function(it){ return isMastered(it.id); }));
    picked = picked.concat(pri.concat(rest).slice(0, f.exam));
  });
  if(picked.length < 50){
    var have = {}; picked.forEach(function(it){ have[it.id] = 1; });
    picked = picked.concat(shuffle(ALL.filter(function(it){ return it.type === "mc" && !have[it.id]; })).slice(0, 50 - picked.length));
  }
  // 本試験同様、分野順に並べる
  var order = {}; FIELDS.forEach(function(f, i){ order[f.name] = i; });
  picked.sort(function(a, b){ return order[a.unit.field] - order[b.unit.field] || (a.unit.id < b.unit.id ? -1 : a.unit.id > b.unit.id ? 1 : 0); });
  startSession({title:"本番形式 模試", items:picked, mode:"exam", back:home, limit:120 * 60000});
}

/* ===== 設定 ===== */
function settings(){
  stopTimer();
  var code = "";
  try{ code = btoa(unescape(encodeURIComponent(JSON.stringify(P)))); }catch(e){}
  var days = Object.keys(P.days).sort().slice(-14);
  var h = '<button class="back" data-go="home">← 戻る</button><h2>設定・進捗の移行</h2>';
  if(days.length){
    h += '<div class="panel"><p>直近の学習記録</p><div class="note">' + days.map(function(d){
      var x = P.days[d]; return d.slice(5) + '　' + x[0] + '問（正答 ' + Math.round(x[1] / x[0] * 100) + '%）';
    }).join('<br>') + '</div></div>';
  }
  h += '<div class="panel"><p><b>別の端末へ移す</b>：下の文字列をコピーし、移行先の端末でこの画面を開いて「読み込み」欄に貼り付けます。</p>' +
    '<textarea id="exp" readonly>' + code + '</textarea>' +
    '<div class="btnrow"><button class="btn" data-act="copyExp">コピー</button><button class="btn" data-act="dlExp">ファイルで保存</button></div></div>';
  h += '<div class="panel"><p><b>読み込み</b>：移行元でコピーした文字列を貼り付けます（現在の記録は上書きされます）。</p>' +
    '<textarea id="imp" placeholder="ここに貼り付け"></textarea><div class="btnrow"><button class="btn pri" data-act="doImp">読み込む</button></div></div>';
  h += '<div class="panel"><p>すべての解答記録とブックマークを消去します。</p><div class="btnrow"><button class="btn warn" data-act="reset">記録をリセット</button></div></div>';
  h += footer();
  app.innerHTML = h; scrollTop();
}

/* ===== イベント ===== */
document.addEventListener("click", function(ev){
  var t = ev.target.closest("[data-go],[data-act],[data-unit],[data-seg],[data-ans],[data-field]");
  if(!t) return;
  if(t.hasAttribute("data-go")){ var g = t.getAttribute("data-go"); if(S && S.mode === "exam" && document.getElementById("timer") && !confirm("模試を中断しますか？")) return; S = null; if(g === "settings") settings(); else home(); return; }
  if(t.hasAttribute("data-unit")){ unitView(t.getAttribute("data-unit")); return; }
  if(t.hasAttribute("data-field")){ startField(t.getAttribute("data-field")); return; }
  if(t.hasAttribute("data-ans")){ if(!t.disabled) answer(+t.getAttribute("data-ans")); return; }
  if(t.hasAttribute("data-seg")){
    var k = t.getAttribute("data-seg"), v = t.getAttribute("data-val");
    unitOpt[k] = k === "count" ? +v : v;
    var sib = t.parentNode.querySelectorAll('[data-seg="' + k + '"]');
    for(var i = 0; i < sib.length; i++) sib[i].classList.toggle("on", sib[i] === t);
    updateGo(UNITS.filter(function(u){ return u.id === unitOpt.uid; })[0]);
    return;
  }
  var a = t.getAttribute("data-act");
  var cu = UNITS.filter(function(u){ return u.id === unitOpt.uid; })[0];
  switch(a){
    case "startUnit": startUnit(cu); break;
    case "tAll": case "tNone":
      cu.topics.forEach(function(x){ unitOpt.topics[x] = a === "tAll"; });
      var cbs = app.querySelectorAll("[data-topic]"); for(var j = 0; j < cbs.length; j++) cbs[j].checked = a === "tAll";
      updateGo(cu); break;
    case "review": startReview(); break;
    case "fresh": startFresh(); break;
    case "exam": startExam(); break;
    case "bm": startBm(); break;
    case "next": next(); break;
    case "quit":
      if(S.mode === "exam"){ if(confirm("ここで終了して採点しますか？（未解答は不正解扱い）")) finish(); }
      else if(S.ans.length) finish(); else { var b = S.back; S = null; b(); }
      break;
    case "bmToggle":
      var id = S.items[S.i].id;
      if(P.bm[id]) delete P.bm[id]; else P.bm[id] = 1;
      save(); t.classList.toggle("on", !!P.bm[id]); toast(P.bm[id] ? "ブックマークしました" : "ブックマークを外しました"); break;
    case "retryWrong":
      startSession({title:"間違えた問題", items:shuffle(S.wrongItems), mode:"drill", back:S.back}); break;
    case "backFromResult": var bk = S.back; S = null; bk(); break;
    case "copyExp":
      var ta = document.getElementById("exp"); ta.select();
      try{ navigator.clipboard.writeText(ta.value).then(function(){ toast("コピーしました"); }, function(){ document.execCommand("copy"); toast("コピーしました"); }); }
      catch(e){ document.execCommand("copy"); toast("コピーしました"); }
      break;
    case "dlExp":
      var blob = new Blob([JSON.stringify(P)], {type:"application/json"});
      var l = document.createElement("a"); l.href = URL.createObjectURL(blob); l.download = "kangyo-drill-progress-" + today() + ".json"; l.click(); break;
    case "doImp":
      var s = document.getElementById("imp").value.trim(); if(!s) return;
      try{
        var o = s.charAt(0) === "{" ? JSON.parse(s) : JSON.parse(decodeURIComponent(escape(atob(s))));
        if(!o || !o.q) throw 0;
        if(!confirm("現在の記録を上書きして読み込みますか？")) return;
        P = o; P.bm = P.bm || {}; P.days = P.days || {}; save(); toast("読み込みました"); home();
      }catch(e){ toast("読み込めませんでした。文字列を確認してください"); }
      break;
    case "reset":
      if(confirm("すべての解答記録とブックマークを消去します。よろしいですか？")){ P = {v:1, q:{}, bm:{}, days:{}}; save(); toast("リセットしました"); home(); }
      break;
  }
});
document.addEventListener("change", function(ev){
  var t = ev.target;
  if(t.hasAttribute && t.hasAttribute("data-topic")){
    unitOpt.topics[t.getAttribute("data-topic")] = t.checked;
    updateGo(UNITS.filter(function(u){ return u.id === unitOpt.uid; })[0]);
  }
});
document.addEventListener("keydown", function(ev){
  if(!S || !document.querySelector(".qcard")) return;
  if(ev.target && /TEXTAREA|INPUT/.test(ev.target.tagName)) return;
  var it = S.items[S.i], k = ev.key.toLowerCase();
  if(k === "enter" || k === " "){
    var nb = document.getElementById("nextBtn");
    if(nb && !nb.disabled){ ev.preventDefault(); next(); }
    return;
  }
  if(it.type === "ox"){
    if(k === "o" || k === "1") answer(1);
    else if(k === "x" || k === "2") answer(0);
  } else if(/^[1-4]$/.test(k)) answer(+k);
});

/* ===== 起動 ===== */
(function(){
  var d = daysLeft(), el = document.getElementById("cd");
  if(el) el.textContent = d > 0 ? "試験まで " + d + "日" : d === 0 ? "試験当日" : "";
})();
home();
})();
