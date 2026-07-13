const Bus = require('../src/engine/Bus');
const GameEngine = require('../src/engine/GameEngine');

describe('GameEngine', () => {
  it('controla a transição entre menu, gameplay, garagem e game over', () => {
    const engine = new GameEngine();

    expect(engine.state).toBe('menu');

    expect(engine.start()).toBe('gameplay');
    expect(engine.running).toBe(true);

    expect(engine.openGarage()).toBe('garage');
    expect(engine.running).toBe(false);

    expect(engine.gameOver()).toBe('gameover');
    expect(engine.running).toBe(false);
  });

  it('acumula o tempo lógico do jogo durante a atualização', () => {
    const engine = new GameEngine({
      level: {
        tick: jest.fn(() => 'green'),
        isFinished: jest.fn(() => false),
      },
      bus: {
        update: jest.fn(),
        speed: 0,
        health: 100,
        applyRedLightPenalty: jest.fn(),
      },
    });

    engine.start();
    engine.update(3);

    expect(engine.gameClock).toBe(3);
  });

  it('encerra o jogo imediatamente quando uma parada obrigatória é ignorada', () => {
    const engine = new GameEngine();

    engine.start();
    engine.startMandatoryStop();

    expect(engine.handleCommand('skipstop')).toBe('gameover');
    expect(engine.state).toBe('gameover');
    expect(engine.running).toBe(false);
  });

  it('aciona game over ao atravessar uma parada obrigatória sem parar', () => {
    const bus = new Bus({ speed: 2, health: 100 });
    const level = {
      tick: jest.fn(() => 'green'),
      isFinished: jest.fn(() => false),
    };
    const engine = new GameEngine({ bus, level });

    engine.start();
    engine.startMandatoryStop({ position: 10, boardingRequired: true });

    expect(engine.update(1)).toBe('gameover');
    expect(engine.state).toBe('gameover');
    expect(engine.running).toBe(false);
  });

  it('processa tarifas, reparos e compra de upgrades', () => {
    const engine = new GameEngine({ bus: new Bus() });

    expect(engine.collectFare(25)).toBe(25);
    expect(engine.payRepairCost(10)).toBe(15);

    expect(engine.purchaseUpgrade('brakes', 12)).toBe(true);
    expect(engine.balance).toBe(3);
    expect(engine.upgradesPurchased).toContain('brakes');
    expect(engine.bus.upgrades).toContain('brakes');

    expect(engine.purchaseUpgrade('engine', 5)).toBe(false);
    expect(engine.balance).toBe(3);
  });

  it('exibe o catálogo da garagem e compra um item com saldo suficiente', () => {
    const engine = new GameEngine({ bus: new Bus() });

    expect(engine.openGarage()).toBe('garage');
    expect(engine.getGarageCatalog()).toHaveLength(3);

    engine.collectFare(12);

    expect(engine.buyGarageItem('brakes')).toBe(true);
    expect(engine.balance).toBe(0);
    expect(engine.bus.upgrades).toContain('brakes');
    expect(engine.handleCommand('garagecatalog')).toHaveLength(3);
  });

  it('salva e restaura o progresso da garagem', () => {
    const savedGarage = {
      garage: {
        balance: 18,
        upgradesPurchased: ['tires'],
        busUpgrades: ['tires'],
        state: 'garage',
      },
    };
    const persistence = {
      saveGarageProgress: jest.fn(),
      loadGarageProgress: jest.fn(() => savedGarage.garage),
    };
    const engine = new GameEngine({ bus: new Bus(), persistence });

    engine.collectFare(18);
    engine.purchaseUpgrade('tires', 10);
    engine.saveGarageProgress('garage.json');

    expect(persistence.saveGarageProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        balance: 8,
        upgradesPurchased: ['tires'],
        busUpgrades: ['tires'],
        state: 'menu',
      }),
      'garage.json',
    );

    expect(engine.loadGarageProgress('garage.json')).toEqual(savedGarage.garage);
    expect(engine.balance).toBe(18);
    expect(engine.bus.upgrades).toContain('tires');
    expect(engine.state).toBe('garage');
  });

  it('reduz a velocidade do ônibus quando a fase 5 ativa o tráfego pesado', () => {
    const bus = new Bus({ speed: 10, health: 100 });
    const level = new (require('../src/engine/Level'))();
    level.currentPhaseIndex = 4;
    const engine = new GameEngine({ bus, level });

    engine.start();
    engine.update(1);

    expect(level.heavyTrafficCars).toHaveLength(1);
    expect(bus.speed).toBe(6.9);
  });

  it('aplica penalidade quando o ônibus avança no sinal vermelho', () => {
    const bus = new Bus({ speed: 6, health: 100 });
    const level = {
      tick: jest.fn(() => 'red'),
      isFinished: jest.fn(() => false),
    };
    const engine = new GameEngine({ bus, level });

    engine.start();

    expect(engine.update(1)).toBe('gameplay');
    expect(level.tick).toHaveBeenCalledWith(1);
    expect(bus.health).toBe(90);
    expect(bus.speed).toBe(5.9);
  });
});
