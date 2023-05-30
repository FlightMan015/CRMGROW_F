import { Deserializable } from './deserialize.model';

export class Tag implements Deserializable {
  _id: string;
  count: number;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
