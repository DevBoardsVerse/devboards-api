import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { User, UserRole } from '../modules/users/entities/user.entity';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { OrganizationMember, OrgRole } from '../modules/organizations/entities/organization-member.entity';
import { Project } from '../modules/projects/entities/project.entity';
import { Task } from '../modules/tasks/entities/task.entity';
import * as bcrypt from 'bcrypt';

// ─── Demo Data ────────────────────────────────────────────────

const DEMO_USERS = [
  { email: 'demo@devboard.app',     password: 'Demo@1234', firstName: 'Alex',    lastName: 'Morgan',   role: OrgRole.OWNER  },
  { email: 'sarah@devboard.app',    password: 'Demo@1234', firstName: 'Sarah',   lastName: 'Chen',     role: OrgRole.ADMIN  },
  { email: 'marcus@devboard.app',   password: 'Demo@1234', firstName: 'Marcus',  lastName: 'Rivera',   role: OrgRole.MEMBER },
  { email: 'priya@devboard.app',    password: 'Demo@1234', firstName: 'Priya',   lastName: 'Nair',     role: OrgRole.MEMBER },
  { email: 'viewer@devboard.app',   password: 'Demo@1234', firstName: 'Jordan',  lastName: 'Blake',    role: OrgRole.VIEWER },
];

const PROJECTS = [
  { name: 'Website Redesign',       description: 'Full redesign of the marketing site and landing pages' },
  { name: 'Mobile App v2',          description: 'Cross-platform mobile app built with React Native' },
  { name: 'API Infrastructure',     description: 'Backend services, rate limiting, and developer portal' },
];

// Tasks per project — [title, status, priority, assigneeIndex (into DEMO_USERS)]
const TASKS_BY_PROJECT: [string, string, string, number | null][][] = [
  // Website Redesign
  [
    ['Define design system tokens',       'done',        'high',   1],
    ['Build reusable component library',  'done',        'high',   2],
    ['Redesign landing page hero section','done',        'urgent', 1],
    ['Implement dark mode support',       'in_review',   'medium', 2],
    ['Write copy for About page',         'in_review',   'low',    3],
    ['SEO audit and meta tags',           'in_progress', 'medium', 3],
    ['Accessibility audit (WCAG 2.1)',    'in_progress', 'high',   1],
    ['Cross-browser testing',             'todo',        'medium', null],
    ['Performance optimisation (LCP)',    'todo',        'high',   2],
    ['Deploy to production CDN',          'todo',        'urgent', null],
  ],
  // Mobile App v2
  [
    ['Set up React Native project',       'done',        'high',   2],
    ['Auth flow — login and register',    'done',        'urgent', 3],
    ['Push notification integration',     'in_review',   'high',   2],
    ['Offline mode with local cache',     'in_progress', 'high',   3],
    ['Biometric authentication',          'in_progress', 'medium', 2],
    ['App store screenshots',             'todo',        'low',    null],
    ['Beta testing with TestFlight',      'todo',        'medium', 3],
    ['Play Store submission',             'todo',        'urgent', null],
  ],
  // API Infrastructure
  [
    ['Design RESTful API contracts',      'done',        'high',   1],
    ['Set up rate limiting middleware',   'done',        'high',   2],
    ['Write OpenAPI documentation',       'done',        'medium', 3],
    ['Implement request validation',      'in_review',   'high',   2],
    ['Set up monitoring with Grafana',    'in_progress', 'medium', 1],
    ['Database query optimisation',       'in_progress', 'urgent', 3],
    ['Add Redis caching layer',           'todo',        'high',   null],
    ['Load testing with k6',             'todo',        'medium', null],
    ['Security audit',                    'todo',        'urgent', 2],
  ],
];

// ─── Seed ─────────────────────────────────────────────────────

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Database connected');

  const userRepo   = AppDataSource.getRepository(User);
  const orgRepo    = AppDataSource.getRepository(Organization);
  const memberRepo = AppDataSource.getRepository(OrganizationMember);
  const projectRepo= AppDataSource.getRepository(Project);
  const taskRepo   = AppDataSource.getRepository(Task);

  // ── Idempotency check ─────────────────────────────────────
  const existing = await userRepo.findOne({ where: { email: 'demo@devboard.app' } });
  if (existing) {
    console.log('⚠️  Seed data already exists — skipping. Run with --force to reseed.');
    if (!process.argv.includes('--force')) {
      await AppDataSource.destroy();
      return;
    }
    console.log('🔁 --force flag detected — wiping and reseeding...');
    // Delete in dependency order
    await taskRepo.delete({});
    await projectRepo.delete({});
    await memberRepo.delete({});
    await orgRepo.delete({});
    await userRepo.delete({ email: DEMO_USERS.map(u => u.email) as any });
  }

  // ── Create users ──────────────────────────────────────────
  console.log('👤 Creating users...');
  const createdUsers: User[] = [];

  for (const u of DEMO_USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    const user = userRepo.create({
      email:     u.email,
      password:  hashed,
      firstName: u.firstName,
      lastName:  u.lastName,
      role:      UserRole.MEMBER,
      isActive:  true,
    });
    createdUsers.push(await userRepo.save(user));
  }
  console.log(`   ✓ ${createdUsers.length} users created`);

  // ── Create organization ───────────────────────────────────
  console.log('🏢 Creating organization...');
  const owner = createdUsers[0];
  const org = orgRepo.create({
    name:        'Acme Corp',
    description: 'A modern product team building tools that scale.',
    ownerId:     owner.id,
  });
  const savedOrg = await orgRepo.save(org);

  // ── Create memberships ────────────────────────────────────
  console.log('🔗 Creating memberships...');
  for (let i = 0; i < createdUsers.length; i++) {
    const membership = memberRepo.create({
      userId:         createdUsers[i].id,
      organizationId: savedOrg.id,
      role:           DEMO_USERS[i].role,
    });
    await memberRepo.save(membership);
  }
  console.log(`   ✓ ${createdUsers.length} memberships created`);

  // ── Create projects + tasks ───────────────────────────────
  console.log('📁 Creating projects and tasks...');
  for (let pi = 0; pi < PROJECTS.length; pi++) {
    const p = PROJECTS[pi];
    const project = projectRepo.create({
      name:           p.name,
      description:    p.description,
      organizationId: savedOrg.id,
      createdById:    owner.id,
    });
    const savedProject = await projectRepo.save(project);

    const projectTasks = TASKS_BY_PROJECT[pi];
    for (const [title, status, priority, assigneeIdx] of projectTasks) {
      const task = taskRepo.create({
        title,
        status:         status as any,
        priority:       priority as any,
        organizationId: savedOrg.id,
        projectId:      savedProject.id,
        createdById:    owner.id,
        assigneeId:     assigneeIdx !== null ? createdUsers[assigneeIdx].id : null,
      });
      await taskRepo.save(task);
    }
    console.log(`   ✓ ${p.name} — ${projectTasks.length} tasks`);
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('─────────────────────────────────────');
  console.log('  Demo login:  demo@devboard.app');
  console.log('  Password:    Demo@1234');
  console.log('  Org:         Acme Corp');
  console.log('─────────────────────────────────────\n');

  await AppDataSource.destroy();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});