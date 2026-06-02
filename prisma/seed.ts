import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create boards
  const boards = [
    { name: '站务管理', slug: 'admin', description: '站务公告、意见反馈、版主申请', sortOrder: 1 },
    { name: '技术讨论', slug: 'tech', description: '编程技术、开源软件、硬件数码', sortOrder: 2 },
    { name: '闲聊灌水', slug: 'chat', description: '天南地北、无所不聊', sortOrder: 3 },
    { name: '文学艺术', slug: 'literature', description: '原创文学、读书笔记、影视音乐', sortOrder: 4 },
    { name: '游戏娱乐', slug: 'games', description: '电子游戏、桌游、动漫', sortOrder: 5 },
    { name: '校园生活', slug: 'campus', description: '校园话题、考试求职、留学交流', sortOrder: 6 },
  ];

  for (const board of boards) {
    await prisma.board.upsert({
      where: { slug: board.slug },
      update: board,
      create: board,
    });
  }

  // Create sub-boards for tech
  const tech = await prisma.board.findUnique({ where: { slug: 'tech' } });
  if (tech) {
    const subBoards = [
      { name: 'Web 开发', slug: 'webdev', description: '前端、后端、全栈', parentId: tech.id, sortOrder: 1 },
      { name: 'AI & 机器学习', slug: 'ai', description: '人工智能、深度学习、LLM', parentId: tech.id, sortOrder: 2 },
      { name: '数据库', slug: 'database', description: 'SQL、NoSQL、数据工程', parentId: tech.id, sortOrder: 3 },
    ];
    for (const sub of subBoards) {
      await prisma.board.upsert({
        where: { slug: sub.slug },
        update: sub,
        create: sub,
      });
    }
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
