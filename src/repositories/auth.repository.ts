import { User } from "../database";

export const getUserByRefreshToken = async (refreshToken: string) => {
  return User.findOne({ refreshToken }, { __v: 0 });
};

export const updateUserRefreshToken = async (userID: string, refreshToken: string) => {
  return User.findByIdAndUpdate(userID, { refreshToken }, { new: true });
};

export const removeRefreshToken = async (userID: string) => {
  return User.findByIdAndUpdate(userID, { refreshToken: null });
};
