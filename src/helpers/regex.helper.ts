export const emailRegExp = /^[a-z0-9.]+@[a-z0-9]+\.[a-z]+(\.[a-z]+)?$/i;
export const emailRegex = RegExp(emailRegExp);

export const passwordRegExp = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;
export const passwordRegex = RegExp(passwordRegExp);
