// @ts-expect-error
import { getHistoricalRates } from 'dukascopy-node';
const data = await getHistoricalRates({
  instrument: 'eurusd',
  dates: { from: '2026-03-09', to: '2026-03-09' },
  timeframe: 'm5',
  format: 'array',
  batchSize: 1,
});
console.log('length:', data.length);
console.log('item[0]:', JSON.stringify(data[0]));
console.log('item[1]:', JSON.stringify(data[1]));
