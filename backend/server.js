const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const eventRoutes = require('./routes/eventRoute');

app.use(cors());
app.use(express.json());

app.use('/api/event', eventRoutes);

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});


