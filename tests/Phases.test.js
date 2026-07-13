const Bus = require('../src/engine/Bus');
const Level = require('../src/engine/Level');
const GameEngine = require('../src/engine/GameEngine');

describe('Simulação de todas as 8 fases (ipeBus)', () => {
  let engine;

  beforeEach(() => {
    engine = new GameEngine({
      bus: new Bus(),
      level: new Level(),
    });
    engine.start();
  });

  it('Fase 1: Rota curta com foco em semáforos', () => {
    const phase = engine.level.getCurrentPhase();
    expect(phase.id).toBe(1);
    expect(phase.name).toBe('Fase 1');
    expect(phase.duration).toBe(60);

    expect(engine.level.trafficLight).toBe('green');
    engine.level.tick(10);
    expect(engine.level.trafficLight).toBe('red');
  });

  it('Fase 2: Faixas de pedestre com trânsito de pedestres intermitente', () => {
    engine.level.currentPhaseIndex = 1;
    const phase = engine.level.getCurrentPhase();
    expect(phase.id).toBe(2);

    engine.level.advanceDynamicObstacles(1);
    expect(engine.level.pedestrians.length).toBeGreaterThan(0);
    expect(engine.level.cyclists.length).toBeGreaterThan(0);
  });

  it('Fase 3: Pontos de ônibus com embarque obrigatório de passageiros', () => {
    engine.level.currentPhaseIndex = 2;
    const phase = engine.level.getCurrentPhase();
    expect(phase.id).toBe(3);

    engine.level.advanceStopZones(1);
    expect(engine.level.stopZones.length).toBeGreaterThan(0);
    expect(engine.level.stopZones[0].boardingRequired).toBe(true);
  });

  it('Fase 4: Ciclovia lateral com tráfego de ciclistas', () => {
    engine.level.currentPhaseIndex = 3;
    const phase = engine.level.getCurrentPhase();
    expect(phase.id).toBe(4);

    engine.level.advanceDynamicObstacles(1);
    expect(engine.level.cyclists.length).toBeGreaterThan(0);
  });

  it('Fase 5: Rota com tráfego pesado exigindo frenagens rápidas', () => {
    engine.level.currentPhaseIndex = 4;
    const phase = engine.level.getCurrentPhase();
    expect(phase.id).toBe(5);

    engine.bus.speed = 10;
    engine.update(1);
    expect(engine.level.heavyTrafficCars.length).toBeGreaterThan(0);
    expect(engine.bus.speed).toBeLessThan(10);
  });

  it('Fase 6: Rota sinuosa com curvas de limite seguro de velocidade', () => {
    engine.level.currentPhaseIndex = 5;
    const phase = engine.level.getCurrentPhase();
    expect(phase.id).toBe(6);

    const maxSafeSpeed = engine.level.getCurrentMaxCurveSpeed();
    expect(maxSafeSpeed).toBeLessThan(12);

    engine.bus.speed = maxSafeSpeed - 2;
    const ok = engine.bus.validateCurve(engine.level);
    expect(ok).toBe(true);
    expect(engine.bus.isGameOver).toBe(false);

    engine.bus.speed = maxSafeSpeed + 5;
    const crash = engine.bus.validateCurve(engine.level);
    expect(crash).toBe(false);
    expect(engine.bus.isGameOver).toBe(true);
  });

  it('Fase 7: Paradas com desembarques solicitados pelos passageiros', () => {
    engine.level.currentPhaseIndex = 6;
    const phase = engine.level.getCurrentPhase();
    expect(phase.id).toBe(7);

    engine.level.advanceTransitPassengerRequests(1);
    expect(engine.level.transitPassengers.length).toBeGreaterThan(0);
    expect(engine.level.transitPassengers[0].disembarkRequested).toBe(true);
  });

  it('Fase 8: Teste final combinando todas as mecânicas', () => {
    engine.level.currentPhaseIndex = 7;
    const phase = engine.level.getCurrentPhase();
    expect(phase.id).toBe(8);
    expect(phase.duration).toBe(130);

    engine.level.advanceTransitPassengerRequests(1);

    expect(engine.level.transitPassengers.length).toBeGreaterThan(0);
    expect(engine.level.getCurrentMaxCurveSpeed()).toBe(6);
  });
});
