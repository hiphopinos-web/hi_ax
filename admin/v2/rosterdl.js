/* AXF CONTROL v2 · 무대 › 행운권 추첨 「명부 내려받기」 (261020 사용자 「행사 당일 1시간마다 백업 · 추첨 서버가 멈추면 종이로 출력해 손으로 뽑기」)
 * 단추 둘 = 선착순 명부 · 행운권 전체 명단 · 서버 roster_export(POST · 슈퍼관리자 본인만 · 읽기 · 운영로그에 줄 수만)
 * 파일 = .xlsx 를 이 파일 안에서 직접 만든다(바깥 라이브러리 · 주소 없음 · 압축 없는 zip) · 서버가 멈춘 뒤에도 파일 하나로 출력 · 손뽑기
 *   1행 = 기준 시각 · 총 몇 명 · 2행 = 머리글(쪽마다 반복) · A4 세로 · 폭 맞춤 · 테두리 · 아래 가운데 쪽 번호 · 사번 · 번호 = 글자 칸(앞자리 0 · 4자리)
 *   선착순 명부 = 순번 · 사번 · 소속 · 직위 · 성명 · 구분 · 달성 시점 · 수령 시각 · 서명(순번 오름차순 · 취소 줄 없음 · 대기마감 줄 있음 · 줄 높이 2배 · 261020 후속)
 *   행운권 전체 명단 = 사번 · 소속 · 직위 · 성명 · 행운권 번호 · 당첨(번호 한 장 = 한 줄 · 번호 오름차순 · 무대 추첨 풀과 같은 원천 · 당첨 = N등 · N등 부재 · 다른 번호 당첨 · 다른 번호 부재)
 *   직위 = 서버 명부직위(x.pos · 261021 명단 › 명단 올리기 › 직위 올리기 · 없으면 빈칸 · 종이에 손으로 적을 수 있게 열은 남긴다)
 * 마지막 내려받기 시각 = 이 PC(localStorage) */
var RDL={ busy:"" };
var RDL_K={ fcfs:{ n:"선착순 명부", f:"선착순명부" }, raffle:{ n:"행운권 전체 명단", f:"행운권명단" } };
function rdlTop(){ return typeof adrTop==="function"?adrTop():!!(S.me&&S.me.top); }
function rdlLast(k){ var v=lsGet("rdl_"+k,""); return v?String(v):""; }
function rdlCard(){
  var top=rdlTop(), b=function(k){ var on=RDL.busy===k, L=rdlLast(k);
    return '<div><button type="button" class="btn big" id="rdlB_'+k+'" onclick="rdlGo(\''+k+'\')"'+(top&&!RDL.busy?"":" disabled")+'>'+(on?"받는 중":RDL_K[k].n)+'</button>'+
      '<p class="cap mt4" id="rdlAt_'+k+'">마지막 내려받기 '+(L?esc(L):"-")+'</p></div>'; };
  return '<div class="card mt"><h2>명부 내려받기 <span class="cap">엑셀 · 1시간마다 · 추첨 서버가 멈추면 출력해 손으로 뽑기</span></h2>'+
    '<div class="grid g2">'+b("fcfs")+b("raffle")+'</div>'+
    (top?'':'<p class="cap mt">슈퍼관리자가 내려받습니다</p>')+'</div>';
}
function rdlPaint(){ var x=el("rdlBox"); if(x) x.innerHTML=rdlCard(); }
/* 무대 › 행운권 추첨 화면이 그려진 뒤 추첨 판(dcRoot) 아래에 칸 하나를 붙인다(stage.js 는 그대로 · 추첨 판 다시 그리기는 dcRoot 안만) */
(function(){ var sc=window.SCREENS&&SCREENS.stage; if(!sc||sc.rdl) return; var m0=sc.mount; sc.rdl=1;
  sc.mount=function(vb){ var r=m0.apply(this,arguments);
    try{ if(sgSub()==="draw"){ var root=el("dcRoot"); if(root&&!el("rdlBox")){ var d=document.createElement("div"); d.id="rdlBox"; root.parentNode.insertBefore(d,root.nextSibling); } rdlPaint(); } }catch(e){}
    return r; }; })();
function rdlStamp(t){ var m=String(t||"").match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/); if(!m){ var d=srvNow(), p=function(n){ return ("0"+n).slice(-2); }; return { f:p(d.getMonth()+1)+p(d.getDate())+"_"+p(d.getHours())+p(d.getMinutes()), s:d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes()), hm:p(d.getHours())+":"+p(d.getMinutes()) }; }
  return { f:m[2]+m[3]+"_"+m[4]+m[5], s:m[1]+"-"+m[2]+"-"+m[3]+" "+m[4]+":"+m[5], hm:m[4]+":"+m[5] }; }
function rdlGo(k){
  if(!rdlTop()){ toast("슈퍼관리자가 내려받습니다",{ bad:1 }); return; }
  if(RDL.busy) return;
  RDL.busy=k; rdlPaint();
  call("roster_export",{ kind:k },60000).then(function(r){
    RDL.busy="";
    if(!(r&&r.ok)){ rdlPaint(); toast("내려받지 못했습니다 · "+why(r),{ bad:1 }); return; }
    var st=rdlStamp(r.t), sh=rdlSheet(k,r,st), name=RDL_K[k].f+"_"+st.f+".xlsx";
    var bytes=rdlXlsx(sh);
    rdlSave(new Blob([bytes],{ type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), name);
    var now=new Date(), p=function(n){ return ("0"+n).slice(-2); };
    lsSet("rdl_"+k, p(now.getHours())+":"+p(now.getMinutes()));
    rdlPaint();
    var warn="";
    if(k==="raffle"&&r.cond) warn=" · 참석 조건 ON · 무대 풀과 다를 수 있습니다";
    else if(k==="raffle"&&r.pool&&(r.pool.balls!==r.m||r.pool.n!==r.n)) warn=" · 무대 풀 "+n0(r.pool.balls)+"장과 다릅니다";
    toast("내려받았습니다 · "+name+" · "+(k==="raffle"?n0(r.n)+"명 · 행운권 "+n0(r.m)+"장":n0(r.m)+"명")+warn,{ ms:6000, bad:!!warn });
  });
}
function rdlSave(blob, file){ var a=document.createElement("a"), u=URL.createObjectURL(blob); a.href=u; a.download=file; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(u); a.remove(); },1500); }

/* ── 표 한 장 · { name, title, head[], w[], kind[](t 글자 · n 숫자 · c 가운데 글자), rows[][] } ── */
function rdlHm(v, day){ var t=String(v||""), m=t.match(/^(\d{4}-(\d{2})-(\d{2}))[ T](\d{2}:\d{2})/); if(!m) return t; return m[1]===day?m[4]:m[2]+"-"+m[3]+" "+m[4]; }   /* 기준 시각과 같은 날 = HH:MM · 다른 날 = MM-DD HH:MM */
function rdlSheet(k, r, st){
  var rows=r.rows||[], day=st.s.slice(0,10);
  if(k==="raffle") return { name:"행운권 전체 명단", file:"행운권 전체 명단",
    title:"행운권 전체 명단 · 기준 시각 "+st.s+" · 총 "+n0(r.n)+"명 · 행운권 "+n0(r.m)+"장"+(r.wins!=null?" · 당첨 "+n0(r.wins)+"명"+(num(r.absent)?" · 부재 "+n0(r.absent)+"명":""):""),
    head:["사번","소속","직위","성명","행운권 번호","당첨"], w:[11,34,8,11,12,15], kind:["c","t","c","c","b","c"],
    rows:rows.map(function(x){ return [x.emp, x.dept, x.pos||"", x.name, x.no, x.win||""]; }) };
  var ok=r.m-num(r.wait);
  /* 261020 후속 · 체크인존에서 출력해 손으로 확인 · 서명 · 줄 높이 2배(36) · 서명 칸 넓게 · 옛 서버(got 없음)면 수령 시각 빈칸 */
  return { name:"선착순 명부", file:"선착순 명부", ht:36,
    title:"선착순 명부 · 기준 시각 "+st.s+" · 총 "+n0(r.m)+"명("+n0(r.cap)+"번까지 "+n0(ok)+"명 · 대기마감 "+n0(r.wait)+"명)",
    head:["순번","사번","소속","직위","성명","구분","달성 시점","수령 시각","서명"], w:[5,9,22,6,9,10,9,9,23], kind:["n","c","t","c","c","c","c","c","c"],
    rows:rows.map(function(x){ return [x.rk, x.emp, x.dept, x.pos||"", x.name, x.g, rdlHm(x.at,day), rdlHm(x.got,day), ""]; }) };
}

/* ── xlsx 만들기 · 압축 없는 zip(저장 방식) · CRC-32 ── */
var RDL_CRC=null;
function rdlCrc(u){ var t=RDL_CRC, c, i, j;
  if(!t){ t=RDL_CRC=new Uint32Array(256); for(i=0;i<256;i++){ c=i; for(j=0;j<8;j++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[i]=c>>>0; } }
  c=0xFFFFFFFF; for(i=0;i<u.length;i++) c=t[(c^u[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
function rdlUtf8(s){ return new TextEncoder().encode(s); }
function rdlZip(files){
  var parts=[], cen=[], off=0, i, n=files.length, d=new Date(), dt=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1))&0xFFFF, dd=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate())&0xFFFF;
  var le=function(a, v, b){ for(var k=0;k<b;k++) a.push((v>>>(8*k))&255); };
  for(i=0;i<n;i++){
    var nm=rdlUtf8(files[i][0]), data=rdlUtf8(files[i][1]), crc=rdlCrc(data), h=[];
    le(h,0x04034b50,4); le(h,20,2); le(h,0x0800,2); le(h,0,2); le(h,dt,2); le(h,dd,2); le(h,crc,4); le(h,data.length,4); le(h,data.length,4); le(h,nm.length,2); le(h,0,2);
    var c=[]; le(c,0x02014b50,4); le(c,20,2); le(c,20,2); le(c,0x0800,2); le(c,0,2); le(c,dt,2); le(c,dd,2); le(c,crc,4); le(c,data.length,4); le(c,data.length,4); le(c,nm.length,2); le(c,0,2); le(c,0,2); le(c,0,2); le(c,0,2); le(c,0,4); le(c,off,4);
    parts.push(new Uint8Array(h), nm, data); cen.push(new Uint8Array(c), nm);
    off+=h.length+nm.length+data.length;
  }
  var cl=0; cen.forEach(function(x){ cl+=x.length; });
  var e=[]; le(e,0x06054b50,4); le(e,0,2); le(e,0,2); le(e,n,2); le(e,n,2); le(e,cl,4); le(e,off,4); le(e,0,2);
  var all=parts.concat(cen,[new Uint8Array(e)]), len=0; all.forEach(function(x){ len+=x.length; });
  var out=new Uint8Array(len), p=0; all.forEach(function(x){ out.set(x,p); p+=x.length; });
  return out;
}
function rdlX(s){ return String(s==null?"":s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"").replace(/[&<>"]/g,function(c){ return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]; }); }
function rdlCol(i){ var s=""; i++; while(i>0){ var m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=Math.floor((i-1)/26); } return s; }
/* 서식 번호 · 0 기본 · 1 제목(굵게 12 · 길면 줄여 맞춤) · 2 머리글(굵게 · 회색 · 테두리 · 가운데) · 3 글자(테두리 · 왼쪽 · 글자 서식 @) · 4 숫자(테두리 · 가운데) · 5 글자(테두리 · 가운데 · @) · 6 굵은 글자(테두리 · 가운데 · @ · 행운권 번호) */
var RDL_STY='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'+
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
  '<fonts count="3"><font><sz val="10"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font><font><b/><sz val="10"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font><font><b/><sz val="12"/><name val="맑은 고딕"/><family val="3"/><charset val="129"/></font></fonts>'+
  '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE5E8EE"/><bgColor indexed="64"/></patternFill></fill></fills>'+
  '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF7F7F7F"/></left><right style="thin"><color rgb="FF7F7F7F"/></right><top style="thin"><color rgb="FF7F7F7F"/></top><bottom style="thin"><color rgb="FF7F7F7F"/></bottom><diagonal/></border></borders>'+
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
  '<cellXfs count="7">'+
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
  '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center" shrinkToFit="1"/></xf>'+
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+
  '<xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" shrinkToFit="1"/></xf>'+
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+
  '<xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+
  '<xf numFmtId="49" fontId="1" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+
  '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
function rdlCell(ref, v, k){
  if(k==="n"&&v!==""&&v!=null&&isFinite(Number(v))) return '<c r="'+ref+'" s="4"><v>'+Number(v)+'</v></c>';
  var s=k==="t"?3:k==="b"?6:5;
  return '<c r="'+ref+'" s="'+s+'" t="inlineStr"><is><t xml:space="preserve">'+rdlX(v)+'</t></is></c>';
}
function rdlSheetXml(sh){
  var nc=sh.head.length, last=rdlCol(nc-1), nr=sh.rows.length+2, x=[];
  x.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">');
  x.push('<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:'+last+nr+'"/>');
  x.push('<sheetViews><sheetView workbookViewId="0" zoomScale="100"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A3" sqref="A3"/></sheetView></sheetViews>');
  x.push('<sheetFormatPr defaultRowHeight="18" customHeight="1"/><cols>'+sh.w.map(function(w,i){ return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>'; }).join("")+'</cols><sheetData>');
  x.push('<row r="1" ht="24" customHeight="1"><c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">'+rdlX(sh.title)+'</t></is></c></row>');
  x.push('<row r="2" ht="20" customHeight="1">'+sh.head.map(function(h,i){ return '<c r="'+rdlCol(i)+'2" s="2" t="inlineStr"><is><t>'+rdlX(h)+'</t></is></c>'; }).join("")+'</row>');
  sh.rows.forEach(function(r,ri){ var n=ri+3; x.push('<row r="'+n+'"'+(sh.ht?' ht="'+sh.ht+'" customHeight="1"':'')+'>'+r.map(function(v,i){ return rdlCell(rdlCol(i)+n, v, sh.kind[i]); }).join("")+'</row>'); });
  x.push('</sheetData><mergeCells count="1"><mergeCell ref="A1:'+last+'1"/></mergeCells>');
  x.push('<printOptions horizontalCentered="1"/><pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.25" footer="0.25"/>');
  x.push('<pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>');
  x.push('<headerFooter><oddHeader>&amp;L'+rdlX(sh.name)+'&amp;R'+rdlX(sh.title.split(" · 총")[0].replace(sh.name+" · ",""))+'</oddHeader><oddFooter>&amp;C&amp;P / &amp;N</oddFooter></headerFooter>');
  x.push('</worksheet>');
  return x.join("");
}
function rdlXlsx(sh){
  var sn=rdlX(sh.name), ct='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'+
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
  var rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  var wb='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews>'+
    '<sheets><sheet name="'+sn+'" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Titles" localSheetId="0">\''+sn+'\'!$2:$2</definedName></definedNames></workbook>';
  var wrels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
  return rdlZip([["[Content_Types].xml",ct],["_rels/.rels",rels],["xl/workbook.xml",wb],["xl/_rels/workbook.xml.rels",wrels],["xl/styles.xml",RDL_STY],["xl/worksheets/sheet1.xml",rdlSheetXml(sh)]]);
}
