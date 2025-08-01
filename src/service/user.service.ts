import bcrypt from "bcrypt";
import type { ServiceRes } from "../helpers/responsePattern.helper";
import { returnMessage } from "../helpers/responsePattern.helper";
import type { UserAcess } from "../models";
import { CustomError } from "../models/error.type";
import * as repository from "../repositories/user.repository";

export const getUserById = async (id: string) => {
  const user = await repository.getUserById(id);
  if (!user) throw new CustomError("Usuário não encontrado", 404);
  return user;
};

export const getUserByEmail = async (email: string, required = true) => {
  const user = await repository.getUserByEmail(email);
  if (!user && required) throw new CustomError("Usuário não encontrado", 404);
  return user;
};

export const signup = async (data: UserAcess): Promise<ServiceRes> => {
  const user = await getUserByEmail(data.email, false);
  if (user) throw new CustomError("Usuário já existe", 409);

  const cryptPassword = await bcrypt.hash(data.password, 10);
  const newUser = {
    ...data,
    password: cryptPassword,
  };

  await repository.signup(newUser);
  return returnMessage("Usuário criado com sucesso");
};
