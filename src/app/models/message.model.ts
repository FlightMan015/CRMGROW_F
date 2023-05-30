import { Deserializable } from './deserialize.model';

export class Message implements Deserializable {
  contacts: any[];
  content: string;
  created_at: Date;
  updated_at: Date;
  type: number;
  status: number;
  user: string[];
  _id: string;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
