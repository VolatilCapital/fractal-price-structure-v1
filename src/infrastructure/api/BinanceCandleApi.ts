import axios from "axios"
import { Candle } from "../../shared/Candle.js"

export class BinanceCandleApi {
  static async fetchCandles(symbol: string, interval: string, limit = 100): Promise<Candle[]> {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`

    const { data } = await axios.get<any[]>(url)

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
