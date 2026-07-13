export class Bus {
  constructor({
    y = 0,
    speed = 0,
    maxSpeed = 100,
    integrity = 100,
    health,
    upgrades = [],
    passengers = [],
  } = {}) {
    this.y = y;
    this.speed = speed;
    this.maxSpeed = maxSpeed;
    this.integrity = health ?? integrity;
    this.health = this.integrity;
    this.upgrades = upgrades;
    this.passengers = passengers;
    this.runoverCount = 0;
    this.isGameOver = false;
  }

  accelerate(amount = 1) {
    this.speed = Math.min(this.maxSpeed, this.speed + amount);
    return this.speed;
  }

  setSpeed(targetSpeed) {
    this.speed = Math.max(0, Math.min(this.maxSpeed, targetSpeed));
    return this.speed;
  }

  brake(amount = 1) {
    this.speed = Math.max(0, this.speed - amount);
    return this.speed;
  }

  hardBrake(amount = 5) {
    const previousSpeed = this.speed;
    this.brake(amount);
    if (previousSpeed - this.speed >= 3) {
      this._affectPassengers();
    }
    return this.speed;
  }

  applyRedLightPenalty(damage = 10) {
    this.takeDamage(damage);
    this.health = this.integrity;
    return this.health;
  }

  takeDamage(amount = 0) {
    this.integrity = Math.max(0, this.integrity - amount);
    this.health = this.integrity;
    return this.integrity;
  }

  registerRunover() {
    this.runoverCount += 1;

    if (this.runoverCount >= 3) {
      this.isGameOver = true;
    }

    return this.runoverCount;
  }

  enterCurve(maxSafeSpeed, damage = 20) {
    if (this.speed > maxSafeSpeed) {
      this.takeDamage(damage);
      this.isGameOver = true;
      return false;
    }

    return true;
  }

  validateCurve(level) {
    return this.enterCurve(level.getCurrentMaxCurveSpeed());
  }

  update(deltaTime = 1) {
    if (deltaTime <= 0) {
      return this.speed;
    }

    this.speed = Math.max(0, this.speed - deltaTime * 0.1);
    return this.speed;
  }

  _affectPassengers() {
    this.passengers = this.passengers.map((passenger) => passenger);
  }
}

export class Passenger {
  constructor(name, destination = null, satisfaction = 100, farePaid = 0) {
    this.name = name;
    this.destination = destination;
    this.satisfaction = satisfaction;
    this.farePaid = farePaid;
    this.onboard = false;
    this.disembarkRequested = false;
    this.requestedStop = null;
  }

  board() {
    this.onboard = true;
  }

  leave() {
    this.onboard = false;
  }

  requestDisembark(stopName = this.destination) {
    this.disembarkRequested = true;
    this.requestedStop = stopName;
    return this.requestedStop;
  }

  completeDisembark() {
    this.disembarkRequested = false;
    this.requestedStop = null;
    this.leave();
    return this.onboard;
  }
}

export class Level {
  constructor({
    name = 'Fase 1',
    duration = 60,
    trafficLightInterval = 10,
  } = {}) {
    this.name = name;
    this.duration = duration;
    this.trafficLightInterval = trafficLightInterval;
    this.elapsedTime = 0;
    this.trafficLight = 'green';
    this.phases = this._createPhases();
    this.currentPhaseIndex = 0;
    this.pedestrians = [];
    this.cyclists = [];
    this.stopZones = [];
    this.heavyTrafficCars = [];
    this.transitPassengers = [];
  }

  _createPhases() {
    return Array.from({ length: 8 }, (_, index) => ({
      id: index + 1,
      name: `Fase ${index + 1}`,
      duration: 60 + index * 10,
      trafficLightInterval: 10 + index,
      maxCurveSpeed: 12 - Math.min(index, 6),
    }));
  }

  getCurrentPhase() {
    return this.phases[this.currentPhaseIndex];
  }

  getTotalPhases() {
    return this.phases.length;
  }

  getCurrentTrafficLightInterval() {
    const currentPhase = this.getCurrentPhase();
    return currentPhase?.trafficLightInterval ?? this.trafficLightInterval;
  }

  spawnPedestrian(position = 0, speed = 1) {
    const pedestrian = {
      id: this.pedestrians.length + 1,
      position,
      speed,
      active: true,
    };

    this.pedestrians.push(pedestrian);
    return pedestrian;
  }

  spawnCyclist(position = 0, speed = 2) {
    const cyclist = {
      id: this.cyclists.length + 1,
      position,
      speed,
      active: true,
    };

    this.cyclists.push(cyclist);
    return cyclist;
  }

  advanceDynamicObstacles(deltaTime = 1) {
    const currentPhase = this.getCurrentPhase();

    if (currentPhase?.id >= 2 && currentPhase?.id <= 4) {
      if (this.pedestrians.length === 0) {
        this.spawnPedestrian(0, 1);
      }

      if (this.cyclists.length === 0) {
        this.spawnCyclist(5, 2);
      }
    }

    this.pedestrians = this.pedestrians
      .map((pedestrian) => ({
        ...pedestrian,
        position: pedestrian.position + pedestrian.speed * deltaTime,
      }))
      .filter((pedestrian) => pedestrian.active);

    this.cyclists = this.cyclists
      .map((cyclist) => ({
        ...cyclist,
        position: cyclist.position + cyclist.speed * deltaTime,
      }))
      .filter((cyclist) => cyclist.active);

    return {
      pedestrians: this.pedestrians,
      cyclists: this.cyclists,
    };
  }

  spawnStopZone(position = 0, boardingRequired = true) {
    const stopZone = {
      id: this.stopZones.length + 1,
      position,
      boardingRequired,
      active: true,
    };

    this.stopZones.push(stopZone);
    return stopZone;
  }

  advanceStopZones(deltaTime = 1) {
    const currentPhase = this.getCurrentPhase();

    if (currentPhase?.id >= 3 && currentPhase?.id <= 4) {
      if (this.stopZones.length === 0) {
        this.spawnStopZone(10, true);
      }
    }

    this.stopZones = this.stopZones
      .map((stopZone) => ({
        ...stopZone,
        position: stopZone.position + deltaTime,
      }))
      .filter((stopZone) => stopZone.active);

    return this.stopZones;
  }

  spawnHeavyTrafficCar(position = 0, speed = 1) {
    const trafficCar = {
      id: this.heavyTrafficCars.length + 1,
      position,
      speed,
      active: true,
    };

    this.heavyTrafficCars.push(trafficCar);
    return trafficCar;
  }

  advanceHeavyTraffic(deltaTime = 1) {
    const currentPhase = this.getCurrentPhase();

    if (currentPhase?.id === 5 && this.heavyTrafficCars.length === 0) {
      this.spawnHeavyTrafficCar(20, 1);
    }

    this.heavyTrafficCars = this.heavyTrafficCars
      .map((trafficCar) => ({
        ...trafficCar,
        position: trafficCar.position - trafficCar.speed * deltaTime,
      }))
      .filter((trafficCar) => trafficCar.active);

    return this.heavyTrafficCars;
  }

  spawnTransitPassenger(name = 'Passageiro', destination = 'Parada') {
    const passenger = {
      id: this.transitPassengers.length + 1,
      name,
      destination,
      onboard: true,
      disembarkRequested: false,
      requestedStop: null,
    };

    this.transitPassengers.push(passenger);
    return passenger;
  }

  advanceTransitPassengerRequests(deltaTime = 1) {
    const currentPhase = this.getCurrentPhase();

    if (currentPhase?.id >= 7 && currentPhase?.id <= 8) {
      if (this.transitPassengers.length === 0) {
        this.spawnTransitPassenger('Carlos', 'Terminal');
      }

      this.transitPassengers = this.transitPassengers.map((passenger) => ({
        ...passenger,
        disembarkRequested: true,
        requestedStop: passenger.destination,
        requestAge: (passenger.requestAge || 0) + deltaTime,
      }));
    }

    return this.transitPassengers;
  }

  applyHeavyTraffic(bus, deltaTime = 1) {
    const currentPhase = this.getCurrentPhase();

    if (currentPhase?.id !== 5) {
      return bus.speed;
    }

    this.advanceHeavyTraffic(deltaTime);
    bus.setSpeed(bus.speed - 3 * deltaTime);
    return bus.speed;
  }

  requiresFullStopAtZone(busSpeed, stopZone = null) {
    if (!stopZone?.boardingRequired) {
      return false;
    }

    return busSpeed === 0;
  }

  tick(deltaTime = 1) {
    this.elapsedTime += deltaTime;
    this.advanceDynamicObstacles(deltaTime);
    this.advanceStopZones(deltaTime);
    this.advanceHeavyTraffic(deltaTime);
    this.advanceTransitPassengerRequests(deltaTime);

    const interval = this.getCurrentTrafficLightInterval();

    if (interval > 0 && this.elapsedTime % interval === 0) {
      this.trafficLight = this.trafficLight === 'green' ? 'red' : 'green';
    }

    return this.trafficLight;
  }

  isFinished() {
    return this.elapsedTime >= this.duration;
  }

  canPassTrafficLight() {
    return this.trafficLight === 'green';
  }

  detectPedestrianCollision(busPosition, pedestrianPosition) {
    return busPosition === pedestrianPosition;
  }

  detectCyclistCollision(busPosition, cyclistPosition) {
    return busPosition === cyclistPosition;
  }

  isCyclingLaneViolation(busLane) {
    return busLane === 'cycleway';
  }

  getCurrentMaxCurveSpeed() {
    const currentPhase = this.getCurrentPhase();
    return currentPhase?.maxCurveSpeed ?? 12;
  }
}

export class Persistence {
  constructor({ storageKey = 'ipebus-save', baseDir = '/' } = {}) {
    this.storageKey = storageKey;
    this.baseDir = baseDir;
    this.memory = new Map();
  }

  saveGarageProgress(progress) {
    this.memory.set(this.storageKey, { garage: progress });
    return true;
  }

  loadGarageProgress(_targetPath = null, fallbackValue = null) {
    const payload = this.memory.get(this.storageKey);
    return payload?.garage ?? fallbackValue;
  }
}

export class GameEngine {
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
    const item = this.garageCatalog.find((garageItem) => garageItem.name === itemName);

    if (!item) {
      return false;
    }

    return this.purchaseUpgrade(item.name, item.cost);
  }

  saveGarageProgress() {
    return this.persistence.saveGarageProgress({
      balance: this.balance,
      upgradesPurchased: [...this.upgradesPurchased],
      busUpgrades: [...this.bus.upgrades],
      state: this.state,
    });
  }

  loadGarageProgress() {
    const garageProgress = this.persistence.loadGarageProgress(null, null);

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