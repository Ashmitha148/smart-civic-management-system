import { STATUS_STYLES } from '../../constants/civicConstants';

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
