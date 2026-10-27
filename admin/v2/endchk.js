/* AXF CONTROL v2 · 행사 종료 점검(261027 · 사용자 결정 「필요한 것만」)
 * 설정 › 운영 설정 칩 맨 위 카드 하나 · 항목별 지금 상태 · 새 단추는 현장 인터뷰 영상 하나(vidsw.js 의 vswAsk · 서버 vid_set iv 그대로 · 확인 창 · 슈퍼관리자)
 * 데이터 = cfg_list(og.sc · og.ph · 타자왕_체험) · vid_state(iv) · 둘 다 이 칩이 이미 받는 것 · 서버 호출 추가 없음
 * 참가자 앱 = 오픈 범위(급한 단추 › 앱 접속 범위)에서 바꾼다 · 이 카드는 보이기만
 * 1F 타자왕 순위판 = 서버 type_rank 가 오픈 범위 「행사 종료」면 순위 없이 ended 1 · 타자왕 PC 체험 = 설정 타자왕_체험
 * 순서 = index 에서 vidsw.js 앞(그 카드가 이 카드 아래에 붙는다) */
(function(){
  if(!document.getElementById("ekcCss")){ var st=document.createElement("style"); st.id="ekcCss"; st.textContent=".ekc .row .t>span{display:block}.ekc .row .t>span+span{margin-top:2px}"; document.head.appendChild(st); }
  var sc=SCREENS.log, m0=sc.mount, p0=sc.paint;
  sc.mount=function(vb){
    m0(vb); if(lgSub()!=="cfg") return;
    var g=el("mg_cfgv"), card=g&&g.closest(".card"); if(!card) return;
    var c=document.createElement("div"); c.className="card mb ekc"; c.id="ekcC"; card.parentNode.insertBefore(c,card);
  };
  sc.paint=function(vb){ p0(vb); if(lgSub()==="cfg") ekcPaint(); };
})();
function ekcRow(nm, on, sub, btn){ return '<div class="row"><div class="t"><b>'+esc(nm)+' '+tag(on?"열림":"닫힘",on?"ok":"off")+'</b>'+sub.map(function(s){ return '<span>'+esc(s)+'</span>'; }).join("")+'</div>'+(btn||"")+'</div>'; }
function ekcPaint(){
  var box=el("ekcC"); if(!box) return; var d=S.data.cfgl;
  if(!d||!d.ok){ box.innerHTML='<h2>행사 종료 점검</h2>'+(dataGate("cfgl","운영 설정")||skel()); return; }
  var og=d.og||{}, end=og.ph==="end"||og.sc==="종료", lab=((typeof OG_OPT!=="undefined"?OG_OPT:[]).filter(function(o){ return o[0]===og.sc; })[0]||[0,og.sc||"-"])[1];
  var tr=(d.rows||[]).filter(function(r){ return r.k==="타자왕_체험"; })[0], trOn=!!tr&&String(tr.v).toUpperCase()==="ON";
  var v=S.data.vsw, iv=v&&v.ok?(v.rows||[]).filter(function(r){ return r.id==="iv"; })[0]:null, top=isTop();
  var ivWho=iv?(iv.at?(iv.name||iv.by||"")+" · "+String(iv.at).slice(5,16):"바꾼 기록 없음"):"불러오는 중";
  var ivBtn=iv&&top?'<button class="btn sm'+(iv.on?"":" pri")+'" type="button" onclick="vswAsk(\'iv\','+(iv.on?0:1)+')">'+(iv.on?"닫기":"열기")+'</button>':"";
  var n=(end?0:1)+(iv&&iv.on?1:0)+(end?0:1)+(trOn?1:0);
  box.innerHTML='<h2>행사 종료 점검 <span class="cap">참가자가 여는 화면 · 지금 상태</span><span class="r">'+tag(n?"참가자 화면 열림 "+n+"개":"참가자 화면 모두 닫힘",n?"warn":"off")+'</span></h2>'+
    ekcRow("참가자 앱",!end,["QR 36장 · 짧은 주소 · 럭키드로우 체크인 · 설문","오픈 범위 「"+lab+(og.sc==="자동"&&og.ph?" · "+((typeof OG_PH!=="undefined"&&OG_PH[og.ph])||og.ph):"")+"」","바꾸기 · 급한 단추 › 앱 접속 범위 「행사 종료로」"])+
    ekcRow("현장 인터뷰 영상",!!(iv&&iv.on),["리플릿 QR · 앱 「영상 보기」 · "+ivWho],ivBtn)+
    ekcRow("1F 타자왕 순위판",!end,["행사 종료와 함께 닫힘"])+
    ekcRow("타자왕 PC 체험",trOn,["설정 타자왕_체험 "+(tr?String(tr.v).toUpperCase():"-")])+
    '<div class="row"><div class="t"><b>콘솔 · 무대 · 체크인 TV '+tag("열림","ok")+'</b><span>운영자 화면 · 그대로 열림</span></div></div>'+
    (top?'':'<p class="cap mt">영상 열기 · 닫기는 슈퍼관리자가 합니다</p>');
}
