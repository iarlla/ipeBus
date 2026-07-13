const Level = require('../src/engine/Level');

describe('Level', () => {
  it('inicializa as 8 fases do jogo', () => {
    const level = new Level();

    expect(level.getTotalPhases()).toBe(8);
    expect(level.phases).toHaveLength(8);
    expect(level.getCurrentPhase()).toEqual({
      id: 1,
      name: 'Fase 1',
      duration: 60,
      trafficLightInterval: 10,
      maxCurveSpeed: 12,
    });
    expect(level.phases[7]).toEqual({
      id: 8,
      name: 'Fase 8',
      duration: 130,
      trafficLightInterval: 17,
      maxCurveSpeed: 6,
    });
  });

  it('alterna o semáforo com intervalo dinâmico da fase atual', () => {
    const level = new Level();

    expect(level.trafficLight).toBe('green');
    expect(level.tick(10)).toBe('red');
    expect(level.tick(10)).toBe('green');

    level.currentPhaseIndex = 1;

    expect(level.getCurrentTrafficLightInterval()).toBe(11);
  });

  it('detecta colisões com pedestres e ciclistas e invasão de ciclovia', () => {
    const level = new Level();

    expect(level.detectPedestrianCollision(5, 5)).toBe(true);
    expect(level.detectPedestrianCollision(5, 6)).toBe(false);

    expect(level.detectCyclistCollision(8, 8)).toBe(true);
    expect(level.detectCyclistCollision(8, 3)).toBe(false);

    expect(level.isCyclingLaneViolation('cycleway')).toBe(true);
    expect(level.isCyclingLaneViolation('road')).toBe(false);
  });

  it('gera e avança pedestres e ciclistas nas fases 2 a 4', () => {
    const level = new Level();
    level.currentPhaseIndex = 1;

    const obstacles = level.advanceDynamicObstacles(2);

    expect(obstacles.pedestrians).toHaveLength(1);
    expect(obstacles.cyclists).toHaveLength(1);
    expect(obstacles.pedestrians[0].position).toBe(2);
    expect(obstacles.cyclists[0].position).toBe(9);

    level.tick(1);

    expect(level.pedestrians[0].position).toBe(3);
    expect(level.cyclists[0].position).toBe(11);
  });

  it('gera zonas de parada ativas e exige ônibus parado para embarque', () => {
    const level = new Level();
    level.currentPhaseIndex = 2;

    const stopZones = level.advanceStopZones(2);

    expect(stopZones).toHaveLength(1);
    expect(stopZones[0]).toEqual({
      id: 1,
      position: 12,
      boardingRequired: true,
      active: true,
    });

    expect(level.requiresFullStopAtZone(0, stopZones[0])).toBe(true);
    expect(level.requiresFullStopAtZone(2, stopZones[0])).toBe(false);
  });

  it('gera solicitações de desembarque nas fases 7 e 8', () => {
    const level = new Level();
    level.currentPhaseIndex = 6;

    const passengers = level.advanceTransitPassengerRequests(2);

    expect(passengers).toHaveLength(1);
    expect(passengers[0]).toMatchObject({
      name: 'Carlos',
      destination: 'Terminal',
      onboard: true,
      disembarkRequested: true,
      requestedStop: 'Terminal',
      requestAge: 2,
    });

    level.tick(1);

    expect(level.transitPassengers[0].requestAge).toBe(3);
  });
});
