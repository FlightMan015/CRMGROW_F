import { Deserializable } from './deserialize.model';

export class Material implements Deserializable {
  original_id: string;
  user: any;
  team: any;
  title: string;
  description: string;
  url: string;
  path: string;
  type: string;
  material_type: string;
  folder: string;
  role: string;
  company: string;
  preview: string;
  thumbnail: string;
  thumbnail_path: string;
  custom_thumbnail: boolean;
  site_image: string;
  material_theme: string;
  priority: number;
  converted: string; // none | progress | completed
  uploaded: boolean;
  recording: boolean;
  duration: number;
  capture_form: string;
  enabled_capture: boolean;
  default_edited: boolean;
  default_video: string;
  default_pdf: string;
  default_image: string;
  has_shared: boolean;
  shared_video: string;
  shared_pdf: string;
  shared_image: string;
  videos: any[] = [];
  pdfs: any[] = [];
  images: any[] = [];
  del: boolean;
  created_at: Date;
  updated_at: Date;
  views: number;
  bucket: string;
  key: string;
  progress: number;
  in_template: boolean = false;
  _id: string;

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
