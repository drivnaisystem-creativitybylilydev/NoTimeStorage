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
  ('Stonehill College',                    'Stonehill',   'Easton, MA'),
  ('University of New Haven',              'UNH',         'West Haven, CT'),
  ('University of Dayton',                 'Dayton',      'Dayton, OH'),
  ('University of Massachusetts',          'UMass',       'Massachusetts'),
  ('Brevard College',                      'Brevard',     'Brevard, NC'),
  ('Gordon College',                       'Gordon',      'Wenham, MA'),
  ('Central Connecticut State University', 'CCSU',        'New Britain, CT'),
  ('Sacred Heart University',              'SHU',         'Fairfield, CT'),
  ('Towson University',                    'Towson',      'Towson, MD'),
  ('University of Notre Dame',             'Notre Dame',  'Notre Dame, IN'),
  ('James Madison University',             'JMU',         'Harrisonburg, VA'),
  ('Bridgewater State University',         'Bridgewater', 'Bridgewater, MA')
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
  'Central Connecticut State University',
  'Sacred Heart University',
  'Towson University',
  'University of Notre Dame',
  'James Madison University',
  'Bridgewater State University'
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
  ('Central Connecticut State University', 'Carroll Hall'),
  ('Central Connecticut State University', 'Off-Campus Housing');

-- Sacred Heart University
INSERT INTO public.dorms (school, name) VALUES
  ('Sacred Heart University', 'Elizabeth Ann Seton Hall'),
  ('Sacred Heart University', 'Thomas Merton Hall'),
  ('Sacred Heart University', 'Angelo Roncalli Hall'),
  ('Sacred Heart University', 'Toussaint Hall'),
  ('Sacred Heart University', 'Mother Teresa Hall'),
  ('Sacred Heart University', 'Catherine of Siena Hall & Michael McGivney Hall'),
  ('Sacred Heart University', 'Scholars Commons'),
  ('Sacred Heart University', 'Augustine Hall'),
  ('Sacred Heart University', 'Thomas Aquinas Hall'),
  ('Sacred Heart University', 'Teresa of Avila Hall'),
  ('Sacred Heart University', 'John Henry Newman Hall'),
  ('Sacred Heart University', 'Christian Witness Commons'),
  ('Sacred Heart University', 'Jean Donovan Hall'),
  ('Sacred Heart University', 'Oscar Romero Hall'),
  ('Sacred Heart University', 'Dorothy Day Hall'),
  ('Sacred Heart University', 'Elie Wiesel Hall & Pier Giorgio Frassati Hall'),
  ('Sacred Heart University', 'Frances Xavier Cabrini Hall'),
  ('Sacred Heart University', 'Thea Bowman Hall'),
  ('Sacred Heart University', 'Jorge Bergoglio Hall'),
  ('Sacred Heart University', 'Oakwood Gardens'),
  ('Sacred Heart University', 'The Ridge Townhouses & Apartments'),
  ('Sacred Heart University', 'Pioneer Gardens Apartments'),
  ('Sacred Heart University', 'Off-Campus Housing');

-- Towson University
INSERT INTO public.dorms (school, name) VALUES
  ('Towson University', 'Barton House'),
  ('Towson University', 'Douglass House'),
  ('Towson University', 'Harris Hall'),
  ('Towson University', 'Tubman House'),
  ('Towson University', 'Barnes Hall'),
  ('Towson University', 'Marshall Hall'),
  ('Towson University', 'Towson Run'),
  ('Towson University', 'Millennium Hall'),
  ('Towson University', 'Glen Complex'),
  ('Towson University', 'Tower A'),
  ('Towson University', 'Tower B'),
  ('Towson University', 'Tower C'),
  ('Towson University', 'Tower D'),
  ('Towson University', 'Newell Hall'),
  ('Towson University', 'Richmond Hall'),
  ('Towson University', 'Prettyman Hall'),
  ('Towson University', 'Scarborough Hall'),
  ('Towson University', 'Residence Tower'),
  ('Towson University', '10 West'),
  ('Towson University', 'Off-Campus Housing');

-- University of Notre Dame
INSERT INTO public.dorms (school, name) VALUES
  ('University of Notre Dame', 'Alumni Hall'),
  ('University of Notre Dame', 'Baumer Hall'),
  ('University of Notre Dame', 'Carroll Hall'),
  ('University of Notre Dame', 'Coyle Community in Zahm Hall'),
  ('University of Notre Dame', 'Dillon Hall'),
  ('University of Notre Dame', 'Duncan Hall'),
  ('University of Notre Dame', 'Dunne Hall'),
  ('University of Notre Dame', 'Graham Family Hall'),
  ('University of Notre Dame', 'Keenan Hall'),
  ('University of Notre Dame', 'Keough Hall'),
  ('University of Notre Dame', 'Knott Hall'),
  ('University of Notre Dame', 'Morrissey Hall'),
  ('University of Notre Dame', 'O''Neill Family Hall'),
  ('University of Notre Dame', 'Siegfried Hall'),
  ('University of Notre Dame', 'Sorin Hall'),
  ('University of Notre Dame', 'Stanford Hall'),
  ('University of Notre Dame', 'St. Edward''s Hall'),
  ('University of Notre Dame', 'Badin Hall'),
  ('University of Notre Dame', 'Breen-Phillips Hall'),
  ('University of Notre Dame', 'Cavanaugh Hall'),
  ('University of Notre Dame', 'Farley Hall'),
  ('University of Notre Dame', 'Flaherty Hall'),
  ('University of Notre Dame', 'Howard Hall'),
  ('University of Notre Dame', 'Johnson Family Hall'),
  ('University of Notre Dame', 'Lewis Hall'),
  ('University of Notre Dame', 'Lyons Hall'),
  ('University of Notre Dame', 'McGlinn Hall'),
  ('University of Notre Dame', 'Pasquerilla East Hall'),
  ('University of Notre Dame', 'Pasquerilla West Hall'),
  ('University of Notre Dame', 'Ryan Hall'),
  ('University of Notre Dame', 'Walsh Hall'),
  ('University of Notre Dame', 'Welsh Family Hall'),
  ('University of Notre Dame', 'Off-Campus Housing');

-- James Madison University
INSERT INTO public.dorms (school, name) VALUES
  ('James Madison University', 'Alger Hall'),
  ('James Madison University', 'Apartments on Grace'),
  ('James Madison University', 'Ashby Hall'),
  ('James Madison University', 'Bell Hall'),
  ('James Madison University', 'Chesapeake Hall'),
  ('James Madison University', 'Chappelear Hall'),
  ('James Madison University', 'Chandler Hall'),
  ('James Madison University', 'Cedar'),
  ('James Madison University', 'Converse Hall'),
  ('James Madison University', 'Dingledine Hall'),
  ('James Madison University', 'Dogwood'),
  ('James Madison University', 'Eagle Hall'),
  ('James Madison University', 'Frederikson Hall'),
  ('James Madison University', 'Garber Hall'),
  ('James Madison University', 'Gifford Hall'),
  ('James Madison University', 'Greek Row'),
  ('James Madison University', 'Hanson Hall'),
  ('James Madison University', 'Hillside Hall'),
  ('James Madison University', 'Hoffman Hall'),
  ('James Madison University', 'Huffman Hall'),
  ('James Madison University', 'Logan Hall'),
  ('James Madison University', 'Magnolia'),
  ('James Madison University', 'McGraw-Long Hall'),
  ('James Madison University', 'Oak'),
  ('James Madison University', 'Paul Jennings Hall'),
  ('James Madison University', 'Potomac Hall'),
  ('James Madison University', 'Shenandoah Hall'),
  ('James Madison University', 'Shorts Hall'),
  ('James Madison University', 'Spotswood Hall'),
  ('James Madison University', 'Wampler Hall'),
  ('James Madison University', 'Wayland Hall'),
  ('James Madison University', 'Weaver Hall'),
  ('James Madison University', 'White Hall'),
  ('James Madison University', 'Willow'),
  ('James Madison University', 'Off-Campus Housing');

-- Bridgewater State University
INSERT INTO public.dorms (school, name) VALUES
  ('Bridgewater State University', 'Miles Hall'),
  ('Bridgewater State University', 'DiNardo Hall'),
  ('Bridgewater State University', 'Crimson Hall'),
  ('Bridgewater State University', 'Stonehouse Hall'),
  ('Bridgewater State University', 'Weygand Hall'),
  ('Bridgewater State University', 'Scott Hall'),
  ('Bridgewater State University', 'Woodward Hall'),
  ('Bridgewater State University', 'Pope Hall'),
  ('Bridgewater State University', 'Shea Hall'),
  ('Bridgewater State University', 'Durgin Hall'),
  ('Bridgewater State University', 'Great Hill Student Apartments'),
  ('Bridgewater State University', 'Off-Campus Housing');

-- ============================================================
-- Verify: SELECT school, COUNT(*) FROM public.dorms GROUP BY school ORDER BY school;
-- ============================================================
