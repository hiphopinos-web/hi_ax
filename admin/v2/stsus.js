/* AXF CONTROL v2 · 기록 · 설정 › 현장 QR › 계단 의심 기록 (261026 사용자 「B · A + 너무 빠르면 적립 안 함」 3번 · 읽기 전용)
 * 자리 = 「2 · 계단실」 카드 바로 아래 한 칸(qr.js 는 고치지 않는다 · qrPaint 를 감싼다)
 * 읽기 = stair_stats(관리코드 · 이미 이 화면이 부른다 · qss) 의 sus[] · 오늘 · 테스트 사번 제외 · 새것 먼저 100건
 *   fast = 너무 빠른 종료(서버가 적립하지 않음) / slow1 = 정상 종료 · 한 층 10초 미만(설정 바꾸기 전 기록 포함) / many = 1분 안 종료 여러 번 / same = 같은 지점 ±2초 여러 사람 종료
 * 취소 · 수정 단추 없음(사람이 보고 판단 · 스탬프 취소는 사람 › 스탬프에서) · 옛 서버(sus 없음)면 한 줄 안내 */
var STS_WHY={ fast:["너무 빠름 · 미적립","warn"], slow1:["한 층 10초 미만","off"], many:["1분 안 여러 번","off"], same:["같은 지점 동시(±2초)","off"] };
(function(){
  if(typeof qrPaint!=="function"||qrPaint.__sts) return;
  var p0=qrPaint;
  qrPaint=function(){ p0.apply(this,arguments); stsPaint(); };
  qrPaint.__sts=1;
})();
function stsHm(ts){ var m=/(\d{2}:\d{2}:\d{2})$/.exec(String(ts||"")); return m?m[1]:String(ts||""); }
function stsCard(){
  var ss=S.data.qss;
  if(!ss||!ss.ok) return "";
  var l=ss.sus, per=ss.minPer||8;
  var h='<div class="card mt" id="stSus"><h2>계단 의심 기록 <span class="cap">오늘 · 읽기 전용 · 기준 층당 '+n0(per)+'초'+(l?' · '+n0(l.length)+'건':'')+'</span></h2>';
  if(!l) return h+'<p class="cap">서버가 아직 의심 기록을 주지 않습니다(서버 배포 뒤 보입니다)</p></div>';
  if(!l.length) return h+'<p class="cap">오늘 의심 기록 없음</p></div>';
  return h+'<div style="overflow-x:auto;max-height:520px;overflow-y:auto"><table class="tb"><thead><tr><th>시각</th><th>이름</th><th>소속</th><th>출발 → 도착</th><th class="n">걸린 초</th><th>사유</th></tr></thead><tbody>'+
    l.map(function(x){
      var why=(x.why||[]).map(function(w){ var d=STS_WHY[w]||[w,"off"]; return tag(d[0],d[1]); }).join(" ");
      return '<tr><td>'+esc(stsHm(x.ts))+'</td><td>'+esc(x.name||x.emp||"")+'</td><td>'+esc(x.dept||"")+'</td><td>'+esc(x.from)+'F → '+esc(x.to)+'F · '+n0(x.floors)+'개 층</td><td class="n">'+(x.sec==null?"-":n0(x.sec))+'</td><td>'+why+'</td></tr>';
    }).join("")+'</tbody></table></div></div>';
}
function stsPaint(){
  var b=el("qvB"); if(!b) return;
  var old=el("stSus"); if(old) old.remove();
  var c=stsCard(); if(!c) return;
  var cards=b.children, at=cards.length>1?cards[1]:null;   /* QV_GRP 둘째 = 2 · 계단실 */
  if(at) at.insertAdjacentHTML("afterend",c); else b.insertAdjacentHTML("afterbegin",c);
}
