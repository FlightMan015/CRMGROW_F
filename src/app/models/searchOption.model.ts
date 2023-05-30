import { TaskStatus } from '../constants/variable.constants';
import { Deserializable } from './deserialize.model';

class LastMaterialCondition implements Deserializable {
  send_video: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  send_image: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  send_pdf: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  watched_video: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  watched_image: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  watched_pdf: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}

export class MaterialCondition implements Deserializable {
  watched_video: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  watched_image: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  watched_pdf: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  not_watched_video: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  not_watched_image: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  not_watched_pdf: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  sent_video: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  sent_image: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  sent_pdf: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  not_sent_video: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  not_sent_image: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };
  not_sent_pdf: { flag: boolean; material: string } = {
    flag: false,
    material: undefined
  };

  deserialize(input: any): this {
    return Object.assign(this, input);
  }

  isSet(): boolean {
    return (
      this.watched_video.flag ||
      this.watched_pdf.flag ||
      this.watched_image.flag ||
      this.not_watched_video.flag ||
      this.not_watched_pdf.flag ||
      this.not_watched_image.flag ||
      this.sent_video.flag ||
      this.sent_pdf.flag ||
      this.sent_image.flag ||
      this.not_sent_video.flag ||
      this.not_sent_pdf.flag ||
      this.not_sent_image.flag
    );
  }
}
export class SearchOption implements Deserializable {
  _id: string;
  searchStr: string = '';
  recruitingStageCondition: string[] = [];
  countryCondition: string[] = [];
  regionCondition: string[] = [];
  cityCondition: string[] = [];
  zipcodeCondition: string = '';
  tagsCondition: string[] = [];
  stagesCondition: string[] = [];
  sourceCondition: string[] = [];
  brokerageCondition: string[] = [];
  activityCondition: string[] = [];
  labelCondition: string[] = [];
  lastMaterial: LastMaterialCondition = new LastMaterialCondition();
  materialCondition: MaterialCondition = new MaterialCondition();
  includeLabel: boolean = true;
  includeLastActivity: boolean = true;
  includeBrokerage: boolean = true;
  includeSource: boolean = true;
  includeStage: boolean = true;
  includeTag: boolean = true;
  includeFollowUps: boolean = true;
  activityStart: Date;
  activityEnd: Date;
  teamOptions: any = {};

  deserialize(input: any): this {
    Object.assign(this, input);
    this.materialCondition = new MaterialCondition().deserialize(
      this.materialCondition
    );
    this.lastMaterial = new LastMaterialCondition().deserialize(
      this.lastMaterial
    );
    return this;
  }

  isEmpty(): boolean {
    return (
      !this.searchStr &&
      !this.labelCondition.length &&
      !this.recruitingStageCondition.length &&
      !(this.countryCondition && this.countryCondition.length) &&
      !this.regionCondition.length &&
      !this.cityCondition.length &&
      !this.zipcodeCondition &&
      !this.tagsCondition.length &&
      !this.stagesCondition.length &&
      !this.brokerageCondition.length &&
      !this.activityCondition.length &&
      !this.sourceCondition.length &&
      !this.lastMaterial.send_pdf.flag &&
      !this.lastMaterial.send_video.flag &&
      !this.lastMaterial.send_image.flag &&
      !this.lastMaterial.watched_video.flag &&
      !this.lastMaterial.watched_pdf.flag &&
      !this.lastMaterial.watched_image.flag &&
      !this.activityStart &&
      !this.activityEnd &&
      !this.materialCondition.isSet() &&
      !Object.keys(this.teamOptions).length
    );
  }

  getActiveOptions(): number {
    let count = 0;
    this.searchStr && count++;
    this.labelCondition.length && count++;
    this.countryCondition && this.countryCondition.length && count++;
    this.regionCondition.length && count++;
    this.cityCondition && this.cityCondition.length && count++;
    this.zipcodeCondition && this.zipcodeCondition.length && count++;
    if (
      this.activityCondition.length ||
      this.lastMaterial.send_pdf.flag ||
      this.lastMaterial.send_video.flag ||
      this.lastMaterial.send_image.flag ||
      this.lastMaterial.watched_video.flag ||
      this.lastMaterial.watched_pdf.flag ||
      this.lastMaterial.watched_image.flag
    ) {
      count++;
    }
    this.activityStart && count++;
    this.activityEnd && count++;
    if (Object.keys(this.teamOptions).length) {
      count++;
    } else {
      this.materialCondition.isSet() && count++;
      this.stagesCondition.length && count++;
      this.brokerageCondition.length && count++;
      this.sourceCondition.length && count++;
      this.tagsCondition.length && count++;
    }
    return count;
  }

  hasTeamOptions(): boolean {
    if (Object.keys(this.teamOptions).length) {
      return true;
    } else {
      return false;
    }
  }
}

export class TaskSearchOption implements Deserializable {
  str: string;
  status: number = 0;
  contact: string;
  types: string[];
  labels: string[];
  start_date: string;
  end_date: string;
  name: string = 'all';

  deserialize(input: any): this {
    return Object.assign(this, input);
  }

  get isActive(): boolean {
    if (
      this.str ||
      this.contact ||
      (this.labels && this.labels.length) ||
      this.start_date ||
      this.end_date
    ) {
      return true;
    }
    return false;
  }

  getActiveOptions(): number {
    let count = 1;
    this.str && count++;
    this.contact && count++;
    this.types && this.types.length && count++;
    this.labels && this.labels.length && count++;
    (this.start_date || this.end_date) && count++;

    return count;
  }
}
export class TaskDurationOption implements Deserializable {
  start_date: string;
  end_date: string;
  status: number = 0;
  name: string;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
