import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM staff ORDER BY name ASC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email, role, join_date } = req.body;
    if (!name || !phone || !role || !join_date) {
      return res.status(400).json({ error: 'name, phone, role and join_date are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO staff (name, phone, email, role, join_date) VALUES (?, ?, ?, ?, ?)',
      [name, phone, email || null, role, join_date]
    );
    const [rows] = await pool.query('SELECT * FROM staff WHERE staff_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, phone, email, role, join_date } = req.body;
    await pool.query(
      'UPDATE staff SET name = ?, phone = ?, email = ?, role = ?, join_date = ? WHERE staff_id = ?',
      [name, phone, email || null, role, join_date, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM staff WHERE staff_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Staff member not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM staff WHERE staff_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Staff member not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
