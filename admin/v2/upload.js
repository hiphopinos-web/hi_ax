/* AXF CONTROL v2 · 명단 올리기(공통 부품 · 사용자 261016 선택지 ① · 처리함 › AX 라운지 배치판 위 「명단 올리기」)
 * 흐름: ① 엑셀(.xlsx · .xls · .csv)을 고르거나 붙여넣기 → ② 열 고르기 → ③ 미리 세기(서버) 결과를 명단 표(XG)로 → ④ 문제가 없을 때만 「적용」(확인 창) → 배치판
 * 파일 읽기 = 명단 표 내려받기와 같은 SheetJS(cdnjs 0.18.5 · xgLoadLib) · 파일은 서버로 보내지 않고 고른 열만 줄 글자로 보낸다.
 * 명단마다 다른 것은 sp(명세) 하나에 모은다 = 열(fields) · 줄 글자(line) · 미리 세기 · 적용 액션 · 줄 판정(judge) · 숫자(kpis).
 *   지금은 라운지(LNG_UP)만. 10F 사전 신청 · 접속 허용 · 스태프도 미리 세기 · 적용 모양이 같아서 명세만 더하면 붙는다. */
var UP=null;
function upNew(sp){ return { sp:sp, src:"", wb:null, sh:0, aoa:null, head:true, map:{}, mode:"replace", pv:null, sent:null, rows:null, busy:false, err:"", g:null }; }
function upOpen(sp){ UP=upNew(sp); }

/* ── 값 다듬기 ── */
function upCell(v){ return String(v==null?"":v).replace(/ /g," ").trim(); }
/* 시간 = 「10:30」 「10:30:00」 「오후 1:30」 「1:30 PM」 「10시 30분」 「10시」 「10:30~11:30」(앞 시각) · 엑셀 시간 숫자(0 ~ 1) · 빈칸 = 칸 미정 · 못 읽으면 null */
function upTime(v){
  var s=upCell(v); if(!s) return "";
  if(/^0?\.\d+$/.test(s)){ var mm=Math.round(Number(s)*1440); return m2hm(Math.floor(mm/60)*60+mm%60); }
  var m=s.match(/(\d{1,2})\s*(?::|시)\s*(\d{1,2})?/); if(!m) return null;
  var h=Number(m[1]), mi=m[2]!=null&&m[2]!==""?Number(m[2]):0;
  if(/오후|pm/i.test(s)&&h<12) h+=12; if(/오전|am/i.test(s)&&h===12) h=0;
  if(h>23||mi>59) return null;
  return ("0"+h).slice(-2)+":"+("0"+mi).slice(-2);
}
/* 상담석 = 1 ~ 9 한 자리(「2」 「2번」 「상담석 2」) · 빈칸 = 자리 고정 없음 · 못 읽으면 null */
function upSeat(v){ var s=upCell(v); if(!s) return ""; var m=s.match(/^(?:상담석\s*)?(\d+)\s*(?:번|석)?$/); return m&&Number(m[1])>=1&&Number(m[1])<=9?String(Number(m[1])):null; }
function upEmp(v){ var e=normE(upCell(v)); return /^[0-9A-Z]{3,12}$/.test(e)?e:null; }
function upCol(i){ var s="", n=i+1; while(n>0){ var r=(n-1)%26; s=String.fromCharCode(65+r)+s; n=Math.floor((n-1)/26); } return s; }

/* ── 1 · 파일 · 붙여넣기 ── */
function upFile(inp){
  var f=inp&&inp.files&&inp.files[0]; if(!f) return;
  UP.err=""; UP.busy=true; upPaint();
  var rd=new FileReader();
  rd.onload=function(){
    var buf=rd.result;
    xgLoadLib().then(function(X){
      var wb=X.read(new Uint8Array(buf),{ type:"array", cellDates:false });
      UP.wb=wb; UP.sh=0; UP.src=f.name; upSheet(0);
    },function(){
      if(/\.csv$/i.test(f.name)){ UP.wb=null; UP.src=f.name; upRows(upSplit(new TextDecoder("utf-8").decode(buf))); }
      else { UP.busy=false; UP.err="엑셀 도구를 불러오지 못했습니다 · CSV 로 저장해 올리거나 붙여넣습니다"; upPaint(); }
    });
  };
  rd.onerror=function(){ UP.busy=false; UP.err="파일을 읽지 못했습니다"; upPaint(); };
  rd.readAsArrayBuffer(f);
}
function upSheet(i){
  var X=window.XLSX, wb=UP.wb; if(!X||!wb) return;
  UP.sh=i; var ws=wb.Sheets[wb.SheetNames[i]];
  upRows(X.utils.sheet_to_json(ws,{ header:1, raw:false, defval:"", blankrows:false }));
}
function upSplit(t){
  return String(t||"").split(/\r?\n/).filter(function(l){ return l.trim(); }).map(function(l){ return l.indexOf("\t")>=0?l.split("\t"):l.indexOf(",")>=0?l.split(","):l.trim().split(/\s+/); });
}
function upPaste(){ var v=el("upTx")&&el("upTx").value; UP.tx=v||""; if(!v||!v.trim()){ UP.err="붙여넣은 줄이 없습니다"; upPaint(); return; } UP.wb=null; UP.src="붙여넣기"; upRows(upSplit(v)); }
function upRows(aoa){
  UP.busy=false; UP.err=""; UP.pv=null; UP.rows=null; UP.sent=null;
  aoa=(aoa||[]).map(function(r){ return (r||[]).map(upCell); }).filter(function(r){ return r.some(function(c){ return c; }); });
  if(!aoa.length){ UP.aoa=null; UP.err="읽은 줄이 없습니다"; upPaint(); return; }
  UP.aoa=aoa;
  var h0=aoa[0], hit=0; UP.sp.fields.forEach(function(f){ if(h0.some(function(c){ return f.re.test(c); })) hit++; });
  UP.head=hit>0||!h0.some(function(c){ return upEmp(c); });
  upGuess(); upPaint();
}
/* 열 짐작 · 머리글 이름 → 없으면 값 모양(사번 · 시간 · 한 자리 숫자) */
function upGuess(){
  var a=UP.aoa, h=UP.head?a[0]:[], body=UP.head?a.slice(1):a, n=Math.max.apply(null,a.map(function(r){ return r.length; })), used={}, map={};
  UP.sp.fields.forEach(function(f){
    var i=h.findIndex(function(c){ return f.re.test(c); });
    if(i<0&&f.shape){ for(var j=0;j<n;j++){ if(used[j]) continue; var vs=body.slice(0,20).map(function(r){ return r[j]||""; }).filter(Boolean); if(vs.length&&vs.every(f.shape)){ i=j; break; } } }
    if(i>=0&&!used[i]){ map[f.k]=i; used[i]=1; } else map[f.k]=-1;
  });
  UP.map=map;
}
function upMap(k, v){ UP.map[k]=Number(v); UP.pv=null; UP.rows=null; upPaint(); }
function upHead(on){ UP.head=!!on; UP.pv=null; UP.rows=null; upPaint(); }
function upMode(m){ UP.mode=m; UP.pv=null; UP.rows=null; upPaint(); }

/* ── 2 · 줄 만들기 · 3 · 미리 세기 ── */
function upRecs(){
  var a=UP.aoa||[], body=UP.head?a.slice(1):a, m=UP.map, base=UP.head?2:1;
  return body.map(function(r,i){ var o={ no:base+i }; Object.keys(m).forEach(function(k){ o[k+"0"]=m[k]>=0?upCell(r[m[k]]):""; }); return o; }).filter(function(o){ return o.emp0||o.t0||o.s0; });
}
function upPreview(){
  if(!UP.aoa||UP.map.emp<0||UP.busy) return;
  var recs=upRecs(), lines=[];
  recs.forEach(function(o){ var x=UP.sp.line(o); o.bad=x.bad||""; o.emp=x.emp||o.emp0; o.t=x.t; o.s=x.s; if(!x.bad){ o.li=lines.length; lines.push(x.txt); } });
  if(!recs.length){ UP.err="사번 열에 값이 없습니다"; upPaint(); return; }
  UP.busy=true; UP.err=""; upPaint();
  var txt=lines.join("\n");
  (lines.length?call(UP.sp.preview,{ rows:txt, mode:UP.mode },30000):Promise.resolve({ ok:true, rows:[], diff:{ add:0, del:0, keep:0 }, n:0, resv:{ add:0, move:0, keep:0, none:0, left:0, err:[], cap:[], dupSeat:[] } })).then(function(r){
    UP.busy=false;
    if(!r||r.ok===false){ UP.err=r&&r.reason==="rows"?"한 번에 "+n0(r.max)+"줄까지 올립니다":"미리 세지 못했습니다 · "+why(r); upPaint(); return; }
    UP.pv=r; UP.sent=txt; UP.chip0=true;
    UP.rows=recs.map(function(o){ var pr=o.li!=null?(r.rows||[])[o.li]:null, j=UP.sp.judge(o, pr, r); o.k=j.k; o.msg=j.msg; o.res=j.res; o.nm=pr&&pr.name||""; if(pr&&pr.t!=null) o.cell=pr.t; return o; });
    upPaint();
  });
}
function upBad(){ return (UP.rows||[]).filter(function(o){ return o.k!=="ok"; }).length; }
function upApply(){
  var pv=UP.pv, sp=UP.sp; if(!pv||upBad()||!UP.rows.length) return;
  var s=sp.sum(pv, UP.mode);
  confirmBox({ t:sp.askT, who:s.who, sub:s.sub, ok:"적용", danger:s.danger,
    run:function(){ return call(sp.apply,{ rows:UP.sent, mode:UP.mode, sig:pv.sig, confirm:sp.word },30000); },
    fail:function(r){ return r&&r.reason==="state"?"미리 센 뒤 명단이나 상담 줄이 바뀌었습니다 · 미리 세기를 다시 합니다":r&&(r.reason==="fmt"||r.reason==="cap")?"서버가 다시 센 결과에 문제가 있습니다 · 미리 세기를 다시 합니다":""; },
    done:function(r){ sp.done(r); } });
}

/* ── 그리기 ── */
function upMount(box){ box.innerHTML='<div id="upTop"></div><div class="grid g2 mt"><div class="card" id="upS1"></div><div class="card" id="upS2"></div></div><div class="card mt" id="upS3"></div>'; upPaint(); }
function upStep(){ return UP.rows?3:UP.aoa?2:1; }
function upPaint(){
  if(!UP||!el("upTop")) return;
  var sp=UP.sp, st=upStep();
  el("upTop").innerHTML='<div class="card"><h2>'+esc(sp.title)+' <span class="cap">'+esc(sp.desc)+'</span><span class="r"><button class="btn sm" type="button" onclick="UP.sp.back()">배치판으로</button></span></h2>'+
    '<ol class="up-steps">'+["파일 · 붙여넣기","열 고르기","미리 세기","적용"].map(function(t,i){ return '<li class="'+(i+1<st?"done":i+1===st?"on":"")+'"><b>'+(i+1)+'</b>'+esc(t)+'</li>'; }).join("")+'</ol>'+
    (UP.err?band("warn",esc(UP.err)):"")+'</div>';
  /* 1 */
  var wbs=UP.wb&&UP.wb.SheetNames.length>1?'<label class="up-f">시트<select onchange="upSheet(Number(this.value))">'+UP.wb.SheetNames.map(function(n,i){ return '<option value="'+i+'"'+(i===UP.sh?" selected":"")+'>'+esc(n)+'</option>'; }).join("")+'</select></label>':"";
  el("upS1").innerHTML='<h2>1 · 파일 고르기 <span class="cap">.xlsx · .xls · .csv · 첫 시트부터</span></h2>'+
    '<label class="btn pri up-file">파일 고르기<input type="file" accept=".xlsx,.xls,.csv" onchange="upFile(this)"></label>'+
    (UP.src?'<div class="cap mt4">'+esc(UP.src)+(UP.aoa?' · '+n0(UP.aoa.length)+'줄':'')+'</div>':'')+wbs+
    '<label class="up-f mt">또는 붙여넣기 <span class="cap">엑셀에서 복사한 줄 · 「사번 시간 상담석」</span><textarea id="upTx" rows="4" placeholder="990001	10:30	2&#10;990002	11:30	1">'+esc(UP.tx||"")+'</textarea></label>'+
    '<button class="btn sm mt4" type="button" onclick="upPaste()">붙여넣은 줄 읽기</button>'+(UP.busy&&!UP.aoa?'<div class="cap mt4">읽는 중</div>':'');
  /* 2 */
  var s2=el("upS2");
  if(!UP.aoa){ s2.innerHTML='<h2>2 · 열 고르기</h2>'+emptyH("파일을 고르면 열이 보입니다"); }
  else {
    var a=UP.aoa, n=Math.max.apply(null,a.map(function(r){ return r.length; })), h=UP.head?a[0]:[], opt=function(k){ var v=UP.map[k];
      return '<option value="-1"'+(v<0?" selected":"")+'>없음</option>'+Array.apply(null,{ length:n }).map(function(_,i){ return '<option value="'+i+'"'+(v===i?" selected":"")+'>'+upCol(i)+(h[i]?" · "+esc(h[i]):"")+'</option>'; }).join(""); };
    var smp=(UP.head?a.slice(1):a).slice(0,4), fs=sp.fields;
    s2.innerHTML='<h2>2 · 열 고르기 <span class="cap">이름은 확인용 · 서버로 보내지 않음</span></h2>'+
      '<div class="up-map">'+fs.map(function(f){ return '<label class="up-f">'+esc(f.t)+(f.need?' <span class="cap">필수</span>':'')+'<select onchange="upMap(\''+f.k+'\',this.value)">'+opt(f.k)+'</select></label>'; }).join("")+'</div>'+
      '<label class="up-ck"><input type="checkbox"'+(UP.head?" checked":"")+' onchange="upHead(this.checked)"> 첫 줄은 머리글</label>'+
      '<table class="up-smp"><thead><tr>'+fs.map(function(f){ return '<th>'+esc(f.t)+'</th>'; }).join("")+'</tr></thead><tbody>'+smp.map(function(r){ return '<tr>'+fs.map(function(f){ var i=UP.map[f.k]; return '<td>'+esc(i>=0?r[i]||"":"")+'</td>'; }).join("")+'</tr>'; }).join("")+'</tbody></table>'+
      '<div class="chips mt" role="group" aria-label="올리는 방식">'+sp.modes.map(function(m){ return '<button type="button" class="chip'+(UP.mode===m[0]?" on":"")+'" aria-pressed="'+(UP.mode===m[0])+'" onclick="upMode(\''+m[0]+'\')">'+esc(m[1])+'</button>'; }).join("")+'</div>'+
      '<div class="cap">'+esc((sp.modes.filter(function(m){ return m[0]===UP.mode; })[0]||[])[2]||"")+'</div>'+
      '<button class="btn pri mt" type="button"'+(UP.map.emp<0||UP.busy?' aria-disabled="true"':'')+' onclick="upPreview()">'+(UP.busy?"세는 중":"미리 세기")+'</button>'+(UP.map.emp<0?'<span class="cap"> · 사번 열을 고릅니다</span>':'');
  }
  /* 3 · 4 */
  var s3=el("upS3");
  if(!UP.rows){ s3.innerHTML='<h2>3 · 미리 세기 결과</h2>'+emptyH(UP.aoa?"「미리 세기」를 누르면 줄마다 결과가 보입니다":"파일을 먼저 고릅니다"); return; }
  var bad=upBad(), pv=UP.pv;
  if(!UP.g) UP.g=XG.make({ id:sp.id, file:sp.file, key:function(r){ return String(r.no); }, sort:{ k:"no", d:1 }, chips:sp.chips, cols:sp.cols, h:420, empty:"줄이 없습니다", ph:"사번 · 이름 찾기" });
  if(!el("upKp")) s3.innerHTML='<h2>3 · 미리 세기 결과</h2><div id="upKp"></div><div id="upBand"></div><div id="upTbl"></div><div class="up-go" id="upGo"></div>';
  el("upKp").innerHTML=sp.kpis(pv, UP.rows, UP.mode);
  el("upBand").innerHTML=bad?band("bad","문제 "+n0(bad)+"줄 · 파일을 고친 뒤 다시 올립니다 · 문제가 있으면 적용하지 않습니다"):UP.rows.length?band("info","문제 없음 · 적용할 수 있습니다"):band("warn","올릴 줄이 없습니다");
  if(UP.chip0){ UP.g.chip=bad?"bad":"all"; UP.chip0=false; }
  XG.set(UP.g, UP.rows, el("upTbl"));
  el("upGo").innerHTML='<button class="btn pri" type="button"'+(bad||!UP.rows.length?' aria-disabled="true"':'')+' onclick="upApply()">적용</button>'+(bad?'<span class="cap">문제 줄이 0이 되면 적용합니다</span>':'<span class="cap">확인 창에서 한 번 더 확인합니다</span>');
}

/* ── 명세 · AX 라운지 사전 명단(lng_pre_preview · lng_pre_apply · 서버 계약 3-5) ── */
var LNG_RES={ new:"새 승인", move:"시간 바꿈", keep:"그대로" };
var LNG_UP={
  id:"lngup", file:"라운지 명단 미리 세기", title:"명단 올리기", desc:"AX 라운지 사전 명단 · 사번 · 시간 · 상담석", askT:"라운지 사전 명단을 적용할까요?", word:"라운지명단",
  preview:"lng_pre_preview", apply:"lng_pre_apply",
  fields:[{ k:"emp", t:"사번", need:1, re:/사번|사원\s*번호|직원\s*번호|emp/i, shape:function(v){ return !!upEmp(v)&&!upTime(v); } },
    { k:"t", t:"시간", re:/시간|시각|칸|time/i, shape:function(v){ return /\d{1,2}\s*[:시]/.test(v); } },
    { k:"s", t:"상담석", re:/상담석|좌석|자리|seat/i, shape:function(v){ return /^\d$/.test(v); } },
    { k:"name", t:"이름(확인용)", re:/이름|성명|name/i }],
  modes:[["replace","명단 통째 교체","올린 사람이 명단 전부 · 명단에서 빠지는 사람은 사은품 명단에서 빠짐 · 상담 줄은 그대로"],["add","추가만","지금 명단에 더함 · 빠지는 사람 없음"]],
  /* 서버 줄 = 「사번 [시간] [상담석]」 · 상담석은 시간 뒤에만 읽는다 */
  line:function(o){
    var e=upEmp(o.emp0), t=upTime(o.t0), s=upSeat(o.s0);
    if(!e) return { bad:"사번 모양", emp:o.emp0 };
    if(t===null) return { bad:"시간 모양", emp:e };
    if(s===null) return { bad:"상담석 모양", emp:e, t:t };
    if(s&&!t) return { bad:"시간 없이 상담석", emp:e, s:s };
    return { emp:e, t:t, s:s, txt:e+(t?" "+t+(s?" "+s:""):"") };
  },
  judge:function(o, pr, pv){
    if(o.bad) return { k:"fmt", msg:o.bad };
    if(!pr) return { k:"fmt", msg:"서버 줄 없음" };
    if(pr.st==="noros") return { k:"noros", msg:"명부에 없는 사번" };
    if(pr.st==="dup") return { k:"dup", msg:"같은 사번 두 번" };
    if(pr.err==="time") return { k:"time", msg:"칸 밖 시간" };
    if(pr.err==="seat") return { k:"seat", msg:"상담석 범위 밖 · 1 ~ "+num(pv.resv&&pv.resv.seats) };
    var R=pv.resv||{}, cp=(R.cap||[]).filter(function(c){ return pr.t&&c.t===pr.t; })[0];
    if(cp) return { k:"cap", msg:"칸 정원 초과 · "+cp.t+" 칸 "+cp.n+"명 / "+cp.seats+"석" };
    var ds=(R.dupSeat||[]).filter(function(d){ return pr.t&&d.t===pr.t&&Number(d.seat)===Number(pr.seat); })[0];
    if(ds) return { k:"dup", msg:"같은 칸 같은 상담석 "+ds.n+"명" };
    return { k:"ok", res:LNG_RES[pr.rv]||"", msg:pr.t?"":"칸 미정" };
  },
  chips:[["all","전체",null],["ok","정상",function(r){ return r.k==="ok"; }],["bad","문제 전체",function(r){ return r.k!=="ok"; }],["cap","칸 정원 초과",function(r){ return r.k==="cap"; }],["time","칸 밖 시간",function(r){ return r.k==="time"; }],
    ["seat","상담석 범위 밖",function(r){ return r.k==="seat"; }],["noros","명부에 없음",function(r){ return r.k==="noros"; }],["dup","겹침",function(r){ return r.k==="dup"; }],["fmt","모양 오류",function(r){ return r.k==="fmt"; }]],
  cols:[{ k:"no", t:"파일 줄", type:"num", w:70 },{ k:"emp", t:"사번", w:90 },{ k:"name0", t:"이름(파일)", w:100 },{ k:"nm", t:"이름(명부)", w:100 },
    { k:"tt", t:"시간", w:110, v:function(r){ var c=r.cell!=null?r.cell:r.t; if(!c) return r.t0||""; var e=mins(c)+num(UP.pv&&UP.pv.resv&&UP.pv.resv.step||60); return c+"~"+m2hm(e)+(r.t0&&hm(r.t0)!==c?" ("+r.t0+")":""); } },
    { k:"s", t:"상담석", w:70, v:function(r){ return r.s||r.s0||""; } },
    { k:"k", t:"결과", w:110, v:function(r){ return r.k==="ok"?(r.res||"정상"):"문제"; }, f:function(r){ return r.k==="ok"?tag(r.res||"정상","ok"):tag("문제","bad"); } },
    { k:"msg", t:"내용", w:220 }],
  sum:function(pv, mode){
    var R=pv.resv||{}, d=pv.diff||{};
    return { who:n0(pv.n)+"명 · 새 승인 "+n0(R.add)+" · 시간 바꿈 "+n0(R.move)+" · 그대로 "+n0(R.keep)+(R.none?" · 칸 미정 "+n0(R.none):""),
      sub:(mode==="replace"?"명단에서 빠지는 사람 "+n0(d.del)+"명 · ":"")+(R.left?"빠져도 상담 줄이 남는 사람 "+n0(R.left)+"명(배치판에서 취소) · ":"")+"승인 알림은 보내지 않음 · 되돌리기는 옛 콘솔(legacy) B6",
      danger:mode==="replace"&&num(d.del)>0 };
  },
  kpis:function(pv, rows, mode){
    var R=pv.resv||{}, d=pv.diff||{}, bad=rows.filter(function(r){ return r.k!=="ok"; }).length;
    return '<div class="grid up-kp">'+
      kpi({ l:"올릴 사람", v:n0(pv.n), u:"명", s:"사은품 쿼터 "+n0(pv.quota)+(pv.over?" · 넘음 "+n0(pv.over):"") ,st:pv.over?"warn":"" })+
      kpi({ l:"새 승인", v:n0(R.add), u:"명", s:"상담 줄 새로" })+
      kpi({ l:"시간 바꿈", v:n0(R.move), u:"명", s:"그대로 "+n0(R.keep)+" · 칸 미정 "+n0(R.none) })+
      kpi({ l:"빠지는 사람", v:mode==="replace"?n0(d.del):"0", u:"명", s:mode==="replace"?"상담 줄이 남는 사람 "+n0(R.left):"추가만 · 빠짐 없음", st:mode==="replace"&&num(d.del)>0?"warn":"" })+
      kpi({ l:"문제", v:n0(bad), u:"줄", s:bad?"고친 뒤 다시 올림":"없음", st:bad?"bad":"ok", stt:bad?"적용 안 됨":"적용 가능" })+'</div>';
  },
  back:function(){ S.ui.lup=0; render(); load(false); },
  done:function(r){ var x=r&&r.resv||{}; S.ui.lup=0; UP=null; render(); reload(["resv","nb"]); toast("명단을 적용했습니다 · "+n0(r.n)+"명 · 새 승인 "+n0(x.add)+" · 시간 바꿈 "+n0(x.move)+(x.over&&x.over.length?" · 칸이 차서 미정 "+x.over.length:"")); }
};
