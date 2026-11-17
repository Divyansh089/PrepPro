// Seeds the question bank from questions.json
// Run: npx prisma db seed
// Safe to run again: questions that already exist are skipped
import { PrismaClient, Category, Difficulty, QuestionType } from '@prisma/client';
import questions from './questions.json';

const prisma = new PrismaClient();

type SeedQuestion = {
  category: Category;
  difficulty: Difficulty;
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswer: string[];
  explanation: string;
};

async function main() {
  let added = 0;

  for (const q of questions as SeedQuestion[]) {
    const exists = await prisma.question.findFirst({
      where: { text: q.text, source: 'BANK' },
    });

    if (exists) continue;

    await prisma.question.create({
      data: { ...q, source: 'BANK' },
    });
    added++;
  }

  const total = await prisma.question.count({ where: { source: 'BANK' } });
  console.log(`Added ${added} questions (${total} bank questions in total)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
