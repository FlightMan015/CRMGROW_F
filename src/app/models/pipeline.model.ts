import { Deserializable } from './deserialize.model';

export class Pipeline implements Deserializable {
  _id: string;
  user: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
