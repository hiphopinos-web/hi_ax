/* AXF CONTROL v2 · 럭키드로우 무대 감시 한 줄 (261023 사용자 「럭키드로우 화면에 실시간으로 문제가 생기는지 트래킹」)
 * 판정은 서버 한 곳(drawMonJudge_ · draw_stats mon · srv_pulse dm) · 여기는 그리기만 · 새 폴링 없음(행운권 첫 화면 10초 · 지금 탭 5초 그대로)
 * 상태 = ok 무대 정상 · slow 멈춤 의심 · err 오류 · cut 보고 끊김(n초) · off 무대 꺼짐(회색 · 경보 아님) · 서버가 mon 을 모르면 아무것도 그리지 않는다 */
var DMON_TX={ ok:["ok","무대 정상"], slow:["warn","멈춤 의심"], err:["bad","오류"], cut:["bad","보고 끊김"], off:["off","무대 꺼짐"] };
var DMON_SCN={ idle:"대기", intro:"인트로", checkin:"공 넣는 중", closed:"추첨 준비 끝", card:"등수 카드", mix:"부저 대기", spin:"부저 · 회전", tension:"뽑는 중", exit:"뽑는 중", reveal:"당첨 공개", board:"결과판", fin:"참여상 발표", end:"끝 화면", start:"시작 화면", restore:"이어서" };
function dmonSec(v){ v=Number(v); if(!isFinite(v)||v<0) return ""; return v<90?Math.round(v)+"초":Math.round(v/60)+"분"; }
function dmonView(m){
  if(!m||!m.st||!DMON_TX[m.st]) return null;
  var x=DMON_TX[m.st], sc=DMON_SCN[m.sc]||m.sc||"", sub=[], t=x[1];
  if(m.st==="cut") t+="("+dmonSec(m.age)+")";
  if(m.st==="slow"&&m.why&&m.why.length) sub.push(m.why.join(" · "));
  if(m.st==="off") sub.push(m.why&&m.why[0]==="끝 화면 뒤 닫힘"?"끝 화면 뒤 닫힘":sc?"마지막 장면 "+sc:"라이브 무대 보고 없음");
  else if(sc) sub.push((m.st==="cut"?"마지막 장면 ":"장면 ")+sc);
  if((m.st==="ok"||m.st==="slow"||m.st==="err")&&m.age>=0) sub.push("보고 "+dmonSec(m.age)+" 전");
  if((m.st==="ok"||m.st==="slow")&&m.fps>=0) sub.push(Math.round(m.fps)+"fps");
  if(m.n>1) sub.push("화면 "+m.n+"대");
  if((m.st==="cut"||m.st==="err")&&m.al&&m.al.k===m.st) sub.push((m.al.s===0?"알림 안 감 ":"알림 ")+m.al.t);   /* 안 감 = 관리자 알림 꺼짐 · 폰 기기 없음 · 하루 상한 */
  var er=m.er&&m.ea>=0&&m.ea<1800&&m.st!=="off"?(m.st==="err"?"최근 오류 ":"지난 오류 ")+dmonSec(m.ea)+" 전"+(m.en>1?" · "+m.en+"건":"")+" · "+m.er:"";
  return { c:x[0], t:t, sub:sub.join(" · "), er:er, st:m.st };
}
/* 행운권 첫 화면 맨 위 한 줄 */
function dmonLine(m){
  var v=dmonView(m); if(!v) return "";
  return '<div class="dmon-line '+v.c+'" role="status"><i aria-hidden="true"></i><b>'+esc(v.t)+'</b><span class="cap">'+esc(v.sub)+'</span>'+(v.er?'<span class="dmon-er">'+esc(v.er)+'</span>':'')+'</div>';
}
/* 지금 탭 서버 맥박 옆 작은 칸 · 누르면 행운권 첫 화면 */
function dmonMini(m){
  var v=dmonView(m); if(!v) return "";
  return '<button type="button" class="dmon-mini '+v.c+'" onclick="go(\'stage\',\'lk\')" title="'+esc(v.sub+(v.er?" · "+v.er:""))+'"><span class="cap">럭키드로우 무대</span><span class="dmon-mv"><i aria-hidden="true"></i><b>'+esc(v.t)+'</b></span><span class="cap dmon-ms">'+esc(v.er&&v.st==="err"?v.er:v.sub)+'</span></button>';
}
