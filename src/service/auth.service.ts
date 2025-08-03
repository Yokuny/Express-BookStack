import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config";
import { returnMessage } from "../helpers/responsePattern.helper";
import type { AuthReq, Tokens, UserAcess } from "../models";
import { CustomError } from "../models/error.type";
import * as repository from "../repositories/auth.repository";
import { getUserByName } from "./user.service";

export const signin = async (data: UserAcess): Promise<Tokens> => {
  const user = await getUserByName(data.name);
  if (!user) throw new CustomError("Usuário ou senha incorretos", 409);

  const isValidPassword = await bcrypt.compare(data.password, user.password);
  if (!isValidPassword) throw new CustomError("Usuário ou senha incorretos", 403);

  const refreshToken = jwt.sign({ user: user._id }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: "3d",
  });

  await repository.updateUserRefreshToken(user._id.toString(), refreshToken);

  const accessToken = jwt.sign({ user: user._id }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });

  return { refreshToken, accessToken };
};

export const generateTokensForGuest = async (userId: string): Promise<Tokens> => {
  const refreshToken = jwt.sign({ user: userId }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: "3d",
  });

  await repository.updateUserRefreshToken(userId, refreshToken);

  const accessToken = jwt.sign({ user: userId }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });

  return { refreshToken, accessToken };
};

export const logout = async (req: AuthReq) => {
  await repository.removeRefreshToken(req.user);
  return returnMessage("Logout realizado com sucesso");
};
