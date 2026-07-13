const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Persistence = require('../src/engine/Persistence');

describe('Persistence', () => {
  it('salva e carrega dados em JSON', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ipebus-'));
    const filePath = path.join(tempDir, 'save.json');
    const persistence = new Persistence({ baseDir: tempDir });
    const data = { level: 2, score: 150 };

    persistence.save(data, filePath);

    expect(persistence.load(filePath)).toEqual(data);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('salva e carrega progresso da garagem', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ipebus-'));
    const filePath = path.join(tempDir, 'garage.json');
    const persistence = new Persistence({ baseDir: tempDir });
    const garageProgress = {
      balance: 42,
      upgradesPurchased: ['brakes'],
      busUpgrades: ['brakes'],
      state: 'garage',
    };

    persistence.saveGarageProgress(garageProgress, filePath);

    expect(persistence.loadGarageProgress(filePath)).toEqual(garageProgress);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
