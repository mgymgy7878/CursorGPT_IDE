import type { RequestHandler } from "express";

export type ApiRes<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type RH<
  Params = {},
  ResBody = unknown,
  ReqBody = unknown,
  Query = {}
> = RequestHandler<Params, ApiRes<ResBody>, ReqBody, Query>; 