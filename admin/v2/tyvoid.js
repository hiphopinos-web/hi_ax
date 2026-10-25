/* AXF CONTROL v2 · 1F 타자왕 기록 빼기(261026 · 사용자 · 기획담당자)
 * 경품 › 타자왕 순위 표 줄마다 [기록 빼기](슈퍼관리자만 · 다른 콘솔 담당자는 열이 없음) → 확인 창(사유 기본 「운영 판단」) → type_self_void POST → 표 새로 고침
 * 아래 작은 칸 = 기록 뺀 사람(type_result 응답 voided · 이름 · 소속 · 최고 점수 · 뺀 시각) · [되돌리기](슈퍼관리자만 · on 0)
 * 서버 = 기록 줄은 지우지 않음 · 순위 · 시상 · 셀프 최고에서만 빠짐 · 도전 횟수 · 계정 · 닉네임 · 스탬프 그대로 · 뺀 뒤 새 판은 순위에 들어감 */
function tyvRow(emp){ var d=S.data.tres; return ((d&&d.top)||[]).filter(function(r){ return normE(r.emp)===normE(emp); })[0]||null; }
function tyvWho(r){ return (r.name||r.nick||"-")+(r.nick&&r.name?" · "+r.nick:""); }
function tyvAsk(emp){
  if(!isTop()){ toast("슈퍼관리자가 합니다",{ bad:1 }); return; }
  var r=tyvRow(emp); if(!r) return;
  confirmBox({ t:"현장 타자왕 기록을 뺄까요?", who:tyvWho(r)+" · "+r.rank+"위 · "+n0(r.score)+"점", sub:(r.name||"-")+" 님 현장 타자왕 기록을 순위에서 뺍니다 · 도전 횟수 · 계정은 그대로",
    body:'<label class="fld">사유<input class="in" id="tyvWhy" maxlength="80" autocomplete="off" value="운영 판단"></label>', focus:"tyvWhy", ok:"기록 빼기", danger:true,
    run:function(){ return call("type_self_void",{ emp:String(r.emp), why:String((el("tyvWhy")||{}).value||"").trim()||"운영 판단" }); },
    fail:function(x){ return "빼지 못했습니다 · "+why(x); },
    done:function(x){ toast((r.name||"-")+" 님 기록을 순위에서 뺐습니다 · "+n0(x.n)+"줄"); reload(["tres"]); } });
}
function tyvBackAsk(emp){
  if(!isTop()){ toast("슈퍼관리자가 합니다",{ bad:1 }); return; }
  var d=S.data.tres, v=((d&&d.voided)||[]).filter(function(x){ return normE(x.emp)===normE(emp); })[0]; if(!v) return;
  confirmBox({ t:"뺀 기록을 되돌릴까요?", who:(v.name||"-")+(v.dept?" · "+v.dept:"")+" · 최고 "+n0(v.best)+"점", sub:"뺀 기록 "+n0(v.n)+"줄이 다시 순위에 들어갑니다", ok:"되돌리기",
    run:function(){ return call("type_self_void",{ emp:String(v.emp), on:"0" }); },
    fail:function(x){ return "되돌리지 못했습니다 · "+why(x); },
    done:function(x){ toast((v.name||"-")+" 님 기록을 되돌렸습니다"+(x.rank?" · 지금 "+x.rank+"위":"")); reload(["tres"]); } });
}
function tyvPaint(){
  var b=el("tyvBox"); if(!b) return;
  var d=S.data.tres; if(!d||!d.ok){ b.innerHTML=""; return; }
  var L=d.voided||[];
  if(!L.length){ b.innerHTML='<p class="cap">기록 뺀 사람 없음</p>'; return; }
  b.innerHTML='<table class="tb"><tbody>'+L.map(function(v){ return '<tr><td><b>'+esc(v.name||"-")+'</b></td><td class="cap">'+esc(v.dept||"")+'</td><td class="n">최고 '+n0(v.best)+'점</td><td class="cap">'+n0(v.n)+'줄 · '+esc(fmtD(v.at))+(v.why?" · "+esc(v.why):"")+'</td>'+
    '<td class="n">'+(isTop()?'<button class="btn sm" type="button" onclick="tyvBackAsk(\''+jq(v.emp)+'\')">되돌리기</button>':'')+'</td></tr>'; }).join("")+'</tbody></table>';
}
(function(){ var sc=SCREENS.prize; if(!sc||sc.tyv) return; sc.tyv=1; var m0=sc.mount, p0=sc.paint;
  sc.mount=function(vb){
    var r=m0.apply(this,arguments);
    if(awSub()!=="type"||S.ui.tpup) return r;
    var g=MG.tyres;
    if(g&&!g.o.cols.some(function(c){ return c.tyv; })) g.o.cols.push({ tyv:1, t:"", w:96, get hide(){ return !isTop(); },
      act:function(x){ return isTop()?'<button class="btn sm dng" type="button" onclick="event.stopPropagation();tyvAsk(\''+jq(x.emp)+'\')">기록 빼기</button>':""; } });
    var t=el("tyWin"), card=t&&t.parentNode;
    if(card) card.insertAdjacentHTML("afterend",'<div class="card mt" id="tyvCard"><h2>기록 뺀 사람 <span class="cap">순위 · 시상에서 빠짐 · 도전 횟수 · 계정 그대로 · 뺀 뒤 새 판은 순위</span>'+(isTop()?'':'<span class="r cap">빼기 · 되돌리기 = 슈퍼관리자</span>')+'</h2><div id="tyvBox"></div></div>');
    return r;
  };
  sc.paint=function(){ var r=p0.apply(this,arguments); if(awSub()==="type"&&!S.ui.tpup) tyvPaint(); return r; };
})();
