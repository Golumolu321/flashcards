# StudyCard Creator

A feature-rich web application for creating, customizing, managing, and generating printable index cards with AI-assisted content import.

## Features

- **Card Management**: Create and organize index cards in decks/folders
- **Design Tools**: Rich text editing, shapes, images, drag & drop
- **AI Integration**: Extract content from PDFs/images using Gemini AI
- **Collaboration**: Real-time collaborative editing
- **Templates**: Pre-built flashcard templates
- **Printing**: Generate print-ready PDFs for home printing
- **Mobile Support**: Full editing capabilities on mobile devices

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Database, Auth, Real-time)
- **AI**: Google Gemini API
- **Build Tool**: Vite

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env` file with your credentials:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### 2. Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  gemini_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folders for organization
CREATE TABLE folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES folders(id),
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decks (collections of cards)
CREATE TABLE decks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  folder_id UUID REFERENCES folders(id),
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  card_size TEXT DEFAULT '3x5', -- '3x5', '4x6', '5x8', 'custom'
  custom_width INTEGER,
  custom_height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual cards
CREATE TABLE cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deck_id UUID REFERENCES decks(id) NOT NULL,
  title TEXT,
  front_content JSONB DEFAULT '{}',
  back_content JSONB DEFAULT '{}',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates
CREATE TABLE templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  card_size TEXT DEFAULT '3x5',
  front_template JSONB DEFAULT '{}',
  back_template JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collaboration permissions
CREATE TABLE collaborators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  resource_type TEXT NOT NULL, -- 'folder' or 'deck'
  resource_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  permission TEXT DEFAULT 'view', -- 'view', 'edit', 'admin'
  invited_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource_type, resource_id, user_id)
);

-- AI processing history
CREATE TABLE ai_extractions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  extracted_content JSONB,
  cards_generated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_extractions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for folders
CREATE POLICY "Users can view own folders" ON folders
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    id IN (
      SELECT resource_id FROM collaborators 
      WHERE resource_type = 'folder' AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create folders" ON folders
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own folders" ON folders
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own folders" ON folders
  FOR DELETE USING (owner_id = auth.uid());

-- RLS Policies for decks
CREATE POLICY "Users can view accessible decks" ON decks
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    id IN (
      SELECT resource_id FROM collaborators 
      WHERE resource_type = 'deck' AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create decks" ON decks
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update accessible decks" ON decks
  FOR UPDATE USING (
    owner_id = auth.uid() OR 
    id IN (
      SELECT resource_id FROM collaborators 
      WHERE resource_type = 'deck' AND user_id = auth.uid() AND permission IN ('edit', 'admin')
    )
  );

CREATE POLICY "Users can delete own decks" ON decks
  FOR DELETE USING (owner_id = auth.uid());

-- RLS Policies for cards
CREATE POLICY "Users can view cards in accessible decks" ON cards
  FOR SELECT USING (
    deck_id IN (
      SELECT id FROM decks WHERE 
      owner_id = auth.uid() OR 
      id IN (
        SELECT resource_id FROM collaborators 
        WHERE resource_type = 'deck' AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create cards in accessible decks" ON cards
  FOR INSERT WITH CHECK (
    deck_id IN (
      SELECT id FROM decks WHERE 
      owner_id = auth.uid() OR 
      id IN (
        SELECT resource_id FROM collaborators 
        WHERE resource_type = 'deck' AND user_id = auth.uid() AND permission IN ('edit', 'admin')
      )
    )
  );

CREATE POLICY "Users can update cards in accessible decks" ON cards
  FOR UPDATE USING (
    deck_id IN (
      SELECT id FROM decks WHERE 
      owner_id = auth.uid() OR 
      id IN (
        SELECT resource_id FROM collaborators 
        WHERE resource_type = 'deck' AND user_id = auth.uid() AND permission IN ('edit', 'admin')
      )
    )
  );

CREATE POLICY "Users can delete cards in own decks" ON cards
  FOR DELETE USING (
    deck_id IN (
      SELECT id FROM decks WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for templates
CREATE POLICY "Users can view public templates" ON templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates" ON templates
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own templates" ON templates
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for collaborators
CREATE POLICY "Users can view collaborations they're part of" ON collaborators
  FOR SELECT USING (user_id = auth.uid() OR invited_by = auth.uid());

CREATE POLICY "Resource owners can manage collaborators" ON collaborators
  FOR ALL USING (
    invited_by = auth.uid() OR
    (resource_type = 'folder' AND resource_id IN (SELECT id FROM folders WHERE owner_id = auth.uid())) OR
    (resource_type = 'deck' AND resource_id IN (SELECT id FROM decks WHERE owner_id = auth.uid()))
  );

-- RLS Policies for ai_extractions
CREATE POLICY "Users can view own AI extractions" ON ai_extractions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create AI extractions" ON ai_extractions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Insert default templates
INSERT INTO templates (name, description, category, card_size, front_template, back_template, is_public) VALUES
('Basic Flashcard', 'Simple question and answer format', 'study', '3x5', 
 '{"elements": [{"type": "text", "content": "Question:", "x": 10, "y": 10, "fontSize": 16, "fontWeight": "bold"}]}',
 '{"elements": [{"type": "text", "content": "Answer:", "x": 10, "y": 10, "fontSize": 16, "fontWeight": "bold"}]}',
 true),
('Vocabulary Card', 'Word definition and example', 'language', '4x6',
 '{"elements": [{"type": "text", "content": "Word:", "x": 10, "y": 10, "fontSize": 18, "fontWeight": "bold"}, {"type": "text", "content": "Definition:", "x": 10, "y": 50, "fontSize": 14}]}',
 '{"elements": [{"type": "text", "content": "Example:", "x": 10, "y": 10, "fontSize": 14}, {"type": "text", "content": "Synonyms:", "x": 10, "y": 50, "fontSize": 14}]}',
 true),
('Math Formula', 'Mathematical concepts and formulas', 'math', '5x8',
 '{"elements": [{"type": "text", "content": "Formula:", "x": 10, "y": 10, "fontSize": 16, "fontWeight": "bold"}]}',
 '{"elements": [{"type": "text", "content": "Explanation:", "x": 10, "y": 10, "fontSize": 14}, {"type": "text", "content": "Example:", "x": 10, "y": 60, "fontSize": 14}]}',
 true);

-- Create functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_decks_updated_at BEFORE UPDATE ON decks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Gemini AI Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your profile in the app settings

## Development

```bash
npm install
npm run dev
```

## Card Content Structure

Cards store their content as JSONB with this structure:
```json
{
  "elements": [
    {
      "id": "unique-id",
      "type": "text|image|shape",
      "content": "text content or image URL",
      "x": 10,
      "y": 20,
      "width": 100,
      "height": 50,
      "fontSize": 16,
      "fontFamily": "Arial",
      "color": "#000000",
      "backgroundColor": "#ffffff",
      "rotation": 0,
      "zIndex": 1
    }
  ],
  "backgroundColor": "#ffffff",
  "backgroundImage": "url"
}
```