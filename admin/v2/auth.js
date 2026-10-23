/* AXF CONTROL v2 · 입장(261017 콘솔 개인 비밀번호 · 사용자 확정 P1~P4)
 * 서버가 adm_pw_info 를 알면 = 사번 + 비밀번호 한 칸(설정 OFF 동안은 「관리코드로 입장」 링크 하나) · 모르면(옛 서버) = 지금 화면(사번 + 관리코드)
 *   입장 = admin_check(aemp · pw · asc c) · 비밀번호 · 설정 코드 둘 다 pw 칸으로(서버가 줄 종류로 가른다) · 원문은 POST 본문으로만 · 저장하지 않는다
 *   261022 입장 한 칸(사용자 「기본은 비밀번호 · 설정코드가 발급된 경우만 그 번호로 · 입구가 두 개라 계속 틀림」) · 「설정 코드로 처음 입장」 링크 없앰
 *     비밀번호 칸에 설정 코드를 넣어도 된다(서버가 줄 종류로 가름 → need set → 비밀번호 정하기)
 *     틀린 시도 응답 cs = code(설정 코드 걸림) → 설정 코드 6자리 + 새 비밀번호 화면(kind code · codeGo) · cs = exp → 만료 안내 · cs 없음 → 사번 또는 비밀번호 틀림 · 남은 시도
 *   설정 코드 통과 = need set + 코드 토큰 → 「비밀번호 정하기」(adm_pw_set · 새 비밀번호 두 번) → 입장 · 설정 코드 화면은 두 호출을 이어서(admin_check → adm_pw_set)
 *   261023 초기화 뒤 첫 입장(비밀번호를 정한 적 있는 사람 · 초기화 뒤 24시간 · 한 번) = 서버 need set + rs 1 → 넣은 값으로 바로 adm_pw_set(규칙 검사 그대로) · 규칙에 안 맞으면 「비밀번호 정하기」 화면
 *   바꾸기 = 기록 · 설정 › 서버 상태 「비밀번호 바꾸기」(adm_pw_set · 지금 입장 토큰 · 개인 비밀번호로 들어온 입장만)
 *   규칙(서버 pwprep.js pwRule 과 같다) = 8~64자 · 사번과 같으면 안 됨 · 아주 흔한 값 · 같은 글자 반복 · 이어진 숫자 거절 · 조합 강제 없음 */
var PWM={ mode:"old", on:0, kind:"pw", set:null, info:null };   /* mode old(관리코드) | pw · kind pw | code(설정 코드) | key(OFF 동안 관리코드) · set = { emp, tok } 정하기 단계 */
var PW_COMMON=["password","password1","passw0rd","12345678","123456789","1234567890","87654321","11111111","00000000","qwerty123","qwertyuiop","asdfghjkl","abcdefgh","abcd1234","iloveyou",
  "letmein1","welcome1","admin123","administrator","hyundai1","hyundai12","hyundai2026","hi123456","hi1234567","hicorp2026","axfestival","ax202610","ax20261026","metowe2026","festival2026","a12345678","1q2w3e4r","1q2w3e4r5t","qwer1234","zxcv1234"];
var PW_WHY={ short:"새 비밀번호는 8자 이상이어야 해요", "long":"새 비밀번호는 64자까지예요", emp:"사번과 같은 값은 쓸 수 없어요", common:"아주 흔한 값이라 쓸 수 없어요", repeat:"같은 글자 반복은 쓸 수 없어요", seq:"이어진 숫자는 쓸 수 없어요", twice:"두 번 넣은 새 비밀번호가 달라요" };
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
/* 잠금 화면 그리기 · msg = 안내 한 줄
 *   set = 비밀번호 정하기(비밀번호 칸에 설정 코드를 넣어 통과) · kind code = 설정 코드 6자리 + 새 비밀번호(서버가 cs code 를 알려 준 뒤만) · 그 밖 = 사번 + 비밀번호 한 칸 */
function lockUI(msg){
  var b=el("lockBody"); if(!b) return;
  var e=aemp(), set=PWM.set, pw=PWM.mode==="pw";
  if(set){
    b.innerHTML='<p class="cap">사번 '+esc(set.emp)+' · '+(set.rs?'초기화 뒤 첫 입장이에요':'설정 코드로 들어왔어요')+' · 앞으로 쓸 비밀번호를 정해 주세요</p>'+
      '<label>새 비밀번호<input id="pw1" type="password" autocomplete="new-password" maxlength="64" placeholder="8자 이상" oninput="pwHint()"></label>'+
      '<label>다시 입력<input id="pw2" type="password" autocomplete="new-password" maxlength="64" oninput="pwHint()"></label>'+pwGuideHtml("pw")+
      '<button class="btn pri big" type="button" id="lockGo" onclick="pwSetGo()">비밀번호 정하기</button>'+
      '<div class="err" id="lockErr" role="alert"></div><p class="cap mt"><a href="#" onclick="pwBack();return false">처음으로</a></p>';
    el("pw1").addEventListener("keydown",function(ev){ if(ev.key==="Enter") el("pw2").focus(); }); el("pw2").addEventListener("keydown",function(ev){ if(ev.key==="Enter") pwSetGo(); });
    setTimeout(function(){ el("pw1").focus(); },30);
  } else if(pw&&PWM.kind==="code"){
    b.innerHTML='<div class="band info mt"><div><b>설정 코드가 발급됐어요</b><br>설정 코드로 들어와 새 비밀번호를 정해 주세요</div></div>'+
      '<label>사번<input id="aemp" inputmode="text" autocomplete="username" autocapitalize="characters" value="'+esc(e)+'"></label>'+
      '<label>설정 코드 6자리<input id="key" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" placeholder="슈퍼관리자에게 받은 숫자"></label>'+
      '<label>새 비밀번호<input id="pw1" type="password" autocomplete="new-password" maxlength="64" placeholder="8자 이상" oninput="pwHint()"></label>'+
      '<label>다시 입력<input id="pw2" type="password" autocomplete="new-password" maxlength="64" oninput="pwHint()"></label>'+pwGuideHtml("pw")+
      '<button class="btn pri big" type="button" id="lockGo" onclick="codeGo()">비밀번호 정하고 들어가기</button>'+
      '<div class="err" id="lockErr" role="alert"></div>'+
      '<p class="cap mt"><a href="#" onclick="pwKind(\'pw\');return false">비밀번호로 입장</a></p>';
    el("aemp").addEventListener("keydown",function(ev){ if(ev.key==="Enter") el("key").focus(); });
    el("key").addEventListener("keydown",function(ev){ if(ev.key==="Enter") el("pw1").focus(); });
    el("pw1").addEventListener("keydown",function(ev){ if(ev.key==="Enter") el("pw2").focus(); }); el("pw2").addEventListener("keydown",function(ev){ if(ev.key==="Enter") codeGo(); });
    setTimeout(function(){ el(e?"key":"aemp").focus(); },30);
  } else {
    var k=pw&&PWM.kind!=="key"?"pw":"key", lab=k==="key"?"관리코드":"비밀번호";
    b.innerHTML='<label>사번<input id="aemp" inputmode="text" autocomplete="username" autocapitalize="characters" value="'+esc(e)+'"></label>'+
      '<label>'+lab+'<input id="key" type="password" autocomplete="'+(k==="key"?"off":"current-password")+'"'+(k==="pw"?' placeholder="비밀번호"':'')+'></label>'+
      '<button class="btn pri big" type="button" id="lockGo" onclick="unlock()">들어가기</button>'+
      '<div class="err" id="lockErr" role="alert"></div>'+
      (pw&&!PWM.on?'<p class="cap mt">'+(k==="key"?'<a href="#" onclick="pwKind(\'pw\');return false">비밀번호로 입장</a>':'<a href="#" onclick="pwKind(\'key\');return false">관리코드로 입장</a>')+'</p>':'');
    el("aemp").addEventListener("keydown",function(ev){ if(ev.key==="Enter"){ if(el("key").value) unlock(); else el("key").focus(); } });
    el("key").addEventListener("keydown",function(ev){ if(ev.key==="Enter") unlock(); });
    setTimeout(function(){ el(e?"key":"aemp").focus(); },30);
  }
  el("lockErr").textContent=msg||"";
}
function pwKind(k){ PWM.kind=k; lockUI(""); }
function pwBack(){ PWM.set=null; PWM.kind="pw"; lockUI(""); }
function pwHint(){ pwChkUpd("pw",(PWM.set||{}).emp||(el("aemp")||{}).value); }
var CODE_EXP_TX="설정 코드가 만료됐어요 · 슈퍼관리자에게 다시 받아 주세요";
/* 틀렸을 때 한 줄 · 무엇이 틀렸는지(없는 사번과 틀린 비밀번호는 서버가 같은 답이라 「사번 또는」) · 남은 시도 · 잠금이면 몇 분 뒤 */
function lockMsg(r, kind){
  r=r||{};
  if(r.reason==="locked") return "5번 틀려 잠겼어요 · "+Math.max(1,Math.ceil(num(r.retry)/60))+"분 뒤 다시 들어올 수 있어요";
  if(r.reason==="network"||r.reason==="timeout") return "서버에 연결하지 못했어요";
  if(r.reason==="pwonly") return "이 콘솔은 사번 + 개인 비밀번호로 들어와요";
  if(r.reason==="codeexp"||r.cs==="exp") return CODE_EXP_TX;
  if(r.reason==="pwderive") return "서버가 비밀번호를 처리하지 못했어요 · 잠시 뒤 다시 해 주세요";
  if(r.reason==="ses"||r.reason==="ended") return why(r);
  if(r.ok&&r.role==="grade") return "등급코드예요 · 이 콘솔은 관리코드로 들어와요";
  if(kind==="key") return "명단에 없는 사번이거나 관리코드가 맞지 않아요";
  var left=r.left!=null?" · 남은 시도 "+r.left+"번":"";
  if(kind==="code") return (r.cs==="code"?"설정 코드가 맞지 않아요":"사번 또는 설정 코드가 맞지 않아요")+left;
  return "사번 또는 비밀번호가 맞지 않아요"+left;
}
function meOf(r, e){ return { emp:r.emp||e, name:r.name||"", top:num(r.top), pw:num(r.pw), lo:num(r.lo), ao:num(r.ao), co:num(r.co) }; }   /* 261021 lo = AX 라운지 담당(설정 라운지_담당) · 261022 ao = 출석 담당(설정 출석_담당 · attn.js) */
function lockIn(r, e){ setAemp(e); setTok(r.tok||""); S.me=meOf(r,e); PWM.set=null; PWM.kind="pw"; el("lock").hidden=true; el("lockErr").textContent=""; start(); }
/* 들어가기 · 관리코드(옛 서버 · OFF 동안) 또는 비밀번호(설정 코드도 이 칸으로 된다) */
function unlock(){
  var e=normE(el("aemp").value), v=el("key").value, k=PWM.mode==="pw"&&PWM.kind!=="key"?"pw":"key";
  if(!e){ el("lockErr").textContent="사번을 넣어 주세요"; el("aemp").focus(); return; }
  if(!v.trim()){ el("lockErr").textContent=(k==="key"?"관리코드":"비밀번호")+"를 넣어 주세요"; el("key").focus(); return; }
  el("lockErr").textContent="확인 중";
  var p=k==="key"?{ key:v.trim(), aemp:e, asc:"c", tok:"" }:{ pw:v, aemp:e, asc:"c", tok:"" };
  call("admin_check",p,25000).then(function(r){
    el("key").value="";
    if(r&&r.ok&&r.role==="admin"&&r.need==="set"&&num(r.rs)){ rstGo(e,v,r); return; }
    if(r&&r.ok&&r.role==="admin"&&r.need==="set"){ setAemp(e); PWM.set={ emp:e, tok:r.tok||"" }; lockUI(""); return; }
    if(r&&r.ok&&r.role==="admin"){ lockIn(r,e); return; }
    if(k==="pw"&&r&&r.reason==="auth"&&r.cs==="code"){ setAemp(e); PWM.kind="code"; lockUI(r.left!=null?"남은 시도 "+r.left+"번":""); return; }   /* 설정 코드가 걸린 사번에 옛 비밀번호 → 설정 코드 화면 */
    el("lockErr").textContent=lockMsg(r,k);
  });
}
/* 261023 초기화 뒤 첫 입장 · 넣은 값이 규칙에 맞으면 그 값을 새 비밀번호로 저장 · 아니면 정하기 화면(안내 한 줄) */
function rstGo(e, v, r){
  setAemp(e); PWM.set={ emp:e, tok:r.tok||"", rs:1 };
  var w=pwWhy(v,e); if(w){ lockUI(PW_WHY[w]+" · 새 비밀번호를 정해 주세요"); return; }
  el("lockErr").textContent="저장 중";
  call("adm_pw_set",{ aemp:e, tok:r.tok||"", pw:v },25000).then(function(s){
    if(s&&s.ok){ lockIn(s,e); toast("초기화 뒤 첫 입장 · 넣은 비밀번호가 새 비밀번호가 됐어요",{ ms:6000 }); return; }
    lockUI(pwSetFail(s));
  });
}
/* 설정 코드 화면 · 코드 확인(admin_check → need set) 다음 바로 새 비밀번호 저장(adm_pw_set) · 새 비밀번호 규칙을 먼저 봐서 코드 시도를 헛되이 쓰지 않는다 */
function codeGo(){
  var e=normE(el("aemp").value), c=el("key").value.trim(), a=el("pw1").value, b=el("pw2").value, w=pwWhy(a,e);
  if(!e){ el("lockErr").textContent="사번을 넣어 주세요"; el("aemp").focus(); return; }
  if(!/^\d{6}$/.test(c)){ el("lockErr").textContent="설정 코드 6자리 숫자를 넣어 주세요"; el("key").focus(); return; }
  if(w){ el("lockErr").textContent=PW_WHY[w]; el("pw1").focus(); return; }
  if(a!==b){ el("lockErr").textContent=PW_WHY.twice; el("pw2").focus(); return; }
  el("lockErr").textContent="확인 중"; el("lockGo").disabled=true;
  call("admin_check",{ pw:c, aemp:e, asc:"c", tok:"" },25000).then(function(r){
    el("key").value="";
    if(r&&r.ok&&r.role==="admin"&&r.need==="set"){
      setAemp(e); el("lockErr").textContent="저장 중";
      return call("adm_pw_set",{ aemp:e, tok:r.tok||"", pw:a },25000).then(function(s){
        if(s&&s.ok){ el("pw1").value=""; el("pw2").value=""; lockIn(s,e); toast("비밀번호를 정했어요 · 다음부터 사번 + 비밀번호로 들어와요",{ ms:6000 }); return; }
        el("lockGo").disabled=false; el("lockErr").textContent=pwSetFail(s);
      });
    }
    if(r&&r.ok&&r.role==="admin"){ lockIn(r,e); return; }
    el("lockGo").disabled=false; el("lockErr").textContent=lockMsg(r,"code");
  });
}
function pwSetFail(r){ return r&&(r.reason==="pwrule"||r.reason==="pwderive")?pwFailTx(r):r&&r.reason==="codeexp"?CODE_EXP_TX:r&&r.reason==="auth"?"설정 코드 입장이 끝났어요 · 처음부터 다시 해 주세요":"저장하지 못했어요 · "+why(r); }
/* 비밀번호 정하기(비밀번호 칸에 설정 코드를 넣어 통과한 뒤) · 코드 토큰으로 adm_pw_set */
function pwSetGo(){
  var set=PWM.set; if(!set) return; var a=el("pw1").value, b=el("pw2").value, w=pwWhy(a,set.emp);
  if(w){ el("lockErr").textContent=PW_WHY[w]; el("pw1").focus(); return; }
  if(a!==b){ el("lockErr").textContent=PW_WHY.twice; el("pw2").focus(); return; }
  el("lockErr").textContent="저장 중";
  call("adm_pw_set",{ aemp:set.emp, tok:set.tok, pw:a },25000).then(function(r){
    el("pw1").value=""; el("pw2").value="";
    if(r&&r.ok){ lockIn(r,set.emp); toast("비밀번호를 정했어요 · 다음부터 사번 + 비밀번호로 들어와요",{ ms:6000 }); return; }
    el("lockErr").textContent=pwSetFail(r);
  });
}
/* 바꾸기(들어온 뒤) · 기록 · 설정 › 서버 상태 */
function pwChangeAsk(){
  if(!(S.me&&S.me.pw)){ toast("개인 비밀번호로 들어온 뒤 바꿉니다",{ bad:1 }); return; }
  var e=S.me.emp||aemp(); PWM.ckEmp=e;
  confirmBox({ t:"비밀번호를 바꿀까요?", who:"사번 "+e, sub:"바꾸면 이 콘솔은 그대로 · 다른 기기의 입장은 끊김",
    body:'<label class="fld">새 비밀번호<input class="in" id="pc1" type="password" autocomplete="new-password" maxlength="64" placeholder="비밀번호(8자 이상)" oninput="pwChkUpd(\'pc\',PWM.ckEmp);gateUpd()"></label><label class="fld">다시 입력<input class="in" id="pc2" type="password" autocomplete="new-password" maxlength="64" oninput="pwChkUpd(\'pc\',PWM.ckEmp);gateUpd()"></label>'+pwGuideHtml("pc"),
    focus:"pc1", ok:"바꾸기",
    gate:function(){ return pwChkUpd("pc",e); },
    run:function(){ return call("adm_pw_set",{ aemp:e, pw:el("pc1").value },25000); },
    fail:function(r){ return r&&r.reason==="auth"?"개인 비밀번호로 들어온 입장이 아닙니다":pwFailTx(r,""); },
    done:function(r){ if(r.tok) setTok(r.tok); toast("비밀번호를 바꿨습니다"); } });
}
/* 261017 후속(사용자 「비밀번호 칸에 가이드가 없어 숫자인지 몇 글자인지 모르겠다」) 비밀번호 안내 한 줄 + 조건별 바로 표시 · 정하는 화면 둘(설정 코드로 처음 입장 · 비밀번호 바꾸기)이 같이 쓴다
 *   글자는 서버 규칙(pwprep.js pwRule)과 같다 · 8~64자 · 영문 · 숫자 · 기호 자유(조합 강제 없음) · 사번과 같은 값 · 흔한 값 · 한 글자만 반복(11111111) · 숫자만 이어짐(12345678 · 87654321) 거절
 *   조건 줄 = 비어 있음 회색 「·」 · 맞음 진한 글자 「✔」 · 아님 주황 「✕」 · 둘째 칸 = 일치 · 불일치 */
var PW_GUIDE="8~64자 · 영문 · 숫자 · 기호 자유 · 사번과 같은 값 · 흔한 값 · 11111111 같은 반복 · 12345678 같은 연속은 안 됨";   /* 「안 됨」은 줄 끝에서 갈리지 않게 붙임 공백 */
var PW_CK=[["len","8자 이상"],["emp","사번과 다름"],["common","흔한 값 아님"],["rep","반복 · 연속 아님"]];
/* 조건마다 따로 본다(pwWhy 는 첫 위반 하나만 돌려줘 12345678 처럼 흔한 값이면서 연속인 값도 두 줄 다 ✕) · 식은 pwWhy 와 같다 */
function pwFlags(s, emp){
  var low=s.toLowerCase(), e=normE(emp||""), up=true, dn=true;
  for(var i=1;i<s.length;i++){ var d=s.charCodeAt(i)-s.charCodeAt(i-1); if(d!==1&&d!==-9) up=false; if(d!==-1&&d!==9) dn=false; }
  return { len:s.length>=8&&s.length<=64, emp:!(e&&(low===e.toLowerCase()||low===("0"+e).toLowerCase())), common:PW_COMMON.indexOf(low)<0, rep:!/^(.)\1+$/.test(s)&&!(/^\d+$/.test(s)&&s.length>1&&(up||dn)) };
}
function pwGuideHtml(pfx){
  return '<p class="cap mt4">'+esc(PW_GUIDE)+'</p><ul class="pwck" id="'+pfx+'_ck">'+PW_CK.map(function(c){ return '<li data-k="'+c[0]+'">· '+esc(c[1])+'</li>'; }).join("")+'</ul><p class="pwck2" id="'+pfx+'_m"></p>';
}
function pwChkUpd(pfx, emp){
  var a=(el(pfx+"1")||{}).value||"", b=(el(pfx+"2")||{}).value||"", w=a?pwWhy(a,emp):"", f=a?pwFlags(a,emp):null, ul=el(pfx+"_ck"), m=el(pfx+"_m");
  if(ul) PW_CK.forEach(function(c){ var li=ul.querySelector('[data-k="'+c[0]+'"]'); if(!li) return; var on=f?f[c[0]]:null; li.className=on===null?"":on?"on":"no"; li.textContent=(on===null?"· ":on?"✔ ":"✕ ")+c[1]+(c[0]==="len"&&a.length>64?" · 64자까지":""); });
  if(m){ m.className="pwck2"+(b?(a===b?" on":" no"):""); m.textContent=b?(a===b?"✔ 일치":"✕ 불일치 · 두 번 넣은 값이 다름"):""; }
  return !!a&&!w&&a===b;
}
/* 서버 거절 이유 → 사람 글 */
function pwFailTx(r, dflt){
  if(!r) return dflt||"";
  if(r.reason==="pwrule") return PW_WHY[r.why]||"비밀번호 규칙에 맞지 않아요";
  if(r.reason==="pwderive") return "서버가 비밀번호를 처리하지 못했어요 · 잠시 뒤 다시 해 주세요";
  return dflt||"";
}

