/* AXF CONTROL v2 · 17F 입구 럭키드로우 체크인 시작 승인 (261022 사용자 「체크인 시작도 슈퍼관리자가 승인해야 되고, 안 하면 안 되는 걸로」)
 * 서버 draw_start(POST · 슈퍼관리자만 · on 1 = 시작 · on 0 = 시작 취소 · 체크인 0명일 때만) · 상태 = draw_stats · draw_board 의 startAt · why · recv
 * 쓰는 곳 = lkui.js 「2. 체크인」 · drawset.js 「17F 입구 체크인」 · dtwo.js 「추첨 당일 점검」 줄 · 슈퍼관리자가 아닌 입장은 단추 없이 보기만
 * 서버가 옛 판(startAt 없음)이면 dsInfo = null · 화면은 옛 표시 그대로 */
var DS_WHY={ super:"슈퍼관리자만 체크인을 시작 · 취소할 수 있습니다", rows:"체크인한 사람이 있어 시작을 취소할 수 없습니다", post:"요청 방식이 맞지 않습니다 · 새로고침 뒤 다시", param:"요청 값이 올바르지 않습니다", pinwho:"사번으로 들어온 콘솔에서만 됩니다" };
function dsSrc(d,b){ return d&&d.ok!==false&&("startAt" in d)?d:b&&("startAt" in b)?b:null; }
function dsMd(day){ var m=String(day||"").match(/^\d{4}-(\d{2})-(\d{2})$/); return m?(+m[1])+"/"+(+m[2]):""; }
function dsToday(){ var t=srvNow(); return t.getFullYear()+"-"+("0"+(t.getMonth()+1)).slice(-2)+"-"+("0"+t.getDate()).slice(-2); }
function dsInfo(d,b){
  var x=dsSrc(d,b); if(!x) return null;
  var day=String((d&&d.day)||(b&&b.day)||""), st=(b&&b.start)||hm(String((d&&d.win)||"").split("-")[0])||"16:40";
  return { at:String(x.startAt||""), why:String(x.why||""), recv:!!x.recv, day:day, st:st };
}
/* 마감이 아닐 때의 상태 · wait 시작 전 · pre 시작됨(날짜 · 시간 전) · after 시작됨(날짜 지남) · open 받는 중 · null = 옛 서버 */
function dsCk(d,b,n){
  var i=dsInfo(d,b); if(!i) return null;
  var md=dsMd(i.day), when=(md?md+" ":"")+i.st;
  if(!i.at) return { k:"wait", t:"시작 전 · 슈퍼관리자 승인 필요", s:"시작 전에는 QR 을 찍어도 체크인되지 않음 · "+when+" 전에 「체크인 시작」", n:n };
  var ap="승인 "+hm(i.at);
  if(i.why==="nocode") return { k:"after", t:"시작됨 · 받지 않음", s:"서버 추첨 코드 없음 · "+ap, n:n };
  if(i.why==="day"&&i.day&&dsToday()>i.day) return { k:"after", t:"시작됨 · 받지 않음", s:"체크인 날짜 "+md+" · "+ap, n:n };
  if(i.why==="day"||i.why==="time") return { k:"pre", t:"시작됨 · "+when+"부터 받음", s:ap+" · 끝 시각 없음 · 17:13쯤 「체크인 마감」", n:n };
  if(i.recv) return { k:"open", t:"받는 중 · "+n0(n)+"명", s:ap+" · 시작 "+i.st+" · 끝 시각 없음 · 17:13쯤 「체크인 마감」", n:n };
  return { k:"after", t:"받지 않음", s:ap, n:n };
}
/* 시작 · 시작 취소 단추 · big = 첫 화면 큰 단추 */
function dsBtnH(c, big){
  if(!c) return "";
  if(c.k==="wait") return isTop()?'<button class="btn pri'+(big?' big mt lku-go':' sm')+'" type="button" onclick="dsStart(1)">체크인 시작</button><p class="cap mt4">누르면 확인 창 · 시작하지 않으면 체크인을 받지 않음</p>':'<p class="cap mt">슈퍼관리자가 시작 · 이 입장은 보기만</p>';
  if((c.k==="pre"||c.k==="after")&&!num(c.n)&&isTop()) return '<div class="btns mt"><button class="btn sm" type="button" style="flex:none" onclick="dsStart(0)">시작 취소</button></div><p class="cap mt4">체크인 0명일 때만 취소할 수 있음</p>';
  return "";
}
function dsAfter(r){ if(r&&r.ok&&r.code!=null) S.data.draw=r; reload(["draw"]); if(typeof lkuFresh==="function"&&el("lkuT")) lkuFresh(); else if(typeof dwsPaint==="function"&&el("dwsB")) dwsPaint(); else paint(); }
function dsStart(v){
  if(!isTop()){ toast(DS_WHY.super,{ bad:1 }); return; }
  var i=dsInfo(S.data.draw,typeof lkuB==="function"?lkuB():null)||{ day:"", st:"16:40" }, md=dsMd(i.day), when=(md?md+" ":"")+i.st;
  confirmBox({ t:v?"체크인을 시작할까요?":"체크인 시작을 취소할까요?", who:"17F 입구 럭키드로우 체크인",
    sub:v?"시작하면 지금부터 QR 체크인을 받습니다("+when+" 이후 · 날짜 · 시간 안일 때만)":"취소하면 다시 시작 전 · QR 을 찍어도 체크인되지 않음 · 체크인 0명일 때만", ok:v?"체크인 시작":"시작 취소", danger:!v,
    run:function(){ return call("draw_start",{ on:v?"1":"0" }); }, fail:function(r){ return r&&DS_WHY[r.reason]||""; },
    done:function(r){ dsAfter(r);
      toast(v?(r&&r.same?"이미 시작돼 있습니다":"체크인을 시작했습니다"):(r&&r.same?"이미 시작 전입니다":"체크인 시작을 취소했습니다"), r&&r.same?{}:{ undo:function(){ call("draw_start",{ on:v?"0":"1" }).then(function(x){ dsAfter(x); toast(x&&x.ok?"되돌렸습니다":"되돌리지 못했습니다 · "+(DS_WHY[(x||{}).reason]||why(x)),{ bad:!(x&&x.ok) }); }); } }); } });
}
