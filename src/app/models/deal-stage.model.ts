import { Deserializable } from './deserialize.model';
import { Deal } from './deal.model';

export class DealStage implements Deserializable {
  _id: string;
  user: string;
  title: string;
  deals: Deal[];
  duration: number;
  created_at: Date;
  updated_at: Date;
  deals_count: number = 0;
  pipe_line: string;
  priority: number;
  // eslint-disable-next-line @typescript-eslint/ban-types
  automation: Object;
  static deserilize: any;

  deserialize(input: any): this {
    Object.assign(this, input);
    this.deals_count = this.deals.length;
    return this;
  }
}
