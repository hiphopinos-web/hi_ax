/* ── 261015 체크인 번호(가나다순 고정 · 사용자 261015 확정) · 현장 › 체크인존 맨 위 카드 · 서버 ck_no_state · ck_no_list · ck_no_assign(슈퍼관리자 + 본인 확인) ──
 * 번호 = 10F 사전 신청자만(AX 라운지만 신청한 사람은 번호 없음 · 둘 다 신청하면 있음) · 처음 매길 때 이름 가나다순(같은 이름은 사번 순) 1번부터 · 한 번 매긴 번호는 바뀌지 않는다
 * 다시 누르면 = 번호 없는 사람만 이어서(멱등) · 명단에서 빠진 사람 번호는 비워 둔다 · 매기는 시점 = 10/18 초기화 뒤 슈퍼관리자가 한 번
 * 키트 포장 명단 = CSV(번호 · 이름 · 부서 · 사이즈 · 사번 없음)
 * 따로 둔 파일(admin/index.html 400KB 상한) · index.html 이 <script src="ckno.js?v=..."> 로 먼저 불러 함수 선언을 전역으로 · 쓰는 것 = 본문의 S · el · esc · tag · card · kpiCell · n0 · imp · dialog · dlgGate · call · callPost · toast · why · supOk · supNeed · csvSave · unknownSrv · skel */
var CKNO_WORD="번호매기기", CKNO={ d:null, busy:0, err:"", at:0 };
function cknoSp(){ if(window.SP_ACT){ SP_ACT.ck_no_state=1; SP_ACT.ck_no_list=1; SP_ACT.ck_no_assign=1; } }
function cknoLoad(force){
  if(!supOk()||CKNO.busy) return;
  if(!force&&CKNO.d&&Date.now()-CKNO.at<30000) return;
  cknoSp(); CKNO.busy=1;
  callPost("ck_no_state",{},function(r){ CKNO.busy=0; CKNO.at=Date.now(); if(r&&r.ok){ CKNO.d=r; CKNO.err=""; } else { CKNO.d=null; CKNO.err=unknownSrv(r)?"srv":why(r); } cknoPaint(); },
    function(e){ CKNO.busy=0; CKNO.at=Date.now(); CKNO.err=why(e); cknoPaint(); });
}
function cknoPaint(){
  var box=el("ckNo"); if(!box) return;
  var sup=!!(S.me&&S.me.sup), d=CKNO.d, body;
  if(!sup) body='<p class="cap">번호 매기기 · 키트 포장 명단은 슈퍼관리자가 합니다.</p>';
  else if(!supOk()) body='<div class="fx"><span class="cap">슈퍼관리자 본인 확인(앱 PIN) 뒤에 보입니다.</span><button class="btn sm" data-qa="ckno.sup" onclick="supNeed(function(){ cknoLoad(true); })">본인 확인</button></div>';
  else if(CKNO.err==="srv") body='<p class="cap">이 서버는 아직 체크인 번호를 모릅니다. 서버 배포 뒤 씁니다.</p>';
  else if(CKNO.err) body='<div class="fx"><span class="cap">불러오지 못했습니다 · '+esc(CKNO.err)+'</span><button class="btn sm" data-qa="ckno.retry" onclick="cknoLoad(true)">다시</button></div>';
  else if(!d){ body=skel(); cknoLoad(false); }
  else {
    body='<div class="kpis" style="margin:0 0 12px">'+kpiCell({ l:"10F 사전 신청", v:n0(d.list), u:"명", s:d.lng?"라운지만 신청 "+n0(d.lng)+"명은 번호 없음":"" })+kpiCell({ l:"번호 있음", v:n0(d.has), u:"명", s:d.max?"마지막 "+n0(d.max)+"번":"" })+
      kpiCell({ l:"번호 없음", v:n0(d.pend), u:"명", s:d.pend?(d.n?"다음 "+n0(d.max+1)+"번부터":"1번부터"):"", cls:d.pend?"warn":"" })+kpiCell({ l:"명단에서 빠짐", v:n0(d.gone), u:"명", s:"번호 비워 둠" })+'</div>'+
      '<div class="acts"><button class="btn sm pri" data-qa="ckno.assign" onclick="cknoAsk()"'+(d.pend?'':' disabled')+'>'+(d.pend?(d.n?"새 "+n0(d.pend)+"명 번호 매기기":"번호 매기기 · "+n0(d.pend)+"명"):"새로 매길 사람 없음")+'</button>'+
      '<button class="btn sm" data-qa="ckno.csv" onclick="cknoCsv()"'+(d.has?'':' disabled')+'>키트 포장 명단 내려받기</button><button class="btn sm ghost" data-qa="ckno.reload" onclick="cknoLoad(true)">새로고침</button></div>'+
      '<p class="cap mt8">'+(d.at?"마지막으로 매긴 시각 "+esc(d.at)+" · ":"")+'이름 가나다순(같은 이름은 사번 순) · 한 번 매긴 번호는 바뀌지 않습니다 · 명단 내려받기 = 번호 · 이름 · 부서 · 사이즈(사번 없음)</p>';
  }
  box.innerHTML=card("체크인 번호","사전 신청자 · 가나다순 고정",body,"","mt16");
}
function cknoAsk(){
  var d=CKNO.d; if(!d||!d.pend) return;
  var a=d.max+1, b=d.max+d.pend;
  dialog({ t:d.n?"새 사람에게 번호를 이어서 매길까요?":"체크인 번호를 매길까요?",
    x:imp([["새로 매길 사람",n0(d.pend)+"명","chg"],["번호",n0(a)+" ~ "+n0(b)+"번","chg"],["이미 번호 있음",n0(d.has)+"명 · 그대로"]])+
      '<label class="fld mt12">확인 문구 「'+CKNO_WORD+'」<input class="in" id="cknoW" autocomplete="off" oninput="dlgGate()"></label>',
    s:(d.n?"이미 매긴 번호는 바뀌지 않습니다. 번호 없는 사람만 이름 가나다순으로 이어서 매깁니다.":"10F 사전 신청자를 이름 가나다순(같은 이름은 사번 순)으로 1번부터 매깁니다.")+" 참가자 앱 홈 인사 · 내 QR 화면에 번호가 보입니다. 운영로그에 남습니다.",
    ok:"번호 매기기", focus:"cknoW",
    gate:function(){ return String((el("cknoW")||{}).value||"").trim()===CKNO_WORD; },
    onOk:function(){ cknoSp(); callPost("ck_no_assign",{ confirm:CKNO_WORD },function(r){
      if(r&&r.ok){ toast(r.add?"번호를 매겼습니다 · "+n0(r.add)+"명 · "+n0(r.from)+" ~ "+n0(r.to)+"번":"새로 매길 사람이 없습니다"); CKNO.d=null; cknoLoad(true); if(window.changed) changed(["person_card","act_log","now_board"]); }
      else toast("실패 · "+(r&&r.reason==="word"?"확인 문구가 다릅니다":why(r)));
    },function(e){ toast("실패 · "+why(e)); }); } });
}
function cknoCsv(){
  cknoSp();
  callPost("ck_no_list",{},function(r){
    if(!(r&&r.ok)){ toast("내려받지 못했습니다 · "+why(r)); return; }
    var t=new Date(), p=function(v){ return ("0"+v).slice(-2); }, nm="체크인번호_키트포장명단_"+String(t.getFullYear()).slice(2)+p(t.getMonth()+1)+p(t.getDate())+"_"+p(t.getHours())+p(t.getMinutes())+".csv";
    csvSave(nm,["번호","이름","부서","사이즈"],(r.rows||[]).map(function(x){ return [x.no, x.name||"", x.dept||"", x.hum?"가습기 대체":x.sz||""]; }));
    toast("키트 포장 명단 "+n0((r.rows||[]).length)+"명을 내려받았습니다");
  },function(e){ toast("내려받지 못했습니다 · "+why(e)); });
}
