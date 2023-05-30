import { Deserializable } from './deserialize.model';

export class Image implements Deserializable {
  user: string;
  title: string;
  description: string;
  preview: string;
  type: string;
  url: string;
  role: string;
  del: boolean;
  created_at: Date;
  updated_at: Date;
  views: number;
  _id: string;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
