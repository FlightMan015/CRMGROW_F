export interface PageMenuItem {
  icon: string;
  label: string;
  id: string;
}
export interface TabItem {
  icon: string;
  label: string;
  id: string;
  badge?: number;
}

export interface TabOption {
  label: string;
  value: string;
}

export interface ActionItem {
  label: string;
  icon?: string;
  type: string;
  items?: { class: string; label: string; command: string }[];
  status?: boolean;
  spliter?: boolean;
  command?: string;
  loadingLabel?: string;
}
