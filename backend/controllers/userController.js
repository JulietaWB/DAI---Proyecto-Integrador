const pool = require('../db/db'); // tu conexión a la DB
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'mi_secreto_para_jwt'; // Poné un secreto en .env

// POST /api/user/register
const registerUser = async (req, res) => {
  try {
    const { id, first_name, last_name, username, password } = req.body;

    // Validaciones
    if (!first_name || first_name.length < 3) {
      return res.status(400).json({ success: false, message: 'El campo first_name es obligatorio y debe tener al menos 3 letras.' });
    }
    if (!last_name || last_name.length < 3) {
      return res.status(400).json({ success: false, message: 'El campo last_name es obligatorio y debe tener al menos 3 letras.' });
    }
    if (!password || password.length < 3) {
      return res.status(400).json({ success: false, message: 'El campo password es obligatorio y debe tener al menos 3 letras.' });
    }

    // Verificar si usuario ya existe
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe.' });
    }
    
    // Insertar nuevo usuario
    await pool.query(
      `INSERT INTO users (id, first_name, last_name, username, password) VALUES ($1, $2, $3, $4, $5)`,
      [id, first_name, last_name, username, password]
    );
    
    return res.status(201).json({ success: true, message: 'Usuario creado correctamente.' });

  } catch (error) {
    console.error('❌ Error en registerUser:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

// POST /api/user/login
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Buscar usuario por username
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      console.log('Usuario no encontrado:', username);
      return res.status(401).json({ success: false, message: 'Usuario o clave inválida.', token: "" });
    }

    const user = userResult.rows[0];

    // Comparar password
    if (password !== user.password) {
      return res.status(401).json({ success: false, message: 'Usuario o clave inválida.', token: "" });
    }    

    // Crear payload para JWT (podés agregar más info si querés)
    const payload = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
    };

    // Firmar token
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });

    return res.json({ success: true, message: '', token });

  } catch (error) {
    console.error('❌ Error en loginUser:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.', token: "" });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
