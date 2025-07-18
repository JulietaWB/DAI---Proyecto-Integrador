const pool = require('../db/db');

// Obtener todas las event_locations del usuario autenticado (paginado)
const listEventLocations = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const totalResult = await pool.query(
      `SELECT COUNT(*) FROM event_locations WHERE id_creator_user = $1`, 
      [userId]
    );

    const total = parseInt(totalResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM event_locations WHERE id_creator_user = $1 ORDER BY id LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.status(200).json({
      page,
      limit,
      total,
      event_locations: result.rows,
    });
  } catch (error) {
    console.error('❌ Error en listEventLocations:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener una event_location por id y que pertenezca al usuario autenticado
const getEventLocationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const result = await pool.query(
      `SELECT * FROM event_locations WHERE id = $1 AND id_creator_user = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event location no encontrada' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error en getEventLocationById:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Insertar nueva event_location
const createEventLocation = async (req, res) => {
try {
    const userId = req.user.id;
    const { id, name, full_address, max_capacity, id_location } = req.body;

    // Validaciones básicas (ejemplo)
    if (!id || !name || !full_address || !max_capacity) {
    return res.status(400).json({ error: 'Faltan datos obligatorios, incluido el id' });
    }

    const result = await pool.query(
    `INSERT INTO event_locations (id, name, full_address, max_capacity, id_location, id_creator_user)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, name, full_address, max_capacity, id_location || null, userId]
    );

    res.status(201).json({ message: 'Event location creada', event_location: result.rows[0] });
    } catch (error) {
        console.error('❌ Error en createEventLocation:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
  

// Actualizar event_location por id y usuario autenticado
const updateEventLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const { name, full_address, max_capacity, id_location } = req.body;

    // Verificar que existe y es del usuario
    const existing = await pool.query(
      `SELECT * FROM event_locations WHERE id = $1 AND id_creator_user = $2`,
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Event location no encontrada' });
    }

    await pool.query(
      `UPDATE event_locations SET name=$1, full_address=$2, max_capacity=$3, id_location=$4 WHERE id=$5`,
      [name || existing.rows[0].name, full_address || existing.rows[0].full_address, max_capacity || existing.rows[0].max_capacity, id_location || existing.rows[0].id_location, id]
    );

    res.status(200).json({ message: 'Event location actualizada' });
  } catch (error) {
    console.error('❌ Error en updateEventLocation:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar event_location por id y usuario autenticado
const deleteEventLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const existing = await pool.query(
      `SELECT * FROM event_locations WHERE id = $1 AND id_creator_user = $2`,
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Event location no encontrada' });
    }

    await pool.query(
      `DELETE FROM event_locations WHERE id = $1`,
      [id]
    );

    res.status(200).json({ message: 'Event location eliminada' });
  } catch (error) {
    console.error('❌ Error en deleteEventLocation:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  listEventLocations,
  getEventLocationById,
  createEventLocation,
  updateEventLocation,
  deleteEventLocation,
};
