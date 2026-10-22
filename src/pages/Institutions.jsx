import { useMemo, useState } from 'react';
import { Building2, Pencil, Plus, Search, Eye } from 'lucide-react';

import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';

// Mock data import — replace with api.institutions.list() later.
import { INSTITUTIONS, STATUSES } from '../data/mockData.js';

const TYPE_OPTIONS = [
  'Engineering College',
  'Polytechnic',
  'Management Institute',
  'Pharmacy College',
  'Architecture College',
];

const EMPTY_FORM = { name: '', code: '', state: '', district: '', type: TYPE_OPTIONS[0], status: 'Active' };

const INPUT_CLASS =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600';

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        status === 'Active'
          ? 'bg-green-50 text-green-700 ring-green-200'
          : 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      {status}
    </span>
  );
}

export default function Institutions() {
  const [institutions, setInstitutions] = useState(INSTITUTIONS);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  const [modal, setModal] = useState(null); // 'view' | 'add' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return institutions.filter((inst) => {
      if (type && inst.type !== type) return false;
      if (status && inst.status !== status) return false;
      if (query) {
        const haystack = `${inst.name} ${inst.code} ${inst.state} ${inst.district}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [institutions, search, type, status]);

  const closeModals = () => {
    setModal(null);
    setSelected(null);
    setFormError('');
  };

  const openView = (inst) => {
    setSelected(inst);
    setModal('view');
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setModal('add');
  };

  const openEdit = (inst) => {
    setSelected(inst);
    setForm({
      name: inst.name,
      code: inst.code,
      state: inst.state,
      district: inst.district,
      type: inst.type,
      status: inst.status,
    });
    setFormError('');
    setModal('edit');
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) {
      setFormError('Institution name and code are required.');
      return;
    }
    if (modal === 'add') {
      const next = {
        id: `inst-${Date.now()}`,
        shortName: form.name.split(' ')[0],
        ...form,
        name: form.name.trim(),
        code: form.code.trim(),
        totalComplaints: 0,
        pending: 0,
        resolved: 0,
      };
      setInstitutions((prev) => [next, ...prev]);
    } else if (modal === 'edit' && selected) {
      setInstitutions((prev) =>
        prev.map((inst) =>
          inst.id === selected.id
            ? { ...inst, ...form, name: form.name.trim(), code: form.code.trim() }
            : inst
        )
      );
    }
    closeModals();
  };

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Institutions</h2>
          <p className="text-sm text-slate-500">
            {filtered.length} institution{filtered.length === 1 ? '' : 's'} registered
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>
          Add Institution
        </Button>
      </div>

      {/* Search + filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code or state…"
              aria-label="Search institutions"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Filter by type"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All Types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            title="No institutions found"
            message="Try adjusting the search or filters."
            action={
              <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>
                Add Institution
              </Button>
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Institution Name</th>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">State</th>
                <th className="px-5 py-3 font-medium">District</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Pending</th>
                <th className="px-5 py-3 font-medium">Resolved</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inst) => (
                <tr key={inst.id} className="transition-colors hover:bg-slate-50">
                  <td className="max-w-56 px-5 py-3">
                    <p className="truncate font-medium text-slate-800" title={inst.name}>{inst.name}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{inst.code}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{inst.state}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{inst.district}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{inst.type}</td>
                  <td className="px-5 py-3"><StatusPill status={inst.status} /></td>
                  <td className="px-5 py-3 text-slate-700">{inst.totalComplaints.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3 text-amber-600">{inst.pending}</td>
                  <td className="px-5 py-3 text-green-600">{inst.resolved}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => openView(inst)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(inst)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View details */}
      <Modal open={modal === 'view'} title={selected ? selected.name : 'Institution'} onClose={closeModals} size="lg">
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800">{selected.code}</p>
                <p className="text-xs text-slate-500">{selected.type}</p>
              </div>
              <div className="ml-auto"><StatusPill status={selected.status} /></div>
            </div>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">State</dt>
                <dd className="mt-0.5 text-sm text-slate-800">{selected.state}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">District</dt>
                <dd className="mt-0.5 text-sm text-slate-800">{selected.district}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Status</dt>
                <dd className="mt-0.5 text-sm text-slate-800">{selected.status}</dd>
              </div>
            </dl>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-lg font-semibold text-slate-900">{selected.totalComplaints}</p>
                <p className="text-xs text-slate-500">Total Complaints</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-lg font-semibold text-amber-600">{selected.pending}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-lg font-semibold text-green-600">{selected.resolved}</p>
                <p className="text-xs text-slate-500">Resolved</p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Add / edit form */}
      <Modal
        open={modal === 'add' || modal === 'edit'}
        title={modal === 'add' ? 'Add Institution' : 'Edit Institution'}
        onClose={closeModals}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModals}>Cancel</Button>
            <Button onClick={handleSave}>
              {modal === 'add' ? 'Add Institution' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="inst-name">Institution Name</label>
            <input
              id="inst-name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Delhi Institute of Technology"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="inst-code">Institution Code</label>
            <input
              id="inst-code"
              value={form.code}
              onChange={(e) => setField('code', e.target.value)}
              placeholder="e.g. AICTE-DL-1042"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="inst-type">Type</label>
            <select
              id="inst-type"
              value={form.type}
              onChange={(e) => setField('type', e.target.value)}
              className={INPUT_CLASS}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="inst-state">State</label>
            <input
              id="inst-state"
              value={form.state}
              onChange={(e) => setField('state', e.target.value)}
              placeholder="e.g. Delhi"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="inst-district">District</label>
            <input
              id="inst-district"
              value={form.district}
              onChange={(e) => setField('district', e.target.value)}
              placeholder="e.g. New Delhi"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="inst-status">Status</label>
            <select
              id="inst-status"
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {formError ? <p className="mt-3 text-sm text-red-600">{formError}</p> : null}
        <p className="mt-3 text-xs text-slate-400">
          Changes are stored in local state only until the backend is connected.
        </p>
      </Modal>
    </div>
  );
}
