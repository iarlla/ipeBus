class Passenger {
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

module.exports = Passenger;
