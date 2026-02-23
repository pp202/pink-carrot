import { log } from "console";
import prisma from "../config/prisma";
import { auth } from "@/config/auth";


export async function loggedUser() {
  const data = await auth();
  if (!data || !data.user || !data.user.email) {
    throw new Error("User not logged in");
  }
  const user = await getUser(data.user.email);
  if (!user) {
    throw new Error("User not found: " + data.user.email);
  }
  return user;
}

export async function createUserIfNew(username: string) {
  const lcUsername = username.toLocaleLowerCase();
  if (!(await getUser(lcUsername))) {
    const newUser = await prisma.user.create({
      data: {
        username: lcUsername,
      },
    });
    log("New user registered, ID:", newUser.id);
  }
}

export async function getUser(username: string) {
  const lcUsername = username.toLocaleLowerCase();
  return prisma.user.findFirst({
    where: {
      username: lcUsername,
    },
  });
}
