/* AXF CONTROL v2 · 홈 화면에 추가(261022 사용자) · manifest.json(이 폴더 · 범위 /admin/v2/) · 서비스워커는 없다(참가자 앱 /sw.js 와 따로 · 그대로)
 * 안내 띠 = 본문 맨 위 · 안드로이드 크롬 등 설치 가능(beforeinstallprompt)할 때 [추가] · iOS 사파리 = 「공유 › 홈 화면에 추가」 한 줄
 *   설치한 앱(standalone)에서는 없음 · 설치하면(appinstalled) 사라짐 · [닫기] = 이 브라우저에서 다시 안 보임 · 넓은 PC 화면은 띄우지 않는다 */
(function(){
  var KEY="axf_v2_a2hs_off", DP=null;
  var sa=function(){ try{ return matchMedia("(display-mode: standalone)").matches||matchMedia("(display-mode: fullscreen)").matches||navigator.standalone===true; }catch(e){ return false; } };
  var ua=navigator.userAgent||"";
  var ios=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  var iosSafari=ios&&/Safari/.test(ua)&&!/CriOS|FxiOS|EdgiOS|KAKAOTALK|NAVER|Line\//.test(ua);
  var mob=function(){ try{ return matchMedia("(pointer: coarse)").matches||innerWidth<768; }catch(e){ return false; } };
  var off=function(){ try{ return localStorage.getItem(KEY)==="1"; }catch(e){ return false; } };
  function hide(){ var d=document.getElementById("a2hs"); if(d) d.remove(); }
  function show(kind){
    if(sa()||off()||document.getElementById("a2hs")) return;
    var m=document.getElementById("main"), v=document.getElementById("view"); if(!m||!v) return;
    var d=document.createElement("div"); d.id="a2hs"; d.className="band info a2hs"; d.setAttribute("role","note");
    d.innerHTML=kind==="ios"
      ?'<span class="t"><b>홈 화면에 추가</b> · 공유 › 홈 화면에 추가</span><button type="button" class="x" aria-label="홈 화면 안내 닫기">닫기</button>'
      :'<span class="t"><b>홈 화면에 AXF 관리 추가</b></span><button type="button" class="btn sm pri" id="a2hsGo">추가</button><button type="button" class="x" aria-label="홈 화면 안내 닫기">닫기</button>';
    m.insertBefore(d, v);
    d.querySelector(".x").onclick=function(){ try{ localStorage.setItem(KEY,"1"); }catch(e){} hide(); };
    var g=d.querySelector("#a2hsGo");
    if(g) g.onclick=function(){ var p=DP; if(!p){ hide(); return; } DP=null; p.prompt(); (p.userChoice||Promise.resolve({})).then(function(c){ if(c&&c.outcome==="accepted") hide(); },function(){}); };
  }
  window.addEventListener("beforeinstallprompt",function(e){ if(!mob()||sa()) return; e.preventDefault(); DP=e; show("and"); });
  window.addEventListener("appinstalled",function(){ DP=null; hide(); });
  if(iosSafari&&!sa()) show("ios");
})();
