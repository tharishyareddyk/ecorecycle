export const WASTE_CATEGORIES = [
  { value: 'mobile_phones', label: 'Mobile Phones', icon: '📱', hazard: 'Contains lithium batteries, lead, cadmium', bulkThreshold: 10 },
  { value: 'laptops', label: 'Laptops / Notebooks', icon: '💻', hazard: 'Contains mercury, lead, brominated flame retardants', bulkThreshold: 5 },
  { value: 'computers', label: 'Desktop Computers', icon: '🖥️', hazard: 'Contains CRT lead, mercury switches', bulkThreshold: 5 },
  { value: 'televisions', label: 'Televisions', icon: '📺', hazard: 'CRTs contain lead, LCDs contain mercury', bulkThreshold: 3 },
  { value: 'refrigerators', label: 'Refrigerators', icon: '🧊', hazard: 'Contains CFC refrigerants harmful to ozone layer', bulkThreshold: 2 },
  { value: 'washing_machines', label: 'Washing Machines', icon: '🫧', hazard: 'Contains PCBs, heavy metals in circuit boards', bulkThreshold: 2 },
  { value: 'air_conditioners', label: 'Air Conditioners', icon: '❄️', hazard: 'Contains HFC refrigerants (greenhouse gases)', bulkThreshold: 2 },
  { value: 'batteries', label: 'Batteries', icon: '🔋', hazard: 'Highly toxic: lead-acid, cadmium, mercury', bulkThreshold: 20 },
  { value: 'printers', label: 'Printers / Scanners', icon: '🖨️', hazard: 'Contains toner dust, heavy metals', bulkThreshold: 5 },
  { value: 'tablets', label: 'Tablets', icon: '📲', hazard: 'Contains lithium, tantalum, cobalt', bulkThreshold: 10 },
  { value: 'cameras', label: 'Cameras / Camcorders', icon: '📷', hazard: 'Contains rare earth metals, lithium', bulkThreshold: 10 },
  { value: 'audio_equipment', label: 'Audio Equipment', icon: '🎧', hazard: 'Contains lead solder, PVC cables', bulkThreshold: 10 },
  { value: 'cables_accessories', label: 'Cables & Accessories', icon: '🔌', hazard: 'PVC insulation releases dioxins when burned', bulkThreshold: 20 },
  { value: 'other', label: 'Other E-Waste', icon: '⚡', hazard: 'May contain various hazardous materials', bulkThreshold: 5 },
];

export const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  collected: 'Collected',
  processing: 'Processing',
  recycled: 'Recycled',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  collected: 'badge-collected',
  processing: 'badge-processing',
  recycled: 'badge-recycled',
  cancelled: 'badge-cancelled',
};

export const getCategoryInfo = (value) =>
  WASTE_CATEGORIES.find((c) => c.value === value) || WASTE_CATEGORIES[WASTE_CATEGORIES.length - 1];

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
