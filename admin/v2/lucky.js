/* AXF CONTROL v2 · 행운권 탭 현황 · 명단 · 종이 대비 (261021 행운권 탭 설계 · 사용자 261021 D1~D10)
 * 현황 = raffle_board(관리코드 · 읽기 · 5초) · 추첨 통 기준 숫자 한 갈래 · 점검 띠 · 장수별 · 자격 대비 · 발급 흐름 · 서버 밖 사본(/__ax/info backup)
 * 명단 = roster_export raffle(슈퍼관리자 · POST) 한 번 → 엑셀(rosterdl.js rdlXlsx) · CSV · 번호만 · 종이 추첨 키트(lkit.js) · 화면 표 · 폴더 자동 보관(10분 · 최근 8세트)
 * 종이 대비 = 준비 점검표(이 PC) · 계산기 · 키트 받기 · 새 탭 미리 보기 · 선언 문구 복사
 * 진행 칩 = stage.js dc* 그대로 + 시험 페이지 링크 · 리허설 중(16:00 전) · 추첨 설정 접이식(drawset.js · dset.js 칸)
 * 마지막 받은 시각 · 대조 코드 = 이 PC(localStorage) */
var LKY={ busy:"", ld:0, ldAt:0, ldErr:"", tkey:"", rows:null, rt:"", rfp:"", rm:0, rn:0, view:"no", info:null, infoAt:0, dir:null, dirN:"", auto:null, autoAt:"", autoErr:"", setOpen:true };   /* 261022 추첨 설정 칩 = 설정 칸 펼친 채로(원격 진행이 맨 아래 접힘) */
/* 261024 럭키드로우 첫 화면 「1. 추첨 대상」 명단 표(lkui.js) · 같은 표 부품 · 따로 받은 것만(LKY_U) · 「명단 불러오기」 · 「표 새로 받기」를 누를 때만 받음 · 자동 받기(lkyLoad) 없음 · 칸 id 접두 lku */
var LKY_U={ rows:null, rt:"", rfp:"", rm:0, rn:0, view:"no", tkey:"", busy:0, err:"", h:360,
  cw:{ no:84, emp:64, name:62, dept:130, c:74, win:52, at:92, nos:118 }, cwE:{ dept:100 } };   /* 첫 화면 좁은 칸 = 7열이 1280 폭 왼쪽 열에 다 보이게(넓으면 비율대로 늘어남 · 좁으면 표 안 가로 스크롤) · 장수 구분 짧게(전체 글자는 title) */
var LKY_I={ tb:"lkyTb", vw:"lkyVw", rt:"lkyRt", no:"lkyno", emp:"lkyemp" }, LKY_UI={ tb:"lkuTb", vw:"lkuVw", rt:"lkuRt", no:"lkuno", emp:"lkuemp" };
var LKY_K={ xlsx:"엑셀", csv:"CSV", txt:"번호만", kit:"종이 추첨 키트" };
/* 추첨 설정 칩은 진행 칩 안 접이식으로(drawset.js 가 넣은 칩을 뺀다 · 옛 주소 #stage/set = 진행 · 설정 펼침) */
(function(){ for(var i=SG_SUBS.length-1;i>=0;i--) if(SG_SUBS[i][0]==="set") SG_SUBS.splice(i,1); })();
(function(){ var f0=routeFix; routeFix=function(tab, sub){
  if(tab==="stage"&&sub==="set"){ LKY.setOpen=true; return ["stage","draw"]; }
  if(tab==="stage"&&(sub==="ik"||sub==="type"||sub==="lk7")) return ["prize",sub];
  return f0(tab, sub); }; })();
(function(){ var m=String(location.hash||"").replace(/^#/,"").split("/"); if(m[0]==="stage"&&m[1]){ var rf=routeFix("stage",m[1]); if(rf){ S.tab=rf[0]; S.sub[rf[0]]=rf[1]; try{ history.replaceState(null,"","#"+rf[0]+"/"+rf[1]); }catch(e){} } } })();
function lkyNeed(s){ return [{ k:"rfb", a:"raffle_board", ttl:5000 }]; }
/* 행운권 명단 받기는 이 함수 한 곳(받기 단추 · 키트 · 미리 보기 · 표 자동 받기 · 폴더 보관 모두) */
function lkyRoster(){ return call("roster_export",{ kind:"raffle" },60000); }
function lkyTop(){ return typeof isTop==="function"?isTop():false; }
function lkyLast(k){ var v=lsGet("lky_"+(k||"any"),null); return v&&v.ts?v:null; }
function lkyAgo(ts){ var m=Math.floor((Date.now()-ts)/60000); return m<1?"방금":m+"분 전"; }
function lkyHms(t){ var m=String(t||"").match(/(\d{2}):(\d{2}):(\d{2})/); return m?m[0]:(hm(t)||"-"); }
function lkyAgoT(t){ var m=String(t||"").match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):?(\d{2})?/); if(!m) return ""; var d=new Date(m[1],m[2]-1,m[3],m[4],m[5],m[6]||0), x=Math.floor((srvNow()-d)/60000); return x<1?"방금":x<120?x+"분 전":Math.floor(x/60)+"시간 전"; }
function lkyEvDay(){ var b=S.data.nb; return !!(b&&b.day&&b.day===b.ev); }
/* ── 현황 · 점검 띠 ── */
function lkyChecks(b){
  var out=[], L=lkyLast(), t=srvNow(), hmv=t.getHours()*60+t.getMinutes(), ev=lkyEvDay(), I=LKY.info&&LKY.info.backup;
  if(ev&&hmv>=540&&hmv<=1050&&(!L||Date.now()-L.ts>1800000)) out.push(["warn","명단을 30분 넘게 받지 않았습니다 · 마지막 "+(L?L.at:"-"),'<button class="btn sm" type="button" onclick="lkyGet(\'kit\')">키트 받기</button>']);
  if(L&&L.fp&&b.fp&&L.fp!==b.fp) out.push(["warn","받은 뒤 번호가 늘었습니다 · 새 번호 "+n0(Math.max(0,num(b.m)-num(L.m)))+"장 · 다시 받기",'<button class="btn sm" type="button" onclick="lkyGet(\'kit\')">다시 받기</button>']);
  if(b.pool&&(num(b.pool.balls)!==num(b.m)||num(b.pool.n)!==num(b.n))) out.push(["bad","통 숫자가 서로 다릅니다 · 현황 "+n0(b.m)+"장 · 추첨 통 "+n0(b.pool.balls)+"장",""]);
  if(I&&(I.state==="fail"||(I.ageMin!=null&&I.ageMin>30))) out.push(["bad","서버 밖 사본이 30분 넘게 없습니다"+(I.lastOk&&I.lastOk.at?" · 마지막 "+fmtD(String(I.lastOk.at).replace("T"," ").slice(0,16)):""),""]);
  var nb=S.data.nb, scr=nb&&nb.draw?nb.draw.scr:null;
  if(ev&&hmv>=1020&&(scr==null||scr>15)) out.push(["warn","추첨 화면(노트북) 보고가 없습니다",'<button class="btn sm" type="button" onclick="go(\'stage\',\'draw\')">진행 칩</button>']);
  var cut=String(b.cut||"").slice(11,16); if(b.cut&&cut!=="17:00") out.push(["warn","행운권 마감 시각이 17:00 이 아닙니다 · 지금 "+String(b.cut).slice(5,16),""]);
  if(b.cond) out.push(["warn","행운권 참석조건 ON · 추첨 통이 체크인한 사람으로 바뀝니다",""]);
  return out;
}
function lkyInfoPull(){
  if(Date.now()-LKY.infoAt<60000) return; LKY.infoAt=Date.now();
  var u=String(BE||"").replace(/\/exec$/,"/__ax/info"); if(u===BE){ LKY.info={ ok:false }; return; }
  var ctl=window.AbortController?new AbortController():null, to=setTimeout(function(){ if(ctl) ctl.abort(); },8000);
  fetch(u,{ cache:"no-store", signal:ctl?ctl.signal:undefined }).then(function(r){ return r.ok?r.json():null; }).then(function(j){ clearTimeout(to); LKY.info=j||{ ok:false }; paint(); }).catch(function(){ clearTimeout(to); LKY.info={ ok:false }; paint(); });
}
function lkyR2H(){
  var I=LKY.info, B=I&&I.backup;
  if(!I) return '<p class="cap">확인 중</p>';
  if(!B) return rowH("서버 밖 사본","확인할 수 없음 · 이 서버는 상태를 내지 않음",tag("모름","off"));
  if(B.state==="ok") return rowH("R2 자동 백업 정상","마지막 "+(B.ageMin!=null?B.ageMin+"분 전":"-")+" · 10분마다",tag(B.ageMin!=null&&B.ageMin>30?"늦음":"정상",B.ageMin!=null&&B.ageMin>30?"bad":"ok"));
  if(B.state==="fail") return rowH("R2 자동 백업 실패","직전 성공 "+(B.ageMin!=null?B.ageMin+"분 전":"-"),tag("실패","bad"));
  return rowH("R2 자동 백업",B.state==="none"?"아직 첫 백업 전":"상태 모름",tag("모름","off"));
}
function lkyFlowH(b){
  var f=b.flow||[]; if(!f.length) return '<p class="cap">아직 발급이 없습니다</p>';
  var rows=f, mx=0, best=null;
  if(b.fl10){ var m={}; f.forEach(function(x){ m[x[0]]=x[1]; }); var a=f[0][0], z=f[f.length-1][0], t2=srvNow(), nowK=("0"+t2.getHours()).slice(-2)+":"+Math.floor(t2.getMinutes()/10)+"0"; if(nowK>z&&nowK<="23:50") z=nowK;
    rows=[]; var h=+a.slice(0,2), mi=+a.slice(3,5); while(true){ var k=("0"+h).slice(-2)+":"+("0"+mi).slice(-2); rows.push([k,m[k]||0]); if(k>=z||rows.length>200) break; mi+=10; if(mi>=60){ mi=0; h++; } } }
  rows.forEach(function(x){ if(x[1]>mx){ mx=x[1]; best=x; } });
  return '<div class="lky-flow" role="img" aria-label="발급 흐름">'+rows.map(function(x){ var hp=mx?Math.max(2,Math.round(x[1]*100/mx)):0; return '<div class="lky-fb" title="'+esc(x[0])+' · '+n0(x[1])+'장"><i style="height:'+hp+'%"></i><span>'+(b.fl10?(/:00$/.test(x[0])?esc(x[0].slice(0,2)):""):esc(x[0]))+'</span></div>'; }).join("")+'</div>'+
    '<p class="cap mt4">'+(b.fl10?"10분 칸 · 최고 10분 ":"날짜 칸 · 최고 하루 ")+'<b class="n">'+n0(mx)+'</b>장'+(best?" · "+esc(best[0]):"")+'</p>';
}
function lkyDlRow(kinds, big){
  var top=lkyTop();
  var bt=kinds.map(function(k,i){ var on=LKY.busy===k, L=lkyLast(k);
    return '<div class="lky-dl"><button type="button" class="btn'+(i===0?" pri":"")+(big?" big":"")+'" onclick="lkyGet(\''+k+'\')"'+(top&&!LKY.busy?"":" disabled")+'>'+(on?"받는 중":esc(LKY_K[k]))+'</button><span class="cap n">'+(L?esc(L.at)+" · "+n0(L.m)+"장 · "+esc(L.fp||""):"아직 받지 않음")+'</span></div>'; }).join("");
  return '<div class="lky-dls">'+bt+'</div>'+(typeof rdlPathH==="function"?'<p class="cap mt4">'+rdlPathH("lky","cap")+'</p>':'')+(top?'':'<p class="cap mt4">슈퍼관리자가 받습니다</p>');
}
function lkyMount(s){
  if(s==="list") return '<div id="lkyBand"></div><div class="card"><h2>명단 받기 <span class="cap">무대 추첨 통과 같은 번호 · 받는 순간 서버 한 번</span></h2><div id="lkyDl"></div></div>'+
    '<div class="card mt"><h2>명단 <span class="cap" id="lkyRt"></span><span class="r"><button class="btn sm" type="button" id="lkyVw" onclick="lkyView()">사람 단위</button><button class="btn sm" type="button" onclick="lkyGet(\'view\')">표 새로 받기</button></span></h2><div id="lkyTb"></div></div>'+
    '<div class="card mt" id="lkyAuto"></div>';
  if(s==="paper") return '<div id="lkyBand"></div><div class="grid g2 s1"><div class="col"><div class="card"><h2>종이 추첨 키트 <span class="cap">서버가 멈추면 이 파일 하나로 쪽지 인쇄부터 당첨 기록까지 · 인터넷 없이 열림</span></h2><div id="lkyDl"></div><div class="btns mt"><button class="btn" type="button" onclick="lkyPreview()"'+(lkyTop()?"":" disabled")+'>새 탭에서 미리 보기</button></div><p class="cap mt" id="lkyCalc"></p></div>'+
    '<div class="card"><h2>선언 문구 <span class="cap">복사해 단톡 · MC 에게</span></h2><div id="lkyMsg"></div></div></div>'+
    '<div class="card"><h2>준비 점검 <span class="cap">이 PC 에 저장</span></h2><div id="lkyChk"></div></div></div>';
  return '<div id="lkyBand"></div><p class="cap mb" id="lkyBase"></p><div class="grid g4 mb" id="lkyK"></div><div class="card mb"><div id="lkyDl"></div></div>'+
    '<div class="grid g2 s1 mb"><div class="card"><h2>장수별 인원 <span class="cap">추첨 통 기준</span></h2><div id="lkyBy"></div></div><div class="card"><h2>자격 대비 발급</h2><div id="lkyGap"></div></div></div>'+
    '<div class="card mb"><h2>발급 흐름</h2><div id="lkyFl"></div></div>'+
    '<div class="grid g2 s1"><div class="card"><h2>발급 방식</h2><ul class="lky-ul"><li>스탬프 4개 1장, 5개 2장, 6개 3장</li><li>앱을 열면 번호가 나옴</li><li>17:00 이후 새 번호 없음</li></ul></div><div class="card"><h2>서버 밖 사본</h2><div id="lkyR2"></div></div></div>';
}
function lkyPaint(s){
  var b=S.data.rfb, gt=dataGate("rfb","행운권 현황");
  var dl=el("lkyDl"); if(dl) dl.innerHTML=lkyDlRow(s==="paper"?["kit"]:s==="list"?["xlsx","csv","txt","kit"]:["xlsx","csv","kit"], s==="paper");
  if(s==="list"){ lkyTable(); lkyAutoPaint(); lkyLoad(); }
  if(s==="paper"){ lkyPaperPaint(b&&b.ok?b:null); }
  var bd=el("lkyBand"); if(!bd) return;
  if(gt){ bd.innerHTML=gt; return; }
  lkyInfoPull();
  bd.innerHTML=errTop("rfb")+lkyChecks(b).map(function(x){ return band(x[0],esc(x[1]),x[2]); }).join("");
  if(s!=="now") return;
  el("lkyBase").innerHTML='추첨 통 기준 · '+(b.closed?'<b>'+esc(String(b.cut).slice(11,16))+' 마감됨 · 새 번호 없음</b>':esc(String(b.cut||"").slice(11,16)||"17:00")+' 마감 전')+' · 기준 '+esc(fmtD(b.t));
  var L=lkyLast();
  el("lkyK").innerHTML=kpi({ l:"행운권", v:n0(b.m), u:"장", s:"추첨 통 기준" })+kpi({ l:"보유 인원", v:n0(b.n), u:"명", s:"추첨 통 기준" })+kpi({ l:"마지막 발급", v:b.last?lkyHms(b.last):"-", s:b.last?lkyAgoT(b.last):"아직 없음" })+
    kpi({ l:"대조 코드", v:b.fp||"-", st:L&&L.fp&&L.fp!==b.fp?"warn":"", s:L&&L.fp?(L.fp===b.fp?"받은 파일과 같음":"받은 파일 "+L.fp):"번호 집합 지문" });
  var by=b.by||{}, mx=Math.max(1,num(by[1]),num(by[2]),num(by[3]));
  el("lkyBy").innerHTML='<table class="tb"><tbody>'+[1,2,3].map(function(k){ var v=num(by[k]); return '<tr><td>'+k+'장</td><td class="n"><b>'+n0(v)+'</b>명</td><td class="barc" style="width:55%"><div class="bar"><i style="width:'+Math.round(v*100/mx)+'%"></i></div></td></tr>'; }).join("")+'</tbody></table>';
  var g=b.gap;
  el("lkyGap").innerHTML=g?'<p class="lky-gap n">자격 <b>'+n0(g.elig)+'</b>장 · 발급 <b>'+n0(g.got!=null?g.got:b.m)+'</b>장 · '+(b.closed?'마감으로 못 받은 <b>'+n0(g.miss)+'</b>장':'번호 전 <b>'+n0(g.miss)+'</b>장')+'</p><p class="cap mt4">'+(b.closed?"17:00 마감 뒤 앱을 연 사람은 새 번호가 없음":"번호 전 = 자격이 있지만 아직 앱을 열지 않은 사람의 장수")+'</p>':'<p class="cap">계산 중</p>';
  el("lkyFl").innerHTML=lkyFlowH(b);
  el("lkyR2").innerHTML=lkyR2H();
}
/* ── 받기 ── */
function lkyCsvQ(v){ v=csvCell(v); return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }
function lkyGet(k){
  if(!lkyTop()){ toast("슈퍼관리자가 받습니다",{ bad:1 }); return; }
  if(LKY.busy) return;
  LKY.busy=k; paint();
  lkyRoster().then(function(r){
    LKY.busy="";
    if(!(r&&r.ok)){ paint(); var L=lkyLast(); toast("받지 못했습니다 · "+why(r)+(L?" · 마지막 받은 파일 "+L.at:""),{ bad:1, ms:6000 }); return; }
    var x=lkyTake(r);
    if(k==="view"){ paint(); toast("명단을 받았습니다 · "+n0(x.m)+"장"); return; }
    var f=lkyFile(k, r, x); rdlSave(f.blob, f.name);
    var now=new Date(), p=function(n){ return ("0"+n).slice(-2); }, rec={ ts:Date.now(), at:p(now.getHours())+":"+p(now.getMinutes()), fp:x.fp, m:x.m, n:x.n, k:k };
    lsSet("lky_"+k, rec); lsSet("lky_any", rec);
    if(typeof rdlNote==="function") rdlNote("lky", f.name);
    paint();
    var b=S.data.rfb, warn=r.cond?" · 참석조건 ON":b&&b.ok&&b.fp&&b.fp!==x.fp&&b.m===x.m?" · 현황 대조 코드와 다름":"";
    toast("받았습니다 · "+f.name+" · "+n0(x.m)+"장 · "+n0(x.n)+"명"+warn+(typeof RDL_WHERE==="string"?" · "+RDL_WHERE:""),{ ms:9000, bad:!!warn });
  });
}
function lkyTake(r, P){
  P=P||LKY; var rows=r.rows||[], fp=lkFp(rows.map(function(x){ return String(x.no); }));
  P.rows=rows; P.rt=r.t; P.rfp=fp; P.rm=rows.length; P.rn=num(r.n);
  return { fp:fp, m:rows.length, n:num(r.n), st:rdlStamp(r.t) };
}
function lkyFile(k, r, x){
  var st=x.st, base=st.f+"_"+x.m+"장";
  if(k==="xlsx"){ var rr={}; for(var q in r) rr[q]=r[q]; rr.fp=x.fp; var sh=rdlSheet("raffle", rr, st); return { name:"행운권명단_"+base+".xlsx", blob:new Blob([rdlXlsx(sh)],{ type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }) }; }
  if(k==="csv"){ var t="\ufeff사번,소속,직위,성명,행운권 번호,당첨,발급 시각\r\n"+(r.rows||[]).map(function(o){ return [o.emp,o.dept,o.pos||"",o.name,o.no,o.win||"",o.at||""].map(lkyCsvQ).join(","); }).join("\r\n")+"\r\n";
    return { name:"행운권명단_"+base+".csv", blob:new Blob([t],{ type:"text/csv;charset=utf-8" }) }; }
  if(k==="txt"){ return { name:"행운권번호_"+base+".txt", blob:new Blob([(r.rows||[]).map(function(o){ return o.no; }).join("\r\n")+"\r\n"],{ type:"text/plain;charset=utf-8" }) }; }
  return { name:"행운권키트_"+base+".html", blob:new Blob([lkKitHtml(lkyKitData(r, x))],{ type:"text/html;charset=utf-8" }) };
}
function lkyKitData(r, x){ return { t:x.st.s, m:x.m, n:x.n, fp:x.fp, rows:(r.rows||[]).map(function(o){ return [String(o.no), String(o.emp||""), String(o.name||""), String(o.dept||""), String(o.pos||""), String(o.win||"")]; }) }; }
function lkyPreview(){
  if(!lkyTop()){ toast("슈퍼관리자가 받습니다",{ bad:1 }); return; }
  var w=window.open("","_blank"); if(!w){ toast("새 탭이 막혔습니다 · 팝업 허용",{ bad:1 }); return; }
  try{ w.document.write('<p style="font:14px sans-serif;padding:16px">불러오는 중</p>'); }catch(e){}
  lkyRoster().then(function(r){
    if(!(r&&r.ok)){ try{ w.close(); }catch(e){} toast("받지 못했습니다 · "+why(r),{ bad:1 }); return; }
    var x=lkyTake(r), u=URL.createObjectURL(new Blob([lkKitHtml(lkyKitData(r, x))],{ type:"text/html;charset=utf-8" }));
    try{ w.location.href=u; }catch(e){} setTimeout(function(){ URL.revokeObjectURL(u); },60000); paint();
  });
}
/* ── 명단 표 ── */
function lkyView(u){ var P=u?LKY_U:LKY, I=u?LKY_UI:LKY_I; P.view=P.view==="no"?"emp":"no"; var g=MG[P.view==="no"?I.no:I.emp]; var root=g&&XG.root?XG.root(g):null; if(root) root.remove(); paint(); }
/* 261024 첫 화면 명단 · 누를 때만 roster_export raffle 한 번(oplog roster_dl 한 줄) · 받는 중 다시 누름 무시 */
function lkyUGet(){
  if(!lkyTop()){ toast("슈퍼관리자가 받습니다",{ bad:1 }); return; }
  if(LKY_U.busy) return; LKY_U.busy=1; LKY_U.err=""; paint();
  lkyRoster().then(function(r){ LKY_U.busy=0;
    if(r&&r.ok){ var x=lkyTake(r, LKY_U); paint(); toast("명단을 불러왔습니다 · "+n0(x.m)+"장"); }
    else { LKY_U.err=why(r); paint(); toast("불러오지 못했습니다 · "+why(r),{ bad:1 }); } }, function(){ LKY_U.busy=0; LKY_U.err="연결 실패"; paint(); });
}
/* 261022 칩을 열면 바로 통을 받아 전체 표(줄 수 상한 없음) · 5초 갱신은 표를 다시 만들지 않음(번호가 늘었을 때만 본문 줄만 바꿔 스크롤 · 검색 유지) */
function lkyLoad(){
  if(!lkyTop()||LKY.busy||LKY.ld) return;
  var b=S.data.rfb, need=!LKY.rows?(Date.now()-LKY.ldAt>20000):(b&&b.ok&&num(b.m)!==LKY.rm&&Date.now()-LKY.ldAt>60000);
  if(!need) return; LKY.ld=1; LKY.ldAt=Date.now();
  lkyRoster().then(function(r){
    LKY.ld=0;
    if(r&&r.ok){ LKY.ldErr=""; lkyTake(r); } else LKY.ldErr=why(r);
    if(el("lkyTb")) lkyTable(); }, function(){ LKY.ld=0; LKY.ldErr="연결 실패"; if(el("lkyTb")) lkyTable(); });
}
/* 261022 발급 시각 열 = 서버 roster_export raffle at(MM-DD HH:mm) · 번호 단위 = 그 번호 · 사람 단위 = 마지막 발급 */
function lkyTier(c){ return c>=3?"스탬프 6개 · 3장":c===2?"스탬프 5개 · 2장":"스탬프 4개 · 1장"; }
function lkyTable(P, I){
  P=P||LKY; I=I||LKY_I;
  var box=el(I.tb); if(!box) return;
  var vw=el(I.vw), rt=el(I.rt); if(vw) vw.textContent=P.view==="no"?"사람 단위":"번호 단위";
  if(rt) rt.textContent=P.rows?"기준 "+fmtD(P.rt)+" · "+n0(P.rm)+"장 · "+n0(P.rn)+"명 · 대조 코드 "+P.rfp:"";
  if(!P.rows){ box.innerHTML='<p class="cap">'+(!lkyTop()?"슈퍼관리자가 받습니다":P.ldErr?"불러오지 못했습니다 · "+esc(P.ldErr)+" · 곧 다시 시도":"불러오는 중")+'</p>'; P.tkey=""; return; }
  var key=P.view+"|"+P.rt+"|"+P.rm, id=P.view==="no"?I.no:I.emp, g=MG[id], root=g&&XG.root?XG.root(g):null;
  if(root&&P.tkey===key&&box.contains(root)) return;   /* 같은 데이터 · 같은 보기 = 그대로 둠 */
  var cnt={}; P.rows.forEach(function(o){ cnt[o.emp]=(cnt[o.emp]||0)+1; });
  var chips=[["all","전체",null],["c1","1장",function(r){ return r.c===1; }],["c2","2장",function(r){ return r.c===2; }],["c3","3장",function(r){ return r.c>=3; }],["win","당첨 표시",function(r){ return !!r.win; }]];
  var onRow=function(k){ var e=String(k).split(":")[0]; if(typeof pcOpen==="function") pcOpen(e); };
  var tier={ k:"c", t:"장수 구분", w:150, v:function(r){ return lkyTier(r.c); } };
  if(P.cw) tier.f=function(r){ return esc(lkyTier(r.c).replace("스탬프 ","")); };
  var rows, spec;
  if(P.view==="no"){
    rows=P.rows.map(function(o){ return { no:String(o.no), emp:o.emp, name:o.name, dept:o.dept, pos:o.pos||"", c:cnt[o.emp], win:o.win||"", at:o.at||"" }; });
    spec={ file:"행운권 명단", ph:"번호 · 사번 · 이름 찾기", key:function(r){ return r.emp+":"+r.no; }, sort:{ k:"no", d:1 }, onRow:onRow, chips:chips, all:1,
      cols:[{ k:"no", t:"행운권 번호", w:100 },{ k:"emp", t:"사번", w:90 },{ k:"name", t:"이름", w:100 },{ k:"dept", t:"소속", w:200 },tier,{ k:"win", t:"당첨", w:110 },{ k:"at", t:"발급 시각", w:100 }],
      empty:"번호가 없습니다", h:P.h||640 };
  } else {
    var Q={}, ord=[]; P.rows.forEach(function(o){ var p=Q[o.emp]; if(!p){ p=Q[o.emp]={ emp:o.emp, name:o.name, dept:o.dept, pos:o.pos||"", nos:[], win:"", at:"" }; ord.push(p); } p.nos.push(String(o.no)); if(o.win&&!p.win) p.win=o.win; if(o.at&&o.at>p.at) p.at=o.at; });
    rows=ord.map(function(p){ return { emp:p.emp, name:p.name, dept:p.dept, pos:p.pos, c:p.nos.length, nos:p.nos.join(" · "), win:p.win, at:p.at }; });
    spec={ file:"행운권 보유자", ph:"번호 · 사번 · 이름 찾기", key:function(r){ return r.emp; }, sort:{ k:"c", d:-1 }, onRow:onRow, chips:chips, all:1,
      cols:[{ k:"emp", t:"사번", w:90 },{ k:"name", t:"이름", w:100 },{ k:"dept", t:"소속", w:200 },tier,{ k:"nos", t:"행운권 번호", w:170 },{ k:"win", t:"당첨", w:110 },{ k:"at", t:"발급 시각", w:100 }],
      empty:"번호가 없습니다", h:P.h||640 }; }
  if(P.cw){ var cw=Object.assign({}, P.cw, P.view==="no"?{}:P.cwE); spec.cols=spec.cols.map(function(c){ return Object.assign({}, c, { w:cw[c.k]||c.w }); }); }
  g=gridOf(id, spec); g.o=Object.assign({ id:id }, spec);
  if(root&&box.contains(root)){ XG.set(g, rows); }   /* 틀 · 스크롤 · 검색 칸 유지 · 본문 줄만 */
  else { box.innerHTML='<div id="mg_'+id+'"></div>'; XG.set(g, rows, el("mg_"+id)); }
  P.tkey=key;
}
/* ── 폴더 자동 보관(D7 · 크롬 계열 폴더 권한 · 이 탭이 열려 있는 동안 10분마다 · 이름에 「자동」 · 최근 8세트만) ── */
function lkyDirOk(){ return typeof window.showDirectoryPicker==="function"; }
function lkyAutoPaint(){
  var b=el("lkyAuto"); if(!b) return;
  if(!lkyDirOk()||!lkyTop()){ b.hidden=true; return; } b.hidden=false;
  b.innerHTML='<h2>폴더에 자동 보관 <span class="cap">10분마다 · 이 탭이 열려 있는 동안 · 엑셀 + 키트 · 최근 8세트</span></h2>'+
    (LKY.dir?rowH("켜짐 · "+LKY.dirN, LKY.autoErr?"마지막 실패 · "+LKY.autoErr:LKY.autoAt?"마지막 보관 "+LKY.autoAt:"첫 보관 중", '<button class="btn sm" type="button" onclick="lkyAutoOff()">끄기</button>'):
      '<div class="btns"><button class="btn" type="button" onclick="lkyAutoOn()">폴더 고르기</button></div><p class="cap mt4">OneDrive 밖 폴더 · 행사 뒤 폴더째 지움</p>');
}
function lkyAutoOn(){
  window.showDirectoryPicker({ mode:"readwrite" }).then(function(h){ LKY.dir=h; LKY.dirN=h.name||"폴더"; LKY.autoErr=""; clearInterval(LKY.auto); LKY.auto=setInterval(lkyAutoRun,600000); lkyAutoRun(); paint(); }, function(){});
}
function lkyAutoOff(){ clearInterval(LKY.auto); LKY.auto=null; LKY.dir=null; paint(); toast("자동 보관을 껐습니다"); }
function lkyAutoRun(){
  var d=LKY.dir; if(!d||!lkyTop()) return;
  lkyRoster().then(function(r){
    if(!(r&&r.ok)){ LKY.autoErr=why(r); paint(); return; }
    var x=lkyTake(r), fs=[lkyFile("xlsx",r,x), lkyFile("kit",r,x)];
    fs.forEach(function(f){ f.name=f.name.replace(/^(행운권명단|행운권키트)_/,"$1_자동_"); });
    var w=function(f){ return d.getFileHandle(f.name,{ create:true }).then(function(fh){ return fh.createWritable(); }).then(function(ws){ return ws.write(f.blob).then(function(){ return ws.close(); }); }); };
    Promise.all(fs.map(w)).then(function(){ var n=new Date(), p=function(v){ return ("0"+v).slice(-2); }; LKY.autoAt=p(n.getHours())+":"+p(n.getMinutes())+" · "+n0(x.m)+"장"; LKY.autoErr="";
      var rec={ ts:Date.now(), at:p(n.getHours())+":"+p(n.getMinutes()), fp:x.fp, m:x.m, n:x.n, k:"auto" }; lsSet("lky_any", rec); lsSet("lky_kit", rec); lsSet("lky_xlsx", rec);
      return lkyPrune(d); }).then(function(){ paint(); }, function(e){ LKY.autoErr=String(e&&e.name||"쓰기 실패"); paint(); });
  });
}
function lkyPrune(d){
  if(!d.values) return Promise.resolve();
  var names=[], it=d.values();
  var step=function(){ return it.next().then(function(r){ if(r.done) return; if(r.value.kind==="file"&&/^행운권(명단|키트)_자동_\d{4}_\d{4}_\d+장\.(xlsx|html)$/.test(r.value.name)) names.push(r.value.name); return step(); }); };
  return step().then(function(){ var keep={}; ["명단","키트"].forEach(function(t){ names.filter(function(n){ return n.indexOf("행운권"+t)===0; }).sort().reverse().slice(0,8).forEach(function(n){ keep[n]=1; }); });
    return Promise.all(names.filter(function(n){ return !keep[n]; }).map(function(n){ return d.removeEntry(n).catch(function(){}); })); });
}
/* ── 종이 대비 ── */
var LKY_CHK=[["kit","키트 마지막 받은 시각이 30분 안"],["prn","프린터 시험 인쇄 완료"],["paper","쪽지 용지 수량"],["box","통"],["cut","가위 또는 절단기"],["sheet","당첨 기록지"]];
function lkyPaperPaint(b){
  var c=el("lkyChk"); if(!c) return;
  var ck=lsGet("lky_chk",{})||{}, L=lkyLast("kit"), m=b?num(b.m):L?num(L.m):0, P=Math.ceil(m/LKIT_PER);
  c.innerHTML=LKY_CHK.map(function(x){ var auto=x[0]==="kit", on=auto?!!(L&&Date.now()-L.ts<=1800000):!!ck[x[0]];
    return '<label class="lky-ck"><input type="checkbox"'+(on?" checked":"")+(auto?" disabled":' onchange="lkyChk(\''+x[0]+'\',this.checked)"')+'> <span>'+esc(x[1])+(auto?' <span class="cap">'+(L?esc(L.at)+" · "+lkyAgo(L.ts):"아직 받지 않음")+'</span>':x[0]==="paper"&&P?' <span class="cap">A4 '+n0(P)+'장 + 여유</span>':'')+'</span></label>'; }).join("");
  el("lkyCalc").innerHTML=m?'지금 <b class="n">'+n0(m)+'</b>장 → 쪽지 <b class="n">'+n0(P)+'</b>쪽 · 인쇄 약 '+n0(Math.max(1,Math.ceil(P/10)))+'분(분당 10쪽) · 자르기 · 접기 약 '+n0(Math.max(1,Math.ceil(m/4/60)))+'분(스태프 4명)':'';
  var hhmm=L?L.at:"HH:MM", n=L?n0(L.m):"N";
  var msgs=[["비상 선언 단톡","비상 모드 · "+hhmm+" · 서버 응답 없음 · 럭키드로우는 "+hhmm+" 명단 "+n+"장으로 종이 추첨"],["해제 단톡","재개 · HH:MM · 서버 정상"],
    ["MC 추첨 시작","앱 점검으로 오늘 럭키드로우는 "+hhmm.replace(":","시 ")+"분까지 발급된 행운권 번호로 종이 추첨을 합니다. 번호를 두 번 읽겠습니다."],["MC 안내(필요할 때)","이후에 받으신 번호는 이번 추첨에 포함되지 않습니다."],["MC 응답 없음","다시 뽑겠습니다."]];
  el("lkyMsg").innerHTML=msgs.map(function(x,i){ return '<div class="row"><div class="t"><b>'+esc(x[0])+'</b><span id="lkyM'+i+'">'+esc(x[1])+'</span></div><button class="btn sm" type="button" onclick="lkyCopy('+i+')">복사</button></div>'; }).join("");
}
function lkyChk(k,v){ var c=lsGet("lky_chk",{})||{}; c[k]=v?1:0; lsSet("lky_chk",c); }
function lkyCopy(i){ var t=(el("lkyM"+i)||{}).textContent||""; var done=function(){ toast("복사했습니다"); };
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done,function(){ toast("복사하지 못했습니다",{ bad:1 }); }); else toast("복사하지 못했습니다",{ bad:1 }); }
/* ── 진행 칩 · 시험 페이지 · 리허설 중 · 추첨 설정 접이식 ── */
function lkyDrawTop(){ return '<div class="btns mb" style="align-items:center">'+(stageDim()?tag("리허설 중","off"):"")+'<a class="btn sm" style="flex:none" href="'+esc(scrUrl("../../draw/test.html"))+'" target="axf_drawtest" rel="noopener">시험 페이지 열기</a><span class="cap">시험 페이지 = 서버 연결 없음</span></div>'; }
function lkyDrawSet(){ return '<details class="memo card mt" id="lkySet"'+(LKY.setOpen?" open":"")+' ontoggle="LKY.setOpen=this.open;if(this.open)lkyDrawSetPaint()"><summary>추첨 설정 · 17F 입구 체크인 코드 · 시간 · 마감 · 참석조건</summary><div id="dwsB" class="mt">'+skel()+'</div><div id="dsBox" class="mt"></div></details>'; }
function lkyDrawSetMount(){ try{ if(typeof dsTop==="function"&&dsTop()){ dsPaint(); dsLoad(); } }catch(e){} }
function lkyDrawSetPaint(){ if(!LKY.setOpen||!el("dwsB")) return; try{ dwsPaint(); }catch(e){} }
