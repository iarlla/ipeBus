class Bus {
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

module.exports = Bus;
