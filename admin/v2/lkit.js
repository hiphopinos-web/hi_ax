/* AXF CONTROL v2 · 행운권 종이 추첨 키트 만들기 (261021 행운권 탭 설계 7-2 · 사용자 261021 「16시에 서버가 죽으면 살아 있는 대상자 위주로 종이 출력해 통에서 뽑는다」)
 * 키트 = HTML 한 파일 · 바깥 주소 · 글꼴 내려받기 없음(file:// · 인터넷 없이 열림) · 데이터 = roster_export raffle 한 번 부른 결과(무대 통과 같은 줄)
 *   쪽지 인쇄 = A4 세로 · 한 쪽 3열 × 8행 = 24칸(LKIT_PER) · 칸마다 가운데 큰 번호 + 아래 한 줄 「사번 · 이름」(소속 없음) · 자르는 선 = 가는 실선 한 가지 · 이름 글자 = 가장 긴 줄 기준 전체 한 크기(9pt 아래로는 그 칸만 맞춤) · 쪽 아래 「쪽 p/P · 이 쪽 a~b · n칸 · 대조 코드」 · 쪽 범위 골라 나눠 인쇄
 *   명단 인쇄 = 번호 → 사번 · 이름 · 소속(번호순 · 쪽마다 90줄) · 이름 가림 · 장수 대조 = 쪽마다 센 수 · 합계 맞음 · 부족 · 초과
 *   당첨 기록 = 6등 3 → 5등 2 → 4등 2 → 3등 1 → 2등 1 → 1등 1 · 번호 넣기 → 사람 · 같은 사람 두 번 당첨 막음 · 3 · 2 · 1등 부재 다시 뽑기 · 이 PC 저장 · CSV
 * 대조 코드(lkFp) = 정렬한 번호를 쉼표로 이은 글자의 FNV-1a 두 가지 · 서버 raffle_board fp(rafFp_)와 같은 셈 */
var LKIT_PER=24;
function lkFp(nos){
  var s=nos.slice().sort().join(","), h=0x811c9dc5, h2=0x01000193, i, c;
  for(i=0;i<s.length;i++){ c=s.charCodeAt(i); h=Math.imul(h^c,16777619)>>>0; h2=Math.imul(h2^c,2246822519)>>>0; }
  var x=("0000000"+h.toString(16)).slice(-8).toUpperCase(), y=("0000000"+h2.toString(16)).slice(-8).toUpperCase();
  return x.slice(0,4)+"-"+y.slice(0,4);
}
var LKIT_CSS=[
  "*{box-sizing:border-box;margin:0;padding:0}",
  "body{font-family:-apple-system,\"Segoe UI\",\"Malgun Gothic\",\"Apple SD Gothic Neo\",sans-serif;font-size:14px;line-height:1.5;color:#14171F;background:#F2F4F7;word-break:keep-all}",
  "button,input,select{font:inherit;color:inherit}",
  ".n{font-variant-numeric:tabular-nums}",
  ".wrap{max-width:1080px;margin:0 auto;padding:16px}",
  ".hd{background:#00205B;color:#fff;border-radius:12px;padding:16px 18px;margin-bottom:12px}",
  ".hd h1{font-size:22px}.hd p{font-size:13px;opacity:.85}",
  ".kp{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}",
  ".kp div{background:rgba(255,255,255,.1);border-radius:8px;padding:8px 10px}.kp span{display:block;font-size:12px;opacity:.8}.kp b{font-size:22px;font-variant-numeric:tabular-nums}",
  ".nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}",
  ".nav button{height:40px;padding:0 16px;border-radius:99px;border:1px solid #D1D5DB;background:#fff;font-weight:600;cursor:pointer}",
  ".nav button.on{background:#00205B;border-color:#00205B;color:#fff}",
  ".card{background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:14px 16px;margin-bottom:12px}",
  ".card h2{font-size:16px;margin-bottom:8px}",
  ".cap{font-size:12px;color:#6B7080}",
  ".row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}",
  ".btn{height:44px;padding:0 16px;border-radius:8px;border:1px solid #D1D5DB;background:#fff;font-weight:600;cursor:pointer}",
  ".btn.pri{background:#00205B;border-color:#00205B;color:#fff}.btn.dng{border-color:#E3B5B1;color:#A63A34}.btn:disabled{opacity:.45;cursor:default}",
  ".in{height:44px;border:1px solid #D1D5DB;border-radius:8px;padding:0 10px;background:#fff;width:96px}",
  ".big{font-size:28px;font-weight:700;width:150px;letter-spacing:.08em;text-align:center}",
  "table.tb{width:100%;border-collapse:collapse;font-size:13px}.tb th,.tb td{border-bottom:1px solid #EFF0F3;padding:6px 8px;text-align:left}.tb th{color:#4B5060;font-weight:600;background:#F9FAFB}",
  ".tb td.n,.tb th.n{text-align:right}",
  ".band{border-radius:8px;padding:10px 12px;font-size:14px;margin-top:10px;border:1px solid}",
  ".band.ok{background:#EAF5EF;color:#1E7B4F;border-color:#CFE6D9}.band.warn{background:#FFF3EA;color:#B84A00;border-color:#FFD6B8}.band.bad{background:#FBF0EF;color:#A63A34;border-color:#EFD3D0}.band.info{background:#EEF0F7;color:#00205B;border-color:#DFE3EF}",
  ".who{font-size:22px;font-weight:700}",
  ".slot{font-size:16px;font-weight:700;color:#00205B}",
  ".sec{display:none}.sec.on{display:block}",
  ".pr{display:none}",
  "@page{size:A4 portrait;margin:8mm}",
  "@media print{body{background:#fff}body[data-pr] .scr{display:none!important}body[data-pr=slips] .pr-slips,body[data-pr=list] .pr-list,body[data-pr=rec] .pr-rec{display:block}",
  ".pg{width:194mm;height:280mm;page-break-after:always;break-after:page;position:relative;overflow:hidden}.pg:last-child{page-break-after:auto;break-after:auto}",
  ".sg{display:grid;grid-template-columns:repeat(3,60mm);grid-auto-rows:33mm;margin:1mm auto 0;width:180mm}",
  ".sl{border-right:.2mm solid #A0A6B0;border-bottom:.2mm solid #A0A6B0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 3mm;min-width:0;overflow:hidden;color:#14171F}",
  ".sl:nth-child(3n+1){border-left:.2mm solid #A0A6B0}.sl:nth-child(-n+3){border-top:.2mm solid #A0A6B0}",
  ".sl b{font-size:36pt;font-weight:800;letter-spacing:1pt;line-height:1;font-variant-numeric:tabular-nums}",
  ".sl em{font-style:normal;font-size:12pt;font-weight:600;line-height:1.2;margin-top:2.5mm;color:#4B5060;white-space:nowrap;font-variant-numeric:tabular-nums}",
  ".ft{position:absolute;left:0;right:0;bottom:0;text-align:center;font-size:7pt;color:#9AA0AA;font-variant-numeric:tabular-nums}",
  ".lh{font-size:10pt;margin-bottom:2mm;display:flex;justify-content:space-between}",
  ".lt{display:grid;grid-template-columns:1fr 1fr;gap:4mm}",
  ".lt table{border-collapse:collapse;width:100%;font-size:8.5pt}.lt td,.lt th{border:.2mm solid #999;padding:.5mm 1.2mm;height:5.6mm;white-space:nowrap;overflow:hidden}.lt th{background:#eee}",
  ".rt{border-collapse:collapse;width:100%;font-size:10pt}.rt td,.rt th{border:.2mm solid #999;padding:1.5mm 2mm}}",
  "@media (max-width:640px){.kp{grid-template-columns:repeat(2,minmax(0,1fr))}}"
].join("\n");
/* 키트 안에서 도는 코드 · 함수 글자 그대로 파일에 넣는다(바깥 주소 없음) */
function LKIT_MAIN(){
  var D=JSON.parse(document.getElementById("kd").textContent);
  var R=D.rows, byNo={}, i;
  for(i=0;i<R.length;i++) byNo[R[i][0]]=R[i];
  var C=3, PER=C*8, P=Math.max(1,Math.ceil(R.length/PER)), LP=Math.max(1,Math.ceil(R.length/90));
  var SEQ=[[6,3],[5,2],[4,2],[3,1],[2,1],[1,1]];
  var KEY="axf_kit_"+D.fp+"_"+D.t;
  var st=load();
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){ return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]; }); }
  function n0(v){ return Number(v||0).toLocaleString("ko-KR"); }
  function load(){ try{ var v=JSON.parse(localStorage.getItem(KEY)||"null"); if(v&&v.rec) return v; }catch(e){} return { rec:[], cnt:{} }; }
  function save(){ try{ localStorage.setItem(KEY,JSON.stringify(st)); }catch(e){} }
  function hhmm(){ var d=new Date(), p=function(x){ return ("0"+x).slice(-2); }; return p(d.getHours())+":"+p(d.getMinutes())+":"+p(d.getSeconds()); }
  function csvCell(v){ v=String(v==null?"":v); return /^[=+@\-]/.test(v)?"'"+v:v; }
  function mask(s){ s=String(s||""); if(s.length<2) return s; if(s.length===2) return s[0]+"*"; return s[0]+new Array(s.length-1).join("*")+s[s.length-1]; }
  window.kGo=function(k){ ["slips","list","cnt","rec"].forEach(function(x){ $("s_"+x).className="sec"+(x===k?" on":""); $("b_"+x).className=x===k?"on":""; }); if(k==="cnt") cntPaint(); if(k==="rec") recPaint(); };
  /* 쪽지 */
  /* 이름 줄 글자 크기 · 가장 긴 줄에 맞춘 전체 한 크기(12pt 에서 줄임 · 9pt 아래로는 그 칸만 맞춤) · 칸 안 폭 54mm */
  function nmTxt(r){ return String(r[1])+' · '+String(r[2]||"-"); }
  function nmW(t,pt){ var c=nmW.c||(nmW.c=document.createElement("canvas").getContext("2d")); c.font="600 "+pt+"pt "+getComputedStyle(document.body).fontFamily; return c.measureText(t).width*25.4/96; }
  function nmFit(a,b){ var m=0, j; for(j=a;j<b;j++) m=Math.max(m,nmW(nmTxt(R[j]),12)); return m>54?Math.max(9,Math.floor(12*54/m*2)/2):12; }
  function slipPages(a,b){
    var h=[], p, j, s0=(a-1)*PER, e0=Math.min(R.length,b*PER), fz=nmFit(s0,e0);
    for(p=a;p<=b;p++){
      var s=(p-1)*PER, e=Math.min(R.length,p*PER), cells="";
      for(j=s;j<e;j++){ var t=nmTxt(R[j]), w=nmW(t,fz), z=w>54?Math.floor(fz*54/w*2)/2:fz; cells+='<div class="sl"><b>'+R[j][0]+'</b><em style="font-size:'+z+'pt">'+esc(t)+'</em></div>'; }
      h.push('<div class="pg"><div class="sg">'+cells+'</div><div class="ft">쪽 '+p+'/'+P+' · 이 쪽 '+R[s][0]+'~'+R[e-1][0]+' · '+(e-s)+'칸 · 대조 코드 '+esc(D.fp)+' · 기준 '+esc(D.t)+'</div></div>');
    }
    return h.join("");
  }
  window.kSlips=function(){
    var a=Math.max(1,Math.min(P,parseInt($("pa").value,10)||1)), b=Math.max(a,Math.min(P,parseInt($("pb").value,10)||P));
    if(!R.length){ alert("번호가 없습니다"); return; }
    $("prS").innerHTML=slipPages(a,b); document.body.setAttribute("data-pr","slips"); setTimeout(function(){ window.print(); },60);
  };
  /* 명단 */
  window.kList=function(){
    var m=$("lm").checked, h=[], p, half=function(s,e){ var t='<table><thead><tr><th>번호</th><th>사번</th><th>이름</th><th>소속</th></tr></thead><tbody>'; for(var j=s;j<e;j++){ var r=R[j]; t+='<tr><td><b>'+r[0]+'</b></td><td>'+esc(r[1])+'</td><td>'+esc(m?mask(r[2]):r[2])+'</td><td>'+esc(String(r[3]||"").slice(0,18))+'</td></tr>'; } return t+'</tbody></table>'; };
    for(p=1;p<=LP;p++){ var s=(p-1)*90, e=Math.min(R.length,p*90), mid=Math.min(e,s+45);
      h.push('<div class="pg"><div class="lh"><b>행운권 번호 명단 · 번호순</b><span>기준 '+esc(D.t)+' · 총 '+n0(D.m)+'장 · 대조 코드 '+esc(D.fp)+'</span></div><div class="lt">'+half(s,mid)+(mid<e?half(mid,e):'<div></div>')+'</div><div class="ft">명단 쪽 '+p+'/'+LP+' · '+R[s][0]+'~'+R[e-1][0]+' · 개인정보 · 당첨 확인용 1부</div></div>'); }
    $("prL").innerHTML=h.join(""); document.body.setAttribute("data-pr","list"); setTimeout(function(){ window.print(); },60);
  };
  window.addEventListener("afterprint",function(){ document.body.removeAttribute("data-pr"); });
  /* 장수 대조 */
  function cntPaint(){
    var h='<table class="tb"><thead><tr><th>쪽</th><th>번호 범위</th><th class="n">칸 수</th><th>센 수</th><th>결과</th></tr></thead><tbody>', p, sum=0, all=1;
    for(p=1;p<=P;p++){ var s=(p-1)*PER, e=Math.min(R.length,p*PER), want=e-s, v=st.cnt[p], got=v===""||v==null?null:Number(v);
      if(got==null) all=0; else sum+=got;
      h+='<tr><td>'+p+'</td><td class="n">'+R[s][0]+' ~ '+R[e-1][0]+'</td><td class="n">'+want+'</td><td><input class="in n" inputmode="numeric" value="'+(got==null?"":got)+'" oninput="kCnt('+p+',this.value)"></td><td>'+(got==null?'<span class="cap">아직</span>':got===want?'맞음':got<want?'<b style="color:#A63A34">부족 '+(want-got)+'</b>':'<b style="color:#A63A34">초과 '+(got-want)+'</b>')+'</td></tr>'; }
    h+='</tbody></table>';
    var d=sum-R.length;
    $("cntT").innerHTML=h; $("cntS").innerHTML='<div class="band '+(!all?"info":d===0?"ok":"bad")+'">센 수 합계 <b class="n">'+n0(sum)+'</b>장 · 총 <b class="n">'+n0(R.length)+'</b>장 · '+(!all?"아직 다 세지 않음":d===0?"맞음":d<0?"부족 "+n0(-d)+"장":"초과 "+n0(d)+"장")+'</div>';
  }
  window.kCnt=function(p,v){ v=String(v).replace(/\D/g,""); st.cnt[p]=v; save(); var a=document.activeElement, pos=a&&a.selectionStart; cntPaint(); var ins=$("cntT").querySelectorAll("input"); if(ins[p-1]){ ins[p-1].focus(); try{ ins[p-1].setSelectionRange(pos,pos); }catch(e){} } };
  /* 당첨 기록 */
  function live(){ return st.rec.filter(function(x){ return !x.x; }); }
  function slot(){ var L=live(), k, n; for(k=0;k<SEQ.length;k++){ n=L.filter(function(x){ return x.rk===SEQ[k][0]&&x.st==="win"; }).length; if(n<SEQ[k][1]) return { rk:SEQ[k][0], i:n+1, of:SEQ[k][1] }; } return null; }
  var CUR=null;
  window.kLook=function(){
    var v=String($("no").value).replace(/\D/g,""), msg=$("lk");
    CUR=null; if(!v){ msg.innerHTML=""; return; }
    v=("000"+v).slice(-4); var r=byNo[v], L=live(), sl=slot();
    if(!sl){ msg.innerHTML='<div class="band info">모든 등수를 마쳤습니다</div>'; return; }
    if(!r){ msg.innerHTML='<div class="band bad"><b>'+v+'</b> · 명단에 없는 번호입니다 · 번호를 다시 읽습니다</div>'; return; }
    var dupNo=L.filter(function(x){ return x.no===v; })[0], dupP=L.filter(function(x){ return x.emp===r[1]&&x.st==="win"; })[0];
    var who='<div class="who">'+esc(r[2]||"-")+'</div><div>'+esc(r[3]||"")+(r[4]?' · '+esc(r[4]):'')+' · 사번 '+esc(r[1])+'</div>'+(r[5]?'<div class="cap">서버 기록 · '+esc(r[5])+'</div>':'');
    if(dupNo){ msg.innerHTML='<div class="band bad"><b>'+v+'</b> · 이미 뽑힌 번호입니다('+dupNo.rk+'등 '+(dupNo.st==="win"?"당첨":"부재")+') · 다시 뽑기</div>'+who; return; }
    if(dupP){ msg.innerHTML='<div class="band bad">이미 당첨된 사람입니다('+dupP.rk+'등 · '+dupP.no+') · 다시 뽑기</div>'+who; return; }
    CUR={ no:v, r:r, sl:sl };
    msg.innerHTML='<div class="band ok"><b>'+v+'</b> · '+sl.rk+'등 '+sl.i+'/'+sl.of+'</div>'+who+'<div class="row"><button class="btn pri" type="button" onclick="kWin()">'+sl.rk+'등 당첨 확정</button>'+(sl.rk<=3?'<button class="btn dng" type="button" onclick="kAbs()">부재 · 다시 뽑기</button>':'')+'</div>';
  };
  function put(stv){ if(!CUR) return; st.rec.push({ at:hhmm(), rk:CUR.sl.rk, no:CUR.no, emp:CUR.r[1], name:CUR.r[2], dept:CUR.r[3], st:stv }); save(); CUR=null; $("no").value=""; $("lk").innerHTML=""; recPaint(); $("no").focus(); }
  window.kWin=function(){ put("win"); };
  window.kAbs=function(){ if(confirm("부재로 기록하고 같은 등수를 다시 뽑을까요?")) put("absent"); };
  window.kUndo=function(){ var L=st.rec, k; for(k=L.length-1;k>=0;k--) if(!L[k].x){ if(!confirm("마지막 기록을 취소할까요? "+L[k].rk+"등 · "+L[k].no+" · "+(L[k].name||""))) return; L[k].x=hhmm(); save(); recPaint(); return; } };
  function recPaint(){
    var sl=slot(), L=st.rec;
    $("slot").innerHTML=sl?'지금 <b>'+sl.rk+'등</b> · '+sl.i+' / '+sl.of+'명째':'모든 등수를 마쳤습니다';
    $("left").innerHTML=SEQ.map(function(s){ var n=live().filter(function(x){ return x.rk===s[0]&&x.st==="win"; }).length; return s[0]+'등 '+n+'/'+s[1]; }).join(" · ");
    $("recT").innerHTML=L.length?'<table class="tb"><thead><tr><th>순서</th><th>시각</th><th>등수</th><th>번호</th><th>사번</th><th>이름</th><th>소속</th><th>상태</th></tr></thead><tbody>'+L.map(function(x,k){ return '<tr'+(x.x?' style="opacity:.45;text-decoration:line-through"':'')+'><td class="n">'+(k+1)+'</td><td class="n">'+x.at+'</td><td>'+x.rk+'등</td><td class="n"><b>'+x.no+'</b></td><td>'+esc(x.emp)+'</td><td>'+esc(x.name)+'</td><td>'+esc(x.dept)+'</td><td>'+(x.x?"취소 "+x.x:x.st==="win"?"당첨":"부재")+'</td></tr>'; }).join("")+'</tbody></table>':'<p class="cap">아직 기록이 없습니다</p>';
    $("prR").innerHTML='<div class="lh"><b>행운권 종이 추첨 당첨 기록</b><span>기준 '+esc(D.t)+' · 총 '+n0(D.m)+'장 · 대조 코드 '+esc(D.fp)+'</span></div><table class="rt"><thead><tr><th>순서</th><th>시각</th><th>등수</th><th>번호</th><th>사번</th><th>이름</th><th>소속</th><th>상태</th></tr></thead><tbody>'+L.map(function(x,k){ return '<tr><td>'+(k+1)+'</td><td>'+x.at+'</td><td>'+x.rk+'등</td><td>'+x.no+'</td><td>'+esc(x.emp)+'</td><td>'+esc(x.name)+'</td><td>'+esc(x.dept)+'</td><td>'+(x.x?"취소":x.st==="win"?"당첨":"부재")+'</td></tr>'; }).join("")+'</tbody></table>';
  }
  window.kCsv=function(){
    var q=function(v){ v=csvCell(v); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
    var t="\ufeff순서,시각,등수,번호,사번,이름,소속,상태\r\n"+st.rec.map(function(x,k){ return [k+1,x.at,x.rk+"등",x.no,x.emp,x.name,x.dept,x.x?"취소":x.st==="win"?"당첨":"부재"].map(q).join(","); }).join("\r\n");
    var a=document.createElement("a"), u=URL.createObjectURL(new Blob([t],{ type:"text/csv" })); a.href=u; a.download="종이추첨_당첨기록_"+hhmm().replace(/:/g,"")+".csv"; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(u); a.remove(); },1500);
  };
  window.kRecPrint=function(){ recPaint(); document.body.setAttribute("data-pr","rec"); setTimeout(function(){ window.print(); },60); };
  $("pb").value=P; $("pN").textContent=P; $("lN").textContent=LP;
  $("no").addEventListener("keydown",function(e){ if(e.key==="Enter"){ if(CUR) kWin(); else kLook(); } });
  kGo("slips");
}
function lkKitHtml(d){
  var esc_=function(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){ return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]; }); };
  var json=JSON.stringify({ t:d.t, m:d.m, n:d.n, fp:d.fp, rows:d.rows }).replace(/</g,"\\u003c").split(String.fromCharCode(8232)).join("\\u2028").split(String.fromCharCode(8233)).join("\\u2029");
  var P=Math.max(1,Math.ceil(d.m/LKIT_PER));
  return '<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>행운권 종이 추첨 키트 '+esc_(d.t)+'</title><style>'+LKIT_CSS+'</style></head><body>'+
    '<div class="wrap scr"><div class="hd"><h1>행운권 종이 추첨 키트</h1><p>이 파일의 번호는 서버 추첨 통과 같은 기준입니다 · 인터넷 없이 열림 · 실명 · 소속이 들어 있어 OneDrive 밖에 두고 행사 뒤 지웁니다</p>'+
    '<div class="kp"><div><span>기준 시각</span><b>'+esc_(String(d.t).slice(5,16))+'</b></div><div><span>총 장수</span><b>'+Number(d.m).toLocaleString("ko-KR")+'</b></div><div><span>총 인원</span><b>'+Number(d.n).toLocaleString("ko-KR")+'</b></div><div><span>대조 코드</span><b>'+esc_(d.fp)+'</b></div></div></div>'+
    '<div class="nav"><button type="button" id="b_slips" onclick="kGo(\'slips\')">쪽지 인쇄</button><button type="button" id="b_cnt" onclick="kGo(\'cnt\')">장수 대조</button><button type="button" id="b_rec" onclick="kGo(\'rec\')">당첨 기록</button><button type="button" id="b_list" onclick="kGo(\'list\')">명단 인쇄</button></div>'+
    '<div class="sec" id="s_slips"><div class="card"><h2>쪽지 인쇄</h2><p>A4 세로 · 한 쪽 24칸(3열 × 8행) · 칸마다 번호 · 사번 · 이름 · 총 <b id="pN">'+P+'</b>쪽</p><p class="cap">인쇄 창에서 용지 A4 · 배율 100%(기본) · 머리글 · 바닥글 끔 · 프린터를 나누면 쪽 범위를 나눠 인쇄</p>'+
      '<div class="row"><label>쪽 <input class="in n" id="pa" value="1" inputmode="numeric"></label><span>~</span><input class="in n" id="pb" inputmode="numeric"><button class="btn pri" type="button" onclick="kSlips()">쪽지 인쇄</button></div>'+
      '<div class="band info">자르기 · 접기 뒤 쪽 단위로 묶어 셉니다 · 「장수 대조」에 쪽마다 센 수를 적습니다</div></div></div>'+
    '<div class="sec" id="s_cnt"><div class="card"><h2>장수 대조</h2><p class="cap">통에 넣기 전 · 쪽마다 센 쪽지 수 · 이 PC 에 저장</p><div id="cntS"></div><div id="cntT" class="mt"></div></div></div>'+
    '<div class="sec" id="s_rec"><div class="card"><h2>당첨 기록</h2><p class="slot" id="slot"></p><p class="cap" id="left"></p>'+
      '<div class="row"><input class="in big n" id="no" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="번호" oninput="kLook()"><button class="btn" type="button" onclick="kUndo()">마지막 기록 취소</button></div><div id="lk"></div></div>'+
      '<div class="card"><h2>기록 <span class="cap">종이 당첨 기록지가 정본 · 이 PC 에 저장</span></h2><div class="row"><button class="btn" type="button" onclick="kCsv()">CSV 저장</button><button class="btn" type="button" onclick="kRecPrint()">기록 인쇄</button></div><div id="recT" style="margin-top:10px"></div></div></div>'+
    '<div class="sec" id="s_list"><div class="card"><h2>명단 인쇄</h2><p>번호순 · 번호 → 사번 · 이름 · 소속 · 쪽마다 90줄 · 총 <b id="lN"></b>쪽 · 당첨 확인용 1부</p><div class="row"><label><input type="checkbox" id="lm"> 이름 가림(가운데 글자)</label><button class="btn pri" type="button" onclick="kList()">명단 인쇄</button></div></div></div>'+
    '</div><div class="pr pr-slips" id="prS"></div><div class="pr pr-list" id="prL"></div><div class="pr pr-rec" id="prR"></div>'+
    '<script type="application/json" id="kd">'+json+'</script><script>('+LKIT_MAIN.toString()+')();</script></body></html>';
}
