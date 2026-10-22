'use strict';
const THEMES = [
 {id:'rdr', name:'Red Dead Redemption 2', sub:'O velho oeste espera', icon:'★', title:'Lendas do velho oeste', words:['ARTHUR','MORGAN','DUTCH','SADIE','VALENTINE','OUTLAW','CAVALO','LENNY']},
 {id:'gta', name:'Grand Theft Auto V', sub:'Bem-vindo a Los Santos', icon:'↗', title:'Pelas ruas de Los Santos', words:['TREVOR','MICHAEL','FRANKLIN','SANTOS','HEIST','GARAGEM','VINEWOOD','LESTER']},
 {id:'worlds', name:'Mundos abertos', sub:'Explore além do mapa', icon:'◎', title:'Um mapa, mil histórias', words:['ZELDA','GERALT','ALOY','ELDEN','SKYRIM','LINK','CYBERPUNK','NIGHTCITY']},
 {id:'online', name:'Arena online', sub:'Sua próxima partida', icon:'⌘', title:'Encontre seu próximo GG', words:['VALORANT','FORTNITE','MINECRAFT','ROBLOX','OVERWATCH','ROCKET','APEX','LEAGUE']}
];
const SIZE=12, DIRECTIONS=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const $=id=>document.getElementById(id);
let theme=THEMES[0], board=[], placements=[], found=new Set(), anchor=null, selection=[], hints=3, hinted=null, started=Date.now(), elapsed=0, dragging=false, moved=false;
function random(n){return Math.floor(Math.random()*n)}
function generate(words){
 for(let attempt=0;attempt<100;attempt++){
  const cells=Array(SIZE*SIZE).fill(''), placed=[];
  for(const word of [...words].sort((a,b)=>b.length-a.length)){
   const options=[];
   for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)for(const [dr,dc] of DIRECTIONS){
    const path=Array.from(word,(_,i)=>[r+dr*i,c+dc*i]);
    if(path.every(([y,x],i)=>y>=0&&y<SIZE&&x>=0&&x<SIZE&&(!cells[y*SIZE+x]||cells[y*SIZE+x]===word[i])))options.push(path.map(([y,x])=>y*SIZE+x));
   }
   if(!options.length)break;
   const path=options[random(options.length)];path.forEach((p,i)=>cells[p]=word[i]);placed.push({word,path});
  }
  if(placed.length===words.length)return {board:cells.map(c=>c||'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[random(26)]),placements:placed};
 }
 throw new Error('Não foi possível criar a grade.');
}
function line(a,b){const ar=Math.floor(a/SIZE),ac=a%SIZE,br=Math.floor(b/SIZE),bc=b%SIZE,dy=br-ar,dx=bc-ac;if(dx&&dy&&Math.abs(dx)!==Math.abs(dy))return [];return Array.from({length:Math.max(Math.abs(dx),Math.abs(dy))+1},(_,i)=>(ar+Math.sign(dy)*i)*SIZE+ac+Math.sign(dx)*i)}
function start(next=theme){theme=next;const result=generate(theme.words);board=result.board;placements=result.placements;found=new Set();anchor=null;selection=[];hints=3;hinted=null;started=Date.now();elapsed=0;dragging=false;$('timer').textContent='00:00';$('message').textContent='Selecione a primeira e a última letra de uma palavra.';$('missionLabel').textContent='MISSÃO / '+theme.name.toUpperCase();$('boardTitle').textContent=theme.title;
 $('themes').innerHTML=THEMES.map(t=>`<button class="theme ${t===theme?'active':''}" data-theme="${t.id}" aria-pressed="${t===theme}"><span class="theme-icon" aria-hidden="true">${t.icon}</span><span><strong>${t.name}</strong><small>${t.sub}</small></span></button>`).join('');
 $('grid').innerHTML=board.map((c,i)=>`<button class="cell" data-index="${i}" aria-label="${c}, linha ${Math.floor(i/SIZE)+1}, coluna ${i%SIZE+1}" tabindex="${i===0?0:-1}">${c}</button>`).join('');render();}
function render(){const occupied=new Set(placements.filter(p=>found.has(p.word)).flatMap(p=>p.path));document.querySelectorAll('.cell').forEach((el,i)=>{el.classList.toggle('found',occupied.has(i));el.classList.toggle('selected',selection.includes(i));el.classList.toggle('hinted',i===hinted)});$('words').innerHTML=theme.words.map(w=>`<div class="word ${found.has(w)?'done':''}">${w}${found.has(w)?' ✓':''}</div>`).join('');$('count').textContent=`${found.size} / ${theme.words.length}`;$('progress').style.width=`${found.size/theme.words.length*100}%`;$('hintCount').textContent=hints;$('hint').disabled=hints===0||found.size===theme.words.length;}
function finish(end){const path=line(anchor,end),text=path.map(i=>board[i]).join(''),reverse=[...text].reverse().join('');const match=placements.find(p=>p.word===text||p.word===reverse);anchor=null;selection=[];if(match){if(found.has(match.word))$('message').textContent='Você já encontrou essa! Procure o próximo objetivo.';else {found.add(match.word);hinted=null;$('message').textContent=`${match.word} encontrada. Boa, player!`;if(found.size===theme.words.length){elapsed=Math.floor((Date.now()-started)/1000);$('message').textContent=`Missão completa! Todas as palavras em ${formatTime(elapsed)}. Pronto para outra?`;}}}else $('message').textContent='Ainda não! Tente uma palavra da lista em linha reta.';render();}
function choose(i){if(found.size===theme.words.length)return;if(anchor===null){anchor=i;selection=[i];render()}else finish(i)}
function formatTime(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
$('themes').addEventListener('click',e=>{const b=e.target.closest('[data-theme]');if(b)start(THEMES.find(t=>t.id===b.dataset.theme))});
$('grid').addEventListener('pointerdown',e=>{const cell=e.target.closest('[data-index]');if(!cell||found.size===theme.words.length)return;const i=Number(cell.dataset.index);if(anchor!==null){finish(i);return}anchor=i;selection=[i];dragging=true;moved=false;render();e.preventDefault()});
window.addEventListener('pointermove',e=>{if(!dragging)return;const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-index]');if(cell&&$('grid').contains(cell)){const i=Number(cell.dataset.index);if(i!==anchor)moved=true;selection=line(anchor,i);render()}});
window.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;if(moved){const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-index]');if(cell&&$('grid').contains(cell))finish(Number(cell.dataset.index));else{anchor=null;selection=[];render()}}});
window.addEventListener('pointercancel',()=>{dragging=false;anchor=null;selection=[];render()});
$('grid').addEventListener('keydown',e=>{const cell=e.target.closest('[data-index]');if(!cell)return;const i=Number(cell.dataset.index);if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(i)}if(e.key==='Escape'){anchor=null;selection=[];render()}const steps={ArrowLeft:-1,ArrowRight:1,ArrowUp:-SIZE,ArrowDown:SIZE};if(e.key in steps){e.preventDefault();const next=i+steps[e.key];if(next<0||next>=SIZE*SIZE||(e.key==='ArrowLeft'&&i%SIZE===0)||(e.key==='ArrowRight'&&i%SIZE===SIZE-1))return;cell.tabIndex=-1;const target=$('grid').children[next];target.tabIndex=0;target.focus()}});
$('hint').addEventListener('click',()=>{if(!hints)return;const remaining=placements.filter(p=>!found.has(p.word));if(!remaining.length)return;const p=remaining[random(remaining.length)];hinted=p.path[0];hints--;$('message').textContent=`Dica: a primeira letra de ${p.word} está destacada em dourado.`;render()});
$('restart').addEventListener('click',()=>start());$('help').addEventListener('click',()=>$('helpDialog').showModal());$('closeHelp').addEventListener('click',()=>$('helpDialog').close());setInterval(()=>{if(found.size<theme.words.length)$('timer').textContent=formatTime(Math.floor((Date.now()-started)/1000))},1000);start();
