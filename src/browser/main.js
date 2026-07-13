import { Bus, GameEngine, Level, Passenger, Persistence } from './engine.js';

const root = document.getElementById('game-root');
const engine = new GameEngine({
  bus: new Bus(),
  level: new Level(),
  persistence: new Persistence(),
});

engine.collectFare(10);
engine.start();

const passenger = new Passenger('Demo', 'Terminal');
passenger.board();

if (root) {
  root.innerHTML = `
    <div>
      <h2>Bootstrap do navegador ativo</h2>
      <p>Estado: ${engine.state}</p>
      <p>Saldo: ${engine.balance}</p>
      <p>Fase atual: ${engine.level.getCurrentPhase().name}</p>
      <p>Passageiro demo: ${passenger.name} para ${passenger.destination}</p>
    </div>
  `;
}

window.ipeBus = { Bus, GameEngine, Level, Passenger, Persistence, engine };