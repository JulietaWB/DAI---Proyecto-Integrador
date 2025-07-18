const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'mi_secreto_para_jwt';

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Formato: Bearer <token>
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Aquí tenemos el ID del usuario autenticado
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido.' });
  }
};

module.exports = verifyToken;
