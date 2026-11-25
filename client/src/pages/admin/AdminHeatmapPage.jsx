import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import api from '../../api/axios';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
} from '../../constants/civicConstants';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';

const HeatLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return undefined;

    const heatPoints = points.map((p) => [p.lat, p.lng, p.intensity || 0.6]);
    const layer = L.heatLayer(heatPoints, {
      radius: 28,
      blur: 18,
      maxZoom: 17,
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
};

const AdminHeatmapPage = () => {
  const [points, setPoints] = useState([]);
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchHeatmap = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (priority !== 'All') params.priority = priority;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await api.get('/admin/heatmap', { params });
      setPoints(data.points || []);
    } catch {
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [category, priority, startDate, endDate]);

  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  const center = points.length ? [points[0].lat, points[0].lng] : [28.6139, 77.209];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-civic-600">
          Geospatial Intelligence
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-civic-900 mt-1">
          Complaint Concentration Heatmap
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Identify high-density civic issue hotspots and inspect individual geo-tagged
          reports.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
        >
          <option value="All">All Categories</option>
          {COMPLAINT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
        >
          <option value="All">All Priorities</option>
          {COMPLAINT_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-600">
          <span>
            Showing <strong>{points.length}</strong> geo-located complaint(s)
          </span>
          {loading && <span>Refreshing map...</span>}
        </div>

        <div className="h-[520px] w-full rounded-xl overflow-hidden border border-slate-300">
          <MapContainer center={center} zoom={13} className="w-full h-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <HeatLayer points={points} />
            {points.map((pt) => (
              <CircleMarker
                key={pt._id}
                center={[pt.lat, pt.lng]}
                radius={7}
                pathOptions={{
                  color: '#0F2942',
                  fillColor:
                    pt.priority === 'Emergency' || pt.priority === 'Critical'
                      ? '#dc2626'
                      : '#2563eb',
                  fillOpacity: 0.85,
                }}
              >
                <Popup>
                  <div className="space-y-1.5 min-w-[200px]">
                    <p className="font-mono text-xs font-bold text-civic-800">
                      {pt.complaintId}
                    </p>
                    <p className="font-semibold text-slate-900 text-sm">{pt.title}</p>
                    <p className="text-xs text-slate-600">{pt.address}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={pt.status} />
                      <PriorityBadge priority={pt.priority} />
                    </div>
                    <Link
                      to={`/admin/complaints/${pt._id}`}
                      className="inline-block text-xs font-semibold text-civic-700 underline pt-1"
                    >
                      Open Complaint &rarr;
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminHeatmapPage;
