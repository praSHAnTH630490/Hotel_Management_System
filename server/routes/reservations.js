import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

const RESERVATION_SELECT = `
  SELECT res.*, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
         rm.room_number, rt.type_name
  FROM reservation res
  JOIN customer c ON c.customer_id = res.customer_id
  JOIN room rm ON rm.room_id = res.room_id
  JOIN room_type rt ON rt.room_type_id = rm.room_type_id
`;

// GET /api/reservations (optional ?status=Booked&customer_id=1)
router.get('/', async (req, res, next) => {
  try {
    const { status, customer_id } = req.query;
    const clauses = [];
    const params = [];
    if (status) { clauses.push('res.reservation_status = ?'); params.push(status); }
    if (customer_id) { clauses.push('res.customer_id = ?'); params.push(customer_id); }
    const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await pool.query(RESERVATION_SELECT + where + ' ORDER BY res.check_in_date DESC', params);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(RESERVATION_SELECT + ' WHERE res.reservation_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Reservation not found' });
    const [payments] = await pool.query('SELECT * FROM payment WHERE reservation_id = ?', [req.params.id]);
    const [services] = await pool.query('SELECT * FROM room_service WHERE reservation_id = ?', [req.params.id]);
    const [cio] = await pool.query('SELECT * FROM check_in_out WHERE reservation_id = ?', [req.params.id]);
    const [feedback] = await pool.query('SELECT * FROM feedback WHERE reservation_id = ?', [req.params.id]);
    res.json({ ...rows[0], payments, services, check_in_out: cio, feedback });
  } catch (err) { next(err); }
});

// POST /api/reservations  — create a new booking
router.post('/', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { customer_id, room_id, check_in_date, check_out_date, total_amount } = req.body;
    if (!customer_id || !room_id || !check_in_date || !check_out_date) {
      conn.release();
      return res.status(400).json({ error: 'customer_id, room_id, check_in_date and check_out_date are required' });
    }
    if (new Date(check_out_date) <= new Date(check_in_date)) {
      conn.release();
      return res.status(400).json({ error: 'check_out_date must be after check_in_date' });
    }

    await conn.beginTransaction();

    const [clash] = await conn.query(
      `SELECT reservation_id FROM reservation
       WHERE room_id = ? AND reservation_status IN ('Booked','Checked_in')
       AND check_in_date < ? AND check_out_date > ? FOR UPDATE`,
      [room_id, check_out_date, check_in_date]
    );
    if (clash.length) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({ error: 'Room is not available for the selected dates' });
    }

    let amount = total_amount;
    if (amount == null) {
      const [[room]] = await conn.query('SELECT price FROM room WHERE room_id = ?', [room_id]);
      if (!room) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ error: 'Room not found' });
      }
      const nights = Math.round((new Date(check_out_date) - new Date(check_in_date)) / 86400000);
      amount = Number(room.price) * nights;
    }

    const [result] = await conn.query(
      `INSERT INTO reservation (customer_id, room_id, check_in_date, check_out_date, total_amount, reservation_status)
       VALUES (?, ?, ?, ?, ?, 'Booked')`,
      [customer_id, room_id, check_in_date, check_out_date, amount]
    );

    await conn.commit();
    const [rows] = await pool.query(RESERVATION_SELECT + ' WHERE res.reservation_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { check_in_date, check_out_date, total_amount } = req.body;
    await pool.query(
      'UPDATE reservation SET check_in_date = ?, check_out_date = ?, total_amount = ? WHERE reservation_id = ?',
      [check_in_date, check_out_date, total_amount, req.params.id]
    );
    const [rows] = await pool.query(RESERVATION_SELECT + ' WHERE res.reservation_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Reservation not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/reservations/:id/checkin  { staff_id }
router.post('/:id/checkin', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { staff_id } = req.body;
    await conn.beginTransaction();
    const [[reservation]] = await conn.query('SELECT * FROM reservation WHERE reservation_id = ? FOR UPDATE', [req.params.id]);
    if (!reservation) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Reservation not found' }); }
    if (reservation.reservation_status !== 'Booked') {
      await conn.rollback(); conn.release();
      return res.status(409).json({ error: `Cannot check in a reservation with status ${reservation.reservation_status}` });
    }
    await conn.query("UPDATE reservation SET reservation_status = 'Checked_in' WHERE reservation_id = ?", [req.params.id]);
    await conn.query("UPDATE room SET room_status = 'Occupied' WHERE room_id = ?", [reservation.room_id]);
    await conn.query(
      'INSERT INTO check_in_out (reservation_id, check_in_time, checked_in_by) VALUES (?, NOW(), ?)',
      [req.params.id, staff_id || null]
    );
    await conn.commit();
    const [rows] = await pool.query(RESERVATION_SELECT + ' WHERE res.reservation_id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { await conn.rollback(); next(err); } finally { conn.release(); }
});

// POST /api/reservations/:id/checkout  { staff_id }
router.post('/:id/checkout', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { staff_id } = req.body;
    await conn.beginTransaction();
    const [[reservation]] = await conn.query('SELECT * FROM reservation WHERE reservation_id = ? FOR UPDATE', [req.params.id]);
    if (!reservation) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Reservation not found' }); }
    if (reservation.reservation_status !== 'Checked_in') {
      await conn.rollback(); conn.release();
      return res.status(409).json({ error: `Cannot check out a reservation with status ${reservation.reservation_status}` });
    }
    await conn.query("UPDATE reservation SET reservation_status = 'Checked_out' WHERE reservation_id = ?", [req.params.id]);
    await conn.query("UPDATE room SET room_status = 'Available' WHERE room_id = ?", [reservation.room_id]);
    const [existingCio] = await conn.query('SELECT cio_id FROM check_in_out WHERE reservation_id = ?', [req.params.id]);
    if (existingCio.length) {
      await conn.query('UPDATE check_in_out SET check_out_time = NOW(), checked_out_by = ? WHERE reservation_id = ?', [staff_id || null, req.params.id]);
    } else {
      await conn.query('INSERT INTO check_in_out (reservation_id, check_out_time, checked_out_by) VALUES (?, NOW(), ?)', [req.params.id, staff_id || null]);
    }
    await conn.commit();
    const [rows] = await pool.query(RESERVATION_SELECT + ' WHERE res.reservation_id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { await conn.rollback(); next(err); } finally { conn.release(); }
});

// POST /api/reservations/:id/cancel  { reason, refund_amount, cancellation_policy_applied }
router.post('/:id/cancel', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { reason, refund_amount, cancellation_policy_applied } = req.body;
    await conn.beginTransaction();
    const [[reservation]] = await conn.query('SELECT * FROM reservation WHERE reservation_id = ? FOR UPDATE', [req.params.id]);
    if (!reservation) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Reservation not found' }); }
    if (['Checked_out', 'Cancelled'].includes(reservation.reservation_status)) {
      await conn.rollback(); conn.release();
      return res.status(409).json({ error: `Cannot cancel a reservation with status ${reservation.reservation_status}` });
    }
    await conn.query("UPDATE reservation SET reservation_status = 'Cancelled' WHERE reservation_id = ?", [req.params.id]);
    if (reservation.reservation_status === 'Checked_in') {
      await conn.query("UPDATE room SET room_status = 'Available' WHERE room_id = ?", [reservation.room_id]);
    }
    await conn.query(
      `INSERT INTO cancellation (reservation_id, cancellation_date, reason, refund_amount, cancellation_policy_applied)
       VALUES (?, CURDATE(), ?, ?, ?)`,
      [req.params.id, reason || null, refund_amount || null, cancellation_policy_applied || null]
    );
    await conn.commit();
    const [rows] = await pool.query(RESERVATION_SELECT + ' WHERE res.reservation_id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { await conn.rollback(); next(err); } finally { conn.release(); }
});

export default router;
