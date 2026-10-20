/* AXF CONTROL v2 · 행사 전 스탬프 점검 (261020 · 사용자 「행사 전 스탬프가 발행되면 안 되는 곳에서 이상이 생기면 알려줘」)
 * 서버 preday_audit(관리코드 · 읽기 · 서버 캐시 60초) · 모든 탭에서 60초마다 받는다(COMMON_NEED)
 * 위치 = 상단 「이상 n」에 더하고 이상이면 빨강 · 지금 탭 맨 위 띠(이상 = 빨간 띠 + 상세 표 · 없음 = 회색 한 줄) · 처음 뜰 때(늘어날 때) 토스트 한 번
 * 판정 날짜 = 서버 eventDay_(10/26) · 그날부터 서버가 phase event = 「행사 중 · 해당 없음」 한 줄
 * core.js · v2.css 는 고치지 않는다(캐시 번호 고정 검사 496) · 상단 칩은 sigCount · topPaint 를 감싸서 더한다 */
COMMON_NEED.push({ k:"pda", a:"preday_audit", ttl:60000 });
var PDA={ seen:0, open:false, busy:false, memo:false };
var PDA_K={ id:"규칙 밖 스탬프", over:"5개 이상", roul:"3개 미만 룰렛", tk:"행운권 초과", fcfs:"선착순 줄" };
var PDA_ID={ lg:"최초 로그인", qz:"AX 퀴즈", p4:"미니 게임", p5:"아이디어 한 줄", p2:"AX PLAY", st:"계단 이용", p3:"17F 강연(2개)", p3h:"17F 강연 한쪽", p10:"10F 실습(2개)", p10h:"10F 실습 한쪽", cc:"18F 커피챗", ln:"AX 라운지", sv:"설문", ck:"옛 사전등록 체크인", roulette:"룰렛", raffle:"행운권", fcfs:"선착순" };
function pdaD(){ var d=S.data.pda; return d&&d.ok&&d.phase?d:null; }
function pdaCount(){ var d=pdaD(); return d&&d.phase==="preday"?num(d.n):0; }
function pdaIds(s){ return String(s||"").split(",").filter(Boolean).map(function(x){ return PDA_ID[x]||x; }).join(" · "); }
function pdaWhy(r){
  if(r.k==="id") return "행사 전에는 로그인 · AX 퀴즈 · 미니 게임 · 아이디어 한 줄만";
  if(r.k==="over") return "행사 전 "+num(r.n)+"개 · 최대 4개";
  if(r.k==="roul") return "룰렛 때 스탬프 "+num(r.n)+"개 · 3개부터";
  if(r.k==="tk") return "행운권 "+num(r.n)+"장 · 허용 "+num(r.allow)+"장(행사 전 최대 1장)";
  if(r.k==="fcfs") return "선착순 "+num(r.n)+"번 · 행사 전에는 0줄";
  return "";
}
/* 상단 「이상 n」 = 지금 탭 이상 신호 + 행사 전 스탬프 이상 · 이상이면 빨강(pda-b) */
var PDA_SIG0=sigCount;
sigCount=function(){ return PDA_SIG0()+pdaCount(); };
var PDA_TOP0=topPaint;
topPaint=function(){
  PDA_TOP0();
  var n=pdaCount(), b=el("topL")&&el("topL").querySelector('button[onclick="go(\'now\')"]');
  if(b){ b.classList.toggle("pda-b",n>0); if(n) b.setAttribute("aria-label","이상 "+sigCount()+" · 행사 전 스탬프 이상 "+n+"건"); else b.removeAttribute("aria-label"); }
  if(n>PDA.seen){ toast("행사 전 스탬프 이상 "+n+"건 · 지금 탭 맨 위에서 확인",{ bad:1, ms:6000 }); }
  PDA.seen=n;
};
/* 지금 탭 맨 위(now.js nwPda) */
function pdaBand(){
  var d=pdaD(), e=S.data.pda;
  if(!d){ if(e&&unknownSrv(e)) return ""; if(e&&e.ok===false) return '<div class="pda-line">행사 전 스탬프 점검 · 받지 못했습니다 · '+esc(why(e))+'</div>'; return ""; }
  if(d.phase!=="preday") return '<div class="pda-line">행사 전 스탬프 점검 · 행사 중 · 해당 없음</div>';
  var at=hm(d.t), n=num(d.n);
  if(!n) return '<div class="pda-line"><i class="dot ok"></i><span>행사 전 스탬프 이상 없음 · 마지막 확인 '+esc(at)+pdaSide(d)+'</span></div>';
  var parts=["id","over","roul","tk","fcfs"].filter(function(k){ return num(d.cnt&&d.cnt[k]); }).map(function(k){ return PDA_K[k]+" "+n0(d.cnt[k]); });
  return '<div class="band bad pda-band" role="alert"><b>행사 전 스탬프 이상 '+n0(n)+'건</b><span>'+esc(parts.join(" · "))+' · 마지막 확인 '+esc(at)+'</span>'+
    '<button class="btn sm dng" type="button" onclick="pdaToggle()" aria-expanded="'+(PDA.open?"true":"false")+'">'+(PDA.open?"상세 닫기":"상세 보기")+'</button></div>'+(PDA.open?pdaTable(d):"");
}
function pdaSide(d){
  var a=[]; if(num(d.blk&&d.blk.n)) a.push("정상 막힘 "+n0(d.blk.n)+"건");
  if(num(d.tst&&d.tst.n)) a.push("테스트 사번 "+n0(d.tst.n)+"건");
  return a.length?'<span class="pda-g"> · '+esc(a.join(" · "))+'</span>':"";
}
function pdaTable(d){
  var rows=d.rows||[];
  var body=rows.map(function(r){
    var id=r.k==="over"?pdaIds(r.id):(PDA_ID[r.id]||r.id);
    return '<tr><td><b>'+esc(PDA_K[r.k]||r.k)+'</b><div class="cap">'+esc(pdaWhy(r))+'</div></td>'+
      '<td><button class="pda-lnk" type="button" onclick="pcOpen(\''+jq(r.emp)+'\')">'+esc(personLine(r))+'</button></td>'+
      '<td>'+esc(id)+'</td><td class="n">'+esc(fmtD(r.at))+'</td><td class="pda-via">'+esc(r.via?(r.k==="tk"?"번호 ":r.k==="fcfs"?"상태 ":"")+r.via:"-")+'</td></tr>';
  }).join("");
  var foot=[];
  if(d.more) foot.push("처음 "+n0(rows.length)+"줄만 보임 · 전체 "+n0(d.n)+"건");
  foot.push("정상 막힘(서버가 거절한 시도) "+n0(d.blk&&d.blk.n)+"건"+(d.blk&&d.blk.last?" · 마지막 "+fmtD(d.blk.last):""));
  if(num(d.tst&&d.tst.n)) foot.push("테스트 사번 "+n0(d.tst.n)+"건 · "+n0(d.tst.people)+"명(이상에 넣지 않음)");
  if(num(d.fixed)) foot.push("담당자 취소로 정리된 규칙 밖 스탬프 "+n0(d.fixed)+"건");
  return '<div class="card mb pda-card"><h2>행사 전 스탬프 이상 <span class="cap">10/26 전 기록 · 사번별 지금 상태 · 이름을 누르면 한 사람 카드</span>'+
    '<span class="r"><button class="btn sm" type="button" onclick="pdaFresh()"'+(PDA.busy?' aria-disabled="true"':'')+'>'+(PDA.busy?"확인 중":"다시 확인")+'</button></span></h2>'+
    '<div class="pda-scx"><table class="tb"><thead><tr><th>무엇</th><th>사람(사번 · 소속 · 이름)</th><th>스탬프</th><th class="n">시각</th><th>경로</th></tr></thead><tbody>'+body+'</tbody></table></div>'+
    '<div class="cap mt">'+esc(foot.join(" · "))+'</div>'+
    '<details class="memo mt"'+(PDA.memo?" open":"")+' ontoggle="PDA.memo=this.open"><summary>운영 메모</summary><div class="cap mt4">규칙 밖 스탬프는 한 사람 카드에서 담당자 취소하면 이 칸에서 빠집니다 · 행운권 · 선착순 줄은 서버 기록이라 기획담당자에게 알립니다 · 서버 점검은 1분마다(QA/preday_check.mjs 와 같은 기준)</div></details></div>';
}
function pdaToggle(){ PDA.open=!PDA.open; paint(); }
function pdaFresh(){
  if(PDA.busy) return; PDA.busy=true; paint();
  call("preday_audit",{ fresh:"1" }).then(function(r){ PDA.busy=false; if(r&&r.ok){ S.data.pda=r; S.at.pda=Date.now(); S.err.pda=null; toast(r.phase!=="preday"?"행사 중 · 해당 없음":num(r.n)?"이상 "+n0(r.n)+"건":"이상 없음"); } else toast("확인하지 못했습니다 · "+why(r),{ bad:1 }); paint(); });
}
