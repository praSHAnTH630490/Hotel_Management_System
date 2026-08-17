import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import customersRouter from './routes/customers.js';
import roomTypesRouter from './routes/roomTypes.js';
import roomsRouter from './routes/rooms.js';
import staffRouter from './routes/staff.js';
import amenitiesRouter from './routes/amenities.js';
import reservationsRouter from './routes/reservations.js';
import paymentsRouter from './routes/payments.js';
import cancellationsRouter from './routes/cancellations.js';
import feedbackRouter from './routes/feedback.js';
import roomServiceRouter from './routes/roomService.js';
import dashboardRouter from './routes/dashboard.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

app.use('/api/customers', customersRouter);
app.use('/api/room-types', roomTypesRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/amenities', amenitiesRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/cancellations', cancellationsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/room-services', roomServiceRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve the frontend
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.sqlMessage || err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Aurelia Hotel server running at http://localhost:${PORT}`);
});
