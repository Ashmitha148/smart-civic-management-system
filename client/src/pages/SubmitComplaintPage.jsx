import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  Crosshair,
  FilePlus2,
  MapPin,
  Trash2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import api from '../api/axios';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
} from '../constants/civicConstants';
import LocationPickerMap from '../components/complaint/LocationPickerMap';

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const SubmitComplaintPage = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: COMPLAINT_CATEGORIES.includes(initialCategory)
      ? initialCategory
      : COMPLAINT_CATEGORIES[0],
    priority: 'Medium',
    address: '',
    landmark: '',
    latitude: null,
    longitude: null,
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdComplaint, setCreatedComplaint] = useState(null);
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);

  useEffect(() => {
    const canCheck =
      formData.title.trim().length >= 5 && formData.description.trim().length >= 10;
    if (!canCheck) {
      setDuplicateWarnings([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.post('/complaints/check-duplicates', {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          latitude: formData.latitude,
          longitude: formData.longitude,
        });
        setDuplicateWarnings(data.duplicates || []);
      } catch {
        // Non-blocking check
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    formData.title,
    formData.description,
    formData.category,
    formData.latitude,
    formData.longitude,
  ]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMapSelect = ({ lat, lng }) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        }));
        setGeoLoading(false);
      },
      () => {
        setError(
          'Unable to retrieve your current location. Please click on the map to pin the location.'
        );
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileSelect = (e) => {
    setError('');
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (selectedFiles.length + files.length > MAX_FILES) {
      setError(`You can upload a maximum of ${MAX_FILES} images per complaint.`);
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported format. Use JPEG, PNG, or WEBP.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB} MB size limit.`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.title.trim().length < 5) {
      setError('Complaint title must be at least 5 characters.');
      return;
    }
    if (formData.description.trim().length < 15) {
      setError('Please provide a detailed description (at least 15 characters).');
      return;
    }
    if (!formData.address.trim()) {
      setError('Location / street address is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('description', formData.description.trim());
      payload.append('category', formData.category);
      payload.append('priority', formData.priority);
      payload.append('address', formData.address.trim());
      if (formData.landmark.trim()) {
        payload.append('landmark', formData.landmark.trim());
      }
      if (formData.latitude !== null && formData.longitude !== null) {
        payload.append('latitude', String(formData.latitude));
        payload.append('longitude', String(formData.longitude));
      }

      selectedFiles.forEach((file) => {
        payload.append('images', file);
      });

      const { data } = await api.post('/complaints', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setCreatedComplaint(data.complaint);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to submit complaint. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (createdComplaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-civic-900">
            Complaint Submitted Successfully
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Your civic issue has been registered and assigned a unique tracking ID.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 inline-block">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tracking Reference ID
            </p>
            <p className="text-2xl font-mono font-extrabold text-civic-800 mt-1">
              {createdComplaint.complaintId}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={`/complaints/${createdComplaint._id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-civic-800 hover:bg-civic-700 text-white text-sm font-semibold"
            >
              Track Complaint Details
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-civic-600">
          Citizen Issue Reporting
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-civic-900 mt-1">
          Report a Civic Issue
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Provide accurate details, pin the exact location on the map, and attach photos
          to help municipal teams resolve the problem faster.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {duplicateWarnings.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Potential Duplicate Complaint Detected</span>
          </div>
          <p className="text-xs text-amber-800">
            Similar complaints already exist in this category. You may still submit if
            this is a separate issue:
          </p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            {duplicateWarnings.map((dup) => (
              <li key={dup._id}>
                <span className="font-mono font-bold">{dup.complaintId}</span> —{' '}
                {dup.title} ({dup.status}
                {dup.distanceMeters !== null ? `, ${dup.distanceMeters}m away` : ''})
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
      >
        {/* Issue Details */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-civic-900 border-b border-slate-100 pb-2">
            1. Issue Details
          </h2>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Complaint Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Large pothole near Main Street intersection"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-civic-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-civic-600"
              >
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Urgency / Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-civic-600"
              >
                {COMPLAINT_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the severity, how long the issue has persisted, and any safety hazards..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-civic-600"
            />
          </div>
        </div>

        {/* Location & Map */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <h2 className="text-base font-bold text-civic-900">
              2. Location &amp; Map Coordinates
            </h2>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={geoLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-civic-50 hover:bg-civic-100 text-civic-800 text-xs font-semibold border border-civic-200 self-start"
            >
              <Crosshair className="w-3.5 h-3.5" />
              {geoLoading ? 'Detecting GPS...' : 'Use My Current Location'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Location / Street Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g., 45 Oakwood Avenue, Ward 7"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-civic-600"
              />
            </div>

            <div>
              <label
                htmlFor="landmark"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nearby Landmark <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="landmark"
                name="landmark"
                type="text"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="e.g., Opposite Central Public Library"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-civic-600"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-civic-700" />
              Click anywhere on the map to pin the exact issue coordinates.
              {formData.latitude !== null && formData.longitude !== null && (
                <span className="font-mono font-semibold text-emerald-700 ml-1">
                  Selected: {formData.latitude}, {formData.longitude}
                </span>
              )}
            </p>
            <LocationPickerMap
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={handleMapSelect}
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-civic-900 border-b border-slate-100 pb-2">
            3. Photographic Evidence
          </h2>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-civic-500 rounded-xl p-6 cursor-pointer bg-slate-50 hover:bg-civic-50/40 transition-colors">
            <Camera className="w-8 h-8 text-civic-700 mb-2" />
            <span className="text-sm font-semibold text-slate-700">
              Click to upload complaint photos
            </span>
            <span className="text-xs text-slate-500 mt-1">
              JPEG, PNG, or WEBP &bull; Up to {MAX_FILES} images (max {MAX_FILE_SIZE_MB}{' '}
              MB each)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {previews.map((src, idx) => (
                <div
                  key={src}
                  className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100"
                >
                  <img
                    src={src}
                    alt={`Complaint preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    aria-label="Remove selected image"
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Link
            to="/dashboard"
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-civic-800 hover:bg-civic-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <FilePlus2 className="w-4 h-4" />
            {submitting ? 'Submitting Complaint...' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitComplaintPage;
