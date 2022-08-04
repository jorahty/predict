// module aliases
const Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Body = Matter.Body,
  Vertices = Matter.Vertices,
  Events = Matter.Events;

// connect to server
const socket = io();

let myLabel;
socket.on('label', l => myLabel = l);

// create an engine
const engine = createEngine(Engine, Runner, Composite, Bodies),
  world = engine.world;

// display stats
const stats = document.createElement('div');
document.body.appendChild(stats);
const tpsDisplay = document.createElement('h1');
stats.appendChild(tpsDisplay);
let tps = 0;
let tick = performance.now();
setInterval(() => tpsDisplay.textContent = `${Math.round(tps)} tps`, 1000);
const ping = document.createElement('h1');
stats.appendChild(ping);
setInterval(() => {
  const start = Date.now();
  socket.volatile.emit('ping', () => {
    const duration = Date.now() - start;
    const hue = Math.max(-2.6 * duration + 180, 0);
    const color = `hsl(${hue} 100% 50%)`;
    ping.style.color = color;
    ping.textContent = `${duration} ping`;
  });
}, 1000);

// update world.bodies according to gamestate
socket.on('update', gs => {

  // compute tps
  const now = performance.now()
  tps = 1000 / (now - tick);
  tick = now;

  for (const {l, x, y, p, X, Y, a, t, r} of gs) {

    let player = world.bodies.find(({label}) => label === l);
    
    // add player if not already in bodies
    if (!player) {
      // add player
      player = addPlayer(l, world, Bodies, Composite, Vertices);
      player.render.fillStyle = (player.label === myLabel) ? '#27c' : '#345';
    }

    // update player per gamestate
    // (consider interpolation instead of instant set)
    Body.setPosition(player, {x, y});
    Body.setAngle(player, p);
    Body.setVelocity(player, {x: X, y: Y});
    Body.setAngularVelocity(player, a);
    player.controls.translate = t;
    player.controls.rotate = r;
  }

  // remove absent players
  world.bodies.slice(4).forEach(body => {
    const player = gs.find(({l}) => l === body.label);
    if (!player) Composite.remove(world, [body])
  });
});

Events.on(engine, 'beforeUpdate', () => {
  // move players based on controls
  world.bodies.slice(4).forEach(player => movePlayer(player, Body));
});

// create a renderer
var render = Render.create({
  element: document.body,
  engine: engine,
  options: { wireframes: false, showPerformance: true },
});

// run the renderer
Render.run(render);

// upon input, toggle local controls, and ping to server

const rotate = document.createElement('button');
const translate = document.createElement('button');

rotate.textContent = 'rotate';
translate.textContent = 'translate';

document.body.appendChild(rotate);
document.body.appendChild(translate);

translate.onpointerdown = rotate.onpointerdown = (e) => input(e, true);
translate.onpointerup = rotate.onpointerup = (e) => input(e, false);

function input(e, down) {
  e.target.style.opacity = down ? 0.5 : 1;
  let code = e.target.textContent === 'translate' ? 't' : 'r';
  if (!down) code = code.toUpperCase();
  socket.volatile.emit('input', code);
  const me = world.bodies.find(({label}) => label === myLabel);
  setControls(me.controls, code);
}
