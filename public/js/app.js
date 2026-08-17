import { api } from './api.js';

/* ============================================================
   Small DOM / formatting helpers
   ============================================================ */
const $main = document.getElementById('main');
const $toasts = document.getElementById('toast-stack');
const $modalRoot = document.getElementById('modal-root');

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(n) {
  const num = Number(n || 0);
  return '$' + num.toFixed(2);
}

function fmtDate(d) {
  if (!d) return '—';
  return d; // server returns YYYY-MM-DD strings
}

function fmtDateTime(d) {
  if (!d) return '—';
  return String(d).replace('T', ' ').slice(0, 16);
}

function tagClass(status) {
  return 'tag-' + String(status || '').toLowerCase().replace(/\s+/g, '_');
}

function tag(status) {
  if (!status) return '';
  return `<span class="tag ${tagClass(status)}">${escapeHtml(status.replace('_', ' '))}</span>`;
}

function stars(rating) {
  const r = Number(rating) || 0;
  return `<span class="stars">${'★'.repeat(r)}${'☆'.repeat(Math.max(0, 5 - r))}</span>`;
}

function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' error' : '');
  el.textContent = message;
  $toasts.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

async function guarded(fn, successMsg) {
  try {
    const result = await fn();
    if (successMsg) toast(successMsg);
    return result;
  } catch (err) {
    toast(err.message || 'Something went wrong', 'error');
    throw err;
  }
}

function openModal(title, bodyHtml) {
  $modalRoot.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal">
        <div class="modal-head">
          <h3>${escapeHtml(title)}</h3>
          <button class="modal-close" id="modal-close" aria-label="Close">&times;</button>
        </div>
        <div id="modal-body">${bodyHtml}</div>
      </div>
    </div>`;
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });
}
function closeModal() { $modalRoot.innerHTML = ''; }

function formValues(form) {
  const data = {};
  new FormData(form).forEach((v, k) => { data[k] = v === '' ? null : v; });
  return data;
}

/* ============================================================
   Cached lookups (used inside forms/selects)
   ============================================================ */
async function getCustomers() { return api.get('/customers'); }
async function getRoomTypes() { return api.get('/room-types'); }
async function getRooms(params = '') { return api.get('/rooms' + params); }
async function getAmenities() { return api.get('/amenities'); }
async function getStaff() { return api.get('/staff'); }

/* ============================================================
   Router
   ============================================================ */
const routes = {
  dashboard: viewDashboard,
  reservations: viewReservations,
  rooms: viewRooms,
  customers: viewCustomers,
  payments: viewPayments,
  cancellations: viewCancellations,
  'room-services': viewRoomServices,
  feedback: viewFeedback,
  'room-types': viewRoomTypes,
  amenities: viewAmenities,
  staff: viewStaff,
};

function currentRoute() {
  const hash = location.hash.replace('#', '');
  return routes[hash] ? hash : 'dashboard';
}

async function render() {
  const route = currentRoute();
  document.querySelectorAll('.nav-link').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.route === route);
  });
  $main.innerHTML = '<div class="loading">Loading…</div>';
  try {
    await routes[route]();
  } catch (err) {
    $main.innerHTML = `<div class="empty-state"><div class="glyph">⚠</div><p>${escapeHtml(err.message || 'Failed to load this section.')}</p></div>`;
  }
}

window.addEventListener('hashchange', render);
document.getElementById('nav-group').addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-link');
  if (!btn) return;
  location.hash = btn.dataset.route;
});

/* ============================================================
   VIEW: Dashboard
   ============================================================ */
async function viewDashboard() {
  const [stats, rooms] = await Promise.all([api.get('/dashboard/stats'), getRooms()]);

  const rack = rooms.map((r) => {
    const cls = String(r.room_status).toLowerCase();
    return `<div class="key-fob ${cls}" title="Room ${escapeHtml(r.room_number)} — ${escapeHtml(r.room_status)}">
      <div class="ring"></div>
      <div class="tag">${escapeHtml(r.room_number)}</div>
    </div>`;
  }).join('');

  const recentRows = stats.recent_reservations.map((r) => `
    <tr>
      <td class="mono">#${r.reservation_id}</td>
      <td>${escapeHtml(r.customer_name)}</td>
      <td class="mono">${escapeHtml(r.room_number)}</td>
      <td>${fmtDate(r.check_in_date)} → ${fmtDate(r.check_out_date)}</td>
      <td>${tag(r.reservation_status)}</td>
      <td>${fmtMoney(r.total_amount)}</td>
    </tr>`).join('');

  $main.innerHTML = `
    <div class="topbar">
      <div>
        <p class="page-kicker">Overview</p>
        <h1 class="page-title">Good day at the front desk</h1>
      </div>
      <div class="topbar-actions">
        <button class="btn btn-primary" id="new-reservation-btn">+ New Reservation</button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><div class="label">Rooms Available</div><div class="value">${stats.available_rooms}/${stats.total_rooms}</div><div class="sub">${stats.occupied_rooms} occupied · ${stats.maintenance_rooms} in maintenance</div></div>
      <div class="stat-card"><div class="label">Arrivals / Departures Today</div><div class="value">${stats.arrivals_today || 0} / ${stats.departures_today || 0}</div><div class="sub">check-ins vs check-outs due</div></div>
      <div class="stat-card"><div class="label">Revenue This Month</div><div class="value">${fmtMoney(stats.revenue_this_month)}</div><div class="sub">completed payments</div></div>
      <div class="stat-card"><div class="label">Guest Rating</div><div class="value">${Number(stats.avg_rating).toFixed(1)} ★</div><div class="sub">${stats.feedback_count} reviews</div></div>
      <div class="stat-card"><div class="label">Guests on File</div><div class="value">${stats.total_customers}</div><div class="sub">${stats.pending_payments} pending payments</div></div>
      <div class="stat-card"><div class="label">Open Service Requests</div><div class="value">${stats.open_service_requests}</div><div class="sub">awaiting housekeeping / room service</div></div>
    </div>

    <div class="card">
      <div class="card-head">
        <h2>Key Rack</h2>
        <span class="muted" style="font-size:12.5px;">${rooms.length} rooms</span>
      </div>
      <div class="key-rack">${rack || '<p class="muted">No rooms yet.</p>'}</div>
      <div class="legend">
        <div class="legend-item"><span class="legend-swatch available"></span> Available</div>
        <div class="legend-item"><span class="legend-swatch occupied"></span> Occupied</div>
        <div class="legend-item"><span class="legend-swatch maintenance"></span> Maintenance</div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h2>Recent Bookings</h2></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Dates</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>${recentRows || `<tr><td colspan="6" class="empty-state">No reservations yet.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('new-reservation-btn').addEventListener('click', openReservationForm);
}

/* ============================================================
   VIEW: Reservations
   ============================================================ */
async function viewReservations() {
  const filterStatus = window.__resFilter || '';
  const list = await api.get('/reservations' + (filterStatus ? `?status=${filterStatus}` : ''));

  const statuses = ['', 'Booked', 'Checked_in', 'Checked_out', 'Cancelled'];
  const filterOptions = statuses.map((s) => `<option value="${s}" ${s === filterStatus ? 'selected' : ''}>${s ? s.replace('_', ' ') : 'All statuses'}</option>`).join('');

  const rows = list.map((r) => {
    const actions = [];
    if (r.reservation_status === 'Booked') {
      actions.push(`<button class="btn btn-sm btn-primary" data-action="checkin" data-id="${r.reservation_id}">Check in</button>`);
      actions.push(`<button class="btn btn-sm btn-danger" data-action="cancel" data-id="${r.reservation_id}">Cancel</button>`);
    } else if (r.reservation_status === 'Checked_in') {
      actions.push(`<button class="btn btn-sm btn-brass" data-action="checkout" data-id="${r.reservation_id}">Check out</button>`);
      actions.push(`<button class="btn btn-sm btn-danger" data-action="cancel" data-id="${r.reservation_id}">Cancel</button>`);
    }
    actions.push(`<button class="btn btn-sm btn-ghost" data-action="view" data-id="${r.reservation_id}">Details</button>`);
    return `
      <tr>
        <td class="mono">#${r.reservation_id}</td>
        <td>${escapeHtml(r.customer_name)}</td>
        <td class="mono">${escapeHtml(r.room_number)} <span class="muted">(${escapeHtml(r.type_name)})</span></td>
        <td>${fmtDate(r.check_in_date)} → ${fmtDate(r.check_out_date)}</td>
        <td>${tag(r.reservation_status)}</td>
        <td>${fmtMoney(r.total_amount)}</td>
        <td class="row-actions">${actions.join('')}</td>
      </tr>`;
  }).join('');

  $main.innerHTML = `
    <div class="topbar">
      <div>
        <p class="page-kicker">Operations</p>
        <h1 class="page-title">Reservations</h1>
      </div>
      <div class="topbar-actions">
        <select class="search-input" id="status-filter">${filterOptions}</select>
        <button class="btn btn-primary" id="new-reservation-btn">+ New Reservation</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Dates</th><th>Status</th><th>Total</th><th>Actions</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="7" class="empty-state">No reservations match this filter.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('new-reservation-btn').addEventListener('click', openReservationForm);
  document.getElementById('status-filter').addEventListener('change', (e) => {
    window.__resFilter = e.target.value;
    viewReservations();
  });

  $main.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => handleReservationAction(btn.dataset.action, btn.dataset.id));
  });
}

async function handleReservationAction(action, id) {
  if (action === 'view') return openReservationDetail(id);
  if (action === 'checkin') {
    const staffId = await promptStaffId('Check in');
    if (staffId === null) return;
    await guarded(() => api.post(`/reservations/${id}/checkin`, { staff_id: staffId }), 'Guest checked in');
    viewReservations();
  }
  if (action === 'checkout') {
    const staffId = await promptStaffId('Check out');
    if (staffId === null) return;
    await guarded(() => api.post(`/reservations/${id}/checkout`, { staff_id: staffId }), 'Guest checked out');
    viewReservations();
  }
  if (action === 'cancel') {
    openCancelForm(id);
  }
}

async function promptStaffId(actionLabel) {
  const staff = await getStaff();
  return new Promise((resolve) => {
    const options = staff.map((s) => `<option value="${s.staff_id}">${escapeHtml(s.name)} (${escapeHtml(s.role)})</option>`).join('');
    openModal(actionLabel, `
      <form id="staff-pick-form">
        <div class="field">
          <label>Handled by</label>
          <select name="staff_id">${options}</select>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">${escapeHtml(actionLabel)}</button>
          <button type="button" class="btn btn-ghost" id="staff-pick-cancel">Cancel</button>
        </div>
      </form>
    `);
    document.getElementById('staff-pick-cancel').addEventListener('click', () => { closeModal(); resolve(null); });
    document.getElementById('staff-pick-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = formValues(e.target);
      closeModal();
      resolve(v.staff_id || null);
    });
  });
}

async function openCancelForm(id) {
  openModal('Cancel Reservation', `
    <form id="cancel-form">
      <div class="form-grid">
        <div class="field"><label>Reason</label><input name="reason" placeholder="Change of plans, etc." /></div>
        <div class="field"><label>Refund Amount</label><input name="refund_amount" type="number" step="0.01" placeholder="0.00" /></div>
        <div class="field" style="grid-column: 1 / -1;"><label>Policy Applied</label><input name="cancellation_policy_applied" placeholder="e.g. Cancelled 7+ days ahead: 75% refund" /></div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-danger">Confirm Cancellation</button>
        <button type="button" class="btn btn-ghost" id="cancel-close">Back</button>
      </div>
    </form>
  `);
  document.getElementById('cancel-close').addEventListener('click', closeModal);
  document.getElementById('cancel-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = formValues(e.target);
    await guarded(() => api.post(`/reservations/${id}/cancel`, v), 'Reservation cancelled');
    closeModal();
    render();
  });
}

async function openReservationDetail(id) {
  const r = await api.get(`/reservations/${id}`);
  const payments = r.payments.map((p) => `<li>${fmtDate(p.payment_date)} — ${fmtMoney(p.amount)} via ${escapeHtml(p.payment_method)} ${tag(p.payment_status)}</li>`).join('') || '<li class="muted">No payments recorded.</li>';
  const services = r.services.map((s) => `<li>${fmtDate(s.service_date)} — ${escapeHtml(s.service_type)} (${fmtMoney(s.amount)}) ${tag(s.status)}</li>`).join('') || '<li class="muted">No room service requests.</li>';
  const fb = r.feedback.map((f) => `<li>${stars(f.rating)} — ${escapeHtml(f.comments || '')}</li>`).join('') || '<li class="muted">No feedback yet.</li>';
  const cio = r.check_in_out[0];

  openModal(`Reservation #${r.reservation_id}`, `
    <p><strong>${escapeHtml(r.customer_name)}</strong> · ${escapeHtml(r.customer_email)} · ${escapeHtml(r.customer_phone)}</p>
    <p class="mono">Room ${escapeHtml(r.room_number)} (${escapeHtml(r.type_name)}) · ${fmtDate(r.check_in_date)} → ${fmtDate(r.check_out_date)}</p>
    <p>${tag(r.reservation_status)} &nbsp; Total: <strong>${fmtMoney(r.total_amount)}</strong></p>
    ${cio ? `<p class="muted" style="font-size:13px;">In: ${fmtDateTime(cio.check_in_time)} &nbsp; Out: ${fmtDateTime(cio.check_out_time)}</p>` : ''}
    <hr class="hairline" />
    <p><strong>Payments</strong></p><ul>${payments}</ul>
    <p><strong>Room Service</strong></p><ul>${services}</ul>
    <p><strong>Feedback</strong></p><ul>${fb}</ul>
    <div class="form-actions"><button class="btn btn-ghost" id="detail-close">Close</button></div>
  `);
  document.getElementById('detail-close').addEventListener('click', closeModal);
}

async function openReservationForm() {
  const [customers, roomTypes] = await Promise.all([getCustomers(), getRoomTypes()]);
  const customerOptions = customers.map((c) => `<option value="${c.customer_id}">${escapeHtml(c.name)} — ${escapeHtml(c.email)}</option>`).join('');

  openModal('New Reservation', `
    <form id="reservation-form">
      <div class="form-grid">
        <div class="field" style="grid-column:1/-1;">
          <label>Guest</label>
          <select name="customer_id" required>${customerOptions || '<option value="">No guests yet — add one first</option>'}</select>
        </div>
        <div class="field"><label>Check-in</label><input name="check_in_date" type="date" required /></div>
        <div class="field"><label>Check-out</label><input name="check_out_date" type="date" required /></div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-brass" id="find-rooms-btn">Find available rooms</button>
      </div>
      <div id="room-picker" class="muted" style="font-size:13px; margin-top:6px;">Choose dates, then find available rooms.</div>
      <input type="hidden" name="room_id" id="room_id_hidden" />
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" id="confirm-reservation-btn" disabled>Confirm Booking</button>
        <button type="button" class="btn btn-ghost" id="reservation-cancel">Cancel</button>
      </div>
    </form>
  `);

  document.getElementById('reservation-cancel').addEventListener('click', closeModal);
  const form = document.getElementById('reservation-form');
  const roomPicker = document.getElementById('room-picker');
  const confirmBtn = document.getElementById('confirm-reservation-btn');

  document.getElementById('find-rooms-btn').addEventListener('click', async () => {
    const v = formValues(form);
    if (!v.check_in_date || !v.check_out_date) { toast('Pick both dates first', 'error'); return; }
    if (v.check_out_date <= v.check_in_date) { toast('Check-out must be after check-in', 'error'); return; }
    roomPicker.innerHTML = 'Searching…';
    try {
      const rooms = await api.get(`/rooms/available?checkIn=${v.check_in_date}&checkOut=${v.check_out_date}`);
      if (!rooms.length) { roomPicker.innerHTML = '<span class="muted">No rooms available for those dates.</span>'; return; }
      roomPicker.innerHTML = `<div class="pill-group">${rooms.map((r) => `
        <button type="button" class="chip" data-room="${r.room_id}" data-price="${r.price}">${escapeHtml(r.room_number)} · ${escapeHtml(r.type_name)} · ${fmtMoney(r.price)}/night</button>
      `).join('')}</div>`;
      roomPicker.querySelectorAll('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          roomPicker.querySelectorAll('.chip').forEach((c) => c.style.background = '');
          chip.style.background = 'var(--brass)';
          document.getElementById('room_id_hidden').value = chip.dataset.room;
          confirmBtn.disabled = false;
        });
      });
    } catch (err) {
      roomPicker.innerHTML = `<span class="muted">${escapeHtml(err.message)}</span>`;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = formValues(form);
    if (!v.room_id) { toast('Pick a room first', 'error'); return; }
    await guarded(() => api.post('/reservations', v), 'Reservation created');
    closeModal();
    render();
  });
}

/* ============================================================
   VIEW: Rooms
   ============================================================ */
async function viewRooms() {
  const filterStatus = window.__roomFilter || '';
  const rooms = await getRooms(filterStatus ? `?status=${filterStatus}` : '');
  const statuses = ['', 'Available', 'Occupied', 'Maintenance'];
  const filterOptions = statuses.map((s) => `<option value="${s}" ${s === filterStatus ? 'selected' : ''}>${s || 'All statuses'}</option>`).join('');

  const rows = rooms.map((r) => `
    <tr>
      <td class="mono">${escapeHtml(r.room_number)}</td>
      <td>${escapeHtml(r.type_name)}</td>
      <td>${fmtMoney(r.price)}</td>
      <td>${r.capacity} guests</td>
      <td>${tag(r.room_status)}</td>
      <td class="row-actions">
        <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${r.room_id}">Edit</button>
        <button class="btn btn-sm btn-ghost" data-action="amenities" data-id="${r.room_id}">Amenities</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${r.room_id}">Delete</button>
      </td>
    </tr>`).join('');

  $main.innerHTML = `
    <div class="topbar">
      <div><p class="page-kicker">Property</p><h1 class="page-title">Rooms</h1></div>
      <div class="topbar-actions">
        <select class="search-input" id="room-status-filter">${filterOptions}</select>
        <button class="btn btn-primary" id="add-room-btn">+ Add Room</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Room</th><th>Type</th><th>Price/night</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6" class="empty-state">No rooms found.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('room-status-filter').addEventListener('change', (e) => { window.__roomFilter = e.target.value; viewRooms(); });
  document.getElementById('add-room-btn').addEventListener('click', () => openRoomForm());
  $main.querySelectorAll('[data-action]').forEach((btn) => {
    const id = btn.dataset.id;
    if (btn.dataset.action === 'edit') btn.addEventListener('click', async () => openRoomForm(await api.get(`/rooms/${id}`)));
    if (btn.dataset.action === 'amenities') btn.addEventListener('click', () => openRoomAmenities(id));
    if (btn.dataset.action === 'delete') btn.addEventListener('click', async () => {
      if (!confirm('Delete this room?')) return;
      await guarded(() => api.del(`/rooms/${id}`), 'Room deleted');
      viewRooms();
    });
  });
}

async function openRoomForm(existing) {
  const roomTypes = await getRoomTypes();
  const typeOptions = roomTypes.map((t) => `<option value="${t.room_type_id}" ${existing && existing.room_type_id === t.room_type_id ? 'selected' : ''}>${escapeHtml(t.type_name)}</option>`).join('');
  const statusOptions = ['Available', 'Occupied', 'Maintenance'].map((s) => `<option value="${s}" ${existing && existing.room_status === s ? 'selected' : ''}>${s}</option>`).join('');

  openModal(existing ? `Edit Room ${existing.room_number}` : 'Add Room', `
    <form id="room-form">
      <div class="form-grid">
        <div class="field"><label>Room Number</label><input name="room_number" required value="${escapeHtml(existing?.room_number || '')}" /></div>
        <div class="field"><label>Room Type</label><select name="room_type_id" required>${typeOptions}</select></div>
        <div class="field"><label>Price / night</label><input name="price" type="number" step="0.01" required value="${existing?.price ?? ''}" /></div>
        <div class="field"><label>Capacity</label><input name="capacity" type="number" required value="${existing?.capacity ?? ''}" /></div>
        <div class="field"><label>Status</label><select name="room_status">${statusOptions}</select></div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${existing ? 'Save Changes' : 'Add Room'}</button>
        <button type="button" class="btn btn-ghost" id="room-form-cancel">Cancel</button>
      </div>
    </form>
  `);
  document.getElementById('room-form-cancel').addEventListener('click', closeModal);
  document.getElementById('room-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = formValues(e.target);
    if (existing) await guarded(() => api.put(`/rooms/${existing.room_id}`, v), 'Room updated');
    else await guarded(() => api.post('/rooms', v), 'Room added');
    closeModal();
    viewRooms();
  });
}

async function openRoomAmenities(roomId) {
  const [room, allAmenities] = await Promise.all([api.get(`/rooms/${roomId}`), getAmenities()]);
  const assignedIds = new Set(room.amenities.map((a) => a.amenity_id));
  const chips = room.amenities.map((a) => `<span class="chip">${escapeHtml(a.amenity_name)}<button data-remove="${a.amenity_id}">&times;</button></span>`).join('') || '<span class="muted">None yet.</span>';
  const options = allAmenities.filter((a) => !assignedIds.has(a.amenity_id)).map((a) => `<option value="${a.amenity_id}">${escapeHtml(a.amenity_name)}</option>`).join('');

  openModal(`Amenities — Room ${room.room_number}`, `
    <div class="pill-group" id="amenity-chips">${chips}</div>
    <hr class="hairline" />
    <form id="add-amenity-form" class="form-grid">
      <div class="field"><label>Add amenity</label><select name="amenity_id">${options || '<option value="">All assigned</option>'}</select></div>
      <div class="field" style="align-self:end;"><button type="submit" class="btn btn-brass">Add</button></div>
    </form>
    <div class="form-actions"><button class="btn btn-ghost" id="amenities-close">Close</button></div>
  `);
  document.getElementById('amenities-close').addEventListener('click', () => { closeModal(); viewRooms(); });
  document.getElementById('amenity-chips').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    await guarded(() => api.del(`/rooms/${roomId}/amenities/${btn.dataset.remove}`));
    openRoomAmenities(roomId);
  });
  document.getElementById('add-amenity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = formValues(e.target);
    if (!v.amenity_id) return;
    await guarded(() => api.post(`/rooms/${roomId}/amenities`, v));
    openRoomAmenities(roomId);
  });
}

/* ============================================================
   VIEW: Customers
   ============================================================ */
async function viewCustomers() {
  const search = window.__custSearch || '';
  const customers = await api.get('/customers' + (search ? `?search=${encodeURIComponent(search)}` : ''));

  const rows = customers.map((c) => `
    <tr>
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.email)}</td>
      <td class="mono">${escapeHtml(c.phone)}</td>
      <td>${escapeHtml(c.address || '—')}</td>
      <td>${fmtDate(c.registration_date)}</td>
      <td class="row-actions">
        <button class="btn btn-sm btn-ghost" data-action="view" data-id="${c.customer_id}">History</button>
        <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${c.customer_id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${c.customer_id}">Delete</button>
      </td>
    </tr>`).join('');

  $main.innerHTML = `
    <div class="topbar">
      <div><p class="page-kicker">Operations</p><h1 class="page-title">Guests</h1></div>
      <div class="topbar-actions">
        <input class="search-input" id="cust-search" placeholder="Search guests…" value="${escapeHtml(search)}" />
        <button class="btn btn-primary" id="add-customer-btn">+ Add Guest</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Registered</th><th>Actions</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6" class="empty-state">No guests found.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('add-customer-btn').addEventListener('click', () => openCustomerForm());
  const searchInput = document.getElementById('cust-search');
  let debounce;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { window.__custSearch = e.target.value; viewCustomers(); }, 300);
  });

  $main.querySelectorAll('[data-action]').forEach((btn) => {
    const id = btn.dataset.id;
    if (btn.dataset.action === 'edit') btn.addEventListener('click', async () => openCustomerForm(await api.get(`/customers/${id}`)));
    if (btn.dataset.action === 'delete') btn.addEventListener('click', async () => {
      if (!confirm('Delete this guest?')) return;
      await guarded(() => api.del(`/customers/${id}`), 'Guest removed');
      viewCustomers();
    });
    if (btn.dataset.action === 'view') btn.addEventListener('click', () => openCustomerHistory(id));
  });
}

async function openCustomerForm(existing) {
  openModal(existing ? 'Edit Guest' : 'Add Guest', `
    <form id="customer-form">
      <div class="form-grid">
        <div class="field"><label>Name</label><input name="name" required value="${escapeHtml(existing?.name || '')}" /></div>
        <div class="field"><label>Email</label><input name="email" type="email" required value="${escapeHtml(existing?.email || '')}" /></div>
        <div class="field"><label>Phone</label><input name="phone" required value="${escapeHtml(existing?.phone || '')}" /></div>
        <div class="field" style="grid-column:1/-1;"><label>Address</label><input name="address" value="${escapeHtml(existing?.address || '')}" /></div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${existing ? 'Save Changes' : 'Add Guest'}</button>
        <button type="button" class="btn btn-ghost" id="customer-form-cancel">Cancel</button>
      </div>
    </form>
  `);
  document.getElementById('customer-form-cancel').addEventListener('click', closeModal);
  document.getElementById('customer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = formValues(e.target);
    if (existing) await guarded(() => api.put(`/customers/${existing.customer_id}`, v), 'Guest updated');
    else await guarded(() => api.post('/customers', v), 'Guest added');
    closeModal();
    viewCustomers();
  });
}

async function openCustomerHistory(id) {
  const c = await api.get(`/customers/${id}`);
  const rows = c.reservations.map((r) => `<li>${fmtDate(r.check_in_date)} → ${fmtDate(r.check_out_date)} · Room ${escapeHtml(r.room_number)} · ${tag(r.reservation_status)} · ${fmtMoney(r.total_amount)}</li>`).join('') || '<li class="muted">No reservations yet.</li>';
  openModal(`${c.name} — Stay History`, `<ul>${rows}</ul><div class="form-actions"><button class="btn btn-ghost" id="history-close">Close</button></div>`);
  document.getElementById('history-close').addEventListener('click', closeModal);
}

/* ============================================================
   VIEW: Payments
   ============================================================ */
async function viewPayments() {
  const filterStatus = window.__payFilter || '';
  const payments = await api.get('/payments' + (filterStatus ? `?status=${filterStatus}` : ''));
  const statuses = ['', 'Pending', 'Completed', 'Failed'];
  const filterOptions = statuses.map((s) => `<option value="${s}" ${s === filterStatus ? 'selected' : ''}>${s || 'All statuses'}</option>`).join('');

  const rows = payments.map((p) => `
    <tr>
      <td class="mono">#${p.payment_id}</td>
      <td>${escapeHtml(p.customer_name)}</td>
      <td class="mono">${escapeHtml(p.room_number)}</td>
      <td>${fmtDate(p.payment_date)}</td>
      <td>${fmtMoney(p.amount)}</td>
      <td>${escapeHtml(p.payment_method)}</td>
      <td>${tag(p.payment_status)}</td>
      <td class="row-actions">
        ${p.payment_status !== 'Completed' ? `<button class="btn btn-sm btn-primary" data-action="complete" data-id="${p.payment_id}">Mark Paid</button>` : ''}
        ${p.payment_status === 'Pending' ? `<button class="btn btn-sm btn-danger" data-action="fail" data-id="${p.payment_id}">Mark Failed</button>` : ''}
      </td>
    </tr>`).join('');

  $main.innerHTML = `
    <div class="topbar">
      <div><p class="page-kicker">Revenue</p><h1 class="page-title">Payments</h1></div>
      <div class="topbar-actions">
        <select class="search-input" id="pay-status-filter">${filterOptions}</select>
        <button class="btn btn-primary" id="add-payment-btn">+ Record Payment</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="8" class="empty-state">No payments recorded.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('pay-status-filter').addEventListener('change', (e) => { window.__payFilter = e.target.value; viewPayments(); });
  document.getElementById('add-payment-btn').addEventListener('click', openPaymentForm);
  $main.querySelectorAll('[data-action]').forEach((btn) => {
    const id = btn.dataset.id;
    const status = btn.dataset.action === 'complete' ? 'Completed' : 'Failed';
    btn.addEventListener('click', async () => {
      await guarded(() => api.put(`/payments/${id}`, { payment_status: status }), 'Payment updated');
      viewPayments();
    });
  });
}

async function openPaymentForm() {
  const reservations = await api.get('/reservations');
  const options = reservations.map((r) => `<option value="${r.reservation_id}">#${r.reservation_id} — ${escapeHtml(r.customer_name)} (Room ${escapeHtml(r.room_number)})</option>`).join('');
  const methods = ['Cash', 'Card', 'UPI', 'NetBanking'].map((m) => `<option value="${m}">${m}</option>`).join('');

  openModal('Record Payment', `
    <form id="payment-form">
      <div class="form-grid">
        <div class="field" style="grid-column:1/-1;"><label>Reservation</label><select name="reservation_id" required>${options}</select></div>
        <div class="field"><label>Amount</label><input name="amount" type="number" step="0.01" required /></div>
        <div class="field"><label>Payment Date</label><input name="payment_date" type="date" required value="${new Date().toISOString().slice(0, 10)}" /></div>
        <div class="field"><label>Method</label><select name="payment_method">${methods}</select></div>
        <div class="field"><label>Transaction ID</label><input name="transaction_id" placeholder="optional" /></div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Save Payment</button>
        <button type="button" class="btn btn-ghost" id="payment-form-cancel">Cancel</button>
      </div>
    </form>
  `);
  document.getElementById('payment-form-cancel').addEventListener('click', closeModal);
  document.getElementById('payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = formValues(e.target);
    await guarded(() => api.post('/payments', v), 'Payment recorded');
    closeModal();
    viewPayments();
  });
}

/* ============================================================
   VIEW: Cancellations (read-only)
   ============================================================ */
async function viewCancellations() {
  const rows = (await api.get('/cancellations')).map((c) => `
    <tr>
      <td class="mono">#${c.reservation_id}</td>
      <td>${escapeHtml(c.customer_name)}</td>
      <td class="mono">${escapeHtml(c.room_number)}</td>
      <td>${fmtDate(c.cancellation_date)}</td>
      <td>${escapeHtml(c.reason || '—')}</td>
      <td>${c.refund_amount != null ? fmtMoney(c.refund_amount) : '—'}</td>
      <td>${escapeHtml(c.cancellation_policy_applied || '—')}</td>
    </tr>`).join('');

  $main.innerHTML = `
    <div class="topbar"><div><p class="page-kicker">Revenue</p><h1 class="page-title">Cancellations</h1></div></div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Reservation</th><th>Guest</th><th>Room</th><th>Date</th><th>Reason</th><th>Refund</th><th>Policy</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="7" class="empty-state">No cancellations on record.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;
}

/* ============================================================
   VIEW: Room Service
   ============================================================ */
async function viewRoomServices() {
  const filterStatus = window.__svcFilter || '';
  const services = await api.get('/room-services' + (filterStatus ? `?status=${filterStatus}` : ''));
  const statuses = ['', 'Requested', 'Completed'];
  const filterOptions = statuses.map((s) => `<option value="${s}" ${s === filterStatus ? 'selected' : ''}>${s || 'All statuses'}</option>`).join('');

  const rows = services.map((s) => `
    <tr>
      <td>${escapeHtml(s.customer_name)}</td>
      <td class="mono">${escapeHtml(s.room_number)}</td>
      <td>${escapeHtml(s.service_type)}</td>
      <td>${fmtDate(s.service_date)}</td>
      <td>${fmtMoney(s.amount)}</td>
      <td>${tag(s.status)}</td>
      <td>${s.status === 'Requested' ? `<button class="btn btn-sm btn-primary" data-id="${s.service_id}">Mark Completed</button>` : ''}</td>
    </tr>`).join('');

  $main.innerHTML = `
    <div class="topbar">
      <div><p class="page-kicker">Guest Experience</p><h1 class="page-title">Room Service</h1></div>
      <div class="topbar-actions">
        <select class="search-input" id="svc-status-filter">${filterOptions}</select>
        <button class="btn btn-primary" id="add-service-btn">+ New Request</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Guest</th><th>Room</th><th>Type</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>${rows || `<tr><td colspan="7" class="empty-state">No service requests yet.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('svc-status-filter').addEventListener('change', (e) => { window.__svcFilter = e.target.value; viewRoomServices(); });
  document.getElementById('add-service-btn').addEventListener('click', openRoomServiceForm);
  $main.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await guarded(() => api.put(`/room-services/${btn.dataset.id}/complete`), 'Marked completed');
      viewRoomServices();
    });
  });
}

async function openRoomServiceForm() {
  const reservations = await api.get('/reservations?status=Checked_in');
  const options = reservations.map((r) => `<option value="${r.reservation_id}">#${r.reservation_id} — ${escapeHtml(r.customer_name)} (Room ${escapeHtml(r.room_number)})</option>`).join('');
  const types = ['Food', 'Laundry', 'Cleaning', 'Other'].map((t) => `<option value="${t}">${t}</option>`).join('');

  openModal('New Room Service Request', `
    <form id="service-form">
      <div class="form-grid">
        <div class="field" style="grid-column:1/-1;"><label>Reservation (checked-in guests)</label><select name="reservation_id" required>${options || '<option value="">No checked-in guests</option>'}</select></div>
        <div class="field"><label>Service Type</label><select name="service_type">${types}</select></div>
        <div class="field"><label>Date</label><input name="service_date" type="date" required value="${new Date().toISOString().slice(0, 10)}" /></div>
        <div class="field"><label>Amount</label><input name="amount" type="number" step="0.01" value="0.00" required /></div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Create Request</button>
        <button type="button" class="btn btn-ghost" id="service-form-cancel">Cancel</button>
      </div>
    </form>
  `);
  document.getElementById('service-form-cancel').addEventListener('click', closeModal);
  document.getElementById('service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = formValues(e.target);
    await guarded(() => api.post('/room-services', v), 'Request created');
    closeModal();
    viewRoomServices();
  });
}

/* ============================================================
   VIEW: Feedback
   ============================================================ */
async function viewFeedback() {
  const feedback = await api.get('/feedback');
  const rows = feedback.map((f) => `
    <tr>
      <td>${escapeHtml(f.customer_name)}</td>
      <td class="mono">${escapeHtml(f.room_number)}</td>
      <td>${stars(f.rating)}</td>
      <td>${escapeHtml(f.comments || '—')}</td>
      <td>${fmtDate(f.feedback_date)}</td>
    </tr>`).join('');

  $main.innerHTML = `
    <div class="topbar">
      <div><p class="page-kicker">Guest Experience</p><h1 class="page-title">Feedback</h1></div>
      <div class="topbar-actions"><button class="btn btn-primary" id="add-feedback-btn">+ Add Feedback</button></div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Guest</th><th>Room</th><th>Rating</th><th>Comments</th><th>Date</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="5" class="empty-state">No feedback submitted yet.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('add-feedback-btn').addEventListener('click', openFeedbackForm);
}

async function openFeedbackForm() {
  const reservations = await api.get('/reservations?status=Checked_out');
  const options = reservations.map((r) => `<option value="${r.reservation_id}">#${r.reservation_id} — ${escapeHtml(r.customer_name)} (Room ${escapeHtml(r.room_number)})</option>`).join('');
  const ratingOptions = [5, 4, 3, 2, 1].map((n) => `<option value="${n}">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</option>`).join('');

  openModal('Add Feedback', `
    <form id="feedback-form">
      <div class="form-grid">
        <div class="field" style="grid-column:1/-1;"><label>Reservation (checked-out stays)</label><select name="reservation_id" required>${options || '<option value="">No completed stays yet</option>'}</select></div>
        <div class="field"><label>Rating</label><select name="rating">${ratingOptions}</select></div>
        <div class="field" style="grid-column:1/-1;"><label>Comments</label><textarea name="comments" placeholder="How was the stay?"></textarea></div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Submit Feedback</button>
        <button type="button" class="btn btn-ghost" id="feedback-form-cancel">Cancel</button>
      </div>
    </form>
  `);
  document.getElementById('feedback-form-cancel').addEventListener('click', closeModal);
  document.getElementById('feedback-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = formValues(e.target);
    await guarded(() => api.post('/feedback', v), 'Feedback saved');
    closeModal();
    viewFeedback();
  });
}

/* ============================================================
   VIEW: Room Types
   ============================================================ */
async function viewRoomTypes() {
  const types = await getRoomTypes();
  const rows = types.map((t) => `
    <tr>
      <td>${escapeHtml(t.type_name)}</td>
      <td>${escapeHtml(t.description || '—')}</td>
      <td>${fmtMoney(t.base_price)}</td>
      <td>${t.capacity} guests</td>
      <td>${t.room_count} rooms</td>
      <td class="row-actions">
        <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${t.room_type_id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${t.room_type_id}">Delete</button>
      </td>
    </tr>`).join('');

  $main.innerHTML = `
    <div class="topbar">
      <div><p class="page-kicker">Property</p><h1 class="page-title">Room Types</h1></div>
      <div class="topbar-actions"><button class="btn btn-primary" id="add-type-btn">+ Add Room Type</button></div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Type</th><th>Description</th><th>Base Price</th><th>Capacity</th><th>Rooms</th><th>Actions</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6" class="empty-state">No room types yet.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('add-type-btn').addEventListener('click', () => openRoomTypeForm());
  $main.querySelectorAll('[data-action]').forEach((btn) => {
    const id = btn.dataset.id;
    if (btn.dataset.action === 'edit') btn.addEventListener('click', () => openRoomTypeForm(types.find((t) => t.room_type_id == id)));
    if (btn.dataset.action === 'delete') btn.addEventListener('click', async () => {
      if (!confirm('Delete this room type?')) return;
      await guarded(() => api.del(`/room-types/${id}`), 'Room type deleted');
      viewRoomTypes();
    });
  });
}

async function openRoomTypeForm(existing) {
  openModal(existing ? 'Edit Room Type' : 'Add Room Type', `
    <form id="type-form">
      <div class="form-grid">
        <div class="field"><label>Name</label><input name="type_name" required value="${escapeHtml(existing?.type_name || '')}" /></div>
        <div class="field"><label>Base Price</label><input name="base_price" type="number" step="0.01" required value="${existing?.base_price ?? ''}" /></div>
        <div class="field"><label>Capacity</label><input name="capacity" type="number" required value="${existing?.capacity ?? ''}" /></div>
        <div class="field" style="grid-column:1/-1;"><label>Description</label><textarea name="description">${escapeHtml(existing?.description || '')}</textarea></div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${existing ? 'Save Changes' : 'Add Type'}</button>
        <button type="button" class="btn btn-ghost" id="type-form-cancel">Cancel</button>
      </div>
    </form>
  `);
  document.getElementById('type-form-cancel').addEventListener('click', closeModal);
  document.getElementById('type-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = formValues(e.target);
    if (existing) await guarded(() => api.put(`/room-types/${existing.room_type_id}`, v), 'Room type updated');
    else await guarded(() => api.post('/room-types', v), 'Room type added');
    closeModal();
    viewRoomTypes();
  });
}

/* ============================================================
   VIEW: Amenities
   ============================================================ */
async function viewAmenities() {
  const amenities = await getAmenities();
  const rows = amenities.map((a) => `
    <tr>
      <td>${escapeHtml(a.amenity_name)}</td>
      <td>${escapeHtml(a.description || '—')}</td>
      <td class="row-actions"><button class="btn btn-sm btn-danger" data-id="${a.amenity_id}">Delete</button></td>
    </tr>`).join('');

  $main.innerHTML = `
    <div class="topbar">
      <div><p class="page-kicker">Property</p><h1 class="page-title">Amenities</h1></div>
      <div class="topbar-actions"><button class="btn btn-primary" id="add-amenity-btn">+ Add Amenity</button></div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Amenity</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="3" class="empty-state">No amenities yet.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('add-amenity-btn').addEventListener('click', () => {
    openModal('Add Amenity', `
      <form id="amenity-form">
        <div class="form-grid">
          <div class="field"><label>Name</label><input name="amenity_name" required /></div>
          <div class="field" style="grid-column:1/-1;"><label>Description</label><input name="description" /></div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Add</button>
          <button type="button" class="btn btn-ghost" id="amenity-form-cancel">Cancel</button>
        </div>
      </form>
    `);
    document.getElementById('amenity-form-cancel').addEventListener('click', closeModal);
    document.getElementById('amenity-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await guarded(() => api.post('/amenities', formValues(e.target)), 'Amenity added');
      closeModal();
      viewAmenities();
    });
  });
  $main.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this amenity?')) return;
      await guarded(() => api.del(`/amenities/${btn.dataset.id}`), 'Amenity deleted');
      viewAmenities();
    });
  });
}

/* ============================================================
   VIEW: Staff
   ============================================================ */
async function viewStaff() {
  const staff = await getStaff();
  const rows = staff.map((s) => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.role)}</td>
      <td class="mono">${escapeHtml(s.phone)}</td>
      <td>${escapeHtml(s.email || '—')}</td>
      <td>${fmtDate(s.join_date)}</td>
      <td class="row-actions">
        <button class="btn btn-sm btn-ghost" data-action="edit" data-id="${s.staff_id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${s.staff_id}">Delete</button>
      </td>
    </tr>`).join('');

  $main.innerHTML = `
    <div class="topbar">
      <div><p class="page-kicker">Property</p><h1 class="page-title">Staff</h1></div>
      <div class="topbar-actions"><button class="btn btn-primary" id="add-staff-btn">+ Add Staff</button></div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6" class="empty-state">No staff on file.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('add-staff-btn').addEventListener('click', () => openStaffForm());
  $main.querySelectorAll('[data-action]').forEach((btn) => {
    const id = btn.dataset.id;
    if (btn.dataset.action === 'edit') btn.addEventListener('click', () => openStaffForm(staff.find((s) => s.staff_id == id)));
    if (btn.dataset.action === 'delete') btn.addEventListener('click', async () => {
      if (!confirm('Remove this staff member?')) return;
      await guarded(() => api.del(`/staff/${id}`), 'Staff member removed');
      viewStaff();
    });
  });
}

async function openStaffForm(existing) {
  const roles = ['Admin', 'Receptionist', 'Manager', 'Housekeeping'];
  const roleOptions = roles.map((r) => `<option value="${r}" ${existing?.role === r ? 'selected' : ''}>${r}</option>`).join('');
  openModal(existing ? 'Edit Staff' : 'Add Staff', `
    <form id="staff-form">
      <div class="form-grid">
        <div class="field"><label>Name</label><input name="name" required value="${escapeHtml(existing?.name || '')}" /></div>
        <div class="field"><label>Role</label><select name="role">${roleOptions}</select></div>
        <div class="field"><label>Phone</label><input name="phone" required value="${escapeHtml(existing?.phone || '')}" /></div>
        <div class="field"><label>Email</label><input name="email" type="email" value="${escapeHtml(existing?.email || '')}" /></div>
        <div class="field"><label>Join Date</label><input name="join_date" type="date" required value="${existing?.join_date || new Date().toISOString().slice(0, 10)}" /></div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${existing ? 'Save Changes' : 'Add Staff'}</button>
        <button type="button" class="btn btn-ghost" id="staff-form-cancel">Cancel</button>
      </div>
    </form>
  `);
  document.getElementById('staff-form-cancel').addEventListener('click', closeModal);
  document.getElementById('staff-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = formValues(e.target);
    if (existing) await guarded(() => api.put(`/staff/${existing.staff_id}`, v), 'Staff updated');
    else await guarded(() => api.post('/staff', v), 'Staff added');
    closeModal();
    viewStaff();
  });
}

/* ============================================================
   Boot
   ============================================================ */
render();
