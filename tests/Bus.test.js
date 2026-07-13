const Bus = require('../src/engine/Bus');
const Level = require('../src/engine/Level');

describe('Bus', () => {
  it('inicializa os atributos base do ônibus', () => {
    const bus = new Bus();

    expect(bus.y).toBe(0);
    expect(bus.speed).toBe(0);
    expect(bus.integrity).toBe(100);
    expect(bus.health).toBe(100);
    expect(bus.upgrades).toEqual([]);
  });

  it('acelera, freia e aciona o efeito de frenagem brusca nos passageiros', () => {
    const bus = new Bus({
      speed: 10,
      maxSpeed: 12,
      passengers: [{ name: 'Ana' }],
    });
    const passengerImpactSpy = jest.spyOn(bus, '_affectPassengers');

    expect(bus.accelerate(5)).toBe(12);
    expect(bus.speed).toBe(12);

    expect(bus.brake(4)).toBe(8);
    expect(bus.speed).toBe(8);

    expect(bus.hardBrake(5)).toBe(3);
    expect(passengerImpactSpy).toHaveBeenCalledTimes(1);
    expect(bus.passengers).toHaveLength(1);

    passengerImpactSpy.mockRestore();
  });

  it('ajusta a velocidade de forma linear e aplica dano corretamente', () => {
    const bus = new Bus({ speed: 4, maxSpeed: 10, integrity: 80 });

    expect(bus.setSpeed(7)).toBe(7);
    expect(bus.setSpeed(15)).toBe(10);
    expect(bus.takeDamage(12)).toBe(68);
    expect(bus.applyRedLightPenalty(8)).toBe(60);
    expect(bus.health).toBe(60);
  });

  it('conta atropelamentos e aciona game over no limite máximo', () => {
    const bus = new Bus();

    expect(bus.registerRunover()).toBe(1);
    expect(bus.isGameOver).toBe(false);

    expect(bus.registerRunover()).toBe(2);
    expect(bus.isGameOver).toBe(false);

    expect(bus.registerRunover()).toBe(3);
    expect(bus.isGameOver).toBe(true);
  });

  it('entra em game over ao fazer curva acima da velocidade segura', () => {
    const bus = new Bus({ speed: 14, integrity: 100 });

    expect(bus.enterCurve(10)).toBe(false);
    expect(bus.isGameOver).toBe(true);
    expect(bus.health).toBe(80);
  });

  it('valida a curva usando o limite seguro da fase atual', () => {
    const bus = new Bus({ speed: 11 });
    const level = new Level();

    expect(bus.validateCurve(level)).toBe(true);

    level.currentPhaseIndex = 5;
    bus.setSpeed(7);

    expect(bus.validateCurve(level)).toBe(true);
  });
});
