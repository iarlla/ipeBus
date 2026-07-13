const fs = require('node:fs');
const path = require('node:path');

const ENGINE_PATH = path.join(__dirname, '../src/browser/engine.js');
const MAIN_PATH = path.join(__dirname, '../src/browser/main.js');
const INDEX_PATH = path.join(__dirname, '../index.html');

describe('Portabilidade Web (Fase 6)', () => {
  it('index.html importa o motor unificado via módulo ES', () => {
    const html = fs.readFileSync(INDEX_PATH, 'utf8');

    expect(html).toContain('id="gameCanvas"');
    expect(html).toContain('dist/tailwind.css');
    expect(html).toContain('./src/browser/main.js');
    expect(html).toContain('id="modal-menu"');
    expect(html).toContain('id="modal-garage"');
    expect(html).toContain('id="modal-gameover"');
  });

  it('engine.js exporta todas as classes do motor unificado', () => {
    const source = fs.readFileSync(ENGINE_PATH, 'utf8');

    expect(source).toContain('export class Bus');
    expect(source).toContain('export class Level');
    expect(source).toContain('export class Persistence');
    expect(source).toContain('export class GameEngine');
    expect(source).toContain('export class Passenger');
    expect(source).toContain('localStorage.setItem');
    expect(source).toContain('localStorage.getItem');
  });

  it('main.js implementa loop de renderização e controles de teclado', () => {
    const source = fs.readFileSync(MAIN_PATH, 'utf8');

    expect(source).toContain('requestAnimationFrame');
    expect(source).toContain('TARGET_FPS');
    expect(source).toContain('arrowup');
    expect(source).toContain('arrowdown');
    expect(source).toContain("'w'");
    expect(source).toContain("'s'");
    expect(source).toContain('getContext');
    expect(source).toContain('_drawBus');
    expect(source).toContain('_drawTrafficLight');
    expect(source).toContain('_drawPedestrians');
    expect(source).toContain('saveGarageProgress');
    expect(source).toContain('loadGarageProgress');
  });
});
