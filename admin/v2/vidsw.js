/* AXF CONTROL v2 · 참가자 앱 영상 열기 · 닫기(261024 · 사용자 결정 · 날짜 고정 폐기)
 * 설정 › 운영 설정 칩 맨 위 카드 하나 · 영상 셋(AI 활용 현장 인터뷰 · HiDI Q · Hi-Helper) · 지금 상태 · 바꾼 사람 · 시각 · [열기] · [닫기](확인 창 한 번)
 * 서버 = vid_state(읽기 · 관리코드) · vid_set(POST · 슈퍼관리자 admTop_ · id · on 1 | 0 · 운영로그) · 설정 영상_공개(없으면 셋 다 닫힘)
 * 참가자 앱 = 다음 동기화 때 홈 「지금 현장」 아래 「영상 보기」 줄이 열림 · 닫힘(셋 다 닫히면 칸 없음) · 인쇄 QR 인터뷰 페이지(interview/)도 같은 스위치
 * 바꾸기는 슈퍼관리자 · 다른 콘솔 담당자는 상태만 본다 */
var VSW_NOTE={ iv:"유튜브 · 인쇄 QR 인터뷰 페이지도 같이 열림", hq:"1F AX PLAY · 앱 안 재생 1:35", hh:"1F AX PLAY · 앱 안 재생 1:54" };
(function(){
  var sc=SCREENS.log, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ var a=n0_(); return lgSub()==="cfg"?(a||[]).concat([{ k:"vsw", a:"vid_state", ttl:30000 }]):a; };
  sc.mount=function(vb){
    m0(vb); if(lgSub()!=="cfg") return;
    var g=el("mg_cfgv"), card=g&&g.closest(".card"); if(!card) return;
    var c=document.createElement("div"); c.className="card mb"; c.id="vswC"; card.parentNode.insertBefore(c,card);
  };
  sc.paint=function(vb){ p0(vb); if(lgSub()==="cfg") vswPaint(); };
})();
function vswPaint(){
  var box=el("vswC"); if(!box) return; var d=S.data.vsw;
  if(!d||!d.ok){ box.innerHTML='<h2>참가자 앱 영상</h2>'+(dataGate("vsw","참가자 앱 영상")||skel()); return; }
  var top=isTop(), n=(d.rows||[]).filter(function(r){ return r.on; }).length;
  box.innerHTML='<h2>참가자 앱 영상 <span class="cap">홈 「지금 현장」 아래 「영상 보기」</span><span class="r">'+tag(n?"열림 "+n+"개":"모두 닫힘 · 칸 없음",n?"ok":"off")+'</span></h2>'+
    (d.rows||[]).map(function(r){
      var who=r.at?(r.name||r.by||"")+" · "+String(r.at).slice(5,16):"바꾼 기록 없음";
      return '<div class="row"><div class="t"><b>'+esc(r.nm)+' '+(r.on?tag("열림","ok"):tag("닫힘","off"))+'</b><span>'+esc(VSW_NOTE[r.id]||"")+' · '+esc(who)+'</span></div>'+
        (top?'<button class="btn sm'+(r.on?"":" pri")+'" type="button" onclick="vswAsk(\''+r.id+'\','+(r.on?0:1)+')">'+(r.on?"닫기":"열기")+'</button>':'')+'</div>';
    }).join("")+
    (top?'':'<p class="cap mt">열기 · 닫기는 슈퍼관리자가 합니다</p>')+'<p class="cap mt">닫힌 영상 = 회색 「준비 중」 줄 · 셋 다 닫히면 칸 없음 · 참가자 앱은 다음 동기화 때 바뀜</p>';
}
function vswAsk(id, on){
  if(!isTop()){ toast("슈퍼관리자가 바꿉니다",{ bad:1 }); return; }
  var d=S.data.vsw, r=d&&d.ok?(d.rows||[]).filter(function(x){ return x.id===id; })[0]:null; if(!r) return;
  confirmBox({ t:on?"영상을 열까요?":"영상을 닫을까요?", who:r.nm+" · "+(r.on?"열림":"닫힘")+" → "+(on?"열림":"닫힘"),
    sub:(on?"참가자 앱에서 누르면 재생":"참가자 앱에서 회색 「준비 중」")+(id==="iv"?" · 인쇄 QR 인터뷰 페이지도 같이":"")+" · 다음 동기화 때 반영", ok:on?"열기":"닫기", danger:!on,
    run:function(){ return call("vid_set",{ id:id, on:on?"1":"0" }); },
    done:function(res){ if(res&&res.rows) S.data.vsw={ ok:true, rows:res.rows, t:res.t }; paint(); reload(["vsw"]); toast(r.nm+" · "+(on?"열었습니다":"닫았습니다")); } });
}
