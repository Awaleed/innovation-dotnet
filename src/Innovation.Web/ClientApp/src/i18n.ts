import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import all translation files
import adminAr from '@/lang/ar/admin.json';
import adminJuryVotingAr from '@/lang/ar/admin/jury-voting.json';
import appAr from '@/lang/ar/app.json';
import authAr from '@/lang/ar/auth.json';
import automationAr from '@/lang/ar/automation.json';
import commonAr from '@/lang/ar/common.json';
import enumsAr from '@/lang/ar/enums.json';
import evaluationSettingsAr from '@/lang/ar/evaluation-settings.json';
import evaluationAr from '@/lang/ar/evaluation.json';
import evaluationSettingsAr2 from '@/lang/ar/evaluation_settings.json';
import evaluatorJuryAr from '@/lang/ar/evaluator/jury.json';
import modelsAr from '@/lang/ar/models.json';
import navigationAr from '@/lang/ar/navigation.json';
import integrationHubAr from '@/lang/ar/integration_hub.json';
import pluginsMarketplaceAr from '@/lang/ar/plugins_marketplace.json';
import publicAr from '@/lang/ar/public.json';
import reportsAr from '../../Modules/ReportEngineAI/lang/ar/reports.json';
import settingsAr from '@/lang/ar/settings.json';
import sidebarAr from '@/lang/ar/sidebar.json';
import userAr from '@/lang/ar/user.json';
import userIdeaFormAr from '@/lang/ar/user/idea-form.json';
import adminEn from '@/lang/en/admin.json';
import adminJuryVotingEn from '@/lang/en/admin/jury-voting.json';
import appEn from '@/lang/en/app.json';
import authEn from '@/lang/en/auth.json';
import automationEn from '@/lang/en/automation.json';
import commonEn from '@/lang/en/common.json';
import enumsEn from '@/lang/en/enums.json';
import evaluationSettingsEn from '@/lang/en/evaluation-settings.json';
import evaluationEn from '@/lang/en/evaluation.json';
import evaluationSettingsEn2 from '@/lang/en/evaluation_settings.json';
import evaluatorJuryEn from '@/lang/en/evaluator/jury.json';
import modelsEn from '@/lang/en/models.json';
import navigationEn from '@/lang/en/navigation.json';
import integrationHubEn from '@/lang/en/integration_hub.json';
import pluginsMarketplaceEn from '@/lang/en/plugins_marketplace.json';
import publicEn from '@/lang/en/public.json';
import reportsEn from '../../Modules/ReportEngineAI/lang/en/reports.json';
import settingsEn from '@/lang/en/settings.json';
import sidebarEn from '@/lang/en/sidebar.json';
import userEn from '@/lang/en/user.json';
import userIdeaFormEn from '@/lang/en/user/idea-form.json';
import discoveryAr from '@/lang/ar/discovery.json';
import errorsAr from '@/lang/ar/errors.json';
import discoveryEn from '@/lang/en/discovery.json';
import errorsEn from '@/lang/en/errors.json';
import forecastingAr from '@/lang/ar/forecasting.json';
import forecastingEn from '@/lang/en/forecasting.json';
import financialDashboardAr from '@/lang/ar/financial-dashboard.json';
import financialDashboardEn from '@/lang/en/financial-dashboard.json';

// UI components
import aiEvaluationTabAr from '@/lang/ar/components/ai-evaluation-tab.json';
import aiEvaluationWizardAr from '@/lang/ar/components/ai-evaluation-wizard.json';
import announcementAr from '@/lang/ar/components/announcement.json';
import attachmentAr from '@/lang/ar/components/attachment.json';
import messagingAr from '@/lang/ar/components/messaging.json';
import dashboardAr from '@/lang/ar/dashboard.json';
import mockDataAr from '@/lang/ar/mock-data.json';
import addIdeaDialogAr from '@/lang/ar/ui/add-idea-dialog.json';
import dataGridAr from '@/lang/ar/ui/data-grid.json';
import dataTableAr from '@/lang/ar/ui/data-table.json';
import ideaCardAr from '@/lang/ar/ui/idea-card.json';
import ideaSubmissionDialogAr from '@/lang/ar/ui/idea-submission-dialog.json';
import localizedFormAr from '@/lang/ar/ui/localized-form.json';
import paginationAr from '@/lang/ar/ui/pagination.json';
import searchAndFilterAr from '@/lang/ar/ui/search-and-filter.json';
import teamMemberManagerAr from '@/lang/ar/ui/team-member-manager.json';
import aiEvaluationTabEn from '@/lang/en/components/ai-evaluation-tab.json';
import aiEvaluationWizardEn from '@/lang/en/components/ai-evaluation-wizard.json';
import announcementEn from '@/lang/en/components/announcement.json';
import attachmentEn from '@/lang/en/components/attachment.json';
import messagingEn from '@/lang/en/components/messaging.json';
import dashboardEn from '@/lang/en/dashboard.json';
import mockDataEn from '@/lang/en/mock-data.json';
import addIdeaDialogEn from '@/lang/en/ui/add-idea-dialog.json';
import dataGridEn from '@/lang/en/ui/data-grid.json';
import dataTableEn from '@/lang/en/ui/data-table.json';
import ideaCardEn from '@/lang/en/ui/idea-card.json';
import ideaSubmissionDialogEn from '@/lang/en/ui/idea-submission-dialog.json';
import localizedFormEn from '@/lang/en/ui/localized-form.json';
import paginationEn from '@/lang/en/ui/pagination.json';
import searchAndFilterEn from '@/lang/en/ui/search-and-filter.json';
import teamMemberManagerEn from '@/lang/en/ui/team-member-manager.json';

// Add custom zod translation files
import zodAr from '@/lang/ar/zod.json';
import zodEn from '@/lang/en/zod.json';

i18n.use(initReactI18next).init({
    resources: {
        ar: {
            admin: adminAr,
            automation: automationAr,
            common: commonAr,
            app: appAr,
            auth: authAr,
            enums: enumsAr,
            'evaluation-settings': evaluationSettingsAr,
            evaluation_settings: evaluationSettingsAr2,
            evaluation: evaluationAr,
            models: modelsAr,
            navigation: navigationAr,
            integration_hub: integrationHubAr,
            plugins_marketplace: pluginsMarketplaceAr,
            reports: reportsAr,
            settings: settingsAr,
            sidebar: sidebarAr,
            user: userAr,
            'user/idea-form': userIdeaFormAr,
            public: publicAr,
            'evaluator/jury': evaluatorJuryAr,
            jury: evaluatorJuryAr,
            'admin/jury-voting': adminJuryVotingAr,
            'ui/data-grid': dataGridAr,
            'ui/data-table': dataTableAr,
            'ui/localized-form': localizedFormAr,
            'ui/pagination': paginationAr,
            'ui/search-and-filter': searchAndFilterAr,
            'ui/team-member-manager': teamMemberManagerAr,
            'ui/add-idea-dialog': addIdeaDialogAr,
            'ui/idea-card': ideaCardAr,
            'ui/idea-submission-dialog': ideaSubmissionDialogAr,
            'components/attachment': attachmentAr,
            'components/announcement': announcementAr,
            'components/ai-evaluation-tab': aiEvaluationTabAr,
            'components/ai-evaluation-wizard': aiEvaluationWizardAr,
            'components/messaging': messagingAr,
            dashboard: dashboardAr,
            'mock-data': mockDataAr,
            zod: zodAr,
            discovery: discoveryAr,
            errors: errorsAr,
            forecasting: forecastingAr,
            'financial-dashboard': financialDashboardAr,
        },
        en: {
            admin: adminEn,
            automation: automationEn,
            common: commonEn,
            app: appEn,
            auth: authEn,
            enums: enumsEn,
            'evaluation-settings': evaluationSettingsEn,
            evaluation_settings: evaluationSettingsEn2,
            evaluation: evaluationEn,
            models: modelsEn,
            navigation: navigationEn,
            integration_hub: integrationHubEn,
            plugins_marketplace: pluginsMarketplaceEn,
            reports: reportsEn,
            settings: settingsEn,
            sidebar: sidebarEn,
            user: userEn,
            'user/idea-form': userIdeaFormEn,
            public: publicEn,
            'evaluator/jury': evaluatorJuryEn,
            jury: evaluatorJuryEn,
            'admin/jury-voting': adminJuryVotingEn,
            'ui/data-grid': dataGridEn,
            'ui/data-table': dataTableEn,
            'ui/localized-form': localizedFormEn,
            'ui/pagination': paginationEn,
            'ui/search-and-filter': searchAndFilterEn,
            'ui/team-member-manager': teamMemberManagerEn,
            'ui/add-idea-dialog': addIdeaDialogEn,
            'ui/idea-card': ideaCardEn,
            'ui/idea-submission-dialog': ideaSubmissionDialogEn,
            'components/attachment': attachmentEn,
            'components/announcement': announcementEn,
            'components/ai-evaluation-tab': aiEvaluationTabEn,
            'components/ai-evaluation-wizard': aiEvaluationWizardEn,
            'components/messaging': messagingEn,
            dashboard: dashboardEn,
            'mock-data': mockDataEn,
            zod: zodEn,
            discovery: discoveryEn,
            errors: errorsEn,
            forecasting: forecastingEn,
            'financial-dashboard': financialDashboardEn,
        },
    },
    defaultNS: 'common',
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: {
        escapeValue: false,
    },
    ns: [
        'admin',
        'automation',
        'common',
        'app',
        'auth',
        'dashboard',
        'discovery',
        'enums',
        'evaluation-settings',
        'evaluation_settings',
        'evaluation',
        'mock-data',
        'models',
        'navigation',
        'reports',
        'settings',
        'sidebar',
        'user',
        'user/idea-form',
        'public',
        'evaluator/jury',
        'jury',
        'admin/jury-voting',
        'integration_hub',
        'plugins_marketplace',
        'ui/data-grid',
        'ui/data-table',
        'ui/localized-form',
        'ui/pagination',
        'ui/search-and-filter',
        'ui/team-member-manager',
        'ui/add-idea-dialog',
        'ui/idea-card',
        'ui/idea-submission-dialog',
        'components/attachment',
        'components/announcement',
        'components/ai-evaluation-tab',
        'components/ai-evaluation-wizard',
        'components/messaging',
        'zod',
        'errors',
        'forecasting',
        'financial-dashboard',
    ],
});

// Function to sync i18next with Laravel's current locale
export function changeLanguage(locale: string) {
    if (i18n.language !== locale) {
        i18n.changeLanguage(locale);
    }
}

export default i18n;
