import axios from "axios"
import type { Candle } from "../../shared/Candle.js"

// Binance kline response: [openTime, open, high, low, close, volume, closeTime, ...]
type BinanceKline = [number, string, string, string, string, string, number, ...unknown[]]

export class BinanceCandleApi {
  static async fetchCandles(symbol: string, interval: string, limit = 100): Promise<Candle[]> {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`

    const { data } = await axios.get<BinanceKline[]>(url)

    return data.map((d): Candle => ({
      openTime: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
      closeTime: d[6],
    }))
  }
}
