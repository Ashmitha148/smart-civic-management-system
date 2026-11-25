import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Compass className="w-12 h-12 text-civic-700 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-civic-900">404 - Page Not Found</h1>
        <p className="text-sm text-slate-600 mt-2">
          The municipal service page you requested does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-civic-800 text-white text-sm font-semibold hover:bg-civic-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
