import type { Request } from "express";

export type AuthReq = Request & { user: string };
