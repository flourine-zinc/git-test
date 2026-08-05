import { getPrisma } from "../lib/prisma.js";

export const userRepository = {
  findByGoogleSub(googleSub) {
    return getPrisma().user.findUnique({ where: { googleSub } });
  },

  findByEmail(email) {
    return getPrisma().user.findUnique({ where: { email } });
  },

  findById(id) {
    return getPrisma().user.findUnique({
      where: { id },
      include: { profile: true },
    });
  },

  create(data) {
    return getPrisma().user.create({ data });
  },

  update(id, data) {
    return getPrisma().user.update({ where: { id }, data });
  },

  createProfile(userId, data = {}) {
    return getPrisma().profile.create({
      data: {
        userId,
        ...data,
      },
    });
  },
};

export default userRepository;
