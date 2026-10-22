/* AXF CONTROL v2 · 무대 › 추첨 설정 (261016 4단계 · 지금 콘솔 att.js 「추첨 › 설정」을 옮김)
 * 데이터 = draw_stats(code · win · day · closed · in · withT · att · winOn) + cfg_list(오픈_범위 · 창검사 · 행운권_참석조건 읽기)
 * 바꾸기 = draw_cfg(code AXD + 6자 · win 16:40-17:25 · day 비우면 매일 · closed 0 | 1) · 확인 창 · 코드를 바꾸면 인쇄물 QR 로는 체크인 안 됨
 * 행운권 참석조건은 운영 설정이라 보기만(바꾸기는 대화로)
 * 261021 체크인 2통 · 끝 시각은 쓰지 않음(마감은 단추) · 무대 공 넣기 뒤(draw_stats lock)에는 다시 열기 막음 · 당일 점검 칸 = dtwo.js */
var DWS_WHY={ code:"코드는 AXD + 6자입니다(QR코드/codes.json 의 d17)", win:"시간 형식은 16:40-17:25 입니다(시작 < 끝)", day:"날짜 형식은 2026-10-26 입니다(비우면 매일)", closed:"마감 값이 올바르지 않습니다" };
SG_SUBS.push(["set","추첨 설정"]);
function dwsCfg(k){ var d=S.data.cfgl; return d&&d.ok?(d.rows||[]).filter(function(r){ return r.k===k; })[0]||null:null; }
function dwsWin(d){
  var b=dwsCfg("오픈_범위"), bf=b?String(b.v)==="클로즈베타":null, w=dwsCfg("창검사");
  if(bf) return "베타 · 시간 해제 · 클로즈 베타 동안 시간 · 날짜를 보지 않음"+(w?" · 설정 「창검사」 "+String(w.v).toUpperCase():"");
  if(bf===null&&!d.winOn) return "확인 중";
  return d.winOn?"켜짐":"꺼짐 · 지금은 시간 · 날짜를 보지 않음";
}
function dwsPaint(){
  var b=el("dwsB"); if(!b) return; var gt=dataGate("draw","추첨 설정"); if(gt){ b.innerHTML=gt; return; }
  var d=S.data.draw, av=d.att!=null?String(d.att).toUpperCase():null, ac=dwsCfg("행운권_참석조건");
  if(!el("dwsCode")){
    b.innerHTML='<div class="grid g2 s1"><div class="card"><h2>추첨 코드 · 체크인 시간</h2><p class="cap">17F 입구 인쇄물 QR 과 같아야 함</p>'+
      '<div class="nt-row"><label class="nt-f up-f">추첨 코드<input class="xg-q nt-in n" id="dwsCode" autocomplete="off" spellcheck="false" placeholder="AXD + 6자"></label>'+
      '<label class="nt-f up-f">체크인 시간<input class="xg-q nt-in n" id="dwsWin" placeholder="16:40-17:25"></label>'+
      '<label class="nt-f up-f">날짜(비우면 매일)<input class="xg-q nt-in n" id="dwsDay" placeholder="2026-10-26"></label></div>'+
      '<div class="btns mt"><button class="btn pri" type="button" onclick="dwsSave()">저장</button><button class="btn" type="button" onclick="dwsFill(1)">지금 값으로</button></div><p class="cap mt">체크인 시간의 끝 시각은 쓰지 않음 · 마감은 「체크인 마감」 단추</p><p class="cap mt4" id="dwsNote"></p></div>'+
      '<div class="col"><div class="card" id="dwsCl"></div><div class="card" id="dwsAt"></div><div class="card" id="dtChk"></div><div class="card" id="dtRh"></div></div></div>';
    dwsFill(1);
  }
  el("dwsNote").innerHTML=(d.code?"":"<b>코드가 비어 있어 체크인을 받지 않습니다.</b> ")+"시간 · 날짜 검사 "+esc(dwsWin(d))+' · <span style="white-space:nowrap">기준 '+esc(fmtD(d.t))+'</span>';
  el("dwsCl").innerHTML='<h2>17F 입구 체크인</h2>'+('closed' in d?'<div class="row"><div class="t"><b>'+(d.closed?"체크인 마감":"체크인 받는 중")+'</b><span>체크인 '+n0(d["in"])+'명 · 행운권 있음 '+n0(d.withT)+'</span></div>'+(d.closed?tag("마감","warn"):tag("받는 중","ok"))+'<button class="btn'+(d.closed?"":" dng")+'" type="button" '+(d.closed&&d.lock?'disabled ':'')+'onclick="dwsClose('+(d.closed?0:1)+')">'+(d.closed?"다시 열기":"체크인 마감")+'</button></div><p class="cap mt4">시작 '+esc(hm(String(d.win||"").split("-")[0])||"-")+' · 마감은 단추'+(d.closed&&d.lock?' · 무대 공 넣기 뒤에는 다시 열 수 없음, 다시 열면 통 숫자가 어긋남':'')+'</p>':laterH("체크인 마감"));
  if(el("dtChk")&&typeof dtChkH==="function") el("dtChk").innerHTML=dtChkH(d);
  if(el("dtRh")&&typeof dtRhH==="function") el("dtRh").innerHTML=dtRhH();
  el("dwsAt").innerHTML='<h2>행운권 참석조건</h2><div class="row"><div class="t"><b>'+(av==null?"서버 갱신 뒤":av==="OFF"?"OFF · 번호 전체가 풀":"ON · 17F 입구 체크인한 사람만")+'</b><span>무대 추첨 풀 · 바꾸기는 대화로</span></div>'+(av==null?"":tag(av,av==="OFF"?"":"warn"))+'</div>'+(ac?'<p class="cap mt4">운영 설정 「행운권_참석조건」 = '+esc(String(ac.v))+'</p>':'');
}
function dwsFill(force){ var d=S.data.draw||{}; [["dwsCode",d.code],["dwsWin",d.win],["dwsDay",d.day]].forEach(function(x){ var i=el(x[0]); if(i&&(force||!i.value)) i.value=x[1]||""; }); }
function dwsSave(){
  var d=S.data.draw||{}, c=el("dwsCode").value.toUpperCase().replace(/[^A-Z0-9]/g,""), w=el("dwsWin").value.replace(/\s+/g,"").replace("~","-"), dy=el("dwsDay").value.trim(), p={}, ch=[];
  if(c!==(d.code||"")){ if(!/^AXD[A-Z0-9]{6}$/.test(c)){ toast(DWS_WHY.code,{ bad:1 }); return; } p.code=c; ch.push("코드 "+(d.code||"(없음)")+" → "+c); }
  if(w!==(d.win||"")){ p.win=w; ch.push("시간 "+(d.win||"-")+" → "+w); }
  if(dy!==(d.day||"")){ p.day=dy; ch.push("날짜 "+(d.day||"(매일)")+" → "+(dy||"(매일)")); }
  if(!ch.length){ toast("바뀐 것이 없습니다"); return; }
  var old={ code:d.code||"", win:d.win||"", day:d.day||"" };
  confirmBox({ t:"추첨 설정을 바꿀까요?", who:ch.join(" · "), sub:p.code?"코드를 바꾸면 17F 입구 인쇄물 QR 로는 체크인되지 않음":"17F 입구 체크인에 바로 적용", ok:"저장", danger:!!p.code,
    run:function(){ return call("draw_cfg",p); }, fail:function(r){ return r&&DWS_WHY[r.reason]||""; },
    done:function(r){ if(r&&r.ok&&r.code!=null) S.data.draw=r; reload(["draw"]); dwsFill(1); dwsPaint();
      var u={}; Object.keys(p).forEach(function(k){ if(old[k]||k!=="code") u[k]=old[k]; });
      toast("추첨 설정을 저장했습니다", Object.keys(u).length?{ undo:function(){ call("draw_cfg",u).then(function(x){ reload(["draw"]); setTimeout(function(){ dwsFill(1); },600); toast(x&&x.ok?"되돌렸습니다 · 추첨 설정":"되돌리지 못했습니다 · "+(DWS_WHY[(x||{}).reason]||why(x)),{ bad:!(x&&x.ok) }); }); } }:{}); } });
}
function dwsClose(v){
  if(!v&&S.data.draw&&S.data.draw.lock){ toast("무대 공 넣기 뒤에는 다시 열 수 없습니다 · 다시 열면 통 숫자가 어긋남",{ bad:1 }); return; }
  confirmBox({ t:v?"추첨 체크인을 마감할까요?":"추첨 체크인을 다시 열까요?", who:"17F 입구 체크인", sub:v?"아직 체크인하지 않은 사람은 QR 을 찍어도 「체크인이 마감됐어요」 · 이미 한 사람은 그대로":"시간 안에 찍은 사람의 체크인을 다시 받음", ok:v?"마감":"다시 열기", danger:!!v,
    run:function(){ return call("draw_cfg",{ closed:String(v) }); },
    done:function(r){ if(r&&r.code!=null) S.data.draw=r; reload(["draw"]); dwsPaint(); toast(v?"추첨 체크인을 마감했습니다":"추첨 체크인을 다시 열었습니다",{ undo:function(){ call("draw_cfg",{ closed:String(v?0:1) }).then(function(x){ reload(["draw"]); toast(x&&x.ok?"되돌렸습니다":"되돌리지 못했습니다 · "+why(x),{ bad:!(x&&x.ok) }); }); } }); } });
}
(function(){
  var sc=SCREENS.stage, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return sgSub()==="set"?[{ k:"draw", a:"draw_stats", ttl:15000 },{ k:"cfgl", a:"cfg_list", ttl:60000 }]:n0_(); };
  sc.mount=function(vb){
    if(sgSub()!=="set") return m0(vb);
    el("phCap").textContent="17F 입구 추첨 체크인 · 코드 · 시간 · 마감 · 참석조건";
    vb.innerHTML=chipsH(SG_SUBS,"set")+'<div id="dwsB">'+skel()+'</div>';
  };
  sc.paint=function(vb){ if(sgSub()!=="set") return p0(vb); dwsPaint(); };
})();
