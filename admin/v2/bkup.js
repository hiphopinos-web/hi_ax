/* AXF CONTROL v2 · 설정 › 일괄 저장 (261021 사용자 「서버가 갑자기 다운되면 그때까지의 정보를 엑셀로 · 지정된 폴더에 · 30분에 한 번씩 PC 에 저장」)
 * 슈퍼관리자 본인만 · 서버 bk_dump(POST · 읽기 · 5분 캐시 · 운영로그 bk_dl) 한 번 → 이 PC 폴더에 하위 폴더 AXF_백업_YYMMDD_HHmm 하나(옛 폴더는 지우지 않는다)
 *   열어 보기.html = 서버 없이 여는 오프라인 보기(bkview.js) · 종이 추첨 키트.html = 행운권 탭과 같은 키트(lkit.js lkKitHtml · 불러 쓰기만)
 *   엑셀 9개 = 행운권 · 선착순(rosterdl.js rdlSheet 그대로) · 스탬프 · 커피챗 · 라운지 · 10F · 설문 · 경품 · 타자왕(바깥 라이브러리 없는 xlsx · rdlZip)
 *   복구용_서버데이터.json = 시트 전체(migrate.mjs export_all · R2 백업과 같은 모양) · 복구는 담당자가 migrate.mjs import --file(콘솔에서 올리지 않는다)
 * 폴더 = Chrome File System Access(showDirectoryPicker) · 손잡이는 IndexedDB · 새로 고침 뒤 권한이 풀리면 「다시 허용」 · 폴더를 못 고르는 브라우저 = zip 한 개 내려받기
 * 30분마다 자동 저장 = 이 PC(localStorage) 켜기 · 끄기 · 콘솔 탭이 열려 있는 동안만 · 탭이 여럿이면 마지막 저장 시각(localStorage)을 같이 봐 한 번만 */
var BK={ dir:null, perm:"", busy:"", err:"", step:"" }, BK_EVERY=30*60000, BK_SYNC=/onedrive|desktop|바탕\s*화면|documents|문서/i;
var BK_FILES=[["열어 보기.html","서버 없이 여는 보기 · 찾기 · 인쇄"],["종이 추첨 키트.html","행운권 쪽지 · 명단 인쇄 · 당첨 기록"],["행운권 번호 명단.xlsx","번호순 · 장수별"],["선착순 명단.xlsx","순번 · 수령 · 서명"],["스탬프 현황.xlsx","사람별 개수 · 종류"],
  ["커피챗.xlsx","시간표 · 명단 · 아이디어"],["AX 라운지.xlsx","날짜별 시간표 · 명단"],["10F 사전 신청 · 체크인.xlsx","명단 · 출석"],["설문 응답.xlsx","집계 · 서술 응답"],["경품 · 룰렛 지급.xlsx","지급 기록 · 룰렛 · 옷"],["타자왕 순위.xlsx","1F 현장 순위"],["복구용_서버데이터.json","서버 복구용 · 담당자 전용"]];
function bkCan(){ return typeof window.showDirectoryPicker==="function"; }
function bkLast(){ return lsGet("bk_last",null); }
function bkAuto(){ return !!lsGet("bk_auto",false); }
/* ── IndexedDB · 폴더 손잡이 한 개 ── */
function bkIdb(put){
  return new Promise(function(ok){
    try{ var q=indexedDB.open("axf_bk",1);
      q.onupgradeneeded=function(){ q.result.createObjectStore("h"); };
      q.onsuccess=function(){ var db=q.result, tx=db.transaction("h", put===undefined?"readonly":"readwrite"), s=tx.objectStore("h"), r=put===undefined?s.get(skey("dir")):s.put(put, skey("dir"));
        r.onsuccess=function(){ ok(put===undefined?r.result||null:true); }; r.onerror=function(){ ok(null); }; };
      q.onerror=function(){ ok(null); };
    }catch(e){ ok(null); }
  });
}
function bkPermQ(){ if(!BK.dir||!BK.dir.queryPermission){ BK.perm=BK.dir?"granted":""; return Promise.resolve(BK.perm); }
  return BK.dir.queryPermission({ mode:"readwrite" }).then(function(p){ BK.perm=p; return p; },function(){ BK.perm="prompt"; return "prompt"; }); }
function bkInit(){ if(!bkCan()) return; bkIdb().then(function(h){ if(h){ BK.dir=h; bkPermQ().then(bkPaint); } }); }
function bkPick(){
  if(!isTop()){ toast("슈퍼관리자가 저장합니다",{ bad:1 }); return; }
  window.showDirectoryPicker({ id:"axfbk", mode:"readwrite" }).then(function(h){ BK.dir=h; BK.perm="granted"; bkIdb(h); bkPaint(); toast("저장 폴더 · "+h.name); },function(e){ if(e&&e.name!=="AbortError") toast("폴더를 고르지 못했습니다",{ bad:1 }); });
}
function bkRegrant(){ if(!BK.dir) return bkPick(); BK.dir.requestPermission({ mode:"readwrite" }).then(function(p){ BK.perm=p; bkPaint(); if(p!=="granted") toast("쓰기 허용이 필요합니다",{ bad:1 }); },function(){ bkPaint(); }); }
function bkSetAuto(on){ if(on&&!(BK.dir&&BK.perm==="granted")){ toast("폴더를 먼저 고르세요",{ bad:1 }); return; } lsSet("bk_auto",!!on); bkPaint(); toast(on?"30분마다 자동 저장 · 켬":"자동 저장 · 끔"); }
function bkKv(rows){ return '<dl class="cc-kv sv-kv">'+rows.map(function(x){ return '<dt>'+esc(x[0])+'</dt><dd>'+x[1]+'</dd>'; }).join("")+'</dl>'; }
function bkMb(b){ return b<1048576?Math.max(1,Math.round(b/1024))+"KB":(b/1048576).toFixed(1)+"MB"; }
function bkHm(ms){ var d=new Date(ms), p=function(n){ return ("0"+n).slice(-2); }; return p(d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes()); }

/* ── 화면 · 설정 › 일괄 저장 칩 ── */
function bkCard(){
  var top=isTop(), can=bkCan(), L=bkLast(), auto=bkAuto(), d=BK.dir, ok=d&&BK.perm==="granted", h="";
  if(!top) h+=band("info","슈퍼관리자가 저장합니다");
  h+='<div class="grid g2"><div class="card"><h2>저장 폴더</h2>'+
    '<p class="cap mb">저장 폴더 = OneDrive · 바탕 화면 · 문서 밖 PC 폴더(예: C:\\AXF 비상 백업) · 개인정보 포함</p>';
  if(!can) h+=band("info","이 브라우저는 폴더 저장이 안 됨 · 지금 저장 = zip 파일 하나 내려받기 · 자동 저장은 크롬 · 엣지에서");
  else{
    h+=bkKv([["고른 폴더", d?esc(d.name)+" "+(ok?tag("쓰기 허용","ok"):tag("다시 허용 필요","warn")):"없음"]]);
    if(d&&BK_SYNC.test(d.name)) h+='<div class="mt">'+band("warn","동기화 폴더일 수 있음 · 다른 폴더 권장")+'</div>';
    h+='<div class="btns mt"><button type="button" class="btn" onclick="bkPick()"'+(top?"":" disabled")+'>'+(d?"폴더 바꾸기":"폴더 고르기")+'</button>'+(d&&!ok?'<button type="button" class="btn pri" onclick="bkRegrant()"'+(top?"":" disabled")+'>다시 허용</button>':'')+'</div>';
  }
  h+='</div><div class="card"><h2>저장</h2>'+
    '<button type="button" class="btn big pri" id="bkGo" onclick="bkSave(\'manual\')"'+(top&&!BK.busy&&(ok||!can)?"":" disabled")+'>'+(BK.busy?esc(BK.step||"저장 중"):"지금 저장")+'</button>';
  if(can) h+='<div class="mt" style="display:flex;align-items:center;gap:8px"><b>30분마다 자동 저장</b><span class="seg" role="group" aria-label="자동 저장"><button type="button" class="'+(auto?"on":"")+'" onclick="bkSetAuto(true)"'+(top?"":" disabled")+'>켜기</button><button type="button" class="'+(auto?"":"on")+'" onclick="bkSetAuto(false)"'+(top?"":" disabled")+'>끄기</button></span></div><p class="cap">콘솔 탭이 열려 있는 동안만 · 이 PC 에 기억</p>';
  var nx=L&&L.at?L.at+BK_EVERY:0;
  h+='<div class="mt">'+bkKv([["마지막 저장", L?esc(bkHm(L.at))+" · "+esc(L.folder)+" · "+n0(L.n)+"개 · "+bkMb(L.bytes)+(L.cached?" · 5분 캐시":"")+(L.how==="auto"?" · 자동":""):"-"],
    ["다음 저장", can&&auto?(ok?esc(bkHm(Math.max(nx,Date.now())))+(nx<=Date.now()?" · 곧":""):tag("다시 허용 필요","warn")):"자동 저장 꺼짐"]].concat(BK.err?[["결과",tag("실패","warn")+" "+esc(BK.err)]]:[]))+'</div>';
  h+='<p class="cap mt">저장마다 새 폴더 AXF_백업_YYMMDD_HHmm · 옛 폴더는 그대로</p><p class="cap">서버 복구 = 복구용_서버데이터.json · 담당자 전용</p></div></div>';
  h+='<div class="card mt"><h2>저장되는 파일 <span class="cap">'+(L&&L.files?"마지막 저장 기준":"")+'</span></h2><table class="tb"><thead><tr><th>파일</th><th>내용</th><th class="n">크기</th></tr></thead><tbody>'+
    BK_FILES.map(function(f){ var s=L&&L.files?L.files[f[0]]:null; return '<tr><td><b>'+esc(f[0])+'</b></td><td class="cap">'+esc(f[1])+'</td><td class="n">'+(s!=null?bkMb(s):"-")+'</td></tr>'; }).join("")+'</tbody></table></div>';
  return h;
}
function bkPaint(){ var x=el("bkBox"); if(x) x.innerHTML=bkCard(); }

/* ── 저장 한 번 ── */
function bkInfo(){
  var u=String(BE||"").replace(/\/exec$/,"/__ax/info"); if(u===BE) return Promise.resolve("");
  var ctl=window.AbortController?new AbortController():null, to=setTimeout(function(){ if(ctl) ctl.abort(); },6000);
  return fetch(u,{ cache:"no-store", signal:ctl?ctl.signal:undefined }).then(function(r){ return r.ok?r.json():null; }).then(function(j){ clearTimeout(to); return j&&j.backend&&j.backend.sha||""; },function(){ clearTimeout(to); return ""; });
}
function bkStep(t){ BK.step=t; var b=el("bkGo"); if(b) b.textContent=t; }
function bkSave(how){
  if(!isTop()){ if(how==="manual") toast("슈퍼관리자가 저장합니다",{ bad:1 }); return Promise.resolve(false); }
  if(BK.busy) return Promise.resolve(false);
  var folder=bkCan();
  if(folder&&!(BK.dir&&BK.perm==="granted")){ if(how==="manual") toast(BK.dir?"「다시 허용」을 누르세요":"폴더를 먼저 고르세요",{ bad:1 }); return Promise.resolve(false); }
  BK.busy=how; BK.err=""; BK.step="서버에서 받는 중"; bkPaint();
  var t0=Date.now(), res=null;
  try{ lsSet("bk_run",Date.now()); }catch(e){}
  return Promise.all([call("bk_dump",{},180000), bkInfo()]).then(function(a){
    res=a[0]; var sha=a[1];
    if(!(res&&res.ok&&res.views&&res.dump)) throw new Error(why(res));
    bkStep("파일 만드는 중");
    var st=rdlStamp(res.t), name="AXF_백업_"+st.s.slice(2,4)+st.f, F=null;
    return bkBuild(res, sha).then(function(x){ F=x; bkStep("쓰는 중"); return folder?bkWrite(name, F):bkZipSave(name, F); }).then(function(nm){
      var sz={}, tot=0; F.forEach(function(f){ sz[f[0]]=f[1].length; tot+=f[1].length; });
      lsSet("bk_last",{ at:Date.now(), t:res.t, folder:nm, n:F.length, bytes:tot, files:sz, ms:Date.now()-t0, srvMs:res.ms||0, cached:res.cached?1:0, how:how });
      BK.busy=""; BK.step=""; bkPaint();
      toast("저장했습니다 · "+nm+" · "+F.length+"개 · "+bkMb(tot),{ ms:6000 });
      return true;
    });
  }).catch(function(e){
    BK.busy=""; BK.step=""; BK.err=String(e&&e.message||e).slice(0,80);
    if(e&&(e.name==="NotAllowedError"||e.name==="SecurityError")){ BK.perm="prompt"; BK.err="폴더 쓰기 허용이 풀림 · 「다시 허용」"; }
    if(how==="auto"){ lsSet("bk_auto",false); BK.err="자동 저장 멈춤 · "+BK.err; }   /* 자동 저장 실패 = 한 번 표시하고 멈춘다(다시 부르지 않는다 · 켜기나 지금 저장으로 다시) */
    bkPaint(); toast("저장하지 못했습니다 · "+BK.err,{ bad:1, ms:8000 });
    return false;
  });
}
/* 하위 폴더 · 같은 분에 두 번이면 _2 · _3 */
function bkWrite(name, F){
  var d=BK.dir;
  var pick=function(i){ var nm=i?name+"_"+(i+1):name;
    return d.getDirectoryHandle(nm).then(function(){ return i<9?pick(i+1):Promise.reject(new Error("같은 이름 폴더가 많음")); },function(e){ if(e&&e.name==="NotFoundError") return nm; throw e; }); };
  return pick(0).then(function(nm){
    return d.getDirectoryHandle(nm,{ create:true }).then(function(sub){
      return F.reduce(function(p, f){ return p.then(function(){ return sub.getFileHandle(f[0],{ create:true }).then(function(fh){ return fh.createWritable(); }).then(function(w){ return w.write(new Blob([f[1]])).then(function(){ return w.close(); }); }); }); }, Promise.resolve()).then(function(){ return nm; });
    });
  });
}
/* 폴더를 못 고르는 브라우저 · zip 한 개(압축 없음 · 폴더 이름을 앞에) */
function bkZipSave(name, F){
  return bkPack(F.map(function(f){ return [name+"/"+f[0], f[1]]; }), /^(?!.*\.xlsx$)/).then(function(z){ rdlSave(new Blob([z],{ type:"application/zip" }), name+".zip"); return name+".zip"; });
}
/* zip · files = [[이름, 글자 | Uint8Array]] · CompressionStream("deflate-raw") 가 있으면 압축(방식 8 · 엑셀 크기 약 1/10) · 없으면 저장 방식(0) · zre = 압축할 이름(기본 전부) */
function bkDeflate(u){
  if(typeof CompressionStream!=="function") return Promise.resolve(null);
  try{ var cs=new CompressionStream("deflate-raw"), w=cs.writable.getWriter(); w.write(u); w.close();
    return new Response(cs.readable).arrayBuffer().then(function(b){ return new Uint8Array(b); },function(){ return null; }); }catch(e){ return Promise.resolve(null); }
}
function bkPack(files, zre){
  var d=new Date(), dt=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1))&0xFFFF, dd=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate())&0xFFFF;
  var le=function(a, v, b){ for(var k=0;k<b;k++) a.push((v>>>(8*k))&255); };
  return Promise.all(files.map(function(f){ var raw=typeof f[1]==="string"?rdlUtf8(f[1]):f[1];
    return ((!zre||zre.test(f[0]))?bkDeflate(raw):Promise.resolve(null)).then(function(z){ var c=z&&z.length<raw.length?z:null; return { nm:rdlUtf8(f[0]), raw:raw, data:c||raw, m:c?8:0, crc:rdlCrc(raw) }; }); })).then(function(E){
    var parts=[], cen=[], off=0;
    E.forEach(function(x){ var h=[], c=[];
      le(h,0x04034b50,4); le(h,20,2); le(h,0x0800,2); le(h,x.m,2); le(h,dt,2); le(h,dd,2); le(h,x.crc,4); le(h,x.data.length,4); le(h,x.raw.length,4); le(h,x.nm.length,2); le(h,0,2);
      le(c,0x02014b50,4); le(c,20,2); le(c,20,2); le(c,0x0800,2); le(c,x.m,2); le(c,dt,2); le(c,dd,2); le(c,x.crc,4); le(c,x.data.length,4); le(c,x.raw.length,4); le(c,x.nm.length,2); le(c,0,2); le(c,0,2); le(c,0,2); le(c,0,2); le(c,0,4); le(c,off,4);
      parts.push(new Uint8Array(h), x.nm, x.data); cen.push(new Uint8Array(c), x.nm); off+=h.length+x.nm.length+x.data.length; });
    var cl=0; cen.forEach(function(x){ cl+=x.length; });
    var e=[]; le(e,0x06054b50,4); le(e,0,2); le(e,0,2); le(e,E.length,2); le(e,E.length,2); le(e,cl,4); le(e,off,4); le(e,0,2);
    var all=parts.concat(cen,[new Uint8Array(e)]), len=0; all.forEach(function(x){ len+=x.length; });
    var out=new Uint8Array(len), p=0; all.forEach(function(x){ out.set(x,p); p+=x.length; });
    return out;
  });
}

/* ── 파일 만들기 · [이름, Uint8Array] ── */
function bkBuild(r, sha){
  var V=r.views, st=rdlStamp(r.t), U=function(s){ return rdlUtf8(s); }, X=function(sh){ return bkXlsx(sh); };
  var raf=V.raffle||{ rows:[] }, fp=lkFp((raf.rows||[]).map(function(x){ return String(x.no); }));
  var rr={}; for(var q in raf) rr[q]=raf[q]; rr.fp=fp;
  var kitN="종이 추첨 키트.html", out=[];
  var files=BK_FILES.filter(function(f){ return f[0]!=="열어 보기.html"&&f[0]!=="복구용_서버데이터.json"; });
  out.push(["열어 보기.html", U(bkViewHtml(V,{ t:st.s, sha:sha, host:bkHost(), fp:fp, files:files }))]);
  if(typeof lkKitHtml==="function"&&typeof lkyKitData==="function") out.push([kitN, U(lkKitHtml(lkyKitData(raf,{ st:st, m:(raf.rows||[]).length, n:num(raf.n), fp:fp })))]);
  out.push(["행운권 번호 명단.xlsx", X([rdlSheet("raffle", rr, st), bkRafBy(raf, st)])]);
  out.push(["선착순 명단.xlsx", X([rdlSheet("fcfs", V.fcfs||{ rows:[] }, st)])]);
  out.push(["스탬프 현황.xlsx", X([bkStampSh(V.stamps, st)])]);
  out.push(["커피챗.xlsx", X([bkCcGrid(V, st), bkListSh("커피챗 명단", V.lists.cchat, st), bkListSh("아이디어 한 줄", V.lists.idea, st)])]);
  out.push(["AX 라운지.xlsx", X([bkLngGrid(V, st), bkListSh("라운지 상담 명단", V.lists.lounge, st), bkListSh("라운지 사전 명단", V.lists.lounge_pre, st)])]);
  out.push(["10F 사전 신청 · 체크인.xlsx", X([bkListSh("10F 사전 신청 명단", V.lists.pre10, st), bkListSh("10F 출석", V.lists.att10, st), bkListSh("17F 출석", V.lists.att17, st)])]);
  out.push(["설문 응답.xlsx", X(bkSurveySh(V.survey, st))]);
  out.push(["경품 · 룰렛 지급.xlsx", X([bkListSh("경품 지급 기록", V.lists.prize, st), bkRoulSh(V.stamps, st), bkListSh("옷 · 키트", V.lists.kit, st)])]);
  out.push(["타자왕 순위.xlsx", X([bkTypeSh(V.typing, st)])]);
  var dump=r.dump; dump.source=bkHost(); dump.sha=sha||""; dump.savedAt=st.s;
  out.push(["복구용_서버데이터.json", U(JSON.stringify(dump))]);
  return Promise.all(out.map(function(f){ return Promise.resolve(f[1]).then(function(b){ return [f[0], b]; }); }));
}
function bkHost(){ try{ return new URL(BE).hostname; }catch(e){ return ""; } }
function bkSh(name, title, head, w, kind, rows, ht){ return { name:name, title:title, head:head, w:w, kind:kind, rows:rows, ht:ht }; }
function bkT(name, st, n, unit){ return name+" · 기준 시각 "+st.s+" · "+n0(n)+(unit||"줄"); }
function bkListSh(name, L, st){
  var cols=(L&&L.cols)||[], rows=(L&&L.rows)||[], day=st.s.slice(0,10);
  if(!cols.length) return bkSh(name, name+" · 기준 시각 "+st.s+" · 이 저장에 없음", ["내용"], [30], ["c"], []);
  return bkSh(name, bkT(name, st, rows.length), cols.map(function(c){ return c.n; }), cols.map(function(c){ return Math.max(6, Math.min(60, Math.round((c.w||80)/7))); }),
    cols.map(function(c){ return c.type==="num"?"n":(c.w||0)>=200?"w":(c.w||0)>=140?"t":"c"; }),
    rows.map(function(r){ return cols.map(function(c){ var v=r[c.k]; return c.type==="time"?rdlHm(v, day):(v==null?"":v); }); }));
}
function bkRafBy(R, st){
  var by={}, order=[];
  (R.rows||[]).forEach(function(x){ var k=String(x.emp); if(!by[k]){ by[k]={ x:x, nos:[] }; order.push(k); } by[k].nos.push(x.no); });
  order.sort(function(a,b){ return by[b].nos.length-by[a].nos.length||(a<b?-1:1); });
  return bkSh("장수별", "행운권 장수별 · 기준 시각 "+st.s+" · "+n0(order.length)+"명 · "+n0((R.rows||[]).length)+"장", ["사번","소속","직위","성명","장수","번호"], [11,34,8,11,6,24], ["c","t","c","c","n","c"],
    order.map(function(k){ var o=by[k]; return [o.x.emp, o.x.dept, o.x.pos||"", o.x.name, o.nos.length, o.nos.join(" · ")]; }));
}
function bkStampSh(S, st){
  S=S||{ ids:[], names:{}, rows:[] }; var ids=S.ids||[], nm=S.names||{}, day=st.s.slice(0,10);
  return bkSh("스탬프 현황", bkT("스탬프 현황", st, (S.rows||[]).length, "명"), ["사번","이름","부서","개수"].concat(ids.map(function(i){ return nm[i]||i; })).concat(["행운권 장수","룰렛","최근"]),
    [10,10,24,6].concat(ids.map(function(){ return 9; })).concat([8,6,12]), ["c","c","t","n"].concat(ids.map(function(){ return "c"; })).concat(["n","c","c"]),
    (S.rows||[]).map(function(r){ return [r.emp, r.name, r.dept, r.n].concat(ids.map(function(i){ return r.ids.indexOf(i)>=0?"Y":""; })).concat([r.tk, r.roul?"Y":"", rdlHm(r.last, day)]); }));
}
function bkRoulSh(S, st){
  var rows=((S&&S.rows)||[]).filter(function(r){ return r.roul; });
  return bkSh("룰렛 사용", bkT("룰렛 사용", st, rows.length, "명"), ["사번","이름","부서","스탬프"], [10,10,28,8], ["c","c","t","n"], rows.map(function(r){ return [r.emp, r.name, r.dept, r.n]; }));
}
function bkCcGrid(V, st){
  var rows=((V.lists.cchat||{}).rows||[]).filter(function(r){ return r.round&&r.st!=="취소"&&r.st!=="대기"; }), rs={}, ts={};
  (V.am||[]).forEach(function(x){ rs[x]=1; }); rows.forEach(function(r){ rs[r.round]=1; ts[r.table||"-"]=1; });
  var R=Object.keys(rs).sort(), T=Object.keys(ts).sort(function(a,b){ return String(a).localeCompare(String(b),"ko",{ numeric:true }); });
  return bkSh("커피챗 시간표", bkT("커피챗 시간표", st, rows.length, "명"), ["회차"].concat(T.map(function(t){ return "테이블 "+t; })), [8].concat(T.map(function(){ return 22; })), ["c"].concat(T.map(function(){ return "w"; })),
    R.map(function(r){ return [r].concat(T.map(function(t){ return rows.filter(function(x){ return x.round===r&&(x.table||"-")===t; }).map(function(x){ return x.name+" ("+(x.dept||"")+") · "+x.st; }).join("\n"); })); }), 34);
}
function bkLngGrid(V, st){
  var lg=V.lng||{}, ns=lg.seats||1, head=["날짜","시간"], out=[], n=0;
  for(var i=1;i<=ns;i++) head.push("상담석 "+i);
  (lg.days||[]).forEach(function(d){ var b=(lg.by||{})[d.d]; if(!b) return;
    (b.cells||[]).forEach(function(c){ out.push([d.l, c.from+"~"+c.to].concat((c.seats||[]).map(function(s){ if(s) n++; return s?s.name+" ("+(s.dept||"")+") · "+s.st:""; }))); });
    (b.over||[]).forEach(function(s){ n++; out.push([d.l, (s.slot||"")+" 칸 밖", s.name+" ("+(s.dept||"")+") · "+s.st]); }); });
  (lg.none||[]).forEach(function(s){ n++; out.push(["", "시간 미정", s.name+" ("+(s.dept||"")+") · "+s.st]); });
  return bkSh("라운지 시간표", bkT("AX 라운지 날짜별 시간표", st, n, "명"), head, [10,12].concat(head.slice(2).map(function(){ return 26; })), ["c","c"].concat(head.slice(2).map(function(){ return "w"; })), out, 30);
}
/* 설문 · 261024 (사용자 확정 · 시안 svdash_mock) 「문항 집계」 한 장 → 5점 문항 · 선택지 문항 · 문항 원문 세 장 + 프로그램별 · 서술 응답
 * 5점 문항 = 한 줄에 한 문항 · 번호 · 문항 짧은 이름 · 응답 · 평균 · 「5점 인원」~「1점 인원」 9칸 · 「5점 비율」~「1점 비율」 9칸(% 서식 값 · 데이터 막대) · 머리 한 줄
 * 선택지 문항 = 문항 · 선택지 · 인원 · 비율(평균 없음 · 데이터 막대) · 문항 원문 = 번호 · 원문(줄바꿈)
 * o = { pre 시트 이름 앞 글자 · head 제목 앞 글자 · nm(q) 짧은 이름 · no(q, i) 번호 · keep(q) 넣을 문항 } · 실습 세션(PART 1 · survey.js)도 같은 함수 */
var BK_SV_STEPS=[5,4.5,4,3.5,3,2.5,2,1.5,1];
function bkSvNm(S){ var T=typeof SVY_T==="object"?SVY_T:{}, P={}; (S.progs||[]).forEach(function(p){ P[p.id]=p.fl+" "+p.nm; }); return function(q){ return T[q.id]||P[q.id]||q.q||q.id; }; }
function bkSvNo(q){ return String(q.id||"").toUpperCase().replace("_","-"); }
function bkSvQSh(qs, st, o){
  o=o||{}; var pre=o.pre||"", head=(o.head?o.head+" · ":"")+"기준 시각 "+st.s, nm=o.nm||function(q){ return q.q||q.id; }, no=o.no||bkSvNo, keep=o.keep||function(){ return true; };
  var L=qs.filter(keep), I={}; L.forEach(function(q,i){ I[q.id]=no(q,i); });
  var ch=function(q){ return !(Number(q.top)>=5); };
  var sc=L.filter(function(q){ return q.t!=="text"&&q.t!=="multi"&&!ch(q); }), cq=L.filter(function(q){ return q.t!=="text"&&q.t!=="multi"&&ch(q)&&(q.opts||[]).length; });
  var r3=function(a,b){ return b>0?Math.round(a/b*1000)/1000:0; }, S9=BK_SV_STEPS;
  var s1=bkSh(pre+"5점 문항", (o.head?o.head+" · ":"")+"5점 문항 · 평균 = 빈 값 뺌 · "+"기준 시각 "+st.s, ["번호","문항","응답","평균"].concat(S9.map(function(x){ return x+"점 인원"; })).concat(S9.map(function(x){ return x+"점 비율"; })),
    [8,26,7,7].concat(S9.map(function(){ return 10; })).concat(S9.map(function(){ return 10; })), ["c","t","n","d2"].concat(S9.map(function(){ return "n"; })).concat(S9.map(function(){ return "p"; })),
    sc.map(function(q){ var n=num(q.n), D=q.dist||{}; return [I[q.id], nm(q), n, q.avg==null?"":q.avg].concat(S9.map(function(x){ return num(D[x]); })).concat(S9.map(function(x){ return r3(num(D[x]), n); })); }));
  s1.fx=2; if(sc.length) s1.cf=[{ ref:rdlCol(13)+"3:"+rdlCol(21)+(sc.length+2) }];
  var r2=[]; cq.forEach(function(q){ var n=num(q.n), D=q.dist||{}; (q.opts||[]).forEach(function(op){ var c=num(D[op[0]]); r2.push([I[q.id], nm(q), op[1], c, r3(c, n)]); }); });
  var s2=bkSh(pre+"선택지 문항", (o.head?o.head+" · ":"")+"선택지 문항 · 비율 = 고른 사람 ÷ 답한 사람 · 기준 시각 "+st.s, ["번호","문항","선택지","인원","비율"], [8,26,40,7,10], ["c","t","t","n","p"], r2);
  if(r2.length) s2.cf=[{ ref:"E3:E"+(r2.length+2) }];
  var s3=bkSh(pre+"문항 원문", (o.head?o.head+" · ":"")+"문항 원문 · 기준 시각 "+st.s, ["번호","원문"], [8,90], ["c","w"], L.map(function(q){ return [I[q.id], q.q||""]; }));
  return [s1, s2, s3];
}
function bkSurveySh(S, st, o){
  S=S||{ qs:[], progs:[] }; o=o||{}; var qs=S.qs||[], tq=qs.filter(function(q){ return q.t==="text"; })[0], day=st.s.slice(0,10);
  return bkSvQSh(qs, st, { head:o.head||"설문 · 응답 "+n0(S.n)+"명(시험 사번 제외)", nm:bkSvNm(S), keep:o.keep }).concat([
    bkSh("프로그램별", "설문 프로그램별 · 기준 시각 "+st.s, ["층","프로그램","고른 사람","비율(%)","평균"], [6,40,9,9,7], ["c","t","n","n","n"], (S.progs||[]).map(function(p){ return [p.fl, p.nm, p.n, p.rate, p.avg==null?"":p.avg]; })),
    bkSh("서술 응답", "설문 서술 응답 · 기준 시각 "+st.s+" · "+n0(tq?(tq.lines||[]).length:0)+"줄", ["시각","답"], [12,90], ["c","w"], tq?(tq.lines||[]).map(function(x){ return [rdlHm(x.t, day), x.line]; }):[])]);
}
function bkTypeSh(T, st){
  var day=st.s.slice(0,10);
  return bkSh("타자왕 순위", bkT("1F 타자왕 순위", st, (T||[]).length, "명"), ["순위","사번","이름","부서","점수","정확도","타수","최대 콤보","기록 시각"], [6,10,10,24,8,8,8,9,12], ["n","c","c","t","n","n","n","n","c"],
    (T||[]).map(function(r){ return [r.rank, r.emp, r.name, r.dept, r.score, r.acc, r.hits, r.combo, rdlHm(r.ts, day)]; }));
}
/* ── 여러 장 xlsx · rosterdl.js 의 rdlX · rdlCol · 서식 RDL_STY + 줄바꿈 칸(8번째 서식 w) ── */
var BK_STY=null;
/* 261024 서식 8 = 비율(0.0% · 숫자 값 0.433) · 9 = 소수 두 자리(평균) · 칸 종류 p · d2 · 앞 0~7 번은 그대로 */
function bkSty(){ if(!BK_STY) BK_STY=RDL_STY.replace('<fonts ','<numFmts count="1"><numFmt numFmtId="164" formatCode="0.0%"/></numFmts><fonts ').replace('<cellXfs count="7">','<cellXfs count="10">').replace('</cellXfs>','<xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'+
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>'+
  '<xf numFmtId="2" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs>'); return BK_STY; }
function bkCell(ref, v, k){
  if((k==="p"||k==="d2")&&v!==""&&v!=null&&isFinite(Number(v))) return '<c r="'+ref+'" s="'+(k==="p"?8:9)+'"><v>'+Number(v)+'</v></c>';
  if(k==="p"||k==="d2") k="n";
  if(k!=="w") return rdlCell(ref, v, k); return '<c r="'+ref+'" s="7" t="inlineStr"><is><t xml:space="preserve">'+rdlX(v)+'</t></is></c>'; }
/* 데이터 막대 · sh.cf = [{ ref, min, max }](없으면 0 ~ 1) · 엑셀 규격 순서 = mergeCells 뒤 · printOptions 앞 */
function bkCf(sh){ if(!sh.cf||!sh.cf.length) return "";
  return sh.cf.map(function(c,i){ return '<conditionalFormatting sqref="'+c.ref+'"><cfRule type="dataBar" priority="'+(i+1)+'"><dataBar><cfvo type="num" val="'+(c.min==null?0:c.min)+'"/><cfvo type="num" val="'+(c.max==null?1:c.max)+'"/><color rgb="FF8EA0C8"/></dataBar></cfRule></conditionalFormatting>'; }).join(""); }
function bkSheetXml(sh){
  var nc=Math.max(1,sh.head.length), last=rdlCol(nc-1), nr=sh.rows.length+2, x=[];
  x.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">');
  x.push('<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:'+last+nr+'"/>');
  if(sh.fx){ var tl=rdlCol(sh.fx)+"3"; x.push('<sheetViews><sheetView workbookViewId="0"><pane xSplit="'+sh.fx+'" ySplit="2" topLeftCell="'+tl+'" activePane="bottomRight" state="frozen"/><selection pane="topRight"/><selection pane="bottomLeft"/><selection pane="bottomRight" activeCell="'+tl+'" sqref="'+tl+'"/></sheetView></sheetViews>'); }   /* 261024 sh.fx = 앞 칸 고정(없으면 예전 그대로) */
  else x.push('<sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A3" sqref="A3"/></sheetView></sheetViews>');
  x.push('<sheetFormatPr defaultRowHeight="18"/><cols>'+sh.w.map(function(w,i){ return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>'; }).join("")+'</cols><sheetData>');
  x.push('<row r="1" ht="24" customHeight="1"><c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">'+rdlX(sh.title)+'</t></is></c></row>');
  x.push('<row r="2" ht="20" customHeight="1">'+sh.head.map(function(h,i){ return '<c r="'+rdlCol(i)+'2" s="2" t="inlineStr"><is><t>'+rdlX(h)+'</t></is></c>'; }).join("")+'</row>');
  sh.rows.forEach(function(r,ri){ var n=ri+3; x.push('<row r="'+n+'"'+(sh.ht?' ht="'+sh.ht+'" customHeight="1"':'')+'>'+r.map(function(v,i){ return bkCell(rdlCol(i)+n, v, sh.kind[i]); }).join("")+'</row>'); });
  x.push('</sheetData><mergeCells count="1"><mergeCell ref="A1:'+last+'1"/></mergeCells>'+bkCf(sh));
  x.push('<printOptions horizontalCentered="1"/><pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.25" footer="0.25"/>');
  x.push('<pageSetup paperSize="9" orientation="'+(nc>8?"landscape":"portrait")+'" fitToWidth="1" fitToHeight="0"/>');
  x.push('<headerFooter><oddHeader>&amp;L'+rdlX(sh.name)+'</oddHeader><oddFooter>&amp;C&amp;P / &amp;N</oddFooter></headerFooter></worksheet>');
  return x.join("");
}
function bkXlsx(shs){
  var ns=shs.map(function(s,i){ return rdlX(String(s.name).replace(/[\[\]:*?\/\\]/g," ").slice(0,31)||("시트"+(i+1))); });
  var ct='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'+
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+shs.map(function(s,i){ return '<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join("")+
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
  var rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  var wb='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>'+
    ns.map(function(n,i){ return '<sheet name="'+n+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>'; }).join("")+'</sheets><definedNames>'+
    ns.map(function(n,i){ return '<definedName name="_xlnm.Print_Titles" localSheetId="'+i+'">\''+n+'\'!$2:$2</definedName>'; }).join("")+'</definedNames></workbook>';
  var wrels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+shs.map(function(s,i){ return '<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>'; }).join("")+
    '<Relationship Id="rId'+(shs.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
  var files=[["[Content_Types].xml",ct],["_rels/.rels",rels],["xl/workbook.xml",wb],["xl/_rels/workbook.xml.rels",wrels],["xl/styles.xml",bkSty()]];
  shs.forEach(function(s,i){ files.push(["xl/worksheets/sheet"+(i+1)+".xml", bkSheetXml(s)]); });
  return bkPack(files);
}

/* ── 30분 자동 · 30초마다 본다(숨은 탭은 브라우저가 1분에 한 번으로 늦춘다) ── */
function bkTick(){
  if(!bkAuto()||BK.busy||!authed()||!isTop()||!bkCan()||!BK.dir) return;
  bkPermQ().then(function(p){
    if(p!=="granted"){ if(S.tab==="log") bkPaint(); return; }
    var L=bkLast(), run=Number(lsGet("bk_run",0))||0;
    if(L&&Date.now()-L.at<BK_EVERY) return;
    if(Date.now()-run<5*60000&&!(L&&L.at>=run)) return;   /* 다른 탭이 지금 저장 중 */
    bkSave("auto");
  });
}
/* 설정 탭 칩 · 기존 화면(setting.js)에 「일괄 저장」 하나를 더한다 */
(function(){ if(typeof LG_SUBS==="undefined"||!window.SCREENS||!SCREENS.log) return;
  if(!LG_SUBS.some(function(x){ return x[0]==="bk"; })) LG_SUBS.push(["bk","일괄 저장"]);
  var sc=SCREENS.log, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return lgSub()==="bk"?[]:n0_(); };
  sc.mount=function(vb){ if(lgSub()!=="bk") return m0(vb); var c=el("phCap"); if(c) c.textContent="비상 백업 · 엑셀 · 오프라인 보기 · 복구용 파일을 이 PC 폴더에 저장"; vb.innerHTML=chipsH(LG_SUBS,"bk")+'<div id="bkBox"></div>'; bkPaint(); };
  sc.paint=function(vb){ if(lgSub()!=="bk") return p0(vb); bkPaint(); };
  bkInit(); setInterval(bkTick, 30000);
})();
