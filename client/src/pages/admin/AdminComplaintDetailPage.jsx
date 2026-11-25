import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  UserPlus,
  MapPin,
  AlertCircle,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import api from '../../api/axios';
import { COMPLAINT_PRIORITIES } from '../../constants/civicConstants';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import StatusTimeline from '../../components/complaint/StatusTimeline';
import LocationPickerMap from '../../components/complaint/LocationPickerMap';

const AdminComplaintDetailPage = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [expectedDepartment, setExpectedDepartment] = useState('');
  const [statusHistory, setStatusHistory] = useState([]);
  const [eligibleWorkers, setEligibleWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Form states
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [rejectRemarks, setRejectRemarks] = useState('');

  const [assignWorkerId, setAssignWorkerId] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');

  const [completionRemarks, setCompletionRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setError('');
      const { data } = await api.get(`/admin/complaints/${id}`);
      setComplaint(data.complaint);
      setExpectedDepartment(data.expectedDepartment || '');
      setStatusHistory(data.statusHistory || []);
      setEligibleWorkers(data.eligibleWorkers || []);
      setSelectedPriority(data.complaint.priority || 'Medium');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load complaint.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const runAction = async (fn, successMsg) => {
    setBusy(true);
    setError('');
    setActionMessage('');
    try {
      await fn();
      setActionMessage(successMsg);
      await fetchDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = () =>
    runAction(
      () =>
        api.patch(`/admin/complaints/${complaint._id}/verify`, {
          remarks: verifyRemarks,
          priority: selectedPriority,
        }),
      'Complaint verified successfully.'
    );

  const handleReject = () =>
    runAction(
      () =>
        api.patch(`/admin/complaints/${complaint._id}/reject`, {
          remarks: rejectRemarks,
        }),
      'Complaint rejected.'
    );

  const handlePriorityUpdate = () =>
    runAction(
      () =>
        api.patch(`/admin/complaints/${complaint._id}/priority`, {
          priority: selectedPriority,
        }),
      `Priority updated to ${selectedPriority}.`
    );

  const handleEscalate = () =>
    runAction(
      () =>
        api.patch(`/admin/complaints/${complaint._id}/escalate`, {
          remarks: 'Escalated by official due to urgency / SLA breach.',
        }),
      'Complaint escalated to Emergency priority.'
    );

  const handleAssignWorker = (e) => {
    e.preventDefault();
    runAction(
      () =>
        api.post('/admin/assignments', {
          complaintId: complaint._id,
          workerId: assignWorkerId,
          deadline: assignDeadline,
          instructions: assignInstructions,
        }),
      'Municipal worker assigned and notified.'
    );
  };

  const handleApproveCompletion = () =>
    runAction(
      () =>
        api.patch(`/admin/complaints/${complaint._id}/approve-completion`, {
          remarks: completionRemarks,
        }),
      'Completion approved and complaint closed.'
    );

  const handleRejectCompletion = () =>
    runAction(
      () =>
        api.patch(`/admin/complaints/${complaint._id}/reject-completion`, {
          remarks: completionRemarks,
        }),
      'Completion rejected and complaint reopened for rework.'
    );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="animate-pulse h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-rose-700 font-semibold">{error || 'Complaint not found'}</p>
        <Link to="/admin/complaints" className="text-civic-700 underline text-sm mt-3 inline-block">
          Back to Complaints
        </Link>
      </div>
    );
  }

  const canVerifyOrReject = ['Submitted', 'Under Review', 'Reopened'].includes(
    complaint.status
  );
  const canAssign = ['Verified', 'Reopened', 'Assigned'].includes(complaint.status);
  const awaitingCompletionReview =
    complaint.status === 'Resolved - Pending Verification';

  const sortedWorkers = [...eligibleWorkers].sort((a, b) => {
    const aMatch = a.department === expectedDepartment ? 0 : 1;
    const bMatch = b.department === expectedDepartment ? 0 : 1;
    return aMatch - bMatch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/admin/complaints"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-civic-700 hover:text-civic-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All Complaints
      </Link>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Summary Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <span className="font-mono text-sm font-bold text-civic-800 bg-civic-50 px-3 py-1 rounded-lg border border-civic-200">
            {complaint.complaintId}
          </span>
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
          <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
            {complaint.category}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-civic-900">{complaint.title}</h1>
        <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">
          {complaint.description}
        </p>
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-6 text-xs text-slate-600">
          <span>
            <strong>Citizen:</strong> {complaint.userId?.name} ({complaint.userId?.email})
          </span>
          <span>
            <strong>Address:</strong> {complaint.location?.address}
          </span>
          {complaint.deadline && (
            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              Deadline: {new Date(complaint.deadline).toLocaleDateString()}
            </span>
          )}
          {complaint.isEscalated && (
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
              ESCALATED
            </span>
          )}
        </div>

        {/* Phase 3: Smart Priority & Duplicate Alert */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-civic-50 border border-civic-200 text-xs">
            <p className="font-bold text-civic-900">
              Smart Priority Suggestion: {complaint.suggestedPriority || complaint.priority}{' '}
              (Score: {complaint.priorityScore ?? 0}/100)
            </p>
            {complaint.priorityFactors?.length > 0 && (
              <ul className="mt-1 list-disc list-inside text-slate-600 space-y-0.5">
                {complaint.priorityFactors.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            )}
          </div>

          {complaint.isPotentialDuplicate && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs">
              <p className="font-bold text-amber-900">
                Suspected Duplicate Alert ({complaint.potentialDuplicates?.length || 0} match)
              </p>
              <ul className="mt-1 space-y-1 text-amber-800">
                {complaint.potentialDuplicates?.map((d) => (
                  <li key={d.complaintId}>
                    <span className="font-mono font-bold">{d.complaintId}</span>: {d.title}{' '}
                    ({Math.round((d.similarityScore || 0) * 100)}% text match
                    {d.distanceMeters !== null ? `, ${d.distanceMeters}m away` : ''})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Before-and-After Image Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-civic-900 mb-4">
          Before-and-After Photographic Evidence
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Before (Citizen Submission)
            </h3>
            {complaint.images?.length ? (
              <div className="grid grid-cols-2 gap-2">
                {complaint.images.map((img, i) => (
                  <img
                    key={img.url + i}
                    src={img.url}
                    alt={`Before ${i + 1}`}
                    className="w-full h-36 object-cover rounded-lg border border-slate-200"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No citizen photos attached.</p>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
              After (Worker Completion Evidence)
            </h3>
            {complaint.completionImages?.length ? (
              <div className="grid grid-cols-2 gap-2">
                {complaint.completionImages.map((img, i) => (
                  <img
                    key={img.url + i}
                    src={img.url}
                    alt={`After ${i + 1}`}
                    className="w-full h-36 object-cover rounded-lg border border-emerald-200"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No completion photos uploaded yet.
              </p>
            )}
          </div>
        </div>

        {/* Completion Verification Actions */}
        {awaitingCompletionReview && (
          <div className="mt-6 pt-5 border-t border-slate-200 bg-teal-50/60 p-4 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              Completion Verification Required
            </h3>
            <p className="text-xs text-slate-600">
              Worker Notes: {complaint.resolutionNotes || 'None provided'}
            </p>
            <textarea
              rows={2}
              value={completionRemarks}
              onChange={(e) => setCompletionRemarks(e.target.value)}
              placeholder="Official review remarks (required if rejecting completion)..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={handleApproveCompletion}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve &amp; Close Complaint
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleRejectCompletion}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                <XCircle className="w-4 h-4" />
                Reject Completion &amp; Reopen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Controls + Map + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {/* Priority Control */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-civic-900 mb-3">
              Priority Level
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                {COMPLAINT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy}
                onClick={handlePriorityUpdate}
                className="px-4 py-2 rounded-lg bg-civic-800 hover:bg-civic-700 text-white text-xs font-semibold"
              >
                Update Priority
              </button>
              {!['Closed', 'Rejected'].includes(complaint.status) && !complaint.isEscalated && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleEscalate}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                >
                  Escalate (Emergency)
                </button>
              )}
            </div>
          </div>

          {/* Verify / Reject Module */}
          {canVerifyOrReject && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-civic-900">
                Complaint Verification
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Verification Remarks (optional)
                </label>
                <input
                  type="text"
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  placeholder="Verified issue location and severity..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleVerify}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verify Complaint
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-semibold text-rose-700 mb-1">
                  Rejection Reason (required to reject)
                </label>
                <input
                  type="text"
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Duplicate report / insufficient information..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleReject}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Complaint
                </button>
              </div>
            </div>
          )}

          {/* Worker Assignment Module */}
          {canAssign && (
            <form
              onSubmit={handleAssignWorker}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-civic-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-civic-700" />
                  Assign Municipal Worker
                </h2>
                <span className="text-xs font-semibold text-civic-700 bg-civic-50 px-2.5 py-1 rounded-md">
                  Recommended Dept: {expectedDepartment}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Select Available Worker <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignWorkerId}
                  onChange={(e) => setAssignWorkerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="">-- Choose an available worker --</option>
                  {sortedWorkers.map((w) => (
                    <option key={w._id} value={w.userId}>
                      {w.name} — {w.department} ({w.assignedArea})
                      {w.department === expectedDepartment ? ' ★ Recommended' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Completion Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={assignDeadline}
                  onChange={(e) => setAssignDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Assignment Instructions
                </label>
                <textarea
                  rows={2}
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  placeholder="Bring safety cones and asphalt patching equipment..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-civic-800 hover:bg-civic-700 text-white text-xs font-semibold"
              >
                <UserPlus className="w-4 h-4" />
                Confirm Assignment
              </button>
            </form>
          )}

          {/* Location Map */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-civic-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-civic-700" />
              Issue Location
            </h2>
            <p className="text-sm text-slate-700">
              {complaint.location?.address}
              {complaint.location?.landmark ? ` (${complaint.location.landmark})` : ''}
            </p>
            {typeof complaint.location?.latitude === 'number' && (
              <LocationPickerMap
                latitude={complaint.location.latitude}
                longitude={complaint.location.longitude}
                readOnly
                heightClass="h-60"
              />
            )}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-civic-900 mb-4">
              Audit &amp; Status History
            </h2>
            <StatusTimeline history={statusHistory} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminComplaintDetailPage;
