import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

const FEEDBACK_SELECT = `
  SELECT f.*, c.name AS customer_name, rm.room_number
  FROM feedback f
  JOIN reservation res ON res.reservation_id = f.reservation_id
  JOIN customer c ON c.customer_id = res.customer_id
  JOIN room rm ON rm.room_id = res.room_id
`;

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(FEEDBACK_SELECT + ' ORDER BY f.feedback_date DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { reservation_id, rating, comments } = req.body;
    if (!reservation_id || !rating) {
      return res.status(400).json({ error: 'reservation_id and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }
    const [result] = await pool.query(
      'INSERT INTO feedback (reservation_id, rating, comments) VALUES (?, ?, ?)',
      [reservation_id, rating, comments || null]
    );
    const [rows] = await pool.query(FEEDBACK_SELECT + ' WHERE f.feedback_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
