(function(exports) {

  exports.createEngine = (Engine, Runner, Composite, Bodies) => {
    const engine = Engine.create();
    engine.gravity.scale *= 0.5;
    const runner = Runner.create();
    Runner.run(runner, engine);

    Composite.add(engine.world, [
      Bodies.rectangle(400, 0, 800, 50, { isStatic: true, render: { fillStyle: '#234' } }),
      Bodies.rectangle(400, 600, 800, 50, { isStatic: true, render: { fillStyle: '#234' } }),
      Bodies.rectangle(800, 300, 50, 600, { isStatic: true, render: { fillStyle: '#234' } }),
      Bodies.rectangle(0, 300, 50, 600, { isStatic: true, render: { fillStyle: '#234' } })
    ]);

    return engine;
  };

  exports.addPlayer = (label, world, Bodies, Composite, Vertices) => {
    const arrow = Vertices.fromPath('0 80 30 0 60 80');
    const player = Bodies.fromVertices(500, 100, arrow, { friction: 0.01 });
    player.label = (!label) ? player.id : label;
    Composite.add(world, [player]);
    player.controls = { translate: false, rotate: false };
    return player;
  };

  exports.setControls = (controls, code) => {
    switch (code) {
      case 't': controls.translate = true; break;
      case 'T': controls.translate = false; break;
      case 'r': controls.rotate = true; break;
      case 'R': controls.rotate = false; break;
    }
  };

  exports.movePlayer = (player, Body) => {
    const {translate, rotate} = player.controls;
    player.torque = rotate ? 0.1 : 0;
    if (!translate) return;
    const pos = player.position;
    Body.applyForce(player, pos, {
      x: 0.005 * Math.sin(player.angle),
      y: -0.005 * Math.cos(player.angle),
    });
  };

})(typeof exports === 'undefined' ? this : exports);