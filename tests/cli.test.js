const GameEngine = require('../src/engine/GameEngine');
const { formatStatus, formatWorld, parseCommand } = require('../src/cli');

describe('CLI helpers', () => {
  it('normaliza comandos digitados no terminal', () => {
    expect(parseCommand('  START  ')).toBe('start');
    expect(parseCommand('BrAkE')).toBe('brake');
  });

  it('formata o status atual do jogo', () => {
    const engine = new GameEngine();
    const status = formatStatus(engine);

    expect(status).toContain('Estado atual: menu');
    expect(status).toContain('Velocidade: 0');
    expect(status).toContain('Integridade: 100');
  });

  it('mostra obstáculos e paradas ativas no mapa textual', () => {
    const engine = new GameEngine();
    engine.level.pedestrians = [{ position: 4 }];
    engine.level.cyclists = [{ position: 9 }];
    engine.level.stopZones = [{ position: 12, boardingRequired: true }];

    const world = formatWorld(engine);

    expect(world).toContain('Pedestres: 4');
    expect(world).toContain('Ciclistas: 9');
    expect(world).toContain('Paradas à frente: 12 (embarque)');
  });
});