import bcrypt from 'bcrypt';

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  return hashedPassword;
}

export async function isValidPassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}
