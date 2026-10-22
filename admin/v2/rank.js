/* AXF CONTROL v2 · 사람 › 게임 순위 (261017 사용자 「admin 페이지에서 게임 순위가 바로 보이지 않는다」)
 * 기준 = 앱 미니 게임 순위판(oly_rank)과 같다 · 종목 = 서버 oev(팡 · 점프 · 테트리스) · AX 퀴즈 · 옛 기억력은 순위 없음
 *   종목별 = 종목 최고 한 판 점수 높은 순 · 동점은 먼저 달성한 쪽 · 시험 사번 제외(서버 olyCompute_ perEvent 순서 그대로)
 *   종합 = 세 종목 모두 한 판 이상 · 세 종목 최고점 합 높은 순 · 동점은 합계를 먼저 만든 쪽(261022 상한 폐지 · 서버 sumAt = 세 종목 최고 기록 시각 중 가장 늦은 값 · 옛 서버 = 세 종목을 먼저 마친 쪽) · 시험 사번 제외
 *   기간 = 행사 전체(앱 순위판에 오늘 구분 없음) · 부문 합계 · 부문 순위 · 메달 없음(260917)
 * 읽기 = game_stats(관리코드 · 사번 · 이름 · 닉네임 · 최고점 · 판 수 · 마지막 판) · 소속은 명부(whoOf)
 *   종합 줄 = game_stats oly.rows 에서 세 종목 완주 + 종목 순위(시험 사번이 빠진 명단)에 있는 사람만 · 순위는 다시 센다
 * 표 = table.js · 기본 50위 · 「더 보기」 50씩 · 검색 · 정렬 · 엑셀은 전체 줄 · 줄을 누르면 한 사람 카드(게임 기록 · 닉네임) */
var GR_EV=[["all","종합"],["pang","AX 팡"],["jump","ME to WE 점프"],["tetris","테트리스"]];
var GR_STEP=50, GR_N={};
function grEv(){ var e=S.ui.grEv; return GR_EV.some(function(x){ return x[0]===e; })?e:"all"; }
function grName(ev){ var x=GR_EV.filter(function(y){ return y[0]===ev; })[0]; return x?x[1]:ev; }
function grNeed(){ return [{ k:"grank", a:"game_stats", p:{}, ttl:60000 }]; }
function grPick(ev){ if(ev===grEv()) return; S.ui.grEv=ev; render(); }
function grMini(d){ var o=Array.isArray(d&&d.oev)&&d.oev.length?d.oev:["pang","jump","tetris"]; return o.filter(function(g){ return GR_EV.some(function(x){ return x[0]===g; }); }); }
function grNick(r){ return r.nick?r.nick:""; }
/* 받은 값 → 표 줄 { rank · emp · name · nick · hidden · score · plays · at · key } */
function grRows(d, ev){
  if(!d||!d.games) return [];
  var mini=grMini(d);
  if(ev!=="all"){ var gm=d.games[ev]; if(!gm||mini.indexOf(ev)<0) return [];
    return (gm.rows||[]).map(function(r,i){ return { rank:i+1, emp:r.emp, name:r.name, nick:grNick(r), hidden:!!r.hidden, score:Number(r.best)||0, plays:Number(r.plays)||0, at:r.bestTs||r.last||"", key:r.key||"" }; }); }   /* 261017 기록 시각 = 최고점 판(bestTs · 옛 서버 = 마지막 판) */
  var orows=(d.oly&&d.oly.rows)||[], hasT=orows.some(function(r){ return r.test!=null; }), ok={}, first=d.games[mini[0]];
  if(!hasT) ((first&&first.rows)||[]).forEach(function(r){ ok[normE(r.emp)]=1; });   /* 옛 서버(test 칸 없음) = 시험 사번은 종목 순위에 없다 → 종합에서도 뺀다 */
  return orows.filter(function(r){ return Number(r.done)===mini.length&&(hasT?Number(r.test)!==1:ok[normE(r.emp)]); })   /* 261017 서버 oly.rows test 칸 */
    .map(function(r,i){ return { rank:i+1, emp:r.emp, name:r.name, nick:grNick(r), hidden:!!r.hidden, score:Number(r.total)||0, at:r.sumAt||r.doneAt||"", key:"" }; });   /* 261022 합계 시각(sumAt · 옛 서버 = 세 종목 완주 doneAt) */
}
function grGrid(ev){
  var id="grk_"+ev, all=ev==="all";
  if(!GR_N[ev]) GR_N[ev]=GR_STEP;
  return gridOf(id,{ file:"게임 순위 "+grName(ev), key:function(r){ return r.emp; }, sort:{ k:"rank", d:1 }, h:560, ph:"사번 · 소속 · 이름 · 닉네임 찾기",
    max:function(){ return GR_N[ev]; }, more:function(){ GR_N[ev]+=GR_STEP; XG.paint(MG[id]); }, onRow:function(k){ pcOpen(k, MG[id]); },
    empty:all?"아직 세 종목을 모두 한 사람이 없습니다":"아직 기록이 없습니다",
    cols:[{ k:"rank", t:"순위", type:"num", w:60 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"소속", w:150 },{ k:"name", t:"이름", w:90 },
      { k:"nick", t:"닉네임", w:120, f:function(r){ return (r.nick?esc(r.nick):'<span class="cap">익명 참가자</span>')+(r.hidden?" "+tag("숨김","off"):""); }, x:function(r){ return (r.nick||"익명 참가자")+(r.hidden?" (숨김)":""); } },
      { k:"score", t:all?"총점":"최고점", type:"num", w:90 },
      all?null:{ k:"key", t:"대표 기록", w:110 },
      all?null:{ k:"plays", t:"판 수", type:"num", w:64 },
      { k:"at", t:all?"합계 시각":"최고점 시각", type:"date", w:110 }].filter(Boolean) });
}
function grChipsH(ev){ var d=S.data.grank, ok=d&&d.games;
  return GR_EV.map(function(x){ var on=x[0]===ev, n=ok?grRows(d,x[0]).length:null;
    return '<button type="button" role="tab" aria-selected="'+on+'" class="chip'+(on?" on":"")+'" onclick="grPick(\''+x[0]+'\')">'+esc(x[1])+(n!=null?' <span class="c">'+n0(n)+'</span>':'')+'</button>'; }).join(""); }
function grMount(vb, head){
  var ev=grEv(); grGrid(ev);
  vb.innerHTML=head+'<div class="card"><div class="chips" role="tablist" aria-label="게임" id="grChips">'+grChipsH(ev)+'</div><p class="cap mt4 gr-cap">'+grCapT(ev).split(" · ").map(function(t,i){ return '<span class="nw">'+(i?"· ":"")+esc(t)+'</span>'; }).join(" ")+'</p><div id="mg_grk_'+ev+'" class="mt"></div></div>';
}
function grCapT(ev){ var nc=!!(S.data.grank&&(S.data.grank.nocap||S.data.grank.capN));   /* 261022 저녁 capN(상한 4,000) 서버도 합계 먼저 */ return (ev==="all"?"세 종목 최고점 합 · "+(nc?"동점은 합계를 먼저 만든 순":"동점은 세 종목을 먼저 마친 순")+" · 세 종목 모두 한 판 이상":"최고 한 판 점수 · 동점은 먼저 달성한 순")+" · 시험 사번 제외 · 앱 순위판과 같은 순서"; }
function grPaint(){
  var ev=grEv(), c=el("grChips"); if(c) c.innerHTML=grChipsH(ev);
  gridPaint("grk_"+ev, "grank", "게임 순위", function(dd){ return grRows(dd, ev); });
}
