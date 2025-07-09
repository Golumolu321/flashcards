export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  gemini_api_key?: string;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  owner_id: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  folder_id?: string;
  owner_id: string;
  is_shared: boolean;
  card_size: '3x5' | '4x6' | '5x8' | 'custom';
  custom_width?: number;
  custom_height?: number;
  created_at: string;
  updated_at: string;
}

export interface CardElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  rotation?: number;
  zIndex?: number;
}

export interface CardContent {
  elements: CardElement[];
  backgroundColor?: string;
  backgroundImage?: string;
}

export interface Card {
  id: string;
  deck_id: string;
  title?: string;
  front_content: CardContent;
  back_content: CardContent;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  card_size: '3x5' | '4x6' | '5x8' | 'custom';
  front_template: CardContent;
  back_template: CardContent;
  is_public: boolean;
  created_by?: string;
  created_at: string;
}

export interface Collaborator {
  id: string;
  resource_type: 'folder' | 'deck';
  resource_id: string;
  user_id: string;
  permission: 'view' | 'edit' | 'admin';
  invited_by: string;
  created_at: string;
}

export interface AIExtraction {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  extracted_content: any;
  cards_generated: number;
  created_at: string;
}