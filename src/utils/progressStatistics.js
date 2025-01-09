export const getCategorizedAssessments = (assessments) => {
    const currentDate = new Date();

    const notStarted = assessments.filter(a => a.assessmentStarted === false);
    const active = assessments.filter(a => a.assessmentStarted === true && !a.submitted);
    const submitted = assessments.filter(a => a.submitted === true);
    const deadlined = assessments.filter(a => {
        if (!a.deadline) return false;
        const deadlineDate = new Date(a.deadline);
        return deadlineDate < currentDate && !a.submitted;
    });

    return {
        notStarted,
        active,
        submitted,
        deadlined
    }
}

export const getCategorizedSubAssessments = (assessments) => {
    const currentDate = new Date();

    const notStarted = assessments.filter(a => a.subAssessmentStarted === false);
    const active = assessments.filter(a => a.assessmentStarted === true && !a.submitted);
    const submitted = assessments.filter(a => a.submitted === true);
    const deadlined = assessments.filter(a => {
        if (!a.deadline) return false;
        const deadlineDate = new Date(a.deadline);
        return deadlineDate < currentDate && !a.submitted;
    });

    return {
        notStarted,
        active,
        submitted,
        deadlined
    }
}

export const getMetricsOfAssessments = (categorizedAssessments) => {
    const notStarted = categorizedAssessments.notStarted.length;
    const active = categorizedAssessments.active.length;
    const submitted = categorizedAssessments.submitted.length;
    const deadlined = categorizedAssessments.deadlined.length;
    return {
        notStarted, active, submitted, deadlined
    }
}