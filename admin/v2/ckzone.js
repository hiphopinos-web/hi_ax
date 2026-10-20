/* AXF CONTROL v2 · 처리함 › 체크인존 명단 한 판 · 참여상 (261017 사용자 확정 · 「누가 왔고 누가 안 왔나」)
 * 데이터 = ck_zone(사전 신청자 + 스태프 · 체크인 첫 시각 = 스태프 폰 「체크인존」 스캔 ck_gate) · 콘솔에서는 체크인하지 않는다(K1)
 * 구분 칩 = 전체 · A~E · 스태프 / 상태 = 안 옴 · 옴 · 전체(이 브라우저에 기억) · 체크인한 줄은 흐리게 · 아래로
 * 스태프 번호 S-1 = ck_staff_no(확인 문구 · 묶음 순 임원 → 주니어보드 → DS → 그 밖 · 이름 가나다순 · 한 번 매기면 고정) · 묶음 = ck_staff_grp
 * 참여상 칩 = fcfs_list 1~200(달성 순번 · 지급은 스태프 폰 스캔 그대로) */
var CKZ={ g:null, st:lsGet("axf_v2_ckz_st","out")||"out", gf:null, app:0 };   /* app = 「앱 미가입」 칩(261017 · appmark.js app_marks) */
var CKZ_SEG=["A","B","C","D","E","S"], CKZ_GRP=["임원","주니어보드","DS","그 밖"];
function ckzRowsAll(){ var d=S.data.ckz; return d&&d.ok?(d.rows||[]):null; }
function ckzOrd(r){ var m=String(r.no||"").match(/-(\d+)$/), gi=CKZ_SEG.indexOf(r.g); return (r.ck?"1":"0")+(gi<0?9:gi)+("0000"+(m?m[1]:"9999")).slice(-4)+(r.name||""); }
function ckzStOk(r){ var st=CKZ.st; return st==="all"?true:st==="in"?!!r.ck:!r.ck; }
function ckzView(rows){ return (rows||[]).filter(function(r){ return ckzStOk(r)&&(!CKZ.app||apmOf(r.emp)===0); }).map(function(r){ var o={}; for(var k in r) o[k]=r[k]; o._o=ckzOrd(r); return o; }); }
function ckzSt(v){ CKZ.st=v; lsSet("axf_v2_ckz_st",v); ckzPaint(); }
function ckzApp(){ CKZ.app=CKZ.app?0:1; ckzPaint(); }
function ckzSz(r){ return r.hum?"가습기 대체":r.sz||""; }
function ckzPaint(){
  var top=el("ckzTop"); if(!top) return;
  var all=ckzRowsAll(), gt=dataGate("ckz","체크인존 명단");
  if(!all){ top.innerHTML=errTop("ckz"); }
  else {
    var nIn=all.filter(function(r){ return !!r.ck; }).length, nOut=all.length-nIn, nNo=all.filter(function(r){ return r.g==="S"&&!r.no; }).length, nSz=all.filter(function(r){ return !r.sz&&!r.hum; }).length;
    var chip=function(v,t){ return '<button type="button" class="chip'+(CKZ.st===v?" on":"")+'" aria-pressed="'+(CKZ.st===v)+'" onclick="ckzSt(\''+v+'\')">'+t+'</button>'; };
    top.innerHTML=errTop("ckz")+'<div class="ckz-bar"><div class="chips" role="group" aria-label="체크인 상태">'+chip("out","안 옴 <b>"+n0(nOut)+"</b>")+chip("in","옴 <b>"+n0(nIn)+"</b>")+chip("all","전체 "+n0(all.length))+'</div>'+
      (apmMap()?'<button type="button" class="chip'+(CKZ.app?" on":"")+'" aria-pressed="'+!!CKZ.app+'" onclick="ckzApp()">앱 미가입 <b>'+n0(all.filter(function(r){ return ckzStOk(r)&&apmOf(r.emp)===0; }).length)+'</b></button>':'')+
      '<span class="cap">사이즈 미선택 '+n0(nSz)+'명 · 체크인 = 스태프 폰 「체크인존」 스캔 · 콘솔은 체크인 탭</span><span class="sp"></span>'+
      (typeof ckiCam==="function"?'<button class="btn sm" type="button" onclick="ckiCam()">QR 찍기 · 체크인 탭</button>':'')+   /* 261020 노트북 · 태블릿 카메라 → 체크인 탭 카드 */
      '<button class="btn sm'+(nNo?" pri":"")+'" type="button" onclick="ckzNoAsk()"'+(nNo?'':' disabled')+'>'+(nNo?"스태프 번호 매기기 · "+n0(nNo)+"명":"스태프 번호 매길 사람 없음")+'</button></div>';
  }
  if(!CKZ.g) CKZ.g=XG.make({ id:"ckzone", file:"체크인존 명단", key:function(r){ return r.emp; }, sort:{ k:"_o", d:1 },
    rowCls:function(r){ return r.ck?"dim":""; },
    chips:[["all","전체",null]].concat(CKZ_SEG.map(function(g){ return [g,g==="S"?"스태프":g,function(r){ return r.g===g; }]; })),
    cols:[{ k:"_o", t:"", hide:1 },
      { k:"g", t:"구분", w:84, v:function(r){ return (r.g==="S"?"스태프":r.g||"-")+(r.g!=="S"&&r.stf?" · 스태프":""); }, f:function(r){ return esc(r.g==="S"?"스태프":r.g||"-")+(r.g!=="S"&&r.stf?" "+tag("스태프","off"):""); } },
      { k:"no", t:"번호", w:70, v:function(r){ return r.no||""; }, f:function(r){ return r.no?'<b>'+esc(r.no)+'</b>':'<span class="cap">-</span>'; } },
      { k:"emp", t:"사번", w:84 },{ k:"dept", t:"소속", w:170 },{ k:"name", t:"이름", w:90 },apmCol(),
      { k:"sz", t:"사이즈", w:96, v:function(r){ return ckzSz(r)||"미선택"; }, f:function(r){ var s=ckzSz(r); return s?esc(s):tag("미선택","warn"); } },
      { k:"ck", t:"체크인", type:"date", w:96, v:function(r){ return r.ck||""; }, f:function(r){ return r.ck?esc(fmtD(r.ck)):'<span class="cap">안 옴</span>'; } },
      { k:"grp", t:"묶음", w:132, v:function(r){ return r.g==="S"?r.grp||"":""; }, f:function(r){ return r.g!=="S"?'':r.no?esc(r.grp||""):'<select class="in sm" aria-label="'+esc((r.name||r.emp)+" 묶음")+'" onclick="event.stopPropagation()" onchange="ckzGrp(\''+jq(r.emp)+'\',this.value)">'+CKZ_GRP.map(function(x){ return '<option'+(x===r.grp?" selected":"")+'>'+x+'</option>'; }).join("")+'</select>'; } }],
    src:{ a:"ck_zone", pick:function(res){ return ckzView(res.rows||[]); } }, empty:"보일 사람이 없습니다", h:560, onRow:function(k){ pcOpen(k, CKZ.g); } });
  CKZ.g.gate=gt||"";
  XG.set(CKZ.g, gt?null:ckzView(all), el("ckzL"));
}
function ckzGrp(emp, grp){
  call("ck_staff_grp",{ emp:emp, grp:grp }).then(function(x){
    if(x&&x.ok){ var all=ckzRowsAll()||[]; all.forEach(function(r){ if(r.g==="S"&&normE(r.emp)===normE(emp)) r.grp=grp; }); ckzPaint(); toast("묶음 · "+grp); }
    else { toast("묶음을 바꾸지 못했습니다 · "+why(x),{ bad:1 }); reload(["ckz"]); } });
}
function ckzNoAsk(){
  var all=ckzRowsAll()||[], want=all.filter(function(r){ return r.g==="S"&&!r.no; }), mx=0, c={};
  all.forEach(function(r){ var m=String(r.no||"").match(/^S-(\d+)$/); if(m&&+m[1]>mx) mx=+m[1]; });
  want.forEach(function(r){ c[r.grp||"그 밖"]=(c[r.grp||"그 밖"]||0)+1; });
  confirmBox({ t:mx?"새 스태프에게 번호를 이어서 매길까요?":"스태프 번호를 매길까요?", who:"새로 매길 사람 "+n0(want.length)+"명 · S-"+(mx+1)+(want.length>1?" ~ S-"+(mx+want.length):""),
    sub:CKZ_GRP.map(function(g){ return g+" "+n0(c[g]||0); }).join(" · ")+" · 묶음 순 · 묶음 안 이름 가나다순 · 한 번 매긴 번호는 바뀌지 않음",
    body:'<label class="fld">확인 문구 · 「스태프번호매기기」를 입력합니다<input class="in" id="ckzW" autocomplete="off" oninput="gateUpd()"></label>', focus:"ckzW", ok:"번호 매기기",
    gate:function(){ return String((el("ckzW")||{}).value||"").trim()==="스태프번호매기기"; },
    run:function(){ return call("ck_staff_no",{ confirm:"스태프번호매기기" }); },
    done:function(r){ toast(r.add?"스태프 번호를 매겼습니다 · "+r.from+" ~ "+r.to:"새로 매길 사람이 없습니다"); reload(["ckz"]); } });
}
/* ── 참여상 · 선착순 1~200 ── */
function fxRows(){ var a=S.data.fx1, b=S.data.fx2; if(!a||!a.ok) return null; var cap=num(a.cap)||200; return (a.rows||[]).concat(b&&b.ok?b.rows||[]:[]).filter(function(r){ return num(r.rk)>=1&&num(r.rk)<=cap; }); }
function fxPaint(){
  var a=S.data.fx1, rows=fxRows(), gt=dataGate("fx1","참여상 명단");
  if(el("fxTop")) el("fxTop").innerHTML=errTop("fx1")+(rows?'<p class="cap">달성 순번 1~'+n0(num(a.cap)||200)+' · 받음 '+n0(rows.filter(function(r){ return !!r.got; }).length)+'명 · 지급 = 스태프 폰 「체크인존」 스캔(10:30~17:00)</p>':'');
  if(!CKZ.gf) CKZ.gf=XG.make({ id:"fxlist", file:"참여상 선착순", key:function(r){ return r.emp; }, sort:{ k:"rk", d:1 },
    chips:[["all","전체",null],["no","받기 전",function(r){ return !r.got&&r.st!=="취소"; }],["got","받음",function(r){ return !!r.got; }]],
    cols:[{ k:"rk", t:"순번", type:"num", w:60 },{ k:"emp", t:"사번", w:84 },{ k:"dept", t:"소속", w:150 },{ k:"name", t:"이름", w:90 },{ k:"at", t:"달성 시각", type:"date", w:100 },
      { k:"got", t:"지급", w:120, v:function(r){ return r.got?"받음 "+fmtD(r.gotAt):r.st==="취소"?"취소":"받기 전"; }, f:function(r){ return r.got?tag("받음","ok")+' <span class="cap">'+esc(fmtD(r.gotAt))+'</span>':r.st==="취소"?tag("취소","off"):'<span class="cap">받기 전</span>'; } }],
    src:{ a:"fcfs_list", p:{ page:1 } }, empty:"아직 6개를 모은 사람이 없습니다", h:560, onRow:function(k){ pcOpen(k, CKZ.gf); } });
  CKZ.gf.gate=gt||"";
  XG.set(CKZ.gf, gt?null:rows, el("fxL"));
}
