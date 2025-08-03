import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import type { ServiceRes } from "../helpers/responsePattern.helper";
import { returnMessage } from "../helpers/responsePattern.helper";
import type { Tokens, UserAcess } from "../models";
import { CustomError } from "../models/error.type";
import * as repository from "../repositories/user.repository";
import * as authService from "../service/auth.service";

export const getUserById = async (id: string) => {
  const user = await repository.getUserById(id);
  if (!user) throw new CustomError("Usuário não encontrado", 404);
  return user;
};

export const getUserByName = async (name: string, required = true) => {
  const user = await repository.getUserByName(name);
  if (!user && required) throw new CustomError("Usuário não encontrado", 404);
  return user;
};

export const signup = async (data: UserAcess): Promise<ServiceRes> => {
  const user = await getUserByName(data.name, false);
  if (user) throw new CustomError("Usuário já existe", 409);

  const cryptPassword = await bcrypt.hash(data.password, 10);
  const newUser = {
    ...data,
    password: cryptPassword,
  };

  await repository.signup(newUser);
  return returnMessage("Usuário criado com sucesso");
};

export const createGuestAccount = async (): Promise<Tokens> => {
  const guestName = `guest_${uuidv4().replace(/-/g, "").substring(0, 12)}`;
  const randomPassword = uuidv4().replace(/-/g, "").substring(0, 16);

  const cryptPassword = await bcrypt.hash(randomPassword, 10);
  const newUser = {
    name: guestName,
    password: cryptPassword,
  };

  const createdUser = await repository.signup(newUser);
  const tokens = await authService.generateTokensForGuest(createdUser._id.toString());

  return tokens;
};
