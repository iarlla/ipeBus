/**
 * @jest-environment jsdom
 */

const Persistence = require('../src/engine/Persistence');

describe('Persistence (localStorage — navegador offline)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('salva e carrega dados via localStorage sem arquivo', () => {
    const persistence = new Persistence({ storageKey: 'ipebus-web-save' });
    const data = { garage: { balance: 99, state: 'garage' } };

    persistence.save(data);

    expect(persistence.load()).toEqual(data);
    expect(localStorage.getItem('ipebus-web-save')).toContain('"balance": 99');
  });

  it('salva e carrega progresso da garagem de forma transparente', () => {
    const persistence = new Persistence({ storageKey: 'ipebus-garage-web' });
    const garageProgress = {
      balance: 55,
      upgradesPurchased: ['brakes', 'tires'],
      busUpgrades: ['brakes', 'tires'],
      state: 'garage',
      currentPhaseIndex: 3,
      busHealth: 85,
    };

    persistence.saveGarageProgress(garageProgress);

    expect(persistence.loadGarageProgress()).toEqual(garageProgress);
  });

  it('remove progresso do localStorage ao deletar', () => {
    const persistence = new Persistence({ storageKey: 'ipebus-delete-web' });

    persistence.save({ test: true });
    persistence.delete();

    expect(persistence.load(null, null)).toBeNull();
    expect(localStorage.getItem('ipebus-delete-web')).toBeNull();
  });
});
