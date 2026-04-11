import { formatDateTime } from '../utils/constants';

const STEPS = [
  { key: 'pending', label: 'Request Submitted', icon: '📝', desc: 'Your request has been submitted to the facility.' },
  { key: 'confirmed', label: 'Confirmed by Facility', icon: '✅', desc: 'The facility has accepted your request.' },
  { key: 'collected', label: 'E-Waste Collected', icon: '🚚', desc: 'Your e-waste has been collected / dropped off. Tracking ID generated.' },
  { key: 'processing', label: 'Being Processed', icon: '⚙️', desc: 'Your e-waste is being dismantled and sorted at the facility.' },
  { key: 'recycled', label: 'Recycled ♻️', icon: '🌱', desc: 'Your e-waste has been fully recycled. Thank you for going green!' },
];

const STATUS_ORDER = ['pending', 'confirmed', 'collected', 'processing', 'recycled'];

export default function TrackingTimeline({ status, timestamps = {} }) {
  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <div className="relative">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex && status !== 'cancelled';
        const active = i === currentIndex && status !== 'cancelled';
        const ts = {
          pending: timestamps.requestedAt,
          confirmed: timestamps.confirmedAt,
          collected: timestamps.collectedAt,
          processing: timestamps.processingStartedAt,
          recycled: timestamps.recycledAt,
        }[step.key];

        return (
          <div key={step.key} className="flex gap-4 mb-6 last:mb-0">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 flex-shrink-0
                ${done ? 'bg-primary-100 border-primary-500' : 'bg-gray-100 border-gray-200'}
                ${active ? 'ring-4 ring-primary-100' : ''}`}>
                {step.icon}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 mt-1 ${i < currentIndex ? 'bg-primary-400' : 'bg-gray-200'}`} style={{ minHeight: '2rem' }} />
              )}
            </div>
            {/* Content */}
            <div className="pb-4 flex-1">
              <div className={`font-semibold text-sm ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</div>
              <div className={`text-sm mt-0.5 ${done ? 'text-gray-600' : 'text-gray-400'}`}>{step.desc}</div>
              {ts && <div className="text-xs text-gray-400 mt-1">{formatDateTime(ts)}</div>}
            </div>
          </div>
        );
      })}
      {status === 'cancelled' && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700">
          ❌ This request was cancelled.
        </div>
      )}
    </div>
  );
}
