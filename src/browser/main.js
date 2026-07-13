import { Bus, GameEngine, Level, Persistence } from './engine.js';

const TARGET_FPS = 60;
const FIXED_DT = 1;
const TRAFFIC_LIGHT_POSITION = 80;
const CURVE_ZONE_START = 40;
const CURVE_ZONE_END = 55;

const ACCELERATE_KEYS = new Set(['arrowup', 'w']);
const BRAKE_KEYS = new Set(['arrowdown', 's']);

class GameRenderer {
  constructor(canvas, hudElements, modals) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = hudElements;
    this.modals = modals;

    this.engine = new GameEngine({
      bus: new Bus(),
      level: new Level(),
      persistence: new Persistence(),
    });

    this.keys = new Set();
    this.lastTimestamp = 0;
    this.accumulator = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.fpsTimer = 0;
    this.handledStopZones = new Set();
    this.handledCollisions = new Set();
    this.animationId = null;
    this.inCurveZone = false;

    this._bindEvents();
    this._resizeCanvas();
    this._loadProgress();
    this._updateModals();
    this._updateHud();
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._resizeCanvas());

    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      this.keys.add(key);

      if (ACCELERATE_KEYS.has(key) || BRAKE_KEYS.has(key)) {
        event.preventDefault();
      }
    });

    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });

    this.modals.menu.startBtn.addEventListener('click', () =>
      this._startNewGame(),
    );
    this.modals.menu.continueBtn.addEventListener('click', () =>
      this._continueGame(),
    );
    this.modals.garage.continueBtn.addEventListener('click', () =>
      this._leaveGarage(),
    );
    this.modals.gameover.restartBtn.addEventListener('click', () =>
      this._startNewGame(),
    );
    this.modals.gameover.menuBtn.addEventListener('click', () =>
      this._goToMenu(),
    );

    this.modals.garage.catalog.addEventListener('click', (event) => {
      const button = event.target.closest('[data-upgrade]');
      if (!button) {
        return;
      }

      const upgradeName = button.dataset.upgrade;
      if (this.engine.buyGarageItem(upgradeName)) {
        this.engine.saveGarageProgress();
        this._renderGarageCatalog();
        this._updateHud();
      }
    });
  }

  _resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
  }

  _loadProgress() {
    const saved = this.engine.loadGarageProgress();
    this.modals.menu.continueBtn.classList.toggle('hidden', !saved);
  }

  _saveProgress() {
    this.engine.saveGarageProgress();
  }

  _resetRunState() {
    this.engine.bus.y = 0;
    this.engine.bus.speed = 0;
    this.engine.bus.isGameOver = false;
    this.engine.gameClock = 0;
    this.engine.mandatoryStopActive = false;
    this.engine.activeMandatoryStopZone = null;
    this.handledStopZones.clear();
    this.handledCollisions.clear();
    this.inCurveZone = false;
    this.engine.level.resetPhase();
  }

  _startNewGame() {
    this.engine = new GameEngine({
      bus: new Bus(),
      level: new Level(),
      persistence: new Persistence(),
    });
    this._resetRunState();
    this.engine.start();
    this._saveProgress();
    this._updateModals();
    this._startLoop();
  }

  _continueGame() {
    this._loadProgress();
    this._resetRunState();

    if (this.engine.state === 'garage') {
      this._renderGarageCatalog();
    } else {
      this.engine.start();
    }

    this._updateModals();
    this._startLoop();
  }

  _goToMenu() {
    this.engine.setState('menu');
    this._updateModals();
  }

  _leaveGarage() {
    const advanced = this.engine.level.advancePhase();

    if (!advanced) {
      this.engine.setState('menu');
      this._updateModals();
      return;
    }

    this._resetRunState();
    this.engine.bus.integrity = Math.min(100, this.engine.bus.health + 20);
    this.engine.bus.health = this.engine.bus.integrity;
    this.engine.start();
    this._saveProgress();
    this._updateModals();
  }

  _startLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.lastTimestamp = 0;
    this.accumulator = 0;
    this.animationId = requestAnimationFrame((ts) => this._loop(ts));
  }

  _loop(timestamp) {
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
    }

    const frameTime = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;
    this.accumulator += frameTime;

    const tickDuration = 1 / TARGET_FPS;

    while (this.accumulator >= tickDuration) {
      this._fixedUpdate(FIXED_DT);
      this.accumulator -= tickDuration;
      this.frameCount += 1;
      this.fpsTimer += tickDuration;

      if (this.fpsTimer >= 1) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.fpsTimer = 0;
      }
    }

    this._render();
    this._updateHud();

    if (this.engine.state === 'gameplay') {
      this.animationId = requestAnimationFrame((ts) => this._loop(ts));
    }
  }

  _applyInput() {
    if (this.engine.state !== 'gameplay') {
      return;
    }

    if ([...this.keys].some((key) => ACCELERATE_KEYS.has(key))) {
      this.engine.bus.accelerate(0.5);
    }

    if ([...this.keys].some((key) => BRAKE_KEYS.has(key))) {
      this.engine.bus.brake(0.8);
    }
  }

  _fixedUpdate(deltaTime) {
    if (this.engine.state !== 'gameplay') {
      return;
    }

    this._applyInput();

    const previousY = this.engine.bus.y;
    this.engine.bus.y += this.engine.bus.speed * deltaTime * 0.5;

    this._checkWorldCollisions(previousY);
    this._checkCurveZone();

    const previousState = this.engine.state;
    this.engine.update(deltaTime);

    if (previousState === 'gameplay' && this.engine.state === 'garage') {
      this._saveProgress();
      this._renderGarageCatalog();
      this._updateModals();
    } else if (
      previousState === 'gameplay' &&
      this.engine.state === 'gameover'
    ) {
      this._saveProgress();
      this._updateModals();
    }
  }

  _checkCurveZone() {
    const phase = this.engine.level.getCurrentPhase();
    if (phase.id < 6) {
      return;
    }

    const busY = this.engine.bus.y;
    const inZone = busY >= CURVE_ZONE_START && busY <= CURVE_ZONE_END;

    if (inZone && !this.inCurveZone) {
      this.inCurveZone = true;
      this.engine.bus.validateCurve(this.engine.level);
      if (this.engine.bus.isGameOver) {
        this.engine.gameOver();
      }
    } else if (!inZone) {
      this.inCurveZone = false;
    }
  }

  _checkWorldCollisions(previousY) {
    const busY = this.engine.bus.y;
    const level = this.engine.level;

    for (const pedestrian of level.pedestrians) {
      const key = `ped-${pedestrian.id}`;
      if (
        !this.handledCollisions.has(key) &&
        previousY < pedestrian.position &&
        busY >= pedestrian.position &&
        pedestrian.crossProgress > 0.3 &&
        pedestrian.crossProgress < 0.85
      ) {
        this.handledCollisions.add(key);
        level.pedestrians = level.pedestrians.filter(
          (p) => p.id !== pedestrian.id,
        );
        this.engine.bus.registerRunover();
        if (this.engine.bus.isGameOver) {
          this.engine.gameOver();
        }
      }
    }

    for (const cyclist of level.cyclists) {
      const key = `cyc-${cyclist.id}`;
      if (
        !this.handledCollisions.has(key) &&
        previousY < cyclist.position &&
        busY >= cyclist.position
      ) {
        this.handledCollisions.add(key);
        level.cyclists = level.cyclists.filter((c) => c.id !== cyclist.id);
        this.engine.bus.registerRunover();
        if (this.engine.bus.isGameOver) {
          this.engine.gameOver();
        }
      }
    }

    for (const stopZone of level.stopZones) {
      const key = `stop-${stopZone.id}`;
      if (
        stopZone.boardingRequired &&
        !this.handledStopZones.has(key) &&
        previousY < stopZone.position &&
        busY >= stopZone.position
      ) {
        this.handledStopZones.add(key);

        if (this.engine.bus.speed > 0) {
          this.engine.startMandatoryStop(stopZone);
          this.engine.update(0);
        } else {
          this.engine.collectFare(10);
          stopZone.active = false;
        }
      }
    }

    if (
      previousY < TRAFFIC_LIGHT_POSITION &&
      busY >= TRAFFIC_LIGHT_POSITION &&
      level.trafficLight === 'red' &&
      this.engine.bus.speed > 0
    ) {
      this.engine.bus.applyRedLightPenalty();
    }
  }

  _updateModals() {
    const state = this.engine.state;

    this.modals.menu.overlay.classList.toggle('hidden', state !== 'menu');
    this.modals.garage.overlay.classList.toggle('hidden', state !== 'garage');
    this.modals.gameover.overlay.classList.toggle(
      'hidden',
      state !== 'gameover',
    );

    if (state === 'gameover') {
      this.modals.gameover.reason.textContent = this._gameOverReason();
      this.modals.gameover.balance.textContent = `Saldo: R$ ${this.engine.balance}`;
      this.modals.gameover.phase.textContent = `Fase alcançada: ${this.engine.level.getCurrentPhase().name}`;
    }
  }

  _gameOverReason() {
    if (this.engine.bus.runoverCount >= 3) {
      return 'Limite de atropelamentos atingido.';
    }
    if (this.engine.bus.health <= 0) {
      return 'Integridade do ônibus zerada.';
    }
    if (this.engine.mandatoryStopActive) {
      return 'Parada obrigatória ignorada.';
    }
    return 'Viagem interrompida.';
  }

  _renderGarageCatalog() {
    const catalog = this.engine.getGarageCatalog();
    this.modals.garage.balance.textContent = `Saldo: R$ ${this.engine.balance}`;

    this.modals.garage.catalog.innerHTML = catalog
      .map((item) => {
        const owned = this.engine.upgradesPurchased.includes(item.name);
        const canBuy = this.engine.balance >= item.cost && !owned;
        return `
          <div class="flex items-center justify-between rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3">
            <div>
              <p class="font-semibold text-white">${item.label || item.name}</p>
              <p class="text-sm text-slate-400">R$ ${item.cost} · ${item.type}</p>
            </div>
            <button
              data-upgrade="${item.name}"
              class="rounded-lg px-4 py-2 text-sm font-semibold transition ${
                owned
                  ? 'bg-emerald-700/40 text-emerald-300 cursor-default'
                  : canBuy
                    ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }"
              ${owned || !canBuy ? 'disabled' : ''}
            >
              ${owned ? 'Comprado' : 'Comprar'}
            </button>
          </div>
        `;
      })
      .join('');
  }

  _updateHud() {
    const { bus, level, balance } = this.engine;
    const phase = level.getCurrentPhase();

    this.hud.phase.textContent = phase.name;
    this.hud.speed.textContent = `${bus.speed.toFixed(1)} km/h`;
    this.hud.health.textContent = `${Math.round(bus.health)}%`;
    this.hud.balance.textContent = `R$ ${balance}`;
    this.hud.runovers.textContent = `${bus.runoverCount}/3`;
    this.hud.traffic.textContent =
      level.trafficLight === 'green' ? 'Verde' : 'Vermelho';
    this.hud.fps.textContent = `${this.fps} FPS`;
    this.hud.progress.textContent = `${Math.min(100, Math.round((level.elapsedTime / level.duration) * 100))}%`;
  }

  _render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const horizon = h * 0.35;
    const roadTop = horizon;
    const roadBottom = h * 0.85;
    const roadHeight = roadBottom - roadTop;

    const skyGradient = ctx.createLinearGradient(0, 0, 0, horizon);
    skyGradient.addColorStop(0, '#1e3a5f');
    skyGradient.addColorStop(1, '#4a7ab5');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, w, horizon);

    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, horizon, w, h - horizon);

    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, roadTop, w, roadHeight);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(0, roadTop + roadHeight / 2);
    ctx.lineTo(w, roadTop + roadHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const phase = this.engine.level.getCurrentPhase();
    if (phase.id >= 4) {
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, roadTop + roadHeight * 0.75, w, roadHeight * 0.25);
      ctx.fillStyle = '#86efac';
      ctx.font = '11px sans-serif';
      ctx.fillText('Ciclovia', 12, roadBottom - 8);
    }

    if (phase.id >= 6) {
      this._drawCurveWarning(roadTop, roadHeight);
    }

    this._drawTrafficLight(roadTop, roadHeight);
    this._drawStopZones(roadTop, roadHeight);
    this._drawPedestrians(roadTop, roadHeight);
    this._drawCyclists(roadTop, roadHeight);
    this._drawHeavyTraffic(roadTop, roadHeight);
    this._drawBus(roadTop, roadHeight);
  }

  _worldToScreen(worldPos, busY, w) {
    return w * 0.25 + (worldPos - busY) * 8;
  }

  _drawBus(roadTop, roadHeight) {
    const busX = this.width * 0.25;
    const busY = roadTop + roadHeight * 0.35;
    const busW = 90;
    const busH = 36;

    const ctx = this.ctx;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(busX, busY, busW, busH);

    ctx.fillStyle = '#87ceeb';
    for (let i = 0; i < 4; i += 1) {
      ctx.fillRect(busX + 10 + i * 18, busY + 6, 12, 14);
    }

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(busX + busW - 14, busY + 8, 10, 20);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(busX + 18, busY + busH + 6, 7, 0, Math.PI * 2);
    ctx.arc(busX + busW - 18, busY + busH + 6, 7, 0, Math.PI * 2);
    ctx.fill();

    if (this.engine.bus.speed > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      for (let i = 0; i < 3; i += 1) {
        const offset = ((Date.now() / 80 + i * 30) % 60) - 30;
        ctx.fillRect(busX - 40 - offset, busY + 14, 20, 3);
      }
    }
  }

  _drawTrafficLight(roadTop, roadHeight) {
    const x = this._worldToScreen(
      TRAFFIC_LIGHT_POSITION,
      this.engine.bus.y,
      this.width,
    );
    if (x < -40 || x > this.width + 40) {
      return;
    }

    const y = roadTop - 50;
    const isGreen = this.engine.level.trafficLight === 'green';
    const ctx = this.ctx;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 6, y, 12, 70);

    ctx.fillStyle = isGreen ? '#334155' : '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y + 18, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isGreen ? '#22c55e' : '#334155';
    ctx.beginPath();
    ctx.arc(x, y + 48, 10, 0, Math.PI * 2);
    ctx.fill();

    if (!isGreen) {
      ctx.fillStyle = 'rgba(239,68,68,0.25)';
      ctx.fillRect(x - 30, roadTop, 60, roadHeight);
    }
  }

  _drawPedestrians(roadTop, roadHeight) {
    const ctx = this.ctx;

    for (const pedestrian of this.engine.level.pedestrians) {
      const x = this._worldToScreen(
        pedestrian.position,
        this.engine.bus.y,
        this.width,
      );
      if (x < -30 || x > this.width + 30) {
        continue;
      }

      const crossY =
        roadTop + roadHeight * (0.1 + (pedestrian.crossProgress || 0) * 0.8);
      const walkBob = Math.sin(Date.now() / 120 + pedestrian.id) * 3;

      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(x, crossY - 14 + walkBob, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, crossY - 8 + walkBob);
      ctx.lineTo(x, crossY + 10);
      ctx.moveTo(x, crossY);
      ctx.lineTo(x - 8, crossY + 6 + walkBob * 0.5);
      ctx.moveTo(x, crossY);
      ctx.lineTo(x + 8, crossY - 4 - walkBob * 0.5);
      ctx.stroke();
    }
  }

  _drawCyclists(roadTop, roadHeight) {
    const ctx = this.ctx;
    const laneY = roadTop + roadHeight * 0.82;

    for (const cyclist of this.engine.level.cyclists) {
      const x = this._worldToScreen(
        cyclist.position,
        this.engine.bus.y,
        this.width,
      );
      if (x < -30 || x > this.width + 30) {
        continue;
      }

      const pedal = Math.sin(Date.now() / 100 + cyclist.id) * 4;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x - 8, laneY + 8, 8, 0, Math.PI * 2);
      ctx.arc(x + 8, laneY + 8, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x - 2, laneY - 6 + pedal, 4, 14);
    }
  }

  _drawStopZones(roadTop, roadHeight) {
    const ctx = this.ctx;

    for (const stopZone of this.engine.level.stopZones) {
      if (!stopZone.active) {
        continue;
      }

      const x = this._worldToScreen(
        stopZone.position,
        this.engine.bus.y,
        this.width,
      );
      if (x < -50 || x > this.width + 50) {
        continue;
      }

      ctx.fillStyle = 'rgba(59,130,246,0.2)';
      ctx.fillRect(x - 25, roadTop, 50, roadHeight);

      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x - 4, roadTop - 40, 8, 40);

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x, roadTop - 50);
      ctx.lineTo(x + 18, roadTop - 38);
      ctx.lineTo(x, roadTop - 26);
      ctx.closePath();
      ctx.fill();

      if (stopZone.boardingRequired) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('P', x - 4, roadTop - 32);
      }
    }
  }

  _drawHeavyTraffic(roadTop, roadHeight) {
    const ctx = this.ctx;

    for (const car of this.engine.level.heavyTrafficCars) {
      const x = this._worldToScreen(
        car.position,
        this.engine.bus.y,
        this.width,
      );
      if (x < -40 || x > this.width + 40) {
        continue;
      }

      ctx.fillStyle = '#64748b';
      ctx.fillRect(x, roadTop + roadHeight * 0.55, 50, 22);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + 8, roadTop + roadHeight * 0.55 + 4, 14, 10);
      ctx.fillRect(x + 28, roadTop + roadHeight * 0.55 + 4, 14, 10);
    }
  }

  _drawCurveWarning(roadTop, roadHeight) {
    const busY = this.engine.bus.y;
    if (busY < CURVE_ZONE_START - 10 || busY > CURVE_ZONE_END + 10) {
      return;
    }

    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(234,179,8,0.6)';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 8]);

    for (let i = 0; i < this.width; i += 60) {
      const wave = Math.sin((i + Date.now() / 200) * 0.05) * 20;
      ctx.beginPath();
      ctx.moveTo(i, roadTop + 10 + wave);
      ctx.lineTo(i + 30, roadTop + roadHeight - 10 - wave);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(
      `Curva! Máx ${this.engine.level.getCurrentMaxCurveSpeed()} km/h`,
      16,
      roadTop + 22,
    );
  }
}

function init() {
  const canvas = document.getElementById('gameCanvas');
  const hud = {
    phase: document.getElementById('hud-phase'),
    speed: document.getElementById('hud-speed'),
    health: document.getElementById('hud-health'),
    balance: document.getElementById('hud-balance'),
    runovers: document.getElementById('hud-runovers'),
    traffic: document.getElementById('hud-traffic'),
    fps: document.getElementById('hud-fps'),
    progress: document.getElementById('hud-progress'),
  };
  const modals = {
    menu: {
      overlay: document.getElementById('modal-menu'),
      startBtn: document.getElementById('btn-start'),
      continueBtn: document.getElementById('btn-continue'),
    },
    garage: {
      overlay: document.getElementById('modal-garage'),
      balance: document.getElementById('garage-balance'),
      catalog: document.getElementById('garage-catalog'),
      continueBtn: document.getElementById('btn-garage-continue'),
    },
    gameover: {
      overlay: document.getElementById('modal-gameover'),
      reason: document.getElementById('gameover-reason'),
      balance: document.getElementById('gameover-balance'),
      phase: document.getElementById('gameover-phase'),
      restartBtn: document.getElementById('btn-restart'),
      menuBtn: document.getElementById('btn-menu'),
    },
  };

  const renderer = new GameRenderer(canvas, hud, modals);
  window.ipeBus = { renderer, engine: renderer.engine };
}

init();
