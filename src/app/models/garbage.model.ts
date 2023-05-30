import { Deserializable } from './deserialize.model';
import { SmartCode } from './smart-code.model';

interface CaptureFields {
  [name: string]: {
    display: boolean;
    required: boolean;
  };
}

export class Garbage implements Deserializable {
  _id: string;
  user: string;
  canned_message: {
    sms: string;
    email: string;
  };
  edited_video: string[];
  edited_pdf: string[];
  edited_image: string[];
  edited_automation: string[];
  edited_label: string[];
  task_setting = {
    schedule_email: false,
    schedule_text: false,
    schedule_meeting: false,
    default_scheduler: null
  };
  desktop_notification = {
    material: false,
    email: false,
    link_clicked: false,
    text_replied: false,
    follow_up: false,
    lead_capture: false,
    unsubscription: false,
    resubscription: false,
    reminder_scheduler: false
  };
  email_notification = {
    material: true,
    email: true,
    link_clicked: false,
    text_replied: false,
    follow_up: true,
    lead_capture: false,
    unsubscription: true,
    resubscription: true,
    reminder_scheduler: false
  };
  text_notification = {
    material: true,
    email: false,
    link_clicked: false,
    text_replied: false,
    follow_up: false,
    lead_capture: false,
    unsubscription: false,
    resubscription: false,
    reminder_scheduler: false
  };
  reminder_before = 30;
  reminder_scheduler = 30;
  capture_dialog = false;
  capture_delay = 0;
  capture_videos: any[];
  capture_images: any[];
  capture_pdfs: any[];
  capture_form: string;
  capture_forms: any;
  capture_field: any;
  index_page: string;
  logo: string;
  material_theme = 'theme2';
  auto_follow_up = {
    enabled: false,
    period: 0,
    content: ''
  };
  auto_resend = {
    enabled: false,
    period: 24,
    sms_canned_message: '',
    email_canned_message: ''
  };
  auto_follow_up2 = {
    enabled: false,
    period: 0,
    content: ''
  };
  auto_resend2 = {
    enabled: false,
    period: 24,
    sms_canned_message: '',
    email_canned_message: ''
  };
  material_themes: any;
  tag_automation: any;
  highlights: [];
  brands: [];
  intro_video: string;
  calendar_info: {
    is_enabled: boolean;
    start_time: string;
    end_time: string;
  };
  calendly: {
    id: string;
    token: string;
    email: string;
    link: string;
  };
  additional_fields: {
    id: string;
    type: string;
    name: string;
    placeholder: string;
    status: boolean;
    options: { value: string; label: string }[];
  }[] = [];
  access_token: string = '';
  zoom: {
    email: string;
    refresh_token: string;
  };
  smart_codes: any;
  smtp_info: {
    host: string;
    user: string;
    pass: string;
    secure: boolean;
    port: number;
    email: string;
    smtp_sender_verified: boolean;
    verification_code: string;
    daily_limit: number;
    start_time: string;
    end_time: string;
  };
  email_time: {
    is_enabled: boolean;
    start_time: string;
    end_time: string;
    enabled_days: number[];
    timezone: string;
  };
  text_time: {
    is_enabled: boolean;
    start_time: string;
    end_time: string;
    enabled_days: number[];
    timezone: string;
  };
  call_labels: string[] = [];
  is_read: boolean = false;

  deserialize(input: any): this {
    Object.entries(input).forEach(([key, value]) => {
      if (!value && typeof this[key] === 'object') {
        input[key] = this[key];
        return;
      }
    });
    return Object.assign(this, input);
  }

  notification_fields = [
    'material',
    'email',
    'link_clicked',
    'text_replied',
    'follow_up',
    'lead_capture',
    'unsubscription',
    'reminder_scheduler'
  ];

  get entire_desktop_notification(): number {
    if (!this.desktop_notification) {
      return -1;
    }
    let all_checked = true;
    let some_checked = false;
    this.notification_fields.forEach((e) => {
      all_checked = all_checked && this.desktop_notification[e];
      some_checked = some_checked || this.desktop_notification[e];
    });
    return all_checked ? 1 : some_checked ? 0 : -1;
  }
  get entire_text_notification(): number {
    if (!this.text_notification) {
      return -1;
    }
    let all_checked = true;
    let some_checked = false;
    this.notification_fields.forEach((e) => {
      all_checked = all_checked && this.text_notification[e];
      some_checked = some_checked || this.text_notification[e];
    });
    return all_checked ? 1 : some_checked ? 0 : -1;
  }
  get entire_email_notification(): number {
    if (!this.email_notification) {
      return -1;
    }
    let all_checked = true;
    let some_checked = false;
    this.notification_fields.forEach((e) => {
      all_checked = all_checked && this.email_notification[e];
      some_checked = some_checked || this.email_notification[e];
    });
    return all_checked ? 1 : some_checked ? 0 : -1;
  }
}
