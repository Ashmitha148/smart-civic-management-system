import { PRIORITY_STYLES } from '../../constants/civicConstants';

const PriorityBadge = ({ priority }) => {
  const style = PRIORITY_STYLES[priority] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${style}`}
    >
      {priority}
    </span>
  );
};

export default PriorityBadge;
