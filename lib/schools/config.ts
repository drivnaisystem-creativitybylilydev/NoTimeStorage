/**
 * Single source of truth for supported schools and their residence halls.
 * Import from here anywhere school/dorm data is needed.
 *
 * Adding a new school:
 * 1. Add an entry below with name, shortName, dorms[], and optional location + logoSlug.
 * 2. Add logo image to public/brand/school-logos/{logoSlug}.png (e.g. Dayton.png).
 * 3. Booking schedule, signup, admin bookings, and calendar all read from this config.
 */

export type School = {
  name: string;
  shortName: string;
  dorms: string[];
  /** Optional: used for logo path /brand/school-logos/{logoSlug}.png. Defaults to shortName. */
  logoSlug?: string;
  /** Optional: shown on homepage under school name (e.g. "Easton, MA"). */
  location?: string;
};

export const SCHOOLS: School[] = [
  {
    name: 'Stonehill College',
    shortName: 'Stonehill',
    location: 'Easton, MA',
    logoSlug: 'Stonehill',
    dorms: [
      'Bogan Hall',
      'Boland Hall',
      'Commonwealth Courts',
      'Corr Hall',
      'Holy Cross Center',
      'Notre Dame du Lac Hall',
      "O'Hara Hall",
      "O'Hara Village",
      'Pilgrim Heights',
      'Pilgrim Heights Village — Colonial Courts',
      'Villa Theresa Hall',
      'Off-Campus Housing',
    ],
  },
  {
    name: 'University of New Haven',
    shortName: 'UNH',
    location: 'West Haven, CT',
    logoSlug: 'UNH',
    dorms: [
      'Bergami Hall',
      'Bethel Hall',
      'Bixler Hall',
      'Gerber Hall',
      'Westside Hall',
      'Celentano Hall',
      'Dunham Hall',
      'Sheffield Hall',
      'Winchester Hall',
      'The Atwood',
      'Campbell Houses',
      'Forest Hills Apartments',
      'Park View',
      'Ricardo Street House',
      'Ruden Street Apartments',
      'Off-Campus Housing',
    ],
  },
  // New schools — paste dorm lists when ready; replace placeholder with real dorms
  {
    name: 'University of Dayton',
    shortName: 'Dayton',
    location: 'Dayton, OH',
    logoSlug: 'Dayton',
    dorms: [
      'Marianist Hall',
      'Marycrest Complex',
      'Stuart Complex',
      'Virginia W. Kettering Hall',
      'Garden Apartments',
      'Campus South Apartments',
      'Student Neighborhood',
      'Caldwell Apartments',
      'ArtStreet Apartments',
      'Plumwood Apartments',
      'University Place',
      '819 Irving Avenue Apartments',
      'Adele Center Apartments',
      'Lawnview Apartments',
      'East Stewart Garden Apartments - North',
      'North Neighborhood',
      'South Neighborhood',
      'College Park Neighborhood',
      'South Student Neighborhood',
      'Sorority Houses',
    ],
  },
  {
    name: 'University of Massachusetts',
    shortName: 'UMass',
    location: 'Massachusetts',
    logoSlug: 'UMass-Amherst',
    dorms: [
      'Baker Hall (Central)',
      'Birch Hall (Commonwealth Honors College)',
      'Brett Hall (Central)',
      'Brooks Hall (Central)',
      'Brown Hall (Sylvan)',
      'Butterfield Hall (Central)',
      'Cance Hall (Southwest)',
      'Cashin Hall (Sylvan)',
      'Chadbourne Hall (Central)',
      'Coolidge Hall (Southwest)',
      'Crabtree Hall (Northeast)',
      'Crampton Hall (Southwest)',
      'Dickinson House (Orchard Hill)',
      'Dwight Hall (Northeast)',
      'Elm Hall (Commonwealth Honors College)',
      'Emerson Hall (Southwest)',
      'Field Hall (Orchard Hill)',
      'Gorman Hall (Central)',
      'Grayson Hall (Orchard Hill)',
      'Greenough Hall (Central)',
      'Hamlin Hall (Northeast)',
      'James Hall (Southwest)',
      'John Adams Hall (Southwest)',
      'John Quincy Adams Hall (Southwest)',
      'Johnson Hall (Northeast)',
      'Kennedy Hall (Southwest)',
      'Knowlton Hall (Northeast)',
      'Leach Hall (Northeast)',
      'Lewis Hall (Northeast)',
      'Linden Hall (Commonwealth Honors College)',
      'MacKimmie Hall (Southwest)',
      'Maple Hall (Commonwealth Honors College)',
      'Mary Lyon Hall (Northeast)',
      'McNamara Hall (Sylvan)',
      'Melville Hall (Southwest)',
      'Moore Hall (Southwest)',
      'North Apartment A (North)',
      'North Apartment B (North)',
      'North Apartment C (North)',
      'North Apartment D (North)',
      'Oak Hall (Commonwealth Honors College)',
      'Patterson Hall (Southwest)',
      'Pierpont Hall (Southwest)',
      'Prince Hall (Southwest)',
      'Sycamore Hall (Commonwealth Honors College)',
      'Thatcher Hall (Northeast)',
      'Thoreau Hall (Southwest)',
      'Van Meter Hall (Central)',
      'Washington Hall (Southwest)',
      'Webster Hall (Orchard Hill)',
      'Wheeler Hall (Central)',
    ],
  },
  {
    name: 'Brevard College',
    shortName: 'Brevard',
    location: 'Brevard, NC',
    logoSlug: 'Brevard',
    dorms: [
      'Beam Residence Hall',
      'Jones Hall',
      'Stanback Hall',
      'The Villages',
      'North Village',
      'Center Village',
      'South Village',
    ],
  },
  {
    name: 'Gordon College',
    shortName: 'Gordon',
    location: 'Wenham, MA',
    logoSlug: 'Gordon',
    dorms: [
      'Nyland Hall',
      'Fulton Hall',
      'Tavilla Hall',
      'Chase Hall',
      'Wilson Hall',
      'Evans Hall',
      'Ferrin Hall',
      'Bromley Hall',
      'Grace Hall',
      'Hilton Hall',
      'MacInnis Hall',
      'Conrad Hall',
      'Rider Hall',
      'Shields House',
    ],
  },
  {
    name: 'Central Connecticut State University',
    shortName: 'CCSU',
    location: 'New Britain, CT',
    logoSlug: 'CCSU',
    dorms: [
      'Mildred Barrows Hall',
      'Catharine Beecher Hall',
      'F. Don James Hall',
      'Seth North Hall',
      'Thomas Gallaudet Hall',
      'Mid-Campus Hall',
      'Robert Sheridan Hall',
      'Robert Vance Hall',
      'Sam May Hall',
      'Carroll Hall',
    ],
  },
];

/** Map of school name → dorm list for quick lookup */
export const SCHOOL_DORMS: Record<string, string[]> = Object.fromEntries(
  SCHOOLS.map((s) => [s.name, s.dorms])
);

/** Just the school names for dropdowns */
export const SCHOOL_NAMES: string[] = SCHOOLS.map((s) => s.name);

/** Get dorms for a given school name */
export function getDormsForSchool(schoolName: string): string[] {
  return SCHOOL_DORMS[schoolName] ?? [];
}
