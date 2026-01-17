export class TimeRange {
  constructor(public readonly start: number, public readonly end: number) {
    if (start > end) {
      throw new Error(`TimeRange: start (${start}) cannot be after end (${end})`)
    }
  }

  includes(timestamp: number): boolean {
    return timestamp >= this.start && timestamp <= this.end
  }

  extendWith(timestamp: number): TimeRange {
    return new TimeRange(
      Math.min(this.start, timestamp),
      Math.max(this.end, timestamp)
    )
  }

  duration(): number {
    return this.end - this.start
  }

  toString(): string {
    return `[${this.start} → ${this.end}]`
  }
}
