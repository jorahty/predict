const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static('public'));

const { Engine, Runner, Body,
  Vertices, Events, Bodies, Composite } = require('matter-js');

const { createEngine, addPlayer,
  movePlayer, setControls } = require('./public/engine');

// create an engine
const engine = createEngine(Engine, Runner, Composite, Bodies),
  world = engine.world;

io.on('connection', socket => {

  // add player
  const player = addPlayer(null, world, Bodies, Composite, Vertices);

  socket.emit('label', player.label); // send label

  socket.on('input', code => setControls(player.controls, code)); // listen for input

  // move players according to controls
  Events.on(engine, 'beforeUpdate', () => movePlayer(player, Body));

  socket.on('disconnect', () => Composite.remove(world, [player])); // remove player

  socket.on('ping', callback => callback());
});

// emit regular updates to clients
setInterval(() => {

  let gamestate = world.bodies.slice(4).map(body => ({
    l: body.label,
    x: Math.round(body.position.x),
    y: Math.round(body.position.y),
    p: Math.round(body.angle * 100) / 100,
    X: Math.round(body.velocity.x * 100) / 100,
    Y: Math.round(body.velocity.y * 100) / 100,
    a: Math.round(body.angularVelocity * 100) / 100,
    t: body.controls.translate,
    r: body.controls.rotate,
  })); // instead of round use sigfig function

  io.volatile.emit('update', gamestate);

}, 1000 / 30);

http.listen(port, () => console.log(`Listening on port ${port}`));
