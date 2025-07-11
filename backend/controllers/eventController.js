const pool = require('../db');

const listEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, startdate, tag } = req.query;
    const offset = (page - 1) * limit;

    // Armado del WHERE dinámico
    const filters = [];
    const values = [];

    if (name) {
      values.push(`%${name}%`);
      filters.push(`e.name ILIKE $${values.length}`);
    }

    if (startdate) {
      values.push(startdate);
      filters.push(`e.start_date = $${values.length}`);
    }

    if (tag) {
      values.push(`%${tag}%`);
      filters.push(`e.description ILIKE $${values.length}`); // suponemos que el tag está en la descripción
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const query = `
      SELECT 
        e.id, e.name, e.description, e.start_date, e.duration_in_minutes, 
        e.price, e.enabled_for_enrollment, el.max_capacity,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name) as creator_user,
        json_build_object('id', el.id, 'name', el.name, 'address', el.full_address) as location
      FROM events e
      JOIN users u ON u.id = e.id_creator_user
      JOIN event_locations el ON el.id = e.id_event_location
      ${whereClause}
      ORDER BY e.start_date
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    values.push(limit);
    values.push(offset);

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { listEvents };
