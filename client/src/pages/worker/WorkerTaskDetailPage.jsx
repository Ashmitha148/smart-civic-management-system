import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  MapPin,
  Trash2,
  Wrench,
  AlertCircle,
  Calendar,
  Send,
} from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import StatusTimeline from '../../components/complaint/StatusTimeline';
import LocationPickerMap from '../../components/complaint/LocationPickerMap';

const WorkerTaskDetailPage = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  const [progressRemarks, setProgressRemarks] = useState('');
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [completionFiles, setCompletionFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const fetchTask = useCallback(async () => {
    try {
      setError('');
      const { data } = await api.get(`/worker/tasks/${id}`);
      setTask(data.task);
      setStatusHistory(data.statusHistory || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load task details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  const handleAccept = async () => {
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      await api.patch(`/worker/tasks/${task._id}/accept`);
      setFeedback('Task acknowledged.');
      await fetchTask();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not accept task.');
    } finally {
      setBusy(false);
    }
  };

  const handleStartProgress = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      await api.patch(`/worker/tasks/${task._id}/status`, {
        status: 'In Progress',
        remarks: progressRemarks,
      });
      setFeedback('Status updated to In Progress.');
      setProgressRemarks('');
      await fetchTask();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update task status.');
    } finally {
      setBusy(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (completionFiles.length + files.length > 5) {
      setError('You can upload up to 5 completion photos.');
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setCompletionFiles((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...urls]);
    e.target.value = '';
  };

  const removeFile = (idx) => {
    URL.revokeObjectURL(previews[idx]);
    setCompletionFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (completionFiles.length === 0) {
      setError('Please upload at least one completion photograph.');
      return;
    }

    setBusy(true);
    setError('');
    setFeedback('');
    try {
      const payload = new FormData();
      payload.append('remarks', completionRemarks);
      completionFiles.forEach((f) => payload.append('images', f));

      await api.post(`/worker/tasks/${task._id}/complete`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedback('Completion evidence submitted for official verification.');
      setCompletionFiles([]);
      setPreviews([]);
      setCompletionRemarks('');
      await fetchTask();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit completion.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="animate-pulse h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-rose-700 font-semibold">{error || 'Task not found'}</p>
        <Link to="/worker/tasks" className="text-civic-700 underline text-sm mt-3 inline-block">
          Back to My Tasks
        </Link>
      </div>
    );
  }

  const isClosedOrRejected = ['Closed', 'Rejected'].includes(task.status);
  const assignment = task.currentAssignmentId;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/worker/tasks"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-civic-700 hover:text-civic-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Tasks
      </Link>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Task Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <span className="font-mono text-sm font-bold text-civic-800 bg-civic-50 px-3 py-1 rounded-lg border border-civic-200">
            {task.complaintId}
          </span>
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <span className="text-xs font-medium bg-slate-100 px-2.5 py-1 rounded-md">
            {task.category}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-civic-900">{task.title}</h1>
        <p className="text-sm text-slate-600 mt-2">{task.description}</p>

        {assignment && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-700" />
              Deadline: {new Date(assignment.deadline).toLocaleDateString()} &bull;
              Assignment Status: {assignment.status}
            </p>
            {assignment.instructions && (
              <p>
                <strong>Official Instructions:</strong> {assignment.instructions}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {/* Worker Actions */}
          {!isClosedOrRejected && task.status !== 'Resolved - Pending Verification' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-civic-900">
                Field Execution Actions
              </h2>

              {assignment?.status === 'Assigned' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleAccept}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-civic-800 hover:bg-civic-700 text-white text-xs font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Acknowledge / Accept Task
                </button>
              )}

              <form onSubmit={handleStartProgress} className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  Update Progress to &quot;In Progress&quot;
                </label>
                <input
                  type="text"
                  value={progressRemarks}
                  onChange={(e) => setProgressRemarks(e.target.value)}
                  placeholder="Arrived on site, began repair work..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                >
                  <Wrench className="w-4 h-4" />
                  Mark In Progress
                </button>
              </form>

              <form onSubmit={handleCompleteSubmit} className="space-y-3 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-bold text-emerald-800">
                  Submit Completed Work for Official Verification
                </h3>
                <textarea
                  rows={2}
                  value={completionRemarks}
                  onChange={(e) => setCompletionRemarks(e.target.value)}
                  placeholder="Describe the completed repair work..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />

                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 cursor-pointer bg-slate-50 hover:bg-emerald-50/40">
                  <Camera className="w-6 h-6 text-emerald-700 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">
                    Upload Completion Photos (Before &amp; After Verification)
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
                  <div className="grid grid-cols-3 gap-2">
                    {previews.map((src, i) => (
                      <div key={src} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img src={src} alt="Completion preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <Send className="w-4 h-4" />
                  Submit Completion for Verification
                </button>
              </form>
            </div>
          )}

          {/* Citizen Photos & Map */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-civic-900">
              Original Issue Photos &amp; Location
            </h2>
            {task.images?.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {task.images.map((img, i) => (
                  <img
                    key={img.url + i}
                    src={img.url}
                    alt={`Issue ${i + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                ))}
              </div>
            )}
            <p className="text-sm text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-civic-700" />
              {task.location?.address}
            </p>
            {typeof task.location?.latitude === 'number' && (
              <LocationPickerMap
                latitude={task.location.latitude}
                longitude={task.location.longitude}
                readOnly
                heightClass="h-56"
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-civic-900 mb-4">
              Task History
            </h2>
            <StatusTimeline history={statusHistory} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerTaskDetailPage;
