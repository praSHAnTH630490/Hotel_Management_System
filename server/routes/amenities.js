import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM amenity ORDER BY amenity_name ASC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { amenity_name, description } = req.body;
    if (!amenity_name) return res.status(400).json({ error: 'amenity_name is required' });
    const [result] = await pool.query(
      'INSERT INTO amenity (amenity_name, description) VALUES (?, ?)',
      [amenity_name, description || null]
    );
    const [rows] = await pool.query('SELECT * FROM amenity WHERE amenity_id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM amenity WHERE amenity_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Amenity not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
