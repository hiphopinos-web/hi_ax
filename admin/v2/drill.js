/* AXF CONTROL v2 · 사람 수 숫자 → 명단 서랍 (261017 사용자 「6개 달성 4명이 누구인지 눌러 보고 싶다 · 눌러 확인하고 싶은 정보는 바로바로」)
 * 누를 수 있는 숫자 = drN(키, 값 html) · 네이비 밑줄 · 0 은 누르지 않는다(빈 명단)
 * 누르면 오른쪽 서랍(넓게) · 표 = 사번 · 소속 · 이름 + 그 숫자의 열 · 검색 · 엑셀(보이는 줄 그대로 · 브라우저에서 만든다) · 줄 = 한 사람 카드(「‹ 명단」으로 돌아옴)
 * 테스트 포함 = 지금 › 지금까지(sofar.js sfTest)와 같은 값 · 서랍에서 바꿔도 같은 값이 바뀐다 · 시험 사번 = list_get test
 * 데이터 = 기존 읽기만(서버 고침 없음 · 30초 캐시):
 *   stamp_people(사람마다 스탬프 · 받은 시각 · 룰렛 · 행운권 장) · raffle_list(행운권 번호) · fcfs_list(선착순 · 100줄씩 이어 받기) · game_stats(미니 게임 · 퀴즈 한 사람)
 *   list_get(visit 가입 · idea 아이디어 · cchat 커피챗 · lounge 라운지 신청 · lounge_pre 라운지 사전 · kit 옷 · att17 17F 출석 · test 시험 사번)
 * 서버가 사람별 값을 주지 않는 칸(명부 · 앱 사용 기간별 접속 · 추첨 당첨)은 가장 가까운 화면으로 보낸다(DR_GO) */
var DR={ c:{}, k:"", seq:0, back:"", g:null };
var DR_TTL=30000;
var DR_NM={ lg:"최초 로그인", qz:"AX 퀴즈", p4:"미니 게임", p5:"아이디어 한 줄", p2:"AX PLAY", st:"계단 이용", sv:"설문", p3:"17F 강연(2개)", p3h:"17F 강연 한쪽(1개)", p10:"10F 실습(2개)", p10h:"10F 실습 한쪽(1개)", ln:"AX 라운지 참석", cc:"18F 커피챗 참석" };
var DR_ONE=["lg","qz","p4","p5","p2","st","sv"];
var DR_PG=["p3","p3h","p10","p10h","ln","cc"];
/* 서버 stampCnt_ · progUnits_ 와 같은 셈(받은 순서대로 쌓아 「K개 된 시각」을 찾는다) */
function drUnits(ids){
  var n=0, a=0, b=0, l=0, c=0;
  ids.forEach(function(id){ if(DR_ONE.indexOf(id)>=0) n++; else if(id==="p3") a=2; else if(id==="p3h") a=Math.max(a,1); else if(id==="p10") b=2; else if(id==="p10h") b=Math.max(b,1); else if(id==="ln") l=2; else if(id==="cc") c=1; });
  return Math.min(6, n+Math.min(2,a+b+l+c));
}
function drReach(o, k){ var acc=[]; for(var i=0;i<o.ev.length;i++){ acc.push(o.ev[i].id); if(drUnits(acc)>=k) return o.ev[i].t; } return ""; }
function drTest(){ return typeof sfTest==="function"?sfTest():0; }
function drGet(a, p){
  var key=sigOf(a,p||{}), c=DR.c[key];
  if(c&&Date.now()-c.at<DR_TTL) return c.pr;
  var pr=call(a, Object.assign({}, p||{})).then(function(r){ if(!r||r.ok===false){ delete DR.c[key]; throw r||{ ok:false }; } return r; });
  DR.c[key]={ at:Date.now(), pr:pr }; return pr;
}
/* 시험 사번 묶음 · 포함이면 빈 묶음 */
function drTs(){ if(drTest()) return Promise.resolve({}); return drGet("list_get",{ kind:"test" }).then(function(r){ var m={}; (r.rows||[]).forEach(function(x){ m[normE(x.emp)]=1; }); return m; }); }
function drNoTest(rows){ return drTs().then(function(T){ return rows.filter(function(r){ return !T[normE(r.emp)]; }); }); }
function drSp(){
  return drGet("stamp_people",{}).then(function(r){
    return drNoTest((r.rows||[]).map(function(o){
      var via=o.via||{}, ids=Object.keys(via); if(!ids.length) ids=(o.stamps||[]).slice();
      var ev=ids.map(function(id){ return { id:id, t:(via[id]&&via[id].t)||"", v:(via[id]&&via[id].v)||"" }; }).sort(function(x,y){ return x.t<y.t?-1:x.t>y.t?1:0; });
      return { emp:o.emp, name:o.name, dept:o.dept, n:num(o.n), ids:ids, ev:ev, via:via, rl:o.roulette?1:0, tk:num(o.tk), pg:num(o.pg), last:o.last||"" }; }));
  });
}
function drLg(kind){ return drGet("list_get",{ kind:kind }).then(function(r){ return drNoTest(r.rows||[]); }); }
function drFx(){
  var all=[], pg=function(i){ return drGet("fcfs_list",{ page:String(i) }).then(function(r){ all=all.concat(r.rows||[]); return all.length<num(r.n)&&(r.rows||[]).length&&i<40?pg(i+1):all; }); };
  return pg(1).then(drNoTest);
}
function drRf(){ return drGet("raffle_list",{ pool:"1" }).then(function(r){ var m={}; (r.rows||[]).forEach(function(x){ var e=normE(x.emp); (m[e]=m[e]||[]).push(x.no); }); return m; }); }
function drDay(){ var b=S.data.nb; return b&&b.day?String(b.day):""; }
var DR_RL={ k:"rl", t:"룰렛", w:52, v:function(r){ return r.rl?"사용":""; } };
var DR_TK={ k:"tk", t:"행운권", type:"num", w:56 };
var DR_N={ k:"n", t:"스탬프", type:"num", w:56 };
/* 키 → 명단 정의 { t 제목 · s 한 줄 · src() → Promise 줄 · cols 덧붙는 열 · sort } */
function drDef(key){
  var a=String(key||"").split(":"), k=a[0], x=a[1]||"", y=a[2]||"";
  if(k==="st"){
    if(x==="eq"||x==="ge"){ var K=num(y), ge=x==="ge", six=ge&&K===6;
      var th={ 3:"룰렛 1회", 4:"행운권 1장", 5:"행운권 2장", 6:"행운권 3장 · 선착순" }[K];
      return { t:ge?(K===6?"6개 달성":K===1?"스탬프 1개 이상":"스탬프 "+K+"개 이상"):"스탬프 "+K+"개", s:ge?(th||"스탬프 "+K+"개 이상"):"지금 "+K+"개"+(th?" · "+th:""),
        sort:{ k:"at", d:1 },
        cols:(six?[]:[DR_N]).concat([{ k:"at", t:K+"개 된 시각", type:"date", w:100 }]).concat(six?[{ k:"rk", t:"선착순", type:"num", w:56 },{ k:"fxst", t:"참여상", w:64 }]:[]).concat(six?[DR_RL]:[DR_RL,DR_TK]),
        src:function(){ return Promise.all([drSp(), six?drFx():Promise.resolve([])]).then(function(z){ var fm={}; z[1].forEach(function(f){ fm[normE(f.emp)]=f; });
          return z[0].filter(function(o){ return ge?o.n>=K:o.n===K; }).map(function(o){ o.at=drReach(o,K); var f=fm[normE(o.emp)]; if(f){ o.rk=f.rk; o.fxst=f.got?"지급":f.st==="정상"?"받기 전":f.st; } return o; }); }); } };
    }
    if(x==="rl") return { t:"룰렛 사용", s:"룰렛을 돌린 사람 · 사용 취소는 빠짐", sort:{ k:"n", d:-1 }, cols:[DR_N,DR_TK,{ k:"last", t:"마지막 기록", type:"date", w:100 }],
      src:function(){ return drSp().then(function(rr){ return rr.filter(function(o){ return o.rl; }); }); } };
    if(x==="pg") return { t:"프로그램 참여", s:"17F 강연 · 10F 실습 · AX 라운지 · 18F 커피챗 · 사람마다 최대 2개", sort:{ k:"at", d:1 },
      cols:[{ k:"pg", t:"개수", type:"num", w:56 },{ k:"what", t:"받은 항목", w:200 },{ k:"at", t:"처음 받은 시각", type:"date", w:100 },DR_N],
      src:function(){ return drSp().then(function(rr){ return rr.filter(function(o){ return o.pg>0; }).map(function(o){ var e=o.ev.filter(function(v){ return DR_PG.indexOf(v.id)>=0; }); o.what=e.map(function(v){ return DR_NM[v.id]||v.id; }).join(" · "); o.at=e.length?e[0].t:""; return o; }); }); } };
    if(x==="id") return { t:DR_NM[y]||y, s:"이 스탬프를 지금 가진 사람 · 취소된 것은 빠짐", sort:{ k:"at", d:1 },
      cols:[{ k:"at", t:"받은 시각", type:"date", w:100 },{ k:"via", t:"경로", w:100 },DR_N],
      src:function(){ return drSp().then(function(rr){ return rr.filter(function(o){ return o.ids.indexOf(y)>=0; }).map(function(o){ var v=o.via[y]||{}; return Object.assign({}, o, { at:v.t||"", via:v.v||"앱" }); }); }); } };
  }
  if(k==="tk") return { t:"행운권 가진 사람", s:"4개 = 1장 · 5개 = 2장 · 6개 = 3장", sort:{ k:"tk", d:-1 },
    cols:[{ k:"tk", t:"장", type:"num", w:48 },{ k:"nos", t:"행운권 번호", w:150 },DR_N],
    src:function(){ return Promise.all([drRf(), drSp()]).then(function(z){ var sm={}; z[1].forEach(function(o){ sm[normE(o.emp)]=o; });
      return drNoTest(Object.keys(z[0]).map(function(e){ var o=sm[e]||{}, nos=z[0][e]; return { emp:e, name:o.name||"", dept:o.dept||"", tk:nos.length, nos:nos.join(" · "), n:o.n==null?"":o.n }; })); }); } };
  if(k==="fx"){ var got=x==="got";
    return { t:got?"선착순 참여상 지급":"선착순 순번", s:got?"체크인존에서 받은 사람":"6개 달성순 순번 · 1~200 · 201번부터 대기마감", sort:{ k:"rk", d:1 },
      cols:[{ k:"rk", t:"순번", type:"num", w:56 },{ k:"st", t:"상태", w:72 },{ k:"at", t:"6개 달성", type:"date", w:100 },{ k:"gotAt", t:"받은 시각", type:"date", w:100 }],
      src:function(){ return drFx().then(function(rr){ return got?rr.filter(function(r){ return r.got&&r.st!=="취소"; }):rr; }); } }; }
  if(k==="acct") return { t:"가입", s:"앱에 가입한 사람", sort:{ k:"joined", d:-1 }, cols:[{ k:"joined", t:"가입", type:"date", w:100 },{ k:"last", t:"최근 접속", type:"date", w:100 }],
    src:function(){ return drLg("visit").then(function(rr){ return drTest()?rr:rr.filter(function(r){ return r.test!=="Y"; }); }); } };
  if(k==="idea"){ var td=x==="today";
    return { t:td?"오늘 아이디어 한 줄":"아이디어 한 줄", s:"낸 사람 · 건수 · 마지막으로 낸 시각", sort:{ k:"t", d:-1 }, cols:[{ k:"c", t:"건수", type:"num", w:56 },{ k:"t", t:"마지막", type:"date", w:100 },{ k:"tag", t:"분야", w:90 }],
      src:function(){ return drLg("idea").then(function(rr){ var m={}, o=[], d=drDay(); rr.forEach(function(r){ if(td&&d&&String(r.t||"").slice(0,10)!==d) return; var e=normE(r.emp); if(!e) return; var p=m[e]; if(!p){ p=m[e]={ emp:r.emp, name:r.name, dept:r.dept, c:0, t:"", tag:r.tag }; o.push(p); } p.c++; if(String(r.t)>p.t){ p.t=String(r.t); p.tag=r.tag; } }); return o; }); } }; }
  if(k==="cc"){ var CC={ all:["18F 커피챗 신청","취소 뺀 신청",function(s){ return s!=="취소"; }], wait:["커피챗 희망","대기",function(s){ return s==="대기"; }], match:["커피챗 선정","매칭 · 참석 · 완료",function(s){ return s==="매칭"||s==="참석"||s==="완료"; }],
      pick:["커피챗 선정(참석 전)","매칭",function(s){ return s==="매칭"; }], "in":["커피챗 참석","참석 · 완료",function(s){ return s==="참석"||s==="완료"; }] }[x];
    if(!CC) return null;
    return { t:CC[0], s:"상태 = "+CC[1], sort:{ k:"ts", d:1 }, cols:[{ k:"st", t:"상태", w:64 },{ k:"round", t:"회차", w:60 },{ k:"table", t:"테이블", w:60 },{ k:"ts", t:"신청 시각", type:"date", w:100 }],
      src:function(){ return drLg("cchat").then(function(rr){ return rr.filter(function(r){ return CC[2](String(r.st||"")); }); }); } }; }
  if(k==="ln"){
    if(x==="pre") return { t:"AX 라운지 사전 명단", s:"등록 순 · 수량 안 = 키트 · 넘으면 가습기", sort:{ k:"rk", d:1 }, cols:[{ k:"rk", t:"등록 순", type:"num", w:64 },{ k:"kit", t:"받을 것", w:64 },{ k:"sz", t:"사이즈", w:60 },{ k:"got", t:"받음", w:50 }],
      src:function(){ return drLg("lounge_pre"); } };
    var st=x==="resv"?"":decodeURIComponent(y||x);
    return { t:x==="resv"?"AX 라운지 예약":"AX 라운지 "+st, s:x==="resv"?"취소 뺀 예약":"상태 = "+st, sort:{ k:"slot", d:1 }, cols:[{ k:"slot", t:"시간", w:60 },{ k:"st", t:"상태", w:64 },{ k:"ts", t:"신청 시각", type:"date", w:100 }],
      src:function(){ return drLg("lounge").then(function(rr){ return rr.filter(function(r){ return st?r.st===st:r.st!=="취소"; }); }); } };
  }
  if(k==="kit"){ var KT={ pre:["사전 신청 키트 명단","사전 신청자(라운지 사전 제외)",function(r){ return r.g==="pre10"; }], preReq:["키트 사이즈 신청","사전 신청자 중 사이즈를 정한 사람",function(r){ return r.g==="pre10"&&r.sz; }],
      staff:["스태프 의류 명단","스태프 옷 대상",function(r){ return r.g==="staff"; }], staffReq:["스태프 의류 사이즈 신청","사이즈를 정한 스태프",function(r){ return r.g==="staff"&&r.sz; }],
      preGot:["키트 지급","사전 신청자 중 받은 사람",function(r){ return r.g==="pre10"&&r.got; }], staffGot:["스태프 옷 지급","체크인존 옷 지급 기록 · 스태프 의류 명단",null],
      req:["옷 사이즈 신청","사이즈를 정한 사람 · 사전 신청 · 스태프 · 라운지 사전",function(r){ return !!r.sz; }], got:["옷 받음","체크인존에서 받은 사람(스태프 제외)",function(r){ return r.g!=="staff"&&!!r.got; }], none:["옷 미신청","사이즈를 아직 정하지 않은 사람",function(r){ return !r.sz; }] }[x];
    if(!KT) return null;
    return { t:KT[0], s:KT[1], sort:{ k:"at", d:1 }, cols:[{ k:"gn", t:"구분", w:84 },{ k:"sz", t:"사이즈", w:60 },{ k:"at", t:"정한 시각", type:"date", w:100 },{ k:"got", t:"받은 시각", type:"date", w:100 }],
      src:function(){ if(KT[2]) return drLg("kit").then(function(rr){ return rr.filter(KT[2]); });
        return Promise.all([drLg("kit"), drLg("prize")]).then(function(z){ var gv={}; z[1].forEach(function(r){ if(r.id==="k1"){ var e=normE(r.emp); if(!gv[e]||r.t<gv[e]) gv[e]=r.t; } });
          return z[0].filter(function(r){ return r.g==="staff"&&gv[normE(r.emp)]; }).map(function(r){ return Object.assign({}, r, { got:gv[normE(r.emp)] }); }); }); } }; }
  if(k==="game"){ var quiz=x==="quiz";
    return { t:quiz?"AX 퀴즈 한 사람":"미니 게임 한 사람", s:"판 수 = 종목 합 · 시험 사번은 서버가 뺌", sort:{ k:"plays", d:-1 }, cols:[{ k:"plays", t:"판 수", type:"num", w:60 },{ k:"evs", t:"종목", w:150 },{ k:"last", t:"마지막", type:"date", w:100 }],
      src:function(){ return drGet("game_stats",{}).then(function(d){ var mini=typeof grMini==="function"?grMini(d):(d.oev||[]), m={}, o=[];
        Object.keys(d.games||{}).forEach(function(g){ if((mini.indexOf(g)>=0)===quiz) return; (d.games[g].rows||[]).forEach(function(r){ var e=normE(r.emp); if(!e) return; var p=m[e]; if(!p){ p=m[e]={ emp:r.emp, name:r.name, dept:"", plays:0, ev:[], last:"" }; o.push(p); }
          p.plays+=num(r.plays); p.ev.push(typeof grName==="function"?grName(g):g); if(String(r.last||"")>p.last) p.last=String(r.last||""); }); });
        o.forEach(function(p){ p.evs=p.ev.join(" · "); }); return drNoTest(o); }); } }; }
  if(k==="att"){ var who=x==="l1"?"AWS 강연":"MS 강연", io=y==="out"?"out":"in";
    return { t:"17F "+who+" "+(io==="in"?"입장":"끝"), s:"오늘 기록 · 입장 QR · 끝 QR", sort:{ k:io, d:1 }, cols:[{ k:"in", t:"입장", type:"date", w:100 },{ k:"out", t:"끝", type:"date", w:100 },{ k:"via", t:"경로", w:60 }],
      src:function(){ var d=drDay(); return drLg("att17").then(function(rr){ return rr.filter(function(r){ return r.prog===x&&r[io]&&(!d||String(r[io]).slice(0,10)===d); }); }); } }; }
  return null;
}
/* 사람별 값이 서버에 없는 칸 · 가장 가까운 화면 */
var DR_GO={ roster:function(){ go("people","find"); }, usage:function(){ go("people","visit"); }, draw:function(){ go("stage","draw"); }, lky:function(){ if(DRW.k) drwClose(); go("stage","now"); } };   /* 261021 행운권 장 숫자(지금 탭 · 한 사람 카드) = 행운권 탭 현황 */
/* 누를 수 있는 숫자 · v = 보일 html · 0 이면 그냥 글자 */
function drN(key, v, n){
  if(n!=null&&!num(n)) return v;
  return '<button type="button" class="dn" onclick="drOpen(\''+jq(key)+'\')" title="명단 보기">'+v+'</button>';
}
/* 숫자 칸(kpi 모양) · 큰 숫자 = 명단 · s = 아래 줄 html */
function drKpi(o){ return '<div class="kpi dk"><span class="l">'+esc(o.l)+'</span><span class="v">'+(o.key?drN(o.key, esc(o.v), o.n):esc(o.v))+(o.u?'<em>'+esc(o.u)+'</em>':'')+'</span><span class="s">'+(o.s||"")+'</span></div>'; }
/* 칸 전체가 단추인 kpi(go) 를 명단으로 · 다른 화면 kpi 에 */
function drKpiGo(k, key){ if(!num(String(k.v).replace(/,/g,""))) return kpi(k); var o=Object.assign({}, k, { go:"drOpen('"+jq(key)+"')" }); return kpi(o).replace('class="kpi ','class="kpi dk dkb '); }
/* rowH 와 같은 줄 · sub = html */
function drRow(title, sub, right){ return '<div class="row"><div class="t"><b>'+esc(title)+'</b>'+(sub?'<span>'+sub+'</span>':'')+'</div>'+(right||"")+'</div>'; }
function drBig(key, n, unit){ var h='<span class="big">'+n0(n)+'<small> '+esc(unit)+'</small></span>'; return drN(key, h, n); }
function drHead(d){
  var on=drTest();
  return '<div class="card"><h2>'+esc(d.t)+'<span class="r"><button class="btn sm" type="button" onclick="drwClose()" aria-label="명단 닫기">닫기</button></span></h2>'+
    '<div class="dr-sub"><span class="cap">'+esc(d.s||"")+'</span><button type="button" class="chip'+(on?" on":"")+'" aria-pressed="'+(on?"true":"false")+'" onclick="drTestSet()">테스트 포함</button></div>';
}
function drOpen(key){
  if(DR_GO[key]){ DR_GO[key](); return; }
  var d=drDef(key); if(!d) return;
  if(typeof PC!=="undefined"&&PC.emp&&typeof pcClosed==="function") pcClosed();
  DR.back=""; DR.k=key; var s=++DR.seq, gid="dr_"+encodeURIComponent(key).replace(/[^0-9A-Za-z]/g,"_");
  var g=XG.reg[gid]||XG.make({ id:gid, file:d.t, key:function(r){ return normE(r.emp); }, sort:d.sort, h:520, ph:"사번 · 소속 · 이름 찾기", empty:"해당하는 사람이 없습니다",
    cols:[{ k:"emp", t:"사번", w:76 },{ k:"dept", t:"소속", w:120 },{ k:"name", t:"이름", w:76 }].concat(d.cols||[]), onRow:function(e){ drPick(e); } });
  DR.g=g; g.sel=null;
  drwOpen("dr:"+key, drHead(d)+'<div id="drBody" class="mt"></div></div>', { wide:1, label:d.t+" 명단", g:g, close:function(){ DR.k=""; } });
  el("drw").classList.add("dr-xw");   /* 명단 서랍 = 더 넓게(drill.css) */
  g.gate=""; XG.set(g, null, el("drBody"));
  d.src().then(function(rows){ if(s!==DR.seq) return; g.gate=""; XG.set(g, rows, el("drBody")); },
    function(r){ if(s!==DR.seq) return; g.gate=band("warn","받지 못했습니다 · "+esc(why(r||{})),'<button class="btn sm" type="button" onclick="drOpen(\''+jq(key)+'\')">다시 시도</button>'); XG.set(g, null, el("drBody")); });
}
function drTestSet(){ if(typeof sfSet==="function") sfSet(); if(DR.k) drOpen(DR.k); }
function drPick(e){ var k=DR.k; if(!e||typeof pcOpen!=="function") return; pcOpen(e, DR.g); DR.back=k; drBackBtn(); }
function drBack(){ var k=DR.back; if(typeof pcClosed==="function") pcClosed(); if(k) drOpen(k); }
function drBackBtn(){
  if(!DR.back) return; var b=el("drw"), r=b&&b.querySelector(".card h2 .r");
  if(r&&!r.querySelector(".dr-back")) r.insertAdjacentHTML("afterbegin",'<button class="btn sm dr-back" type="button" onclick="drBack()">‹ 명단</button>');
}
/* 한 사람 카드가 다시 그려질 때도 「‹ 명단」 · 카드를 닫으면 돌아갈 곳을 잊는다 */
(function(){
  if(typeof pcDraw==="function"){ var f=pcDraw; pcDraw=function(){ var r=f.apply(this, arguments); drBackBtn(); return r; }; }
  if(typeof pcClosed==="function"){ var c=pcClosed; pcClosed=function(){ DR.back=""; return c.apply(this, arguments); }; }
})();
