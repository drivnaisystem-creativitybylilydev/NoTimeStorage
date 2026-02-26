/**
 * Single source of truth for supported schools and their residence halls.
 * Import from here anywhere school/dorm data is needed.
 */

export type School = {
  name: string;
  shortName: string;
  dorms: string[];
};

export const SCHOOLS: School[] = [
  {
    name: 'Stonehill College',
    shortName: 'Stonehill',
    dorms: [
      'Boland Hall',
      'Corning Hall',
      'Cushing-Martin Hall',
      'Duffy Hall',
      'Gate House',
      'Holy Cross Hall',
      'Joseph Martin Institute',
      'New Hall',
      "O'Hara Hall",
      'Pilgrim Heights',
      'Southeast & Southwest Quadrangles',
      'Stucker House',
      'The Knoll',
      'Townhouses',
      'Off-Campus Housing',
    ],
  },
  {
    name: 'University of New Haven',
    shortName: 'UNH',
    dorms: [
      // First-year
      'Bergami Hall',
      'Bethel Hall',
      'Bixler Hall',
      'Gerber Hall',
      'Westside Hall',
      // Upperclassman
      'Celentano Hall',
      'Dunham Hall',
      'Sheffield Hall',
      'Winchester Hall',
      // Apartments / off-campus style
      'The Atwood',
      'Campbell Houses',
      'Forest Hills Apartments',
      'Park View',
      'Ricardo Street House',
      'Ruden Street Apartments',
      'Off-Campus Housing',
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
