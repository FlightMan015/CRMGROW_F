import { Deserializable } from './deserialize.model';

export class Automation implements Deserializable {
  _id: string;
  original_id: string;
  user: string;
  title: string;
  company: string;
  automations: any[];
  role: string;
  isFolder: boolean;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
