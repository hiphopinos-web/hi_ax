/* AXF CONTROL v2 · 명단 표(공통 부품 · 사용자 261016 「모든 명단을 엑셀처럼 일관된 하나의 표 모양」)
 * 모든 명단(옷 · 출석 · 사전 신청 · 스태프 · 라운지 · 커피챗 · 접속 · 아이디어 · 경품 수령 …)이 이 부품 하나를 쓴다.
 * 규칙: 머리 행 고정 · 머리 누르면 오름 → 내림 · 검색 칸 · 구분 칩(건수 붙음) · 건수 · 「엑셀 다운로드」(같은 자리 · 오른쪽 끝)
 *       숫자 오른쪽 정렬 · tabular-nums · 날짜 「MM-DD HH:mm」(오늘이면 「HH:mm」) · 열 너비는 열 정의 w(px)
 * 내려받기 = 위험 동작(L3) · 확인 창에서 PIN 매번 → 서버 원본 액션을 dl=1 + sp 로 다시 받아 → 화면에 보이는 열 · 구분 · 검색 · 정렬 그대로 .xlsx
 *       SheetJS(cdnjs 고정 버전)를 그때 불러온다 · 못 불러오면 UTF-8 BOM CSV 로 대신 받는다
 * 열 정의 c = { k 키 · t 머리 글자 · w 너비 · type(num | date | text) · v(row) 값 · f(row) 화면 html · x(row) 엑셀 값 · act(row) 단추 html(엑셀 제외) · sort:false } */
var XLSX_URL="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
var XG={ reg:{}, MAXROWS:500 };
XG.make=function(o){
  var g={ o:o, id:o.id, rows:null, err:null, q:"", chip:(o.chips&&o.chips[0]&&o.chips[0][0])||"", sort:o.sort?{ k:o.sort.k, d:o.sort.d||1 }:null, sel:null };
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
      '<div class="xg-bar"><input class="xg-q" type="search" placeholder="'+esc(o.ph||"이름 · 부서 · 사번 찾기")+'" aria-label="'+esc((o.file||"명단")+" 검색")+'" value="'+esc(g.q)+'" oninput="XG.find(\''+g.id+'\',this.value)"><span class="xg-cnt" data-c="cnt"></span>'+
      (o.noDl?'':'<button class="btn sm lock xg-dl" type="button" onclick="XG.dl(\''+g.id+'\')">엑셀 다운로드</button>')+'</div>'+
      (o.chips&&o.chips.length>1?'<div class="xg-chips" role="group" aria-label="구분" data-c="chips"></div>':'')+
      '<div class="xg-wrap" style="--xg-h:'+(o.h||460)+'px"><table class="xg-t"><colgroup>'+cols.map(function(c){ return '<col'+(c.w?' style="width:'+c.w+'px"':'')+'>'; }).join("")+'</colgroup><thead><tr data-c="head"></tr></thead><tbody data-c="body"></tbody></table></div><div data-c="note"></div></div>';
  }
  XG.paint(g);
};
XG.set=function(g, rows, ph){ g.rows=rows; if(ph) XG.put(g, ph); else XG.paint(g); };
XG.root=function(g){ return document.querySelector('[data-xg="'+g.id+'"]'); };
XG.paint=function(g){
  var root=XG.root(g); if(!root) return;
  var o=g.o, cols=xgCols(g), q=function(n){ return root.querySelector('[data-c="'+n+'"]'); };
  q("head").innerHTML=cols.map(function(c){ var n=c.type==="num"?" n":"", on=g.sort&&g.sort.k===c.k;
    if(c.act||c.sort===false||!c.k) return '<th class="na'+n+'" scope="col">'+esc(c.t||"")+'</th>';
    return '<th class="'+n.trim()+'" scope="col"'+(on?' aria-sort="'+(g.sort.d>0?"ascending":"descending")+'"':'')+'><button type="button" onclick="XG.sortBy(\''+g.id+'\',\''+c.k+'\')">'+esc(c.t)+'<span class="ar" aria-hidden="true">'+(on?(g.sort.d>0?"▲":"▼"):"")+'</span></button></th>'; }).join("");
  var chips=q("chips"), all=g.rows||[];
  if(chips) chips.innerHTML=o.chips.map(function(c){ var n=c[2]?all.filter(c[2]).length:all.length;
    return '<button type="button" class="chip'+(g.chip===c[0]?" on":"")+'" aria-pressed="'+(g.chip===c[0])+'" onclick="XG.chipBy(\''+g.id+'\',\''+c[0]+'\')">'+esc(c[1])+' <span class="c">'+(g.rows?n0(n):"-")+'</span></button>'; }).join("");
  var body=q("body"), note=q("note"), cnt=q("cnt");
  if(g.rows==null){ body.innerHTML=""; cnt.innerHTML=""; note.innerHTML='<div class="xg-note">'+(g.gate||skel())+'</div>'; return; }
  var v=xgView(g), shown=v.slice(0,XG.MAXROWS);
  cnt.innerHTML='<b>'+n0(v.length)+'</b>건'+(v.length!==all.length?' / 전체 '+n0(all.length):'');
  body.innerHTML=shown.length?shown.map(function(r){ var k=o.key?o.key(r):"";
    return '<tr'+(g.sel!=null&&k===g.sel?' class="sel"':'')+'>'+cols.map(function(c){ var cls=c.act?"a":c.type==="num"?"n":c.type==="date"?"d":"";
      var h=c.act?c.act(r):c.f?c.f(r):esc(xgText(c,r)); return '<td class="'+cls+'" title="'+esc(c.act?"":xgText(c,r))+'">'+h+'</td>'; }).join("")+'</tr>'; }).join("")
    :"";
  note.innerHTML=(shown.length?"":emptyH(g.q?"찾는 줄이 없습니다":(o.empty||"아직 줄이 없습니다")))+(g.gate?'<div class="xg-note">'+g.gate+'</div>':"")+(v.length>shown.length?'<div class="cap" style="padding:6px 2px">앞 '+n0(XG.MAXROWS)+'줄만 보입니다 · 검색으로 좁힙니다 · 엑셀은 전체 '+n0(v.length)+'줄</div>':'');
};
XG.find=function(id, v){ var g=XG.reg[id]; g.q=String(v||""); XG.paint(g); };
XG.sortBy=function(id, k){ var g=XG.reg[id]; if(g.sort&&g.sort.k===k) g.sort.d=-g.sort.d; else g.sort={ k:k, d:1 }; xgSave(g); XG.paint(g); };
XG.chipBy=function(id, c){ var g=XG.reg[id]; g.chip=c; xgSave(g); XG.paint(g); if(g.o.onChip) g.o.onChip(c); };

/* ── 엑셀 다운로드 · 확인 창 + PIN(매번) · 서버 dl=1 ── */
XG.dl=function(id){
  var g=XG.reg[id], o=g.o; if(!g.rows){ toast("명단을 받은 뒤 내려받습니다"); return; }
  var cols=xgCols(g).filter(function(c){ return !c.act&&c.t; }), v=xgView(g), ch=(o.chips||[]).filter(function(c){ return c[0]===g.chip; })[0];
  confirmBox({ t:"명단을 엑셀로 내려받을까요?", who:(o.file||"명단")+" · "+n0(v.length)+"줄", sub:"열 "+cols.length+"개 · 구분 「"+(ch?ch[1]:"전체")+"」"+(g.q?" · 검색 「"+g.q+"」":"")+" · 화면 그대로 · 개인정보 파일", ok:"엑셀 다운로드", pin:true,
    run:function(pp){
      var src=xgSrc(g);
      var fetchIt=function(extra){
        if(!src) return xgFile(g, g.rows);
        var p={}; for(var k in (src.p||{})) p[k]=src.p[k]; p.dl="1"; for(var k2 in extra) p[k2]=extra[k2];
        return call(src.a, p).then(function(res){ if(!res||res.ok===false) return res||{ ok:false }; var rows=src.a==="list_get"?res.rows:src.pick?src.pick(res):res.rows; return xgFile(g, rows||g.rows); });
      };
      if(src&&src.a==="list_get") return fetchIt(pp);   /* 새 서버 · list_get dl=1 이 ph 를 확인한다 */
      return phToSp(pp.ph).then(function(x){ return x.ok?fetchIt({ sp:x.sp }):(x.r||{ ok:false }); });   /* 옛 액션 · 서버가 ph 를 모르므로 같은 해시로 먼저 본인 확인 */
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
function xgLoadLib(){
  if(window.XLSX&&window.XLSX.utils) return Promise.resolve(window.XLSX);
  if(XG._lib) return XG._lib;
  XG._lib=new Promise(function(ok, no){ var s=document.createElement("script"), t=setTimeout(function(){ no(new Error("timeout")); },10000);
    s.src=XLSX_URL; s.crossOrigin="anonymous"; s.referrerPolicy="no-referrer"; s.onload=function(){ clearTimeout(t); window.XLSX?ok(window.XLSX):no(new Error("nolib")); }; s.onerror=function(){ clearTimeout(t); no(new Error("load")); }; document.head.appendChild(s); });
  XG._lib.catch(function(){ XG._lib=null; });
  return XG._lib;
}
function xgStamp(){ var d=srvNow(), p=function(n){ return ("0"+n).slice(-2); }; return String(d.getFullYear()).slice(2)+p(d.getMonth()+1)+p(d.getDate())+"_"+p(d.getHours())+p(d.getMinutes()); }
function xgFile(g, rows){
  var cols=xgCols(g).filter(function(c){ return !c.act&&c.t; }), v=xgView(g, rows);
  var aoa=[cols.map(function(c){ return c.t; })].concat(v.map(function(r){ return cols.map(function(c){ return xgX(c,r); }); }));
  var base="AXF_"+String(g.o.file||g.id).replace(/[\\/:*?"<>|\s]+/g,"_")+"_"+xgStamp();
  XG.last={ name:base, head:aoa[0], n:v.length };
  return xgLoadLib().then(function(X){
    var ws=X.utils.aoa_to_sheet(aoa);
    ws["!cols"]=cols.map(function(c){ return { wch:c.type==="date"?17:Math.max(6,Math.min(40,Math.round((c.w||100)/7))) }; });
    if(aoa.length>1) ws["!autofilter"]={ ref:X.utils.encode_range({ s:{ r:0, c:0 }, e:{ r:aoa.length-1, c:cols.length-1 } }) };
    var wb=X.utils.book_new(); X.utils.book_append_sheet(wb, ws, String(g.o.file||"명단").slice(0,31).replace(/[\\/?*\[\]:]/g," "));
    X.writeFile(wb, base+".xlsx", { compression:true });
    XG.last.kind="xlsx"; return { ok:true, name:base+".xlsx" };
  },function(){
    var csv="﻿"+aoa.map(function(r){ return r.map(function(x){ var s=String(x==null?"":x); return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(","); }).join("\r\n");
    var a=document.createElement("a"), u=URL.createObjectURL(new Blob([csv],{ type:"text/csv;charset=utf-8" }));
    a.href=u; a.download=base+".csv"; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(u); a.remove(); },1000);
    XG.last.kind="csv"; return { ok:true, name:base+".csv", csv:1 };
  });
}
