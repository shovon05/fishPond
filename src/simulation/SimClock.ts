// Fixed-step simulation clock for Living Pond

export class SimClock {
  private fixedDt: number;
  private accumulator: number = 0;
  private lastTime: number = -1;
  private maxAccumulated: number; // clamp after tab suspend
  private paused: boolean = false;

  constructor(fixedDt = 1 / 60, maxAccumulated = 0.25) {
    this.fixedDt = fixedDt;
    this.maxAccumulated = maxAccumulated;
  }

  /** Call once per animation frame with the current timestamp in seconds.
   *  Returns the number of simulation steps to run. */
  tick(now: number): number {
    if (this.paused) return 0;

    if (this.lastTime < 0) {
      this.lastTime = now;
      return 0;
    }

    let elapsed = now - this.lastTime;
    this.lastTime = now;

    // Clamp large jumps (tab was hidden, device asleep)
    if (elapsed > this.maxAccumulated) elapsed = this.maxAccumulated;

    this.accumulator += elapsed;
    let steps = 0;
    while (this.accumulator >= this.fixedDt) {
      this.accumulator -= this.fixedDt;
      steps++;
    }
    return steps;
  }

  get dt(): number {
    return this.fixedDt;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    this.lastTime = -1; // reset so the next tick doesn't jump
  }

  reset(): void {
    this.accumulator = 0;
    this.lastTime = -1;
  }
}
