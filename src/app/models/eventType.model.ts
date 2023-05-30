import { Deserializable } from './deserialize.model';

export class EventType implements Deserializable {
  _id: string;
  user: string;
  title: string;
  description: string;
  location: any;
  due_start: Date;
  due_end: Date;
  type: number;
  del: { type: boolean; default: false };
  guests: string[];
  event_id: string;
  recurrence_id: string;
  link: string;
  duration: number;
  gap: any;
  date_range: any;
  weekly_hours: any;
  calendar_id: string;
  automation: string;
  auto_trigger_duration: number;
  auto_trigger_time: string;
  auto_trigger_type: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
