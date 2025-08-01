import { User } from "../database";
import type { UserAcess } from "../models";

export const signup = async (data: UserAcess) => {
  return User.create(data);
};

export const getUserById = async (userID: string) => {
  return User.findById(userID, { __v: 0 });
};

export const getUserByName = async (name: string) => {
  return User.findOne({ name }, { __v: 0 });
};
