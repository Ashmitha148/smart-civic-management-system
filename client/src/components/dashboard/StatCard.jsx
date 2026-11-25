const StatCard = ({ title, value, icon: Icon, accentClass }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </p>
        <p className="text-3xl font-extrabold text-civic-900 mt-1.5">{value}</p>
      </div>
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${accentClass}`}
      >
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export default StatCard;
