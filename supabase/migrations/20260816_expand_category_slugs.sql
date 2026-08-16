-- Expand category_slug check constraint with 18 subcategories (was 6)
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_category_slug_check;

ALTER TABLE services ADD CONSTRAINT services_category_slug_check CHECK (
  category_slug IS NULL
  OR category_slug IN (
    -- Musik & Ljud
    'dj', 'sangare', 'band', 'musiker',
    -- Foto & Film
    'fotograf', 'videograf', 'fotobox',
    -- Skönhet & Stil
    'makeup', 'harstylist',
    -- Mat & Dryck
    'privatkock', 'catering', 'bartender',
    -- Underhållning & Show
    'magiker', 'komiker', 'barnunderhallning',
    'dansare', 'mc', 'cirkus'
  )
);
