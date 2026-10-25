/* AXF CONTROL v2 · 홈 › 지금 현장 + 오늘 기록 (261026 사용자 「여유 · 혼잡에 대해서 내가 기록하는 것들도 기록해 두고, 혼잡도 부분도 홈 메뉴에서 보일 수 있게 · 하나의 추가 버튼으로」 · 기록 범위 「오늘 전부」)
 * 자리 = 홈 「지금 단계」 아래 · 경품 위 한 칸(now.js 는 고치지 않는다 · SCREENS.now need · mount · paint 를 감싼다)
 * 읽기 = crowd_log today 1(관리코드 · 읽기) = 지금 칸(crowd.n) + 오늘(0시부터) 네 칸 제보 전부 · 새것 먼저 · 옛 로비 · 엘리베이터 행은 서버 · 화면 둘 다 뺀다
 *   옛 서버(today 모름 · 끝 30줄)여도 화면에서 오늘 · 네 칸만 거른다
 * 값 = 참가자 앱 홈 「지금 현장」과 같은 칸 · 제보는 다음 제보까지 그날 24:00 까지 그대로(서버 261026) */
var CNL_K=[["r","1F 룰렛","룰렛"],["p","1F 포토부스","포토부스"],["a","1F AX PLAY","AX PLAY"],["h","17F 대강당","17F 대강당"]];
var CNL_HLV=["","여유","보통","붐빔","거의 만석","만석"], CNL_LV={ ok:"여유", mid:"보통", jam:"혼잡" }, CNL_SRC={ s:"스태프", a:"자동", q:"입장 QR" };
var CNL={ f:"all" };
(function(){
  var sc=SCREENS.now; if(!sc||sc.__cnl) return; sc.__cnl=1;
  var n0d=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return n0d.call(sc).concat([{ k:"cnl", a:"crowd_log", p:{ today:1 }, ttl:30000 }]); };
  sc.mount=function(vb){ m0.call(sc,vb); var pz=el("nwPz"); if(pz&&!el("nwCn")){ var d=document.createElement("div"); d.id="nwCn"; pz.parentNode.insertBefore(d,pz); } cnlCss(); };
  sc.paint=function(){ p0.apply(sc,arguments); var b=el("nwCn"); if(b) b.innerHTML=cnlCard(); if(DRW.k==="cnlog") cnlOpen(1); };
})();
function cnlCss(){
  if(el("cnlCss")) return; var s=document.createElement("style"); s.id="cnlCss";
  s.textContent=".cnl-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}"+
    ".cnl-c{border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:4px;min-width:0}"+
    ".cnl-c .nm{font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;justify-content:space-between}"+
    ".cnl-c .sb{font-size:12px;color:var(--tx3);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
    ".cnl-t{width:100%;border-collapse:collapse;font-size:13px}"+
    ".cnl-t th{font-size:12px;color:var(--tx3);font-weight:600;text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}"+
    ".cnl-t td{padding:8px;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums;white-space:nowrap}"+
    ".cnl-t td.v{font-weight:700;white-space:normal}"+
    "@media (max-width:720px){ .cnl-g{grid-template-columns:repeat(2,minmax(0,1fr))} }";
  document.head.appendChild(s);
}
function cnlHm(ms){ var d=new Date(Number(ms)); return isFinite(d.getTime())&&Number(ms)>0?String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"):"-"; }
function cnlDay(){ var r=S.data.cnl; return r&&r.day?String(r.day):r&&r.t?String(r.t).slice(0,10):S.data.nb&&S.data.nb.day?String(S.data.nb.day):""; }
function cnlRows(){
  var r=S.data.cnl; if(!r||!r.ok) return [];
  var day=cnlDay(), nms=CNL_K.map(function(x){ return x[1]; });
  return (r.rows||[]).filter(function(x){ return String(x.t||"").slice(0,10)===day&&nms.indexOf(x.tgt)>=0; });
}
function cnlCell(k, c){
  if(!c) return { pill:dxPill("off","정보 없음"), sb:["제보 없음"] };
  if(k==="h"){ var hl=Number(c.lv)||0; return { pill:dxPill(hl>=3?"warn":hl===1?"ok":"off",CNL_HLV[hl]||"-"), sb:[cnlHm(c.at)+" 기준 · "+(CNL_SRC[c.s]||"-")] }; }
  var lv=String(c.lv||""), st=lv==="jam"?"warn":lv==="ok"?"ok":"off", d="";
  if(c.d) d="단계 직접";
  else if(c.q!=null) d=(k==="a"?"기다림 ":"줄 ")+n0(c.q)+"명"+(c.m?" · 약 "+(Math.round(Number(c.m)))+"분":"");
  return { pill:dxPill(st,CNL_LV[lv]||"-"), sb:(d?[d]:[]).concat([cnlHm(c.at)+" 기준 · "+(CNL_SRC[c.s]||"-")]) };
}
function cnlCard(){
  var r=S.data.cnl, er=S.err.cnl, n=r&&r.ok&&r.crowd&&r.crowd.n?r.crowd.n:null, rows=cnlRows();
  var off=n&&n.on===0?tag("앱 표시 꺼짐","warn"):"";
  var body;
  if(!r&&!er) body='<div class="cap">불러오는 중</div>';
  else if(!r||!r.ok) body='<div class="cap">불러오지 못했습니다 · '+esc(why(er||r))+'</div>';
  else body='<div class="cnl-g">'+CNL_K.map(function(x){ var v=cnlCell(x[0], n?n[x[0]]:0); return '<div class="cnl-c"><div class="nm"><span>'+esc(x[1])+'</span>'+v.pill+'</div>'+v.sb.map(function(t){ return '<div class="sb">'+esc(t)+'</div>'; }).join("")+'</div>'; }).join("")+'</div>';
  return '<div class="dx-sh"><h2>지금 현장</h2><span class="cap">참가자 앱 홈 · 스태프 제보 · 다음 제보까지 그대로</span>'+off+
    '<span class="dx-shr"><button class="btn sm" type="button" id="cnlBtn" onclick="cnlOpen()">오늘 기록 <b style="margin-left:4px;font-variant-numeric:tabular-nums">'+n0(rows.length)+'</b></button></span></div><div class="card mb">'+body+'</div>';
}
function cnlVal(a){ a=String(a||""); return a.indexOf("혼잡도 ")===0?a.slice(4):a; }
function cnlOpen(re){
  if(re&&DRW.k!=="cnlog") return;
  var all=cnlRows(), day=cnlDay(), f=CNL.f, cnt={};
  all.forEach(function(x){ cnt[x.tgt]=(cnt[x.tgt]||0)+1; });
  var rows=f==="all"?all:all.filter(function(x){ return x.tgt===f; });
  var ch='<div class="chips mt">'+[["all","전체",all.length]].concat(CNL_K.map(function(x){ return [x[1],x[2],cnt[x[1]]||0]; })).map(function(c){
    return '<button type="button" class="chip'+(f===c[0]?" on":"")+'" aria-pressed="'+(f===c[0])+'" onclick="CNL.f=\''+esc(c[0])+'\';cnlOpen()">'+esc(c[1])+'<span class="c">'+n0(c[2])+'</span></button>'; }).join("")+'</div>';
  var tb=rows.length?'<table class="cnl-t"><thead><tr><th>시각</th><th>칸</th><th>값</th><th>역할</th></tr></thead><tbody>'+rows.map(function(x){
    return '<tr><td>'+esc(String(x.t||"").slice(11,19))+'</td><td>'+esc(x.tgt)+'</td><td class="v">'+esc(cnlVal(x.act))+'</td><td>'+esc(x.role)+'</td></tr>'; }).join("")+'</tbody></table>':'<div class="cap mt">오늘 제보 없음</div>';
  var sub=(day?day.slice(5).replace("-","/")+" 0시부터 · ":"")+"새것 먼저 · "+n0(all.length)+"건";
  drwOpen("cnlog", drwHead("지금 현장 · 오늘 기록", sub)+ch+'</div><div class="card">'+tb+'</div>', { wide:1, label:"지금 현장 오늘 기록" });
}
