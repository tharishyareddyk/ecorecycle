import { STATUS_LABELS, STATUS_COLORS } from '../utils/constants';

export default function StatusBadge({ status }) {
  return (
    <span className={STATUS_COLORS[status] || 'badge-pending'}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
