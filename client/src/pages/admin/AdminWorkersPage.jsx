import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Edit3, Search, CheckCircle2, AlertCircle, X } from 'lucide-react';
import api from '../../api/axios';
import { DEPARTMENTS, WORKER_AVAILABILITY } from '../../constants/civicConstants';

const AdminWorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    department: DEPARTMENTS[0],
    assignedArea: '',
    employeeId: '',
  });

  const [editingWorker, setEditingWorker] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (deptFilter !== 'All') params.department = deptFilter;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/admin/workers', { params });
      setWorkers(data.workers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workers.');
    } finally {
      setLoading(false);
    }
  }, [deptFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchWorkers, 250);
    return () => clearTimeout(t);
  }, [fetchWorkers]);

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/admin/workers', createForm);
      setSuccess('Municipal worker registered successfully.');
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        department: DEPARTMENTS[0],
        assignedArea: '',
        employeeId: '',
      });
      fetchWorkers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register worker.');
    }
  };

  const openEdit = (worker) => {
    setEditingWorker(worker);
    setEditForm({
      name: worker.name,
      phone: worker.phone,
      department: worker.department,
      assignedArea: worker.assignedArea,
      availability: worker.availability,
      isActive: worker.isActive,
    });
  };

  const handleUpdateWorker = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.patch(`/admin/workers/${editingWorker._id}`, editForm);
      setSuccess('Worker profile updated.');
      setEditingWorker(null);
      fetchWorkers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update worker.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-civic-600">
            Workforce Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-civic-900 mt-1">
            Municipal Worker Management
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-civic-800 hover:bg-civic-700 text-white text-sm font-semibold self-start"
        >
          <UserPlus className="w-4 h-4" />
          Register Worker
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, employee ID, or area..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <div className="md:col-span-5">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 animate-pulse h-40 bg-slate-100" />
        ) : workers.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No municipal workers registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Worker</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Assigned Area</th>
                  <th className="py-3.5 px-4">Availability</th>
                  <th className="py-3.5 px-4">Performance</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {workers.map((w) => (
                  <tr key={w._id} className="hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900">{w.name}</p>
                      <p className="text-xs text-slate-500">
                        {w.email} &bull; {w.phone}
                      </p>
                      <p className="text-[11px] font-mono text-civic-700">
                        {w.employeeId} {!w.isActive && '(Inactive)'}
                      </p>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">{w.department}</td>
                    <td className="py-4 px-4">{w.assignedArea}</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          w.availability === 'Available'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {w.availability}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap">
                      Active: <strong>{w.performance?.activeTasks || 0}</strong> &bull;
                      Completed: <strong>{w.performance?.completedTasks || 0}</strong>
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(w)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Worker Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-civic-900">
                Register Municipal Worker
              </h2>
              <button type="button" onClick={() => setShowCreateModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateWorker} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone"
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={createForm.department}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, department: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Employee ID (optional)"
                  value={createForm.employeeId}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, employeeId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Assigned Working Area (e.g., Ward 3 & Central Zone)"
                value={createForm.assignedArea}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, assignedArea: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Initial Password (min 8 chars)"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, password: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-civic-800 text-white text-sm font-semibold"
                >
                  Register Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Worker Modal */}
      {editingWorker && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-civic-900">
                Edit Worker — {editingWorker.name}
              </h2>
              <button type="button" onClick={() => setEditingWorker(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleUpdateWorker} className="space-y-3">
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <input
                type="tel"
                required
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editForm.department}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, department: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <select
                  value={editForm.availability}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, availability: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  {WORKER_AVAILABILITY.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                required
                value={editForm.assignedArea}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, assignedArea: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, isActive: e.target.checked }))
                  }
                />
                Active Account
              </label>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-civic-800 text-white text-sm font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkersPage;
