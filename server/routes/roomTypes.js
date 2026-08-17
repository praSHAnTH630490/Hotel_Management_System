import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT rt.*, COUNT(r.room_id) AS room_count
       FROM room_type rt LEFT JOIN room r ON r.room_type_id = rt.room_type_id
       GROUP BY rt.room_type_id ORDER BY rt.base_price ASC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { type_name, description, base_price, capacity } = req.body;
    if (!type_name || base_price == null || !capacity) {
      return res.status(400).json({ error: 'type_name, base_price and capacity are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO room_type (type_name, description, base_price, capacity) VALUES (?, ?, ?, ?)',
      [type_name, description || null, base_price, capacity]
    );
    const [rows] = await pool.query('SELECT * FROM room_type WHERE room_type_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { type_name, description, base_price, capacity } = req.body;
    await pool.query(
      'UPDATE room_type SET type_name = ?, description = ?, base_price = ?, capacity = ? WHERE room_type_id = ?',
      [type_name, description || null, base_price, capacity, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM room_type WHERE room_type_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Room type not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM room_type WHERE room_type_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Room type not found' });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'Room type is used by existing rooms and cannot be deleted' });
    }
    next(err);
  }
});

export default router;
