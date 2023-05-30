// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // api: 'https://stg-api1.crmgrow.com/api/',
  // api: 'http://3.139.190.87:3000/api/',
  // api: 'http://192.168.0.62:3001/api/',
  // api: 'http://localhost:3000/api/',
  api: 'http://localhost:3001/api/',
  server: 'http://localhost:3001',
  front: 'http://localhost:4201',
  website: 'https://stg-api.crmgrow.com',
  domain: {
    server: 'ecsbe.crmgrow.com',
    frontend: 'stg-app.crmgrow.com',
    scheduler: 'scheduler.crmgrow.com'
  },
  pageBuilder: 'https://stg-pages.crmgrow.com',
  pageBuilderAPI: 'https://production.builder.convrrt.com',
  ClientId: {
    Google:
      '630484366982-m6e66b06vlo0g6ebg9h2q5t7nrk2rimr.apps.googleusercontent.com',
    Outlook: '495c34a1-c12c-4932-b134-7f3c3ec491d6'
  },
  RedirectUri: {
    Outlook: 'http://localhost:4200/login'
  },
  API_KEY: {
    Youtube: 'AIzaSyDnuZGQ1pP5Wr-z1yIk8DQKmN1MJfjK5wc',
    Notification:
      'BE_FojfPS_0FbZGafCaHBpaZldJ91dkeXA6zGtQiM3R4A0oNOW76ejjEA2bRqAomwbIqGbCDsEjK_1VyCX_496o',
    Vimeo:
      'YWUxOTM0NGQwNzUwMWU2MTRkMDhkNjJhODYxNmJlMjRlNGYxYTkxOTpnK0FZWnk2OWsyOU90WFUzMHdYQ3lpSnFGYnNRQk1Gd0p5b0hQZ1NmaDV1aUYwVlNvTjBSZDhWYnV1cEREZzhwR3ZDMThkWWo3UE1zb29JdVNIY0lFcnNQZzNTU3g5am52dnRkRjBMNlFES1o3cFFDVENsVEkzZm45MlBTQUVvdA=='
  },
  THIRD_PARTY: {
    GTM_ID: 'GTM-W55F6VL'
  },
  STRIPE_KEY: 'pk_test_Fiq3VFU3LvZBSJpKGtD0paMK0005Q6E2Q2'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
