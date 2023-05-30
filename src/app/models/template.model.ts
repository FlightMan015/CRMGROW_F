import { Deserializable } from './deserialize.model';

export class Template implements Deserializable {
  _id: string;
  original_id: string;
  user: string;
  title: string = '';
  subject: string = '';
  content: string = '';
  role: string;
  company: string;
  video_ids: string[] = [];
  pdf_ids: string[] = [];
  image_ids: string[] = [];
  attachments: string[];
  type: string = 'email';
  default: boolean;
  created_at: string;
  updated_at: string;
  isFolder: boolean;
  templates: string[] = [];
  folder: string = '';

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
