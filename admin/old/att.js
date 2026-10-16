/* ── 261014 추첨 › 설정 칸 · 코드 · 체크인 시간 · 마감 · 창 표시(index.html 400KB 상한이라 따로 둠 · 본문보다 먼저 불러 function 선언을 전역으로) ──
 * 창 표시 = 서버 draw_stats 의 winOn 은 클로즈 베타(설정 오픈_범위 = 클로즈베타)이면 코드가 시간 창을 덮어 항상 false 라 「꺼짐」으로 보였다.
 * 베타 여부는 cfg_list 의 오픈_범위 줄로 안다(서버 응답에 bf 없음) · 베타면 「베타 · 시간 해제」 + 설정 창검사 값을 사실대로, 아니면 winOn 그대로(진짜 OFF = 꺼짐).
 * 쓰는 것 = 본문의 S · el · esc · tag · card · short · n0 · imp · dialog · pzCall · toast · why · cfgRowOf · cfgEditAsk · DRAW_WHY */
function drawBetaFree(){ var r=cfgRowOf("오픈_범위"); return r?String(r.v)==="클로즈베타":null; }
function drawWinTx(d){
  var bf=drawBetaFree(), w=cfgRowOf("창검사"), wv=w?String(w.v).toUpperCase():"";
  if(bf) return "<b>베타 · 시간 해제</b> · 클로즈 베타 동안 시간 · 날짜를 보지 않습니다"+(wv?" · 설정 「창검사」 "+esc(wv):"");
  if(bf===null&&!d.winOn) return "확인 중";
  return d.winOn?"켜짐":"꺼짐 · 지금은 시간 · 날짜를 보지 않습니다";
}
function drawSetHtml(d){
  var f='<div id="dwSet"><div class="fx"><label class="fld">추첨 코드(인쇄물과 같아야 함)<input id="dwCode" class="in n" style="width:150px" value="'+esc(d.code||"")+'" placeholder="AXD + 6자" autocomplete="off" spellcheck="false"></label>'+
    '<label class="fld">체크인 시간<input id="dwWin" class="in n" style="width:130px" value="'+esc(d.win||"")+'" placeholder="16:40-17:25"></label>'+
    '<label class="fld">날짜(비우면 매일)<input id="dwDay" class="in n" style="width:130px" value="'+esc(d.day||"")+'" placeholder="2026-10-26"></label>'+
    '<button class="btn pri" style="align-self:flex-end" data-qa="draw.cfg.save" onclick="drawCfgSave()">저장</button></div>'+
    '<p class="cap mt8">'+(d.code?"":"<b>코드가 비어 있어 체크인을 받지 않습니다.</b> ")+'시간 · 날짜 검사 '+drawWinTx(d)+'</p></div>';
  var cl='closed' in d?'<div class="fx">'+(d.closed?tag("체크인 마감","warn"):tag("체크인 받는 중","ok"))+'<button class="btn'+(d.closed?'':' danger')+'" data-qa="draw.close" onclick="drawCloseSet('+(d.closed?0:1)+')">'+(d.closed?'체크인 다시 열기':'체크인 마감')+'</button></div><p class="cap mt8">체크인 '+n0(d.in)+'명 · 행운권 있음 '+n0(d.withT)+'</p>':'<p class="cap">서버 배포 뒤</p>';
  var av=d.att!=null?String(d.att).toUpperCase():null;
  var at='<div class="fx">'+(av==null?tag("서버 갱신 뒤"):av==="OFF"?tag("OFF · 번호 전체가 풀","pri"):tag("ON · 17F 입구 체크인한 사람만","warn"))+(cfgRowOf("행운권_참석조건")?'<button class="btn sm" data-qa="draw.att" onclick="cfgEditAsk(\'행운권_참석조건\')">바꾸기</button>':'')+'</div>';
  return '<div class="grid g2">'+card("추첨 코드 · 체크인 시간",esc(short(d.t))+" 기준",f)+card("17F 입구 체크인","사회자가 마감을 알리면",cl)+'</div>'+card("행운권 참석조건","무대 추첨 풀",at,"","mt16");
}
function drawCloseSet(v){
  dialog({ t:v?"추첨 체크인을 마감할까요?":"추첨 체크인을 다시 열까요?", s:v?"아직 체크인하지 않은 사람은 QR 을 찍어도 「체크인이 마감됐어요」가 뜹니다. 이미 체크인한 사람은 그대로입니다.":"시간 안에 찍은 사람의 체크인을 다시 받습니다.", ok:v?"마감":"다시 열기", danger:!!v,
    onOk:function(){ pzCall("draw_cfg",{ closed:String(v) },["draw_stats"],function(r){ toast(r&&r.ok?(v?"추첨 체크인을 마감했습니다":"추첨 체크인을 다시 열었습니다"):"실패 · "+why(r)); }); } });
}
function drawCfgSave(){
  var d=S.data.draw||{}, c=el("dwCode").value.toUpperCase().replace(/[^A-Z0-9]/g,""), w=el("dwWin").value.replace(/\s+/g,"").replace("~","-"), dy=el("dwDay").value.trim();
  var p={}, lines=[];
  if(c!==(d.code||"")){ if(!/^AXD[A-Z0-9]{6}$/.test(c)){ toast(DRAW_WHY.code); return; } p.code=c; lines.push(["추첨 코드",esc((d.code||"(없음)")+" → "+c),"chg"]); }
  if(w!==(d.win||"")){ p.win=w; lines.push(["체크인 시간",esc((d.win||"-")+" → "+w),"chg"]); }
  if(dy!==(d.day||"")){ p.day=dy; lines.push(["날짜",esc((d.day||"(매일)")+" → "+(dy||"(매일)")),"chg"]); }
  if(!lines.length){ toast("바뀐 것이 없습니다"); return; }
  dialog({ t:"추첨 설정을 바꿀까요?", x:imp(lines), s:p.code?"<b>코드를 바꾸면 입구 인쇄물의 QR 로는 체크인되지 않습니다.</b>":"", ok:"저장", danger:!!p.code,
    onOk:function(){ pzCall("draw_cfg",p,["draw_stats"],function(r){ toast(r&&r.ok?"추첨 설정을 저장했습니다":"실패 · "+(DRAW_WHY[r&&r.reason]||why(r))); }); } });
}
