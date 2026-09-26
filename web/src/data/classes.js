// School structure — LKG to Class 12. Each stage gets the features that fit it:
// pre-primary uses a skill checklist and daily diary (no exams), primary uses grades,
// middle/secondary use marks, senior secondary adds streams, practicals and board work.

export const STAGES = {
  pre: { key: 'pre', label: 'Pre-primary', range: 'LKG – UKG', icon: 'palette', tone: 'rose', assessment: 'Skill checklist & daily diary — no exams', day: '08:00 – 12:05' },
  primary: { key: 'primary', label: 'Primary', range: 'Class 1 – 5', icon: 'book', tone: 'amber', assessment: 'Grades (A1–E) with light unit tests', day: '08:00 – 14:15' },
  middle: { key: 'middle', label: 'Middle', range: 'Class 6 – 8', icon: 'notebook', tone: 'blue', assessment: 'Marks + grades, 3rd language', day: '08:00 – 14:15' },
  secondary: { key: 'secondary', label: 'Secondary', range: 'Class 9 – 10', icon: 'award', tone: 'violet', assessment: 'Board pattern, pre-boards, board registration', day: '08:00 – 14:15' },
  senior: { key: 'senior', label: 'Senior Secondary', range: 'Class 11 – 12', icon: 'cap', tone: 'navy', assessment: 'Streams, theory + practical, board exams', day: '08:00 – 14:15' },
};

export const STREAMS = { Sci: 'Science', Com: 'Commerce', Hum: 'Humanities' };

export const SUBJECTS = [
  { code: 'ENG', name: 'English' }, { code: 'HIN', name: 'Hindi' }, { code: 'MAT', name: 'Mathematics' },
  { code: 'EVS', name: 'Environmental Studies' }, { code: 'SCI', name: 'Science' }, { code: 'SST', name: 'Social Science' },
  { code: 'SAN', name: 'Sanskrit' }, { code: 'CS', name: 'Computer Science' }, { code: 'ART', name: 'Art & Craft' },
  { code: 'MUS', name: 'Music & Rhymes' }, { code: 'PE', name: 'Physical Education' },
  { code: 'PHY', name: 'Physics' }, { code: 'CHE', name: 'Chemistry' }, { code: 'BIO', name: 'Biology' },
  { code: 'ACC', name: 'Accountancy' }, { code: 'BST', name: 'Business Studies' }, { code: 'ECO', name: 'Economics' },
  { code: 'HIS', name: 'History' }, { code: 'POL', name: 'Political Science' }, { code: 'GEO', name: 'Geography' },
];

export const stageOfGrade = (g) => (g <= 0 ? 'pre' : g <= 5 ? 'primary' : g <= 8 ? 'middle' : g <= 10 ? 'secondary' : 'senior');
export const gradeLabel = (g) => (g === -1 ? 'LKG' : g === 0 ? 'UKG' : String(g));

/** Subject codes taught in a section. */
export function subjectCodesFor(sec) {
  const st = sec.stage || stageOfGrade(sec.grade);
  if (st === 'pre') return ['ENG', 'HIN', 'MAT', 'EVS', 'ART', 'MUS', 'PE'];
  if (st === 'primary') return ['ENG', 'HIN', 'MAT', 'EVS', 'CS', 'ART', 'PE'];
  if (st === 'middle') return ['ENG', 'HIN', 'MAT', 'SCI', 'SST', 'SAN', 'CS', 'PE'];
  if (st === 'secondary') return ['ENG', 'HIN', 'MAT', 'SCI', 'SST', 'CS', 'PE'];
  if (sec.section === 'Sci') return ['ENG', 'PHY', 'CHE', 'MAT', 'BIO', 'CS', 'PE'];
  if (sec.section === 'Com') return ['ENG', 'ACC', 'BST', 'ECO', 'MAT', 'PE'];
  return ['ENG', 'HIS', 'POL', 'GEO', 'ECO', 'PE'];
}
/** Subjects that carry marks in exams (no marks for activity subjects). */
export const examCodesFor = (sec) => ((sec.stage || stageOfGrade(sec.grade)) === 'pre' ? [] : subjectCodesFor(sec).filter((c) => !['PE', 'ART', 'MUS'].includes(c)));
export const PRACTICAL = ['PHY', 'CHE', 'BIO', 'CS'];

/** Every class from LKG to 12 with its sections. */
export const CLASS_LIST = [
  { grade: -1, sections: ['A', 'B'] }, { grade: 0, sections: ['A', 'B'] },
  ...Array.from({ length: 10 }, (_, i) => ({ grade: i + 1, sections: ['A', 'B'] })),
  { grade: 11, sections: ['Sci', 'Com', 'Hum'] }, { grade: 12, sections: ['Sci', 'Com', 'Hum'] },
];
export const sectionName = (g, s) => (g <= 0 ? `${gradeLabel(g)}-${s}` : g >= 11 ? `${g} ${s}` : `${g}${s}`);

/** Quarterly tuition by class (₹). */
export function tuitionFor(sec) {
  const st = sec.stage || stageOfGrade(sec.grade);
  if (st === 'pre') return 11000;
  if (st === 'primary') return 12500;
  if (sec.grade <= 7) return 14500;
  if (sec.grade === 8) return 15800;
  if (st === 'secondary') return 17200;
  return sec.section === 'Sci' ? 21000 : sec.section === 'Com' ? 19000 : 18000;
}

/* ───── Teaching load: subject scheme, teacher categories ───── */
/** Periods per week in each section (Mon–Fri + half Saturday). */
export const slotsPerWeek = (sec) => ((sec.stage || stageOfGrade(sec.grade)) === 'pre' ? 28 : 39);
/** Scheme key: stage, or stage + stream for senior secondary. */
export const schemeKey = (sec) => { const st = sec.stage || stageOfGrade(sec.grade); return st === 'senior' ? `senior-${sec.section}` : st; };
export const SCHEME_LABELS = { pre: 'Pre-primary (LKG–UKG)', primary: 'Primary (1–5)', middle: 'Middle (6–8)', secondary: 'Secondary (9–10)', 'senior-Sci': 'Class 11–12 Science', 'senior-Com': 'Class 11–12 Commerce', 'senior-Hum': 'Class 11–12 Humanities' };
/** Default periods/week per subject — schools can change it in Teacher Allocation → Subject scheme. */
export const DEFAULT_SCHEME = {
  pre: { ENG: 6, HIN: 5, MAT: 5, EVS: 4, ART: 3, MUS: 3, PE: 2 },
  primary: { ENG: 8, HIN: 7, MAT: 8, EVS: 6, CS: 3, ART: 3, PE: 4 },
  middle: { ENG: 6, HIN: 5, MAT: 7, SCI: 7, SST: 6, SAN: 3, CS: 2, PE: 3 },
  secondary: { ENG: 6, HIN: 5, MAT: 8, SCI: 8, SST: 6, CS: 3, PE: 3 },
  'senior-Sci': { ENG: 5, PHY: 7, CHE: 7, MAT: 7, BIO: 6, CS: 4, PE: 3 },
  'senior-Com': { ENG: 5, ACC: 8, BST: 8, ECO: 7, MAT: 7, PE: 4 },
  'senior-Hum': { ENG: 6, HIS: 8, POL: 8, GEO: 7, ECO: 6, PE: 4 },
};
/** Teacher categories: which stages they normally teach and a default weekly load. */
export const CATEGORIES = {
  NTT: { label: 'Nursery Teacher', stages: ['pre'], max: 30 },
  PRT: { label: 'Primary Teacher', stages: ['pre', 'primary'], max: 34 },
  TGT: { label: 'Trained Graduate Teacher', stages: ['primary', 'middle', 'secondary'], max: 34 },
  PGT: { label: 'Post Graduate Teacher', stages: ['secondary', 'senior'], max: 32 },
};
/** Specialist subjects can be taught across stages by any category. */
export const SPECIALIST = ['PE', 'ART', 'MUS', 'CS'];
/** The stage each category is mainly hired for (used to prefer the right teacher). */
export const HOME_STAGES = { NTT: ['pre'], PRT: ['primary'], TGT: ['middle', 'secondary'], PGT: ['senior'] };
