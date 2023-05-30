export const AUTH = {
  SIGNIN: 'user/login',
  SIGNUP: 'user',
  FORGOT_PASSWORD: 'user/forgot-password',
  RESET_PASSWORD: 'user/reset-password',
  SOCIAL_SIGNIN: 'user/social-login',
  SOCIAL_SIGNUP: 'user/social-signup',
  OAUTH_REQUEST: 'user/signup-',
  OUTLOOK_PROFILE_REQUEST: 'user/social-outlook?code=',
  GOOGLE_PROFILE_REQUEST: 'user/social-gmail?code=',
  LOG_OUT: 'user/logout',
  CHECK_EMAIL: 'user/check',
  CHECK_NICKNAME: 'user/search-nickname',
  CHECK_PHONE: 'user/search-phone'
};
export const USER = {
  PROFILE: 'user/me',
  PAYMENT: 'payment/',
  UPDATE_PROFILE: 'user/me',
  UPDATE_PAYMENT: 'payment/',
  GET_INVOICE: 'payment/transactions',
  UPDATE_PASSWORD: 'user/new-password',
  CREATE_PASSWORD: 'user/create-password',
  SYNC_GMAIL: 'user/sync-gmail',
  SYNC_OUTLOOK: 'user/sync-outlook',
  SYNC_ZOOM: 'user/sync-zoom',
  CALENDAR_SYNC_GMAIL: 'user/sync-google-calendar',
  CALENDAR_SYNC_OUTLOOK: 'user/sync-outlook-calendar',
  AUTH_GOOGLE: 'user/authorize-gmail',
  AUTH_OUTLOOK: 'user/authorize-outlook',
  AUTH_GOOGLE_CALENDAR: 'user/authorize-google-calendar',
  AUTH_OUTLOOK_CALENDAR: 'user/authorize-outlook-calendar',
  AUTH_ZOOM: 'user/authorize-zoom',
  SET_ANOTHER_MAIL: 'user/another-con',
  ENABLE_DESKTOP_NOTIFICATION: 'user/desktop-notification',
  LOAD_AFFILIATE: 'affiliate',
  CREATE_AFFILIATE: 'affiliate',
  LOAD_REFERRALS: 'affiliate/referrals/',
  UPDATE_GARBAGE: 'garbage',
  CONNECT_SMTP: 'integration/sync-smtp',
  VERIFY_SMTP: 'integration/verify-smtp',
  VERIFY_SMTP_CODE: 'integration/verify-smtp-code',
  DISCONNECT_MAIL: 'user/discon-email',
  DISCONNECT_CALENDAR: 'user/discon-calendar',
  CANCEL_ACCOUNT: 'user/cancel-account',
  SLEEP_ACCOUNT: 'user/sleep-account',
  UPDATE_PACKAGE: 'user/update-package',
  CHECK_DOWNGRADE: 'user/check-downgrade',
  INFO: 'user/',
  LOAD_SUB_ACCOUNTS: 'user/easy-sub-accounts',
  GET_SUB_ACCOUNT: 'user/sub-accounts',
  CREATE_SUB_ACCOUNT: 'user/sub-account/',
  CHANGE_SUB_ACCOUNT: 'user/switch-account',
  RECALL_SUB_ACCOUNT: 'user/recall-account',
  MERGE_SUB_ACCOUNT: 'user/merge-account',
  BUY_SUB_ACCOUNT: 'user/buy-account',
  UPDATE_DRAFT: 'user/update-draft',
  SCHEDULE: 'user/schedule-demo',
  SCHEDULED_ONE: 'user/scheduled-demo',
  STATISTICS: 'user/statistics'
};
export const GUEST = {
  LOAD: 'guest/load',
  CREATE: 'guest',
  DELETE: 'guest/',
  EDIT: 'guest/'
};
export const GARBAGE = {
  SET: 'garbage',
  UPLOAD_INTRO_VIDEO: 'garbage/intro_video',
  LOAD_DEFAULT: 'garbage/load-default'
};
export const FILE = {
  UPLOAD_IMAGE: 'file/upload?resize=true'
};
export const NOTE = {
  CREATE: 'note/v2/create',
  BULK_CREATE: 'note/v2/bulk-create',
  DELETE: 'note/',
  UPDATE: 'note/v2/'
};
export const TASK = {
  CREATE: 'follow/',
  BULK_CREATE: 'follow/create',
  UPDATE: 'follow/',
  COMPLETE: 'follow/completed',
  LEAVE_COMMENT: 'follow/leave-comment',
  BULK_UPDATE: 'follow/update',
  BULK_COMPLETE: 'follow/checked',
  BULK_ARCHIVE: 'follow/archived',
  TODAY: 'follow/date?due_date=today',
  TOMORROW: 'follow/date?due_date=tomorrow',
  NEXT_WEEK: 'follow/date?due_date=next_week',
  FUTURE: 'follow/date?due_date=future',
  OVERDUE: 'follow/date?due_date=overdue',
  LOAD: 'follow/load/',
  SELECT: 'follow/select-all'
};
export const ACTIVITY = {
  CREATE: 'activity',
  LOAD: 'activity/get',
  // LOAD: 'activity/',
  REMOVE_ALL: 'activity/remove-all',
  REMOVE: 'activity/remove',
  UPDATE: 'activity/update'
};
export const CONTACT = {
  CREATE: 'contact',
  LOAD_ALL: 'contact',
  LOAD_PAGE: 'contact/last/',
  ADVANCE_SERACH: 'contact/advance-search',
  ADVANCE_SELECT: 'contact/advance-search/select',
  SEARCH_BY_CUSTOM: 'contact/search-by-custom',
  NORMAL_SEARCH: 'contact/search',
  QUICK_SEARCH: 'contact/search-easy',
  LOAD_BY_EMAIL: 'contact/load-by-emails',
  FIELD_COUNT: 'contact/field-count',
  SELECT_ALL: 'contact/get-all',
  LOAD_BY_IDS: 'contact/get',
  FILTER: 'contact/filter',
  UPDATE_DETAIL: 'contact/',
  READ: 'contact/get-detail/',
  READ_ACTIVITIES: 'contact/get-activities/',
  EXPORT: 'contact/export-csv',
  BULK_DELETE: 'contact/remove',
  BULK_UPDATE: 'contact/bulk-update',
  LATEST_CONTACTS: 'video/latest-sent',
  UPDATE: 'contact/update-contact',
  MERGE: 'contact/contact-merge',
  BULK_CREATE: 'contact/bulk-create',
  CHECK_EMAIL: 'contact/check-email',
  CHECK_PHONE: 'contact/check-phone',
  SHARE_CONTACT: 'contact/share-contact',
  STOP_SHARE: 'contact/stop-share',
  TEAM_SHARED: 'contact/team-shared/',
  LOAD_NOTES: 'contact/load-notes/',
  LOAD_TIMELINE: 'contact/get-timeline/',
  LOAD_TASKS: 'contact/get-tasks/',
  REMOVE_FROM_TASK: 'contact/remove-task'
};
export const VIDEO = {
  CREATE: 'video/create',
  READ: 'video/',
  UPDATE: 'video/',
  DOWNLOAD: 'video/download/',
  UPDATE_VIDEO_DETAIL: 'video/detail/',
  UPDATE_CONVERTING: 'video/converting/',
  UPDATE_ADMIN: 'video/update-admin',
  DELETE: 'video/',
  LOAD: 'video',
  LOAD_CONVERTING_STATUS: 'video/convert-status',
  ANALYTICS: 'video/analytics/',
  INIT_RECORD: 'video/init-record?source=web',
  UPLOAD_CHUNK: 'video/upload-chunk/',
  COMPLETE_RECORD: 'video/complete-record',
  UPLOAD_CHUNK2: 'video/upload-split/',
  UPLOAD_SINGLE: 'video/upload-single/',
  MERGE_FILES: 'video/merge-chunks'
};
export const PDF = {
  CREATE: 'pdf/create',
  READ: 'pdf/',
  ANALYTICS: 'pdf/analytics/',
  UPDATE: 'pdf/',
  UPDATE_ADMIN: 'pdf/update-admin',
  DELETE: 'pdf/',
  LOAD: 'pdf'
};
export const IMAGE = {
  CREATE: 'image/create',
  READ: 'image/',
  ANALYTICS: 'image/analytics/',
  UPDATE: 'image/',
  UPDATE_ADMIN: 'image/update-admin',
  DELETE: 'image/',
  LOAD: 'image'
};
export const TEMPLATE = {
  CREATE: 'template/create',
  DOWNLOAD: 'template/createTemplate',
  READ: 'template/',
  UPDATE: 'template/',
  DELETE: 'template/',
  BULK_REMOVE: 'template/remove',
  LOAD: 'template/list/',
  SEARCH: 'template/search',
  OWNSEARCH: 'template/search-own',
  LOAD_OWN: 'template/load-own',
  LOAD_LIBRARY: 'template/load-library',
  LOAD_ALL: 'template/',
  MOVE_FILES: 'template/move',
  REMOVE_FOLDER: 'template/remove-folder',
  REMOVE_FOLDERS: 'template/remove-folders',
  DOWNLOAD_FOLDER: 'template/download-folder'
};
export const TEAM = {
  LOAD: 'team/load',
  LOAD_LEADERS: 'team/load-leaders',
  LOAD_INVITED: 'team/load-invited',
  LOAD_REQUESTED: 'team/load-requested',
  CREATE: 'team',
  READ: 'team/',
  UPDATE: 'team/',
  DELETE: 'team/',
  SEARCH_TEAM: 'team/search-team',
  SEARCH_LEADER: 'team/search-leader',
  INVITE_USERS: 'team/bulk-invite/',
  CANCEL_INVITE: 'team/cancel-invite/',
  CANCEL_REQUEST: 'team/cancel-request/',
  SHARE_TEAM_MATERIALS: 'team/share-team-materials',
  SHARE_VIDEOS: 'team/share-videos',
  SHARE_PDFS: 'team/share-pdfs',
  SHARE_IMAGES: 'team/share-images',
  SHARE_MATERIALS: 'team/share-materials',
  SHARE_FOLDERS: 'team/share-folders',
  LOAD_SHARE_CONTACTS: 'team/shared-contacts',
  LOAD_SHARE_MATERIALS: 'team/material/',
  LOAD_SHARE_AUTOMATIONS: 'team/automation/',
  LOAD_SHARE_TEMPLATES: 'team/template/',
  SHARE_TEMPLATES: 'team/share-templates',
  SHARE_AUTOMATIONS: 'team/share-automations',
  ACCEPT_INVITATION: 'team/accept/',
  DECLINE_INVITATION: 'team/decline/',
  SEARCH_TEAM_BY_USER: 'team/user/',
  JOIN_REQUEST: 'team/request',
  ACCEPT_REQUEST: 'team/admin-accept',
  DECLINE_REQUEST: 'team/admin-decline',
  UPDATE_TEAM: 'team/update',
  REMOVE_VIDEO: 'team/remove-videos/',
  REMOVE_PDF: 'team/remove-pdfs/',
  REMOVE_IMAGE: 'team/remove-images/',
  REMOVE_FOLDER: 'team/remove-folder/',
  REMOVE_TEMPLATE: 'team/remove-templates/',
  REMOVE_AUTOMATION: 'team/remove-automations/',
  SEARCH_CONTACT: 'team/search-contact',
  ALL_SHARED_CONTACT: 'team/get-all/',
  REQUEST_CALL: 'team-call/request-call/',
  INQUIRY: 'team-call/nth-call/',
  CALL: 'team-call/call/',
  PLANNED: 'team-call/call-planned/',
  FINISHED: 'team-call/call-finished/',
  REJECT_CALL: 'team-call/reject-call/',
  ACCEPT_CALL: 'team-call/accept-call/',
  UPDATE_CALL: 'team-call/call/',
  DELETE_CALL: 'team-call/call/',
  TEAM_CALL_LOAD: 'team-call/load-call',
  UNSHARE_FOLDERS: 'team/unshare-folders',
  UNSHARE_TEMPLATES: 'team/unshare-templates',
  UNSHARE_AUTOMATIONS: 'team/unshare-automations',
  STOP_SHARE: 'team/stop-share'
};
export const AUTOMATION = {
  SEARCH: 'automation/search',
  LOAD_PAGE: 'automation/list/',
  LOAD_ALL: 'automation/',
  DETAIL: 'automation/detail/',
  CONTACTS: 'automation/assigned-contacts/',
  CONTACT_DETAIL: 'automation/contact-detail',
  DELETE: 'automation/',
  READ: 'automation/get-detail',
  UPDATE: 'automation/',
  CREATE: 'automation',
  DOWNLOAD: 'automation/download',
  GET_TITLES: 'automation/get-titles',
  ASSIGN: 'timeline/create',
  ASSIGN_NEW: 'timeline/create_new',
  CANCEL: 'timeline/cancel/',
  CANCEL_DEAL: 'timeline/cancel-deal/',
  GET_COUNT: 'timeline/counts',
  LOAD_TIMELINES: 'timeline/load',
  LOAD_OWN: 'automation/list/own',
  LOAD_LIBRARY: 'automation/load-library',
  SEARCH_CONTACT: 'automation/search-contact',
  SEARCH_DEAL: 'automation/search-deal',
  MOVE_FILES: 'automation/move',
  REMOVE_FOLDER: 'automation/remove-folder',
  REMOVE_FOLDERS: 'automation/remove-folders',
  DOWNLOAD_FOLDER: 'automation/download-folder',
  BULK_REMOVE: 'automation/remove'
};
export const APPOINTMENT = {
  LOAD_CALENDARS: 'appointment/calendar',
  GET_EVENT: 'appointment',
  UPDATE_EVENT: 'appointment/',
  DELETE_EVENT: 'appointment/delete',
  ACCEPT: 'appointment/accept',
  DECLINE: 'appointment/decline',
  DETAIL: 'appointment/detail',
  REMOVE_CONTACT: 'appointment/delete-contact'
};
export const THEME = {
  GET_THEME: 'theme/',
  SET_THEME: 'theme/set-video',
  NEWSLETTERS: 'theme/newsletters',
  STANDARD_TEMPLATES: 'theme/get-templates',
  STANDARD_TEMPLATE: 'theme/get-template'
};
export const LABEL = {
  CREATE: 'label',
  PUT: 'label/',
  GET: 'label',
  LOAD: 'label/load',
  BULK_CREATE: 'label/bulk-create',
  DELETE: 'label/',
  CHANGE_ORDER: 'label/order',
  LOAD_CONTACTS: 'label/contacts',
  SHARED_LABELS: 'label/shared-contacts'
};

export const MAILLIST = {
  CREATE: 'mail-list',
  GET: 'mail-list/',
  DELETE: 'mail-list/',
  UPDATE: 'mail-list/',
  ADD_CONTACTS: 'mail-list/add-contacts',
  REMOVE_CONTACTS: 'mail-list/remove-contacts',
  BULK_REMOVE: 'mail-list/delete',
  LOAD_CONTACTS: 'mail-list/contacts',
  SELECT_ALL_CONTACTS: 'mail-list/get-all/'
};

export const CAMPAIGN = {
  CREATE: 'campaign',
  GET: 'campaign/',
  EDIT: 'campaign/',
  LOAD_AWAITCAMPAIGN: 'campaign/await-campaign',
  LOAD_SESSION: 'campaign/sessions',
  LOAD_ACTIVIES: 'campaign/activities',
  REMOVE_SESSION: 'campaign/remove-session',
  REMOVE_CONTACT: 'campaign/remove-contact',
  DAY_STATUS: 'campaign/day-status',
  DRAFT: 'campaign/save-draft',
  PUBLISH: 'campaign/publish',
  REMOVE: 'campaign/remove',
  LOAD_DRAFT: 'campaign/load-draft',
  LOAD_CONTACTS: 'campaign/load-contacts'
};

export const SEND = {
  VIDEO_EMAIL: 'video/bulk-email',
  VIDEO_GMAIL: 'video/bulk-gmail',
  VIDEO_OUTLOOK: 'video/bulk-outlook',
  PDF_EMAIL: 'pdf/bulk-email',
  PDF_GMAIL: 'pdf/bulk-gmail',
  PDF_OUTLOOK: 'pdf/bulk-outlook',
  IMAGE_EMAIL: 'image/bulk-email',
  IMAGE_GMAIL: 'image/bulk-gmail',
  IMAGE_OUTLOOK: 'image/bulk-outlook',
  VIDEO_TEXT: 'video/bulk-text',
  PDF_TEXT: 'pdf/bulk-text',
  IMAGE_TEXT: 'image/bulk-text',
  EMAIL: 'email/bulk-email',
  GMAIL: 'email/bulk-gmail',
  OUTLOOK: 'email/bulk-outlook',
  TEXT: '',
  SHARE: 'email/share-platform',
  SEND_EMAIL: 'email/send-email'
};

export const DRAFT = {
  CREATE: 'draft/create',
  GET: 'draft',
  UPDATE: 'draft/',
  REMOVE: 'draft/'
};

export const TAG = {
  ALL: 'tag/getAll',
  GET: 'tag/load',
  CREATE: 'tag',
  UPDATE: 'tag/update',
  DELETE: 'tag/delete',
  LOAD_ALL_CONTACTS: 'tag/load-all-contacts',
  LOAD_CONTACTS: 'tag/load-contacts',
  LOAD_SOURCES: 'contact/sources',
  LOAD_COMPANIES: 'contact/brokerage'
};
export const DEALSTAGE = {
  GET: 'deal-stage',
  DELETE: 'deal-stage/remove',
  EDIT: 'deal-stage/',
  CHANGE_ORDER: 'deal-stage/change-order',
  EASY_LOAD: 'deal-stage/easy-load',
  WITHCONTACT: 'deal-stage/with-contact',
  LOAD: 'deal-stage/load',
  INIT: 'deal-stage/init'
};

export const DEAL = {
  GET: 'deal/',
  ONLY_DEAL: 'deal/only/',
  MOVE: 'deal/move-deal',
  ADD_NOTE: 'deal/v2/add-note',
  EDIT_NOTE: 'deal/v2/edit-note',
  REMOVE_NOTE: 'deal/remove-note',
  SEND_EMAIL: 'deal/send-email',
  GET_EMAILS: 'deal/get-email',
  GET_NOTES: 'deal/get-note',
  ADD_FOLLOWUP: 'deal/add-follow',
  EDIT_FOLLOWUP: 'deal/update-follow',
  COMPLETE_FOLLOWUP: 'deal/complete-follow',
  REMOVE_FOLLOWUP: 'deal/remove-follow',
  GET_FOLLOWUP: 'deal/get-follow',
  GET_ACTIVITY: 'deal/get-activity',
  ADD_APPOINTMENT: 'deal/create-appointment',
  GET_APPOINTMENT: 'deal/get-appointments',
  UPDATE_APPOINTMENT: 'deal/update-appointment',
  REMOVE_APPOINTMENT: 'deal/remove-appointment',
  ADD_GROUP_CALL: 'deal/create-team-call',
  GET_GROUP_CALL: 'deal/get-team-calls',
  UPDAGE_GROUP_CALL: '',
  REMOVE_GROUP_CALL: '',
  SEND_TEXT: 'deal/send-text',
  UPDATE_CONTACT: 'deal/update-contact/',
  MATERIAL_ACTIVITY: 'deal/material-activity/',
  GET_TIMELINES: 'deal/get-timelines/',
  GET_All_TIMELINES: 'deal/get-all-timelines',
  BULK_CREATE: 'deal/bulk-create',
  SET_PRIMARY_CONTACT: 'deal/set-primary-contact',
  GET_SIBLINGS: 'deal/siblings/'
};

export const MATERIAL = {
  EMAIL: 'material/bulk-email',
  BULK_TEXT: 'material/bulk-text',
  VIDEO_TEXT: 'video/bulk-text',
  PDF_TEXT: 'pdf/bulk-text',
  IMAGE_TEXT: 'image/bulk-text',
  LOAD: 'material/load',
  LOAD_OWN: 'material/load-own',
  LOAD_LIBRARY: 'material/load-library',
  BULK_REMOVE: 'material/remove',
  CREATE_FOLDER: 'material/folder',
  UPDATE_FOLDER: 'material/folder/',
  REMOVE_FOLDER: 'material/remove-folder',
  UPDATE_FOLDERS: 'material/update-folders',
  REMOVE_FOLDERS: 'material/remove-folders',
  MOVE_FILES: 'material/move-material',
  LEAD_CAPTURE: 'material/lead-capture'
};

export const NOTIFICATION = {
  GET: 'notification',
  LOAD_PAGE: 'notification/list/',
  ALL: 'notification/load/all',
  READ_MARK: 'notification/bulk-read',
  UNREAD_MARK: 'notification/bulk-unread',
  DELETE: 'notification/bulk-remove',
  TEXT_DELIVERY: 'notification/get-delivery',
  STATUS: 'notification/status',
  QUEUE_TASK: 'notification/queue-task',
  EMAIL_TASK: 'notification/email-task',
  REMOVE_EMAIL_TASK: 'notification/remove-email-task',
  REMOVE_EMAIL_CONTACT: 'notification/remove-email-contact',
  LOAD_TASK_CONTACTS: 'notification/load-task-contact',
  LOAD_QUEUE_CONTACTS: 'notification/load-queue-contact',
  LOAD_EMAIL_QUEUE: 'notification/queue/emails',
  LOAD_TEXT_QUEUE: 'notification/queue/texts',
  LOAD_AUTOMATION_QUEUE: 'notification/queue/automations',
  LOAD_UNREAD_TEXTS: 'notification/unread-texts',
  TEXT_QUEUE: 'notification/text-task',
  ALL_TASKS: 'notification/all-tasks',
  CHECK_TASKS: 'notification/check-task-count',
  REMOVE_TASK: 'notification/remove-task/',
  UPDATE_TASK: 'notification/update-task/',
  RESCHEDULE_TASK: 'notification/reschedule-task/',
  UPDATET_TASK_STATUS: 'notification/update-task-status/'
};

export const FILTER = {
  API: 'filter/'
};

export const SMS = {
  GET: 'sms/',
  GET_MESSAGE: 'sms/get-messages',
  MARK_READ: 'sms/mark-read',
  SEARCH_NUMBER: 'sms/search-numbers',
  BUY_NUMBER: 'sms/buy-numbers',
  BUY_CREDIT: 'sms/buy-credit',
  LOAD_FILES: 'sms/load-files',
  GET_MESSAGE_OF_COUNT: 'sms/get-messages-count'
};

export const INTEGRATION = {
  CHECK_CALENDLY: 'integration/calendly/check-auth',
  DISCONNECT_CALENDLY: 'integration/calendly/disconnect',
  GET_CALENDLY: 'integration/calendly',
  SET_EVENT: 'integration/calendly/set-event',
  GET_TOKEN: 'integration/token',
  CONNECT_DIALER: 'integration/dialer',
  CREATE_ZOOM: 'integration/zoom-create-meeting'
};

export const DIALER = {
  REGISTER: 'phone',
  EDIT: 'phone/',
  GET_RECORDING: 'phone/recording',
  DEAL_DIALER: 'phone/deal',
  CREATE_RINGLESS: 'phone/rvm',
  LOAD_RINGLESS: 'phone/rvm',
  SEND_RINGLESS: 'phone/rvm/drop'
};

export const SCHEDULE = {
  EVENT_TYPE: 'scheduler/event-type/',
  SEARCH_BY_LINK: 'scheduler/search-link',
  GET_EVENT: 'scheduler/load-events/',
  ADD_SCHEDULE: 'scheduler/scheduler-event',
  LOAD_CONFLICTS: 'scheduler/load-conflicts'
};

export const ASSETS = {
  LOAD: 'assets/load/',
  UDPATE: 'assets/update',
  CREATE: 'assets/create',
  REPLACE: 'assets/replace',
  DELETE: 'assets/delete',
  UPLOAD: 'assets/upload'
};

export const PIPELINE = {
  GET: 'pipe',
  EDIT: 'pipe/'
};
export const SCHEDULESEND = {
  CREATE: 'task/create',
  MASS_TASKS: 'task/mass-tasks'
  // GET: 'task',
  // GETTASK: 'task/data',
  // GETCOUNT: 'task/counts'
};
