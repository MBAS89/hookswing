import { prisma } from './prisma';

/**
 * Returns the effective plan level for a user on a specific project.
 * - Team projects: any team member gets 'TEAM' privileges
 * - Personal projects: user's own plan applies
 */
export async function getEffectivePlan(userId: string, projectId: string): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true },
  });

  if (!project) return 'FREE';

  // Team project: if user is a member, they get TEAM privileges
  if (project.teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: project.teamId, userId } },
    });
    if (member) return 'TEAM';
  }

  // Personal project: use user's own plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  return user?.plan || 'FREE';
}

export async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  return !!member;
}
