const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express(); // Aquí defines app
const userRouter = require('../routes/userRouter'); // ajustá la ruta según dónde esté

app.use(express.json()); // para parsear JSON en los requests
app.use('/api/user', userRouter);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

module.exports = pool;
