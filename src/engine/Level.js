class Level {
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

module.exports = Level;
