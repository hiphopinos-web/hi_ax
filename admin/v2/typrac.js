/* AXF CONTROL v2 · 1F 타자왕 연습판 명단(261023 · 타자왕 게임 세션 · 사용자)
 * 경품 › 타자왕 칩 아래 칸 · 명단 올리기(upload.js 공통 부품 · 엑셀 · CSV · 붙여넣기 · 사번 또는 이름) · 보기 · 지우기
 * 서버 = type_prac_state(읽기) · type_prac_preview(미리 세기) · type_prac_apply(확인 문구 연습판명단 · sig) · type_prac_clear(확인 문구 연습판지우기)
 * 명단 사람 판 = 노트북 · 폰 「연습」 · 서버에 기록을 남기지 않음 · 예전 기록도 순위 계산에서 빠짐(지우지 않음) · 명단에서 지우면 다음 판부터 예전처럼
 * 운영로그 = 사람 수만 · 이 칸의 이름 · 사번은 콘솔 화면에만
 * 261023 사용자 결정 · 올리기 · 지우기 · 미리 세기 = 슈퍼관리자만(서버 admTop_) · 보기는 콘솔 관리자 · 명단 사람 판은 TV 송출 없음 */
var TYPRAC_UP={
  byName:1, id:"tpup", file:"연습판 명단 미리 세기", title:"연습판 명단 올리기", desc:"사번 또는 이름 · 명단 사람 판 = 연습", backT:"타자왕으로", askT:"연습판 명단을 적용할까요?", word:"연습판명단",
  pasteT:"사번 이름", pasteEx:"990001	홍길동&#10;김가나",
  preview:"type_prac_preview", apply:"type_prac_apply",
  fields:[UP_EMPF,UP_NAMEF],
  modes:[["replace","명단 통째 교체","올린 사람이 명단 전부 · 빠지는 사람은 다음 판부터 순위에 들어감"],["add","추가만","지금 명단에 더함 · 빠지는 사람 없음"]],
  line:upLine1,
  judge:function(o, pr){ return upJudge1(o, pr, function(){ return { k:"ok", res:"정상", msg:"" }; }); },
  chips:upChips(), cols:UP_COLS0.concat([UP_COLK,UP_COLM]),
  sum:function(pv, mode){ var d=pv.diff||{};
    return { who:n0(pv.n)+"명 · 새로 "+n0(d.add)+" · 그대로 "+n0(d.keep), sub:(mode==="replace"?"빠지는 사람 "+n0(d.del)+"명 · ":"")+"명단 사람 판은 연습 · 기록 · 순위 · 시상 없음 · 예전 기록은 지우지 않고 순위에서만 빠짐", danger:mode==="replace"&&num(d.del)>0 }; },
  kpis:function(pv, rows, mode){ return upKp(pv, rows, mode, "", ""); },
  back:function(){ tpBack(); },
  done:function(r){ var d=r&&r.diff||{}; S.ui.tpup=0; UP=null; render(); reload(["tprac","tres"]); toast("연습판 명단을 적용했습니다 · "+n0(r.n)+"명 · 새로 "+n0(d.add)+" · 빠짐 "+n0(d.del)); }
};
function tpBack(){ S.ui.tpup=0; UP=null; render(); load(false); }
function tpUpOpen(){ if(!isTop()){ toast("슈퍼관리자가 올립니다",{ bad:1 }); return; } upOpen(TYPRAC_UP); S.ui.tpup=1; render(); el("main").scrollTop=0; }
function tpClearAsk(){
  if(!isTop()){ toast("슈퍼관리자가 지웁니다",{ bad:1 }); return; }
  var d=S.data.tprac; if(!d||!d.ok) return; if(!num(d.n)){ toast("지울 명단이 없습니다"); return; }
  confirmBox({ t:"연습판 명단을 지울까요?", who:"지금 "+n0(d.n)+"명", sub:"다음 판부터 기록 · 순위가 예전처럼 · 그 사람들의 예전 기록도 순위에 다시 들어감",
    body:'<label class="fld">확인 문구 · 「연습판지우기」를 입력합니다<input class="in" id="tpCw" autocomplete="off" oninput="gateUpd()"></label>', focus:"tpCw", ok:"지우기", danger:true,
    gate:function(){ return String((el("tpCw")||{}).value||"").trim()==="연습판지우기"; },
    run:function(){ return call("type_prac_clear",{ confirm:"연습판지우기" }); },
    fail:function(r){ return "지우지 못했습니다 · "+why(r); },
    done:function(r){ toast("연습판 명단을 지웠습니다 · "+n0(r.was)+"명"); reload(["tprac","tres"]); } });
}
function tpPaint(){
  var b=el("tpTop"); if(!b) return;
  var d=S.data.tprac;
  if(!d){ b.innerHTML=skel(); return; }
  if(!d.ok){ b.innerHTML=band("warn",unknownSrv(d)?"이 서버는 아직 연습판 명단을 모릅니다":"명단을 받지 못했습니다 · "+esc(why(d))); return; }
  b.innerHTML='<div class="grid g3">'+kpi({ l:"연습판 명단", v:n0(d.n), u:"명", s:"판 = 연습 · 기록 · 순위 없음" })+
    kpi({ l:"마지막 바꿈", v:d.at?fmtD(d.at):"-", s:d.by?String(d.by):"바꾼 적 없음" })+
    kpi({ l:"명단 사람 기록", v:n0((d.rows||[]).reduce(function(a,r){ return a+num(r.recs); },0)), u:"줄", s:"명단 전에 남은 기록 · 순위에서만 빠짐" })+'</div>';
  gridPaint("tprac","tprac","연습판 명단",function(x){ return x.rows||[]; });
}
(function(){ var sc=SCREENS.prize; if(!sc||sc.tp) return; sc.tp=1; var n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ var a=n0_.apply(this,arguments)||[]; return awSub()==="type"?a.concat([{ k:"tprac", a:"type_prac_state", ttl:30000 }]):a; };
  sc.mount=function(vb){
    if(awSub()!=="type"){ S.ui.tpup=0; return m0.apply(this,arguments); }
    if(S.ui.tpup&&UP&&UP.sp===TYPRAC_UP){ vb.innerHTML=chipsH(AW_SUBS,"type")+'<div id="tpUp"></div>'; el("phCap").textContent="1F 현장 타자왕 · 연습판 명단 올리기"; upMount(el("tpUp")); return; }
    var r=m0.apply(this,arguments);
    gridOf("tprac",{ file:"타자왕 연습판 명단", key:function(x){ return String(x.emp); }, sort:{ k:"emp", d:1 }, onRow:function(k){ rowDetail(MG.tprac,k); },
      cols:[{ k:"emp", t:"사번", w:90 },{ k:"name", t:"이름", w:100 },{ k:"dept", t:"소속", w:160 },{ k:"recs", t:"기록 줄", type:"num", w:80 },{ k:"best", t:"최고 점수", type:"num", w:90 },{ k:"test", t:"구분", w:80, v:function(x){ return x.test?"테스트 사번":""; } }],
      empty:"명단이 비었습니다", h:360 });
    vb.insertAdjacentHTML("beforeend",'<div class="card mt" id="tpCard"><h2>연습판 명단 <span class="cap">명단 사람 판 = 연습 · 기록 · 순위 · 시상 없음 · 예전 기록은 지우지 않고 순위에서만 빠짐</span>'+
      (isTop()?'<span class="r"><button class="btn sm pri" type="button" onclick="tpUpOpen()">명단 올리기</button> <button class="btn sm dng" type="button" onclick="tpClearAsk()">지우기</button></span>':'<span class="r cap">올리기 · 지우기 = 슈퍼관리자</span>')+'</h2>'+
      '<p class="cap">스태프를 명단에 넣으면 그 사람 기록은 순위판에서 빠짐 · 명단 사람 판은 TV 에 송출하지 않음</p>'+
      '<div id="tpTop"></div><details class="mt" id="tpDet"><summary>명단 보기</summary><div id="mg_tprac" class="mt"></div></details></div>');
    return r;
  };
  sc.paint=function(){ if(awSub()==="type"&&S.ui.tpup&&UP&&UP.sp===TYPRAC_UP) return;   /* 올리기 화면은 upload.js 가 그린다 */
    var r=p0.apply(this,arguments); if(awSub()==="type"&&!S.ui.tpup) tpPaint(); return r; };
})();
