/* AXF CONTROL v2 · 설정 › 시간순 보기 (261022 사용자 「10/26 하루의 흐름을 위에서부터 시간순으로 · 왼쪽 시간 · 오른쪽 일어나는 일과 관련 화면」)
 * 데이터 = 읽기만: cfg_list(운영 설정) · sched_list(예약 줄 · 관람 시간표) · push_stats(푸시 스위치 · 시간) · att_list(17F · 10F 프로그램 시각 · 출석 창) · draw_stats(추첨 창) · now_board(서버 날짜 · 행사일)
 * 줄 = 설정값으로 계산(설정이 바뀌면 줄 시각도 바뀐다) · 서버에 값이 없으면 「설정값 없음 · 기본값」 경고 · PC 예약 줄만 고정 안내(콘솔이 모름)
 * 단추 = 다른 화면으로 이동 · 공지 예약 끄기 · 켜기는 ntf.js nfNoToggle(기존 확인 창 · 되돌리기 토스트) 그대로 · 이 화면이 새로 쓰는 액션 없음 */
var TL={ f:"all", warn:false };
var TL_K={ chg:["데이터 바뀜","tl-chg"], open:["열림 · 닫힘",""], ntf:["알림 발송",""], bk:["백업 · 읽기","off"], prog:["진행",""] };
var TL_DEF={ draw:"16:40-17:25" };   /* 서버 DRAW_WIN_DEFAULT 와 같다(draw_stats 가 없을 때만) */
function tlD(k){ return S.data[k]&&S.data[k].ok?S.data[k]:null; }
function tlC(k){ var d=tlD("cfgl"); if(!d) return null; return (d.rows||[]).filter(function(r){ return r.k===k; })[0]||null; }
function tlV(k, dflt){ var r=tlC(k); return r&&String(r.v).trim()!==""?String(r.v).trim():dflt; }
function tlM(hm){ var m=String(hm||"").match(/(\d{1,2}):(\d{2})/); return m?Number(m[1])*60+Number(m[2]):null; }
function tlHM(n){ if(n==null) return ""; var x=Math.max(0,n), h=Math.floor(x/60), m=x%60; return (h<10?"0":"")+h+":"+(m<10?"0":"")+m; }
function tlWin(v){ var m=String(v||"").replace(/\s/g,"").match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/); return m?[m[1],m[2]]:null; }
function tlPair(v){ var m=String(v||"").match(/^\s*(\d+)\s*,\s*(\d+)\s*$/); return m?[Number(m[1]),Number(m[2])]:null; }
function tlEv(){ var b=S.data.nb; return (b&&b.ev)||"2026-10-26"; }
function tlToday(){ var b=S.data.nb; if(b&&b.day) return b.day; var t=srvNow(); return t.getFullYear()+"-"+("0"+(t.getMonth()+1)).slice(-2)+"-"+("0"+t.getDate()).slice(-2); }
function tlMD(d){ var m=String(d||"").match(/^\d{4}-(\d{2})-(\d{2})/); return m?Number(m[1])+"/"+Number(m[2]):String(d||""); }
/* 설정 한 칸 점검 · ty = hm | win | dt | pair · o.empty = 비어 있을 때 뜻(경고 아님) · o.noDiff = 기본값과 달라도 경고 안 함 */
function tlChk(k, ty, o){ o=o||{}; var r=tlC(k), w=[], RX={ hm:/^\d{1,2}:\d{2}$/, win:/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/, dt:/^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}$/, pair:/^\d+,\d+$/ };
  if(!tlD("cfgl")) return w;
  if(!r){ if(!o.empty) w.push("설정값 없음 · 기본값 "+(o.def||"-")+"으로 돎"); return w; }
  var v=String(r.v==null?"":r.v).trim(); if(ty!=="dt") v=v.replace(/\s/g,"");
  if(v===""){ if(!o.empty) w.push("값이 비어 있음 · 기본값 "+(r.def||o.def||"-")+"으로 돎"); return w; }
  if(RX[ty]&&!RX[ty].test(v)) w.push("형식이 틀림 · 「"+r.v+"」 · 서버는 기본값으로 돎");
  if(ty==="dt"&&RX.dt.test(v)&&v.slice(0,10)!==tlEv()) w.push("날짜가 행사일과 다름 · "+r.v);
  if(!o.noDiff&&r.def!=null&&String(r.def)!==""&&String(r.v)!==String(r.def)) w.push("기본값과 다름 · 기본 "+r.def+""+(o.back?" · "+o.back:""));
  return w; }
function tlA(l, js){ return [l, js]; }
function tlCfgA(k){ return tlA("설정 보기","tlCfg('"+jq(k)+"')"); }
function tlCfg(k){ var r=tlC(k), q=(r&&r.n)||k, n=0; go("log","cfg");   /* 운영 설정 표 = 이름으로 찾고 그 줄 상세를 연다(표 검색은 이름 · 설명만 본다) */
  var tick=function(){ var g=MG.cfgv; if(g&&lgSub()==="cfg"){ if(g.q!==q){ g.q=q; var i=document.querySelector("#mg_cfgv .xg-q"); if(i) i.value=q; XG.paint(g); } if((g.rows||[]).length){ rowDetail(g,k,{ title:function(x){ return x.k; } }); return; } } if(++n<40&&S.tab==="log") setTimeout(tick,100); };
  setTimeout(tick,30); }
function tlRows(){
  var R=[], ev=tlEv(), pst=tlD("pst"), sch=tlD("sched"), al=tlD("qal"), dr=tlD("draw");
  var add=function(t, k, ti, d, a, w, x){ R.push(Object.assign({ t:t, k:k, ti:ti, d:d||"", a:a||[], w:(w||[]).filter(Boolean) }, x||{})); };
  var day=function(t){ return { allDay:1 }; };
  /* 00:00 · 하루 종일 */
  var sc=tlV("오픈_범위","자동"), door=tlV("오픈_문","ON").toUpperCase(), t2=tlV("오픈_2차",""), ow=tlChk("오픈_2차","dt",{ noDiff:1 }).filter(function(x){ return !/행사일과 다름/.test(x); });
  var scTx=sc==="자동"?(t2&&t2.slice(0,10)<=ev?"전 구성원 · "+tlMD(t2)+" "+hm(t2)+"부터 열려 있음":"자동 · 2차 "+(t2||"-")+"에 전 구성원"):sc==="전체"?"전 구성원":sc==="종료"?"행사 종료 화면":sc==="클로즈베타"?"클로즈 베타 · 접속 허용 명단":sc==="사전신청"?"사전 신청자 · 스태프":sc;
  if(sc==="클로즈베타"||sc==="사전신청"||sc==="종료") ow.push("행사일에 전 구성원이 못 들어옴 · 「"+sc+"」");
  if(door==="OFF") ow.push("오픈_문 OFF · 앱 문이 닫혀 있음");
  if(sc==="자동"&&t2&&t2.slice(0,10)>ev) ow.push("2차 오픈이 행사일 뒤 · "+t2);
  add("00:00","open","앱 접속 범위 · "+scTx,"오픈_범위 「"+sc+"」 · 바꾸기 = 급한 단추 › 앱 접속 범위(확인 창)",[tlA("급한 단추","go('log','urgent')"),tlCfgA("오픈_범위")],ow,day());
  add("00:00","open","행사 전 가드 해제 · 스탬프 8줄 모두 적립","행사 전 4개 상한(로그인 · 퀴즈 · 게임 · 아이디어 한 줄)이 풀림 · 서버 날짜 기준 · 코드 고정",[tlA("지금 탭","go('now')")],[],day());
  var wq=tlC("벽퀴즈_잠금"), wqv=wq?String(wq.v||"").toUpperCase():"";
  add("00:00","open","벽 퀴즈 잠금 · "+(wqv==="ON"?"켜 둠(지금 잠김)":wqv==="OFF"?"꺼 둠(행사일에도 안 잠김)":"자동 · 행사일부터 잠김"),wq?"벽퀴즈_잠금 「"+(wq.v||"비어 있음 = 자동")+"」":"설정값 없음 · 기본값 자동(행사일부터 잠김)",[],wqv==="OFF"?["꺼 둠 · 행사일에도 벽 퀴즈가 안 잠김"]:[],day());
  var fcOn=tlV("선착순_사용","ON").toUpperCase()!=="OFF";
  add("00:00","chg","선착순 번호 자동 부여 · 6개 달성순","1 ~ "+tlV("선착순_수량","200")+"번 · "+tlV("선착순_방식","달성순")+" · 행사 전 날짜에는 번호 안 매김 · 지급은 10:30부터",[tlA("체크인 탭","go('ckin')"),tlCfgA("선착순_수량")],fcOn?[]:["선착순_사용 OFF · 번호가 안 나감"],day());
  add("00:00","chg","행운권 번호 자동 발급 · 스탬프 4 · 5 · 6개","4 · 5 · 6개가 되는 순간 번호 1장씩 · "+hm(tlV("행운권_마감",""))+" 마감까지",[tlA("행운권 현황","go('stage','now')")],[],day());
  var wait=sch?(sch.rows||[]).filter(function(r){ return r.st==="대기"; }):[], wDap=wait.filter(function(r){ return r.kind==="dap_remind"; }).length, wCc=wait.filter(function(r){ return r.kind==="cchat_remind"; }).length;
  add("00:00","chg","10분 전 알림 예약 줄 자동 생성 · 5분마다","라운지 승인 · 커피챗 매칭을 보고 서버가 예약 줄을 만들고 시간이 바뀌면 취소 · 지금 대기 라운지 "+wDap+"줄 · 커피챗 "+wCc+"줄",[tlA("예약 보기","go('notify','sched')")],[],day());
  var pOn=pst?!!pst.on:null, pMan=pst?pst.manual!==0&&pst.manual!=="0":true, pw=[];
  var pend=wait.filter(function(r){ return r.push||r.kind==="dap_remind"||r.kind==="cchat_remind"||r.kind==="visit_slot"||r.kind==="crowd_notify"; }).length;
  if(pst&&!pOn&&pend) pw.push("푸시 OFF 인데 알림 예약 "+pend+"줄 대기 · 시각이 돼도 푸시 안 나감");
  if(pst&&!pOn&&!pend) pw.push("푸시 OFF · 행사일 알림이 하나도 안 나감");
  if(pst&&pst.dateOk===0) pw.push("푸시 허용 날짜가 지남 · 앱이 구독을 스스로 해제");
  add("00:00","ntf","푸시 "+(pst?(pOn?(pMan?"켜짐":"켜짐 · 공지 푸시 잠금"):"꺼짐(전체 정지)"):"상태를 불러오는 중"),pst?"허용 시간 "+(pst.time||"-")+" · 구독 "+n0(pst.subs)+"기기 "+n0(pst.emps)+"명 · 예약 대기 "+wait.length+"줄":"",[tlA("알림 · 푸시 상태","go('notify','send')"),tlA("급한 단추","go('log','urgent')")],pw,day());
  add("00:00","bk","R2 자동 백업 · 10분마다","서버가 백업 파일을 쓰고 보관 규칙 밖 옛 파일을 지움 · 행사일 것은 전부 남김 · 서비스 데이터는 읽기만",[tlA("서버 상태","go('log','srv')")],[],day());
  add("00:00","bk","콘솔 일괄 저장 · 켜 둔 PC 에서 30분마다","이 콘솔 탭이 열려 있고 폴더를 고른 동안만 · 엑셀 · 오프라인 보기 · 복구용 파일",[tlA("일괄 저장","go('log','bk')")],[],day());
  add("00:05","bk","PC 정시 백업 · 매시 05분","운영 전체 덤프(읽기) · 이 PC 폴더 48개 · 스탬프 줄어듦 · 번호 중복 점검",[],[],{ pc:1, fixed:1 });
  /* 푸시 허용 시간 */
  var ptv=tlV("푸시_시간",""), ptw=tlWin(ptv)||tlWin(pst&&pst.time)||tlWin("08:30-18:30"), ptW=tlChk("푸시_시간","win",{ def:"08:30-18:30", back:"당일 되돌릴 값 08:30-18:30" });
  add(ptw[0],"open","푸시 허용 시간 시작","푸시_시간 "+ptw.join("-")+" · 이 시간 밖에는 시험 발송만",[tlA("알림 · 푸시 상태","go('notify','send')"),tlCfgA("푸시_시간")],ptW);
  add(ptw[1],"open","푸시 허용 시간 끝","뒤에 오는 예약 알림은 앱 공지만 · 푸시 안 나감",[tlCfgA("푸시_시간")],[]);
  /* 타자왕 */
  var tyw=tlWin(tlV("타자_결선",""))||["08:30","17:00"], tyW=tlChk("타자_결선","win",{ def:"08:30-17:00", back:"당일 아침 되돌릴 값 08:30-17:00" });
  add(tyw[0],"open","1F 타자왕 기록 받기 시작","타자_결선 "+tyw.join("-")+" · 시간 밖이면 기록 안 받음 · 시작한 판은 끝나도 받음 · 셀프 "+tlV("타자셀프_횟수","3")+"회",[tlA("타자왕","go('prize','type')"),tlA("화면 주소","go('log','urls')"),tlCfgA("타자_결선")],tyW);
  add(tyw[1]==="24:00"?"23:59":tyw[1],"open","1F 타자왕 기록 마감","순위 · 경품은 이 시각까지 · Closing Speech 에서 발표",[tlA("타자왕","go('prize','type')")],[]);
  if(tlV("타자왕_체험","OFF").toUpperCase()==="ON") R[R.length-1].w.push("타자왕_체험 ON · PC 체험 주소가 열려 있음 · 당일 OFF");
  add("08:00","bk","PC 당일 백업 · 10분마다","같은 덤프(롤업 제외) 80개 유지 · 15분 넘게 낡으면 경고",[],[],{ pc:1, fixed:1 });
  /* 17F · 10F 출석 창 */
  var wi=(al&&al.wins&&al.wins.i)||tlPair(tlV("출석_입장창","30,15"))||[30,15], wo=(al&&al.wins&&al.wins.o)||tlPair(tlV("출석_끝창","10,10"))||[10,10];
  var aw=tlChk("출석_입장창","pair",{ noDiff:1 }).concat(tlChk("출석_끝창","pair",{ noDiff:1 }));
  if(tlV("창검사","ON").toUpperCase()==="OFF") aw.push("창검사 OFF · 시간 창을 보지 않음(언제든 찍힘)");
  var wnote="출석_입장창 "+wi.join(",")+" · 출석_끝창 "+wo.join(",")+" · 사용자 확정 「찍는 시간 통제 없음」";
  var scope=tlV("프로그램스탬프_범위","오후강연"), ron=(al&&al.ron)||[];
  var winTx=function(p){ var s=tlM(p.s), e=tlM(p.e); return "입장 "+tlHM(s-wi[0])+" ~ "+tlHM(s+wi[1])+" · 끝 "+tlHM(e-wo[0])+" ~ "+tlHM(e+wo[1]); };
  var attA=[tlA("출석","go('people','att')"),tlA("현장 QR","go('log','qr')"),tlCfgA("출석_입장창")];
  if(al){ (al.progs||[]).forEach(function(p,i){ var s=tlM(p.s), e=tlM(p.e), st=scope==="전체"||p.id==="l1"||p.id==="l2";
      add(tlHM(Math.min(s-wi[0], e-wo[0])),"open","17F "+p.n+" "+p.s+"~"+p.e+" · 입장 · 끝 QR 열림",winTx(p)+" · "+(st?"프로그램 참여 스탬프":"출석 기록만")+(ron.indexOf(p.id)>=0?" · 송출 출석 켬":"")+(i===0?" · "+wnote:""),attA,i===0?aw:[]); });
    var g10={}; (al.progs10||[]).forEach(function(p){ var k=tlHM(tlM(p.s)-wi[0]); (g10[k]=g10[k]||[]).push(p); });
    Object.keys(g10).forEach(function(k){ var ps=g10[k];
      add(k,"open","10F "+ps.map(function(p){ return p.n; }).join(" · ")+" · 입장 QR 열림",ps.map(function(p){ return p.n+" "+p.s+"~"+p.e+" · "+winTx(p); }).join(" / ")+" · 사전 신청자",attA,[]); }); }
  else add("09:00","open","17F · 10F 출석 QR 창","출석 표(att_list)를 불러오지 못함 · 현장 QR 화면에서 확인",attA,["출석 시각을 읽지 못함"]);
  /* 1F AX 라운지 */
  var lS=tlV("라운지_상담시작","09:30"), lE=tlV("라운지_상담종료","16:00");
  add(lS,"open","1F AX 라운지 상담 시작",tlV("라운지_칸분","30")+"분 칸 · 미팅룸 "+tlV("라운지_상담석","2")+" · "+lE+" 전에 시작하는 칸까지 · 앱 신청 "+tlV("라운지_앱신청","OFF"),[tlA("미팅 › 라운지","go('meet','ln')"),tlCfgA("라운지_상담시작")],tlChk("라운지_상담시작","hm"));
  add(lE,"open","1F AX 라운지 상담 끝","이 시각 이후에 시작하는 칸은 신청 거절",[tlA("미팅 › 라운지","go('meet','ln')"),tlCfgA("라운지_상담종료")],tlChk("라운지_상담종료","hm"));
  /* 선착순 참여상 */
  var fS=tlV("선착순_지급시작","10:30"), fE=tlV("선착순_마감","");
  add(fS,"open","선착순 참여상 지급 시작 · 1F 체크인존","이 시각 전에는 지급 안 함 · 수량 "+tlV("선착순_수량","200")+" · "+hm(fE)+" 마감",[tlA("체크인 탭","go('ckin')"),tlCfgA("선착순_지급시작")],tlChk("선착순_지급시작","hm").concat(fcOn?[]:["선착순_사용 OFF"]));
  add("10:02","bk","PC 행운권 스냅샷 · 30분마다","행운권 명단 읽기 → CSV 2개(전체 · 공개용) · 비상 엑셀 · 17:01 최종",[tlA("행운권 명단","go('stage','list')")],[],{ pc:1, fixed:1 });
  /* 18F 커피챗 */
  var ccs=tlV("커피챗_회차","").split(",").map(function(x){ return x.trim(); }).filter(function(x){ return /^\d{1,2}:\d{2}$/.test(x); }), ccDay=(pst&&pst.ccDay)||"", ccW=tlChk("커피챗_회차","",{ noDiff:1 });
  if(!ccs.length){ ccW.push("회차 값이 없거나 형식이 틀림"); ccs=["13:00"]; }
  if(ccDay&&ccDay!==ev) ccW.push("커피챗일 "+ccDay+" · 행사일과 다름");
  add(ccs[0],"open","18F 커피챗 "+ccs.length+"회차 · "+ccs[0]+" ~ "+ccs[ccs.length-1],ccs.join(" · ")+" · 회차당 테이블 "+tlV("커피챗_회차정원","2")+" · 회차 시작 전만 신청",[tlA("미팅 › 커피챗","go('meet','cc')"),tlCfgA("커피챗_회차")],ccW);
  add(ccs[0],"chg","커피챗 미선정 자동 표시 · 5분마다","희망 회차가 모두 지난 대기자에게 「미선정」 기록 · 한 사람 한 번 알림 · 행사일만 · 푸시 OFF 면 기록만 남음",[tlA("미팅 › 커피챗","go('meet','cc')"),tlA("자동 알림","go('notify','auto')")],[]);
  /* 설문 · 아이디어 */
  add(tlV("설문_시작","14:30"),"open","설문 열림 · 스탬프 8 마무리","행사일 이 시각부터 앱 설문 · 행사 뒤에도 열려 있음",[tlA("설문","go('log','sv')"),tlCfgA("설문_시작")],tlChk("설문_시작","hm"));
  var idE=tlV("아이디어_마감","");
  add(hm(idE)||"16:00","open","아이디어 한 줄 마감","마감 뒤 제출 = "+(tlV("아이디어_마감후","받음")==="받음"?"받음 · 스탬프 인정 · 심사 제외 표시":tlV("아이디어_마감후","")),[tlA("미팅 › 아이디어","go('meet','cc-ideaall')"),tlCfgA("아이디어_마감")],tlChk("아이디어_마감","dt"));
  /* 17F 럭키드로우 · 17:00 마감들 */
  var dwv=(dr&&dr.win)||tlV("추첨_창",TL_DEF.draw), dw=tlWin(dwv)||tlWin(TL_DEF.draw), dW=[];
  /* 261022 사용자 「추첨 체크인 마감 = 담당자가 접수 마감을 누를 때」 · 설정 끝 시각은 늦게 닫히지 않게 둔 값이라 경고하지 않는다 */
  if(dr&&dr.day&&dr.day!==ev) dW.push("추첨 날짜 "+dr.day+" · 행사일과 다름");
  if(!dr) dW.push("추첨 상태를 읽지 못함 · 기본값 "+TL_DEF.draw);
  add(dw[0],"open","17F 추첨 체크인 시작 · 럭키드로우","마감 = 담당자가 행운권 › 진행에서 「접수 마감」을 누를 때(설정 끝 "+dw[1]+"는 늦게 닫히지 않게 둔 값)"+(dr&&dr.closed?" · 지금 접수 마감됨":"")+(dr&&dr.day?" · 날짜 "+tlMD(dr.day):"")+" · 행운권 참석 조건 "+tlV("행운권_참석조건","OFF"),[tlA("행운권 › 진행","go('stage','draw')"),tlA("현장 QR","go('log','qr')")],dW);
  var c17=function(k, ti, d, a){ var v=tlV(k,""); add(hm(v)||"17:00","open",ti,d,a.concat([tlCfgA(k)]),tlChk(k,"dt")); };
  c17("선착순_마감","선착순 참여상 마감","뒤로는 지급 안 함 · 앱 「선착순 마감」",[tlA("체크인 탭","go('ckin')")]);
  c17("룰렛_마감","룰렛 마감","뒤로는 룰렛 차감 거절",[tlA("급한 단추","go('log','urgent')")]);
  c17("행운권_마감","행운권 마감","뒤로는 새 번호 없음 · 추첨 명단 확정",[tlA("행운권 현황","go('stage','now')")]);
  c17("랜덤굿즈_마감","7등 랜덤 굿즈 풀 기준","이 시각까지 스탬프 4개 이상인 사람 · "+tlV("랜덤굿즈_수","60")+"개",[tlA("7등 굿즈","go('prize','lk7')")]);
  add("17:00","prog","17F Closing Speech · 17:00~17:30","3개년 로드맵 · DAP 시상 · 럭키드로우 · 타자왕 순위 발표",[tlA("행운권 › 진행","go('stage','draw')"),tlA("화면 주소","go('log','urls')")],[]);
  add("17:01","bk","PC 행운권 최종 스냅샷","행운권 마감 직후 한 번 · CSV · 비상 엑셀",[],[],{ pc:1, fixed:1 });
  /* 예약 줄 · 관람 시간 알림 */
  if(sch){ (sch.rows||[]).filter(function(r){ return String(r.at||"").slice(0,10)===ev&&r.st!=="취소"; }).forEach(function(r){
      var man=r.kind==="notice"||r.kind==="outro", isP=r.push||!man, w=[];
      if(r.st==="대기"&&isP&&pst&&!pOn) w.push("푸시 OFF · 이 시각에 푸시 안 나감");
      if(r.st==="대기"&&isP&&ptw&&(tlM(r.at)<tlM(ptw[0])||tlM(r.at)>=tlM(ptw[1]))) w.push("푸시 허용 시간 밖 · 푸시 안 나감");
      if(r.st==="지남"||r.st==="오류") w.push(r.st+" · 실행되지 않음");
      var a=man&&(r.st==="대기"||r.st==="꺼짐")?[tlA(r.st==="대기"?"끄기":"켜기","nfNoToggle('"+jq(r.id)+"')"),tlA("공지","go('notify','notice')")]:[tlA("예약 보기","go('notify','sched')")];
      var kn=SCH_K[r.kind]||r.kind; add(hm(r.at),"ntf",man?(String(r.title||"").indexOf(kn)===0?r.title:kn+" · "+(r.title||"")):kn+" · "+(r.slot||"")+" 칸",(man?(r.body||"")+(typeof schWho==="function"&&schWho(r)?(r.body?" · ":"")+schWho(r):""):schWhat(r)),a,w,{ st:r.st, off:r.st==="꺼짐"||r.st==="완료" }); }); }
  else add("09:00","ntf","알림 예약","예약 목록(sched_list)을 불러오지 못함",[tlA("예약 보기","go('notify','sched')")],["예약 목록을 읽지 못함"]);
  return R.sort(function(a,b){ var x=tlM(a.t)-tlM(b.t); return x||((b.allDay?1:0)-(a.allDay?1:0)); });
}
/* 꺼져 있어 오늘 돌지 않는 것 */
function tlOffs(){ var o=[], vs=tlD("sched")&&tlD("sched").vslot;
  if(vs&&!vs.on) o.push(["관람 시간 알림","관람_발송 OFF · 슬롯 10분 전 알림 없음"]);
  if(tlV("체크인_번호표","OFF").toUpperCase()!=="ON") o.push(["체크인 번호표","체크인_번호표 OFF(261016 폐기)"]);
  o.push(["키트 옷 사이즈 자동 배정","시각이 돼도 돌지 않음 · 슈퍼관리자가 미리보기 뒤 직접"]);
  if(tlV("행운권_참석조건","OFF").toUpperCase()!=="ON") o.push(["행운권 참석 조건","OFF · 추첨 QR 체크인 없이도 추첨 대상"]);
  if(tlV("라운지_앱신청","OFF").toUpperCase()!=="ON") o.push(["라운지 앱 신청","OFF · 명단 · 운영진이 칸에 넣음"]);
  if(tlV("룰렛_소진","OFF").toUpperCase()!=="ON") o.push(["룰렛 소진 안내","OFF"]);
  return o; }
function tlNw(t){ return String(t||"").split(" · ").map(function(x){ return x.length<=18?'<span class="tl-nw">'+esc(x)+'</span>':esc(x); }).join(" · "); }   /* 「 · 」 마디가 짧으면 한 마디째로 줄을 넘긴다 */
function tlPaint(){
  var b=el("tlBox"); if(!b) return;
  if(!tlD("cfgl")){ b.innerHTML=S.err.cfgl?emptyH("운영 설정을 불러오지 못했습니다 · "+S.err.cfgl):emptyH("불러오는 중"); return; }
  var R=tlRows(), ev=tlEv(), td=tlToday(), isEv=td===ev, nowM=null;
  if(isEv){ var t=srvNow(); nowM=t.getHours()*60+t.getMinutes(); }
  var cnt={ all:R.length }, wn=0; R.forEach(function(r){ cnt[r.k]=(cnt[r.k]||0)+1; if(r.w.length) wn++; });
  var F=[["all","전체"],["chg","데이터 바뀜"],["open","열림 · 닫힘"],["ntf","알림 발송"],["bk","백업 · 읽기"]];
  var bar='<div class="tl-bar" role="group" aria-label="종류 거르기">'+F.map(function(f){ return '<button type="button" class="tl-fb'+(TL.f===f[0]?" on":"")+'" aria-pressed="'+(TL.f===f[0])+'" onclick="TL.f=\''+f[0]+'\';tlPaint()">'+esc(f[1])+' <span class="n">'+(cnt[f[0]]||0)+'</span></button>'; }).join("")+
    '<button type="button" class="tl-fb'+(TL.warn?" on":"")+'" aria-pressed="'+TL.warn+'" onclick="TL.warn=!TL.warn;tlPaint()">확인 필요 <span class="n'+(wn?" w":"")+'">'+wn+'</span></button></div>';
  var V=R.filter(function(r){ return (TL.f==="all"||r.k===TL.f)&&(!TL.warn||r.w.length); });
  var prev="", nowDone=!isEv, h="";
  V.forEach(function(r){
    if(!nowDone&&!r.allDay&&tlM(r.t)>=nowM){ h+='<div class="tl-now" role="separator"><span class="tl-tm n">'+tlHM(nowM)+'</span><span class="tl-nl">지금</span></div>'; nowDone=true; prev=""; }
    var k=TL_K[r.k]||["",""], same=r.t===prev; prev=r.t;
    h+='<div class="tl-row'+(r.k==="chg"?" chg":"")+(r.off?" dim":"")+(same?" same":"")+'"><div class="tl-tm n">'+(same?"":esc(r.t)+(r.allDay?'<span class="tl-ad">하루 종일</span>':''))+'</div>'+
      '<div class="tl-bd"><div class="tl-tx"><div class="tl-ti"><span class="tag '+k[1]+'">'+esc(k[0])+'</span>'+(r.pc?'<span class="tag off">이 PC 예약</span>':'')+(r.st&&r.st!=="대기"?tag(r.st,r.st==="완료"?"ok":r.st==="꺼짐"?"off":"bad"):'')+'<b>'+tlNw(r.ti)+'</b></div>'+
      (r.d?'<div class="tl-d">'+tlNw(r.d)+'</div>':'')+r.w.map(function(w){ return '<div class="tl-w"><span class="tag warn">확인</span>'+esc(w)+'</div>'; }).join("")+'</div>'+
      (r.a.length?'<div class="tl-ac">'+r.a.map(function(a){ return '<button class="btn sm" type="button" onclick="'+a[1]+'">'+esc(a[0])+'</button>'; }).join("")+'</div>':'')+'</div></div>'; });
  if(!nowDone&&V.length) h+='<div class="tl-now" role="separator"><span class="tl-tm n">'+tlHM(nowM)+'</span><span class="tl-nl">지금 · 남은 일 없음</span></div>';
  var offs=tlOffs();
  var html=(isEv?'':'<div class="tl-pre">행사일 기준 미리 보기 · '+tlMD(ev)+' 하루 · 오늘 '+tlMD(td)+'</div>')+bar+
    '<div class="card tl-list">'+(h||emptyH("고른 종류의 줄이 없습니다"))+'</div>'+
    '<div class="card mt"><h2>꺼져 있어 오늘 돌지 않는 것</h2>'+offs.map(function(x){ return '<div class="tl-off"><b>'+esc(x[0])+'</b><span class="cap">'+esc(x[1])+'</span></div>'; }).join("")+'</div>'+
    '<details class="memo mt"'+(TL.memo?" open":"")+' ontoggle="TL.memo=this.open"><summary>운영 메모</summary><div class="cap mt4">시각은 운영 설정 · 예약 · 출석 표 · 추첨 상태에서 계산 · 설정이 바뀌면 줄 시각도 바뀜</div><div class="cap">「이 PC 예약」 줄은 운영 PC 작업 스케줄러 기준 고정 안내 · 콘솔은 실행 여부를 모름</div><div class="cap">끄기 · 켜기는 공지 · Closing Speech 예약 줄만 · 자동 알림 예약 줄은 예약 화면에서 취소</div><div class="cap">명단 올리기 · 승인 · 매칭 · 스캔 푸시 · 혼잡 제보(15분 뒤 끝남)는 시각이 아니라 조작으로 생겨 줄에 없음</div><div class="cap">설정 바꾸기는 각 화면 확인 창 또는 대화로 · 이 화면은 보기 · 이동만</div></details>';
  if(b._h!==html){ b._h=html; b.innerHTML=html; }
}
(function(){
  var sc=SCREENS.log, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return lgSub()==="tl"?[{ k:"cfgl", a:"cfg_list", ttl:60000 },{ k:"sched", a:"sched_list", ttl:30000 },{ k:"pst", a:"push_stats", ttl:60000 },{ k:"qal", a:"att_list", ttl:300000 },{ k:"draw", a:"draw_stats", ttl:30000 }]:n0_(); };
  sc.mount=function(vb){ if(lgSub()!=="tl") return m0(vb); el("phCap").textContent="행사일 하루 · 시각이 되면 바뀌는 것 · 열리고 닫히는 것 · 알림 · 백업 · 단추는 관련 화면으로 이동"; vb.innerHTML=chipsH(LG_SUBS,"tl")+'<div id="tlBox"></div>'; };
  sc.paint=function(vb){ if(lgSub()!=="tl") return p0(vb); tlPaint(); };
})();
