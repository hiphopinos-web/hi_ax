/* AXF CONTROL v2 · 럭키드로우 체크인 2통 콘솔 표시 (261021)
 * 6 · 5 · 4등 = 행운권 전체 통 · 3 · 2 · 1등 = 17F 체크인 통. 서버 필드 이름은 기획 문서 「럭키드로우 체크인 2통 인터페이스_261021」 그대로.
 * 읽기 전용 · 새 쓰기 0.
 *   draw_stats = pool.n · balls · inN · inBalls (전체 통 · 체크인 통) · withT · balls (체크인 통 · 다른 길) · lock { n, balls, inN, inBalls, at } | null · total · recs[].warn 'in' · recs[].fb 1
 *   dset_list(슈퍼관리자) = pool 에도 inN · inBalls 가 실림
 * 쓰는 곳 = dset.js 카드 줄(dtKpi) · drawset.js 당일 점검 칸(dtChkH) · stage.js 무대 머리 · 당첨 기록 표(dtRec*) */
var DT_DAY="2026-10-26", DT_CUT="2026-10-26 17:00";
function dtPool(d,L){ var p=(d&&d.pool)||(L&&L.pool)||null; return p&&p.inN!=null?p:null; }
/* 고정 숫자와 지금 서버 숫자가 다른 항목 이름 */
function dtLockDiff(d){
  var k=d&&d.lock, p=dtPool(d); if(!k||!p) return [];
  var out=[]; [["n","전체 명수"],["balls","전체 장수"],["inN","체크인 명수"],["inBalls","체크인 장수"]].forEach(function(x){ if(num(k[x[0]])!==num(p[x[0]])) out.push(x[1]); });
  return out;
}
function dtLockTxt(k){ return "전체 "+n0(k.n)+"명 · "+n0(k.balls)+"장 · 체크인 "+n0(k.inN)+"명 · "+n0(k.inBalls)+"장"+(k.at?" · "+hm(String(k.at).slice(11,16))+" 고정":""); }
function dtToday(d){ return String(S.srvT||(d&&d.t)||"").slice(0,10); }
/* dset.js 카드 줄 · 체크인 통 */
function dtKpi(L){
  var d=S.data.draw, p=(L&&L.pool)||dtPool(d); if(!p||p.inN==null) return kpi({ l:"체크인 통", v:"-", s:"서버 갱신 뒤" });
  var diff=dtLockDiff(d), k=d&&d.lock, s;
  if(d&&"lock" in d) s=k?(diff.length?"고정 숫자와 다름 · "+diff.join(" · "):"고정 숫자와 같음 · "+hm(String(k.at||"").slice(11,16))):"공 넣기 전 · 고정 없음";
  else s="고정 숫자는 서버 갱신 뒤";
  return kpi({ l:"체크인 통", v:n0(p.inN), u:"명 · "+n0(p.inBalls)+"장", st:diff.length?"warn":"ok", s:s });
}
/* 추첨 설정 › 당일 점검 칸(읽기 전용) */
function dtChkH(d){
  var rows=[], pre=dtToday(d)&&dtToday(d)<DT_DAY, p=dtPool(d), mk=function(t,sub,tg){ rows.push('<div class="row"><div class="t"><b>'+esc(t)+'</b><span>'+esc(sub)+'</span></div>'+tg+'</div>'); };
  if(p){ var inc=num(p.inN)!==num(d.withT)||num(p.inBalls)!==num(d.balls);
    mk("통 숫자","전체 "+n0(p.n)+"명 · "+n0(p.balls)+"장 · 체크인 "+n0(p.inN)+"명 · "+n0(p.inBalls)+"장"+(inc?" · 다른 집계 길 "+n0(d.withT)+"명 · "+n0(d.balls)+"장":""),inc?tag("집계 다름","warn"):tag("일치","ok")); }
  else mk("통 숫자","체크인 통 숫자는 서버 갱신 뒤",tag("확인 중",""));
  if("lock" in d){ var k=d.lock, df=dtLockDiff(d);
    mk("추첨_고정",k?dtLockTxt(k)+(df.length?" · 지금과 다름 "+df.join(" · "):""):"비어 있음",k?(df.length?tag("지금과 다름","warn"):pre?tag("행사 전 값 있음","warn"):tag("고정됨","ok")):tag("비어 있음","ok")); }
  else mk("추첨_고정","서버 갱신 뒤",tag("확인 중",""));
  var tt=num(d.total); mk("추첨기록",n0(tt)+"건",tt?(pre?tag("행사 전 기록 있음","warn"):tag("기록 있음","")):tag("0건","ok"));
  var cu=dwsCfg("행운권_마감"), cv=cu?String(cu.v).trim():null;
  if(cu) mk("행운권_마감",cv||"비어 있음 · 17:00 뒤에도 새 번호가 나옴",cv===DT_CUT?tag("정상","ok"):tag(cv?"다른 값":"비어 있음","warn"));
  else mk("행운권_마감","확인 중",tag("확인 중",""));
  var og=dwsCfg("오픈_범위"), ov=og?String(og.v).trim():null;
  if(og) mk("오픈_범위",ov==="종료"?"행사 종료":ov||"-",ov==="자동"?tag("자동","ok"):tag("자동이어야 함","warn"));
  else mk("오픈_범위","확인 중",tag("확인 중",""));
  return '<h2>추첨 당일 점검 <span class="cap">읽기 전용</span></h2>'+rows.join("");
}
/* 무대 머리 · 추첨 대상 칸 아래 글 */
function dtPoolSub(d,aOff){ var p=dtPool(d); return aOff?(p?"행운권 전체 "+n0(p.balls)+"장 · 17F 체크인 "+n0(p.inN)+"명 · "+n0(p.inBalls)+"장":"행운권 번호 전체"):"17F 체크인 "+n0(d["in"])+"명"+(d.closed?" · 마감":""); }
/* 당첨 기록 표 */
function dtRecTxt(r){ return (r.warn==="in"?" · 체크인 없음":"")+(r.fb?" · 전체 통 이어 뽑기":""); }
function dtRecCell(r,base){ return esc(base)+(r.warn==="in"?" "+tag("체크인 없음","warn"):"")+(r.fb?" "+tag("전체 통","off"):""); }
