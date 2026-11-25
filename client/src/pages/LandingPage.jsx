import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Construction,
  Droplets,
  FilePlus2,
  Lightbulb,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trash2,
  Waves,
  Zap,
  AlertCircle,
  Clock,
  Camera,
  Bell,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ISSUE_CATEGORIES = [
  {
    name: 'Road Damage',
    description: 'Potholes, cracked pavements, damaged speed breakers, and road cave-ins.',
    icon: Construction,
  },
  {
    name: 'Garbage Collection',
    description: 'Missed waste pickups, overflowing public bins, and illegal dumping.',
    icon: Trash2,
  },
  {
    name: 'Water Leakage',
    description: 'Burst supply pipes, leaking valves, and contaminated water lines.',
    icon: Droplets,
  },
  {
    name: 'Drainage Problems',
    description: 'Blocked storm drains, sewage overflow, and waterlogging on streets.',
    icon: Waves,
  },
  {
    name: 'Streetlight Issues',
    description: 'Non-functional street lamps, flickering poles, and dark intersections.',
    icon: Lightbulb,
  },
  {
    name: 'Electricity Issues',
    description: 'Exposed municipal wiring, damaged junction boxes, and pole hazards.',
    icon: Zap,
  },
  {
    name: 'Sanitation',
    description: 'Public restroom upkeep, street sweeping, and civic hygiene concerns.',
    icon: Sparkles,
  },
  {
    name: 'Other',
    description: 'Any other municipal infrastructure or public utility issue.',
    icon: AlertCircle,
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Report with Location & Photos',
    description:
      'Describe the civic issue, pin the exact coordinates on the interactive city map, and attach photographic evidence.',
    icon: FilePlus2,
  },
  {
    step: '02',
    title: 'Verification & Assignment',
    description:
      'Your complaint receives a unique tracking ID and is routed to the relevant municipal department for inspection.',
    icon: ClipboardCheck,
  },
  {
    step: '03',
    title: 'Track Until Resolution',
    description:
      'Follow every status update on a transparent timeline until field teams resolve the issue and close the ticket.',
    icon: CheckCircle2,
  },
];

const PLATFORM_FEATURES = [
  {
    title: 'Interactive Map Pinning',
    description:
      'Select exact street-level coordinates using OpenStreetMap and Leaflet so field crews locate issues without delay.',
    icon: MapPin,
  },
  {
    title: 'Multi-Photo Evidence',
    description:
      'Upload up to 5 verified images per complaint with instant previews and secure cloud storage.',
    icon: Camera,
  },
  {
    title: 'Transparent Status Timeline',
    description:
      'Every stage from Submitted to Closed is logged with timestamps and official remarks.',
    icon: Clock,
  },
  {
    title: 'Real-Time Citizen Alerts',
    description:
      'Receive immediate dashboard notifications whenever your complaint is registered or updated.',
    icon: Bell,
  },
];

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPublicStats = async () => {
      try {
        const { data } = await api.get('/public/stats');
        if (isMounted && data?.stats) {
          setStats(data.stats);
        }
      } catch {
        // Keep null if backend is unreachable
      } finally {
        if (isMounted) setStatsLoading(false);
      }
    };

    fetchPublicStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-civic-900 via-civic-800 to-civic-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wide uppercase text-emerald-300 mb-6">
              <ShieldCheck className="w-4 h-4" />
              Municipal Digital Governance Initiative
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Building Better Cities Together
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-slate-200 leading-relaxed max-w-2xl">
              Report road damage, water leaks, sanitation concerns, and public utility
              issues directly to your municipal administration. Track every step from
              submission to verified resolution.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={isAuthenticated ? '/complaints/new' : '/register'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-950/25 transition-all"
              >
                Report an Issue
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold transition-all"
              >
                {isAuthenticated ? 'Go to Citizen Dashboard' : 'Citizen Sign In'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Live Municipal Service Metrics
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Database Feed
            </span>
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-16 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-3xl font-extrabold text-civic-900">
                  {stats.totalComplaints}
                </p>
                <p className="text-sm font-medium text-slate-600 mt-1">
                  Total Complaints Filed
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-3xl font-extrabold text-emerald-600">
                  {stats.resolvedComplaints}
                </p>
                <p className="text-sm font-medium text-slate-600 mt-1">
                  Issues Resolved
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-3xl font-extrabold text-amber-600">
                  {stats.activeComplaints}
                </p>
                <p className="text-sm font-medium text-slate-600 mt-1">
                  Active / In Review
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-3xl font-extrabold text-civic-700">
                  {stats.registeredCitizens}
                </p>
                <p className="text-sm font-medium text-slate-600 mt-1">
                  Registered Citizens
                </p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-2">
              Live civic statistics will appear here once connected to the municipal
              database server.
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-civic-600">
            Simple &amp; Accountable Process
          </span>
          <h2 className="mt-2 text-3xl font-bold text-civic-900">How SCMS Works</h2>
          <p className="mt-3 text-slate-600">
            A structured three-step workflow designed for speed, transparency, and
            verifiable public service delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-civic-100 text-civic-800 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-extrabold text-slate-200">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-civic-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Civic Issue Categories */}
      <section className="bg-white border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-civic-600">
                Public Service Categories
              </span>
              <h2 className="mt-2 text-3xl font-bold text-civic-900">
                Civic Issues You Can Report
              </h2>
            </div>
            <Link
              to={isAuthenticated ? '/complaints/new' : '/register'}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-civic-700 hover:text-civic-900"
            >
              Submit a Complaint
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ISSUE_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.name}
                  to={
                    isAuthenticated
                      ? `/complaints/new?category=${encodeURIComponent(category.name)}`
                      : '/register'
                  }
                  className="group p-5 rounded-xl bg-slate-50 hover:bg-civic-50 border border-slate-200 hover:border-civic-300 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-civic-800 flex items-center justify-center mb-4 group-hover:bg-civic-800 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-civic-800">
                    {category.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {category.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <span className="text-xs font-bold uppercase tracking-widest text-civic-600">
              Built for Civic Trust
            </span>
            <h2 className="mt-2 text-3xl font-bold text-civic-900">
              Modern Infrastructure for Responsive Cities
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              SCMS replaces fragmented phone helplines and paper forms with a unified,
              verifiable digital record that empowers citizens and equips municipal
              departments for Phase 2 field operations.
            </p>
            <div className="mt-7">
              <Link
                to={isAuthenticated ? '/complaints/new' : '/register'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-civic-800 hover:bg-civic-700 text-white font-semibold text-sm transition-colors"
              >
                Get Started as a Citizen
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {PLATFORM_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
