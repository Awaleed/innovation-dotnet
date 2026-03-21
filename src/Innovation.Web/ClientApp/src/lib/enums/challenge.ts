import {
    ChallengeDifficulty,
    ChallengeParticipationType,
    ChallengeStatus,
    ChallengeSubmissionType,
    WinnerSelectionMethod,
} from '@/types/generated';
import { useTranslation } from 'react-i18next';

// Challenge Status helpers
export function getChallengeStatusColor(status?: ChallengeStatus | null): string {
    if (status === undefined || status === null) return 'gray';

    switch (status) {
        case ChallengeStatus.Draft:
            return 'gray';
        case ChallengeStatus.Upcoming:
            return 'cyan';
        case ChallengeStatus.Open:
            return 'green';
        case ChallengeStatus.Closed:
            return 'yellow';
        case ChallengeStatus.Judging:
            return 'purple';
        case ChallengeStatus.Voting:
            return 'blue';
        case ChallengeStatus.Completed:
            return 'emerald';
        case ChallengeStatus.Cancelled:
            return 'red';
        default:
            return 'gray';
    }
}

export function getChallengeStatusVariant(status?: ChallengeStatus | null): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status === undefined || status === null) return 'default';

    switch (status) {
        case ChallengeStatus.Draft:
            return 'outline';
        case ChallengeStatus.Upcoming:
            return 'secondary';
        case ChallengeStatus.Open:
            return 'default';
        case ChallengeStatus.Closed:
        case ChallengeStatus.Judging:
        case ChallengeStatus.Voting:
            return 'secondary';
        case ChallengeStatus.Completed:
            return 'secondary';
        case ChallengeStatus.Cancelled:
            return 'destructive';
        default:
            return 'default';
    }
}

export function useChallengeStatusLabel() {
    const { t } = useTranslation('admin');

    return (status?: ChallengeStatus | null): string => {
        if (status === undefined || status === null) return '';
        return t(`challenge_status_options.${status}`);
    };
}

export function useChallengeStatusColor() {
    return (status?: ChallengeStatus | null): string => {
        return getChallengeStatusColor(status);
    };
}

export function getChallengeStatusBadgeClasses(status?: ChallengeStatus | null): string {
    if (status === undefined || status === null) return 'bg-gray-100 text-gray-800';

    switch (status) {
        case ChallengeStatus.Draft:
            return 'bg-gray-100 text-gray-800';
        case ChallengeStatus.Upcoming:
            return 'bg-cyan-100 text-cyan-800';
        case ChallengeStatus.Open:
            return 'bg-blue-100 text-blue-800';
        case ChallengeStatus.Closed:
            return 'bg-yellow-100 text-yellow-800';
        case ChallengeStatus.Judging:
            return 'bg-purple-100 text-purple-800';
        case ChallengeStatus.Voting:
            return 'bg-indigo-100 text-indigo-800';
        case ChallengeStatus.Completed:
            return 'bg-emerald-100 text-emerald-800';
        case ChallengeStatus.Cancelled:
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Challenge Difficulty helpers
export function getChallengeDifficultyColor(difficulty?: ChallengeDifficulty | null): string {
    if (difficulty === undefined || difficulty === null) return 'gray';

    switch (difficulty) {
        case ChallengeDifficulty.Beginner:
            return 'green';
        case ChallengeDifficulty.Intermediate:
            return 'yellow';
        case ChallengeDifficulty.Advanced:
            return 'orange';
        default:
            return 'gray';
    }
}

export function getChallengeDifficultyBadgeClasses(difficulty?: ChallengeDifficulty | null): string {
    if (difficulty === undefined || difficulty === null) return 'bg-gray-100 text-gray-800';

    switch (difficulty) {
        case ChallengeDifficulty.Beginner:
            return 'bg-green-100 text-green-800';
        case ChallengeDifficulty.Intermediate:
            return 'bg-yellow-100 text-yellow-800';
        case ChallengeDifficulty.Advanced:
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

export function useChallengeDifficultyLabel() {
    const { t } = useTranslation('admin');

    return (difficulty?: ChallengeDifficulty | null): string => {
        if (difficulty === undefined || difficulty === null) return '';
        return t(`challenge_difficulty_options.${difficulty}`);
    };
}

// Challenge Participation Type helpers
export function getChallengeParticipationTypeColor(participationType?: ChallengeParticipationType | null): string {
    if (participationType === undefined || participationType === null) return 'gray';

    switch (participationType) {
        case ChallengeParticipationType.Individual:
            return 'blue';
        case ChallengeParticipationType.Team:
            return 'purple';
        case ChallengeParticipationType.Both:
            return 'green';
        default:
            return 'gray';
    }
}

export function useChallengeParticipationTypeLabel() {
    const { t } = useTranslation('admin');

    return (participationType?: ChallengeParticipationType | null): string => {
        if (participationType === undefined || participationType === null) return '';
        return t(`challenge_participation_type_options.${participationType}`);
    };
}

// Challenge Objective Priority helpers
export function getChallengeObjectivePriorityColor(priority?: string | null): string {
    if (!priority) return 'gray';

    switch (priority) {
        case 'low':
            return 'gray';
        case 'medium':
            return 'yellow';
        case 'high':
            return 'orange';
        case 'critical':
            return 'red';
        default:
            return 'gray';
    }
}

export function useChallengeObjectivePriorityLabel() {
    const { t } = useTranslation('admin');

    return (priority?: string | null): string => {
        if (!priority) return '';
        return t(`challenge_objective_priority_options.${priority}`);
    };
}

// Challenge Objective Status helpers
export function getChallengeObjectiveStatusColor(status?: string | null): string {
    if (!status) return 'gray';

    switch (status) {
        case 'pending':
            return 'gray';
        case 'in_progress':
            return 'blue';
        case 'completed':
            return 'green';
        case 'cancelled':
            return 'red';
        default:
            return 'gray';
    }
}

export function useChallengeObjectiveStatusLabel() {
    const { t } = useTranslation('admin');

    return (status?: string | null): string => {
        if (!status) return '';
        return t(`challenge_objective_status_options.${status}`);
    };
}

// Challenge Requirement Type helpers
export function getChallengeRequirementTypeColor(type?: string | null): string {
    if (!type) return 'gray';

    switch (type) {
        case 'skill':
            return 'blue';
        case 'experience':
            return 'green';
        case 'certification':
            return 'purple';
        case 'education':
            return 'orange';
        default:
            return 'gray';
    }
}

export function useChallengeRequirementTypeLabel() {
    const { t } = useTranslation('admin');

    return (type?: string | null): string => {
        if (!type) return '';
        return t(`challenge_requirement_type_options.${type}`);
    };
}

// Challenge Sponsor Type helpers
export function getChallengeSponsorTypeColor(type?: string | null): string {
    if (!type) return 'gray';

    switch (type) {
        case 'primary':
            return 'blue';
        case 'secondary':
            return 'green';
        case 'partner':
            return 'purple';
        default:
            return 'gray';
    }
}

export function useChallengeSponsorTypeLabel() {
    const { t } = useTranslation('admin');

    return (type?: string | null): string => {
        if (!type) return '';
        return t(`challenge_sponsor_type_options.${type}`);
    };
}

// Challenge Risk helpers
export function getChallengeRiskProbabilityColor(probability?: string | null): string {
    if (!probability) return 'gray';

    switch (probability) {
        case 'very_low':
            return 'green';
        case 'low':
            return 'blue';
        case 'medium':
            return 'yellow';
        case 'high':
            return 'orange';
        case 'very_high':
            return 'red';
        default:
            return 'gray';
    }
}

export function getChallengeRiskImpactColor(impact?: string | null): string {
    if (!impact) return 'gray';

    switch (impact) {
        case 'negligible':
            return 'gray';
        case 'minor':
            return 'green';
        case 'moderate':
            return 'yellow';
        case 'major':
            return 'orange';
        case 'severe':
            return 'red';
        default:
            return 'gray';
    }
}

export function useChallengeRiskProbabilityLabel() {
    const { t } = useTranslation('admin');

    return (probability?: string | null): string => {
        if (!probability) return '';
        return t(`challenge_risk_probability_options.${probability}`);
    };
}

export function useChallengeRiskImpactLabel() {
    const { t } = useTranslation('admin');

    return (impact?: string | null): string => {
        if (!impact) return '';
        return t(`challenge_risk_impact_options.${impact}`);
    };
}

// Challenge Language helpers
export function getChallengeLanguageIcon(language?: string | null): string {
    if (!language) return '';

    switch (language) {
        case 'ar':
            return '';
        case 'en':
            return '';
        case 'both':
            return '';
        default:
            return '';
    }
}

export function useChallengeLanguageLabel() {
    const { t } = useTranslation('admin');

    return (language?: string | null): string => {
        if (!language) return '';
        return t(`challenge_language_options.${language}`);
    };
}

// Challenge Submission Type helpers
export function getChallengeSubmissionTypeColor(submissionType?: ChallengeSubmissionType | null): string {
    if (submissionType === undefined || submissionType === null) return 'gray';

    switch (submissionType) {
        case ChallengeSubmissionType.Idea:
            return 'blue';
        case ChallengeSubmissionType.Prototype:
            return 'purple';
        case ChallengeSubmissionType.FullProject:
            return 'green';
        case ChallengeSubmissionType.Research:
            return 'orange';
        case ChallengeSubmissionType.FeasibilityStudy:
            return 'yellow';
        default:
            return 'gray';
    }
}

export function getChallengeSubmissionTypeIcon(submissionType?: ChallengeSubmissionType | null): string {
    if (submissionType === undefined || submissionType === null) return '';

    switch (submissionType) {
        case ChallengeSubmissionType.Idea:
            return '';
        case ChallengeSubmissionType.Prototype:
            return '';
        case ChallengeSubmissionType.FullProject:
            return '';
        case ChallengeSubmissionType.Research:
            return '';
        case ChallengeSubmissionType.FeasibilityStudy:
            return '';
        default:
            return '';
    }
}

export function useChallengeSubmissionTypeLabel() {
    const { t } = useTranslation('admin');

    return (submissionType?: ChallengeSubmissionType | null): string => {
        if (submissionType === undefined || submissionType === null) return '';
        return t(`challenge_submission_type_options.${submissionType}`);
    };
}

// Winner Selection Method helpers
export function getWinnerSelectionMethodColor(method?: WinnerSelectionMethod | null): string {
    if (method === undefined || method === null) return 'gray';

    switch (method) {
        case WinnerSelectionMethod.JuryVoting:
            return 'green';
        case WinnerSelectionMethod.EvaluatorScores:
            return 'blue';
        case WinnerSelectionMethod.CombinedScoring:
            return 'purple';
        case WinnerSelectionMethod.ManualSelection:
            return 'orange';
        default:
            return 'gray';
    }
}

export function getWinnerSelectionMethodVariant(method?: WinnerSelectionMethod | null): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (method === undefined || method === null) return 'secondary';

    switch (method) {
        case WinnerSelectionMethod.JuryVoting:
            return 'default';
        case WinnerSelectionMethod.EvaluatorScores:
        case WinnerSelectionMethod.CombinedScoring:
        case WinnerSelectionMethod.ManualSelection:
            return 'outline';
        default:
            return 'secondary';
    }
}

export function useWinnerSelectionMethodLabel() {
    const { t } = useTranslation('admin');

    return (method?: WinnerSelectionMethod | null): string => {
        if (method === undefined || method === null) return '';
        return t(`winner_selection_method_values.${method}`);
    };
}

export function useWinnerSelectionMethodDescription() {
    const { t } = useTranslation('admin');

    return (method?: WinnerSelectionMethod | null): string => {
        if (method === undefined || method === null) return '';
        return t(`winner_selection_method_descriptions.${method}`);
    };
}

// Challenge IP Strategy helpers
export function useChallengeIPStrategyLabel() {
    const { t } = useTranslation('admin');

    return (strategy?: string | null): string => {
        if (!strategy) return '';
        return t(`challenge_form.risk_sustainability.${strategy}`);
    };
}

// Challenge IP Protection Scope helpers
export function useChallengeIPProtectionLabel() {
    const { t } = useTranslation('admin');

    return (protection?: string | null): string => {
        if (!protection) return '';
        return t(`challenge_form.risk_sustainability.${protection}`);
    };
}

// Challenge IP Licensing Type helpers
export function useChallengeIPLicensingLabel() {
    const { t } = useTranslation('admin');

    return (licensing?: string | null): string => {
        if (!licensing) return '';
        return t(`challenge_form.risk_sustainability.${licensing}`);
    };
}
