import 'dotenv/config';

export const ENV = {
  PORT: Number(process.env.PORT ?? 4001),
  HOST: process.env.HOST ?? '0.0.0.0',
  EXECUTOR_ORIGIN: process.env.EXECUTOR_ORIGIN ?? 'http://127.0.0.1:4001',
  BINANCE_FUTURES_BASE_URL: process.env.BINANCE_FUTURES_BASE_URL ?? '',
  BINANCE_FUTURES_PREFIX: process.env.BINANCE_FUTURES_PREFIX ?? '/fapi/v1',
};