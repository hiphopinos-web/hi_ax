/* ── 261012 사람 › 접속 현황(사용자 261012 「접속 관련 정보를 한 곳에」) · 새 서버 데이터 없음 ──
 * 모은 것: 앱 접속 범위(og_scope_state · 바꾸기는 설정 › 앱 오픈 그대로) · 접속 허용 명단 숫자(roll_stat.gate) · 들어오지 못한 사람(og_deny_list · 명단 › 접속 허용 패널에서 이리 옮김)
 *         가입 계정 · 오늘 접속 · PIN 대기(now_board.people) · 찾기 필터(오늘 접속 · 접속 없음 · PIN 대기)로 바로 가기
 * 따로 둔 파일 · admin/index.html 이 본문 스크립트보다 먼저 <script src="acc.js?v=..."> 로 불러 ACC_VIEW 를 VIEWS.acc 로 건다(index.html 400KB 상한) · 안의 함수는 부를 때 index.html 의 전역(rosSt · rosDenyLoad · rosDenyHtml · kpiCell · card · go)을 쓴다 */
function accWho(f){ var u=whoSt(); u.f=f; u.more=[]; go("p_who"); }
var ACC_VIEW={
  need:function(){ return [{ k:"ogs", a:"og_scope_state", ttl:30000, sup:1 },{ k:"rstat", a:"roll_stat", ttl:60000 },{ k:"nb", a:"now_board", ttl:30000 }]; },
  mount:function(){ el("vb").innerHTML='<div id="accB"></div>'; if(supOk()) rosDenyLoad(); },
  paint:function(){
    var box=el("accB"); if(!box) return;
    if(!(S.me&&S.me.sup)){ box.innerHTML=band("warn","접속 현황은 슈퍼관리자가 봅니다."); return; }
    if(!supOk()){ box.innerHTML=band("pri","접속 범위와 거부 기록을 보려면 슈퍼관리자 본인 확인(PIN)을 한 번 합니다.",'<button class="btn sm pri" data-qa="acc.pin" onclick="supNeed(function(){ load(true); rosDenyLoad(); })">PIN 넣기</button>'); return; }
    var d=S.data.ogs, g=((S.data.rstat||{}).gate)||{}, p=((S.data.nb||{}).people)||{}, ok=d&&d.ok;
    if(d&&!d.ok){ box.innerHTML=loadErr(d,"ogs"); return; }
    var cur=ok?ogScOf(d.sc):null, c=(ok&&d.cnt)||{}, ended=ok&&d.sc===OG_END[0];
    var k='<div class="card kpis">'+
      kpiCell({ l:"앱 접속 범위", v:'<span style="font-size:var(--fs-h2)">'+esc(cur?cur[1]:"-")+'</span>', s:cur?(ended?"참가자 앱 닫힘":"들어올 수 있는 사람 약 "+n0(c[cur[2]])+"명"):"&nbsp;", click:"go('s_open')", qa:"acc.scope", cls:ended?"bad":"" })+
      kpiCell({ l:"접속 허용 명단", v:n0(g.n), u:"명", s:"가입 "+n0(g.acct)+" · 오늘 접속 "+n0(g.today), click:"go('p_list','gate')", qa:"acc.gate" })+
      kpiCell({ l:"들어오지 못한 사람", v:n0(g.wait), u:"명", s:"거부 기록 "+n0(g.deny)+"명", cls:g.wait?"warn":"" })+
      kpiCell({ l:"오늘 접속", v:n0(p.today), u:"명", s:"가입 "+n0(p.acct)+"명"+(p.roster?"(명부 "+pct(p.acct,p.roster)+"%)":"")+" · PIN 아직 "+n0(p.pw0), click:"accWho('today')", qa:"acc.today" })+'</div>';
    var lk=function(qa, on, t, s){ return '<li><button type="button" class="lnk" data-qa="'+qa+'" onclick="'+on+'">'+esc(t)+' ›</button><span class="cap">'+esc(s)+'</span></li>'; };
    var go1='<ul class="mini">'+
      lk("acc.go.open","go('s_open')","앱 접속 범위 바꾸기","설정 › 앱 오픈")+
      lk("acc.go.gate","go('p_list','gate')","접속 허용 명단 넣고 빼기","사람 › 명단 › 접속 허용")+
      lk("acc.go.today","accWho('today')","오늘 접속한 사람","사람 › 찾기 · 오늘 접속")+
      lk("acc.go.nolog","accWho('nolog')","가입 뒤 접속 없는 사람","사람 › 찾기 · 접속 없음")+
      lk("acc.go.pw0","accWho('pw0')","PIN 대기","사람 › 찾기 · PIN 대기")+
      lk("acc.go.pw","go('p_pw')","PIN 분실 요청","사람 › PIN 분실")+'</ul>'+
      (ok?'<h5 class="h5">자동이면</h5><ul class="mini"><li><span class="t">1차</span><span>'+esc(ogDay(d.t1)||"-")+'부터 사전 신청자까지 · 약 '+n0(c.first)+'명</span></li><li><span class="t">2차</span><span>'+esc(ogDay(d.t2)||"-")+'부터 전체 · 약 '+n0(c.all)+'명</span></li></ul><p class="cap mt8">지금 단계 '+esc(OG_PH[d.ph]||d.ph)+'</p>':skel());
    box.innerHTML=k+'<div class="grid g2 mt16">'+card("들어오지 못한 사람","명단 밖이라 로그인 · 쓰기가 거절된 사번",rosDenyHtml(),'<button class="btn sm" data-qa="acc.deny.reload" onclick="rosDenyLoad()">다시 받기</button>')+card("바로 가기","접속 관련 화면",go1)+'</div>'+
      memo('<p>숫자는 서버 집계입니다. 가입 · 오늘 접속은 시험 사번을 뺀 수, 접속 허용 명단의 가입 · 오늘 접속은 그 명단 안의 수입니다.</p><p>들어오지 못한 사람은 클로즈 베타 · 사전 신청자까지 범위에서 명단 밖이라 거절된 사번입니다. 「넣기」는 접속 허용 명단에 넣고, 활동 기록에서 그날 안에 되돌립니다.</p>');
  }
};
