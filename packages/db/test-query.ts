import { PrismaClient, Prisma } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  try {
    const ancestors = ['some/path'];
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const inheritedShare = await db.$queryRaw<{ permissions: number }[]>`
      SELECT s."permissions" 
      FROM "UserShare" s
      INNER JOIN "Folder" f ON s."folderId" = f."id"
      WHERE s."userId" = ${userId} 
        AND f."fullPath" IN (${Prisma.join(ancestors)})
      ORDER BY LENGTH(f."fullPath") DESC
      LIMIT 1
    `;
    console.log("Success", inheritedShare);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await db.$disconnect();
  }
}
main();