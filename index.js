const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const dotenv     = require('dotenv');
const connectDB  = require('./config/db');

dotenv.config();
connectDB();

const app = express();

/* ── Security ── */
app.use(helmet());
app.use(cors({
  origin:      process.env.NODE_ENV === 'production'
                 ? 'https://sparktraineeships.com'
                 : 'http://localhost:5173',
  credentials: true,
}));

/* ── Rate limiting ── */
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
}));

// Stricter limit for auth endpoints
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { message: 'Too many auth attempts — please wait before trying again.' },
}));

/* ── Logging ── */
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

/* ── Body parsing ── */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

/* ── Routes ── */
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/match-vector', require('./routes/matchVector'));

/* ── Health check ── */
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', env: process.env.NODE_ENV, time: new Date() })
);

/* ── 404 handler ── */
app.use((req, res) =>
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` })
);

/* ── Global error handler ── */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`)
);
