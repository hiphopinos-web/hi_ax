/* AXF CONTROL v2 · S3 사람 (261016 2단계)
 * 칩 = 찾기 · 가입자 · 접속 허용 · 스태프 · 10F 사전 신청 · 10F 출석 · 17F 출석 · 명단 올리기
 * 찾기 = acct_page(q · 명부에만 있는 사람 포함) · 어느 명단이든 줄을 누르면 오른쪽 서랍에 한 사람 카드
 * 한 사람 카드 = person_card + list_get(att10 · att17, q = 사번)
 *   처리 = 스탬프 부여(stamp_grant · 확인 창 · 되돌리기 토스트) · 취소(stamp_revoke dry → 확인 창) · PIN 초기화(acct_pwreset)
 *          이 사람에게 푸시(알림 탭 받는 사람 칩) · 한 사람 초기화(test_reset dry → 확인 문구 「처음상태」 · 행사일 실사번은 서버가 거절 eventday)
 * 명단 = list_get(visit · gate · staff · pre10 · test · att10 · att17) · 261016 저녁 접속 허용 · 스태프 · 10F 사전 신청 · 시험 사번 = 선택 칸 · 추가 · 선택 삭제(edit.js · table.js) · 명단 올리기 = upload.js(10F 사전 신청 · 접속 허용 · 스태프 옷) · 261016 PIN 없음 */
var PP_SUBS=[["find","찾기"],["visit","가입자"],["gate","접속 허용"],["staff","스태프"],["pre10","10F 사전 신청"],["test","시험 사번"],["att10","10F 출석"],["att17","17F 출석"],["up","명단 올리기"]];
var PP_LG={
  visit:{ kind:"visit", file:"가입자", cap:"앱에 가입한 사람 · 시험 사번은 「시험」 칸", sort:{ k:"last", d:-1 }, chips:lgChipsOf("",[["today","오늘 접속"],["pin","PIN 대기"],["test","시험"]]) },
  gate:{ kind:"gate", file:"접속 허용", cap:"클로즈 베타 · 사전 신청 기간에 앱에 들어올 사람 · 추가 · 선택 삭제 · 통째 바꾸기는 명단 올리기", cx:1, sort:{ k:"at", d:-1 }, chips:lgChipsOf("",[["acct","가입"],["today","오늘 접속"]]) },
  staff:{ kind:"staff", file:"스태프", cap:"폰 권한(앱 스태프 화면) + 스태프 옷 명단 · 추가 · 선택 삭제 · 통째 바꾸기는 명단 올리기", cx:1, sort:{ k:"name", d:1 }, chips:ppNoWear(lgChipsOf("",[["app","폰 권한"],["wear","옷"],["today","오늘 접속"]]),"staff"), sheets:function(v){ return [ppPivot(v,"staff")]; } },
  pre10:{ kind:"pre10", file:"10F 사전 신청", cap:"10F 실습 세션 A~E 사전 신청자 · 추가 · 선택 삭제 · 줄을 누르면 세션 바꾸기", cx:1, sort:{ k:"sn", d:1 }, chips:ppNoWear(lgChipsOf("sn",[["kit","키트 받음"],["att","출석"]]),"pre10"), sheets:function(v){ return [ppPivot(v,"pre10")]; } },
  test:{ kind:"test", file:"시험 사번", cap:"스탬프 · 순위 숫자에서 빠지는 사번 · 추가 · 선택 삭제", cx:1, sort:{ k:"emp", d:1 }, chips:lgChipsOf("",[["acct","가입"],["today","오늘 접속"]]) },
  att10:{ kind:"att10", file:"10F 출석", cap:"10F 세션 입장 · 종료 QR", sort:{ k:"pn", d:1 }, chips:lgChipsOf("pn",[["out","종료"]]) },
  att17:{ kind:"att17", file:"17F 출석", cap:"17F 강연 입장 · 종료", sort:{ k:"pn", d:1 }, chips:lgChipsOf("pn",[["out","종료"]]) }
};
function ppSub(){ return subsOf(PP_SUBS,"find"); }
SCREENS.people={
  title:"사람", desc:"",
  need:function(){ var s=ppSub();
    if(s==="find") return S.ui.pq?[{ k:"pfind", a:"acct_page", p:{ q:S.ui.pq, n:50, sort:"last" }, ttl:30000 }]:[];
    if(s==="up") return [];
    var nd=[{ k:"pl_"+s, a:"list_get", p:{ kind:PP_LG[s].kind }, ttl:60000 }];
    if(s==="pre10") nd.push({ k:"pl_kit", a:"list_get", p:{ kind:"kit" }, ttl:60000 });   /* 옷 열 = 옷 신청 명단(kit)을 사번으로 붙인다 */
    return nd; },
  mount:function(vb){
    var s=ppSub();
    el("phCap").textContent=s==="find"?"사번 · 이름으로 찾기 · 줄을 누르면 한 사람 카드":s==="up"?"엑셀로 명단 바꾸기 · 미리 세기 → 적용":PP_LG[s].cap;
    var h=chipsH(PP_SUBS,s);
    if(s==="up"){ vb.innerHTML=h+'<div id="ppUp"></div>'; if(S.ui.pup&&UP&&UP.sp.people) upMount(el("ppUp")); else ppUpPick(); return; }
    if(s==="find"){
      gridOf("pfind",{ file:"찾기 결과", key:function(r){ return r.emp; }, sort:{ k:"last", d:-1 }, noDl:1, onRow:function(k){ pcOpen(k, MG.pfind); },
        cols:[{ k:"name", t:"이름", w:110, tags:function(r){ return r.test?" "+tag("시험","off"):""; } },{ k:"emp", t:"사번", w:90 },{ k:"dept", t:"부서", w:150 },
          { k:"acct", t:"가입", w:80, v:function(r){ return r.acct?"가입":"명부만"; }, f:function(r){ return r.acct?tag("가입","ok"):tag("명부만","off"); } },{ k:"n", t:"스탬프", type:"num", w:70, v:function(r){ return r.acct?r.n:""; } },
          { k:"last", t:"최근 접속", type:"date", w:110 },{ k:"pw", t:"PIN", w:80, v:function(r){ return !r.acct?"":r.pw?"있음":"초기화 대기"; } }], h:420, empty:"찾는 사람이 없습니다 · 명부에도 없는 사번 · 이름입니다" });
      vb.innerHTML=h+'<div class="card"><div class="pp-find"><input class="xg-q pp-q" id="ppQ" type="search" autocomplete="off" placeholder="사번 · 이름 · 부서" aria-label="사람 찾기" value="'+esc(S.ui.pq||"")+'" onkeydown="if(event.key===\'Enter\'&&!event.isComposing){ event.preventDefault(); peopleQ(this.value); }"><button class="btn pri" type="button" onclick="peopleQ(el(\'ppQ\').value)">찾기</button><span class="cap">명부에만 있는 사람(가입 전)도 나옵니다 · 어느 화면에서든 / 를 누르면 위 찾기 칸</span></div><div id="mg_pfind" class="mt"></div></div>';
      if(!S.ui.pq) setTimeout(function(){ var i=el("ppQ"); if(i&&document.activeElement!==el("gq")) i.focus(); },30);
      return;
    }
    var x=PP_LG[s];
    gridOf("pp_"+s,{ file:x.file, key:function(r){ return r.emp; }, sort:x.sort, chips:[["all","전체",null]], lgChips:x.chips, sheets:x.sheets, cols:[{ k:"emp", t:"사번", w:90 }], lg:x.kind, h:520, onRow:function(k){ pcOpen(k, MG["pp_"+s]); },
      select:!!x.cx, onAdd:x.cx?function(){ paOpen(s); }:null, cancel:x.cx?ppCx(s):null });
    vb.innerHTML=h+'<div class="card"><div id="mg_pp_'+s+'"></div></div>';
  },
  paint:function(){
    var s=ppSub();
    if(s==="up") return;
    if(s==="find"){ var g=MG.pfind, d=S.data.pfind;
      if(!S.ui.pq){ g.gate=""; XG.set(g, null, el("mg_pfind")); var n=XG.root(g); if(n) n.querySelector('[data-c="note"]').innerHTML=emptyH("사번이나 이름을 넣고 Enter"); return; }
      var gt=dataGate("pfind","사람 찾기"); g.gate=gt||""; XG.set(g, gt?null:(d.rows||[]), el("mg_pfind"));
      if(!gt&&S.ui.pqOpen&&!S.busy.pfind){ S.ui.pqOpen=0; if((d.rows||[]).length===1) pcOpen(d.rows[0].emp, g); }
      return; }
    var x=PP_LG[s], g2=MG["pp_"+s]; gridPaint("pp_"+s, "pl_"+s, x.file, function(){ var rr=lgRows("pl_"+s, g2, function(dd){ return dd.rows||[]; }); if(s==="pre10") ppWearCol(g2); return rr; });
  }
};
function peopleQ(q){ q=String(q||"").trim(); S.ui.pq=q; S.ui.pqOpen=1; S.at.pfind=0; S.data.pfind=null; if(S.tab==="people"&&ppSub()==="find"){ var i=el("ppQ"); if(i) i.value=q; paint(); load(true,["pfind"]); } else go("people","find"); }
function ppStale(){ Object.keys(S.at).forEach(function(k){ if(/^pl_|^pfind$/.test(k)) S.at[k]=0; }); }

/* ── 261016 옷 · 10F 사전 신청 명단의 「옷」 열 · 「미선택」 칩 · 엑셀 둘째 시트 「옷 수량」(종류 · 사이즈 × 세션) ──
 * 옷 값 = list_get kit(옷 신청 · 사전 신청 키트 · 스태프 옷 · 라운지 사전)을 사번으로 붙인다 · 못 받았으면 pre10 줄의 size
 * 스태프 명단은 그 줄의 의류 · 사이즈로 같은 모양 시트(열 = 합계) */
var KIT_SZ=["SS","L","2XL","3XL"], KIT_GS=["pre10","staff","lounge"];
var KIT_GN={ pre10:"키트", staff:"스태프 옷", lounge:"라운지 키트" }, KIT_GL={ pre10:"사전 신청 키트", staff:"스태프 옷", lounge:"라운지 사전 키트" };
var KIT_SES=[["fld","세션 A"],["ta","세션 B"],["tb","세션 C"],["aws","세션 D"],["ms1","세션 E 1회차"],["ms2","세션 E 2회차"]];
function ppKitMap(){ var d=S.data.pl_kit; if(!d||d.ok===false||!Array.isArray(d.rows)) return null; if(d._m) return d._m; var m={}; d.rows.forEach(function(r){ if(r.emp&&!m[r.emp]) m[r.emp]=r; }); d._m=m; return m; }
/* 한 사람 옷 = { st:"sz"(고름) | "none"(미선택) | "out"(옷 명단 밖), g, sz, how } */
function ppWear(r, kind){
  if(kind==="staff") return !r.wear?{ st:"out" }:r.sz?{ st:"sz", g:"staff", sz:r.sz }:{ st:"none", g:"staff" };
  var m=ppKitMap();
  if(!m) return r.size?{ st:"sz", g:"pre10", sz:r.size }:r.role?{ st:"out" }:{ st:"none", g:"pre10" };
  var k=m[r.emp]; if(!k) return { st:"out" };
  return k.sz?{ st:"sz", g:k.g||"pre10", sz:k.sz, how:k.how }:{ st:"none", g:k.g||"pre10" };
}
function ppWearT(w){ return w.st==="sz"?(KIT_GN[w.g]||w.g)+" "+w.sz:w.st==="none"?"미선택":"옷 명단 밖"; }
function ppNoWear(base, kind){ return function(rows){ return base(rows).concat([["f:nowear","미선택",function(r){ return ppWear(r,kind).st==="none"; }]]); }; }
/* 서버 열(useCols) 뒤에 「옷」 열 · 서버 「사이즈」 자리에 넣는다 */
function ppWearCol(g){
  if(g.o.cols.some(function(c){ return c.k==="wear10"; })) return;
  var col={ k:"wear10", t:"옷", w:110, v:function(r){ return ppWearT(ppWear(r)); },
    f:function(r){ var w=ppWear(r); return w.st==="sz"?'<span class="cap">'+esc(KIT_GN[w.g]||w.g)+'</span> <b>'+esc(w.sz)+'</b>'+(w.how==="자동"?' <span class="cap">자동</span>':''):w.st==="none"?tag("미선택","warn"):tag("옷 명단 밖","off"); } };
  var i=-1; g.o.cols.forEach(function(c,j){ if(c.k==="size") i=j; });
  if(i>=0) g.o.cols.splice(i,1,col); else { g.o.cols.forEach(function(c,j){ if(c.k==="role"||(i<0&&c.k==="name")) i=j; }); g.o.cols.splice(i+1,0,col); }
  var root=XG.root(g); if(root) root.remove();
}
/* 옷 수량 시트 · 행 = 종류 · 사이즈(+ 미선택 · 옷 명단 밖 · 합계) · 열 = 세션(pre10) 또는 없음(staff) + 합계 · 합계 = 시트 1 줄 수 */
function ppPivot(rows, kind){
  var ses=kind==="pre10"?KIT_SES.slice():[], known={};
  ses.forEach(function(x){ known[x[0]]=1; });
  if(kind==="pre10") rows.forEach(function(r){ var id=String(r.sid||""); if(!known[id]){ known[id]=1; ses.push([id, r.sn||id||"세션 없음"]); } });
  var cnt={}, line=function(key){ if(!cnt[key]){ cnt[key]={ t:0 }; ses.forEach(function(x){ cnt[key][x[0]]=0; }); } return cnt[key]; };
  var keys=[]; KIT_GS.forEach(function(g){ KIT_SZ.forEach(function(z){ keys.push(g+"|"+z); }); });
  var extra=[];
  rows.forEach(function(r){ var w=ppWear(r,kind), key=w.st==="sz"?w.g+"|"+w.sz:w.st, c=line(key);
    if(w.st==="sz"&&keys.indexOf(key)<0&&extra.indexOf(key)<0) extra.push(key);
    c.t++; if(kind==="pre10") c[String(r.sid||"")]++; });
  var main=kind==="staff"?"staff":"pre10";
  var order=keys.filter(function(k){ return k.indexOf(main+"|")===0||cnt[k]; }).concat(extra).concat(["none","out"].filter(function(k){ return k==="none"||cnt[k]; }));
  var nums=function(c){ return ses.map(function(x){ return c?c[x[0]]:0; }).concat([c?c.t:0]); };
  var aoa=[["종류","사이즈"].concat(ses.map(function(x){ return x[1]; })).concat(["합계"])];
  order.forEach(function(k){ var p=k.split("|"), lab=p.length>1?[KIT_GL[p[0]]||p[0], p[1]]:[k==="none"?"미선택":"옷 명단 밖",""]; aoa.push(lab.concat(nums(cnt[k]))); });
  var tot=["합계",""].concat(ses.map(function(x){ return rows.filter(function(r){ return String(r.sid||"")===x[0]; }).length; })).concat([rows.length]);
  aoa.push(tot);
  return { name:"옷 수량", aoa:aoa, wch:[16,8].concat(ses.map(function(){ return 12; })).concat([8]) };
}

/* ── 명단 올리기 고르기 ── */
function ppUpPick(){
  var box=el("ppUp"); if(!box) return;
  box.innerHTML='<div class="grid g3">'+[["pre10","10F 사전 신청","사번 · 세션(A~E · E 1회 · 2회) · 이름 · 교체 또는 추가 · 키트 · 출석 자격이 함께 움직입니다"],["gate","접속 허용","사번 또는 이름 · 클로즈 베타 · 사전 신청 기간에 앱에 들어올 사람"],["kstaff","스태프 옷","사번 또는 이름 · 스태프 의류 명단 · 빠진 사람의 사이즈 몫이 풀립니다"]].map(function(x){
    return '<div class="card"><h2>'+esc(x[1])+'</h2><p class="cap">'+esc(x[2])+'</p><button class="btn pri mt" type="button" onclick="ppUpOpen(\''+x[0]+'\')">'+esc(x[1])+' 올리기</button></div>'; }).join("")+'</div>'+
    '<p class="cap mt">파일은 서버로 보내지 않고 고른 열만 줄 글자로 보냅니다 · 미리 세기에 문제 줄이 있으면 적용하지 않습니다 · 이름만 있는 줄은 명부에서 찾고, 같은 이름이 여럿이면 줄을 눌러 고릅니다</p>';
}
function ppUpOpen(k){ var sp={ pre10:PRE10_UP, gate:GATE_UP, kstaff:KSTAFF_UP }[k]; if(!sp) return; upOpen(sp); S.ui.pup=1; S.ui.lup=0; render(); el("main").scrollTop=0; }
function ppUpBack(){ S.ui.pup=0; UP=null; render(); load(false); }

/* ── 한 사람 카드(오른쪽 서랍) ── */
var STAMP8=[["lg","01","최초 로그인"],["qz","02","AX 퀴즈"],["p4","03","미니 게임"],["p5","04","아이디어 한 줄"],["p2","05","AX PLAY"],["st","06","계단 이용"],["p3","07","프로그램 참여"],["sv","08","설문"]];
var PROG=[["p3","17F 강연"],["p10","10F 실습"],["ln","1F AX 라운지"],["cc","18F 커피챗"]];
var PG_HALF={ p3:"p3h", p10:"p10h" };   /* 입장이나 끝 한쪽만 = 1개(서버 progUnits_ 와 같은 짝) */
var GRANT_IDS=["p2","p3","st"];   /* 서버 REVOKE_FIELD_IDS(담당자 부여 = 현장 셋) · 앱 자동 · 설문은 앱에서만 */
var PC={ emp:"", d:null, att:null, u:null, g:null, seq:0 };
var RESV_TAG={ "신청":"warn", "승인":"", "체크인":"", "완료":"ok", "노쇼":"bad", "취소":"off" };
function pcOpen(emp, g){ emp=normE(emp); if(!emp) return; PC.emp=emp; PC.g=g||null; PC.d=null; PC.att=null; PC.u=null; pcDraw(); pcLoad(); }
function pcLoad(){
  var e=PC.emp, s=++PC.seq; if(!e) return;
  call("person_card",{ emp:e, vn:10, tn:30 }).then(function(r){ if(s!==PC.seq) return; PC.d=r||{ ok:false }; pcDraw(); });
  Promise.all([call("list_get",{ kind:"att10", q:e }), call("list_get",{ kind:"att17", q:e })]).then(function(a){ if(s!==PC.seq) return; PC.att=a; pcDraw(); });
  if(typeof pcUsrLoad==="function") pcUsrLoad(e, s);   /* 261017 게임 · 닉네임(pcgame.js) */
}
function pcClosed(){ PC.emp=""; PC.seq++; }
function pcDraw(){
  var e=PC.emp; if(!e) return; var d=PC.d, k="pc:"+e, o={ g:PC.g, wide:1, label:"한 사람 카드", close:pcClosed };
  if(!d){ drwOpen(k, drwHead(e,"한 사람 카드")+skel()+'</div>', o); return; }
  if(!d.ok){ drwOpen(k, drwHead(e,"한 사람 카드")+band(d.reason==="notfound"?"warn":"bad", esc(d.reason==="notfound"?"명부에도 계정에도 없는 사번입니다":unknownSrv(d)?"이 서버는 아직 한 사람 카드를 모릅니다":"받지 못했습니다 · "+why(d)),'<button class="btn sm" type="button" onclick="pcLoad()">다시 시도</button>')+'</div>', o); return; }
  drwOpen(k, pcHtml(d), o);
}
function pcStamps(d){ return (d.stamps||[]).map(function(x){ return typeof x==="string"?{ id:x }:x; }); }
function stName(id){ var s=STAMP8.filter(function(x){ return x[0]===id; })[0], p=PROG.filter(function(x){ return x[0]===id; })[0]; return id==="p3h"?"07 17F 강연(한쪽)":id==="p10h"?"07 10F 실습(한쪽)":id==="ck"?"옛 사전등록 체크인(0개)":p&&id!=="p3"?"07 "+p[1]:s?s[1]+" "+s[2]:id; }
function pcHtml(d){
  var e=d.emp, J=jq(e), L=d.lists||{}, v=d.visit||{}, st=pcStamps(d), by={};
  st.forEach(function(x){ by[x.id]=x; });
  var pg=Math.min(2,(by.p3?2:by.p3h?1:0)+(by.p10?2:by.p10h?1:0)+(by.ln?2:0)+(by.cc?1:0));   /* 서버 progUnits_ 와 같은 셈 · ck = 0개 */
  var tags=(d.test||L.test?" "+tag("시험","off"):"")+(d.acct?"":" "+tag("가입 전","off"))+(L.staffApp?" "+tag("스태프"):"")+(d.ckno?" "+tag("체크인 "+d.ckno+"번"):"");
  var w=whoOf(d), h=drwHead(w.n||e, whoSub(d), whoFlags(w)+tags);
  h+='<div class="btns mt">'+(d.acct?'<button class="btn" type="button" onclick="pcPush(\''+J+'\')">이 사람에게 푸시</button>':'')+(d.acct&&d.pw?'<button class="btn" type="button" onclick="pcPinAsk(\''+J+'\')">PIN 초기화</button>':'')+'<button class="btn" type="button" onclick="pcLoad()">새로 받기</button></div>';
  /* 접속 */
  h+=pcSec("접속", d.acct?'가입 <b class="n">'+esc(fmtD(d.joined))+'</b> · 최근 <b class="n">'+esc(fmtD(d.last)||"-")+'</b> · 오늘 <b class="n">'+n0(v.today||0)+'</b>회 · PIN '+(d.pw?"있음":"초기화 대기")+' · 알림 기기 '+n0(d.push&&d.push.subs||0)+'대':'아직 가입 안 함(명부만)');
  /* 스탬프 */
  var cell=function(id, no, nm, sm){ var x=sm?null:by[id]||(id==="p3"&&by.p3h&&!by.p3?by.p3h:null), got=sm?pg>0:!!x, rid=id==="p3"&&!by.p3&&by.p3h?"p3h":id, act="";
    if(!sm&&x) act='<button class="btn sm dng" type="button" aria-label="'+esc(no+" "+nm)+' 스탬프 취소" onclick="stRevokeAsk(\''+J+'\',\''+rid+'\')">취소</button>';
    else if(!sm&&GRANT_IDS.indexOf(id)>=0&&d.acct) act='<button class="btn sm" type="button" aria-label="'+esc(no+" "+nm)+' 스탬프 부여" onclick="stGrantAsk(\''+J+'\',\''+id+'\')">부여</button>';
    var sub=sm?(pg?pg+"개":"-"):x?((x.at?fmtD(x.at):"받음")+(x.src&&x.src!=="본인"?" · "+(x.byName||x.src):"")+(rid==="p3h"?" · 한쪽":"")):"-";
    return '<div class="pc-c'+(got?" got":"")+'"><span class="no">'+esc(no)+'</span><b>'+esc(nm)+'</b><span class="cap">'+esc(sub)+'</span>'+act+'</div>'; };
  var pgRow=function(id, nm){ var hf=PG_HALF[id], x=by[id]||(hf&&by[hf]?by[hf]:null), rid=!by[id]&&hf&&by[hf]?hf:id, act="";
    if(x) act='<button class="btn sm dng" type="button" aria-label="07 '+esc(nm)+' 스탬프 취소" onclick="stRevokeAsk(\''+J+'\',\''+rid+'\')">취소</button>';
    else if(id==="p3"&&d.acct) act='<button class="btn sm" type="button" aria-label="07 '+esc(nm)+' 스탬프 부여" onclick="stGrantAsk(\''+J+'\',\'p3\')">부여</button>';
    var sub=x?((x.at?fmtD(x.at):"받음")+(x.src&&x.src!=="본인"?" · "+(x.byName||x.src):"")+(rid!==id?" · 한쪽":"")):"";
    return '<div class="pc-pr'+(x?" got":"")+'"><span class="t"><b>'+esc(nm)+'</b>'+(sub?'<span class="cap">'+esc(sub)+'</span>':'')+'</span>'+(act||'<span class="cap">'+(x?"":"없음")+'</span>')+'</div>'; };
  var rl=d.roulette||{};
  h+=pcSec('스탬프 <b class="n">'+Math.min(6,num(d.n))+' / 6</b> · 행운권 <b class="n">'+n0(d.tickets||0)+'</b>장',
    '<div class="pc-st">'+STAMP8.filter(function(s){ return s[0]!=="p3"; }).map(function(s){ return cell(s[0],s[1],s[2]); }).join("")+
    /* 261016 3단계 · 07 프로그램 참여 한 칸(세부 세 줄 · 상태 · 부여 · 취소 · 규칙 한 줄) */
    '<div class="pc-c pc-pg'+(pg?" got":"")+'"><div class="pc-pgh"><span class="no">07</span><b>프로그램 참여</b><span class="n pc-pgn">'+pg+' / 2</span></div><div class="cap">17F 강연 · 10F 실습 · 라운지 · 커피챗, 합쳐 최대 2개</div>'+
      PROG.map(function(p){ return pgRow(p[0],p[1]); }).join("")+'</div>'+(by.ck?cell("ck","0","옛 체크인(0개)"):"")+'</div>', 1);
  /* 261017 게임 · 닉네임(pcgame.js) */
  if(typeof pcGameHtml==="function") h+=pcGameHtml(d);
  /* 경품 · 옷 */
  var fx=d.fcfs, kit=d.kit, lg=d.lounge, gr=[];
  gr.push(rowH("룰렛", rl.used?"사용 "+fmtD(rl.at)+(rl.gn?" · "+rl.gn:""):"안 씀", rl.used?'<button class="btn sm" type="button" onclick="rlUndoAsk(\''+J+'\')">사용 취소</button>':tag("안 씀","off")));
  gr.push(rowH("선착순 가습기"+(fx&&fx.rk?" · 달성 "+n0(fx.rk)+"번째":""), !fx?"6개 전 · 달성순 · 17:00 마감":fx.st==="done"?"수령 "+fmtD(fx.gotAt)+(fx.gotBy?" · "+fx.gotBy:""):fx.st==="void"?"자격 취소됨":fx.st==="full"?"수량 넘음":"수령 전 · 17:00 마감", (fx&&fx.st==="done"?tag("받음","ok"):fx?tag("받기 전","off"):"")+(typeof pcFxBtns==="function"?pcFxBtns(d):"")));
  if(kit) gr.push(rowH(kit.pool==="staff"?"스태프 옷":"사전 신청 키트 · 옷", "사이즈 "+(kit.sz||"아직")+(kit.how==="auto"?"(자동)":"")+(kit.no?" · "+kit.no:""), kit.got?tag("받음 "+fmtD(kit.got),"ok"):tag("받기 전","off")));
  if(lg) gr.push(rowH("라운지 사전 신청 "+n0(lg.rk)+"번째", lg.kit?"키트":"가습기", lg.got?tag("받음 "+fmtD(lg.got),"ok"):tag("받기 전","off")));
  h+=pcSec("경품 · 옷 수령", gr.join(""));
  /* 라운지 · 커피챗 */
  var ap=[];
  (d.resv||[]).forEach(function(r){ ap.push(rowH("AX 라운지 상담 "+hm(r.slot), r.memo||"", tag(r.st,RESV_TAG[r.st]))); });
  if(d.cchat) ap.push(rowH("18F 커피챗", d.cchat.round?hm(d.cchat.round)+" · 테이블 "+(d.cchat.table||"-"):"희망 "+(d.cchat.pref||"언제든"), tag(d.cchat.st==="대기"?"희망":d.cchat.st==="매칭"?"선정":d.cchat.st, d.cchat.st==="완료"?"ok":d.cchat.st==="취소"?"off":d.cchat.st==="대기"?"warn":"")));
  h+=pcSec("라운지 · 커피챗", ap.length?ap.join(""):'<p class="cap">신청이 없습니다</p>');
  /* 출석 */
  h+=pcSec("출석", pcAtt(e)+(d.p10?'<div class="cap mt">10F 사전 신청 · '+esc(TEN_N[d.p10.sid]||d.p10.sid)+(d.p10.role?" · 운영진":"")+' · 키트 '+(d.p10.kit?"받음":"아직")+'</div>':''));
  /* 명단 */
  h+=pcSec("명단", typeof pcListsHtml==="function"?pcListsHtml(d):'<div class="fx-w">'+[["gate","접속 허용"],["staffApp","스태프 폰 권한"],["staffWear","스태프 옷"],["test","시험 사번"]].map(function(x){ return '<span class="pc-l">'+esc(x[1])+' '+(L[x[0]]?tag("있음","ok"):tag("없음","off"))+'</span>'; }).join("")+'</div>');
  /* 최근 기록 */
  var tl=(d.tl||[]).slice(0,10);
  h+=pcSec("최근 기록", tl.length?'<ul class="pc-tl">'+tl.map(function(r){ return '<li><span class="n cap">'+esc(fmtD(r.t))+'</span><span>'+esc((r.verb?r.verb+" · ":"")+r.x)+(r.byName||r.by?' <span class="cap">· '+esc(r.byName||r.by)+'</span>':'')+'</span></li>'; }).join("")+'</ul><div class="cap mt4">전체 기록 = 기록 · 설정 › 활동 기록</div>':'<p class="cap">기록이 없습니다</p>');
  /* 한 사람 초기화(pcgame.js · 261017 접힘을 풀어 칸으로) */
  if(typeof pcResetHtml==="function") h+=pcResetHtml(d);
  return h+'</div>';
}
function pcSec(t, body, raw){ return '<div class="pc-s"><h3>'+(raw?t:esc(t))+'</h3>'+body+'</div>'; }
function pcAtt(e){
  var a=PC.att; if(!a) return skel();
  var rows=[]; a.forEach(function(r,i){ if(r&&r.ok) (r.rows||[]).forEach(function(x){ if(normE(x.emp)===e) rows.push({ fl:i?"17F":"10F", pn:x.pn, "in":x["in"], out:x.out }); }); });
  if(!a.some(function(r){ return r&&r.ok; })) return '<p class="cap">출석 명단을 받지 못했습니다 · '+esc(why(a[0]))+'</p>';
  if(!rows.length) return '<p class="cap">출석 기록이 없습니다</p>';
  return '<table class="tb"><thead><tr><th>층</th><th>세션 · 강연</th><th>입장</th><th>종료</th></tr></thead><tbody>'+rows.map(function(x){ return '<tr><td>'+x.fl+'</td><td>'+esc(x.pn||"")+'</td><td class="n">'+esc(fmtD(x["in"])||"-")+'</td><td class="n">'+esc(fmtD(x.out)||"-")+'</td></tr>'; }).join("")+'</tbody></table>';
}
function pcAfter(){ ppStale(); S.at.nb=0; pcLoad(); load(false); }
function pcWho(emp){ return personLine(PC.d&&PC.d.ok&&normE(PC.d.emp)===normE(emp)?PC.d:{ emp:emp }); }
function pcNm(){ var d=PC.d; return d&&d.ok?(d.name||d.emp):PC.emp; }
function stGrantAsk(emp, id){
  confirmBox({ t:"스탬프를 부여할까요?", who:pcWho(emp), sub:stName(id)+(id==="p3"?" · 2개로 셈":"")+" · 참여 기록에 「담당자 부여」로 남습니다", ok:"부여",
    run:function(){ return call("stamp_grant",{ emp:emp, id:id }); },
    fail:function(r){ return r&&r.reason==="noid"?"부여할 수 없는 항목입니다":""; },
    done:function(r){ pcAfter(); if(r.dup){ toast("이미 있는 스탬프입니다 · "+stName(id)); return; } toast("부여했습니다 · "+(r.who||emp)+" · "+stName(id),{ undo:function(){ stRevokeGo(emp, id, 1); } }); } });
}
var ST_NO={ roulette:"룰렛을 이미 돌렸습니다 · 룰렛 사용 취소를 먼저 합니다", tickets:"행운권 번호가 이미 나갔습니다", fin:"참여상 대상 확정 뒤라 6개 아래로 내릴 수 없습니다", fcfs:"선착순 가습기를 이미 받았습니다", nostamp:"서버 기록에 이 스탬프가 없습니다", noid:"취소 범위 밖 항목입니다" };
function stRevokeAsk(emp, id){
  call("stamp_revoke",{ emp:emp, id:id, dry:1 }).then(function(x){
    x=x||{};
    if(!x.ok){ toast("취소할 수 없습니다 · "+(ST_NO[x.reason]||why(x)),{ bad:1, ms:5000 }); if(x.reason==="nostamp") pcLoad(); return; }
    confirmBox({ t:"스탬프를 취소할까요?", who:pcWho(emp), sub:stName(id)+" · 개수 "+num(x.n)+" → "+num(x.nAfter)+" · 행운권 "+n0(x.tickets||0)+"장 그대로 · 룰렛 "+(x.roulette?"사용함":"안 씀"),
      body:'<p class="cap">기록을 지우지 않고 「담당자 취소」 줄을 남깁니다. '+(GRANT_IDS.indexOf(id)>=0?'7초 안 토스트에서 되돌리기 · 그 뒤에는 「부여」로 다시 줌.':'되돌리기 없음 · 콘솔에서 다시 줄 수 없는 항목입니다.')+'</p>', ok:"취소 처리", danger:true,
      run:function(){ return call("stamp_revoke",{ emp:emp, id:id }); },
      fail:function(r){ return r&&ST_NO[r.reason]||""; },
      done:function(){ pcAfter(); toast("취소했습니다 · "+emp+" · "+stName(id), GRANT_IDS.indexOf(id)>=0?{ undo:function(){ stGrantGo(emp, id); } }:{}); } });
  });
}
function stRevokeGo(emp, id){ call("stamp_revoke",{ emp:emp, id:id }).then(function(r){ pcAfter(); toast(r&&r.ok?"되돌렸습니다 · "+stName(id):"되돌리지 못했습니다 · "+(r&&ST_NO[r.reason]||why(r)),{ bad:!(r&&r.ok) }); }); }
function stGrantGo(emp, id){ call("stamp_grant",{ emp:emp, id:id }).then(function(r){ pcAfter(); toast(r&&r.ok?"되돌렸습니다 · "+stName(id):"되돌리지 못했습니다 · "+why(r),{ bad:!(r&&r.ok) }); }); }
function pcPinAsk(emp){
  confirmBox({ t:"PIN 을 초기화할까요?", who:pcWho(emp), sub:"본인 확인(사원증 · 얼굴) 뒤 · 다음 로그인에서 넣는 4자리가 새 PIN · 로그인해 둔 다른 폰은 끊김", body:'<p class="cap">되돌릴 수 없습니다.</p>', ok:"PIN 초기화", danger:true,
    run:function(){ return call("acct_pwreset",{ emp:emp }); },
    done:function(r){ pcAfter(); toast("PIN 을 초기화했습니다 · "+(r.name||emp)+(r.already?" · 이미 초기화 상태":"")); } });
}
/* 261017 한 사람 초기화 · 칸은 pcgame.js pcResetHtml · 지우는 것 = 서버 dry plan · 남는 것 = 서버 TEST_RESET_TABS 밖 */
var RS_LBL={ game:"게임", type:"타자왕 현장", race:"타자 대전", nick:"닉네임", log:"스탬프 · 룰렛", raffle:"행운권", att:"출석", visit:"접속", drawin:"추첨 체크인", ideas:"아이디어", stairlog:"계단", stairleg:"계단 구간", resv:"라운지 상담", cchat:"커피챗", pwreq:"PIN 분실 요청", mark:"담당 표시", pin:"PIN" };
var RS_KEEP=[["계정","설문 응답","선착순","참여상","럭키드로우","재고 장부"],["옷 사이즈","번호표","체크인 번호","명단","알림 기기","운영로그"]];
var RS_DAY="행사일(10/26)에는 실제 사번을 초기화할 수 없습니다 · 테스트 사번은 됩니다";
function pcResetAsk(emp){
  call("test_reset",{ emp:emp, dry:"1" }).then(function(r){
    if(!(r&&r.ok)){ toast(r&&r.reason==="eventday"?RS_DAY:"확인하지 못했습니다 · "+why(r),{ bad:1, ms:5000 }); return; }
    var pl=r.plan||{}, ks=Object.keys(RS_LBL).filter(function(k){ return pl[k]; }), w=r.word||"처음상태";
    confirmBox({ t:"이 사람을 처음 상태로 돌릴까요?", who:personLine(PC.d&&PC.d.ok?PC.d:{ emp:emp, name:r.name }), sub:(r.test?"테스트 사번":"실제 사번")+(pl.pin?" · 로그인해 둔 폰은 끊김":"")+" · 되돌릴 수 없음",
      body:'<div class="cap">지우는 것</div>'+(ks.length?'<table class="tb"><tbody>'+ks.map(function(k){ return '<tr><td>'+esc(RS_LBL[k])+'</td><td class="n">'+(k==="pin"?"있음 · 비움":n0(pl[k])+"줄")+'</td></tr>'; }).join("")+'</tbody></table>':'<p class="cap">지울 기록이 없습니다</p>')+
        '<div class="cap mt4">남는 것</div>'+RS_KEEP.map(function(l){ return '<div class="cap">'+l.map(function(x){ return '<span style="white-space:nowrap">'+esc(x)+'</span>'; }).join(" · ")+'</div>'; }).join("")+
        '<label class="fld">확인 문구 「'+esc(w)+'」를 그대로 넣습니다<input class="in" id="rsQ" autocomplete="off" oninput="gateUpd()"></label>',
      focus:"rsQ", ok:"처음 상태로", danger:true, gate:function(){ var i=el("rsQ"); return !!i&&i.value.trim()===w; },
      run:function(){ return call("test_reset",{ emp:emp, confirm:w }); },
      fail:function(x){ return x&&x.reason==="eventday"?RS_DAY:x&&x.reason==="confirm"?"확인 문구가 맞지 않습니다":""; },
      done:function(x){ var n=0; Object.keys(x.done||{}).forEach(function(k){ n+=num(x.done[k]); }); pcAfter(); toast("처음 상태로 돌렸습니다 · "+(r.name||emp)+" · "+n0(n)+"건"); } });
  });
}
function pcPush(emp){ var d=PC.d||{}; ntAddPerson({ emp:emp, name:d.name||"", dept:d.dept||"" }); go("notify","send"); }
