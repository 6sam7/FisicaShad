const $ = (id) => document.getElementById(id);
const mass = $("mass"), height = $("height"), gravity = $("gravity");
let elapsed = 0, running = false, frame = null, lastStamp = 0;
let samples = [];

function values() {
  return { m: Number(mass.value), h0: Number(height.value), g: Number(gravity.value) };
}
function totalTime() {
  const {h0,g} = values();
  return Math.sqrt(2*h0/g);
}
function fmt(n, digits=2) { return Number(n).toFixed(digits); }

function update() {
  const {m,h0,g} = values();
  const tMax = totalTime();
  const t = Math.min(elapsed, tMax);
  const distance = Math.min(0.5*g*t*t, h0);
  const remaining = Math.max(0, h0-distance);
  const v = g*t;
  const ep = m*g*remaining;
  const ec = 0.5*m*v*v;
  const em = m*g*h0;

  $("massValue").textContent = fmt(m,1);
  $("heightValue").textContent = fmt(h0,0);
  $("gravityValue").textContent = fmt(g,2);
  $("sceneHeight").textContent = `${fmt(h0,0)} m`;
  $("timeValue").innerHTML = `${fmt(t)} <small>s</small>`;
  $("velocityValue").innerHTML = `${fmt(v)} <small>m/s</small>`;
  $("distanceValue").innerHTML = `${fmt(distance)} <small>m</small>`;
  $("epValue").innerHTML = `${fmt(ep)} <small>J</small>`;
  $("ecValue").innerHTML = `${fmt(ec)} <small>J</small>`;
  $("emValue").innerHTML = `${fmt(em)} <small>J</small>`;
  $("epBar").style.width = `${Math.max(0,ep/em*100)}%`;
  $("ecBar").style.width = `${Math.min(100,ec/em*100)}%`;
  $("emBar").style.width = "100%";
  $("tableMass").textContent = `${fmt(m)} kg`;
  $("tableHeight").textContent = `${fmt(remaining)} m`;
  $("tableGravity").textContent = `${fmt(g)} m/s²`;
  $("tableTotal").textContent = `${fmt(tMax)} s`;
  $("tableFinal").textContent = `${fmt(Math.sqrt(2*g*h0))} m/s`;
  const travelPercent = Math.min(100, distance/h0*100);
  $("objectBall").style.top = `calc(${travelPercent}% - ${travelPercent===100 ? 26 : 0}px)`;
  if (elapsed >= tMax) {
    $("sceneStatus").textContent = "Objeto en el suelo";
    $("startBtn").textContent = "↻ Repetir caída";
  } else if (running) {
    $("sceneStatus").textContent = "Objeto en caída…";
  } else {
    $("sceneStatus").textContent = elapsed > 0 ? "Simulación pausada" : "Listo para comenzar";
  }
  drawChart(remaining, h0, m, g, em);
}

function drawChart(remaining, h0, m, g, em) {
  const canvas = $("energyChart");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(300, rect.width*dpr);
  canvas.height = 220*dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr,dpr);
  const w = canvas.width/dpr, h = 220;
  const left=38, right=12, top=12, bottom=29, plotW=w-left-right, plotH=h-top-bottom;
  ctx.clearRect(0,0,w,h);
  ctx.font="9px DM Mono, monospace"; ctx.fillStyle="#a18e92"; ctx.strokeStyle="#f0e3e4"; ctx.lineWidth=1;
  for(let i=0;i<=4;i++){
    const y=top+plotH*i/4;
    ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(w-right,y);ctx.stroke();
    ctx.fillText(`${Math.round(100-i*25)}%`,4,y+3);
  }
  const points=40;
  function line(color, fn, dash=[]){
    ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=color;ctx.lineWidth=2;
    for(let i=0;i<=points;i++){
      const x=left+plotW*i/points, fraction=i/points;
      const y=top+plotH*(1-fn(fraction));
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.stroke();ctx.setLineDash([]);
  }
  line("#e33d48", f=>f); // Potential energy remaining as height fraction
  line("#e5a34c", f=>1-f);
  line("#8e7bd0", ()=>1,[4,4]);
  const currentFraction = Math.max(0,Math.min(1,1-remaining/h0));
  ctx.fillStyle="#e33d48";ctx.beginPath();ctx.arc(left+plotW*currentFraction,top+plotH*(remaining/h0),4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#a18e92";ctx.fillText("Inicio",left,h-8);ctx.fillText("Caída",left+plotW-28,h-8);
}

function stop() {
  running=false;
  if(frame!==null) cancelAnimationFrame(frame);
  frame=null;
  $("pauseBtn").disabled=true;
  $("startBtn").disabled=false;
  update();
}
function tick(stamp) {
  if(!running)return;
  if(!lastStamp)lastStamp=stamp;
  const delta=Math.min((stamp-lastStamp)/1000,0.05);
  lastStamp=stamp;
  elapsed+=delta;
  if(elapsed>=totalTime()){elapsed=totalTime();stop();return;}
  update();
  frame=requestAnimationFrame(tick);
}
$("startBtn").addEventListener("click",()=>{
  if(elapsed>=totalTime())elapsed=0;
  if(running)return;
  running=true;lastStamp=0;
  $("startBtn").disabled=true;$("pauseBtn").disabled=false;
  $("sceneStatus").textContent="Objeto en caída…";
  frame=requestAnimationFrame(tick);
});
$("pauseBtn").addEventListener("click",stop);
$("resetBtn").addEventListener("click",()=>{
  stop();elapsed=0;mass.value=2;height.value=20;gravity.value=9.81;
  $("startBtn").textContent="▶ Iniciar caída";update();
});
[mass,height,gravity].forEach(input=>input.addEventListener("input",()=>{
  stop();elapsed=0;$("startBtn").textContent="▶ Iniciar caída";update();
}));
window.addEventListener("resize",()=>update());
update();
