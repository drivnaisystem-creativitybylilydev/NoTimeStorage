-- ============================================================
-- Schools + Dorms seed for Supabase
-- Run this in Supabase → SQL Editor
-- ============================================================

-- 1. Create schools table (reference list of all partner schools)
CREATE TABLE IF NOT EXISTS public.schools (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  short_name text,
  location   text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schools_pkey PRIMARY KEY (id)
);

-- 2. Insert all schools (ON CONFLICT so re-run is safe)
INSERT INTO public.schools (name, short_name, location) VALUES
  ('Stonehill College',                    'Stonehill', 'Easton, MA'),
  ('University of New Haven',              'UNH',       'West Haven, CT'),
  ('University of Dayton',                 'Dayton',    'Dayton, OH'),
  ('University of Massachusetts',          'UMass',     'Massachusetts'),
  ('Brevard College',                      'Brevard',   'Brevard, NC'),
  ('Gordon College',                       'Gordon',    'Wenham, MA'),
  ('Central Connecticut State University', 'CCSU',      'New Britain, CT')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 3. Dorms (your existing public.dorms table)
-- ============================================================

-- Remove existing dorms for these schools so re-running is safe
DELETE FROM public.dorms
WHERE school IN (
  'Stonehill College',
  'University of New Haven',
  'University of Dayton',
  'University of Massachusetts',
  'Brevard College',
  'Gordon College',
  'Central Connecticut State University'
);

-- ============================================================
-- Insert dorms (school, name). Other columns use table defaults.
-- ============================================================

-- Stonehill College
INSERT INTO public.dorms (school, name) VALUES
  ('Stonehill College', 'Bogan Hall'),
  ('Stonehill College', 'Boland Hall'),
  ('Stonehill College', 'Commonwealth Courts'),
  ('Stonehill College', 'Corr Hall'),
  ('Stonehill College', 'Holy Cross Center'),
  ('Stonehill College', 'Notre Dame du Lac Hall'),
  ('Stonehill College', 'O''Hara Hall'),
  ('Stonehill College', 'O''Hara Village'),
  ('Stonehill College', 'Pilgrim Heights'),
  ('Stonehill College', 'Pilgrim Heights Village — Colonial Courts'),
  ('Stonehill College', 'Villa Theresa Hall'),
  ('Stonehill College', 'Off-Campus Housing');

-- University of New Haven
INSERT INTO public.dorms (school, name) VALUES
  ('University of New Haven', 'Bergami Hall'),
  ('University of New Haven', 'Bethel Hall'),
  ('University of New Haven', 'Bixler Hall'),
  ('University of New Haven', 'Gerber Hall'),
  ('University of New Haven', 'Westside Hall'),
  ('University of New Haven', 'Celentano Hall'),
  ('University of New Haven', 'Dunham Hall'),
  ('University of New Haven', 'Sheffield Hall'),
  ('University of New Haven', 'Winchester Hall'),
  ('University of New Haven', 'The Atwood'),
  ('University of New Haven', 'Campbell Houses'),
  ('University of New Haven', 'Forest Hills Apartments'),
  ('University of New Haven', 'Park View'),
  ('University of New Haven', 'Ricardo Street House'),
  ('University of New Haven', 'Ruden Street Apartments'),
  ('University of New Haven', 'Off-Campus Housing');

-- University of Dayton
INSERT INTO public.dorms (school, name) VALUES
  ('University of Dayton', 'Marianist Hall'),
  ('University of Dayton', 'Marycrest Complex'),
  ('University of Dayton', 'Stuart Complex'),
  ('University of Dayton', 'Virginia W. Kettering Hall'),
  ('University of Dayton', 'Garden Apartments'),
  ('University of Dayton', 'Campus South Apartments'),
  ('University of Dayton', 'Student Neighborhood'),
  ('University of Dayton', 'Caldwell Apartments'),
  ('University of Dayton', 'ArtStreet Apartments'),
  ('University of Dayton', 'Plumwood Apartments'),
  ('University of Dayton', 'University Place'),
  ('University of Dayton', '819 Irving Avenue Apartments'),
  ('University of Dayton', 'Adele Center Apartments'),
  ('University of Dayton', 'Lawnview Apartments'),
  ('University of Dayton', 'East Stewart Garden Apartments - North'),
  ('University of Dayton', 'North Neighborhood'),
  ('University of Dayton', 'South Neighborhood'),
  ('University of Dayton', 'College Park Neighborhood'),
  ('University of Dayton', 'South Student Neighborhood'),
  ('University of Dayton', 'Sorority Houses');

-- University of Massachusetts
INSERT INTO public.dorms (school, name) VALUES
  ('University of Massachusetts', 'Baker Hall (Central)'),
  ('University of Massachusetts', 'Birch Hall (Commonwealth Honors College)'),
  ('University of Massachusetts', 'Brett Hall (Central)'),
  ('University of Massachusetts', 'Brooks Hall (Central)'),
  ('University of Massachusetts', 'Brown Hall (Sylvan)'),
  ('University of Massachusetts', 'Butterfield Hall (Central)'),
  ('University of Massachusetts', 'Cance Hall (Southwest)'),
  ('University of Massachusetts', 'Cashin Hall (Sylvan)'),
  ('University of Massachusetts', 'Chadbourne Hall (Central)'),
  ('University of Massachusetts', 'Coolidge Hall (Southwest)'),
  ('University of Massachusetts', 'Crabtree Hall (Northeast)'),
  ('University of Massachusetts', 'Crampton Hall (Southwest)'),
  ('University of Massachusetts', 'Dickinson House (Orchard Hill)'),
  ('University of Massachusetts', 'Dwight Hall (Northeast)'),
  ('University of Massachusetts', 'Elm Hall (Commonwealth Honors College)'),
  ('University of Massachusetts', 'Emerson Hall (Southwest)'),
  ('University of Massachusetts', 'Field Hall (Orchard Hill)'),
  ('University of Massachusetts', 'Gorman Hall (Central)'),
  ('University of Massachusetts', 'Grayson Hall (Orchard Hill)'),
  ('University of Massachusetts', 'Greenough Hall (Central)'),
  ('University of Massachusetts', 'Hamlin Hall (Northeast)'),
  ('University of Massachusetts', 'James Hall (Southwest)'),
  ('University of Massachusetts', 'John Adams Hall (Southwest)'),
  ('University of Massachusetts', 'John Quincy Adams Hall (Southwest)'),
  ('University of Massachusetts', 'Johnson Hall (Northeast)'),
  ('University of Massachusetts', 'Kennedy Hall (Southwest)'),
  ('University of Massachusetts', 'Knowlton Hall (Northeast)'),
  ('University of Massachusetts', 'Leach Hall (Northeast)'),
  ('University of Massachusetts', 'Lewis Hall (Northeast)'),
  ('University of Massachusetts', 'Linden Hall (Commonwealth Honors College)'),
  ('University of Massachusetts', 'MacKimmie Hall (Southwest)'),
  ('University of Massachusetts', 'Maple Hall (Commonwealth Honors College)'),
  ('University of Massachusetts', 'Mary Lyon Hall (Northeast)'),
  ('University of Massachusetts', 'McNamara Hall (Sylvan)'),
  ('University of Massachusetts', 'Melville Hall (Southwest)'),
  ('University of Massachusetts', 'Moore Hall (Southwest)'),
  ('University of Massachusetts', 'North Apartment A (North)'),
  ('University of Massachusetts', 'North Apartment B (North)'),
  ('University of Massachusetts', 'North Apartment C (North)'),
  ('University of Massachusetts', 'North Apartment D (North)'),
  ('University of Massachusetts', 'Oak Hall (Commonwealth Honors College)'),
  ('University of Massachusetts', 'Patterson Hall (Southwest)'),
  ('University of Massachusetts', 'Pierpont Hall (Southwest)'),
  ('University of Massachusetts', 'Prince Hall (Southwest)'),
  ('University of Massachusetts', 'Sycamore Hall (Commonwealth Honors College)'),
  ('University of Massachusetts', 'Thatcher Hall (Northeast)'),
  ('University of Massachusetts', 'Thoreau Hall (Southwest)'),
  ('University of Massachusetts', 'Van Meter Hall (Central)'),
  ('University of Massachusetts', 'Washington Hall (Southwest)'),
  ('University of Massachusetts', 'Webster Hall (Orchard Hill)'),
  ('University of Massachusetts', 'Wheeler Hall (Central)');

-- Brevard College
INSERT INTO public.dorms (school, name) VALUES
  ('Brevard College', 'Beam Residence Hall'),
  ('Brevard College', 'Jones Hall'),
  ('Brevard College', 'Stanback Hall'),
  ('Brevard College', 'The Villages'),
  ('Brevard College', 'North Village'),
  ('Brevard College', 'Center Village'),
  ('Brevard College', 'South Village');

-- Gordon College
INSERT INTO public.dorms (school, name) VALUES
  ('Gordon College', 'Nyland Hall'),
  ('Gordon College', 'Fulton Hall'),
  ('Gordon College', 'Tavilla Hall'),
  ('Gordon College', 'Chase Hall'),
  ('Gordon College', 'Wilson Hall'),
  ('Gordon College', 'Evans Hall'),
  ('Gordon College', 'Ferrin Hall'),
  ('Gordon College', 'Bromley Hall'),
  ('Gordon College', 'Grace Hall'),
  ('Gordon College', 'Hilton Hall'),
  ('Gordon College', 'MacInnis Hall'),
  ('Gordon College', 'Conrad Hall'),
  ('Gordon College', 'Rider Hall'),
  ('Gordon College', 'Shields House');

-- Central Connecticut State University
INSERT INTO public.dorms (school, name) VALUES
  ('Central Connecticut State University', 'Mildred Barrows Hall'),
  ('Central Connecticut State University', 'Catharine Beecher Hall'),
  ('Central Connecticut State University', 'F. Don James Hall'),
  ('Central Connecticut State University', 'Seth North Hall'),
  ('Central Connecticut State University', 'Thomas Gallaudet Hall'),
  ('Central Connecticut State University', 'Mid-Campus Hall'),
  ('Central Connecticut State University', 'Robert Sheridan Hall'),
  ('Central Connecticut State University', 'Robert Vance Hall'),
  ('Central Connecticut State University', 'Sam May Hall'),
  ('Central Connecticut State University', 'Carroll Hall');

-- ============================================================
-- Verify: SELECT school, COUNT(*) FROM public.dorms GROUP BY school ORDER BY school;
-- ============================================================
