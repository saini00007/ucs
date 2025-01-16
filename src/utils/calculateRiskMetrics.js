export const calculateMetrics = (assessmentQuestions) => {
  if (!assessmentQuestions || assessmentQuestions.length === 0) {
    return {
      departmentRiskIndex: 0,
      controlCoverageRatio: 0,
      gapDensityRate: 0,
      documentationCoverageRatio: 0,
      departmentComplianceScore: 0,
      totalControlCount: 0,
      implementedControlCount: 0,
      controlGaps: {
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        totalGapsCount: 0
      }
    };
  }

  const totalControlCount = assessmentQuestions.length;
  
  // Count implemented controls (answered as 'yes')
  const implementedControlCount = assessmentQuestions.filter(assessmentQuestion => 
    assessmentQuestion.answer && assessmentQuestion.answer.answerText?.toLowerCase() === 'yes'
  ).length;

  // Calculate Documentation Coverage Ratio (DCR)
  // Documented controls are those that have been answered as 'yes'
  const documentedControlCount = implementedControlCount;
  const documentationCoverageRatio = totalControlCount ? 
    (documentedControlCount / totalControlCount) * 100 : 0;

  // Calculate Department Compliance Score (DCS)
  // Required controls are all controls, compliant controls are those answered 'yes'
  const compliantControlCount = implementedControlCount;
  const requiredControlCount = totalControlCount;
  const departmentComplianceScore = requiredControlCount ? 
    (compliantControlCount / requiredControlCount) * 100 : 0;

  const controlGaps = assessmentQuestions.reduce((gapAccumulator, assessmentQuestion) => {
    if (assessmentQuestion.answer && assessmentQuestion.answer.answerText?.toLowerCase() === 'no') {
      gapAccumulator.totalGapsCount++;
      
      // Check risk rating from master question
      const currentRiskRating = assessmentQuestion.masterQuestion?.currentRiskRating?.toLowerCase() || '';
      if (currentRiskRating.includes('critical')) gapAccumulator.criticalCount++;
      else if (currentRiskRating.includes('high')) gapAccumulator.highCount++;
      else if (currentRiskRating.includes('medium')) gapAccumulator.mediumCount++;
    }
    return gapAccumulator;
  }, { criticalCount: 0, highCount: 0, mediumCount: 0, totalGapsCount: 0 });

  // Calculate department risk metrics
  const departmentRiskIndex = totalControlCount ? 
    ((controlGaps.criticalCount * 3 + controlGaps.highCount * 2 + controlGaps.mediumCount) / totalControlCount) : 0;

  const controlCoverageRatio = totalControlCount ? 
    (implementedControlCount / totalControlCount) * 100 : 0;

  const gapDensityRate = totalControlCount ? 
    (controlGaps.totalGapsCount / totalControlCount) * 100 : 0;

  return {
    departmentRiskIndex: parseFloat(departmentRiskIndex.toFixed(2)),
    controlCoverageRatio: parseFloat(controlCoverageRatio.toFixed(2)),
    gapDensityRate: parseFloat(gapDensityRate.toFixed(2)),
    documentationCoverageRatio: parseFloat(documentationCoverageRatio.toFixed(2)),
    departmentComplianceScore: parseFloat(departmentComplianceScore.toFixed(2)),
    totalControlCount,
    implementedControlCount,
    controlGaps
  };
};