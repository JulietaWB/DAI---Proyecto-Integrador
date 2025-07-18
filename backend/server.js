const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Importar routers
const userRouter = require('./routes/userRouter');   // Asegurate que la ruta sea correcta
const eventRouter = require('./routes/eventRoute');  // Acá estaba el error

// Usar routers
app.use('/api/user', userRouter);
app.use('/api/event', eventRouter);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
