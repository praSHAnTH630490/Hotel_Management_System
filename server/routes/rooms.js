import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

const ROOM_SELECT = `
  SELECT r.*, rt.type_name, rt.base_price, rt.description AS type_description
  FROM room r JOIN room_type rt ON rt.room_type_id = r.room_type_id
`;

// GET /api/rooms  (optional ?status=Available&room_type_id=2)
router.get('/', async (req, res, next) => {
  try {
    const { status, room_type_id } = req.query;
    const clauses = [];
    const params = [];
    if (status) { clauses.push('r.room_status = ?'); params.push(status); }
    if (room_type_id) { clauses.push('r.room_type_id = ?'); params.push(room_type_id); }
    const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await pool.query(ROOM_SELECT + where + ' ORDER BY r.room_number ASC', params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/rooms/available?checkIn=2026-08-10&checkOut=2026-08-13
router.get('/available', async (req, res, next) => {
  try {
    const { checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'checkIn and checkOut query params are required' });
    }
    const [rows] = await pool.query(
      `${ROOM_SELECT}
       WHERE r.room_status != 'Maintenance'
       AND r.room_id NOT IN (
         SELECT room_id FROM reservation
         WHERE reservation_status IN ('Booked','Checked_in')
         AND check_in_date < ? AND check_out_date > ?
       )
       ORDER BY rt.base_price ASC`,
      [checkOut, checkIn]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(ROOM_SELECT + ' WHERE r.room_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Room not found' });
    const [amenities] = await pool.query(
      `SELECT a.* FROM amenity a JOIN room_amenity ra ON ra.amenity_id = a.amenity_id WHERE ra.room_id = ?`,
      [req.params.id]
    );
    res.json({ ...rows[0], amenities });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { room_number, room_type_id, price, capacity, room_status } = req.body;
    if (!room_number || !room_type_id || price == null || !capacity) {
      return res.status(400).json({ error: 'room_number, room_type_id, price and capacity are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO room (room_number, room_type_id, price, capacity, room_status) VALUES (?, ?, ?, ?, ?)',
      [room_number, room_type_id, price, capacity, room_status || 'Available']
    );
    const [rows] = await pool.query(ROOM_SELECT + ' WHERE r.room_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Room number already exists' });
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { room_number, room_type_id, price, capacity, room_status } = req.body;
    await pool.query(
      'UPDATE room SET room_number = ?, room_type_id = ?, price = ?, capacity = ?, room_status = ? WHERE room_id = ?',
      [room_number, room_type_id, price, capacity, room_status, req.params.id]
    );
    const [rows] = await pool.query(ROOM_SELECT + ' WHERE r.room_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Room not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM room WHERE room_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Room not found' });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'Room has reservations and cannot be deleted' });
    }
    next(err);
  }
});

// Amenity assignment for a room
router.post('/:id/amenities', async (req, res, next) => {
  try {
    const { amenity_id } = req.body;
    await pool.query('INSERT IGNORE INTO room_amenity (room_id, amenity_id) VALUES (?, ?)', [req.params.id, amenity_id]);
    const [amenities] = await pool.query(
      `SELECT a.* FROM amenity a JOIN room_amenity ra ON ra.amenity_id = a.amenity_id WHERE ra.room_id = ?`,
      [req.params.id]
    );
    res.status(201).json(amenities);
  } catch (err) { next(err); }
});

router.delete('/:id/amenities/:amenityId', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM room_amenity WHERE room_id = ? AND amenity_id = ?', [req.params.id, req.params.amenityId]);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
