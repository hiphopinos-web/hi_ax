/* AXF CONTROL v2 · 시험 서버 보조 화면 (261020)
 * 주소에 ?srv=qa&sim=1(시험 서버) 또는 로컬 QA 서버(assets/server.js 가 127.0.0.1 주소를 줄 때) + sim=1 일 때만 · 입장 화면 없이 보조 칸 한 장만 그린다
 * 운영 주소(srv 없음)에서는 이 파일이 아무것도 바꾸지 않는다 · 서버 = dset_open(POST · 서버가 시험 서버인지 다시 본다)
 * 화면 글 · 칸 모양은 dset.js 그대로 · 글은 서버 응답 tx */
var DSO=/[?&]sim=1(&|$)/.test(location.search)&&(BE_QA||(typeof AXF_SERVER==="string"&&BE===AXF_SERVER&&/^http:\/\/127\.0\.0\.1:\d+\/exec$/.test(BE)));
function dsoCall(p, ms){ var q={ aemp:"", tok:"" }; for(var k in p) q[k]=p[k]; return call("dset_open",q,ms||60000); }
function dsoTake(v){ if(v&&v.tx&&typeof v.tx==="object") DS.L={ ok:true, sim:1, tx:v.tx }; return v; }
if(DSO){
  DS.L={ ok:true, sim:1, tx:null };
  dsTop=function(){ return true; };
  dsLoad=function(){ dsPaint(); };
  dsPaint=function(){
    var x=el("dsBox"); if(!x) return;
    if(dsTx()){ x.innerHTML=dsSimCard(); return; }
    var V=DS.sim;
    x.innerHTML='<div class="card"><h2>AXF CONTROL</h2><p class="cap mt">'+esc(!V?"불러오는 중":V.reason==="env"?"이 서버에서는 열리지 않습니다":why(V))+'</p></div>';
  };
  dsSimView=function(){ return dsoCall({ op:"view" }).then(function(v){ DS.sim=dsoTake(v); dsPaint(); return v; }); };
  dsSim=function(op){
    var n=Math.floor(Number((el("dsN")||{}).value)||30); DS.simN=n;
    if(op==="seed"&&!(n>=1&&n<=500)){ toast(dsT("sNErr"),{ bad:1 }); return; }
    DS.simBusy=op; dsPaint();
    dsoCall({ op:op, n:String(n) }).then(function(v){
      DS.simBusy=""; if(v&&v.ok) DS.sim=dsoTake(v); dsPaint();
      toast(v&&v.ok?(op==="seed"?dsT("tSeed",n0(v.a),n0(v.b)):op==="redo"?dsT("tRedo"):dsT("tWipe")):dsT("tFail",v&&v.reason==="env"?dsT("sEnv"):why(v)),{ bad:!(v&&v.ok) });
    });
  };
  dsSimRun=function(){
    var V=DS.sim; if(!V||!V.rows||!V.rows.length) return;
    DS.simBusy="run"; DS.simLog=""; dsPaint();
    dsoCall({ op:"run" },90000).then(function(v){
      DS.simBusy=""; if(v&&v.ok) DS.sim=dsoTake(v); dsPaint();
      var g=v&&v.ok&&!v.aw&&!v.fail;
      toast(v&&v.ok?(g?dsT("tDone"):dsT("tDoneX")):dsT("tFail",why(v)),{ bad:!g });
    });
  };
  boot=function(){
    el("envTx").textContent=envName(); qaBand();
    ["gq","upd","tabs"].forEach(function(id){ var x=el(id); if(x) x.style.display="none"; });
    el("view").innerHTML='<div id="dsBox"></div>';
    dsPaint(); dsSimView();
  };
}
