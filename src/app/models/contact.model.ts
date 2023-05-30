import { DetailActivity, PureActivity } from './activityDetail.model';
import { Deserializable } from './deserialize.model';
import { Timeline } from './timeline.model';
import * as _ from 'lodash';
import { isValidPhone, validateEmail } from '../helper';
export class Contact implements Deserializable {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  user: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  label: string;
  cell_phone: string;
  country: string;
  auto_follow_up: string;
  source: string;
  brokerage: string;
  tags: string[];
  recruiting_stage: string;
  deal_stage: string;
  website: string;
  secondary_email: string;
  secondary_phone: string;
  additional_field: any = {};
  last_activity: string;
  lastest_message: string;
  lastest_at: Date;
  unread: boolean;
  response: string; // calendar response status: not for contact

  deserialize(input: any): this {
    return Object.assign(this, input);
  }

  get fullName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name + ' ' + this.last_name;
    } else if (this.first_name) {
      return this.first_name;
    } else if (this.last_name) {
      return this.last_name;
    } else {
      return 'Unnamed Contact';
    }
  }

  get avatarName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name[0] + this.last_name[0];
    } else if (this.first_name) {
      return this.first_name.substring(0, 2);
    } else if (this.last_name) {
      return this.last_name.substring(0, 2);
    } else {
      return 'UN';
    }
  }

  get shortName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name + ' ' + this.last_name[0];
    } else if (this.first_name) {
      return this.first_name;
    } else if (this.last_name) {
      return this.last_name;
    } else {
      return 'Unnamed';
    }
  }

  get fullAddress(): string {
    return `${this.address ? this.address + ' ' : ''}${
      this.city ? this.city + ' ' : ''
    }${this.state ? this.state + ' ' : ''}${
      this.country ? this.country + ' ' : ''
    }${this.zip ? this.zip + ' ' : ''}`;
  }

  get shortAddress(): string {
    if (!this.city && !this.state && !this.country) {
      return '---';
    } else {
      const comps = [this.city, this.state, this.country].filter((e) => {
        return !!e;
      });
      return comps.join(', ');
    }
  }
}

export class ContactActivity implements Deserializable {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  user: string;
  last_activity: PureActivity;
  address: string;
  city: string;
  state: string;
  zip: string;
  label: string;
  cell_phone: string;
  country: string;
  auto_follow_up: string;
  source: string;
  brokerage: string;
  tags: string[];
  stages: string[];
  recruiting_stage: string;
  website: string;

  deserialize(input: any): this {
    Object.assign(this, input);
    if (input.last_activity instanceof Array && input.last_activity[0]) {
      this.last_activity = new PureActivity().deserialize(
        input.last_activity[0]
      );
    }
    return this;
  }

  get fullName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name + ' ' + this.last_name;
    } else if (this.first_name) {
      return this.first_name;
    } else if (this.last_name) {
      return this.last_name;
    } else {
      return 'Unnamed Contact';
    }
  }

  get avatarName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name[0] + this.last_name[0];
    } else if (this.first_name) {
      return this.first_name.substring(0, 2);
    } else if (this.last_name) {
      return this.last_name.substring(0, 2);
    } else {
      return 'UN';
    }
  }

  get shortName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name + ' ' + this.last_name[0];
    } else if (this.first_name) {
      return this.first_name;
    } else if (this.last_name) {
      return this.last_name;
    } else {
      return 'Unnamed';
    }
  }

  get moreTag(): string {
    if (this.tags?.length > 1) {
      return '+' + (this.tags.length - 1) + ' more';
    }
    return '';
  }

  get moreStage(): string {
    if (this.stages?.length > 1) {
      return '+' + (this.stages.length - 1) + ' more';
    }
    return '';
  }

  get mainInfo(): Contact {
    return new Contact().deserialize({
      _id: this._id,
      first_name: this.first_name,
      last_name: this.last_name,
      email: this.email,
      cell_phone: this.cell_phone
    });
  }

  get shortAddress(): string {
    if (!this.city && !this.state && !this.country) {
      return '---';
    } else {
      const comps = [this.city, this.state, this.country].filter((e) => {
        return !!e;
      });
      return comps.join(', ');
    }
  }

  updateTag(tagData: any): void {
    switch (tagData.option) {
      case 2:
        this.tags = _.union(this.tags, tagData.tags);
        break;
      case 3:
        this.tags = _.difference(this.tags, tagData.tags);
        break;
      case 4:
        this.tags = tagData.tags;
        break;
    }
  }
}

export class ContactDetail extends Contact {
  activity: DetailActivity[] = [];
  automation: {
    _id: string;
    title: string;
  };
  time_lines: Timeline[];
  next: string;
  prev: string;

  created_at: Date;
  updated_at: Date;

  details: any = {};

  deserialize(input: any): this {
    Object.assign(this, input);
    this.activity = input.activity.map((e) =>
      new DetailActivity().deserialize(e)
    );
    this.activity ? true : (this.activity = []);
    return this;
  }

  get last_activity_time(): Date {
    if (!this.activity || !this.activity.length) {
      return new Date();
    }
    const last_activity = this.activity.slice(-1)[0];
    return last_activity.created_at;
  }
}

export class Contact2I implements Deserializable {
  _id: string;
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  cell_phone: string;
  secondary_email: string;
  secondary_phone: string;
  brokerage: string;
  website: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  tags: string[];
  source: string;
  label: string;
  notes: string[] = [];
  label_id: string;
  auto_follow_up: string;
  recruiting_stage: string;
  deal_stage: string;
  additional_field: any;
  deal: any;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }

  get fullName(): string {
    if (this.first_name && this.last_name) {
      return this.first_name + ' ' + this.last_name;
    } else if (this.first_name) {
      return this.first_name;
    } else if (this.last_name) {
      return this.last_name;
    } else {
      return '';
    }
  }

  get fullAddress(): string {
    return `${this.address ? this.address + ' ' : ''}${
      this.city ? this.city + ' ' : ''
    }${this.state ? this.state + ' ' : ''}${
      this.country ? this.country + ' ' : ''
    }${this.zip ? this.zip + ' ' : ''}`;
  }

  get isValidEmails(): boolean {
    if (
      (!this.email || validateEmail(this.email)) &&
      (!this.secondary_email || validateEmail(this.secondary_email))
    ) {
      return true;
    }
    return false;
  }
  get isValidPhones(): boolean {
    if (!isValidPhone(this.cell_phone)) {
      return false;
    }
    if (!isValidPhone(this.secondary_phone)) {
      return false;
    }
    return true;
  }
}

export class CampContact extends Contact {
  not_found: boolean = false;
  failed: boolean = false;
  failed_reason: string = '';
  failed_type: string = '';
  status: string = '';
}
