export const WORK_MODES = ['Remote', 'Hybrid', 'In-person'];

export const RESULT_OPTIONS = [
  'Not yet applied',
  'Waiting to hear back',
  'Interviewing',
  'Next Round',
  'Offer',
  'Rejected',
];

// Results treated as "going well" (green rows / top section) and as a dead end
// (red rows / bottom section) on the Applications tab.
export const PROGRESS_RESULTS = ['Interviewing', 'Next Round', 'Offer'];
export const REJECTED_RESULT = 'Rejected';

export const EMPTY_FORM = {
  date_applied: new Date().toISOString().slice(0, 10),
  company: '',
  job_title: '',
  location: '',
  work_mode: '',
  salary_range: '',
  job_link: '',
  notes: '',
};
