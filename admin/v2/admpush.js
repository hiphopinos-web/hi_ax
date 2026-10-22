/* AXF CONTROL v2 · 설정 › 내 폰 알림(261022 사용자 「주요 이슈가 발생하면 슈퍼관리자에게 푸시」 · 커피챗 새 신청은 알림_커피챗 사람도)
 * 이 기기 켜기 = 알림 허용 → 서비스워커 sw.js(범위 /admin/v2/ · 참가자 앱 /sw.js 와 따로) → 구독 → 서버 adm_push_sub(콘솔 사람 입장 · 관리자알림구독 시트)
 * 끄기 = adm_push_unsub + 이 기기 구독 해제 · 시험 = adm_push_test(내 기기에만) · 읽기 = adm_push_me
 * 켠 기기는 콘솔을 열 때마다 구독을 한 번 다시 보낸다(서버가 지운 구독 · 주소가 바뀐 구독을 잇는다) · 알림을 누르면 sw.js 가 콘솔 화면으로 옮긴다(postMessage · #화면)
 * 아이폰 = 홈 화면에 추가한 AXF 관리 앱에서만(iOS 16.4 이상) · 받는 사람 = 슈퍼관리자 · 설정 알림_커피챗 사람(커피챗 새 신청만) */
var AP={ busy:"", err:"", synced:0 };
var AP_KINDS=[["커피챗 새 신청","10분 묶음 「n건」","미팅 › 커피챗","전부 · 커피챗 담당"],["AX 라운지 새 신청","10분 묶음","미팅 › AX 라운지","슈퍼관리자"],["비밀번호 초기화 요청","10분 묶음","명단 › 비밀번호 초기화","슈퍼관리자"],
  ["관리자 비밀번호 발급 · 정함","곧바로 · 2분 안 나머지 「n건 더」","설정 › 관리자 명단","슈퍼관리자"],["일괄 저장(백업) 내려받음","곧바로 · 3시간 안 나머지 「n건 더」","설정 › 일괄 저장","슈퍼관리자"],
  ["럭키드로우 진행(체크인 마감 · 다시 열기 · 공 넣기 · 통 숫자 고정 · 무대 끝)","곧바로 · 2분 묶음","행운권","슈퍼관리자"],["경품 진행(참여상 · 7등 추첨 · 룰렛 소진)","곧바로 · 2분 묶음","경품 · 재고","슈퍼관리자"],
  ["공지 · 푸시 발송","곧바로 · 2분 묶음","설정 › 알림 › 보낸 기록","슈퍼관리자"],["운영 설정 · 참가자 푸시 스위치 · 타자왕 설정","곧바로 · 2분 묶음","설정 › 활동 기록","슈퍼관리자"],
  ["서버 예외 · 거절 급증 · 정시 백업 실패 · 푸시 키 오류","같은 문제 30분에 한 번","설정 › 서버 상태","슈퍼관리자"]];
function apUa(){ return navigator.userAgent||""; }
function apIos(){ var u=apUa(); return /iPhone|iPad|iPod/.test(u)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1); }
function apSa(){ try{ return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true; }catch(e){ return false; } }
function apCan(){ return "serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window; }
function apDev(){ var u=apUa(); return apIos()?"ios":/Android/.test(u)?"android":"pc"; }
function apKey(b){ var p=(b+"====".slice((b.length%4)||4)).replace(/-/g,"+").replace(/_/g,"/"), r=atob(p), a=new Uint8Array(r.length); for(var i=0;i<r.length;i++) a[i]=r.charCodeAt(i); return a; }
function apReg(){ return navigator.serviceWorker.register("sw.js",{ scope:"./" }).then(function(){ return navigator.serviceWorker.ready; }); }
function apSubNow(){ if(!apCan()) return Promise.resolve(null); return navigator.serviceWorker.getRegistration("./").then(function(r){ return r?r.pushManager.getSubscription():null; },function(){ return null; }); }
function apSend(sub){ var j=sub&&sub.toJSON?sub.toJSON():{}, k=j.keys||{}; return call("adm_push_sub",{ ep:j.endpoint||"", p256dh:k.p256dh||"", auth:k.auth||"", dev:apDev() }); }
function apWhy(r){ r=r||{}; return ({ notarget:"받는 사람이 아닙니다 · 슈퍼관리자 · 설정 「알림_커피챗」 사람", nopush:"이 서버는 알림을 보내지 못합니다", person:"사번으로 들어온 콘솔에서 켭니다", off:"설정 「관리자_알림」이 꺼져 있습니다", again:"20초 뒤 다시", nosub:"이 사번에 켠 기기가 없습니다", ep:"이 브라우저 구독 주소를 받지 못했습니다", keys:"구독 키가 맞지 않습니다" })[r.reason]||why(r); }
function apOn(){
  var d=S.data.apm;
  if(!apCan()){ toast(apIos()&&!apSa()?"아이폰은 홈 화면에 추가한 AXF 관리 앱에서 켭니다":"이 브라우저는 알림을 받지 못합니다",{ bad:1 }); return; }
  if(!d||!d.ok||!d.k){ toast(apWhy(d||{ reason:"nopush" }),{ bad:1 }); return; }
  AP.busy="on"; AP.err=""; apPaint();
  Notification.requestPermission().then(function(pm){
    if(pm!=="granted") throw { reason:"perm" };
    return apReg();
  }).then(function(reg){
    return reg.pushManager.getSubscription().then(function(s){ return s||reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:apKey(d.k) }); });
  }).then(apSend).then(function(r){
    AP.busy="";
    if(r&&r.ok){ lsSet("ap_on",1); AP.synced=1; S.data.apm=r.me||S.data.apm; toast("이 기기에서 관리자 알림을 켰습니다",{ undo:function(){ apOff(1); } }); }
    else { AP.err=apWhy(r); toast("켜지 못했습니다 · "+AP.err,{ bad:1 }); }
    reload(["apm"]); apPaint();
  },function(e){ AP.busy=""; AP.err=e&&e.reason==="perm"?"알림이 허용되지 않았습니다 · 폰 설정 › 알림에서 허용":"켜지 못했습니다 · 브라우저가 구독을 거절"; toast(AP.err,{ bad:1 }); apPaint(); });
}
function apOff(quiet){
  var go=function(){
    AP.busy="off"; apPaint();
    return apSubNow().then(function(s){
      var ep=s&&s.endpoint||"";
      return (ep?call("adm_push_unsub",{ ep:ep }):Promise.resolve({ ok:true, n:0 })).then(function(r){ return s?s.unsubscribe().then(function(){ return r; },function(){ return r; }):r; });
    }).then(function(r){
      AP.busy=""; lsSet("ap_on",0);
      if(r&&r.ok){ if(r.me) S.data.apm=r.me; toast("이 기기 관리자 알림을 껐습니다",quiet?{}:{ undo:function(){ apOn(); } }); } else toast("끄지 못했습니다 · "+apWhy(r),{ bad:1 });
      reload(["apm"]); apPaint();
    });
  };
  if(quiet) return go();
  confirmBox({ t:"이 기기 관리자 알림을 끌까요?", who:"이 기기", sub:"다른 기기에서 켠 알림은 그대로", ok:"끄기", danger:true, run:function(){ return go().then(function(){ return { ok:true }; }); }, done:function(){} });
}
function apTest(){
  AP.busy="test"; apPaint();
  call("adm_push_test",{}).then(function(r){ AP.busy=""; toast(r&&r.ok?"시험 알림을 보냈습니다 · 잠시 뒤 이 사번의 켠 기기에 옵니다":"보내지 못했습니다 · "+apWhy(r),{ bad:!(r&&r.ok) }); apPaint(); });
}
/* 켠 기기 · 콘솔을 열면 한 번 구독을 다시 보낸다 */
function apSync(){
  if(AP.synced||!authed()||!lsGet("ap_on",0)||!apCan()||Notification.permission!=="granted") return;
  AP.synced=1;
  apSubNow().then(function(s){ if(s) apSend(s).then(function(r){ if(r&&r.ok&&r.me){ S.data.apm=r.me; apPaint(); } }); });
}
function apPaint(){
  var box=el("apBox"); if(!box) return;
  var d=S.data.apm, g=dataGate("apm","관리자 알림"), on=!!lsGet("ap_on",0)&&apCan()&&typeof Notification!=="undefined"&&Notification.permission==="granted", h="";
  if(g){ box.innerHTML='<div class="card">'+g+'</div>'; return; }
  var who=d.who==="super"?"슈퍼관리자 · 아래 알림 전부":d.who==="cc"?"커피챗 담당 · 커피챗 새 신청":"";
  if(!d.rt) h+=band("info","이 서버는 알림을 보내지 못합니다");
  else if(!d.on) h+=band("warn","설정 「관리자_알림」이 꺼져 있어 알림이 나가지 않습니다");
  if(d.rt&&!who) h+=band("info","받는 사람이 아닙니다 · 슈퍼관리자 · 설정 「알림_커피챗」에 넣은 사람이 받습니다");
  if(apIos()&&!apSa()) h+=band("info","아이폰 = 공유 › 홈 화면에 추가 › 홈 화면의 AXF 관리 앱에서 켭니다 · iOS 16.4 이상");
  else if(!apCan()) h+=band("info","이 브라우저는 알림을 받지 못합니다 · 크롬 · 삼성 인터넷 · 홈 화면 앱");
  if(typeof Notification!=="undefined"&&Notification.permission==="denied") h+=band("warn","이 브라우저에서 알림이 막혀 있습니다 · 폰 설정 › 알림 › AXF 관리 허용");
  var dis=function(x){ return x?" disabled":""; }, can=d.rt&&who&&apCan()&&!AP.busy;
  h+='<div class="grid g2"><div class="card"><h2>이 기기</h2>'+
    '<div class="row"><div class="t"><b>'+(on?"관리자 알림 받는 중":"꺼짐")+'</b><span>'+esc(who||"받는 사람 아님")+'</span></div>'+stt(on?"ok":"off",on?"켜짐":"꺼짐")+'</div>'+
    '<div class="row"><div class="t"><b>이 사번에 켠 기기</b><span>'+(d.n?esc(String(d.n))+"대"+(d.last?" · 마지막 도착 "+esc(String(d.last).slice(5,16)):""):"없음")+'</span></div></div>'+
    '<div class="btns mt">'+(on?'<button type="button" class="btn" onclick="apOff()"'+dis(AP.busy)+'>'+(AP.busy==="off"?"끄는 중":"이 기기 끄기")+'</button>':'<button type="button" class="btn pri" onclick="apOn()"'+dis(!can)+'>'+(AP.busy==="on"?"켜는 중":"이 기기에서 켜기")+'</button>')+
    '<button type="button" class="btn" onclick="apTest()"'+dis(!d.n||!d.on||AP.busy)+'>'+(AP.busy==="test"?"보내는 중":"시험 알림")+'</button></div>'+
    (AP.err?'<p class="cap mt">'+esc(AP.err)+'</p>':'')+
    '<p class="cap mt">알림을 누르면 콘솔의 그 화면이 열림 · 사번당 3대</p></div>'+
    '<div class="card"><h2>받는 알림</h2><table class="tb"><thead><tr><th>무엇</th><th>언제</th><th>누르면</th></tr></thead><tbody>'+
    AP_KINDS.filter(function(k){ return d.who!=="cc"||k[3].indexOf("커피챗 담당")>=0; }).map(function(k){ return '<tr><td><b>'+esc(k[0])+'</b></td><td class="cap">'+esc(k[1])+'</td><td class="cap">'+esc(k[2])+'</td></tr>'; }).join("")+
    '</tbody></table><p class="cap mt">하루 60건 상한 · 서버 이상은 상한 밖 · 본문에 참가자 사번 · 이름 없음</p>'+(d.who==="super"?'<p class="cap">끄고 켜기 = 설정 › 운영 설정 「관리자 주요 이슈 푸시」 · 커피챗 담당 = 「커피챗 새 신청 알림 받는 사람」(현재 '+esc(String(d.cc||0))+'명)</p>':'')+'</div></div>';
  box.innerHTML=h;
}
/* 설정 탭 칩 「내 폰 알림」 · 기존 화면(setting.js)을 감싼다(bkup.js 와 같은 방식) */
(function(){ if(typeof LG_SUBS==="undefined"||!window.SCREENS||!SCREENS.log) return;
  if(!LG_SUBS.some(function(x){ return x[0]==="apush"; })) LG_SUBS.splice(Math.max(0,LG_SUBS.map(function(x){ return x[0]; }).indexOf("ntf")+1),0,["apush","내 폰 알림"]);
  var sc=SCREENS.log, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return lgSub()==="apush"?[{ k:"apm", a:"adm_push_me", ttl:30000 }]:n0_(); };
  sc.mount=function(vb){ if(lgSub()!=="apush") return m0(vb); var c=el("phCap"); if(c) c.textContent="주요 이슈를 이 폰 알림으로 받기 · 슈퍼관리자 · 커피챗 담당"; vb.innerHTML=chipsH(LG_SUBS,"apush")+'<div id="apBox"></div>'; apPaint(); };
  sc.paint=function(vb){ if(lgSub()!=="apush") return p0(vb); apPaint(); };
  /* 알림을 누름 · 서비스워커가 열린 콘솔 창에 화면을 넘긴다 */
  if(apCan()) navigator.serviceWorker.addEventListener("message",function(e){ var m=e.data||{}; if(m.axf==="go"&&/^[a-z0-9_/-]{1,62}$/.test(String(m.go||""))){ location.hash="#"+m.go; } });
  setInterval(apSync, 5000);
})();
