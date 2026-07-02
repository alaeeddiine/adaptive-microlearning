function calculateOverallProgress(courseAvg, quizAvg) {
    const course = Math.round(Number(courseAvg) || 0);
    const quiz = Math.round(Number(quizAvg) || 0);

    if (course > 0 && quiz > 0) {
        return Math.round((course + quiz) / 2);
    }
    if (course > 0) {
        return course;
    }
    if (quiz > 0) {
        return quiz;
    }
    return 0;
}

module.exports = {
    calculateOverallProgress,
};
