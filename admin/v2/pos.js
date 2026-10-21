/* AXF CONTROL v2 · 명단 › 명단 올리기 › 「직위 올리기」 · 당첨 기록 직위 열 · 행운권 탭 이름 (261021 사용자 「권장대로」)
 * 직위 출처 = 임직원 명단 xlsx(부문 · 본부 · 소속부서 · 팀/지점 · 직위 · 사번 · 성명) · 이 브라우저에서 읽고(SheetJS · table.js xgLoadLib) 사번 · 직위 두 칸만 서버로 보낸다
 *   파일 · 이름 · 부서는 서버로 가지 않는다 · 읽은 통 문서는 바로 버린다
 * 서버 = rospos_state(읽기) · rospos_preview(미리 보기 · 몇 명 · 직위 종류 수) · rospos_apply(확인 문구 「직위올리기」 · sig · 통째 교체) · rospos_undo(마지막 적용 한 번 되돌리기) · 모두 슈퍼관리자(admTop_)
 * 당첨 기록(행운권 › 당첨 기록 · draw_stats who=1 pos) = 이름 다음 「직위」 열 · stage.js 안쪽은 그대로 두고 여기서 열을 끼운다 */
var POS={ st:null, busy:"", rows:null, file:"", pv:null, err:"" }, POS_WORD="직위올리기";
function posLoad(){ call("rospos_state",{}).then(function(r){ POS.st=r||{ ok:false }; posPaint(); }); }
function posCard(){ return '<div class="card mt" id="posC"></div>'; }
function posPaint(){
  var b=el("posC"); if(!b) return;
  var st=POS.st, pv=POS.pv;
  var h='<h2>직위 올리기 <span class="cap">임직원 명단 엑셀 · 사번 · 직위 두 칸만 서버로 · 럭키드로우 명단 · 명부 내려받기 · 한 사람 카드에 쓰임</span></h2>';
  if(!st) h+=skel();
  else if(!st.ok) h+=band(unknownSrv(st)?"info":"warn", unknownSrv(st)?"이 서버는 아직 직위를 모릅니다":"받지 못했습니다 · "+esc(why(st)));
  else h+='<p class="cap">지금 '+(st.n?n0(st.n)+"명 · 직위 "+n0(st.kinds)+"종 · 올린 시각 "+esc(fmtD(st.at)):"올린 직위 없음")+(st.back?' · 되돌리기 가능('+esc(fmtD(st.back.at))+' 적용 전 '+n0(st.back.n)+'명)':'')+'</p>';
  if(st&&st.ok){
    h+='<div class="mt" style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn pri"><input type="file" accept=".xlsx,.xls" style="display:none" onchange="posFile(this)">'+(POS.busy==="read"?"읽는 중":"엑셀 고르기")+'</label>'+
      (st.back?'<button class="btn" type="button" onclick="posUndoAsk()">마지막 적용 되돌리기</button>':'')+'</div>';
    if(POS.err) h+=band("warn",esc(POS.err));
    if(POS.rows&&!pv) h+='<p class="cap mt">'+esc(POS.file)+' · 읽은 줄 '+n0(POS.rows.length)+' · 미리 보는 중</p>';
    if(pv&&pv.ok){ var c=pv.c||{};
      h+='<div class="mt"><p><b>'+esc(POS.file)+'</b> · 넣을 사람 <b class="n">'+n0(pv.n)+'</b>명 · 직위 <b class="n">'+n0(pv.kinds)+'</b>종</p>'+
        '<p class="cap">명부 밖 '+n0(c.noros)+' · 겹친 사번 '+n0(c.dup)+' · 사번 아님 '+n0(c.bad)+' · 직위 빈칸 '+n0(c.nopos)+' · 지금 '+n0(pv.cur)+'명은 통째 바뀜</p>'+
        '<div class="fx-w mt4">'+(pv.top||[]).map(function(x){ return tag(x.pos+" "+n0(x.n),""); }).join(" ")+'</div>'+
        '<div class="mt" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" type="button" onclick="posApplyAsk()"'+(pv.n?'':' disabled')+'>적용</button><button class="btn" type="button" onclick="posReset()">취소</button></div></div>';
    } else if(pv) h+=band("warn","미리 보지 못했습니다 · "+esc(why(pv)));
  }
  b.innerHTML=h;
}
function posReset(){ POS.rows=null; POS.pv=null; POS.file=""; POS.err=""; posPaint(); }
/* 머리 줄(앞 10줄 안 「사번」 · 「직위」 칸)을 찾아 두 칸만 남긴다 */
function posPick(aoa){
  for(var i=0;i<Math.min(10,aoa.length);i++){
    var r=aoa[i]||[], ce=-1, cp=-1;
    r.forEach(function(v,j){ var t=String(v==null?"":v).replace(/\s/g,""); if(t==="사번"&&ce<0) ce=j; if(t==="직위"&&cp<0) cp=j; });
    if(ce>=0&&cp>=0) return aoa.slice(i+1).map(function(x){ return [String(x[ce]==null?"":x[ce]).replace(/\s/g,""), String(x[cp]==null?"":x[cp]).replace(/\s+/g," ").trim()]; }).filter(function(x){ return x[0]; });
  }
  return null;
}
function posFile(inp){
  var f=inp&&inp.files&&inp.files[0]; if(!f) return; inp.value="";
  POS.err=""; POS.pv=null; POS.rows=null; POS.file=f.name; POS.busy="read"; posPaint();
  var rd=new FileReader();
  rd.onload=function(){
    xgLoadLib().then(function(X){
      var wb=X.read(new Uint8Array(rd.result),{ type:"array", cellDates:false }), ws=wb.Sheets[wb.SheetNames[0]];
      var rows=posPick(X.utils.sheet_to_json(ws,{ header:1, raw:false, defval:"", blankrows:false }));
      wb=null; ws=null; POS.busy="";
      if(!rows){ POS.err="첫 시트에서 「사번」 · 「직위」 머리 칸을 찾지 못했습니다"; posPaint(); return; }
      if(!rows.length){ POS.err="읽은 줄이 없습니다"; posPaint(); return; }
      POS.rows=rows; posPaint();
      call("rospos_preview",{ rows:posTx() },60000).then(function(r){ POS.pv=r||{ ok:false }; posPaint(); });
    },function(){ POS.busy=""; POS.err="엑셀 도구를 불러오지 못했습니다"; posPaint(); });
  };
  rd.onerror=function(){ POS.busy=""; POS.err="파일을 읽지 못했습니다"; posPaint(); };
  rd.readAsArrayBuffer(f);
}
function posTx(){ return (POS.rows||[]).map(function(x){ return x[0]+"\t"+x[1]; }).join("\n"); }
function posApplyAsk(){
  var pv=POS.pv; if(!pv||!pv.ok) return;
  confirmBox({ t:"직위를 적용할까요?", who:n0(pv.n)+"명 · 직위 "+n0(pv.kinds)+"종", sub:"지금 직위 "+n0(pv.cur)+"명은 통째 바뀜 · 바로 전 내용은 「마지막 적용 되돌리기」로 한 번 되돌림",
    body:'<label class="fld">확인 문구 · 「'+POS_WORD+'」를 입력합니다<input class="in" id="posW" autocomplete="off" oninput="gateUpd()"></label>', focus:"posW", ok:"적용",
    gate:function(){ return String((el("posW")||{}).value||"").trim()===POS_WORD; },
    run:function(){ return call("rospos_apply",{ rows:posTx(), sig:pv.sig, confirm:POS_WORD },60000); },
    fail:function(r){ return r&&r.reason==="state"?"그 사이 직위가 바뀌었습니다 · 파일을 다시 고릅니다":""; },
    done:function(r){ posReset(); posLoad(); toast("직위를 적용했습니다 · "+n0(r.n)+"명 · "+n0(r.kinds)+"종",{ undo:function(){ posUndoGo(); } }); } });
}
function posUndoAsk(){
  var b=POS.st&&POS.st.back; if(!b) return;
  confirmBox({ t:"마지막 적용을 되돌릴까요?", who:"직위 "+n0(POS.st.n)+"명 → "+n0(b.n)+"명", sub:fmtD(b.at)+" 적용 바로 전 내용으로 · 한 번만", ok:"되돌리기", danger:1,
    run:function(){ return call("rospos_undo",{}); }, fail:function(r){ return r&&r.reason==="none"?"되돌릴 적용이 없습니다":""; },
    done:function(){ posLoad(); toast("되돌렸습니다 · 직위"); } });
}
function posUndoGo(){ call("rospos_undo",{}).then(function(r){ posLoad(); toast(r&&r.ok?"되돌렸습니다 · 직위":"되돌리지 못했습니다 · "+why(r),{ bad:!(r&&r.ok) }); }); }
/* 명단 올리기 고르기 화면 아래에 칸 하나(슈퍼관리자) */
(function(){ if(typeof ppUpPick!=="function") return; var f0=ppUpPick;
  ppUpPick=function(){ var r=f0.apply(this,arguments); var box=el("ppUp"); if(box&&isTop()&&!el("posC")){ box.insertAdjacentHTML("beforeend",posCard()); posPaint(); posLoad(); } return r; }; })();
/* 행운권 탭(옛 무대) · 화면 제목 · 당첨 기록 이름 다음 직위 열(stage.js 그대로) */
(function(){ var sc=window.SCREENS&&SCREENS.stage; if(!sc) return; sc.title="행운권"; var m0=sc.mount;
  sc.mount=function(vb){ var r=m0.apply(this,arguments); var g=MG.drawrec;
    if(g&&!g.o.cols.some(function(c){ return c.k==="pos"; })){ var i=-1; g.o.cols.forEach(function(c,j){ if(c.k==="name") i=j; }); g.o.cols.splice(i+1,0,{ k:"pos", t:"직위", w:80, v:function(r2){ return r2.pos||""; } }); var root=XG.root(g); if(root) root.remove(); }
    return r; }; })();
