const pool = require('.');

exports.listEvents = async (req, res) => {
  try {
    const { name, startdate, tag } = req.query;

    // Diccionario para convertir el nombre del tag al ID correspondiente
    const categoryMap = {
      'rock': 1,
      'pop': 2,
      'trap': 3,
      'jazz': 4
      // agregá más si tenés
    };

    let baseQuery = `SELECT * FROM eventos`;
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
      events: result.rows
    });

  } catch (error) {
    console.error('❌ Error en listEvents:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }

 
};

exports.listEvents = async (req, res) => {
   const eventQuery = `
      SELECT
        e.*,
        el.id AS event_location_id,
        el.name AS event_location_name,
        el.full_address,
        el.max_capacity,
        el.latitude AS event_location_latitude,
        el.longitude AS event_location_longitude,
        loc.id AS location_id,
        loc.name AS location_name,
        loc.id_province,
        loc.latitude AS location_latitude,
        loc.longitude AS location_longitude,
        prov.id AS province_id,
        prov.name AS province_name,
        prov.full_name AS province_full_name,
        prov.latitude AS province_latitude,
        prov.longitude AS province_longitude,
        u.id AS creator_user_id,
        u.first_name AS creator_first_name,
        u.last_name AS creator_last_name,
        u.username AS creator_username
      FROM eventos e
      LEFT JOIN event_location el ON e.id_event_location = el.id
      LEFT JOIN location loc ON el.id_location = loc.id
      LEFT JOIN province prov ON loc.id_province = prov.id
      LEFT JOIN users u ON e.id_creator_user = u.id
      WHERE e.id = $1
    `;

    const eventResult = await pool.query(eventQuery, [eventId]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const event = eventResult.rows[0];

    // Consulta tags asociados al evento
    const tagsQuery = `
      SELECT t.id, t.name
      FROM tags t
      JOIN event_tags et ON t.id = et.tag_id
      WHERE et.event_id = $1
    `;

    const tagsResult = await pool.query(tagsQuery, [eventId]);

    // Consulta creador del lugar del evento (event_location)
    const locationCreatorQuery = `
      SELECT id, first_name, last_name, username
      FROM users
      WHERE id = (
        SELECT id_creator_user FROM event_location WHERE id = $1
      )
    `;

    const locationCreatorResult = await pool.query(locationCreatorQuery, [event.event_location_id]);

    // Armar objeto respuesta
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
        latitude: event.event_location_latitude,
        longitude: event.event_location_longitude,
        id_creator_user: locationCreatorResult.rows[0]?.id || null,
        location: {
          id: event.location_id,
          name: event.location_name,
          id_province: event.id_province,
          latitude: event.location_latitude,
          longitude: event.location_longitude,
          province: {
            id: event.province_id,
            name: event.province_name,
            full_name: event.province_full_name,
            latitude: event.province_latitude,
            longitude: event.province_longitude,
            display_order: null, // Si tenés esta columna, la agregás
          }
        },
        creator_user: locationCreatorResult.rows[0] || null
      },
      tags: tagsResult.rows,
      creator_user: {
        id: event.creator_user_id,
        first_name: event.creator_first_name,
        last_name: event.creator_last_name,
        username: event.creator_username,
        password: '******' // Nunca mandes la contraseña real
      }
    };

    res.json(response);

};