import { useEffect, useMemo, useState } from 'react';
import { EMPLOYEES, DEPARTMENTS, STATUSES } from '../data/employees';
import Spinner from '../components/Spinner';

const PAGE_SIZE = 8;
const COLUMNS = [
  { key: 'id', label: 'ID', numeric: true },
  { key: 'name', label: 'Name' },
  { key: 'department', label: 'Department' },
  { key: 'role', label: 'Role' },
  { key: 'salary', label: 'Salary', numeric: true },
  { key: 'startDate', label: 'Start Date' },
  { key: 'status', label: 'Status' },
];

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  // Simulated network delay so tests can practice waiting for the table.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  function refresh() {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    let rows = EMPLOYEES;
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) => r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q)
      );
    }
    if (department !== 'all') rows = rows.filter((r) => r.department === department);
    if (status !== 'all') rows = rows.filter((r) => r.status === status);

    const sorted = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [search, department, status, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const activeCount = EMPLOYEES.filter((e) => e.status === 'Active').length;
  const onLeaveCount = EMPLOYEES.filter((e) => e.status === 'On Leave').length;
  const avgSalary =
    EMPLOYEES.reduce((sum, e) => sum + e.salary, 0) / EMPLOYEES.length;

  function resetToFirstPage(fn) {
    return (e) => {
      setPage(1);
      fn(e);
    };
  }

  return (
    <section aria-labelledby="dashboard-heading">
      <div className="page-header">
        <div>
          <h1 id="dashboard-heading" data-testid="dashboard-heading">Employee Dashboard</h1>
          <p className="page-subtitle">Company-wide headcount and directory overview.</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={refresh}
          disabled={loading}
          data-testid="refresh-button"
          id="refresh-button"
        >
          {loading ? 'Refreshing…' : 'Refresh Data'}
        </button>
      </div>

      <div className="summary-grid" data-testid="summary-cards">
        <div className="card summary-card" data-testid="card-total-employees">
          <span className="summary-label">Total Employees</span>
          <span className="summary-value" data-testid="card-total-employees-value">
            {EMPLOYEES.length}
          </span>
        </div>
        <div className="card summary-card" data-testid="card-active">
          <span className="summary-label">Active</span>
          <span className="summary-value" data-testid="card-active-value">{activeCount}</span>
        </div>
        <div className="card summary-card" data-testid="card-on-leave">
          <span className="summary-label">On Leave</span>
          <span className="summary-value" data-testid="card-on-leave-value">{onLeaveCount}</span>
        </div>
        <div className="card summary-card" data-testid="card-avg-salary">
          <span className="summary-label">Average Salary</span>
          <span className="summary-value" data-testid="card-avg-salary-value">
            {currency.format(avgSalary)}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="toolbar" data-testid="table-toolbar">
          <div className="field search-field">
            <label htmlFor="employee-search">Search</label>
            <input
              type="search"
              id="employee-search"
              name="employeeSearch"
              placeholder="Search by name or role…"
              value={search}
              onChange={resetToFirstPage((e) => setSearch(e.target.value))}
              data-testid="search-input"
            />
          </div>
          <div className="field">
            <label htmlFor="department-filter">Department</label>
            <select
              id="department-filter"
              name="departmentFilter"
              value={department}
              onChange={resetToFirstPage((e) => setDepartment(e.target.value))}
              data-testid="department-filter"
            >
              <option value="all">All departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              name="statusFilter"
              value={status}
              onChange={resetToFirstPage((e) => setStatus(e.target.value))}
              data-testid="status-filter"
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            data-testid="clear-filters-button"
            onClick={() => {
              setSearch('');
              setDepartment('all');
              setStatus('all');
              setPage(1);
            }}
          >
            Clear Filters
          </button>
        </div>

        {loading ? (
          <Spinner label="Loading employees…" testId="table-loading" />
        ) : (
          <>
            <p className="result-count" data-testid="result-count" aria-live="polite">
              Showing {pageRows.length} of {filtered.length} employees
            </p>
            {filtered.length === 0 ? (
              <div className="empty-state" data-testid="empty-state">
                <p>No employees match your filters.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table" data-testid="employee-table" id="employee-table">
                  <thead>
                    <tr>
                      {COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          scope="col"
                          aria-sort={
                            sortKey === col.key
                              ? sortDir === 'asc' ? 'ascending' : 'descending'
                              : 'none'
                          }
                        >
                          <button
                            type="button"
                            className="sort-button"
                            data-testid={`sort-${col.key}`}
                            onClick={() => toggleSort(col.key)}
                          >
                            {col.label}
                            <span className="sort-indicator" aria-hidden="true">
                              {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody data-testid="employee-table-body">
                    {pageRows.map((emp) => (
                      <tr key={emp.id} data-testid={`employee-row-${emp.id}`}>
                        <td data-testid={`cell-id-${emp.id}`}>{emp.id}</td>
                        <td data-testid={`cell-name-${emp.id}`}>{emp.name}</td>
                        <td>{emp.department}</td>
                        <td>{emp.role}</td>
                        <td>{currency.format(emp.salary)}</td>
                        <td>{emp.startDate}</td>
                        <td>
                          <span
                            className={`badge badge-${emp.status.replace(' ', '-').toLowerCase()}`}
                            data-testid={`status-badge-${emp.id}`}
                          >
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <nav className="pagination" aria-label="Table pagination" data-testid="pagination">
              <button
                type="button"
                className="btn btn-ghost"
                data-testid="pagination-previous"
                aria-label="Previous page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                ← Previous
              </button>
              <span data-testid="pagination-info">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                data-testid="pagination-next"
                aria-label="Next page"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                Next →
              </button>
            </nav>
          </>
        )}
      </div>
    </section>
  );
}
