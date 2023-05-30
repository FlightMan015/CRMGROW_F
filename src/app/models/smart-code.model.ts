import { Deserializable } from './deserialize.model';

export class SmartCode implements Deserializable {
  code: string;
  tag: string;
  message: string;
  automation: string;
  thumbnail: string;
  preview: string;
  material_count: number;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }

  get tags(): string[] {
    if (!this.tag) {
      return [];
    }
    return this.tag.split(',');
  }
}
