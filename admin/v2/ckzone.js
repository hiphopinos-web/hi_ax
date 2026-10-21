/* AXF CONTROL v2 · 명단 › 목록 › 스태프 · 「스태프 번호 · 묶음」 (261017 옛 처리함 › 체크인존 · 261021 처리함 걷음 · 사용자 「권장대로」)
 * 데이터 = ck_zone(사전 신청자 + 스태프 · 이 칸은 스태프 줄 g = S 만) · 체크인존 명단 · 참여상은 체크인 탭(ckin.js)
 * 스태프 번호 S-1 = ck_staff_no(확인 문구 「스태프번호매기기」 그대로 · 묶음 순 임원 → 주니어보드 → DS → 그 밖 · 이름 가나다순 · 한 번 매기면 고정) · 묶음 = ck_staff_grp(번호 전만 고름) */
var CKZ={ g:null };
var CKZ_GRP=["임원","주니어보드","DS","그 밖"];
function ckzRowsAll(){ var d=S.data.ckz; return d&&d.ok?(d.rows||[]):null; }
function ckzStaffRows(){ var a=ckzRowsAll(); return a?a.filter(function(r){ return r.g==="S"; }).map(function(r){ var o={}; for(var k in r) o[k]=r[k]; var m=String(r.no||"").match(/-(\d+)$/); o._o=(r.no?"0":"1")+("0000"+(m?m[1]:"9999")).slice(-4)+(r.name||""); return o; }):null; }
function ckzStaffHtml(){ return '<div class="card mt"><h2>스태프 번호 · 묶음 <span class="cap">체크인존 세션 번호 S-1 · 번호 전에 묶음을 고르고 매김 · 한 번 매긴 번호는 바뀌지 않음</span></h2><div id="ckzTop"></div><div id="ckzL"></div></div>'; }
function ckzStaffPaint(){
  var top=el("ckzTop"); if(!top) return;
  var rows=ckzStaffRows(), gt=dataGate("ckz","스태프 번호"), nNo=rows?rows.filter(function(r){ return !r.no; }).length:0;
  top.innerHTML=errTop("ckz")+(rows?'<div class="ckz-bar"><span class="cap">스태프 '+n0(rows.length)+'명 · 번호 있음 '+n0(rows.length-nNo)+'명</span><span class="sp"></span>'+
    '<button class="btn sm'+(nNo?" pri":"")+'" type="button" onclick="ckzNoAsk()"'+(nNo?'':' disabled')+'>'+(nNo?"스태프 번호 매기기 · "+n0(nNo)+"명":"스태프 번호 매길 사람 없음")+'</button></div>':'');
  if(!CKZ.g) CKZ.g=XG.make({ id:"ckzstaff", file:"스태프 번호", key:function(r){ return r.emp; }, sort:{ k:"_o", d:1 },
    cols:[{ k:"_o", t:"", hide:1 },
      { k:"no", t:"번호", w:70, v:function(r){ return r.no||""; }, f:function(r){ return r.no?'<b>'+esc(r.no)+'</b>':'<span class="cap">-</span>'; } },
      { k:"emp", t:"사번", w:84 },{ k:"dept", t:"소속", w:170 },{ k:"name", t:"이름", w:90 },
      { k:"grp", t:"묶음", w:132, v:function(r){ return r.grp||""; }, f:function(r){ return r.no?esc(r.grp||""):'<select class="in sm" aria-label="'+esc((r.name||r.emp)+" 묶음")+'" onclick="event.stopPropagation()" onchange="ckzGrp(\''+jq(r.emp)+'\',this.value)">'+CKZ_GRP.map(function(x){ return '<option'+(x===r.grp?" selected":"")+'>'+x+'</option>'; }).join("")+'</select>'; } }],
    src:{ a:"ck_zone", pick:function(res){ return (res.rows||[]).filter(function(r){ return r.g==="S"; }); } }, empty:"스태프 명단이 없습니다", h:420, onRow:function(k){ pcOpen(k, CKZ.g); } });
  CKZ.g.gate=gt||"";
  XG.set(CKZ.g, gt?null:rows, el("ckzL"));
}
function ckzGrp(emp, grp){
  call("ck_staff_grp",{ emp:emp, grp:grp }).then(function(x){
    if(x&&x.ok){ var all=ckzRowsAll()||[]; all.forEach(function(r){ if(r.g==="S"&&normE(r.emp)===normE(emp)) r.grp=grp; }); ckzStaffPaint(); toast("묶음 · "+grp); }
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
