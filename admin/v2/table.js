/* AXF CONTROL v2 · 명단 표(공통 부품 · 사용자 261016 「모든 명단을 엑셀처럼 일관된 하나의 표 모양」)
 * 모든 명단(옷 · 출석 · 사전 신청 · 스태프 · 라운지 · 커피챗 · 접속 · 아이디어 · 경품 수령 …)이 이 부품 하나를 쓴다.
 * 규칙: 머리 행 고정 · 머리 누르면 오름 → 내림 · 검색 칸 · 구분 칩(건수 붙음) · 건수 · 「엑셀 다운로드」(같은 자리 · 오른쪽 끝)
 *       숫자 오른쪽 정렬 · tabular-nums · 날짜 「MM-DD HH:mm」(오늘이면 「HH:mm」) · 열 너비는 열 정의 w(px)
 * 내려받기 = 확인 창(261016 PIN 없음) → 서버 원본 액션을 dl=1 로 다시 받아 → 화면에 보이는 열 · 구분 · 검색 · 정렬 그대로 .xlsx
 *       ExcelJS 4.4.0(cdnjs 고정 버전 · 서식)을 그때 불러온다 · 못 불러오면 SheetJS 0.18.5 서식 없는 xlsx · 그것도 못 하면 UTF-8 BOM CSV
 * 줄 누르기 = o.onRow(key) · 고른 줄 g.sel 강조 · 키보드 Enter
 * 추가 시트 = o.sheets(지금 보이는 줄) → [{ name, aoa, wch }] · 첫 시트(명단) 뒤에 붙인다 · CSV 대신 받기면 첫 시트만
 * 261016 저녁 선택 · 추가 · 선택 삭제(사용자 확정 「사람을 관리하는 명단 전부 같은 모양」 · 3_서버 계약 3-6)
 *   o.select = 맨 왼쪽 선택 칸(머리 칸 = 보이는 줄 전체) · o.onAdd() = 표 위 오른쪽 「추가」(엑셀 다운로드 옆)
 *   o.cancel = { kind | kind() · keys(rows) 서버 열쇠(기본 사번) · what 명단 이름 · sub 영향 한 줄 · opts() 확인 창 추가 html · part() · after(res) 다시 읽기 }
 *   「선택 n명 삭제」 = 확인 창 → list_rows_cancel(취소 처리 · 기록 남음) → 못 한 줄은 이유 표 · 토스트 「되돌리기」 = roll_undo(batch)
 * 열 정의 c = { k 키 · t 머리 글자 · w 너비 · type(num | date | text) · v(row) 값 · f(row) 화면 html · x(row) 엑셀 값 · act(row) 단추 html(엑셀 제외) · sort:false } */
var XLSX_URL="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", EXJS_URL="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
var XG={ reg:{}, MAXROWS:500, CXMAX:200 };
XG.make=function(o){
  var g={ o:o, id:o.id, rows:null, err:null, q:"", chip:(o.chips&&o.chips[0]&&o.chips[0][0])||"", sort:o.sort?{ k:o.sort.k, d:o.sort.d||1 }:null, sel:null, pick:{}, busy:0 };
  var keep=lsGet("axf_v2_xg_"+o.id,null); if(keep){ if(keep.sort) g.sort=keep.sort; if(keep.chip&&(o.chips||[]).some(function(c){ return c[0]===keep.chip; })) g.chip=keep.chip; }
  XG.reg[o.id]=g; return g;
};
function xgCols(g){ return g.o.cols.filter(function(c){ return !c.hide; }); }
function xgVal(c, r){ return c.v?c.v(r):r[c.k]; }
function xgText(c, r){ var v=xgVal(c,r); if(v==null) return ""; if(c.type==="date") return fmtD(v); if(c.type==="num") return v===""?"":n0(v); return String(v); }
function xgX(c, r){ if(c.x) return c.x(r); var v=xgVal(c,r); if(v==null) return ""; if(c.type==="num"){ var n=Number(v); return v===""||!isFinite(n)?"":n; } if(c.type==="date"){ var m=String(v).match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/); return m?m[1]+" "+m[2]:String(v); } return String(v); }
/* 지금 보이는 줄 = 구분 → 검색 → 정렬 */
function xgView(g, rows){
  rows=rows||g.rows||[];
  var ch=(g.o.chips||[]).filter(function(c){ return c[0]===g.chip; })[0], f=ch&&ch[2];
  var out=f?rows.filter(f):rows.slice();
  var q=g.q.replace(/\s+/g,"").toUpperCase();
  if(q){ var cs=xgCols(g).filter(function(c){ return !c.act; }); out=out.filter(function(r){ return cs.map(function(c){ return xgText(c,r); }).concat((g.o.find||[]).map(function(k){ return r[k]==null?"":r[k]; })).join("|").replace(/\s+/g,"").toUpperCase().indexOf(q)>=0; }); }
  if(g.sort){ var c=g.o.cols.filter(function(x){ return x.k===g.sort.k; })[0];
    if(c){ var d=g.sort.d, isN=c.type==="num";
      out=out.map(function(r,i){ return [r,i]; }).sort(function(a,b){ var x=xgVal(c,a[0]), y=xgVal(c,b[0]), ex=x==null||x==="", ey=y==null||y==="";
        if(ex!==ey) return ex?1:-1; if(ex&&ey) return a[1]-b[1];
        var r=isN?(Number(x)-Number(y)):String(x).localeCompare(String(y),"ko",{ numeric:true }); return r?r*d:a[1]-b[1]; }).map(function(p){ return p[0]; }); } }
  return out;
}
function xgSave(g){ lsSet("axf_v2_xg_"+g.id,{ sort:g.sort, chip:g.chip }); }
/* 자리(ph)에 표 틀을 한 번 만들고 · 그 뒤로는 칩 숫자 · 건수 · 본문만 바꾼다(검색 칸 입력이 끊기지 않게) */
XG.put=function(g, ph){
  if(!ph) return;
  if(!ph.querySelector('[data-xg="'+g.id+'"]')){
    var o=g.o, cols=xgCols(g);
    ph.innerHTML='<div class="xg" data-xg="'+g.id+'">'+
      '<div class="xg-bar"><input class="xg-q" type="search" placeholder="'+esc(o.ph||"이름 · 부서 · 사번 찾기")+'" aria-label="'+esc((o.file||"명단")+" 검색")+'" value="'+esc(g.q)+'" oninput="XG.find(\''+g.id+'\',this.value)"><span class="xg-cnt" data-c="cnt"></span><span class="xg-acts" data-c="acts"></span></div>'+
      '<div class="xg-chips" role="group" aria-label="구분" data-c="chips"></div>'+
      '<div class="xg-wrap" style="--xg-h:'+(o.h||460)+'px"><table class="xg-t"><colgroup>'+(o.select?'<col style="width:44px">':'')+cols.map(function(c){ return '<col'+(c.w?' style="width:'+c.w+'px"':'')+'>'; }).join("")+'</colgroup><thead><tr data-c="head"></tr></thead><tbody data-c="body"></tbody></table></div><div data-c="note"></div></div>';
  }
  XG.paint(g);
};
XG.set=function(g, rows, ph){ g.rows=rows; if(ph) XG.put(g, ph); else XG.paint(g); };
XG.root=function(g){ return document.querySelector('[data-xg="'+g.id+'"]'); };
XG.paint=function(g){
  var root=XG.root(g); if(!root) return;
  var o=g.o, cols=xgCols(g), q=function(n){ return root.querySelector('[data-c="'+n+'"]'); };
  q("head").innerHTML=(o.select?'<th class="ck" scope="col"><label class="xg-ckl"><input type="checkbox" data-c="all" aria-label="보이는 줄 모두 선택" onchange="XG.pickAll(\''+g.id+'\',this.checked)"></label></th>':'')+cols.map(function(c){ var n=c.type==="num"?" n":"", on=g.sort&&g.sort.k===c.k;
    if(c.act||c.sort===false||!c.k) return '<th class="na'+n+'" scope="col">'+esc(c.t||"")+'</th>';
    return '<th class="'+n.trim()+'" scope="col"'+(on?' aria-sort="'+(g.sort.d>0?"ascending":"descending")+'"':'')+'><button type="button" onclick="XG.sortBy(\''+g.id+'\',\''+c.k+'\')">'+esc(c.t)+'<span class="ar" aria-hidden="true">'+(on?(g.sort.d>0?"▲":"▼"):"")+'</span></button></th>'; }).join("");
  var chips=q("chips"), all=g.rows||[];
  if(chips){ chips.hidden=!(o.chips&&o.chips.length>1); if(chips.hidden) chips.innerHTML=""; }
  if(chips&&!chips.hidden) chips.innerHTML=o.chips.map(function(c){ var n=c[2]?all.filter(c[2]).length:all.length;
    return '<button type="button" class="chip'+(g.chip===c[0]?" on":"")+'" aria-pressed="'+(g.chip===c[0])+'" onclick="XG.chipBy(\''+g.id+'\',\''+c[0]+'\')">'+esc(c[1])+' <span class="c">'+(g.rows?n0(n):"-")+'</span></button>'; }).join("");
  var body=q("body"), note=q("note"), cnt=q("cnt");
  if(g.rows==null){ body.innerHTML=""; cnt.innerHTML=""; note.innerHTML='<div class="xg-note">'+(g.gate||skel())+'</div>'; g.pick={}; xgActs(g); return; }
  var v=xgView(g), shown=v.slice(0,XG.MAXROWS);
  if(o.select){ var vk={}; shown.forEach(function(r){ vk[xgKey(g,r)]=1; }); Object.keys(g.pick).forEach(function(k){ if(!vk[k]) delete g.pick[k]; }); }   /* 선택 = 보이는 줄 안에서만(구분 · 검색을 바꾸면 안 보이는 줄은 풀림) */
  cnt.innerHTML='<b>'+n0(v.length)+'</b>건'+(v.length!==all.length?' / 전체 '+n0(all.length):'');
  body.innerHTML=shown.length?shown.map(function(r){ var k=o.key?o.key(r):"", on=g.sel!=null&&k===g.sel, pk=o.select&&g.pick[xgKey(g,r)];
    return '<tr'+(on||pk?' class="'+(on?"sel":"")+(pk?" pk":"")+'"':'')+(o.select?' data-xk="'+esc(xgKey(g,r))+'"':'')+(o.onRow?' data-k="'+esc(k)+'" tabindex="0" onclick="XG.rowBy(this,event)" onkeydown="XG.rowKey(this,event)"':'')+'>'+(o.select?'<td class="ck"><label class="xg-ckl"><input type="checkbox"'+(pk?" checked":"")+' aria-label="'+esc(xgWho(r)+" 선택")+'" onchange="XG.pickEl(this)"></label></td>':'')+cols.map(function(c){ var cls=c.act?"a":c.type==="num"?"n":c.type==="date"?"d":"";
      var h=c.act?c.act(r):c.f?c.f(r):esc(xgText(c,r)); return '<td class="'+cls+'" title="'+esc(c.act?"":xgText(c,r))+'">'+h+'</td>'; }).join("")+'</tr>'; }).join("")
    :"";
  xgActs(g);
  note.innerHTML=(shown.length?"":emptyH(g.q?"찾는 줄이 없습니다":(o.empty||"아직 줄이 없습니다")))+(g.gate?'<div class="xg-note">'+g.gate+'</div>':"")+(v.length>shown.length?'<div class="cap" style="padding:6px 2px">앞 '+n0(XG.MAXROWS)+'줄만 보입니다 · 검색으로 좁힙니다 · 엑셀은 전체 '+n0(v.length)+'줄</div>':'');
};
/* 줄 누르기(o.onRow(key)) · 줄 안 단추를 누른 것은 빼다 */
XG.rowBy=function(tr, ev){ var x=tr.closest("[data-xg]"), g=x&&XG.reg[x.getAttribute("data-xg")]; if(!g||!g.o.onRow) return; if(ev&&ev.target&&ev.target.closest&&ev.target.closest("button,a,input,label")) return; g.sel=tr.getAttribute("data-k"); XG.paint(g); g.o.onRow(g.sel); };
XG.rowKey=function(tr, ev){ if(ev.target!==tr) return; if(ev.key==="Enter"||ev.key===" "){ ev.preventDefault(); XG.rowBy(tr, ev); } };
XG.find=function(id, v){ var g=XG.reg[id]; g.q=String(v||""); XG.paint(g); };
XG.sortBy=function(id, k){ var g=XG.reg[id]; if(g.sort&&g.sort.k===k) g.sort.d=-g.sort.d; else g.sort={ k:k, d:1 }; xgSave(g); XG.paint(g); };
XG.chipBy=function(id, c){ var g=XG.reg[id]; g.chip=c; xgSave(g); XG.paint(g); if(g.o.onChip) g.o.onChip(c); };

/* ── 261016 저녁 선택 · 추가 · 선택 삭제 ── */
function xgKey(g, r){ return String(g.o.key?g.o.key(r):r.emp); }
function xgWho(r){ return String((r.name||"")+(r.emp?(r.name?" ":"")+r.emp:"")).trim()||"줄"; }
function xgPicked(g){ return (g.rows||[]).filter(function(r){ return g.pick[xgKey(g,r)]; }); }
/* 오른쪽 단추 칸 · 선택 n명 삭제(고른 줄이 있을 때) · 추가 · 엑셀 다운로드 · 머리 칸 체크 상태 */
function xgActs(g){
  var root=XG.root(g); if(!root) return; var o=g.o, a=root.querySelector('[data-c="acts"]'), n=o.select?xgPicked(g).length:0, id=g.id;
  if(a) a.innerHTML=(n||g.busy?'<button class="btn sm dng" type="button" onclick="XG.cxAsk(\''+id+'\')"'+(g.busy?' disabled aria-disabled="true"':'')+'>'+(g.busy?"처리 중":"선택 "+n0(n)+(o.unit||"명")+" 삭제")+'</button>':'')+
    (o.onAdd?'<button class="btn sm" type="button" onclick="XG.addBy(\''+id+'\')"'+(g.busy?' disabled':'')+'>추가</button>':'')+
    (o.noDl?'':'<button class="btn sm xg-dl" type="button" onclick="XG.dl(\''+id+'\')">엑셀 다운로드</button>');
  var all=root.querySelector('[data-c="all"]');
  if(all){ var trs=root.querySelectorAll('tbody tr[data-xk]'), on=0; for(var i=0;i<trs.length;i++) if(g.pick[trs[i].getAttribute("data-xk")]) on++;
    all.checked=!!trs.length&&on===trs.length; all.indeterminate=on>0&&on<trs.length; all.disabled=!trs.length||!!g.busy; }
}
XG.pickEl=function(cb){ var tr=cb.closest("tr"), x=cb.closest("[data-xg]"), g=x&&XG.reg[x.getAttribute("data-xg")]; if(!g||!tr) return; var k=tr.getAttribute("data-xk");
  if(cb.checked) g.pick[k]=1; else delete g.pick[k]; tr.classList.toggle("pk",cb.checked); xgActs(g); };
XG.pickAll=function(id, on){ var g=XG.reg[id], root=XG.root(g); if(!root) return; var trs=root.querySelectorAll('tbody tr[data-xk]');
  for(var i=0;i<trs.length;i++){ var k=trs[i].getAttribute("data-xk"), cb=trs[i].querySelector('td.ck input'); if(on) g.pick[k]=1; else delete g.pick[k]; trs[i].classList.toggle("pk",on); if(cb) cb.checked=on; }
  xgActs(g); };
XG.addBy=function(id){ var g=XG.reg[id]; if(g&&g.o.onAdd&&!g.busy) g.o.onAdd(g); };
/* 줄 거절 이유(3_서버 계약 3-6 · 줄마다 why) */
var XG_CXWHY={ param:"사번 형식이 맞지 않습니다", notfound:"명단에 없습니다", err:"서버 오류로 처리하지 못했습니다", same:"이미 취소된 줄입니다", state:"그 사이 상태가 바뀌었습니다",
  done:"체크인 · 완료한 상담이 있어 뺄 수 없습니다", sup:"슈퍼관리자(맨 앞 사번)는 뺄 수 없습니다", self:"지금 이 콘솔을 쓰는 본인은 뺄 수 없습니다", fixed:"고정 시험 사번은 풀 수 없습니다",
  none:"아직 사이즈를 고르지 않았습니다", hum:"가습기 대상이라 옷 사이즈가 없습니다", got:"이미 옷을 받았습니다", have:"그 사이 다시 들어왔습니다", taken:"그 자리가 찼습니다", dup:"진행 중인 다른 줄이 있습니다", sold:"그 사이즈가 남지 않았습니다" };
function xgCxWhy(x){ return (XG_CXWHY[x.why]||x.why||"처리하지 못했습니다")+(x.cur?" · 지금 "+x.cur:""); }
XG.cxAsk=function(id){
  var g=XG.reg[id], o=g.o, c=o.cancel; if(!c||g.busy) return; var rows=xgPicked(g), n=rows.length; if(!n) return;
  if(n>XG.CXMAX){ toast("한 번에 "+XG.CXMAX+"명까지 삭제합니다 · 지금 "+n0(n)+"명 선택",{ bad:1, ms:4000 }); return; }
  var nm=rows.slice(0,3).map(xgWho).join(", ")+(n>3?" 외 "+n0(n-3)+"명":"");
  confirmBox({ t:"선택한 "+n0(n)+(o.unit||"명")+"을 삭제할까요?", who:(c.what||o.file||"명단")+" · "+nm, sub:c.sub||"", ok:"선택 삭제", danger:true, gate:c.gate,
    body:(c.opts?c.opts(rows):"")+'<p class="cap mt4">취소로 남고 활동 기록에서 되돌릴 수 있음</p>',
    run:function(){
      var kind=typeof c.kind==="function"?c.kind(rows):c.kind, keys=c.keys?c.keys(rows,kind):rows.map(function(r){ return r.emp; }), p={ kind:kind, keys:keys.join(","), rid:"x"+Date.now().toString(36)+Math.random().toString(36).slice(2,6) };
      if(c.part){ var pt=c.part(); if(pt) p.part=pt; }
      g.busy=1; xgActs(g);
      return call("list_rows_cancel",p).then(function(r){ g.busy=0; xgActs(g); if(r&&r.ok) r._rows=rows; return r; });
    },
    fail:function(r){ return r&&r.reason==="rows"?"한 번에 "+(r.max||XG.CXMAX)+"명까지입니다":""; },
    done:function(r){ g.pick={}; xgCxDone(g, r); } });
};
function xgCxDone(g, r){
  var c=g.o.cancel, bad=(r.rows||[]).filter(function(x){ return !x.ok; }), dn=num(r.done), u=g.o.unit||"명";
  var byK={}; (r._rows||[]).forEach(function(x){ byK[x.emp]=x; byK[xgKey(g,x)]=x; if(x.id!=null) byK[x.id]=x; });
  if(c.after) c.after(r); else XG.paint(g);
  toast(dn?"삭제했습니다 · "+n0(dn)+u+(bad.length?" · 못 함 "+n0(bad.length):""):"삭제하지 못했습니다", dn&&r.batch?{ undo:function(){ XG.undo(g.id, r.batch); } }:{ bad:!dn });
  if(!bad.length) return;
  setTimeout(function(){ confirmBox({ t:n0(dn)+u+" 삭제 · "+n0(bad.length)+u+" 못 함", who:c.what||g.o.file||"명단", sub:"못 한 줄은 그대로 남았습니다", ok:"확인",
    body:'<div class="xg-wrap" style="--xg-h:280px"><table class="tb xg-fail"><thead><tr><th scope="col">이름</th><th scope="col">사번</th><th scope="col">이유</th></tr></thead><tbody>'+
      bad.map(function(x){ var w=byK[x.k]||byK[x.emp]||{}; return '<tr><td>'+esc(w.name||"-")+'</td><td>'+esc(x.emp||w.emp||x.k)+'</td><td>'+esc(xgCxWhy(x))+'</td></tr>'; }).join("")+'</tbody></table></div>',
    run:function(){ return Promise.resolve({ ok:true }); } }); },220);   /* 앞 확인 창이 닫히는 시간(dlgClose 180ms) 뒤에 연다 */
}
XG.undo=function(id, batch){
  var g=XG.reg[id], c=g&&g.o.cancel;
  call("roll_undo",{ batch:batch }).then(function(x){ var d=x&&x.ok?(Array.isArray(x.done)?x.done.length:num(x.done)):0, sk=(x&&x.skip||[]).length+(x&&x.fail||[]).length;
    if(c&&c.after) c.after(x);
    toast(x&&x.ok?"되돌렸습니다 · "+n0(d)+(g.o.unit||"명")+(sk?" · 건너뜀 "+sk:""):"되돌리지 못했습니다 · "+(x&&x.reason==="expired"?"다른 날 처리한 묶음입니다":x&&x.reason==="done"?"이미 되돌렸습니다":why(x)),{ bad:!(x&&x.ok) }); });
};

/* ── 엑셀 다운로드 · 확인 창 · 서버 dl=1 ── */
XG.dl=function(id){
  var g=XG.reg[id], o=g.o; if(!g.rows){ toast("명단을 받은 뒤 내려받습니다"); return; }
  var cols=xgCols(g).filter(function(c){ return !c.act&&c.t; }), v=xgView(g), ch=(o.chips||[]).filter(function(c){ return c[0]===g.chip; })[0];
  confirmBox({ t:"명단을 엑셀로 내려받을까요?", who:(o.file||"명단")+" · "+n0(v.length)+"줄", sub:"열 "+cols.length+"개 · 구분 「"+(ch?ch[1]:"전체")+"」"+(g.q?" · 검색 「"+g.q+"」":"")+(o.sheets?" · 시트 "+(1+o.sheets([]).length)+"개":"")+" · 화면 그대로 · 개인정보 파일", ok:"엑셀 다운로드",
    run:function(){
      var src=xgSrc(g);
      if(!src) return xgFile(g, g.rows);
      var p={}; for(var k in (src.p||{})) p[k]=src.p[k]; p.dl="1";
      return call(src.a, p).then(function(res){ if(!res||res.ok===false) return res||{ ok:false }; var rows=src.a==="list_get"?res.rows:src.pick?src.pick(res):res.rows; return xgFile(g, rows||g.rows); });
    },
    done:function(r){ toast("내려받았습니다 · "+r.name+(r.csv?" · 엑셀 도구를 못 불러와 CSV":"")); } });
};
/* 서버 list_get(3_서버 계약 3-3) · 되면 그 열 · 줄 · 내려받기를 쓰고, 모르는 서버면 옛 액션으로 */
function xgSrc(g){ return g.o.lg&&S.lg!==false?{ a:"list_get", p:{ kind:g.o.lg } }:g.o.src; }
XG.useCols=function(g, sc){
  if(!sc||!sc.length) return; var sig=sc.map(function(c){ return c.k; }).join(","); if(g._cs===sig) return; g._cs=sig;
  var mine={}; g.o.cols.forEach(function(c){ if(c.k) mine[c.k]=c; });
  var acts=g.o.cols.filter(function(c){ return c.act; });
  g.o.cols=sc.map(function(c){ var m=mine[c.k]||{}, t=c.type==="num"||c.type==="int"?"num":/date|time/.test(c.type||"")?"date":"text";
    return { k:c.k, t:c.n||m.t||c.k, w:c.w||m.w||100, type:m.type&&m.type!=="text"?m.type:t, v:m.v, f:m.f, x:m.x }; }).concat(acts);
  var root=XG.root(g); if(root) root.remove();
};
/* 바깥 도구 불러오기(cdnjs 고정 버전 · 누를 때 한 번) · 실패하면 다음에 다시 시도 */
function xgLoadJs(url, name){
  if(window[name]) return Promise.resolve(window[name]);
  XG._js=XG._js||{}; if(XG._js[url]) return XG._js[url];
  var pr=XG._js[url]=new Promise(function(ok, no){ var s=document.createElement("script"), t=setTimeout(function(){ no(new Error("timeout")); },15000);
    s.src=url; s.crossOrigin="anonymous"; s.referrerPolicy="no-referrer"; s.onload=function(){ clearTimeout(t); window[name]?ok(window[name]):no(new Error("nolib")); }; s.onerror=function(){ clearTimeout(t); no(new Error("load")); }; document.head.appendChild(s); });
  pr.catch(function(){ XG._js[url]=null; });
  return pr;
}
function xgLoadLib(){ return window.XLSX&&window.XLSX.utils?Promise.resolve(window.XLSX):xgLoadJs(XLSX_URL,"XLSX"); }
function xgLoadEx(){ return xgLoadJs(EXJS_URL,"ExcelJS"); }
function xgStamp(){ var d=srvNow(), p=function(n){ return ("0"+n).slice(-2); }; return String(d.getFullYear()).slice(2)+p(d.getMonth()+1)+p(d.getDate())+"_"+p(d.getHours())+p(d.getMinutes()); }
/* 추가 시트(o.sheets) · 실패해도 첫 시트는 받는다 */
function xgMore(g, v){ if(!g.o.sheets) return []; try{ return (g.o.sheets(v)||[]).filter(function(sh){ return sh&&sh.aoa&&sh.aoa.length; }); }catch(e){ return []; } }
/* ── 서식 있는 엑셀(ExcelJS · 261016 사용자 「테두리와 디자인」) ──
 * 1행 제목(명단 · 받은 시각 · n명) · 2행 머리(네이비 채움 · 흰 굵은 글씨 · 가운데) · 틀 고정 · 자동 필터
 * 칸마다 얇은 회색 테두리 · 짝수 줄 옅은 따뜻한 회색 · 세로 가운데 · 맑은 고딕 10 · 열 너비 = 내용 길이(6~50)
 * 사번 = 글자 칸(@ · 앞 0) · 날짜 가운데 · 숫자 오른쪽 · 상태 값(미선택 · 취소 · 노쇼 …)만 오렌지 글자
 * 추가 시트 = 같은 모양 · 맨 아래 「합계」 줄 굵게 + 옅은 채움 · 인쇄 = 가로 · 한 페이지 너비 · 머리 행 반복 */
var XS={ navy:"FF00205B", line:"FFD5D8DE", zebra:"FFF7F6F4", tot:"FFEEF0F7", acc:"FFE65800", tx:"FF1F2329", font:"맑은 고딕" };
var XS_ACC=["미선택","취소","노쇼","미출석","불참","옷 명단 밖"];
function xsW(v){ var s=String(v==null?"":v), n=0; for(var i=0;i<s.length;i++) n+=s.charCodeAt(i)>0x2e80?2:1; return n; }
function xsName(t, used){ var n=String(t||"시트").replace(/[\\\/?*\[\]:]/g," ").trim().slice(0,31)||"시트", k=n, i=2; while(used[k]) k=n.slice(0,28)+" "+(i++); used[k]=1; return k; }
/* kinds[i] = emp | date | num | text */
function xsSheet(wb, name, title, head, rows, kinds, total){
  var bd={ style:"thin", color:{ argb:XS.line } }, box={ top:bd, left:bd, bottom:bd, right:bd }, F=function(o){ var f={ name:XS.font, size:10, color:{ argb:XS.tx } }; for(var k in o||{}) f[k]=o[k]; return f; };
  var nc=Math.max(1,head.length), last=rows.length+2;
  var ws=wb.addWorksheet(name,{ views:[{ state:"frozen", xSplit:0, ySplit:2, topLeftCell:"A3", activeCell:"A3", showGridLines:false }],
    pageSetup:{ paperSize:9, orientation:"landscape", fitToPage:true, fitToWidth:1, fitToHeight:0, horizontalCentered:true, printTitlesRow:"2:2", margins:{ left:0.4, right:0.4, top:0.5, bottom:0.5, header:0.3, footer:0.3 } } });
  var t=ws.getCell(1,1); t.value=title; t.font=F({ size:13, bold:true, color:{ argb:XS.navy } }); t.alignment={ vertical:"middle" }; ws.getRow(1).height=26;
  var hr=ws.getRow(2); hr.height=22;
  head.forEach(function(h,i){ var c=hr.getCell(i+1); c.value=String(h==null?"":h); c.font=F({ bold:true, color:{ argb:"FFFFFFFF" } }); c.fill={ type:"pattern", pattern:"solid", fgColor:{ argb:XS.navy } }; c.alignment={ horizontal:"center", vertical:"middle", wrapText:true }; c.border=box; });
  rows.forEach(function(r,ri){ var row=ws.getRow(ri+3), tot=total&&ri===rows.length-1, zb=!tot&&ri%2===1; row.height=18;
    for(var i=0;i<nc;i++){ var c=row.getCell(i+1), x=r[i], k=kinds[i];
      if(k==="emp"){ c.value=x==null?"":String(x); c.numFmt="@"; }
      else if(k==="num"&&typeof x==="number"){ c.value=x; c.numFmt="#,##0"; }
      else c.value=x==null?"":(typeof x==="number"?x:String(x));
      var acc=typeof x==="string"&&XS_ACC.indexOf(x.trim())>=0;
      c.font=F(tot?{ bold:true }:acc?{ bold:true, color:{ argb:XS.acc } }:null);
      c.alignment={ vertical:"middle", horizontal:k==="num"?"right":k==="emp"||k==="date"?"center":"left" };
      c.border=box;
      if(tot) c.fill={ type:"pattern", pattern:"solid", fgColor:{ argb:XS.tot } }; else if(zb) c.fill={ type:"pattern", pattern:"solid", fgColor:{ argb:XS.zebra } }; } });
  /* 열 너비 = 머리 · 값 중 가장 긴 것(6~50) */
  for(var i=0;i<nc;i++){ var w=xsW(head[i])+3; rows.forEach(function(r){ var x=r[i]; w=Math.max(w, xsW(typeof x==="number"?x.toLocaleString("en-US"):x)+2); }); ws.getColumn(i+1).width=Math.max(6,Math.min(50,w)); }
  ws.autoFilter={ from:{ row:2, column:1 }, to:{ row:Math.max(2,total?last-1:last), column:nc } };
  return ws;
}
function xsKinds(head, rows, cols){
  return head.map(function(h,i){ var c=cols&&cols[i];
    if(c){ if(c.k==="emp"||/사번/.test(c.t)) return "emp"; if(c.type==="date") return "date"; if(c.type==="num") return "num"; return "text"; }
    if(/사번/.test(h)) return "emp";
    var any=0, all=rows.every(function(r){ var x=r[i]; if(x==null||x==="") return true; any=1; return typeof x==="number"; }); return any&&all?"num":"text"; });
}
function xgSaveAs(blob, file){ var a=document.createElement("a"), u=URL.createObjectURL(blob); a.href=u; a.download=file; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(u); a.remove(); },1000); }
function xgFileEx(E, g, cols, aoa, v, base){
  var o=g.o, d=srvNow(), p=function(n){ return ("0"+n).slice(-2); }, when=d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes());
  var wb=new E.Workbook(); wb.creator="AXF CONTROL"; wb.created=d;
  var used={}, nm=xsName(o.file||"명단", used), head=aoa[0], body=aoa.slice(1);
  xsSheet(wb, nm, (o.file||"명단")+" · "+when+" · "+n0(v.length)+(o.unit||"명"), head, body, xsKinds(head, body, cols), false);
  xgMore(g, v).forEach(function(sh){ var h=sh.aoa[0]||[], b=sh.aoa.slice(1), tot=b.length>0&&String(b[b.length-1][0]).trim()==="합계";
    xsSheet(wb, xsName(sh.name, used), String(sh.name||"시트")+" · "+when, h, b, xsKinds(h, b, null), tot); });
  XG.last.sheets=wb.worksheets.map(function(w){ return w.name; });
  return wb.xlsx.writeBuffer().then(function(buf){
    xgSaveAs(new Blob([buf],{ type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), base+".xlsx");
    XG.last.kind="xlsx"; XG.last.styled=1; return { ok:true, name:base+".xlsx" }; });
}
/* 서식 없는 xlsx(SheetJS) · ExcelJS 를 못 불러올 때 */
function xgFileX(X, g, cols, aoa, v, base){
  var ws=X.utils.aoa_to_sheet(aoa);
  ws["!cols"]=cols.map(function(c){ return { wch:c.type==="date"?17:Math.max(6,Math.min(40,Math.round((c.w||100)/7))) }; });
  if(aoa.length>1) ws["!autofilter"]={ ref:X.utils.encode_range({ s:{ r:0, c:0 }, e:{ r:aoa.length-1, c:cols.length-1 } }) };
  var wb=X.utils.book_new(); X.utils.book_append_sheet(wb, ws, String(g.o.file||"명단").slice(0,31).replace(/[\\/?*\[\]:]/g," "));
  xgMore(g, v).forEach(function(sh){ var w=X.utils.aoa_to_sheet(sh.aoa); if(sh.wch) w["!cols"]=sh.wch.map(function(n){ return { wch:n }; }); X.utils.book_append_sheet(wb, w, String(sh.name||"시트").slice(0,31)); });
  XG.last.sheets=wb.SheetNames.slice();
  X.writeFile(wb, base+".xlsx", { compression:true });
  XG.last.kind="xlsx"; return { ok:true, name:base+".xlsx" };
}
function xgFile(g, rows){
  var cols=xgCols(g).filter(function(c){ return !c.act&&c.t; }), v=xgView(g, rows);
  var aoa=[cols.map(function(c){ return c.t; })].concat(v.map(function(r){ return cols.map(function(c){ return xgX(c,r); }); }));
  var base="AXF_"+String(g.o.file||g.id).replace(/[\\/:*?"<>|\s]+/g,"_")+"_"+xgStamp();
  XG.last={ name:base, head:aoa[0], n:v.length };
  var csv=function(){
    var t="\ufeff"+aoa.map(function(r){ return r.map(function(x){ var s=String(x==null?"":x); return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(","); }).join("\r\n");
    xgSaveAs(new Blob([t],{ type:"text/csv;charset=utf-8" }), base+".csv");
    XG.last.kind="csv"; return { ok:true, name:base+".csv", csv:1 }; };
  var plain=function(){ return xgLoadLib().then(function(X){ return xgFileX(X, g, cols, aoa, v, base); }, csv); };
  return xgLoadEx().then(function(E){ return xgFileEx(E, g, cols, aoa, v, base); }).catch(plain);
}
