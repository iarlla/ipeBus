const Passenger = require('../src/engine/Passenger');

describe('Passenger', () => {
  it('inicializa satisfação padrão e tarifa paga', () => {
    const passenger = new Passenger('Ana', 'Centro');

    expect(passenger.name).toBe('Ana');
    expect(passenger.destination).toBe('Centro');
    expect(passenger.satisfaction).toBe(100);
    expect(passenger.farePaid).toBe(0);
    expect(passenger.onboard).toBe(false);
  });

  it('solicita e conclui desembarque coordenado', () => {
    const passenger = new Passenger('Ana', 'Centro');

    passenger.board();

    expect(passenger.requestDisembark()).toBe('Centro');
    expect(passenger.disembarkRequested).toBe(true);
    expect(passenger.completeDisembark()).toBe(false);
    expect(passenger.onboard).toBe(false);
    expect(passenger.disembarkRequested).toBe(false);
  });
});
