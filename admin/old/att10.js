/* ── 261016 현장 › 10F 출석(사용자 261016 「10F 실습 세션 A~E 입장 · 종료 출석 QR · 콘솔에서 출석 여부를 한눈에 · 스탬프는 주지 않는다 · 통제 목적」) ──
 * 데이터 = 서버 att_stats(who=1) 의 ten[] · 세션마다 pre(신청 · 운영진 제외) · in(입장) · out(종료) · noin(입장 안 함) · xn(따로) · ppl(명단 사람) · xs(명단 밖 · 다른 세션 · E 다른 회차)
 *   옛 서버(ppl 없음) = 「서버 배포 뒤」 띠 + 옛 숫자(신청 · 출석)만
 * 순서 = 지금 진행 중 세션 먼저 → 곧 시작 → 끝남(서버 시각 기준) · 진행 중 세션의 사람 표는 펼쳐 둔다(접고 펴면 그대로 기억)
 * 사람 표 = 이름 · 부서 · 입장 · 종료(✓ 시각 / 빈칸) · 가나다순 · 부문 통계 없음
 * 따로 둔 파일(admin/index.html 400KB 상한) · index.html 이 본문보다 먼저 불러 ATT10_VIEW 를 VIEWS.att10 으로 건다 · 쓰는 것 = 본문의 S · el · esc · card · kpiCell · band · skel · memo · loadErr · n0 · tag · paint · load */
var ATT10_PL={ fld:"컨퍼런스룸", ta:"01 HEART", tb:"06 HEART", aws:"08 HEART", ms1:"07 HEART", ms2:"07 HEART" };
var ATT10_TTL={ fld:"영업 및 보상 현장 우수 사례", ta:"“내 데이터”로 만드는 통계 현황", tb:"“내가 보는 자료”로 만드는 외부자료 리서치 자동화", aws:"바이브 코딩 실습", ms1:"MS Copilot을 활용한 문서 작성", ms2:"MS Copilot을 활용한 문서 작성" };
var ATT10V={ day:"", open:{} };
function att10M(hm){ var m=String(hm||"").match(/(\d{1,2}):(\d{2})/); return m?Number(m[1])*60+Number(m[2]):0; }
function att10Now(d){ var m=String(d&&d.t||"").match(/(\d{2}):(\d{2})(:\d{2})?$/); return m?Number(m[1])*60+Number(m[2]):-1; }
function att10Ph(x,t){ var a=att10M(x.s), b=att10M(x.e); return t<0?1:t>=a&&t<=b?0:t<a?1:2; }   /* 0 진행 중 · 1 곧 시작 · 2 끝남 */
function att10Day(v){ ATT10V.day=v; load(true); paint(); }
function att10Tog(id,o){ ATT10V.open[id]=!!o; }
function att10Ck(hm){ return hm?'<span class="tag ok">✓ '+esc(hm)+'</span>':''; }
function att10Sort(a){ return (a||[]).slice().sort(function(p,q){ return String(p.n||"").localeCompare(String(q.n||""),"ko"); }); }
function att10G(z){ return z.g==="notpre"?"명단 밖":z.g==="round"?"다른 회차 · "+(z.pre||""):"다른 세션 · "+(z.pre||"")+" 신청"; }
function att10Card(x,t){
  var ph=att10Ph(x,t), stTag=ph===0?tag("진행 중","pri"):ph===1?tag("곧 시작"):tag("끝남");
  var sub=esc(x.s)+"~"+esc(x.e)+" · 10F "+esc(ATT10_PL[x.id]||"");
  var k='<div class="kpis" style="margin:0 0 12px">'+kpiCell({ l:"신청", v:n0(x.pre), u:"명", s:"10F 사전 신청 명단" })+kpiCell({ l:"입장", v:n0(x["in"]), u:"명", s:"입장 창 "+esc(x.wIn||"") })+
    kpiCell({ l:"종료", v:n0(x.out), u:"명", s:"종료 창 "+esc(x.win||"") })+kpiCell({ l:"입장 안 함", v:n0(x.noin), u:"명", s:x.xn?"따로 "+n0(x.xn)+"명":"&nbsp;", cls:x.noin&&ph!==1?"warn":"" })+'</div>';
  var pp=att10Sort(x.ppl), xs=att10Sort(x.xs);
  var row=function(z,g){ return '<tr><td class="nm"><b>'+esc(z.n||"(이름 없음)")+'</b></td><td class="cap">'+esc(z.d||"")+'</td>'+(g?'<td class="cap">'+esc(att10G(z))+'</td>':'')+'<td>'+att10Ck(z["in"])+'</td><td>'+att10Ck(z.out)+'</td></tr>'; };
  var tb='<table class="tb"><colgroup><col style="width:28%"><col><col style="width:110px"><col style="width:110px"></colgroup><thead><tr><th>이름</th><th>부서</th><th>입장</th><th>종료</th></tr></thead><tbody>'+
    (pp.length?pp.map(function(z){ return row(z,0); }).join(""):'<tr><td colspan="4"><div class="empty">신청 명단이 비어 있습니다.</div></td></tr>')+'</tbody></table>';
  var tx=xs.length?'<h5 class="h5">따로 · 명단 밖 · 다른 세션 '+n0(xs.length)+'명(기록만)</h5><table class="tb"><colgroup><col style="width:22%"><col><col style="width:30%"><col style="width:110px"><col style="width:110px"></colgroup><thead><tr><th>이름</th><th>부서</th><th>구분</th><th>입장</th><th>종료</th></tr></thead><tbody>'+
    xs.map(function(z){ return row(z,1); }).join("")+'</tbody></table>':"";
  var op=x.id in ATT10V.open?ATT10V.open[x.id]:ph===0;
  var dt='<details class="memo"'+(op?' open':'')+' ontoggle="att10Tog(\''+x.id+'\',this.open)"><summary>사람 표 · 이름 · 부서 · 입장 · 종료</summary><div class="mb scrl">'+tb+tx+'</div></details>';
  return card(x.n+" · "+(ATT10_TTL[x.id]||""), sub, k+dt, stTag, "mt16");
}
var ATT10_VIEW={
  need:function(){ var p={ who:"1" }; if(ATT10V.day) p.day=ATT10V.day; return [{ k:"att10", a:"att_stats", p:p, ttl:20000 }]; },
  mount:function(){ el("vb").innerHTML='<div id="a10B"></div>'+memo('<p><b>QR</b> · 세션마다 입장 QR 1장 · 종료 QR 1장(설정 › 현장 QR 「QR 그림」 · QR코드/4_강의장 출석). 같은 사람이 같은 QR 을 다시 찍으면 처음 시각 그대로입니다.</p><p><b>창</b> · 입장 = 세션 시작 기준 설정 「출석_입장창」, 종료 = 끝 기준 「출석_끝창」(17F 와 같은 값). 클로즈 베타 동안은 시간을 보지 않습니다.</p><p><b>스탬프 없음</b> · 10F 출석은 기록만 합니다(설정 「프로그램스탬프_범위」와 무관).</p><p><b>따로</b> · 명단 밖 · 다른 세션 신청자가 찍으면 앱은 안내만 하고 기록은 남깁니다. 숫자 「입장 · 종료 · 입장 안 함」은 그 세션 명단(운영진 제외) 기준입니다. 시험 사번은 세지 않습니다.</p>'); },
  paint:function(){
    var box=el("a10B"); if(!box) return;
    var d=S.data.att10, t=att10Now(d), today=String(d&&d.t||"").slice(0,10);
    var dayBtn=function(v,l){ var on=(ATT10V.day||"")===v; return '<button class="btn sm'+(on?' pri':'')+'" data-qa="att10.day.'+(v?"today":"all")+'" aria-pressed="'+on+'" onclick="att10Day(\''+v+'\')">'+l+'</button>'; };
    var top='<div class="fx" style="margin-bottom:4px">'+dayBtn("","전체")+(today?dayBtn(today,"오늘만 · "+esc(today.slice(5).replace("-","/"))):"")+'<span class="cap">'+(d&&d.t?esc(String(d.t).slice(11,16))+" 기준 · 20초마다":"")+'</span></div>';
    if(!d){ box.innerHTML=top+skel(); return; }
    if(!d.ok){ box.innerHTML=top+loadErr(d,"att10"); return; }
    var ten=d.ten||[];
    if(!ten.length){ box.innerHTML=top+band("warn","이 서버는 10F 출석 집계를 돌려주지 않습니다."); return; }
    if(!("ppl" in ten[0])){ box.innerHTML=top+band("warn","이 서버는 아직 10F 입장 QR · 사람 표를 모릅니다. 서버 배포 뒤 보입니다. 지금은 신청 · 출석 수만.")+
      '<div class="card mt16"><div class="cb0">'+ten.map(function(x){ return '<p>'+esc(x.n)+' · 신청 '+n0(x.pre)+' · 출석 '+n0(x.cnt)+'</p>'; }).join("")+'</div></div>'; return; }
    var L=ten.map(function(x,i){ return { x:x, i:i, p:att10Ph(x,t) }; }).sort(function(a,b){ return (a.p-b.p)||(att10M(a.x.s)-att10M(b.x.s))||(a.i-b.i); }).map(function(o){ return o.x; });
    var sum=function(k){ return ten.reduce(function(a,x){ return a+(Number(x[k])||0); },0); };
    var k='<div class="card kpis">'+kpiCell({ l:"신청(6개 세션)", v:n0(sum("pre")), u:"명", s:"운영진 · 시험 사번 제외" })+kpiCell({ l:"입장", v:n0(sum("in")), u:"명", s:"명단 기준" })+
      kpiCell({ l:"종료", v:n0(sum("out")), u:"명", s:"명단 기준" })+kpiCell({ l:"입장 안 함", v:n0(sum("noin")), u:"명", s:"따로(명단 밖 · 다른 세션) "+n0(sum("xn"))+"명" })+'</div>';
    box.innerHTML=top+(d.code10?"":band("warn","10F 출석 코드가 아직 없습니다. 설정 › 현장 QR 에서 QR 그림을 한 번 열면 만들어집니다."))+k+L.map(function(x){ return att10Card(x,t); }).join("");
  }
};
