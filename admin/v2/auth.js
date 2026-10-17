/* AXF CONTROL v2 · 입장(261017 콘솔 개인 비밀번호 · 사용자 확정 P1~P4)
 * 서버가 adm_pw_info 를 알면 = 사번 + 개인 비밀번호 화면(처음이면 「설정 코드로 처음 입장」 · 설정 OFF 동안은 「관리코드로 입장」도) · 모르면(옛 서버) = 지금 화면(사번 + 관리코드)
 *   입장 = admin_check(aemp · pw · asc c) · 비밀번호 · 설정 코드 둘 다 pw 칸으로(서버가 줄 종류로 가른다) · 원문은 POST 본문으로만 · 저장하지 않는다
 *   설정 코드 통과 = need set + 코드 토큰 → 「비밀번호 정하기」(adm_pw_set · 새 비밀번호 두 번) → 입장
 *   바꾸기 = 기록 · 설정 › 서버 상태 「비밀번호 바꾸기」(adm_pw_set · 지금 입장 토큰 · 개인 비밀번호로 들어온 입장만)
 *   규칙(서버 pwprep.js pwRule 과 같다) = 8~64자 · 사번과 같으면 안 됨 · 아주 흔한 값 · 같은 글자 반복 · 이어진 숫자 거절 · 조합 강제 없음 */
var PWM={ mode:"old", on:0, kind:"pw", set:null, info:null };   /* mode old(관리코드) | pw · kind pw | code(설정 코드) | key(OFF 동안 관리코드) · set = { emp, tok } 정하기 단계 */
var PW_COMMON=["password","password1","passw0rd","12345678","123456789","1234567890","87654321","11111111","00000000","qwerty123","qwertyuiop","asdfghjkl","abcdefgh","abcd1234","iloveyou",
  "letmein1","welcome1","admin123","administrator","hyundai1","hyundai12","hyundai2026","hi123456","hi1234567","hicorp2026","axfestival","ax202610","ax20261026","metowe2026","festival2026","a12345678","1q2w3e4r","1q2w3e4r5t","qwer1234","zxcv1234"];
var PW_WHY={ short:"8자 이상으로 넣습니다", "long":"64자까지입니다", emp:"사번과 같은 값은 쓸 수 없습니다", common:"아주 흔한 값이라 쓸 수 없습니다", repeat:"같은 글자 반복은 쓸 수 없습니다", seq:"이어진 숫자는 쓸 수 없습니다", twice:"두 번 넣은 비밀번호가 다릅니다" };
function pwWhy(pw, emp){
  var s=String(pw==null?"":pw); if(s.length<8) return "short"; if(s.length>64) return "long";
  var low=s.toLowerCase(), e=normE(emp||"");
  if(e&&(low===e.toLowerCase()||low===("0"+e).toLowerCase())) return "emp";
  if(PW_COMMON.indexOf(low)>=0) return "common";
  if(/^(.)\1+$/.test(s)) return "repeat";
  if(/^\d+$/.test(s)){ var up=true, dn=true; for(var i=1;i<s.length;i++){ var d=s.charCodeAt(i)-s.charCodeAt(i-1); if(d!==1&&d!==-9) up=false; if(d!==-1&&d!==9) dn=false; } if(up||dn) return "seq"; }
  return "";
}
/* 서버가 개인 비밀번호를 아는지 · 콘솔을 먼저 올려도 옛 서버면 지금 화면 그대로 */
function pwDetect(then){
  call("adm_pw_info",{ aemp:"", tok:"" },8000).then(function(r){
    if(r&&r.ok&&r.iter>0){ PWM.mode="pw"; PWM.on=num(r.on); PWM.info=r; if(PWM.kind==="key"&&PWM.on) PWM.kind="pw"; }
    else { PWM.mode="old"; PWM.on=0; }
    then&&then();
  });
}
/* 잠금 화면 그리기 · msg = 안내 한 줄 */
function lockUI(msg){
  var b=el("lockBody"); if(!b) return;
  var e=aemp(), set=PWM.set, pw=PWM.mode==="pw";
  if(set){
    b.innerHTML='<p class="cap">사번 '+esc(set.emp)+' · 처음 들어왔습니다 · 앞으로 쓸 비밀번호를 정합니다</p>'+
      '<label>새 비밀번호<input id="pw1" type="password" autocomplete="new-password" maxlength="64" oninput="pwHint()"></label>'+
      '<label>한 번 더<input id="pw2" type="password" autocomplete="new-password" maxlength="64" oninput="pwHint()"></label>'+
      '<p class="cap mt4" id="pwH">8자 이상 · 사번과 같은 값 · 흔한 값은 쓸 수 없음</p>'+
      '<button class="btn pri big" type="button" id="lockGo" onclick="pwSetGo()">비밀번호 정하기</button>'+
      '<div class="err" id="lockErr" role="alert"></div><p class="cap mt"><a href="#" onclick="pwBack();return false">처음으로</a></p>';
    el("pw1").addEventListener("keydown",function(ev){ if(ev.key==="Enter") el("pw2").focus(); }); el("pw2").addEventListener("keydown",function(ev){ if(ev.key==="Enter") pwSetGo(); });
    setTimeout(function(){ el("pw1").focus(); },30);
  } else {
    var k=pw?PWM.kind:"key", lab=k==="code"?"설정 코드":k==="key"?"관리코드":"비밀번호";
    b.innerHTML='<label>사번<input id="aemp" inputmode="text" autocomplete="username" autocapitalize="characters" value="'+esc(e)+'"></label>'+
      '<label>'+lab+'<input id="key" type="password" autocomplete="'+(k==="key"?"off":"current-password")+'"'+(k==="code"?' inputmode="numeric" maxlength="6"':'')+'></label>'+
      (k==="code"?'<p class="cap mt4">슈퍼관리자에게 받은 6자리 · 24시간 안 · 한 번만</p>':'')+
      '<button class="btn pri big" type="button" id="lockGo" onclick="unlock()">들어가기</button>'+
      '<div class="err" id="lockErr" role="alert"></div>'+
      (pw?'<p class="cap mt">'+(k==="code"?'<a href="#" onclick="pwKind(\'pw\');return false">비밀번호로 입장</a>':'<a href="#" onclick="pwKind(\'code\');return false">설정 코드로 처음 입장</a>')+
        (!PWM.on&&k!=="key"?' · <a href="#" onclick="pwKind(\'key\');return false">관리코드로 입장</a>':'')+(k==="key"?' · <a href="#" onclick="pwKind(\'pw\');return false">비밀번호로 입장</a>':'')+'</p>':'');
    el("aemp").addEventListener("keydown",function(ev){ if(ev.key==="Enter"){ if(el("key").value) unlock(); else el("key").focus(); } });
    el("key").addEventListener("keydown",function(ev){ if(ev.key==="Enter") unlock(); });
    setTimeout(function(){ el(e?"key":"aemp").focus(); },30);
  }
  el("lockErr").textContent=msg||"";
}
function pwKind(k){ PWM.kind=k; lockUI(""); }
function pwBack(){ PWM.set=null; PWM.kind="pw"; lockUI(""); }
function pwHint(){ var h=el("pwH"); if(!h) return; var a=(el("pw1")||{}).value||"", b=(el("pw2")||{}).value||""; var w=a?pwWhy(a,(PWM.set||{}).emp):""; h.textContent=!a?"8자 이상 · 사번과 같은 값 · 흔한 값은 쓸 수 없음":w?PW_WHY[w]:b&&a!==b?PW_WHY.twice:b?"정할 수 있습니다":"한 번 더 넣습니다"; }
function lockMsg(r, kind){
  r=r||{};
  if(r.reason==="locked") return "5번 틀려 잠겼습니다 · "+Math.max(1,Math.ceil(num(r.retry)/60))+"분 뒤 다시 합니다";
  if(r.reason==="network"||r.reason==="timeout") return "서버에 연결하지 못했습니다";
  if(r.reason==="pwonly") return "이 콘솔은 사번 + 개인 비밀번호로 들어옵니다";
  if(r.reason==="codeexp") return "설정 코드가 만료됐습니다 · 슈퍼관리자에게 다시 받습니다";
  if(r.reason==="ses"||r.reason==="ended") return why(r);
  if(r.ok&&r.role==="grade") return "등급코드입니다 · 이 콘솔은 관리코드로 들어옵니다";
  if(kind==="key") return "명단에 없는 사번이거나 관리코드가 맞지 않습니다";
  return (kind==="code"?"사번 또는 설정 코드가 맞지 않습니다":"사번 또는 비밀번호가 맞지 않습니다")+(r.left!=null?" · 남은 "+r.left+"번":"");
}
function meOf(r, e){ return { emp:r.emp||e, name:r.name||"", top:num(r.top), pw:num(r.pw) }; }
/* 들어가기 · 관리코드(옛 서버 · OFF 동안) 또는 비밀번호 · 설정 코드 */
function unlock(){
  var e=normE(el("aemp").value), v=el("key").value, k=PWM.mode==="pw"?PWM.kind:"key";
  if(!e){ el("lockErr").textContent="사번을 넣습니다."; el("aemp").focus(); return; }
  if(!v.trim()){ el("lockErr").textContent=(k==="code"?"설정 코드":k==="key"?"관리코드":"비밀번호")+"를 넣습니다."; el("key").focus(); return; }
  el("lockErr").textContent="확인 중";
  var p=k==="key"?{ key:v.trim(), aemp:e, asc:"c", tok:"" }:{ pw:v, aemp:e, asc:"c", tok:"" };
  call("admin_check",p,25000).then(function(r){
    el("key").value="";
    if(r&&r.ok&&r.role==="admin"&&r.need==="set"){ setAemp(e); PWM.set={ emp:e, tok:r.tok||"" }; lockUI(""); return; }
    if(r&&r.ok&&r.role==="admin"){ setAemp(e); setTok(r.tok||""); S.me=meOf(r,e); PWM.set=null; el("lock").hidden=true; el("lockErr").textContent=""; start(); return; }
    el("lockErr").textContent=lockMsg(r,k);
  });
}
/* 비밀번호 정하기(처음) · 코드 토큰으로 adm_pw_set */
function pwSetGo(){
  var set=PWM.set; if(!set) return; var a=el("pw1").value, b=el("pw2").value, w=pwWhy(a,set.emp);
  if(w){ el("lockErr").textContent=PW_WHY[w]; el("pw1").focus(); return; }
  if(a!==b){ el("lockErr").textContent=PW_WHY.twice; el("pw2").focus(); return; }
  el("lockErr").textContent="저장 중";
  call("adm_pw_set",{ aemp:set.emp, tok:set.tok, pw:a },25000).then(function(r){
    el("pw1").value=""; el("pw2").value="";
    if(r&&r.ok){ setTok(r.tok||""); S.me=meOf(r,set.emp); PWM.set=null; el("lock").hidden=true; start(); toast("비밀번호를 정했습니다 · 다음부터 사번 + 비밀번호로 들어옵니다",{ ms:6000 }); return; }
    el("lockErr").textContent=r&&r.reason==="pwrule"?(PW_WHY[r.why]||"비밀번호 규칙에 맞지 않습니다"):r&&r.reason==="codeexp"?"설정 코드가 만료됐습니다 · 슈퍼관리자에게 다시 받습니다":r&&r.reason==="auth"?"설정 코드 입장이 끝났습니다 · 처음부터 다시 합니다":"저장하지 못했습니다 · "+why(r);
  });
}
/* 바꾸기(들어온 뒤) · 기록 · 설정 › 서버 상태 */
function pwChangeAsk(){
  if(!(S.me&&S.me.pw)){ toast("개인 비밀번호로 들어온 뒤 바꿉니다",{ bad:1 }); return; }
  var e=S.me.emp||aemp();
  confirmBox({ t:"비밀번호를 바꿀까요?", who:"사번 "+e, sub:"바꾸면 이 콘솔은 그대로 · 다른 기기의 입장은 끊김",
    body:'<label class="fld">새 비밀번호<input class="in" id="pc1" type="password" autocomplete="new-password" maxlength="64" oninput="gateUpd()"></label><label class="fld">한 번 더<input class="in" id="pc2" type="password" autocomplete="new-password" maxlength="64" oninput="gateUpd()"></label><p class="cap mt4">8자 이상 · 사번과 같은 값 · 흔한 값은 쓸 수 없음</p>',
    focus:"pc1", ok:"바꾸기",
    gate:function(){ var a=(el("pc1")||{}).value||"", b=(el("pc2")||{}).value||""; return !!a&&a===b&&!pwWhy(a,e); },
    run:function(){ return call("adm_pw_set",{ aemp:e, pw:el("pc1").value },25000); },
    fail:function(r){ return r&&r.reason==="pwrule"?(PW_WHY[r.why]||"비밀번호 규칙에 맞지 않습니다"):r&&r.reason==="auth"?"개인 비밀번호로 들어온 입장이 아닙니다":""; },
    done:function(r){ if(r.tok) setTok(r.tok); toast("비밀번호를 바꿨습니다"); } });
}
