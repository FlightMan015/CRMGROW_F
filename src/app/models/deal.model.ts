import { Deserializable } from './deserialize.model';
import { Activity } from './activity.model';
import { Contact } from './contact.model';

export class Deal implements Deserializable {
  _id: string;
  user: string;
  contact: string;
  contacts: Contact[];
  deal_stage: string;
  title: string;
  additional_field: any;
  created_at: Date;
  updated_at: Date;
  put_at: Date;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
