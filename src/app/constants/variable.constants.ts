import { text } from '@fortawesome/fontawesome-svg-core';
import { CountryISO } from 'ngx-intl-tel-input';
import { environment } from 'src/environments/environment';
import { TimezonePipe } from '../pipes/timezone.pipe';

// export const RECORDING_POPUP =
//   'https://crmgrow-record2.s3-us-east-2.amazonaws.com';
export const RECORDING_POPUP =
  'https://crmgrow-record.s3-us-west-1.amazonaws.com';

export const SCHEDULE_DEMO =
  'https://calendly.com/support-1196/crmgrow-1-hour-session';

export const CONTACT_SORT_OPTIONS = {
  alpha_down: { dir: true, field: 'name', name: 'alpha_down' },
  alpha_up: { dir: false, field: 'name', name: 'alpha_up' },
  last_added: { dir: false, field: 'create_at', name: 'last_added' },
  last_activity: { dir: true, field: 'updated_at', name: 'last_active' }
};
export const STATUS = {
  NONE: 'none',
  REQUEST: 'request',
  SUCCESS: 'success',
  FAILURE: 'failure'
};
export const COMPANIES = ['eXp Realty', 'Choose other'];
export const ALL_COMPANIES = [
  { label: 'Berkshire Hathaway', type: 'normal' },
  { label: 'Century 21', type: 'normal' },
  { label: 'Coldwell Banker', type: 'normal' },
  { label: 'Compass', type: 'normal' },
  { label: 'eXp Realty', type: 'normal' },
  { label: 'Keller Williams', type: 'normal' },
  { label: 'RE/MAX', type: 'normal' },
  { label: 'Other', type: 'other' }
];
export const MONTH = [
  { id: '1', text: 'January' },
  { id: '2', text: 'February' },
  { id: '3', text: 'March' },
  { id: '4', text: 'April' },
  { id: '5', text: 'May' },
  { id: '6', text: 'June' },
  { id: '7', text: 'July' },
  { id: '8', text: 'August' },
  { id: '9', text: 'September' },
  { id: '10', text: 'October' },
  { id: '11', text: 'November' },
  { id: '12', text: 'December' }
];
export const YEAR = [
  { id: '2021', text: '2021' },
  { id: '2022', text: '2022' },
  { id: '2023', text: '2023' },
  { id: '2024', text: '2024' },
  { id: '2025', text: '2025' },
  { id: '2026', text: '2026' },
  { id: '2027', text: '2027' },
  { id: '2028', text: '2028' },
  { id: '2029', text: '2029' },
  { id: '2030', text: '2030' },
  { id: '2031', text: '2031' },
  { id: '2032', text: '2032' }
];
export const TIMES = [
  { id: '00:00:00.000', text: '12:00 AM' },
  { id: '00:15:00.000', text: '12:15 AM' },
  { id: '00:30:00.000', text: '12:30 AM' },
  { id: '00:45:00.000', text: '12:45 AM' },
  { id: '01:00:00.000', text: '1:00 AM' },
  { id: '01:15:00.000', text: '1:15 AM' },
  { id: '01:30:00.000', text: '1:30 AM' },
  { id: '01:45:00.000', text: '1:45 AM' },
  { id: '02:00:00.000', text: '2:00 AM' },
  { id: '02:15:00.000', text: '2:15 AM' },
  { id: '02:30:00.000', text: '2:30 AM' },
  { id: '02:45:00.000', text: '2:45 AM' },
  { id: '03:00:00.000', text: '3:00 AM' },
  { id: '03:15:00.000', text: '3:15 AM' },
  { id: '03:30:00.000', text: '3:30 AM' },
  { id: '03:45:00.000', text: '3:45 AM' },
  { id: '04:00:00.000', text: '4:00 AM' },
  { id: '04:15:00.000', text: '4:15 AM' },
  { id: '04:30:00.000', text: '4:30 AM' },
  { id: '04:45:00.000', text: '4:45 AM' },
  { id: '05:00:00.000', text: '5:00 AM' },
  { id: '05:15:00.000', text: '5:15 AM' },
  { id: '05:30:00.000', text: '5:30 AM' },
  { id: '05:45:00.000', text: '5:45 AM' },
  { id: '06:00:00.000', text: '6:00 AM' },
  { id: '06:15:00.000', text: '6:15 AM' },
  { id: '06:30:00.000', text: '6:30 AM' },
  { id: '06:45:00.000', text: '6:45 AM' },
  { id: '07:00:00.000', text: '7:00 AM' },
  { id: '07:15:00.000', text: '7:15 AM' },
  { id: '07:30:00.000', text: '7:30 AM' },
  { id: '07:45:00.000', text: '7:45 AM' },
  { id: '08:00:00.000', text: '8:00 AM' },
  { id: '08:15:00.000', text: '8:15 AM' },
  { id: '08:30:00.000', text: '8:30 AM' },
  { id: '08:45:00.000', text: '8:45 AM' },
  { id: '09:00:00.000', text: '9:00 AM' },
  { id: '09:15:00.000', text: '9:15 AM' },
  { id: '09:30:00.000', text: '9:30 AM' },
  { id: '09:45:00.000', text: '9:45 AM' },
  { id: '10:00:00.000', text: '10:00 AM' },
  { id: '10:15:00.000', text: '10:15 AM' },
  { id: '10:30:00.000', text: '10:30 AM' },
  { id: '10:45:00.000', text: '10:45 AM' },
  { id: '11:00:00.000', text: '11:00 AM' },
  { id: '11:15:00.000', text: '11:15 AM' },
  { id: '11:30:00.000', text: '11:30 AM' },
  { id: '11:45:00.000', text: '11:45 AM' },
  { id: '12:00:00.000', text: '12:00 PM' },
  { id: '12:15:00.000', text: '12:15 PM' },
  { id: '12:30:00.000', text: '12:30 PM' },
  { id: '12:45:00.000', text: '12:45 PM' },
  { id: '13:00:00.000', text: '1:00 PM' },
  { id: '13:15:00.000', text: '1:15 PM' },
  { id: '13:30:00.000', text: '1:30 PM' },
  { id: '13:45:00.000', text: '1:45 PM' },
  { id: '14:00:00.000', text: '2:00 PM' },
  { id: '14:15:00.000', text: '2:15 PM' },
  { id: '14:30:00.000', text: '2:30 PM' },
  { id: '14:45:00.000', text: '2:45 PM' },
  { id: '15:00:00.000', text: '3:00 PM' },
  { id: '15:15:00.000', text: '3:15 PM' },
  { id: '15:30:00.000', text: '3:30 PM' },
  { id: '15:45:00.000', text: '3:45 PM' },
  { id: '16:00:00.000', text: '4:00 PM' },
  { id: '16:15:00.000', text: '4:15 PM' },
  { id: '16:30:00.000', text: '4:30 PM' },
  { id: '16:45:00.000', text: '4:45 PM' },
  { id: '17:00:00.000', text: '5:00 PM' },
  { id: '17:15:00.000', text: '5:15 PM' },
  { id: '17:30:00.000', text: '5:30 PM' },
  { id: '17:45:00.000', text: '5:45 PM' },
  { id: '18:00:00.000', text: '6:00 PM' },
  { id: '18:15:00.000', text: '6:15 PM' },
  { id: '18:30:00.000', text: '6:30 PM' },
  { id: '18:45:00.000', text: '6:45 PM' },
  { id: '19:00:00.000', text: '7:00 PM' },
  { id: '19:15:00.000', text: '7:15 PM' },
  { id: '19:30:00.000', text: '7:30 PM' },
  { id: '19:45:00.000', text: '7:45 PM' },
  { id: '20:00:00.000', text: '8:00 PM' },
  { id: '20:15:00.000', text: '8:15 PM' },
  { id: '20:30:00.000', text: '8:30 PM' },
  { id: '20:45:00.000', text: '8:45 PM' },
  { id: '21:00:00.000', text: '9:00 PM' },
  { id: '21:15:00.000', text: '9:15 PM' },
  { id: '21:30:00.000', text: '9:30 PM' },
  { id: '21:45:00.000', text: '9:45 PM' },
  { id: '22:00:00.000', text: '10:00 PM' },
  { id: '22:15:00.000', text: '10:15 PM' },
  { id: '22:30:00.000', text: '10:30 PM' },
  { id: '22:45:00.000', text: '10:45 PM' },
  { id: '23:00:00.000', text: '11:00 PM' },
  { id: '23:15:00.000', text: '11:15 PM' },
  { id: '23:30:00.000', text: '11:30 PM' },
  { id: '23:45:00.000', text: '11:45 PM' }
];

export const WORK_TIMES = [
  { id: '08:00:00.000', text: '8:00 AM' },
  { id: '08:15:00.000', text: '8:15 AM' },
  { id: '08:30:00.000', text: '8:30 AM' },
  { id: '08:45:00.000', text: '8:45 AM' },
  { id: '09:00:00.000', text: '9:00 AM' },
  { id: '09:15:00.000', text: '9:15 AM' },
  { id: '09:30:00.000', text: '9:30 AM' },
  { id: '09:45:00.000', text: '9:45 AM' },
  { id: '10:00:00.000', text: '10:00 AM' },
  { id: '10:15:00.000', text: '10:15 AM' },
  { id: '10:30:00.000', text: '10:30 AM' },
  { id: '10:45:00.000', text: '10:45 AM' },
  { id: '11:00:00.000', text: '11:00 AM' },
  { id: '11:15:00.000', text: '11:15 AM' },
  { id: '11:30:00.000', text: '11:30 AM' },
  { id: '11:45:00.000', text: '11:45 AM' },
  { id: '12:00:00.000', text: '12:00 PM' },
  { id: '12:15:00.000', text: '12:15 PM' },
  { id: '12:30:00.000', text: '12:30 PM' },
  { id: '12:45:00.000', text: '12:45 PM' },
  { id: '13:00:00.000', text: '1:00 PM' },
  { id: '13:15:00.000', text: '1:15 PM' },
  { id: '13:30:00.000', text: '1:30 PM' },
  { id: '13:45:00.000', text: '1:45 PM' },
  { id: '14:00:00.000', text: '2:00 PM' },
  { id: '14:15:00.000', text: '2:15 PM' },
  { id: '14:30:00.000', text: '2:30 PM' },
  { id: '14:45:00.000', text: '2:45 PM' },
  { id: '15:00:00.000', text: '3:00 PM' },
  { id: '15:15:00.000', text: '3:15 PM' },
  { id: '15:30:00.000', text: '3:30 PM' },
  { id: '15:45:00.000', text: '3:45 PM' },
  { id: '16:00:00.000', text: '4:00 PM' },
  { id: '16:15:00.000', text: '4:15 PM' },
  { id: '16:30:00.000', text: '4:30 PM' },
  { id: '16:45:00.000', text: '4:45 PM' },
  { id: '17:00:00.000', text: '5:00 PM' },
  { id: '17:15:00.000', text: '5:15 PM' },
  { id: '17:30:00.000', text: '5:30 PM' },
  { id: '17:45:00.000', text: '5:45 PM' },
  { id: '18:00:00.000', text: '6:00 PM' }
];

export const HOURS = [
  { id: '00:00:00.000', text: '12:00 AM' },
  { id: '01:00:00.000', text: '1:00 AM' },
  { id: '02:00:00.000', text: '2:00 AM' },
  { id: '03:00:00.000', text: '3:00 AM' },
  { id: '04:00:00.000', text: '4:00 AM' },
  { id: '05:00:00.000', text: '5:00 AM' },
  { id: '06:00:00.000', text: '6:00 AM' },
  { id: '07:00:00.000', text: '7:00 AM' },
  { id: '08:00:00.000', text: '8:00 AM' },
  { id: '09:00:00.000', text: '9:00 AM' },
  { id: '10:00:00.000', text: '10:00 AM' },
  { id: '11:00:00.000', text: '11:00 AM' },
  { id: '12:00:00.000', text: '12:00 PM' },
  { id: '13:00:00.000', text: '1:00 PM' },
  { id: '14:00:00.000', text: '2:00 PM' },
  { id: '15:00:00.000', text: '3:00 PM' },
  { id: '16:00:00.000', text: '4:00 PM' },
  { id: '17:00:00.000', text: '5:00 PM' },
  { id: '18:00:00.000', text: '6:00 PM' },
  { id: '19:00:00.000', text: '7:00 PM' },
  { id: '20:00:00.000', text: '8:00 PM' },
  { id: '21:00:00.000', text: '9:00 PM' },
  { id: '22:00:00.000', text: '10:00 PM' },
  { id: '23:00:00.000', text: '11:00 PM' }
];

const TMP_COUNTRIES = [CountryISO.UnitedStates, CountryISO.Canada];
for (const country in CountryISO) {
  if (country === 'UnitedStates' || country === 'Canada') continue;
  TMP_COUNTRIES.push(CountryISO[country]);
}

export const PHONE_COUNTRIES = TMP_COUNTRIES;

export const COUNTRY_CODES = {
  USA: 'US',
  CAN: 'CA',
  GBR: 'GB',
  ZAF: 'ZA'
};

export const ROUTE_PAGE = {
  '/home': 'Dashboard',
  '/task': 'Dashboard',
  '/activities': 'Dashboard',
  '/contacts': 'Contacts',
  '/deals': 'Deals',
  '/materials': 'Materials',
  '/autoflow': 'Automations',
  '/settings/tag-manager': 'Tag manager',
  '/teams': 'Teams',
  '/automations': 'Automations',
  '/templates-list/own': 'Templates',
  '/templates-list/library': 'Template Library'
};

export const COUNTRIES = [
  {
    code: 'US',
    name: 'United States'
  },
  {
    code: 'CA',
    name: 'Canada'
  },
  {
    code: 'AU',
    name: 'Australia'
  },
  {
    code: 'FR',
    name: 'France'
  },
  {
    code: 'DE',
    name: 'Germany'
  },
  {
    code: 'IN',
    name: 'India'
  },
  {
    code: 'IT',
    name: 'Italy'
  },
  {
    code: 'MX',
    name: 'Mexico'
  },
  {
    code: 'PT',
    name: 'Portugal'
  },
  {
    code: 'PR',
    name: 'Puerto Rico'
  },
  {
    code: 'ZA',
    name: 'South Africa'
  },
  {
    code: 'ES',
    name: 'Spain'
  },
  {
    code: 'CH',
    name: 'Switzerland'
  },
  {
    code: 'UK',
    name: 'United Kingdom'
  },
  {
    code: 'HK',
    name: 'Hong Kong'
  }
];
export const REGIONS = {
  US: [
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Florida',
    'Georgia',
    'Guam',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Palau',
    'Pennsylvania',
    'Puerto Rico',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming',
    'District of Columbia'
  ],
  CA: [
    'Alberta',
    'British Columbia',
    'Manitoba',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Nova Scotia',
    'Ontario',
    'Prince Edward Island',
    'Quebec',
    'Saskatchewan'
  ]
};

export const STAGES = [
  'Initial Contact Made',
  'Attraction Material Shared',
  'Attended Webinar or demo',
  'Interested in joining',
  'Application submitted',
  'Joined company',
  'Long term follow-up',
  'Not interested now',
  'Not interest(lost)',
  'Attended Lunch & Learn'
];

const NEW_TIMEZONE = [
  {
    country: 'US & Canada',
    timezones: [
      {
        country: 'US & Canada',
        name: 'PST (Pacific Standard Time: UTC -08)',
        zone: '-08:00',
        tz_name: 'America/Los_Angeles',
        standard: '-08:00',
        daylight: '-07:00'
      },
      {
        country: 'US & Canada',
        name: 'MST (Mountain Standard Time: UTC -07)',
        zone: '-07:00',
        tz_name: 'America/Denver',
        standard: '-07:00',
        daylight: '-06:00'
      },
      {
        country: 'US & Canada',
        name: 'CST (Central Standard Time: UTC -06)',
        zone: '-06:00',
        tz_name: 'America/Chicago',
        standard: '-06:00',
        daylight: '-05:00'
      },
      {
        country: 'US & Canada',
        name: 'EST (Eastern Standard Time: UTC -05)',
        zone: '-05:00',
        tz_name: 'America/New_York',
        standard: '-05:00',
        daylight: '-04:00'
      },
      {
        country: 'US & Canada',
        name: 'AST (Atlantic Standard Time: UTC -04)',
        zone: '-04:00',
        tz_name: 'America/Halifax',
        standard: '-04:00',
        daylight: '-03:00'
      }
    ]
  },
  {
    country: 'OTHER',
    timezones: [
      {
        value: 'US Eastern Standard Time',
        abbr: 'UEDT',
        offset: -4,
        isdst: true,
        text: '(UTC-05:00) Indiana (East)',
        utc: [
          'America/Indiana/Marengo',
          'America/Indiana/Vevay',
          'America/Indianapolis'
        ]
      },
      {
        value: 'US Mountain Standard Time',
        abbr: 'UMST',
        offset: -7,
        isdst: false,
        text: '(UTC-07:00) Arizona',
        utc: [
          'America/Creston',
          'America/Dawson',
          'America/Dawson_Creek',
          'America/Hermosillo',
          'America/Phoenix',
          'America/Whitehorse',
          'Etc/GMT+7'
        ]
      },
      {
        value: 'SA Pacific Standard Time',
        abbr: 'SPST',
        offset: -5,
        isdst: false,
        text: '(UTC-05:00) Bogota, Lima, Quito',
        utc: [
          'America/Bogota',
          'America/Cayman',
          'America/Coral_Harbour',
          'America/Eirunepe',
          'America/Guayaquil',
          'America/Jamaica',
          'America/Lima',
          'America/Panama',
          'America/Rio_Branco',
          'Etc/GMT+5'
        ]
      },

      {
        value: 'Canada Central Standard Time',
        abbr: 'CCST',
        offset: -6,
        isdst: false,
        text: '(UTC-06:00) Saskatchewan',
        utc: ['America/Regina', 'America/Swift_Current']
      },
      {
        value: 'Dateline Standard Time',
        abbr: 'DST',
        offset: -12,
        isdst: false,
        text: '(UTC-12:00) International Date Line West',
        utc: ['Etc/GMT+12']
      },
      {
        value: 'UTC-11',
        abbr: 'U',
        offset: -11,
        isdst: false,
        text: '(UTC-11:00) Coordinated Universal Time-11',
        utc: [
          'Etc/GMT+11',
          'Pacific/Midway',
          'Pacific/Niue',
          'Pacific/Pago_Pago'
        ]
      },
      {
        value: 'Pacific Standard Time (Mexico)',
        abbr: 'PDT',
        offset: -7,
        isdst: true,
        text: '(UTC-08:00) Baja California',
        utc: ['America/Santa_Isabel']
      },
      {
        value: 'Mountain Standard Time (Mexico)',
        abbr: 'MDT',
        offset: -6,
        isdst: true,
        text: '(UTC-07:00) Chihuahua, La Paz, Mazatlan',
        utc: ['America/Chihuahua', 'America/Mazatlan']
      },
      {
        value: 'Central America Standard Time',
        abbr: 'CAST',
        offset: -6,
        isdst: false,
        text: '(UTC-06:00) Central America',
        utc: [
          'America/Belize',
          'America/Costa_Rica',
          'America/El_Salvador',
          'America/Guatemala',
          'America/Managua',
          'America/Tegucigalpa',
          'Etc/GMT+6',
          'Pacific/Galapagos'
        ]
      },
      {
        value: 'Central Standard Time (Mexico)',
        abbr: 'CDT',
        offset: -5,
        isdst: true,
        text: '(UTC-06:00) Guadalajara, Mexico City, Monterrey',
        utc: [
          'America/Bahia_Banderas',
          'America/Cancun',
          'America/Merida',
          'America/Mexico_City',
          'America/Monterrey'
        ]
      },
      {
        value: 'Venezuela Standard Time',
        abbr: 'VST',
        offset: -4.5,
        isdst: false,
        text: '(UTC-04:30) Caracas',
        utc: ['America/Caracas']
      },
      {
        value: 'Paraguay Standard Time',
        abbr: 'PYT',
        offset: -4,
        isdst: false,
        text: '(UTC-04:00) Asuncion',
        utc: ['America/Asuncion']
      },
      {
        value: 'Central Brazilian Standard Time',
        abbr: 'CBST',
        offset: -4,
        isdst: false,
        text: '(UTC-04:00) Cuiaba',
        utc: ['America/Campo_Grande', 'America/Cuiaba']
      },
      {
        value: 'SA Western Standard Time',
        abbr: 'SWST',
        offset: -4,
        isdst: false,
        text: '(UTC-04:00) Georgetown, La Paz, Manaus, San Juan',
        utc: [
          'America/Anguilla',
          'America/Antigua',
          'America/Aruba',
          'America/Barbados',
          'America/Blanc-Sablon',
          'America/Boa_Vista',
          'America/Curacao',
          'America/Dominica',
          'America/Grand_Turk',
          'America/Grenada',
          'America/Guadeloupe',
          'America/Guyana',
          'America/Kralendijk',
          'America/La_Paz',
          'America/Lower_Princes',
          'America/Manaus',
          'America/Marigot',
          'America/Martinique',
          'America/Montserrat',
          'America/Port_of_Spain',
          'America/Porto_Velho',
          'America/Puerto_Rico',
          'America/Santo_Domingo',
          'America/St_Barthelemy',
          'America/St_Kitts',
          'America/St_Lucia',
          'America/St_Thomas',
          'America/St_Vincent',
          'America/Tortola',
          'Etc/GMT+4'
        ]
      },
      {
        value: 'Pacific SA Standard Time',
        abbr: 'PSST',
        offset: -4,
        isdst: false,
        text: '(UTC-04:00) Santiago',
        utc: ['America/Santiago', 'Antarctica/Palmer']
      },
      {
        value: 'E. South America Standard Time',
        abbr: 'ESAST',
        offset: -3,
        isdst: false,
        text: '(UTC-03:00) Brasilia',
        utc: ['America/Sao_Paulo']
      },
      {
        value: 'Argentina Standard Time',
        abbr: 'AST',
        offset: -3,
        isdst: false,
        text: '(UTC-03:00) Buenos Aires',
        utc: [
          'America/Argentina/La_Rioja',
          'America/Argentina/Rio_Gallegos',
          'America/Argentina/Salta',
          'America/Argentina/San_Juan',
          'America/Argentina/San_Luis',
          'America/Argentina/Tucuman',
          'America/Argentina/Ushuaia',
          'America/Buenos_Aires',
          'America/Catamarca',
          'America/Cordoba',
          'America/Jujuy',
          'America/Mendoza'
        ]
      },
      {
        value: 'SA Eastern Standard Time',
        abbr: 'SEST',
        offset: -3,
        isdst: false,
        text: '(UTC-03:00) Cayenne, Fortaleza',
        utc: [
          'America/Araguaina',
          'America/Belem',
          'America/Cayenne',
          'America/Fortaleza',
          'America/Maceio',
          'America/Paramaribo',
          'America/Recife',
          'America/Santarem',
          'Antarctica/Rothera',
          'Atlantic/Stanley',
          'Etc/GMT+3'
        ]
      },
      {
        value: 'Greenland Standard Time',
        abbr: 'GDT',
        offset: -3,
        isdst: true,
        text: '(UTC-03:00) Greenland',
        utc: ['America/Godthab']
      },
      {
        value: 'Montevideo Standard Time',
        abbr: 'MST',
        offset: -3,
        isdst: false,
        text: '(UTC-03:00) Montevideo',
        utc: ['America/Montevideo']
      },
      {
        value: 'Bahia Standard Time',
        abbr: 'BST',
        offset: -3,
        isdst: false,
        text: '(UTC-03:00) Salvador',
        utc: ['America/Bahia']
      },
      {
        value: 'UTC-02',
        abbr: 'U',
        offset: -2,
        isdst: false,
        text: '(UTC-02:00) Coordinated Universal Time-02',
        utc: ['America/Noronha', 'Atlantic/South_Georgia', 'Etc/GMT+2']
      },
      {
        value: 'Azores Standard Time',
        abbr: 'ADT',
        offset: 0,
        isdst: true,
        text: '(UTC-01:00) Azores',
        utc: ['America/Scoresbysund', 'Atlantic/Azores']
      },
      {
        value: 'Cape Verde Standard Time',
        abbr: 'CVST',
        offset: -1,
        isdst: false,
        text: '(UTC-01:00) Cape Verde Is.',
        utc: ['Atlantic/Cape_Verde', 'Etc/GMT+1']
      },
      {
        value: 'Morocco Standard Time',
        abbr: 'MDT',
        offset: 1,
        isdst: true,
        text: '(UTC) Casablanca',
        utc: ['Africa/Casablanca', 'Africa/El_Aaiun']
      },
      {
        value: 'UTC',
        abbr: 'UTC',
        offset: 0,
        isdst: false,
        text: '(UTC) Coordinated Universal Time',
        utc: ['America/Danmarkshavn', 'Etc/GMT']
      },
      {
        value: 'GMT Standard Time',
        abbr: 'GMT',
        offset: 0,
        isdst: false,
        text: '(UTC) Edinburgh, London',
        utc: [
          'Europe/Isle_of_Man',
          'Europe/Guernsey',
          'Europe/Jersey',
          'Europe/London'
        ]
      },
      {
        value: 'British Summer Time',
        abbr: 'BST',
        offset: 1,
        isdst: true,
        text: '(UTC+01:00) Edinburgh, London',
        utc: [
          'Europe/Isle_of_Man',
          'Europe/Guernsey',
          'Europe/Jersey',
          'Europe/London'
        ]
      },
      {
        value: 'GMT Standard Time',
        abbr: 'GDT',
        offset: 1,
        isdst: true,
        text: '(UTC) Dublin, Lisbon',
        utc: [
          'Atlantic/Canary',
          'Atlantic/Faeroe',
          'Atlantic/Madeira',
          'Europe/Dublin',
          'Europe/Lisbon'
        ]
      },
      {
        value: 'Greenwich Standard Time',
        abbr: 'GST',
        offset: 0,
        isdst: false,
        text: '(UTC) Monrovia, Reykjavik',
        utc: [
          'Africa/Abidjan',
          'Africa/Accra',
          'Africa/Bamako',
          'Africa/Banjul',
          'Africa/Bissau',
          'Africa/Conakry',
          'Africa/Dakar',
          'Africa/Freetown',
          'Africa/Lome',
          'Africa/Monrovia',
          'Africa/Nouakchott',
          'Africa/Ouagadougou',
          'Africa/Sao_Tome',
          'Atlantic/Reykjavik',
          'Atlantic/St_Helena'
        ]
      },
      {
        value: 'W. Europe Standard Time',
        abbr: 'WEDT',
        offset: 2,
        isdst: true,
        text: '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna',
        utc: [
          'Arctic/Longyearbyen',
          'Europe/Amsterdam',
          'Europe/Andorra',
          'Europe/Berlin',
          'Europe/Busingen',
          'Europe/Gibraltar',
          'Europe/Luxembourg',
          'Europe/Malta',
          'Europe/Monaco',
          'Europe/Oslo',
          'Europe/Rome',
          'Europe/San_Marino',
          'Europe/Stockholm',
          'Europe/Vaduz',
          'Europe/Vatican',
          'Europe/Vienna',
          'Europe/Zurich'
        ]
      },
      {
        value: 'Central Europe Standard Time',
        abbr: 'CEDT',
        offset: 2,
        isdst: true,
        text: '(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague',
        utc: [
          'Europe/Belgrade',
          'Europe/Bratislava',
          'Europe/Budapest',
          'Europe/Ljubljana',
          'Europe/Podgorica',
          'Europe/Prague',
          'Europe/Tirane'
        ]
      },
      {
        value: 'Romance Standard Time',
        abbr: 'RDT',
        offset: 2,
        isdst: true,
        text: '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris',
        utc: [
          'Africa/Ceuta',
          'Europe/Brussels',
          'Europe/Copenhagen',
          'Europe/Madrid',
          'Europe/Paris'
        ]
      },
      {
        value: 'Central European Standard Time',
        abbr: 'CEDT',
        offset: 2,
        isdst: true,
        text: '(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb',
        utc: [
          'Europe/Sarajevo',
          'Europe/Skopje',
          'Europe/Warsaw',
          'Europe/Zagreb'
        ]
      },
      {
        value: 'W. Central Africa Standard Time',
        abbr: 'WCAST',
        offset: 1,
        isdst: false,
        text: '(UTC+01:00) West Central Africa',
        utc: [
          'Africa/Algiers',
          'Africa/Bangui',
          'Africa/Brazzaville',
          'Africa/Douala',
          'Africa/Kinshasa',
          'Africa/Lagos',
          'Africa/Libreville',
          'Africa/Luanda',
          'Africa/Malabo',
          'Africa/Ndjamena',
          'Africa/Niamey',
          'Africa/Porto-Novo',
          'Africa/Tunis',
          'Etc/GMT-1'
        ]
      },
      {
        value: 'Namibia Standard Time',
        abbr: 'NST',
        offset: 1,
        isdst: false,
        text: '(UTC+01:00) Windhoek',
        utc: ['Africa/Windhoek']
      },
      {
        value: 'GTB Standard Time',
        abbr: 'GDT',
        offset: 3,
        isdst: true,
        text: '(UTC+02:00) Athens, Bucharest',
        utc: [
          'Asia/Nicosia',
          'Europe/Athens',
          'Europe/Bucharest',
          'Europe/Chisinau'
        ]
      },
      {
        value: 'Middle East Standard Time',
        abbr: 'MEDT',
        offset: 3,
        isdst: true,
        text: '(UTC+02:00) Beirut',
        utc: ['Asia/Beirut']
      },
      {
        value: 'Egypt Standard Time',
        abbr: 'EST',
        offset: 2,
        isdst: false,
        text: '(UTC+02:00) Cairo',
        utc: ['Africa/Cairo']
      },
      {
        value: 'Syria Standard Time',
        abbr: 'SDT',
        offset: 3,
        isdst: true,
        text: '(UTC+02:00) Damascus',
        utc: ['Asia/Damascus']
      },
      {
        value: 'E. Europe Standard Time',
        abbr: 'EEDT',
        offset: 3,
        isdst: true,
        text: '(UTC+02:00) E. Europe',
        utc: [
          'Asia/Nicosia',
          'Europe/Athens',
          'Europe/Bucharest',
          'Europe/Chisinau',
          'Europe/Helsinki',
          'Europe/Kiev',
          'Europe/Mariehamn',
          'Europe/Nicosia',
          'Europe/Riga',
          'Europe/Sofia',
          'Europe/Tallinn',
          'Europe/Uzhgorod',
          'Europe/Vilnius',
          'Europe/Zaporozhye'
        ]
      },
      {
        value: 'South Africa Standard Time',
        abbr: 'SAST',
        offset: 2,
        isdst: false,
        text: '(UTC+02:00) Harare, Pretoria',
        utc: [
          'Africa/Blantyre',
          'Africa/Bujumbura',
          'Africa/Gaborone',
          'Africa/Harare',
          'Africa/Johannesburg',
          'Africa/Kigali',
          'Africa/Lubumbashi',
          'Africa/Lusaka',
          'Africa/Maputo',
          'Africa/Maseru',
          'Africa/Mbabane',
          'Etc/GMT-2'
        ]
      },
      {
        value: 'FLE Standard Time',
        abbr: 'FDT',
        offset: 3,
        isdst: true,
        text: '(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius',
        utc: [
          'Europe/Helsinki',
          'Europe/Kiev',
          'Europe/Mariehamn',
          'Europe/Riga',
          'Europe/Sofia',
          'Europe/Tallinn',
          'Europe/Uzhgorod',
          'Europe/Vilnius',
          'Europe/Zaporozhye'
        ]
      },
      {
        value: 'Turkey Standard Time',
        abbr: 'TDT',
        offset: 3,
        isdst: false,
        text: '(UTC+03:00) Istanbul',
        utc: ['Europe/Istanbul']
      },
      {
        value: 'Israel Standard Time',
        abbr: 'JDT',
        offset: 3,
        isdst: true,
        text: '(UTC+02:00) Jerusalem',
        utc: ['Asia/Jerusalem']
      },
      {
        value: 'Libya Standard Time',
        abbr: 'LST',
        offset: 2,
        isdst: false,
        text: '(UTC+02:00) Tripoli',
        utc: ['Africa/Tripoli']
      },
      {
        value: 'Jordan Standard Time',
        abbr: 'JST',
        offset: 3,
        isdst: false,
        text: '(UTC+03:00) Amman',
        utc: ['Asia/Amman']
      },
      {
        value: 'Arabic Standard Time',
        abbr: 'AST',
        offset: 3,
        isdst: false,
        text: '(UTC+03:00) Baghdad',
        utc: ['Asia/Baghdad']
      },
      {
        value: 'Kaliningrad Standard Time',
        abbr: 'KST',
        offset: 3,
        isdst: false,
        text: '(UTC+02:00) Kaliningrad',
        utc: ['Europe/Kaliningrad']
      },
      {
        value: 'Arab Standard Time',
        abbr: 'AST',
        offset: 3,
        isdst: false,
        text: '(UTC+03:00) Kuwait, Riyadh',
        utc: [
          'Asia/Aden',
          'Asia/Bahrain',
          'Asia/Kuwait',
          'Asia/Qatar',
          'Asia/Riyadh'
        ]
      },
      {
        value: 'E. Africa Standard Time',
        abbr: 'EAST',
        offset: 3,
        isdst: false,
        text: '(UTC+03:00) Nairobi',
        utc: [
          'Africa/Addis_Ababa',
          'Africa/Asmera',
          'Africa/Dar_es_Salaam',
          'Africa/Djibouti',
          'Africa/Juba',
          'Africa/Kampala',
          'Africa/Khartoum',
          'Africa/Mogadishu',
          'Africa/Nairobi',
          'Antarctica/Syowa',
          'Etc/GMT-3',
          'Indian/Antananarivo',
          'Indian/Comoro',
          'Indian/Mayotte'
        ]
      },
      {
        value: 'Moscow Standard Time',
        abbr: 'MSK',
        offset: 3,
        isdst: false,
        text: '(UTC+03:00) Moscow, St. Petersburg, Volgograd, Minsk',
        utc: [
          'Europe/Kirov',
          'Europe/Moscow',
          'Europe/Simferopol',
          'Europe/Volgograd',
          'Europe/Minsk'
        ]
      },
      {
        value: 'Samara Time',
        abbr: 'SAMT',
        offset: 4,
        isdst: false,
        text: '(UTC+04:00) Samara, Ulyanovsk, Saratov',
        utc: ['Europe/Astrakhan', 'Europe/Samara', 'Europe/Ulyanovsk']
      },
      {
        value: 'Iran Standard Time',
        abbr: 'IDT',
        offset: 4.5,
        isdst: true,
        text: '(UTC+03:30) Tehran',
        utc: ['Asia/Tehran']
      },
      {
        value: 'Arabian Standard Time',
        abbr: 'AST',
        offset: 4,
        isdst: false,
        text: '(UTC+04:00) Abu Dhabi, Muscat',
        utc: ['Asia/Dubai', 'Asia/Muscat', 'Etc/GMT-4']
      },
      {
        value: 'Azerbaijan Standard Time',
        abbr: 'ADT',
        offset: 5,
        isdst: true,
        text: '(UTC+04:00) Baku',
        utc: ['Asia/Baku']
      },
      {
        value: 'Mauritius Standard Time',
        abbr: 'MST',
        offset: 4,
        isdst: false,
        text: '(UTC+04:00) Port Louis',
        utc: ['Indian/Mahe', 'Indian/Mauritius', 'Indian/Reunion']
      },
      {
        value: 'Georgian Standard Time',
        abbr: 'GET',
        offset: 4,
        isdst: false,
        text: '(UTC+04:00) Tbilisi',
        utc: ['Asia/Tbilisi']
      },
      {
        value: 'Caucasus Standard Time',
        abbr: 'CST',
        offset: 4,
        isdst: false,
        text: '(UTC+04:00) Yerevan',
        utc: ['Asia/Yerevan']
      },
      {
        value: 'Afghanistan Standard Time',
        abbr: 'AST',
        offset: 4.5,
        isdst: false,
        text: '(UTC+04:30) Kabul',
        utc: ['Asia/Kabul']
      },
      {
        value: 'West Asia Standard Time',
        abbr: 'WAST',
        offset: 5,
        isdst: false,
        text: '(UTC+05:00) Ashgabat, Tashkent',
        utc: [
          'Antarctica/Mawson',
          'Asia/Aqtau',
          'Asia/Aqtobe',
          'Asia/Ashgabat',
          'Asia/Dushanbe',
          'Asia/Oral',
          'Asia/Samarkand',
          'Asia/Tashkent',
          'Etc/GMT-5',
          'Indian/Kerguelen',
          'Indian/Maldives'
        ]
      },
      {
        value: 'Yekaterinburg Time',
        abbr: 'YEKT',
        offset: 5,
        isdst: false,
        text: '(UTC+05:00) Yekaterinburg',
        utc: ['Asia/Yekaterinburg']
      },
      {
        value: 'Pakistan Standard Time',
        abbr: 'PKT',
        offset: 5,
        isdst: false,
        text: '(UTC+05:00) Islamabad, Karachi',
        utc: ['Asia/Karachi']
      },
      {
        value: 'India Standard Time',
        abbr: 'IST',
        offset: 5.5,
        isdst: false,
        text: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
        utc: ['Asia/Kolkata', 'Asia/Calcutta']
      },
      {
        value: 'Sri Lanka Standard Time',
        abbr: 'SLST',
        offset: 5.5,
        isdst: false,
        text: '(UTC+05:30) Sri Jayawardenepura',
        utc: ['Asia/Colombo']
      },
      {
        value: 'Nepal Standard Time',
        abbr: 'NST',
        offset: 5.75,
        isdst: false,
        text: '(UTC+05:45) Kathmandu',
        utc: ['Asia/Kathmandu']
      },
      {
        value: 'Central Asia Standard Time',
        abbr: 'CAST',
        offset: 6,
        isdst: false,
        text: '(UTC+06:00) Nur-Sultan (Astana)',
        utc: [
          'Antarctica/Vostok',
          'Asia/Almaty',
          'Asia/Bishkek',
          'Asia/Qyzylorda',
          'Asia/Urumqi',
          'Etc/GMT-6',
          'Indian/Chagos'
        ]
      },
      {
        value: 'Bangladesh Standard Time',
        abbr: 'BST',
        offset: 6,
        isdst: false,
        text: '(UTC+06:00) Dhaka',
        utc: ['Asia/Dhaka', 'Asia/Thimphu']
      },
      {
        value: 'Myanmar Standard Time',
        abbr: 'MST',
        offset: 6.5,
        isdst: false,
        text: '(UTC+06:30) Yangon (Rangoon)',
        utc: ['Asia/Rangoon', 'Indian/Cocos']
      },
      {
        value: 'SE Asia Standard Time',
        abbr: 'SAST',
        offset: 7,
        isdst: false,
        text: '(UTC+07:00) Bangkok, Hanoi, Jakarta',
        utc: [
          'Antarctica/Davis',
          'Asia/Bangkok',
          'Asia/Hovd',
          'Asia/Jakarta',
          'Asia/Phnom_Penh',
          'Asia/Pontianak',
          'Asia/Saigon',
          'Asia/Vientiane',
          'Etc/GMT-7',
          'Indian/Christmas'
        ]
      },
      {
        value: 'N. Central Asia Standard Time',
        abbr: 'NCAST',
        offset: 7,
        isdst: false,
        text: '(UTC+07:00) Novosibirsk',
        utc: ['Asia/Novokuznetsk', 'Asia/Novosibirsk', 'Asia/Omsk']
      },
      {
        value: 'China Standard Time',
        abbr: 'CST',
        offset: 8,
        isdst: false,
        text: '(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi',
        utc: ['Asia/Hong_Kong', 'Asia/Macau', 'Asia/Shanghai']
      },
      {
        value: 'North Asia Standard Time',
        abbr: 'NAST',
        offset: 8,
        isdst: false,
        text: '(UTC+08:00) Krasnoyarsk',
        utc: ['Asia/Krasnoyarsk']
      },
      {
        value: 'Singapore Standard Time',
        abbr: 'MPST',
        offset: 8,
        isdst: false,
        text: '(UTC+08:00) Kuala Lumpur, Singapore',
        utc: [
          'Asia/Brunei',
          'Asia/Kuala_Lumpur',
          'Asia/Kuching',
          'Asia/Makassar',
          'Asia/Manila',
          'Asia/Singapore',
          'Etc/GMT-8'
        ]
      },
      {
        value: 'W. Australia Standard Time',
        abbr: 'WAST',
        offset: 8,
        isdst: false,
        text: '(UTC+08:00) Perth',
        utc: ['Antarctica/Casey', 'Australia/Perth']
      },
      {
        value: 'Taipei Standard Time',
        abbr: 'TST',
        offset: 8,
        isdst: false,
        text: '(UTC+08:00) Taipei',
        utc: ['Asia/Taipei']
      },
      {
        value: 'Ulaanbaatar Standard Time',
        abbr: 'UST',
        offset: 8,
        isdst: false,
        text: '(UTC+08:00) Ulaanbaatar',
        utc: ['Asia/Choibalsan', 'Asia/Ulaanbaatar']
      },
      {
        value: 'North Asia East Standard Time',
        abbr: 'NAEST',
        offset: 8,
        isdst: false,
        text: '(UTC+08:00) Irkutsk',
        utc: ['Asia/Irkutsk']
      },
      {
        value: 'Japan Standard Time',
        abbr: 'JST',
        offset: 9,
        isdst: false,
        text: '(UTC+09:00) Osaka, Sapporo, Tokyo',
        utc: [
          'Asia/Dili',
          'Asia/Jayapura',
          'Asia/Tokyo',
          'Etc/GMT-9',
          'Pacific/Palau'
        ]
      },
      {
        value: 'Korea Standard Time',
        abbr: 'KST',
        offset: 9,
        isdst: false,
        text: '(UTC+09:00) Seoul',
        utc: ['Asia/Pyongyang', 'Asia/Seoul']
      },
      {
        value: 'Cen. Australia Standard Time',
        abbr: 'CAST',
        offset: 9.5,
        isdst: false,
        text: '(UTC+09:30) Adelaide',
        utc: ['Australia/Adelaide', 'Australia/Broken_Hill']
      },
      {
        value: 'AUS Central Standard Time',
        abbr: 'ACST',
        offset: 9.5,
        isdst: false,
        text: '(UTC+09:30) Darwin',
        utc: ['Australia/Darwin']
      },
      {
        value: 'E. Australia Standard Time',
        abbr: 'EAST',
        offset: 10,
        isdst: false,
        text: '(UTC+10:00) Brisbane',
        utc: ['Australia/Brisbane', 'Australia/Lindeman']
      },
      {
        value: 'AUS Eastern Standard Time',
        abbr: 'AEST',
        offset: 10,
        isdst: false,
        text: '(UTC+10:00) Canberra, Melbourne, Sydney',
        utc: ['Australia/Melbourne', 'Australia/Sydney']
      },
      {
        value: 'West Pacific Standard Time',
        abbr: 'WPST',
        offset: 10,
        isdst: false,
        text: '(UTC+10:00) Guam, Port Moresby',
        utc: [
          'Antarctica/DumontDUrville',
          'Etc/GMT-10',
          'Pacific/Guam',
          'Pacific/Port_Moresby',
          'Pacific/Saipan',
          'Pacific/Truk'
        ]
      },
      {
        value: 'Tasmania Standard Time',
        abbr: 'TST',
        offset: 10,
        isdst: false,
        text: '(UTC+10:00) Hobart',
        utc: ['Australia/Currie', 'Australia/Hobart']
      },
      {
        value: 'Yakutsk Standard Time',
        abbr: 'YST',
        offset: 9,
        isdst: false,
        text: '(UTC+09:00) Yakutsk',
        utc: ['Asia/Chita', 'Asia/Khandyga', 'Asia/Yakutsk']
      },
      {
        value: 'Central Pacific Standard Time',
        abbr: 'CPST',
        offset: 11,
        isdst: false,
        text: '(UTC+11:00) Solomon Is., New Caledonia',
        utc: [
          'Antarctica/Macquarie',
          'Etc/GMT-11',
          'Pacific/Efate',
          'Pacific/Guadalcanal',
          'Pacific/Kosrae',
          'Pacific/Noumea',
          'Pacific/Ponape'
        ]
      },
      {
        value: 'Vladivostok Standard Time',
        abbr: 'VST',
        offset: 11,
        isdst: false,
        text: '(UTC+11:00) Vladivostok',
        utc: ['Asia/Sakhalin', 'Asia/Ust-Nera', 'Asia/Vladivostok']
      },
      {
        value: 'New Zealand Standard Time',
        abbr: 'NZST',
        offset: 12,
        isdst: false,
        text: '(UTC+12:00) Auckland, Wellington',
        utc: ['Antarctica/McMurdo', 'Pacific/Auckland']
      },
      {
        value: 'UTC+12',
        abbr: 'U',
        offset: 12,
        isdst: false,
        text: '(UTC+12:00) Coordinated Universal Time+12',
        utc: [
          'Etc/GMT-12',
          'Pacific/Funafuti',
          'Pacific/Kwajalein',
          'Pacific/Majuro',
          'Pacific/Nauru',
          'Pacific/Tarawa',
          'Pacific/Wake',
          'Pacific/Wallis'
        ]
      },
      {
        value: 'Fiji Standard Time',
        abbr: 'FST',
        offset: 12,
        isdst: false,
        text: '(UTC+12:00) Fiji',
        utc: ['Pacific/Fiji']
      },
      {
        value: 'Magadan Standard Time',
        abbr: 'MST',
        offset: 12,
        isdst: false,
        text: '(UTC+12:00) Magadan',
        utc: [
          'Asia/Anadyr',
          'Asia/Kamchatka',
          'Asia/Magadan',
          'Asia/Srednekolymsk'
        ]
      },
      {
        value: 'Kamchatka Standard Time',
        abbr: 'KDT',
        offset: 13,
        isdst: true,
        text: '(UTC+12:00) Petropavlovsk-Kamchatsky - Old',
        utc: ['Asia/Kamchatka']
      },
      {
        value: 'Tonga Standard Time',
        abbr: 'TST',
        offset: 13,
        isdst: false,
        text: "(UTC+13:00) Nuku'alofa",
        utc: [
          'Etc/GMT-13',
          'Pacific/Enderbury',
          'Pacific/Fakaofo',
          'Pacific/Tongatapu'
        ]
      },
      {
        value: 'Samoa Standard Time',
        abbr: 'SST',
        offset: 13,
        isdst: false,
        text: '(UTC+13:00) Samoa',
        utc: ['Pacific/Apia']
      }
    ]
  }
];

export const TIMEZONE = [
  {
    country: 'US',
    timezones: [
      {
        country: 'US',
        name: 'EDT (Eastern Daylight Time: UTC -04)',
        zone: '-04:00',
        tz_name: 'America/New_York',
        standard: '-05:00',
        daylight: '-04:00'
      },
      {
        country: 'US',
        name: 'CDT (Central Daylight Time: UTC -05)',
        zone: '-05:00',
        tz_name: 'America/Chicago',
        standard: '-06:00',
        daylight: '-05:00'
      },
      {
        country: 'US',
        name: 'PDT (Pacific Daylight Time: UTC -07)',
        zone: '-07:00',
        tz_name: 'America/Los_Angeles',
        standard: '-08:00',
        daylight: '-07:00'
      },
      {
        country: 'US',
        name: 'ADT (Alaska Daylight Time: UTC -08)',
        zone: '-08:00',
        tz_name: 'America/Anchorage',
        standard: '-09:00',
        daylight: '-08:00'
      },
      {
        country: 'US',
        name: 'HST (Hawaii Standard Time: UTC -10)',
        zone: '-10:00',
        tz_name: 'Pacific/Honolulu',
        standard: '-09:00',
        daylight: '-08:00'
      }
    ]
  },
  {
    country: 'CA',
    timezones: [
      {
        country: 'CA',
        name: 'PST (Pacific Standard Time: UTC -08)',
        zone: '-08:00',
        tz_name: 'America/Tijuana',
        standard: '-08:00',
        daylight: '-07:00'
      },
      {
        country: 'CA',
        name: 'MST (Mountain Standard Time: UTC -07)',
        zone: '-07:00',
        tz_name: 'America/Edmonton',
        standard: '-07:00',
        daylight: '-06:00'
      },
      {
        country: 'CA',
        name: 'CST (Central Standard Time: UTC -06)',
        zone: '-06:00',
        tz_name: 'America/Winnipeg',
        standard: '-06:00',
        daylight: '-05:00'
      },
      {
        country: 'CA',
        name: 'EST (Eastern Standard Time: UTC -05)',
        zone: '-05:00',
        tz_name: 'America/Toronto',
        standard: '-05:00',
        daylight: '-04:00'
      },
      {
        country: 'CA',
        name: 'AST (Atlantic Standard Time: UTC -04)',
        zone: '-04:00',
        tz_name: 'America/Halifax',
        standard: '-04:00',
        daylight: '-03:00'
      },
      {
        country: 'CA',
        name: 'NST (Newfoundland Standard Time: UTC -03:30)',
        zone: '-03:30',
        tz_name: 'America/St_Johns',
        standard: '-03:30',
        daylight: '-02:30'
      }
    ]
  },
  {
    country: 'UK',
    timezones: [
      {
        country: 'UK',
        name: 'London Time',
        zone: '+00:00',
        tz_name: 'Europe/London',
        standard: '+00:00',
        daylight: '+01:00'
      },
      {
        country: 'UK',
        name: 'Gibraltar Time',
        zone: '+01:00',
        tz_name: 'Europe/Gibraltar',
        standard: '+01:00',
        daylight: '+02:00'
      },
      {
        country: 'UK',
        name: 'Anguilla Time',
        zone: '-04:00',
        tz_name: 'America/Anguilla',
        standard: '-04:00',
        daylight: '-04:00'
      },
      {
        country: 'UK',
        name: 'Grand Turk Time',
        zone: '-05:00',
        tz_name: 'America/Grand_Turk',
        standard: '-05:00',
        daylight: '-04:00'
      },
      {
        country: 'UK',
        name: 'Falkland Islands Time',
        zone: '-03:00',
        tz_name: 'Antarctica/Rothera',
        standard: '-03:00',
        daylight: '-03:00'
      },
      {
        country: 'UK',
        name: 'Bermuda Time',
        zone: '-04:00',
        tz_name: 'Atlantic/Bermuda',
        standard: '-04:00',
        daylight: '-03:00'
      },
      {
        country: 'UK',
        name: 'South Georgia Time',
        zone: '-02:00',
        tz_name: 'Atlantic/South_Georgia',
        standard: '-02:00',
        daylight: '-02:00'
      },
      {
        country: 'UK',
        name: 'Saint Helena Time',
        zone: '+00:00',
        tz_name: 'Atlantic/St_Helena',
        standard: '+00:00',
        daylight: '+00:00'
      },
      {
        country: 'UK',
        name: 'British Indian Ocean Territory Time',
        zone: '+06:00',
        tz_name: 'Indian/Chagos',
        standard: '+06:00',
        daylight: '+06:00'
      },
      {
        country: 'UK',
        name: 'Pitcairn Islands Time',
        zone: '-08:00',
        tz_name: 'Pacific/Pitcairn',
        standard: '-08:00',
        daylight: '-08:00'
      }
    ]
  },
  {
    country: 'AU',
    timezones: [
      {
        country: 'AU',
        name: 'Australian Western Standard Time',
        zone: '+08:00',
        tz_name: 'Australia/Perth',
        standard: '+08:00',
        daylight: '+08:00'
      },
      {
        country: 'AU',
        name: 'Australian Central Standard Time',
        zone: '+09:30',
        tz_name: 'Australia/Darwin',
        standard: '+09:30',
        daylight: '+09:30'
      },
      {
        country: 'AU',
        name: 'Australian Eastern Standard Time',
        zone: '+10:00',
        tz_name: 'Australia/Sydney',
        standard: '+10:00',
        daylight: '+10:00'
      },
      {
        country: 'AU',
        name: 'Australian Central Time',
        zone: '+09:30',
        tz_name: 'Australia/Broken_Hill',
        standard: '+09:30',
        daylight: '+10:30'
      },
      {
        country: 'AU',
        name: 'Australian Eastern Time',
        zone: '+10:00',
        tz_name: 'Australia/Hobart',
        standard: '+10:00',
        daylight: '+11:00'
      }
    ]
  },
  {
    country: 'HK',
    timezones: [
      {
        country: 'HK',
        name: 'Hong Kong Time',
        zone: '+08:00',
        tz_name: 'Asia/Hong_Kong',
        standard: '+08:00',
        daylight: '+08:00'
      }
    ]
  },
  {
    country: 'DE',
    timezones: [
      {
        country: 'DE',
        name: 'Germany Time',
        zone: '+01:00',
        tz_name: 'Europe/Berlin',
        standard: '+01:00',
        daylight: '+02:00'
      }
    ]
  },
  {
    country: 'IN',
    timezones: [
      {
        country: 'IN',
        name: 'India Standard Time',
        zone: '+05:30',
        tz_name: 'Asia/Kolkata',
        standard: '+05:30',
        daylight: '+05:30'
      }
    ]
  },
  {
    country: 'IT',
    timezones: [
      {
        country: 'IT',
        name: 'Central European Summer Time',
        zone: '+01:00',
        tz_name: 'Europe/Rome',
        standard: '+01:00',
        daylight: '+01:00'
      }
    ]
  },
  {
    country: 'PT',
    timezones: [
      {
        country: 'PT',
        name: 'Western European Summer Time',
        zone: '+00:00',
        tz_name: 'Europe/Lisbon',
        standard: '+00:00',
        daylight: '+01:00'
      }
    ]
  },
  {
    country: 'PR',
    timezones: [
      {
        country: 'PR',
        name: 'Atlantic Standard Time',
        zone: '-04:00',
        tz_name: 'America/Puerto_Rico',
        standard: '-04:00',
        daylight: '-04:00'
      }
    ]
  },
  {
    country: 'ES',
    timezones: [
      {
        country: 'ES',
        name: 'Spain Time',
        zone: '+01:00',
        tz_name: 'Europe/Madrid',
        standard: '+01:00',
        daylight: '+02:00'
      }
    ]
  },
  {
    country: 'CH',
    timezones: [
      {
        country: 'CH',
        name: 'Switzerland Time',
        zone: '+01:00',
        tz_name: 'Europe/Zurich',
        standard: '+01:00',
        daylight: '+02:00'
      }
    ]
  },
  {
    country: 'ZA',
    timezones: [
      {
        country: 'ZA',
        name: 'South African Standard Time',
        zone: '+02:00',
        tz_name: 'Africa/Johannesburg',
        standard: '+02:00',
        daylight: '+02:00'
      }
    ]
  }
];

const compare = (a, b) => {
  const offsetA = parseInt(a.text.split('UTC')[1].split(':')[0]);
  const offsetB = parseInt(b.text.split('UTC')[1].split(':')[0]);
  if (offsetA < offsetB) {
    return -1;
  }
  if (offsetA > offsetB) {
    return 1;
  }
  return 0;
};

NEW_TIMEZONE.forEach((item) => {
  if (item.country === 'OTHER') {
    item.timezones.forEach((timezone) => {
      const tz_name = timezone.utc[0];
      timezone['tz_name'] = tz_name;
      timezone['name'] =
        timezone.abbr +
        ' (' +
        timezone.value +
        ': ' +
        timezone.text.split('(')[1].split(')')[0] +
        ')';
      // timezone['name'] =
      //   timezone.text.split(' ')[0] +
      //   ' ' +
      //   timezone.value +
      //   ' - ' +
      //   tz_name.split('/')[1];
    });
    item.timezones = item.timezones.sort(compare);
  }
});

export const WIN_TIMEZONE = NEW_TIMEZONE;

export const CALENDAR_DURATION = [
  {
    value: 0.25,
    text: '15 minutes'
  },
  {
    value: 0.5,
    text: '30 minutes'
  },
  {
    value: 0.75,
    text: '45 minutes'
  },
  {
    value: 1,
    text: '1 hour'
  },
  {
    value: 1.25,
    text: '1 hour 15 minutes'
  },
  {
    value: 1.5,
    text: '1 hour 30 minutes'
  },
  {
    value: 1.75,
    text: '1 hour 45 minutes'
  },
  {
    value: 2,
    text: '2 hour'
  }
];
export const RECURRING_TYPE = [
  {
    value: '',
    text: 'DO NOT REPEAT'
  },
  {
    value: 'DAILY',
    text: 'DAILY'
  },
  {
    value: 'WEEKLY',
    text: 'WEEKLY'
  },
  {
    value: 'MONTHLY',
    text: 'MONTHLY'
  },
  {
    value: 'YEARLY',
    text: 'YEARLY'
  }
];
export const REPEAT_DURATIONS = [
  {
    value: 'DAILY',
    label: 'Daily'
  },
  {
    value: 'WEEKLY',
    label: 'Weekly'
  },
  {
    value: 'MONTHLY',
    label: 'Monthly'
  },
  {
    value: 'YEARLY',
    label: 'Yearly'
  }
];
export const STATISTICS_DURATION = ['monthly', 'weekly', 'yearly'];

export const REMINDER = [
  { id: '10', text: '10 mins' },
  { id: '20', text: '20 mins' },
  { id: '30', text: '30 mins' },
  { id: '40', text: '40 mins' },
  { id: '50', text: '50 mins' },
  { id: '60', text: '1 hour' }
];
export const DELAY = [
  { id: '0', text: 'Immediately' },
  { id: '1', text: '1 min' },
  { id: '2', text: '2 mins' },
  { id: '3', text: '3 mins' },
  { id: '4', text: '4 mins' },
  { id: '5', text: '5 mins' },
  { id: '6', text: '6 mins' },
  { id: '7', text: '7 mins' },
  { id: '8', text: '8 mins' },
  { id: '9', text: '9 mins' },
  { id: '10', text: '10 mins' }
];
export const AUTO_FOLLOW_DELAY = [
  { id: '0', text: 'Immediately' },
  { id: '1', text: '1 hour' },
  { id: '6', text: '6 hours' },
  { id: '12', text: '12 hours' },
  { id: '24', text: '1 day' },
  { id: '48', text: '2 days' },
  { id: '72', text: '3 days' },
  { id: '168', text: '1 week' },
  { id: '336', text: '2 weeks' }
];
export const AUTO_RESEND_DELAY = [
  { id: '0', text: 'Immediately' },
  { id: '12', text: '12 hours' },
  { id: '24', text: '1 day' },
  { id: '48', text: '2 days' },
  { id: '72', text: '3 days' },
  { id: '168', text: '1 week' },
  { id: '336', text: '2 weeks' }
];
export const CALL_REQUEST_DURATION = [
  '15 mins',
  '30 mins',
  '45 mins',
  '1 hour'
];
export const ActionName = {
  note: 'New Note',
  email: 'New Email',
  text: 'New Text',
  audio: 'New Ringless VM',
  send_email_video: 'New Video Email',
  send_text_video: 'New Video Text',
  send_email_pdf: 'New PDF Email',
  send_text_pdf: 'New PDF Text',
  send_email_image: 'New Image Email',
  send_text_image: 'New Image Text',
  follow_up: 'New Task',
  update_follow_up: 'Edit Task',
  watched_video: 'Watched Video',
  watched_pdf: 'Watched PDF',
  watched_image: 'Watched Image',
  watched_material: 'Watched Material',
  opened_email: 'Opened Email',
  replied_text: 'Replied Text',
  update_contact: 'Edit Contact',
  deal: 'New Deal',
  move_deal: 'Move Deal',
  send_email_material: 'New Material Email',
  send_text_material: 'New Material Text',
  automation: 'Automation'
};

export const DEFAULT_STAGES = [
  'Lead',
  '30% Committed',
  '60% Committed',
  '90% Committed',
  'Application',
  'Submitted'
];

export const DEFAULT_PIPELINE = 'Primary';

export const ACTION_CAT = {
  START: 'START',
  NORMAL: 'NORMAL',
  CONDITION: 'CONDITION'
};

export const ACTION_METHOD = {
  ADD_INSERT_ACTION: 'add_insert_action',
  ADD_INSERT_BRANCH: 'add_insert_branch',
  ADD_ACTION: 'add_action',
  EDIT_ACTION: 'edit_action'
};

export const DefaultMessage = {
  AUTO_VIDEO_TEXT:
    'Hi {contact_first_name}, \n\nThis is {user_name} with eXp Realty. Here is the link to the video we discussed. Please call/text me back at {user_phone}.',
  AUTO_VIDEO_TEXT1:
    'Hi {contact_first_name}, \n\nThis is {user_name} with eXp Realty. Here is the link to the video we discussed. Please call/text me back at {user_phone}.',
  AUTO_VIDEO_EMAIL:
    '<div>Hi {contact_first_name},</div><div><br/></div><div>This is {user_name} with eXp Realty. Here is the link to the video we discussed:</div>',
  AUTO_PDF_TEXT:
    'Hi {contact_first_name}, \n\nThis is {user_name} with eXp Realty. Here is the link to the PDF we discussed. Please call/text me back at {user_phone}.',
  AUTO_PDF_TEXT1:
    'Hi {contact_first_name}, \n\nThis is {user_name} with eXp Realty. Here is the link to the PDF we discussed. Please call/text me back at {user_phone}.',
  AUTO_PDF_EMAIL:
    '<div>Hi {contact_first_name},</div> <div><br/></div><div>This is {user_name} with eXp Realty. Here is the link to the PDF we discussed:</div>',
  AUTO_IMAGE_TEXT:
    'Hi {contact_first_name}, \n\nThis is {user_name} with eXp Realty. Here is the link to the Image we discussed. Please call/text me back at {user_phone}.',
  AUTO_IMAGE_TEXT1:
    'Hi {contact_first_name}, \n\nThis is {user_name} with eXp Realty. Here is the link to the Image we discussed. Please call/text me back at {user_phone}.',
  AUTO_IMAGE_EMAIL:
    '<div>Hi {contact_first_name},</div> <div><br/></div><div>This is {user_name} with eXp Realty. Here is the link to the Image we discussed:</div>',
  AUTO_VIDEOS_TEXT:
    'Hi {contact_first_name}, \n\nThis is {user_name} with eXp Realty. Here are the links to the videos we discussed. Please call/text me back at {user_phone}.',
  AUTO_VIDEOS_TEXT1:
    'Hi {contact_first_name}, \n\nThis is {user_name} with eXp Realty. Here are the links to the videos we discussed. Please call/text me back at {user_phone}.',
  AUTO_VIDEOS_EMAIL:
    '<div>Hi {contact_first_name},</div> <div><br/></div><div>This is {user_name} with eXp Realty. Here are the links to the videos we discussed:</div>',
  AUTO_PDFS_TEXT:
    'Hi {contact_first_name}, \n\nThis is {user_name} with eXp Realty. Here are the link to the PDFs we discussed. Please call/text me back at {user_phone}.',
  AUTO_PDFS_TEXT1:
    'Hi {contact_first_name}, \n\nThis is {user_name} with eXp Realty. Here are the link to the PDFs we discussed. Please call/text me back at {user_phone}.',
  AUTO_PDFS_EMAIL:
    '<div>Hi {contact_first_name},</div> <div><br/></div><div>This is {user_name} with eXp Realty. Here are the links to the PDFs we discussed:</div>',
  AUTO_IMAGES_TEXT:
    'Hi {contact_first_name}, \n\nThis is {user_name} with eXp Realty. Here are the link to the Images we discussed. Please call/text me back at {user_phone}.',
  AUTO_IMAGES_TEXT1:
    'Hi {contact_first_name}, \n\nThis is {user_name} with eXp Realty. Here are the link to the Images we discussed. Please call/text me back at {user_phone}.',
  AUTO_IMAGES_EMAIL:
    '<div>Hi {contact_first_name},</div> <div><br/></div><div>This is {user_name} with eXp Realty. Here are the links to the Images we discussed:</div>'
};

export const NoteQuillEditor = {
  toolbar: {
    container: [['bold', 'italic', 'underline', 'strike'], ['link']]
  }
};

export const QuillEditor = {
  toolbar: {
    container: [
      [
        {
          font: [
            'arial',
            'times new roman',
            'monospace',
            'arial black',
            'arial narrow',
            'comic sans ms',
            'garamond',
            'georgia',
            'tahoma',
            'trebuchet ms',
            'verdana'
          ]
        }
      ],
      [{ size: ['0.75em', false, '1.5em', '2em'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: 1 }, { header: 2 }],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link', 'image']
    ]
  },
  table: false,
  'better-table': {
    operationMenu: {
      items: {
        unmergeCells: {
          text: 'Another unmerge cells name'
        }
      },
      color: {
        colors: ['green', 'red', 'yellow', 'blue', 'white'],
        text: 'Background Colors:'
      }
    }
  },
  blotFormatter: {}
};

export const COLORS = [
  ['#f6c5be', '#ef9f93', '#e66550', '#cc3a21', '#ac2c17', '#822212'],
  ['#fee6c7', '#fdd6a2', '#fcbc6c', '#eaa040', '#cf8933', '#a46a20'],
  ['#fef1d1', '#fce8b3', '#fcda83', '#f2c960', '#d5ae4a', '#aa8832'],
  ['#b9e4d0', '#89d3b2', '#44b984', '#279e60', '#1e804b', '#156239'],
  ['#c6f3de', '#a0eac9', '#68dfa9', '#3dc789', '#2a9c68', '#1b764d'],
  ['#c9daf8', '#a4c2f4', '#6d9eeb', '#3d78d8', '#275bac', '#1c4587'],
  ['#e4d7f5', '#d0bcf1', '#b694e8', '#8e63cd', '#653d9b', '#41236d'],
  ['#fcdee8', '#fbc8d8', '#f7a7c0', '#e07798', '#b65775', '#83334c']
];

export const LABEL_COLORS = [
  '#0000ff',
  '#ffcc00',
  '#f5325b',
  '#00916e',
  '#dae0f2',
  '#86bbd8',
  '#f26419',
  '#0d5c63'
];

export const DialogSettings = {
  CONTACT: {
    width: '98vw',
    maxWidth: '600px',
    disableClose: true
  },
  JOIN_TEAM: {
    width: '98vw',
    maxWidth: '600px',
    disableClose: true
  },
  INVITE_TEAM: {
    width: '98vw',
    maxWidth: '600px',
    maxHeight: 'calc(65vh + 114px)',
    disableClose: true
  },
  TASK: {
    width: '98vw',
    maxWidth: '394px',
    disableClose: true
  },
  DEAL: {
    width: '100vw',
    maxWidth: '600px',
    disableClose: true
  },
  NOTE: {
    width: '98vw',
    maxWidth: '540px',
    disableClose: true
  },
  AUTOMATION_ACTION: {
    minHeight: '300px',
    disableClose: true
  },
  AUTOMATION: {
    width: '98vw',
    maxWidth: '394px',
    minHeight: '300px',
    disableClose: true
  },
  ASSISTANT: {
    width: '98vw',
    maxWidth: '394px',
    disableClose: true
  },
  UPLOAD: {
    width: '98vw',
    maxWidth: '840px',
    disableClose: true
  },
  CONFIRM: {
    position: { top: '100px' },
    width: '98vw',
    maxWidth: '400px',
    disableClose: true
  },
  ALERT: {
    width: '98vw',
    maxWidth: '380px'
  }
};

export const BulkActions = {
  Tasks: [
    {
      label: 'Edit tasks',
      loadingLabel: 'Editing...',
      type: 'button',
      icon: 'i-edit',
      command: 'edit',
      loading: false
    },
    {
      label: 'Complete tasks',
      loadingLabel: 'Completing...',
      type: 'button',
      icon: 'i-check',
      command: 'complete',
      loading: false
    },
    {
      spliter: true,
      label: 'Delete tasks',
      loadingLabel: 'Deleting...',
      type: 'button',
      icon: 'i-trash',
      command: 'delete',
      loading: false
    },
    {
      spliter: true,
      label: 'Select all',
      loadingLabel: 'Selecting...',
      type: 'button',
      command: 'select',
      loading: false
    },
    {
      label: 'Deselect',
      loadingLabel: 'Deselecting...',
      type: 'button',
      command: 'deselect',
      loading: false
    },
    {
      label: 'New Email',
      loadingLabel: '',
      type: 'button',
      icon: 'i-message',
      command: 'email',
      loading: false
    },
    {
      label: 'New Call',
      loadingLabel: '',
      type: 'button',
      icon: 'i-phone',
      command: 'call',
      loading: false
    },
    {
      label: 'New Meeting',
      loadingLabel: '',
      type: 'button',
      icon: 'i-appointments',
      command: 'appointment',
      loading: false
    }
  ],
  Contacts: [
    {
      label: 'New Task',
      type: 'button',
      icon: 'i-task',
      command: 'add_task',
      loading: false
    },
    {
      label: 'New Email',
      type: 'button',
      icon: 'i-message',
      command: 'message',
      loading: false
    },
    {
      label: 'New Text',
      type: 'button',
      icon: 'i-sms-sent',
      command: 'text',
      loading: false
    },
    {
      label: 'New Call',
      type: 'button',
      icon: 'i-phone',
      command: 'call',
      loading: false
    },
    {
      label: 'New Note',
      type: 'button',
      icon: 'i-notes',
      command: 'add_note',
      loading: false
    },
    {
      label: 'Add automation',
      type: 'button',
      icon: 'i-automation',
      command: 'automation',
      loading: false
    },
    {
      label: 'New Deal',
      type: 'button',
      icon: 'i-deals',
      command: 'deal',
      loading: false
    },
    {
      label: 'New Meeting',
      type: 'button',
      icon: 'i-appointments',
      command: 'appointment',
      loading: false
    },
    {
      label: 'Edit',
      type: 'button',
      icon: 'i-edit',
      command: 'edit',
      loading: false
    },
    {
      label: 'Download',
      type: 'button',
      icon: 'i-download',
      command: 'download',
      loading: false,
      loadingLabel: 'Downloading'
    },
    {
      label: 'Share Team',
      type: 'button',
      icon: 'i-share-team',
      command: 'share',
      loading: false,
      loadingLabel: 'Sharing'
    },
    {
      spliter: true,
      label: 'Select all',
      type: 'button',
      command: 'select',
      loading: false
    },
    {
      label: 'Deselect',
      type: 'button',
      command: 'deselect',
      loading: false
    },
    {
      label: 'Delete',
      type: 'button',
      icon: 'i-trash',
      command: 'delete',
      loading: false
    }
  ],
  TeamContacts: [
    {
      label: 'New Task',
      type: 'button',
      icon: 'i-task',
      command: 'add_task',
      loading: false
    },
    {
      label: 'New Email',
      type: 'button',
      icon: 'i-message',
      command: 'message',
      loading: false
    },
    {
      label: 'New Note',
      type: 'button',
      icon: 'i-template',
      command: 'add_note',
      loading: false
    },
    {
      label: 'Add automation',
      type: 'button',
      icon: 'i-automation',
      command: 'automation',
      loading: false
    },
    {
      label: 'Download',
      type: 'button',
      icon: 'i-download',
      command: 'download',
      loading: false,
      loadingLabel: 'Downloading'
    },
    {
      spliter: true,
      label: 'Select all',
      type: 'button',
      command: 'select',
      loading: false
    },
    {
      label: 'Deselect',
      type: 'button',
      command: 'deselect',
      loading: false
    }
  ],
  Materials: [
    {
      label: 'Send via Email',
      type: 'button',
      icon: 'i-message',
      command: 'email',
      loading: false
    },
    {
      label: 'Send via Text',
      type: 'button',
      icon: 'i-sms-sent',
      command: 'text',
      loading: false
    },
    {
      label: 'Edit Landing page',
      type: 'button',
      icon: 'i-template',
      command: 'template',
      loading: false
    },
    {
      label: 'Lead Capture',
      type: 'button',
      icon: 'i-lead-capture',
      command: 'lead_capture',
      loading: false
    },
    {
      label: 'Move To',
      type: 'button',
      icon: 'i-folder',
      command: 'folder',
      loading: false
    },
    {
      label: 'Deselect',
      type: 'button',
      command: 'deselect',
      loading: false
    },
    {
      label: 'Delete',
      type: 'button',
      icon: 'i-trash',
      command: 'delete',
      loading: false
    }
  ],
  Automations: [
    {
      label: 'Move To',
      type: 'button',
      icon: 'i-folder',
      command: 'folder',
      loading: false
    },
    {
      label: 'Deselect',
      type: 'button',
      command: 'deselect',
      loading: false
    },
    {
      label: 'Delete',
      type: 'button',
      icon: 'i-trash',
      command: 'delete',
      loading: false
    }
  ],
  Folders: [
    {
      label: 'Edit',
      type: 'button',
      icon: 'i-edit',
      command: 'edit',
      loading: false
    },
    {
      label: 'Delete',
      type: 'button',
      icon: 'i-trash',
      command: 'delete',
      loading: false
    },
    {
      label: 'Deselect',
      type: 'button',
      command: 'deselect',
      loading: false
    }
  ],
  TeamMaterials: [
    {
      label: 'Send via email',
      type: 'button',
      icon: 'i-message',
      command: 'email',
      loading: false
    },
    {
      label: 'Send via SMS',
      type: 'button',
      icon: 'i-sms-sent',
      command: 'text',
      loading: false
    },
    {
      label: 'Lead Capture',
      type: 'button',
      icon: 'i-lead-capture',
      command: 'lead_capture',
      loading: false
    },
    {
      spliter: true,
      label: 'Select all',
      type: 'button',
      command: 'select',
      loading: false
    },
    {
      label: 'Deselect',
      type: 'button',
      command: 'deselect',
      loading: false
    }
  ],
  CampaignLists: [
    {
      icon: 'i-trash',
      label: 'Delete',
      type: 'button',
      command: 'delete',
      loading: false
    },
    {
      spliter: true,
      label: 'Select all',
      type: 'button',
      command: 'selectall',
      loading: false
    },
    {
      label: 'Deselect',
      type: 'button',
      command: 'deselect',
      loading: false
    }
  ],
  CampaignContacts: [
    {
      icon: 'i-trash',
      label: 'Delete',
      type: 'button',
      command: 'remove',
      loading: false
    },
    {
      spliter: true,
      label: 'Select all',
      type: 'button',
      command: 'select',
      loading: false
    },
    {
      label: 'Deselect',
      type: 'button',
      command: 'deselect',
      loading: false
    }
  ],
  BulkMailing: [
    {
      spliter: true,
      label: 'Select all',
      type: 'button',
      command: 'select',
      loading: false
    },
    {
      label: 'Deselect',
      type: 'button',
      command: 'deselect',
      loading: false
    }
  ],
  TeamMember: [
    {
      label: 'Bulk status set',
      type: 'dropdown',
      items: [
        {
          class: 'c-green',
          label: 'Editor',
          command: 'set_editor'
        },
        {
          class: 'c-azure',
          label: 'Viewer',
          command: 'set_viewer'
        }
      ]
    },
    {
      label: 'Remove member',
      type: 'button',
      icon: 'i-trash',
      command: 'delete',
      loading: false
    },
    {
      spliter: true,
      label: 'Select all',
      type: 'button',
      command: 'select',
      loading: false
    },
    {
      label: 'Deselect',
      type: 'button',
      command: 'deselect',
      loading: false
    }
  ]
};

export const ContactPageSize = 50;

export const Labels = [
  {
    id: '',
    text: 'No Label'
  },
  {
    id: 'New',
    text: 'New'
  },
  {
    id: 'Cold',
    text: 'Cold'
  },
  {
    id: 'Warm',
    text: 'Warm'
  },
  {
    id: 'Hot',
    text: 'Hot'
  },
  {
    id: 'Team',
    text: 'Team'
  },
  {
    id: 'Trash',
    text: 'Trash'
  },
  {
    id: 'Appt set',
    text: 'Appt set'
  },
  {
    id: 'Appt Missed',
    text: 'Appt Missed'
  },
  {
    id: 'Lead',
    text: 'Lead'
  }
];

export const TeamLabel = '5f16d58d0af09220208b6e0b';
export const TaskStatus = {
  ALL: 'all',
  TODO: 'to_do',
  COMPLETED: 'completed'
};
export const UnlayerThemeId = 6121;
export const ImportSelectableColumn = ['notes', 'tags'];

export const AUTOMATION_ICONS = {
  FOLLOWUP: '../../../assets/img/automations/follow_up.svg',
  UPDATE_FOLLOWUP: '../../../assets/img/follow-step.png',
  CREATE_NOTE: '../../../assets/img/automations/create_note.svg',
  SEND_EMAIL: '../../../assets/img/automations/send_email.svg',
  SEND_TEXT: '../../../assets/img/automations/send_text.svg',
  SEND_AUDIO: '../../../assets/img/automations/send_audio.svg',
  SEND_VIDEO_EMAIL: '../../../assets/img/automations/send_video_email.svg',
  SEND_VIDEO_TEXT: '../../../assets/img/automations/send_video_text.svg',
  SEND_PDF_EMAIL: '../../../assets/img/automations/send_pdf_email.svg',
  SEND_PDF_TEXT: '../../../assets/img/automations/send_pdf_text.svg',
  SEND_IMAGE_EMAIL: '../../../assets/img/automations/send_image_email.svg',
  SEND_IMAGE_TEXT: '../../../assets/img/automations/send_image_text.svg',
  UPDATE_CONTACT: '../../../assets/img/automations/update_contact.svg',
  WATCHED_VIDEO: '../../../assets/img/automations/watched_video.svg',
  WATCHED_PDF: '../../../assets/img/automations/watched_pdf.svg',
  WATCHED_IMAGE: '../../../assets/img/watch_image.png',
  OPENED_EMAIL: '../../../assets/img/automations/opened_email.svg',
  NEW_DEAL: '../../../assets/img/automations/new_deal.svg',
  MOVE_DEAL: '../../../assets/img/automations/move_deal.svg',
  BRANCH: '../../../assets/img/automations/branch.png',
  DEAL_ROOT: '../../../assets/img/automations/deal_root.svg',
  AUTOMATION: '../../../assets/img/automations/automation.svg',
  APPOINTMENT: '../../../assets/img/automations/appointment.svg'
};

export const PACKAGE_LEVEL = {
  LITE: {
    package: 'LITE'
  },
  PRO: {
    package: 'PRO'
  },
  ELITE: {
    package: 'ELITE'
  },
  CUSTOM: {
    package: 'CUSTOM'
  },
  EVO_PRO: {
    package: 'EVO_PRO'
  },
  EVO_ELITE: {
    package: 'EVO_ELITE'
  }
};

export const DIAL_LEVEL = {
  lite: {
    package: 'lite',
    price: 59,
    level: 'PREV'
  },
  pro: {
    package: 'pro',
    price: 99,
    level: 'SINGLE'
  },
  elite: {
    package: 'elite',
    price: 149,
    level: 'MULTI'
  }
};

export const STRIPE_KEY = environment.STRIPE_KEY;
// 'pk_live_p0mahSVHjPHiknXx0iEEta8400Gn8n3onx';
// export const STRIPE_KEY = 'pk_test_Fiq3VFU3LvZBSJpKGtD0paMK0005Q6E2Q2';

export const CANCEL_ACCOUNT_REASON = [
  'The software is too costly',
  'The software is difficult to use',
  'Some of the functionality I need is missing',
  'I am using a different product',
  'I am not using the product',
  'Other reason'
];

export const CHUNK_SIZE = 8;

export const VOLUME = {
  ELITE: {
    CONTACT_LIMIT: 20000,
    MATERIAL_UPLOAD: 'Unlimited',
    RECORD_LIMIT: 1000,
    AUTOMATION_LIMIT: 2000,
    CALENDAR_LIMIT: 3,
    SMS_LIMIT: 750,
    ASSISTANT: 2
  },
  ONE: {
    CONTACT_LIMIT: 10000,
    MATERIAL_UPLOAD: 'Unlimited',
    RECORD_LIMIT: 500,
    AUTOMATION_LIMIT: 1000,
    CALENDAR_LIMIT: 2,
    SMS_LIMIT: 500,
    ASSISTANT: 1
  }
};

export const TOKENS = [];

export const THEMES = [
  {
    name: 'eXp Highlight Landing Page',
    thumbnail: environment.server + '/assets/images/theme/theme2.jpg',
    id: 'theme2'
  },
  {
    name: 'eXp Simple Landing Page',
    thumbnail: environment.server + '/assets/images/theme/theme4.jpg',
    id: 'theme3'
  },
  {
    name: 'eXp Calendly Landing Page',
    thumbnail: environment.server + '/assets/images/theme/theme4.png',
    id: 'theme4'
  },
  {
    name: 'Highlight Landing Page',
    thumbnail: environment.server + '/assets/images/theme/theme2.jpg',
    id: 'theme8'
  },
  {
    name: 'Simple Landing Page',
    thumbnail: environment.server + '/assets/images/theme/theme4.jpg',
    id: 'theme6'
  },
  {
    name: 'Calendly Landing Page',
    thumbnail: environment.server + '/assets/images/theme/theme4.png',
    id: 'theme7'
  }
];

export const OTHER_THEMES = [
  {
    name: 'Highlight Landing Page',
    thumbnail: environment.server + '/assets/images/theme/theme2.jpg',
    id: 'theme8'
  },
  {
    name: 'Simple Landing Page',
    thumbnail: environment.server + '/assets/images/theme/theme4.jpg',
    id: 'theme6'
  },
  {
    name: 'Calendly Landing Page',
    thumbnail: environment.server + '/assets/images/theme/theme4.png',
    id: 'theme7'
  }
];

export const THEME_DATA = {
  'eXp Realty': THEMES
};

export const ADMIN_CALL_LABELS = [
  'Interested',
  'Not Interested',
  'Callback Set',
  'Appointment Set',
  'Voice Message',
  'No Answer',
  'Wrong Number',
  'Trash'
];

export const INDUSTRIES = [
  'Real Estate',
  'Recruiting',
  'B2B',
  'B2C',
  'Direct/Field Sales',
  'Fast-Moving Consumer Goods',
  'Media & Advertising',
  'Medical/Pharmaceutical',
  'e-Commerce',
  'Retail Motor',
  'Tele-Marketing',
  'Other'
];

export const ROLES = [
  'Sales development representative',
  'Sales representative',
  'Account executive',
  'Account manager',
  'Sales manager',
  'Customer success manager',
  'Sales engineer',
  'Sales operations manager',
  'Regional sales manager',
  'Director of sales',
  'VP of sales',
  'Chief sales officer',
  'Other'
];

export const BRANCH_COUNT = 2;

export const AUTOMATION_ATTACH_SIZE = 100;

export const orderOriginal = (a: string, b: string): number => {
  return 0;
};
