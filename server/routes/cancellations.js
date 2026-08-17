import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT can.*, c.name AS customer_name, rm.room_number
       FROM cancellation can
       JOIN reservation res ON res.reservation_id = can.reservation_id
       JOIN customer c ON c.customer_id = res.customer_id
       JOIN room rm ON rm.room_id = res.room_id
       ORDER BY can.cancellation_date DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
