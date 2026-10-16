/* AXF CONTROL v2 · 18F 커피챗 부품 (261016 · 서버 U4 커피챗 계약 · 261016 밤 미팅 탭으로 옮김 · 처리함 커피챗 칩 걷음)
 * 미팅 탭(meet.js)이 쓰는 것: 설정(회차 · 테이블) · 명단 표(공통 명단 표 XG · 선택 · 추가 · 선택 삭제) · 상태 바꾸기(확인 창) · 마감 · 추가 창
 * 서버: cchat_list(행 pref 희망 회차 · text 상담하고 싶은 내용 전문 · ideaId 경로 cchat 아이디어 · overAt 미선정 알림 시각)
 *       cchat_set · cchat_status(정원 넘으면 { ok:true, warn:"full", round, n, cap } · 막지 않는다) · cchat_close(남은 희망 전원 미선정 알림 · { n, sent })
 *       cfg_list 의 커피챗_회차(쉼표) · 커피챗_회차정원(테이블 수) · 없으면 설계값(1:1 · 20분 · 9회차 × 테이블 A · B)
 * 모든 쓰기 = 확인 창(L2 · 261016 PIN 없음) · 처리한 줄만 고친다 */
var CC_ROUNDS=["13:00","13:20","13:40","14:00","14:20","14:40","15:00","15:20","15:40"], CC_TABLES=["A","B","C","D","E","F"], CC_CAP_DEF=2, CC_LEN=20;
var CC={ g:null, memo:"" };
var CC_ON=["매칭","참석","완료"];
function ccCfg(){
  var d=S.data.ccf, rows=d&&d.ok&&d.rows||[], v=function(k){ var r=rows.filter(function(x){ return x.k===k; })[0]; return r?String(r.v==null?"":r.v):null; };
  var rs=v("커피챗_회차"), cp=v("커피챗_회차정원"), seen={};
  var rounds=rs==null?CC_ROUNDS:rs.split(/[\s,·]+/).map(hm).filter(function(x){ if(!x||seen[x]) return false; seen[x]=1; return true; }).sort();
  var cap=parseInt(cp,10); cap=cap>=1&&cap<=50?cap:CC_CAP_DEF;
  return { rounds:rounds.length?rounds:CC_ROUNDS, cap:cap, tables:CC_TABLES.slice(0,Math.min(cap,CC_TABLES.length)), srv:rs!=null||cp!=null };
}
function ccRows(){ var d=S.data.cc; return d&&d.ok&&d.rows||[]; }
function ccRow(e){ return ccRows().filter(function(x){ return jq(x.emp)===e; })[0]||null; }
function ccPrefTx(r){ return r.pref?String(r.pref).split(",").map(hm).filter(Boolean).join(" · "):(r.text?"언제든":"-"); }
/* 화면 상태 이름 · 대기 줄 · 배정 · 왔음 · 끝 · 노쇼 · 취소(미선정 알림을 받은 대기 = 미선정) */
function ccNoShow(r){ return r.status==="취소"&&(/노쇼/.test(r.cxBy||"")||!!(typeof MT!=="undefined"&&MT.ns[jq(r.emp)])); }
function ccView(r){ var s=r.status; return s==="대기"?(r.overAt?"미선정":"대기 줄"):s==="매칭"?"배정":s==="참석"?"왔음":s==="완료"?"끝":s==="취소"?(ccNoShow(r)?"노쇼":"취소"):s; }
function ccTagH(r){ var s=ccView(r); return tag(s, s==="대기 줄"?"warn":s==="왔음"||s==="끝"?"ok":s==="노쇼"?"bad":s==="취소"||s==="미선정"?"off":""); }

/* 명단 표 · 미팅 탭 › 18F 커피챗 › 명단 · 줄을 누르면 사람 상세(meet.js mtOpen) */
function ccListPaint(box){
  var gt=dataGate("cc","커피챗 명단"), rows=gt?[]:ccRows();
  if(!CC.g) CC.g=XG.make({ id:"cchat3", file:"18F 커피챗", key:function(r){ return jq(r.emp); }, sort:{ k:"ts", d:1 }, find:["emp","text"],
    onRow:function(k){ mtOpen("cc", k, CC.g); },
    select:1, onAdd:function(){ paOpen(ccAddSp()); }, cancel:{ kind:"cchat", what:"18F 커피챗 신청", sub:"상태 = 취소(줄 · 회차 · 테이블 칸은 남음) · 끝이었으면 커피챗 스탬프 거둠 · 배정이었으면 대기 알림 거둠", after:function(){ reload(["cc"]); } },
    chips:[["all","전체",null],["q","대기 줄",function(r){ return r.status==="대기"; }],["m","배정",function(r){ return r.status==="매칭"; }],["in","왔음",function(r){ return r.status==="참석"; }],["dn","끝",function(r){ return r.status==="완료"; }],["ns","노쇼",ccNoShow],["cx","취소",function(r){ return r.status==="취소"&&!ccNoShow(r); }]],
    cols:[{ k:"no", t:"순번", type:"num", w:56, v:function(r){ return r.status==="대기"&&typeof mtQno==="function"?mtQno(r):""; } },
      { k:"name", t:"이름", w:76 },{ k:"emp", t:"사번", w:76 },{ k:"dept", t:"부서", w:110 },{ k:"ts", t:"신청 시각", type:"date", w:96 },
      { k:"pref", t:"희망 시간", w:110, v:ccPrefTx },
      { k:"round", t:"배정", w:84, v:function(r){ return CC_ON.indexOf(r.status)>=0&&r.round?hm(r.round)+" · "+(r.table||""):""; } },
      { k:"st", t:"상태", w:72, v:ccView, f:ccTagH },
      { k:"text", t:"상담 내용", w:260, v:function(r){ return r.text||r.tag||""; } },
      { k:"memo", t:"메모", w:150, v:function(r){ var n=typeof mtNote==="function"?mtNote("cc",r.emp):null; return n&&n.memo?String(n.memo).slice(0,20):""; } }],
    src:{ a:"cchat_list", p:{} }, h:520 });
  CC.g.gate=gt||""; XG.set(CC.g, gt?null:rows, box);
}

/* 상태 바꾸기(사람 상세 단추) · 되돌리기 7초 */
function ccSet(e, to, quiet){
  var r=ccRow(e); if(!r) return; var from=r.status;
  var run=function(){ return call("cchat_status",{ emp:r.emp, status:to, from:from }); };
  var after=function(x){ r.status=to; if(to==="대기"){ r.round=""; r.table=""; if(from==="취소"){ r.overAt=""; } } paint(); if(typeof mtDetRe==="function") mtDetRe(); reload(["cc","nb"]); return x&&x.warn==="full"?" · 정원 넘침 "+n0(x.n)+"/"+n0(x.cap):""; };
  if(quiet){ run().then(function(x){ if(x&&x.ok){ var w=after(x); toast("되돌렸습니다"+w,{ bad:w?1:0 }); } else toast("되돌리지 못했습니다 · "+why(x),{ bad:1 }); }); return; }
  var T={ "참석":"왔음으로 바꿀까요?", "완료":"상담 끝으로 바꿀까요?", "대기":from==="취소"?"신청을 되살릴까요?":"칸에서 빼 대기 줄로 돌릴까요?", "매칭":"왔음을 취소할까요?", "취소":"커피챗 신청을 취소할까요?" };
  var O={ "참석":"왔음", "완료":"끝", "대기":from==="취소"?"되살리기":"대기 줄로", "매칭":"왔음 취소", "취소":"신청 취소" };
  var SUB={ "참석":from==="완료"?"스탬프를 거둡니다 · 왔음은 출석만":"출석만 · 스탬프는 완료 때", "완료":"완료하면 스탬프 07 프로그램 참여(커피챗 1개)", "매칭":from==="완료"?"스탬프를 거둡니다":"출석 기록만 바뀝니다", "취소":"참가자 앱에 바로 반영 · 신청 글 · 아이디어 한 줄은 그대로", "대기":from==="취소"?"대기 줄 맨 뒤로 돌아갑니다":"회차 · 테이블을 비우고 대기 줄로 · 대기 알림을 거둡니다" };
  confirmBox({ t:T[to]||"바꿀까요?", who:(r.name||r.emp)+" · "+ccView(r)+" → "+({ "대기":"대기 줄", "매칭":"배정", "참석":"왔음", "완료":"끝", "취소":"취소" })[to], sub:SUB[to]||"", ok:O[to]||"바꾸기", danger:to==="취소"||to==="매칭"||(to==="대기"&&from!=="취소"),
    run:run, done:function(x){ var w=after(x); toast((r.name||r.emp)+" · "+ccView(r)+w,{ bad:w?1:0, undo:function(){ ccSet(e, from, 1); } }); } });
}
/* 마감 · 지금 대기 줄(미선정 알림 전) 전원에게 미선정 알림 한 번 · 되돌릴 수 없다 */
function ccWaitN(){ return ccRows().filter(function(r){ return r.status==="대기"&&!r.overAt; }).length; }
function ccClose(){
  var n=ccWaitN(); if(!n){ toast("대기 줄에 남은 사람이 없습니다"); return; }
  confirmBox({ t:"커피챗 희망 접수를 마감할까요?", who:"대기 줄 "+n0(n)+"명 · 미선정 처리", sub:"「커피챗 신청한 시간이 모두 지났어요」 알림 한 번 · 되돌릴 수 없습니다 · 정원 넘침 경고와 무관", ok:"마감 · 알림 보내기", danger:1,
    body:'<div class="fld">확인 문구 · 「마감」을 입력합니다</div><input class="in" id="ccEndQ" autocomplete="off" oninput="gateUpd()">', focus:"ccEndQ",
    gate:function(){ var q=el("ccEndQ"); return !!q&&q.value.trim()==="마감"; },
    run:function(){ return call("cchat_close",{}); },
    done:function(x){ var at=new Date().toISOString(); ccRows().forEach(function(r){ if(r.status==="대기"&&!r.overAt) r.overAt=at; }); paint(); reload(["cc","nb"]); toast("마감했습니다 · 미선정 "+n0(x.n)+"명 · 알림 받는 사람 "+n0(x.sent)+"명"); } });
}
/* 261016 저녁 「추가」 창(edit.js paOpen) · cchat_add(emp · memo 40자 · 희망 = 언제든) · 취소 줄이 있으면 대기로 되살림 · 되돌리기 = 그 사람 선택 취소 */
var CC_ADDWHY={ param:"사번을 확인하세요", noros:"명부 · 계정에 없는 사번입니다", dup:"진행 중인 커피챗 줄이 있습니다" };
function ccAddSp(){
  CC.memo="";
  return { t:"커피챗 신청 추가", cap:"명부에서 찾기 → 넣기 · 희망 시간 = 언제든 · 대기 줄 맨 뒤로 들어감 · 칸은 시간표에서 놓기",
    have:function(e){ var r=ccRows().filter(function(x){ return normE(x.emp)===e&&x.status!=="취소"; })[0]; return r?"이미 "+ccView(r)+" 상태로 있습니다":""; },
    opts:function(){ return '<label class="nt-f"><span class="nt-l">상담 내용 · 메모(선택)</span><input class="xg-q" id="ccMemo" maxlength="40" autocomplete="off" placeholder="40자까지" aria-label="상담 내용 · 메모" value="'+esc(CC.memo||"")+'" oninput="CC.memo=this.value" style="width:100%;max-width:360px"></label>'; },
    run:function(p){ return call("cchat_add",{ emp:normE(p.emp), memo:String(CC.memo||"").trim().slice(0,40)||null }); },
    fail:function(r){ return r&&r.reason==="dup"?"이미 진행 중인 줄이 있습니다":CC_ADDWHY[r&&r.reason]||""; },
    done:function(r, p){ var e=normE(r.emp||p.emp); reload(["cc","nb"]);
      toast((r.how==="back"?"되살렸습니다 · ":"넣었습니다 · ")+(r.name||p.name||e)+" · 대기 줄", { undo:function(){ call("list_rows_cancel",{ kind:"cchat", keys:e, rid:"u"+Date.now().toString(36) }).then(function(x){ reload(["cc"]); var ok=x&&x.ok&&num(x.done)>0; toast(ok?"되돌렸습니다 · 취소":"되돌리지 못했습니다 · "+(x&&x.rows&&x.rows[0]?xgCxWhy(x.rows[0]):why(x)),{ bad:!ok }); }); } }); } };
}
