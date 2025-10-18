// Add this helper at the top of the file
function parseJsonField(field: any): any[] {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  }
  return [];
}

// Replace the gatherContext method around line 128
private async gatherContext(profile: any) {
  // Parse JSON string fields to arrays
  const focusAreas = parseJsonField(profile.focusAreas);
  
  const portfolioData = await prisma.eSGPortfolioCompany.findMany({
    where: { investorId: profile.id },
  });

  const marketData = await prisma.marketIntelligence.findMany({
    where: {
      sector: { in: focusAreas.length > 0 ? focusAreas : ['EdTech'] },
    },
  });

  const impactData = {
    totalStudentsReached: portfolioData.reduce((sum, c) => sum + c.studentsReached, 0),
    totalTeachersTrained: portfolioData.reduce((sum, c) => sum + c.teachersTrained, 0),
    avgImpactScore: portfolioData.length > 0 
      ? portfolioData.reduce((sum, c) => sum + c.impactScore, 0) / portfolioData.length 
      : 0,
  };

  return { investorProfile: profile, portfolioData, marketData, impactData };
}
