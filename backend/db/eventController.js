const pool = require('.');

const categoryMap = {
  rock: 1,
  pop: 2,
  trap: 3,
  jazz: 4,
};

// ✅ Búsqueda con filtros
const listEvents = async (req, res) => {
  try {
    const { name, startdate, tag } = req.query;

    

    let baseQuery = `SELECT * FROM events`;
    let conditions = [];
    let values = [];

    if (name) {
      values.push(`%${name}%`);
      conditions.push(`LOWER(name) LIKE LOWER($${values.length})`);
    }

    if (startdate) {
      values.push(startdate);
      conditions.push(`start_date = $${values.length}`);
    }

    if (tag && categoryMap[tag.toLowerCase()]) {
      values.push(categoryMap[tag.toLowerCase()]);
      conditions.push(`id_event_category = $${values.length}`);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await pool.query(baseQuery, values);

    res.json({
      total: result.rows.length,
      events: result.rows,
    });
  } catch (error) {
    console.error('❌ Error en listEvents:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Detalle por ID
const getEventDetail = async (req, res) => {
  try {
    const eventId = req.params.id;

    const eventQuery = `
    SELECT
    e.*,
    el.id AS event_location_id,
    el.name AS event_location_name,
    el.full_address,
    el.max_capacity,
    loc.id AS location_id,
    loc.name AS location_name,
    loc.id_province,
    prov.id AS province_id,
    prov.name AS province_name,
    prov.full_name AS province_full_name,
    u.id AS creator_user_id,
    u.first_name AS creator_first_name,
    u.last_name AS creator_last_name,
    u.username AS creator_username
    FROM events e
    LEFT JOIN event_locations el ON e.id_event_location = el.id
    LEFT JOIN locations loc ON el.id_location = loc.id
    LEFT JOIN provinces prov ON loc.id_province = prov.id
    LEFT JOIN users u ON e.id_creator_user = u.id
    WHERE e.id = $1;  
    `;

    const eventResult = await pool.query(eventQuery, [eventId]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const event = eventResult.rows[0];

    const locationCreatorQuery = `
      SELECT id, first_name, last_name, username
      FROM users
      WHERE id = (
        SELECT id_creator_user FROM event_locations WHERE id = $1
      )
    `;

    const locationCreatorResult = await pool.query(locationCreatorQuery, [event.event_location_id]);

    const response = {
      id: event.id,
      name: event.name,
      description: event.description,
      id_event_location: event.id_event_location,
      start_date: event.start_date,
      duration_in_minutes: event.duration_in_minutes,
      price: event.price,
      enabled_for_enrollment: event.enabled_for_enrollment,
      max_assistance: event.max_assistance,
      id_creator_user: event.id_creator_user,
      event_location: {
        id: event.event_location_id,
        name: event.event_location_name,
        full_address: event.full_address,
        max_capacity: event.max_capacity,
        id_creator_user: locationCreatorResult.rows[0]?.id || null,
        location: {
          id: event.location_id,
          name: event.location_name,
          id_province: event.id_province,
          province: {
            id: event.province_id,
            name: event.province_name,
            full_name: event.province_full_name,
            display_order: null,
          },
        },
        creator_user: locationCreatorResult.rows[0] || null,
      },

      tags: [
        {
          id: event.id_event_category,
          name: categoryMap[event.id_event_category] || 'desconocido'
        }
      ],
      
      creator_user: {
        id: event.creator_user_id,
        first_name: event.creator_first_name,
        last_name: event.creator_last_name,
        username: event.creator_username,
        password: '******',
      },
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Error en getEventDetail:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Exportar ambas funciones correctamente
module.exports = {
  listEvents,
  getEventDetail,
};
