import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export async function getActivePopup() {
  return prisma.popupMessage.findFirst({
    where:   { active: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createPopup(content: string) {
  // Deactivate existing active popups
  await prisma.popupMessage.updateMany({
    where: { active: true },
    data:  { active: false },
  });
  return prisma.popupMessage.create({ data: { content, active: true } });
}

export async function deactivatePopup(id: string) {
  const popup = await prisma.popupMessage.findUnique({ where: { id } });
  if (!popup) throw new AppError('Mensaje no encontrado', 404);
  return prisma.popupMessage.update({ where: { id }, data: { active: false } });
}

export async function listPopups() {
  return prisma.popupMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
}
