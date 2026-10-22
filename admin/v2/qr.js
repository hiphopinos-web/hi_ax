/* AXF CONTROL v2 · 기록 · 설정 › 현장 QR (261016 3단계 · 지금 콘솔 「설정 › 현장 QR」을 옮김)
 * 묶음 = 1 앱 · 아이디어 한 줄 · 2 계단실(stair_list) · 3 17F 오후 AWS · MS 입장 · 끝(att_list code) · 4 10F 실습 세션 A~E 입장 · 종료(att_list code10)
 * 그림 = 이 화면이 서버 코드로 바로 그린다(../qrcode.js · admin/ 자리 그대로 · 선수 화면과 같이 씀) · 장식 없는 일반 QR · 검정 정사각 · 흰 바탕 · ECC Q · 조용한 영역 4칸
 * 카드마다 QR 그림 · 담긴 주소 · PNG(2048 · 아래 글자) · QR만 PNG · 찍힌 수(계단 = stair_stats 지점별 누적 · 오늘 · 17F = qr_stats att 오늘 · 10F = att_stats)
 * 묶음 ZIP = 지금 콘솔과 같은 무압축 ZIP(외부 도구 없음) · 그림 파일은 공개 저장소 · 메신저에 올리지 않는다(코드가 퍼지면 현장에 오지 않고도 적립) */
var QV_BASE="https://hiax.app/", QV_PX=2048, QV_CACHE={}, QV_ZIP={ busy:false };
var QV_LEC=[["att_l1_in","l1","in","파트너사 강연 · AWS · 입장 QR","17F 입장 출석"],["att_l1_out","l1","out","파트너사 강연 · AWS · 끝 QR","17F 끝 출석"],["att_l2_in","l2","in","파트너사 강연 · MS · 입장 QR","17F 입장 출석"],["att_l2_out","l2","out","파트너사 강연 · MS · 끝 QR","17F 끝 출석"]];
var QV_PL={ fld:"컨퍼런스룸", ta:"01 HEART", tb:"06 HEART", aws:"08 HEART", ms1:"07 HEART", ms2:"07 HEART" };
var QV_GRP=[["app idea","1 · 앱 · 아이디어 한 줄","출력용 · 서버 코드 없음","앱아이디어"],["stair","2 · 계단실 · 층별","방화문 앞 · 층마다 1세트 · 양쪽 계단실에 같은 장","계단실"],["lec","3 · 17F 강의장 출석","오후 AWS · MS 입장 · 끝(PPT)","17F출석"],["lec10","4 · 10F 실습 세션 출석","A~E 입장 · 종료 · 스탬프 없음","10F출석"],["ldraw","5 · 17F 럭키드로우 체크인","Closing 체크인 · 1 · 2 · 3등 추첨 통","럭키드로우"]];
function qvStId(fl, r){ return "st"+("0"+fl).slice(-2)+"-"+r; }
function qvItems(){
  var B=QV_BASE, al=S.data.qal, out=[];
  out.push({ id:"app", grp:"app", label:"AX Festival 2026 앱", sub:"찍으면 앱이 열립니다", data:B });
  out.push({ id:"idea", grp:"idea", label:"아이디어 한 줄", sub:"“이거 AI로 되겠는데?” 한 줄 남기기", data:B+"#q=idea" });
  (((S.data.qst||{}).rows)||[]).slice().sort(function(a,b){ return a.fl-b.fl||a.r-b.r; }).filter(function(r){ return r.r===1; }).forEach(function(r){ out.push({ id:qvStId(r.fl,r.r), grp:"stair", fl:r.fl, r:r.r, label:"계단 이용 · "+r.fl+"F", sub:"출발 층 · 도착 층 QR을 찍으면 스탬프", one:true, acc:r.fl+"F", data:B+"#s="+r.code+"&fl="+r.fl+"&r="+r.r, off:!r.on }); });
  if(al&&al.ok&&al.code){ var pids=(al.progs||[]).map(function(p){ return p.id; }); QV_LEC.forEach(function(a){ if(pids.indexOf(a[1])<0) return; out.push({ id:a[0], grp:"lec", small:true, pid:a[1], k:a[2], label:a[3], sub:a[4], data:B+"#s="+al.code+"&p="+a[1]+"&k="+a[2] }); }); }
  if(al&&al.ok&&al.code10) (al.progs10||[]).forEach(function(x){ [["in","입장"],["out","종료"]].forEach(function(k){ out.push({ id:"att10_"+x.id+"_"+k[0], grp:"lec10", small:true, pid:x.id, k:k[0], label:x.n+" · "+k[1]+" QR", sub:"10F "+(QV_PL[x.id]||"")+" · "+k[1]+" 출석", data:B+"#s="+al.code10+"&p="+x.id+"&k="+k[0] }); }); });
  var dr=S.data.draw; if(dr&&dr.code&&typeof dtQrData==="function") out.push({ id:"lucky_checkin", grp:"ldraw", label:"럭키드로우 체크인", sub:"1 · 2 · 3등 추첨 · 16:40부터", data:dtQrData(String(dr.code)) });
  return out;
}
/* 그림 · 지금 콘솔 qvCanvas 와 같은 규칙(모듈 정수 배율 · 조용한 영역 4 · 아래 글자는 PNG 에만) */
var QV_F='Pretendard,"Pretendard Variable","Malgun Gothic",sans-serif', QV_FP=null, QV_GT={"F":["XXXXX","X....","XXXX.","X....","X...."],"0":[".XXX.","X..XX","X.X.X","XX..X",".XXX."],"1":["..X..",".XX..","..X..","..X..",".XXX."],"2":[".XXX.","X...X","...X.","..X..","XXXXX"],"3":["XXXX.","....X",".XXX.","....X","XXXX."],"4":["X...X","X...X","XXXXX","....X","....X"],"5":["XXXXX","X....","XXXX.","....X","XXXX."],"6":[".XXX.","X....","XXXX.","X...X",".XXX."],"7":["XXXXX","....X","...X.","..X..","..X.."],"8":[".XXX.","X...X",".XXX.","X...X",".XXX."],"9":[".XXX.","X...X",".XXXX","....X",".XXX."]};
/* 글꼴이 실린 뒤 그린다 · Pretendard 가 없으면 맑은 고딕으로 */
function qvFont(){ if(!QV_FP){ try{ QV_FP=(document.fonts&&document.fonts.load)?Promise.all([document.fonts.load("700 40px Pretendard"),document.fonts.load("400 40px Pretendard")]).catch(function(){}):Promise.resolve(); }catch(e){ QV_FP=Promise.resolve(); } } return QV_FP; }
/* 층 점 글자 · 앱 DotGlyph(app-src/101-js-data.js)와 같은 5 x 5 글자표 · 간격 PX 1 PY 0.9715 D 1.3081 LG 0.571 · 점 지름 = 높이 x 0.252 · 그린 너비를 돌려준다 */
function qvDots(g, text, x, y, H){
  var PY=0.9715, D=1.3081, LG=0.571, s=H/(4*PY+D), cx=0, w=0, first=true, r=D*s/2;
  String(text).toUpperCase().split("").forEach(function(c){ var rows=QV_GT[c]; if(!rows) return; if(!first) cx+=LG; first=false;
    for(var k=0;k<rows[0].length;k++) for(var j=0;j<5;j++) if(rows[j].charAt(k)==="X"){ g.beginPath(); g.arc(x+(cx+k+D/2)*s,y+(j*PY+D/2)*s,r,0,Math.PI*2); g.fill(); }
    w=cx+(rows[0].length-1)+D; cx=w; });
  return w*s;
}
function qvCanvas(it, px, label){
  var q=qrcode(0,"Q"); q.addData(it.data); q.make();
  var n=q.getModuleCount(), Q=4, M=Math.max(1,Math.floor(px/(n+2*Q))), w=(n+2*Q)*M;
  var L=it.small?[0.045,0.03]:[0.075,0.045], tp=Math.round(w*L[0]), sp=Math.round(w*L[1]), gap=Math.round(w*0.05), pad=Math.round(w*0.06);
  var lines=label?(it.one?[it.sub]:[it.label,it.sub,it.note]).filter(function(t){ return !!t; }):[];
  var th=lines.length?lines.reduce(function(a,t,i){ return a+(i?sp:tp)+Math.round(sp*0.5); },0)+gap+Math.round(pad/2):0;
  var c=document.createElement("canvas"); c.width=w; c.height=w+th;
  var g=c.getContext("2d"); g.fillStyle="#FFFFFF"; g.fillRect(0,0,c.width,c.height); g.fillStyle="#000000";
  for(var r=0;r<n;r++) for(var k=0;k<n;k++) if(q.isDark(r,k)) g.fillRect((k+Q)*M,(r+Q)*M,M,M);
  if(lines.length){
    var F=QV_F, y=w+Math.round(gap/2), x=Math.round(w*0.07);
    g.textBaseline="top";
    if(it.acc){ g.fillStyle="#000000"; x+=Math.round(qvDots(g,it.acc,x,y,Math.round(tp*1.5))+w*0.04); y+=Math.round(tp*0.25); }
    var avail=w-x-Math.round(w*0.05);
    lines.forEach(function(t,i){ var sz=i?sp:tp, wt=i?400:700; g.font=wt+" "+sz+"px "+F; while(g.measureText(t).width>avail&&sz>10){ sz-=2; g.font=wt+" "+sz+"px "+F; } g.fillStyle=i?"#6B635D":"#000000"; g.fillText(t,x,y); y+=sz+Math.round(sp*0.5); });
  }
  return c;
}
function qvPrev(it){ if(QV_CACHE[it.data]==null){ try{ QV_CACHE[it.data]=qvCanvas(it,160,false).toDataURL("image/png"); }catch(e){ QV_CACHE[it.data]=""; } } return QV_CACHE[it.data]; }
function qvSave(blob, name){ var a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },600); }
function qvDl(id, only){ var it=qvItems().filter(function(x){ return x.id===id; })[0]; if(!it) return; qvFont().then(function(){ qvCanvas(it,QV_PX,!only).toBlob(function(b){ qvSave(b,it.id+(only?"_QR만":"")+".png"); toast("내려받았습니다 · "+it.id+(only?" · QR만":"")); },"image/png"); }); }
var QV_CRC=null;
function qvCrc(u){ if(!QV_CRC){ QV_CRC=new Uint32Array(256); for(var n=0;n<256;n++){ var c=n; for(var k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; QV_CRC[n]=c>>>0; } } var x=0xFFFFFFFF; for(var i=0;i<u.length;i++) x=QV_CRC[(x^u[i])&255]^(x>>>8); return (x^0xFFFFFFFF)>>>0; }
function qvZip(files){
  var parts=[], cen=[], off=0, cs=0, enc=new TextEncoder();
  files.forEach(function(f){ var nm=enc.encode(f.name), crc=qvCrc(f.data), sz=f.data.length;
    var h=new DataView(new ArrayBuffer(30)); h.setUint32(0,0x04034b50,true); h.setUint16(4,20,true); h.setUint16(6,0x0800,true); h.setUint32(14,crc,true); h.setUint32(18,sz,true); h.setUint32(22,sz,true); h.setUint16(26,nm.length,true);
    var c=new DataView(new ArrayBuffer(46)); c.setUint32(0,0x02014b50,true); c.setUint16(4,20,true); c.setUint16(6,20,true); c.setUint16(8,0x0800,true); c.setUint32(16,crc,true); c.setUint32(20,sz,true); c.setUint32(24,sz,true); c.setUint16(28,nm.length,true); c.setUint32(42,off,true);
    parts.push(h.buffer,nm,f.data); cen.push(c.buffer,nm); off+=30+nm.length+sz; cs+=46+nm.length; });
  var e=new DataView(new ArrayBuffer(22)); e.setUint32(0,0x06054b50,true); e.setUint16(8,files.length,true); e.setUint16(10,files.length,true); e.setUint32(12,cs,true); e.setUint32(16,off,true);
  return new Blob(parts.concat(cen,[e.buffer]),{ type:"application/zip" });
}
/* grp 없음 = 전체 */
function qvZipGrp(grp, nm){
  var list=qvItems().filter(function(x){ return !grp||(" "+grp+" ").indexOf(" "+x.grp+" ")>=0; });
  if(!list.length){ toast("코드를 아직 받지 못했습니다"); return; }
  if(QV_ZIP.busy) return; QV_ZIP.busy=true; toast(nm+" "+list.length+"장 만드는 중",{ ms:20000 });
  var files=[], i=0;
  qvFont().then(function(){ (function next(){
    if(i>=list.length){ QV_ZIP.busy=false; qvSave(qvZip(files),"AXF_"+nm+"_QR_"+list.length+"장.zip"); toast(nm+" QR "+files.length+"장 ZIP"); return; }
    var it=list[i++]; qvCanvas(it,QV_PX,true).toBlob(function(b){ b.arrayBuffer().then(function(ab){ files.push({ name:it.id+".png", data:new Uint8Array(ab) }); next(); }); },"image/png");
  })(); });
}
/* 찍힌 수 */
function qvCount(it){
  if(it.grp==="stair"){ var ss=S.data.qss, x=ss&&ss.ok?(ss.spots||[]).filter(function(s){ return s.fl===it.fl&&s.r===it.r; })[0]:null;
    if(!ss) return ""; if(!x) return "기록 없음"; return (!x.n?"스캔 없음":x.mis>0?"불일치 "+x.mis+"건":"정상")+" · 누적 "+n0(x.n)+" · 오늘 "+n0(x.today); }
  if(it.grp==="lec"){ var qs=S.data.qqs, a=qs&&qs.ok?qs.att:null; return a?"17F 출석 오늘 "+n0(a.today)+"건 · "+n0(a.people)+"명(입장 · 끝 합계)":""; }
  if(it.grp==="lec10"){ var at=S.data.qa10, t=at&&at.ok?(at.ten||[]).filter(function(z){ return z.id===it.pid; })[0]:null; return t?(it.k==="in"?"입장 "+n0(t["in"]):"종료 "+n0(t.out))+" · 신청 "+n0(t.pre)+"명":""; }
  if(it.grp==="ldraw"){ var dw=S.data.draw; return dw&&dw["in"]!=null?"체크인 "+n0(dw["in"])+"명"+(dw.closed?" · 마감":""):""; }
  return "";
}
function qvTile(it){
  var src=typeof qrcode==="function"?qvPrev(it):"", ct=qvCount(it), bad=/스캔 없음|불일치/.test(ct);
  return '<div class="qv"><div class="qvi">'+(src?'<img alt="'+esc(it.label)+' QR" src="'+src+'">':'')+'</div><b>'+esc(it.label)+(it.off?" "+tag("꺼짐","off"):"")+'</b><span class="cap">'+esc(it.sub||"")+'</span>'+
    '<code class="qv-u" title="담긴 주소">'+esc(it.data)+'</code>'+(ct?'<span class="qv-c'+(bad?" w":"")+'">'+esc(ct)+'</span>':'')+
    '<div class="btns"><button class="btn sm pri" type="button" onclick="qvDl(\''+jq(it.id)+'\',0)">PNG</button><button class="btn sm" type="button" onclick="qvDl(\''+jq(it.id)+'\',1)">QR만</button><span class="cap">QR만 · 흰 여백을 자르지 않고 붙입니다</span><button class="btn sm" type="button" aria-label="'+esc(it.label)+' 주소 복사" onclick="copyTx(\''+esc(it.data).replace(/'/g,"\\'")+'\',\'주소를 복사했습니다\')">주소</button></div></div>';
}
function qrMount(vb, h){
  vb.innerHTML=h+'<div class="up-bar"><span class="cap">장식 없는 일반 QR · ECC Q · PNG 2048px · 그림 파일은 공개 저장소 · 메신저에 올리지 않습니다</span><button class="btn sm pri" type="button" onclick="qvZipGrp(\'\',\'전체\')">전체 PNG 한 번에(ZIP)</button></div><div id="qvB"></div>';
}
function qrPaint(){
  var b=el("qvB"); if(!b) return;
  if(typeof qrcode!=="function"){ b.innerHTML=band("bad","QR 그리기 파일(qrcode.js)을 받지 못했습니다 · 새로고침합니다"); return; }
  var all=qvItems();
  b.innerHTML=QV_GRP.map(function(g){ var gs=" "+g[0]+" ", l=all.filter(function(x){ return gs.indexOf(" "+x.grp+" ")>=0; }), srv=g[0]==="stair"?"qst":g[0]==="app idea"?"":g[0]==="ldraw"?"draw":"qal";
    var gate=srv?dataGate(srv,srv==="qst"?"계단 지점":srv==="draw"?"추첨 코드":"출석 코드"):null;
    return '<div class="card mt"><h2>'+esc(g[1])+' <span class="cap">'+esc(g[2])+' · '+l.length+'장</span>'+(l.length>1?'<span class="r"><button class="btn sm" type="button" onclick="qvZipGrp(\''+g[0]+'\',\''+g[3]+'\')">'+l.length+'장 ZIP</button></span>':'')+'</h2>'+
      (l.length?'<div class="qvg">'+l.map(qvTile).join("")+'</div>':gate||'<p class="cap">'+(g[0]==="ldraw"?"서버 추첨 코드 없음":"코드가 없습니다")+'</p>')+'</div>'; }).join("");
}
