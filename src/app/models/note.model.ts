import { Deserializable } from './deserialize.model';

export class Note implements Deserializable {
  _id: string;
  user: string;
  title: string;
  content: string;
  audio: string;
  contact: string;
  updated_at: Date;
  created_at: Date;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
