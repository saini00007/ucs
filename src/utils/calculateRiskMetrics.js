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
  
  const implementedControlCount = assessmentQuestions.filter(assessmentQuestion =>
    assessmentQuestion.answer && assessmentQuestion.answer.answerText?.toLowerCase() === 'yes'
  ).length;
  
  const documentedControlCount = implementedControlCount;
  const documentationCoverageRatio = totalControlCount ?
    (documentedControlCount / totalControlCount) * 100 : 0;
  
  const compliantControlCount = implementedControlCount;
  const requiredControlCount = totalControlCount;
  const departmentComplianceScore = requiredControlCount ?
    (compliantControlCount / requiredControlCount) * 100 : 0;
  
  const controlGaps = assessmentQuestions.reduce((gapAccumulator, assessmentQuestion) => {
    if (assessmentQuestion.answer && assessmentQuestion.answer.answerText?.toLowerCase() === 'no') {
      gapAccumulator.totalGapsCount++;
      
      // Try multiple possible paths to risk rating
      const riskRating = (
        assessmentQuestion.riskRating || 
        assessmentQuestion.masterQuestion?.riskRating ||
        assessmentQuestion.masterQuestion?.currentRiskRating ||
        assessmentQuestion.riskLevel ||
        assessmentQuestion.masterQuestion?.riskLevel ||
        ''
      ).toLowerCase();
      
      // More flexible matching for risk ratings
      if (riskRating.includes('critical') || riskRating.includes('severe') || riskRating === '3') {
        gapAccumulator.criticalCount++;
      } else if (riskRating.includes('high') || riskRating.includes('major') || riskRating === '2') {
        gapAccumulator.highCount++;
      } else if (riskRating.includes('medium') || riskRating.includes('moderate') || riskRating === '1') {
        gapAccumulator.mediumCount++;
      }
    }
    return gapAccumulator;
  }, { criticalCount: 0, highCount: 0, mediumCount: 0, totalGapsCount: 0 });
  console.log('total control count'+ totalControlCount);
  console.log('controlGaps.criticalCount'+controlGaps.criticalCount)
  console.log('controlGaps.highCount'+controlGaps.highCount)
  console.log('controlGaps.mediumCount'+controlGaps.mediumCount)
  const departmentRiskIndex = totalControlCount ?
    ((controlGaps.criticalCount * 3 + controlGaps.highCount * 2 + controlGaps.mediumCount) / totalControlCount) : 0;
  
  const controlCoverageRatio = totalControlCount ?
    (implementedControlCount / totalControlCount) * 100 : 0;
  
  const gapDensityRate = totalControlCount ?
    (controlGaps.totalGapsCount / totalControlCount) * 100 : 0;
  
  return {
    departmentRiskIndex: parseFloat(gapDensityRate*0.9),
    controlCoverageRatio: parseFloat(controlCoverageRatio.toFixed(2)),
    gapDensityRate: parseFloat(gapDensityRate.toFixed(2)),
    documentationCoverageRatio: parseFloat(documentationCoverageRatio.toFixed(2)),
    departmentComplianceScore: parseFloat(departmentComplianceScore.toFixed(2)),
    totalControlCount,
    implementedControlCount,
    controlGaps
  };
};