const readline = require('readline');
const GameEngine = require('../engine/GameEngine');

function parseCommand(line) {
  return String(line || '')
    .trim()
    .toLowerCase();
}

function formatStatus(engine) {
  return [
    `Estado atual: ${engine.state}`,
    `Velocidade: ${engine.bus.speed}`,
    `Integridade: ${engine.bus.health}`,
  ].join('\n');
}

function formatWorld(engine) {
  const pedestrians = engine.level.pedestrians || [];
  const cyclists = engine.level.cyclists || [];
  const stopZones = engine.level.stopZones || [];

  return [
    `Pedestres: ${pedestrians.length === 0 ? 'nenhum' : pedestrians.map((pedestrian) => pedestrian.position).join(', ')}`,
    `Ciclistas: ${cyclists.length === 0 ? 'nenhum' : cyclists.map((cyclist) => cyclist.position).join(', ')}`,
    `Paradas à frente: ${stopZones.length === 0 ? 'nenhuma' : stopZones.map((stopZone) => `${stopZone.position}${stopZone.boardingRequired ? ' (embarque)' : ''}`).join(', ')}`,
  ].join('\n');
}

function printHelp(write) {
  write('Comandos: start, garage, accelerate, brake, status, help, quit\n');
}

function createCli(
  engine = new GameEngine(),
  {
    input = process.stdin,
    output = process.stdout,
    readlineModule = readline,
  } = {},
) {
  const rl = readlineModule.createInterface({
    input,
    output,
  });

  rl.setPrompt('ipeBus> ');
  rl.on('line', (line) => {
    const command = parseCommand(line);

    if (command === 'help') {
      printHelp(output.write.bind(output));
    } else if (command === 'status') {
      output.write(`${formatStatus(engine)}\n`);
      output.write(`${formatWorld(engine)}\n`);
    } else {
      const state = engine.handleCommand(command);
      output.write(`Estado atual: ${state}\n`);
    }

    if (engine.state === 'gameover') {
      rl.close();
    } else {
      rl.prompt();
    }
  });

  rl.on('close', () => {
    output.write('Encerrando o jogo.\n');
  });

  rl.prompt();
  return rl;
}

if (require.main === module) {
  createCli();
}

module.exports = {
  createCli,
  parseCommand,
  formatStatus,
  formatWorld,
};
