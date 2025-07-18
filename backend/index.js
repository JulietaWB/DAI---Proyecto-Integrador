const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Importar router
const userRouter = require('./routes/userRouter');
const eventRouter = require('./routes/eventRouter');
const eventLocationRouter = require('./routes/eventLocationRouter');

// Usar routers
app.use('/api/user', userRouter);
app.use('/api/event', eventRouter);
app.use('/api/event-location', eventLocationRouter);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
