/* AXF CONTROL v2 · 기기 뒤로 가기(261022 사용자 「휴대폰에서 뒤로가기 하면 많이 튕긴다」) · 모든 화면 파일 다음 · boot() 앞에 불러온다
 * 뒤로 가기 = 열린 확인 창 → 시트(체크인 카메라 · 미팅 칸 고르기) → 서랍 순으로 하나씩 닫기 → 이전 탭 · 칩
 *   → 첫 칸이면 「한 번 더 누르면 나갑니다」 토스트 · 2초 안에 다시 누르면 브라우저가 나간다(설치한 앱도 같음)
 * 기록 칸 = 맨 아래 B(i 0) 위에 화면 칸 V · 레이어 칸 L(레이어 하나 = 칸 하나 · mobile-popup-motion 규칙)
 *   · 탭 · 칩 바꿈 = 누른 직후면 칸 하나(누름 없이 바뀐 것 · 같은 탭 다시 누르기 · 5초 갱신 = 칸 안 늘어남)
 *   · 단추 · Esc · 바깥 누름으로 닫은 레이어 칸 = 빈 칸 · 다음에 열거나 옮길 때 그 칸을 덮어 쓴다(칸이 쌓이지 않음)
 *   · 뒤로 가서 아무것도 안 바뀌면(빈 칸) 한 칸 더 뒤로
 *   · 첫 화면 칸은 첫 누름 때 쌓는다 · 토스트 뒤에는 다음 누름 때 다시 쌓는다(크롬은 누름 없이 쌓은 칸을 뒤로 가기에서 건너뛴다) */
var BK={ cur:null, armed:false, exitAt:0, auto:0, hc:null };
function bkActive(){ var u=navigator.userActivation; return u?!!u.isActive:true; }
function bkLayers(){   /* 열린 레이어 · 아래 → 위 */
  var a=[];
  if(typeof DRW!=="undefined"&&DRW.k) a.push("drw");
  if(typeof MT!=="undefined"&&MT&&MT.pick) a.push("pick");
  if(typeof CKI!=="undefined"&&CKI&&CKI.cam) a.push("cam");
  if(typeof DLG!=="undefined"&&DLG.o) a.push("dlg");
  return a;
}
function bkDead(s){ return !!s&&s.t==="L"&&bkLayers().indexOf(s.L)<0; }
function bkH(){ return location.hash||(typeof hashOf==="function"?hashOf():""); }   /* 주소에 해시가 없으면(처음 /admin/v2/) 지금 화면 해시 */
function bkUrl(h){ return h||(location.pathname+location.search); }
function bkRep(s){ s.axb=1; try{ history.replaceState(s,"",bkUrl(s.h)); }catch(e){} BK.cur=s; }
function bkPush(s){ s.axb=1; s.i=(BK.cur?BK.cur.i:0)+1; try{ history.pushState(s,"",bkUrl(s.h)); }catch(e){ return; } BK.cur=s; BK.armed=true; }
function bkArm(){ if(BK.armed||!BK.cur) return; bkPush({ t:"V", h:bkH() }); }   /* 첫 화면 칸(누른 직후만) */
/* 레이어가 열릴 때 · 같은 종류 칸 · 빈 칸이면 그 칸을 쓴다 */
function bkLayer(L){
  var c=BK.cur; if(!c) return;
  if(c.t==="L"&&c.L===L) return;
  var s={ t:"L", L:L, h:bkH() };
  if(BK.armed&&c.i>0&&bkDead(c)){ s.i=c.i; bkRep(s); return; }
  if(!BK.armed) bkArm();
  bkPush(s);
}
/* 탭 · 칩이 바뀔 때(core.js hashSet) · 누른 직후 = 칸 하나 · 아니면 지금 칸을 바꿈 · 레이어 칸 위면 그 칸을 화면 칸으로 */
function bkNav(h){
  var c=BK.cur;
  if(!c||!bkActive()){ if(c){ c.h=h; bkRep(c); } else try{ history.replaceState(history.state,"",h); }catch(e){} return; }
  if(!BK.armed) bkArm();
  c=BK.cur;
  if(c.t==="L"&&c.i>0){ bkRep({ t:"V", h:h, i:c.i }); return; }
  bkPush({ t:"V", h:h });
}
function bkHc(h){ BK.hc={ h:h, t:Date.now() }; }   /* 이 popstate 가 이미 그린 화면 · 뒤따르는 hashchange 한 번은 건너뜀(0.6초 안) */
function bkHcSkip(){ var x=BK.hc; BK.hc=null; return !!x&&x.h===location.hash&&Date.now()-x.t<600; }
function bkClose(L){
  if(L==="dlg") dlgClose();
  else if(L==="cam"&&typeof ckiCamClose==="function") ckiCamClose();
  else if(L==="pick"&&typeof mtPickOff==="function") mtPickOff();
  else if(L==="drw") drwClose();
}
function bkStamp(){ if(BK.cur&&!(history.state&&history.state.axb)){ BK.cur.h=location.hash; bkRep(BK.cur); } }   /* core.js routeFromHash 가 옛 주소를 바꾸며 칸 표시를 지웠으면 다시 붙인다 */
function bkRoute(){ bkHc(location.hash); routeFromHash(); bkStamp(); render(); load(false); }
window.addEventListener("hashchange",bkStamp);
function bkExit(){ BK.armed=false; BK.exitAt=Date.now(); toast("한 번 더 누르면 나갑니다",{ ms:2000 }); }
window.addEventListener("popstate",function(e){
  var A=e.state&&e.state.axb?e.state:null, P=BK.cur, was=hashOf();
  if(!A){ bkRep({ t:"V", h:location.hash, i:(P?P.i:0)+1 }); BK.armed=true; return; }   /* 해시 링크 · 주소창 = 새 화면 칸(hashchange 가 그린다) */
  BK.cur=A; if(A.i>0) BK.armed=true;
  if(!P||A.i>=P.i) return;                                                          /* 앞으로 · hashchange 가 그린다 */
  var ly=bkLayers();
  if(ly.length){
    var top=ly[ly.length-1];
    if(top==="dlg"&&DLG.busy){ bkPush({ t:"L", L:"dlg", h:was }); return; }   /* 처리 중인 확인 창은 닫지 않는다 */
    BK.auto=0;
    bkClose(top);
    if(location.hash!==was){ A.h=was; bkRep(A); bkHc(was); }   /* 레이어만 닫고 화면은 그대로 */
    return;
  }
  if(A.i===0){ BK.auto=0; if((A.h||"")!==was&&A.h) bkRoute(); bkExit(); return; }
  if((A.h||"")!==was){ BK.auto=0; bkRoute(); return; }
  if(BK.auto<30){ BK.auto++; try{ history.back(); }catch(x){} }                     /* 빈 칸 · 아무것도 안 바뀜 = 한 칸 더 */
});
/* 첫 화면 칸 · 누를 때 쌓는다(처음 · 나가기 토스트 뒤) */
function bkGesture(){ BK.auto=0; if(!BK.armed) bkArm(); }
document.addEventListener("click",bkGesture,true);
document.addEventListener("keydown",function(e){ if(e.key!=="Escape"&&e.key!=="Tab") bkGesture(); },true);
function bkInit(){
  var s=history.state&&history.state.axb?history.state:null;
  if(s){ bkRep({ t:s.i>0?"V":"B", h:bkH(), i:s.i }); BK.armed=s.i>0; }   /* 새로 고침 · 레이어는 닫힌 채로 열림 */
  else{ bkRep({ t:"B", h:bkH(), i:0 }); BK.armed=false; }
}
/* 레이어 여는 함수 감싸기(각 화면 파일은 그대로) */
(function(){
  var w=function(name, L, isOpen){
    var f=window[name]; if(typeof f!=="function") return;
    window[name]=function(){ var was=isOpen(); var r=f.apply(this,arguments); if(!was&&isOpen()) bkLayer(L); return r; };
  };
  w("confirmBox","dlg",function(){ return !!DLG.o; });
  w("drwOpen","drw",function(){ return !!DRW.k; });
  w("ckiCam","cam",function(){ return typeof CKI!=="undefined"&&!!CKI.cam; });
  w("mtPickOn","pick",function(){ return typeof MT!=="undefined"&&!!MT.pick; });
  var b=window.boot; if(typeof b==="function") window.boot=function(){ var r=b.apply(this,arguments); bkInit(); return r; };
})();
