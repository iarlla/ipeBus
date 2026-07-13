const Bus = require('./Bus');
const Level = require('./Level');
const Persistence = require('./Persistence');

class GameEngine {
  constructor({ bus, level, persistence } = {}) {
    this.bus = bus || new Bus();
    this.level = level || new Level();
    this.persistence = persistence || new Persistence();
    this.states = {
      menu: 'menu',
      gameplay: 'gameplay',
      garage: 'garage',
      gameover: 'gameover',
    };
    this.state = this.states.menu;
    this.running = false;
    this.gameClock = 0;
    this.mandatoryStopActive = false;
    this.activeMandatoryStopZone = null;
    this.balance = 0;
    this.upgradesPurchased = [];
    this.garageCatalog = [
      { name: 'brakes', cost: 12, type: 'safety' },
      { name: 'tires', cost: 10, type: 'safety' },
      { name: 'engine', cost: 20, type: 'performance' },
    ];
  }

  setState(state) {
    this.state = state;
    this.running = state === this.states.gameplay;
    return this.state;
  }

  start() {
    return this.setState(this.states.gameplay);
  }

  openGarage() {
    return this.setState(this.states.garage);
  }

  gameOver() {
    return this.setState(this.states.gameover);
  }

  collectFare(amount = 0) {
    this.balance += amount;
    return this.balance;
  }

  payRepairCost(amount = 0) {
    this.balance = Math.max(0, this.balance - amount);
    return this.balance;
  }

  purchaseUpgrade(upgradeName, cost = 0) {
    if (this.balance < cost) {
      return false;
    }

    this.balance -= cost;
    this.upgradesPurchased.push(upgradeName);
    this.bus.upgrades.push(upgradeName);
    return true;
  }

  getGarageCatalog() {
    return this.garageCatalog.map((item) => ({ ...item }));
  }

  buyGarageItem(itemName) {
    const item = this.garageCatalog.find(
      (garageItem) => garageItem.name === itemName,
    );

    if (!item) {
      return false;
    }

    return this.purchaseUpgrade(item.name, item.cost);
  }

  saveGarageProgress(targetPath = null) {
    return this.persistence.saveGarageProgress(
      {
        balance: this.balance,
        upgradesPurchased: [...this.upgradesPurchased],
        busUpgrades: [...this.bus.upgrades],
        state: this.state,
      },
      targetPath,
    );
  }

  loadGarageProgress(targetPath = null) {
    const garageProgress = this.persistence.loadGarageProgress(
      targetPath,
      null,
    );

    if (!garageProgress) {
      return null;
    }

    this.balance = garageProgress.balance ?? this.balance;
    this.upgradesPurchased = [...(garageProgress.upgradesPurchased ?? [])];
    this.bus.upgrades = [...(garageProgress.busUpgrades ?? this.bus.upgrades)];

    if (garageProgress.state) {
      this.setState(garageProgress.state);
    }

    return garageProgress;
  }

  startMandatoryStop(stopZone = null) {
    this.mandatoryStopActive = true;
    this.activeMandatoryStopZone = stopZone;
    return this.mandatoryStopActive;
  }

  skipMandatoryStop() {
    if (this.mandatoryStopActive) {
      this.mandatoryStopActive = false;
      this.activeMandatoryStopZone = null;
      return this.gameOver();
    }

    return this.state;
  }

  update(deltaTime = 1) {
    if (!this.running) {
      return this.state;
    }

    this.gameClock += deltaTime;

    const trafficLight = this.level.tick(deltaTime);
    this.bus.update(deltaTime);

    if (typeof this.level.applyHeavyTraffic === 'function') {
      this.level.applyHeavyTraffic(this.bus, deltaTime);
    }

    if (trafficLight === 'red' && this.bus.speed > 0) {
      this.bus.applyRedLightPenalty();
    }

    if (this.mandatoryStopActive && this.bus.speed > 0) {
      this.mandatoryStopActive = false;
      this.activeMandatoryStopZone = null;
      return this.gameOver();
    }

    if (this.level.isFinished() || this.bus.health <= 0) {
      this.gameOver();
    }

    return this.state;
  }

  handleCommand(command) {
    const normalized = String(command || '')
      .trim()
      .toLowerCase();

    if (normalized === 'start') {
      this.start();
    } else if (normalized === 'garage') {
      this.openGarage();
    } else if (normalized === 'skipstop') {
      this.skipMandatoryStop();
    } else if (normalized === 'garagecatalog') {
      return this.getGarageCatalog();
    } else if (normalized.startsWith('buy ')) {
      const itemName = normalized.replace(/^buy\s+/, '');

      this.buyGarageItem(itemName);
    } else if (normalized === 'accelerate') {
      this.bus.accelerate();
    } else if (normalized === 'brake') {
      this.bus.brake();
    } else if (normalized === 'quit') {
      this.gameOver();
    }

    return this.state;
  }
}

module.exports = GameEngine;
