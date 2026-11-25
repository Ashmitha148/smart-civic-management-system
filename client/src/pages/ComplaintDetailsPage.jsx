import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  MessageSquareText,
  UserCheck,
  Image as ImageIcon,
  X,
  AlertCircle,
  Star,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import api from '../api/axios';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import StatusTimeline from '../components/complaint/StatusTimeline';
import LocationPickerMap from '../components/complaint/LocationPickerMap';

const ComplaintDetailsPage = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [sla, setSla] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/complaints/${id}`);
      setComplaint(data.complaint);
      setStatusHistory(data.statusHistory || []);
      setFeedback(data.feedback || null);
      setSla(data.sla || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    setError('');
    setActionMsg('');
    try {
      const { data } = await api.post(`/complaints/${complaint._id}/feedback`, {
        rating,
        comment,
      });
      setFeedback(data.feedback);
      setActionMsg('Thank you! Your feedback has been recorded.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReopen = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    setError('');
    setActionMsg('');
    try {
      await api.post(`/complaints/${complaint._id}/reopen`, {
        reason: reopenReason,
      });
      setReopenReason('');
      setActionMsg('Complaint reopened and officials have been notified.');
      await fetchDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reopen complaint.');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-slate-200 rounded-lg" />
          <div className="h-44 bg-slate-200 rounded-2xl" />
          <div className="h-72 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-14">
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">
            {error || 'Complaint not found'}
          </h2>
          <Link
            to="/complaints"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-civic-800 text-white text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Complaints
          </Link>
        </div>
      </div>
    );
  }

  const hasCoordinates =
    typeof complaint.location?.latitude === 'number' &&
    typeof complaint.location?.longitude === 'number';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/complaints"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-civic-700 hover:text-civic-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Complaints
      </Link>

      {/* Header Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <span className="text-sm font-mono font-bold text-civic-800 bg-civic-50 px-3 py-1 rounded-lg border border-civic-200">
            {complaint.complaintId}
          </span>
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
            {complaint.category}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-civic-900">
          {complaint.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            Submitted: {new Date(complaint.createdAt).toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            {complaint.location?.address}
          </span>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
            Detailed Description
          </h2>
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">
            {complaint.description}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Photos & Location */}
        <div className="lg:col-span-7 space-y-6">
          {/* Uploaded Photographs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-civic-900 flex items-center gap-2 mb-4">
              <ImageIcon className="w-4 h-4 text-civic-700" />
              Uploaded Photographs ({complaint.images?.length || 0})
            </h2>

            {complaint.images && complaint.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {complaint.images.map((img, idx) => (
                  <button
                    key={img.url + idx}
                    type="button"
                    onClick={() => setLightboxImage(img.url)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-600"
                  >
                    <img
                      src={img.url}
                      alt={img.originalName || `Evidence ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No photographs were attached to this complaint.
              </p>
            )}
          </div>

          {/* Reported Location */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-civic-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-civic-700" />
              Reported Location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase">Address</p>
                <p className="font-medium text-slate-900 mt-1">
                  {complaint.location?.address}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase">Landmark</p>
                <p className="font-medium text-slate-900 mt-1">
                  {complaint.location?.landmark || 'Not specified'}
                </p>
              </div>
            </div>

            {hasCoordinates ? (
              <div>
                <p className="text-xs font-mono text-slate-500 mb-2">
                  Coordinates: {complaint.location.latitude},{' '}
                  {complaint.location.longitude}
                </p>
                <LocationPickerMap
                  latitude={complaint.location.latitude}
                  longitude={complaint.location.longitude}
                  readOnly
                  heightClass="h-60"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Map coordinates were not pinned for this report.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Official Remarks, Worker Assignment & Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Official Remarks */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-civic-900 flex items-center gap-2 mb-3">
              <MessageSquareText className="w-4 h-4 text-civic-700" />
              Official Remarks
            </h2>
            {complaint.officialRemarks ? (
              <p className="text-sm text-slate-700 bg-civic-50 border border-civic-100 rounded-xl p-4 leading-relaxed">
                {complaint.officialRemarks}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Awaiting review from a municipal official. Remarks will appear here once
                reviewed.
              </p>
            )}
          </div>

          {/* Worker Assignment Details (Phase 2 Ready) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-civic-900 flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-civic-700" />
              Municipal Worker Assignment
            </h2>
            {complaint.assignedWorkerId ? (
              <div className="space-y-1.5 text-sm bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="font-semibold text-emerald-950">
                  {complaint.assignedWorkerId.name}
                </p>
                {complaint.assignedWorkerId.department && (
                  <p className="text-xs text-emerald-800">
                    Department: {complaint.assignedWorkerId.department}
                  </p>
                )}
                {complaint.assignedWorkerId.employeeId && (
                  <p className="text-xs text-emerald-800 font-mono">
                    Employee ID: {complaint.assignedWorkerId.employeeId}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No field worker assigned yet. Assignment details will appear here once
                dispatched.
              </p>
            )}
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-civic-900 mb-5">Status Timeline</h2>
            {sla && sla.state !== 'No Deadline' && (
              <p className="mb-4 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                SLA Status: <span className={sla.isOverdue ? 'text-rose-700' : 'text-emerald-700'}>{sla.state}</span>
              </p>
            )}
            <StatusTimeline history={statusHistory} />
          </div>

          {/* Citizen Feedback & Reopen (Closed Complaints Only) */}
          {complaint.status === 'Closed' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              {actionMsg && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionMsg}</span>
                </div>
              )}

              <div>
                <h2 className="text-base font-bold text-civic-900 flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-amber-500" />
                  Resolution Feedback
                </h2>

                {feedback ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm space-y-1">
                    <p className="font-bold text-amber-900">
                      Your Rating: {feedback.rating} / 5
                    </p>
                    {feedback.comment && (
                      <p className="text-slate-700 text-xs">{feedback.comment}</p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Rate Resolution (1 = Poor, 5 = Excellent)
                      </label>
                      <select
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} Star{n > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your feedback on the municipal resolution..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={submittingAction}
                      className="px-4 py-2 rounded-lg bg-civic-800 hover:bg-civic-700 text-white text-xs font-semibold"
                    >
                      Submit Feedback
                    </button>
                  </form>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  Issue Still Persists? Reopen Complaint
                </h3>
                <form onSubmit={handleReopen} className="space-y-2">
                  <textarea
                    rows={2}
                    required
                    minLength={5}
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Explain why the issue needs further attention..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                  >
                    Reopen Complaint
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
              aria-label="Close image preview"
            >
              <X className="w-7 h-7" />
            </button>
            <img
              src={lightboxImage}
              alt="Enlarged complaint evidence"
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetailsPage;
