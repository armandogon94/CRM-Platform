export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  logo?: string;
  sidebarLabels?: Record<string, string>;
}

export const INDUSTRY_THEMES: Record<string, ThemeConfig> = {
  novapay: {
    primaryColor: '#2563EB',
    secondaryColor: '#1D4ED8',
    companyName: 'NovaPay',
    sidebarLabels: {
      overview: 'Overview',
      boards: 'Boards',
      automations: 'Automations',
    },
  },
  medvista: {
    primaryColor: '#059669',
    secondaryColor: '#047857',
    companyName: 'MedVista',
    sidebarLabels: {
      overview: 'Overview',
      boards: 'Patient Boards',
      automations: 'Care Automations',
    },
  },
  trustguard: {
    primaryColor: '#1E3A5F',
    secondaryColor: '#162D4A',
    companyName: 'TrustGuard',
    sidebarLabels: {
      overview: 'Overview',
      boards: 'Policy Boards',
      automations: 'Compliance Rules',
    },
  },
  urbannest: {
    primaryColor: '#D97706',
    secondaryColor: '#B45309',
    companyName: 'UrbanNest',
    sidebarLabels: {
      overview: 'Overview',
      boards: 'Property Boards',
      automations: 'Listing Rules',
    },
  },
  swiftroute: {
    primaryColor: '#7C3AED',
    secondaryColor: '#6D28D9',
    companyName: 'SwiftRoute',
    sidebarLabels: {
      overview: 'Overview',
      boards: 'Route Boards',
      automations: 'Dispatch Rules',
    },
  },
  dentaflow: {
    primaryColor: '#06B6D4',
    secondaryColor: '#0891B2',
    companyName: 'DentaFlow',
    sidebarLabels: {
      overview: 'Overview',
      boards: 'Patient Boards',
      automations: 'Appointment Rules',
    },
  },
  jurispath: {
    primaryColor: '#166534',
    secondaryColor: '#15803D',
    companyName: 'JurisPath',
    sidebarLabels: {
      overview: 'Overview',
      boards: 'Case Boards',
      automations: 'Case Rules',
    },
  },
  tablesync: {
    primaryColor: '#9F1239',
    secondaryColor: '#881337',
    companyName: 'TableSync',
    sidebarLabels: {
      overview: 'Overview',
      boards: 'Venue Boards',
      automations: 'Booking Rules',
    },
  },
  cranestack: {
    primaryColor: '#EA580C',
    secondaryColor: '#C2410C',
    companyName: 'CraneStack',
    sidebarLabels: {
      overview: 'Overview',
      boards: 'Project Boards',
      automations: 'Site Rules',
    },
  },
  edupulse: {
    primaryColor: '#6D28D9',
    secondaryColor: '#5B21B6',
    companyName: 'EduPulse',
    sidebarLabels: {
      overview: 'Overview',
      boards: 'Course Boards',
      automations: 'Learning Rules',
    },
  },
};
