import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/stats', async (req, res, next) => {
  try {
    const [[roomCounts]] = await pool.query(
      `SELECT
        COUNT(*) AS total_rooms,
        SUM(room_status = 'Available') AS available_rooms,
        SUM(room_status = 'Occupied') AS occupied_rooms,
        SUM(room_status = 'Maintenance') AS maintenance_rooms
       FROM room`
    );
    const [[todayActivity]] = await pool.query(
      `SELECT
        SUM(check_in_date = CURDATE() AND reservation_status IN ('Booked','Checked_in')) AS arrivals_today,
        SUM(check_out_date = CURDATE() AND reservation_status IN ('Checked_in','Checked_out')) AS departures_today
       FROM reservation`
    );
    const [[revenue]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS revenue_this_month
       FROM payment
       WHERE payment_status = 'Completed'
       AND MONTH(payment_date) = MONTH(CURDATE()) AND YEAR(payment_date) = YEAR(CURDATE())`
    );
    const [[ratingRow]] = await pool.query('SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS feedback_count FROM feedback');
    const [[customerCount]] = await pool.query('SELECT COUNT(*) AS total_customers FROM customer');
    const [[pendingPayments]] = await pool.query("SELECT COUNT(*) AS pending_payments FROM payment WHERE payment_status = 'Pending'");
    const [[openServices]] = await pool.query("SELECT COUNT(*) AS open_service_requests FROM room_service WHERE status = 'Requested'");

    const [recentReservations] = await pool.query(
      `SELECT res.reservation_id, res.check_in_date, res.check_out_date, res.reservation_status, res.total_amount,
              c.name AS customer_name, rm.room_number
       FROM reservation res
       JOIN customer c ON c.customer_id = res.customer_id
       JOIN room rm ON rm.room_id = res.room_id
       ORDER BY res.booking_date DESC, res.reservation_id DESC
       LIMIT 6`
    );

    res.json({
      ...roomCounts,
      ...todayActivity,
      ...revenue,
      ...ratingRow,
      ...customerCount,
      ...pendingPayments,
      ...openServices,
      recent_reservations: recentReservations,
    });
  } catch (err) { next(err); }
});

export default router;
