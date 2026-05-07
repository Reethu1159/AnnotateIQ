const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const demoTasks = [
  ['Annotate 50 prompt-response pairs for helpfulness and accuracy', 'ANNOTATION', 'HIGH', 'TODO', 2],
  ['Label 30 conversation threads for toxicity and safety violations', 'ANNOTATION', 'CRITICAL', 'ACCEPTED', 1],
  ['Tag named entities in 100 unstructured text samples', 'ANNOTATION', 'MEDIUM', 'IN_PROGRESS', 4],
  ['Validate 200 rows of structured tabular data for missing values', 'DATA_OPS', 'HIGH', 'UNDER_REVIEW', 3],
  ['Flag inconsistent or duplicate entries in dataset batch #4', 'DATA_OPS', 'MEDIUM', 'REJECTED', 5],
  ['Perform inter-annotator agreement check on Task Batch #7', 'QA', 'HIGH', 'APPROVED', -1],
  ['Write 10 high-quality instruction prompts for customer service domain', 'PROMPT_ENGINEERING', 'MEDIUM', 'TODO', 6],
  ['Create adversarial prompts to test model robustness', 'PROMPT_ENGINEERING', 'HIGH', 'IN_PROGRESS', 2],
  ['Run evaluation rubric on 25 model responses for medical domain', 'EVALUATION', 'CRITICAL', 'UNDER_REVIEW', 1],
  ['Identify hallucinations in 20 model-generated paragraphs', 'EVALUATION', 'HIGH', 'ACCEPTED', 7],
  ['Convert 500 raw text files to structured JSON format', 'DATA_OPS', 'MEDIUM', 'DONE', -2],
  ['Split dataset into train/validation/test with 70-15-15 ratio', 'DATA_OPS', 'LOW', 'TODO', 10],
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot run seed in production environment');
  }

  const [adminPassword, memberPassword] = await Promise.all([
    bcrypt.hash('Admin@123', 12),
    bcrypt.hash('Member@123', 12),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@annotateiq.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
    },
    create: {
      name: 'Aarav Admin',
      email: 'admin@annotateiq.com',
      username: 'aarav.admin',
      password: adminPassword,
      role: 'ADMIN',
      department: 'Management',
      avatarColor: '#3D52A0',
      bio: 'AI operations lead for annotation and evaluation programs.',
      githubLink: 'https://github.com/annotateiq',
      linkedinLink: 'https://linkedin.com/company/annotateiq',
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@annotateiq.com' },
    update: {
      password: memberPassword,
      role: 'MEMBER',
    },
    create: {
      name: 'Mira Member',
      email: 'member@annotateiq.com',
      username: 'mira.member',
      password: memberPassword,
      role: 'MEMBER',
      department: 'AI Ops',
      avatarColor: '#7091E6',
      bio: 'LLM evaluator focused on safety, quality, and rubric consistency.',
      githubLink: 'https://github.com/mira-member',
      linkedinLink: 'https://linkedin.com/in/mira-member',
    },
  });

  let project = await prisma.project.findFirst({
    where: { name: 'LLM Safety Evaluation - Batch 3' },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'LLM Safety Evaluation - Batch 3',
        description: 'Production-grade safety, quality, and robustness evaluation batch for LLM outputs.',
        domain: 'General',
        deadline: addDays(14),
        taskQuota: 12,
      },
    });
  } else {
    project = await prisma.project.update({
      where: { id: project.id },
      data: {
        description: 'Production-grade safety, quality, and robustness evaluation batch for LLM outputs.',
        domain: 'General',
        deadline: addDays(14),
        taskQuota: 12,
        archived: false,
      },
    });
  }

  await prisma.projectMember.upsert({
    where: {
      userId_projectId: {
        userId: admin.id,
        projectId: project.id,
      },
    },
    update: { role: 'OWNER' },
    create: {
      userId: admin.id,
      projectId: project.id,
      role: 'OWNER',
    },
  });

  await prisma.projectMember.upsert({
    where: {
      userId_projectId: {
        userId: member.id,
        projectId: project.id,
      },
    },
    update: { role: 'MEMBER' },
    create: {
      userId: member.id,
      projectId: project.id,
      role: 'MEMBER',
    },
  });

  await prisma.task.deleteMany({ where: { projectId: project.id } });

  for (const [title, type, priority, status, dueOffset] of demoTasks) {
    const isComplete = ['APPROVED', 'DONE'].includes(status);
    const isSubmitted = ['UNDER_REVIEW', 'APPROVED', 'DONE', 'REJECTED'].includes(status);
    const isAccepted = status !== 'TODO';

    const task = await prisma.task.create({
      data: {
        title,
        description: `Demo task for ${type.toLowerCase().replace(/_/g, ' ')} workflow.`,
        type,
        priority,
        status,
        dueDate: addDays(dueOffset),
        estimatedHours: priority === 'CRITICAL' ? 4 : 2,
        guidelinesUrl: 'https://example.com/annotateiq-guidelines',
        submissionNotes: isSubmitted ? 'Completed according to the rubric. Edge cases noted for review.' : null,
        reviewFeedback: status === 'REJECTED' ? 'Please revisit the flagged edge cases and resubmit.' : null,
        acceptedAt: isAccepted ? addDays(-3) : null,
        submittedAt: isSubmitted ? addDays(-1) : null,
        completedAt: isComplete ? addDays(-1) : null,
        projectId: project.id,
        assigneeId: member.id,
        creatorId: admin.id,
      },
    });

    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        userId: admin.id,
        action: 'created',
        note: 'Seeded demo task',
      },
    });

    if (status !== 'TODO') {
      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          userId: member.id,
          action: status.toLowerCase(),
        },
      });
    }
  }

  await prisma.notification.create({
    data: {
      userId: member.id,
      message: 'New task assigned: Annotate 50 prompt-response pairs for helpfulness and accuracy',
    },
  });

  console.log('Seed complete');
  console.log('Admin: admin@annotateiq.com / Admin@123');
  console.log('Member: member@annotateiq.com / Member@123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
