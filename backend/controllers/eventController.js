const pool = require('../db/db'); 

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
    el.max_assistance,
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

const createEvent = async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      price,
      duration_in_minutes,
      max_assistance,
      id_event_location,
      id_event_category,
      start_date,
      enabled_for_enrollment,
    } = req.body;

    // Validaciones básicas
    if (!id) {
      return res.status(400).json({ success: false, message: 'Debe especificar un ID de evento.' });
    }

    if (!name || name.length < 3 || !description || description.length < 3) {
      return res.status(400).json({ success: false, message: 'Name y description deben tener al menos 3 caracteres.' });
    }

    if (price < 0 || duration_in_minutes < 0) {
      return res.status(400).json({ success: false, message: 'Price y duración deben ser positivos.' });
    }

    // Validación de max_assistance vs max_capacity de location
    const locResult = await pool.query(
      'SELECT max_capacity FROM event_locations WHERE id = $1',
      [id_event_location]
    );
    if (!locResult.rows.length) {
      return res.status(400).json({ success: false, message: 'La ubicación especificada no existe.' });
    }
    if (max_assistance > locResult.rows[0].max_capacity) {
      return res.status(400).json({ success: false, message: 'max_assistance excede la capacidad máxima del lugar.' });
    }

    // ID del usuario autenticado
    const userId = req.user.id;

    await pool.query(`
      INSERT INTO events (
        id, name, description, price, duration_in_minutes,
        max_assistance, id_event_location,
        id_event_category, start_date, enabled_for_enrollment, id_creator_user
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `, [
      id,
      name,
      description,
      price,
      duration_in_minutes,
      max_assistance,
      id_event_location,
      id_event_category,
      start_date,
      enabled_for_enrollment,
      userId
    ]);

    res.status(201).json({ success: true, message: 'Evento creado correctamente.' });

  } catch (err) {
    console.error('❌ Error en createEvent:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};


const updateEvent = async (req, res) => {
  const {
    id,
    name,
    description,
    price,
    duration_in_minutes,
    max_assistance,
    id_event_location,
    id_event_category,
    start_date,
    enabled_for_enrollment
  } = req.body;

  const userId = req.user.id;

  if (!name || name.length < 3 || !description || description.length < 3) {
    return res.status(400).json({ success: false, message: 'El name o description son inválidos.' });
  }
  if (price < 0 || duration_in_minutes < 0) {
    return res.status(400).json({ success: false, message: 'Precio o duración inválidos.' });
  }

  try {
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (!eventResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
    }

    if (eventResult.rows[0].id_creator_user !== userId) {
      return res.status(404).json({ success: false, message: 'No puedes editar un evento que no creaste.' });
    }

    await pool.query(
      `UPDATE events SET name=$1, description=$2, price=$3, duration_in_minutes=$4, max_assistance=$5, id_event_location=$6, id_event_category=$7, start_date=$8, enabled_for_enrollment=$9 
       WHERE id=$10`,
      [name, description, price, duration_in_minutes, max_assistance, id_event_location, id_event_category, start_date, enabled_for_enrollment, id]
    );
        
    return res.status(200).json({ success: true, message: 'Evento actualizado correctamente.' });

  } catch (error) {
    console.error('❌ Error en updateEvent:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (!eventResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
    }

    if (eventResult.rows[0].id_creator_user !== userId) {
      return res.status(404).json({ success: false, message: 'No puedes eliminar un evento que no creaste.' });
    }

    await pool.query('DELETE FROM events WHERE id = $1', [id]);

    return res.status(200).json({ success: true, message: 'Evento eliminado correctamente.' });

  } catch (error) {
    console.error('❌ Error en deleteEvent:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

const enrollments = new Map(); 
// key: eventId, value: Set of userIds inscritos

const isUserEnrolled = (eventId, userId) => {
  return enrollments.has(eventId) && enrollments.get(eventId).has(userId);
};

const addEnrollment = (eventId, userId) => {
  if (!enrollments.has(eventId)) enrollments.set(eventId, new Set());
  enrollments.get(eventId).add(userId);
};

const removeEnrollment = (eventId, userId) => {
  if (enrollments.has(eventId)) {
    enrollments.get(eventId).delete(userId);
  }
};

// POST /api/event/:id/enrollment
const registerUserToEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user.id;

    if (!userId) return res.status(401).json({ message: 'No autorizado' });

    // Buscar el evento
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    const event = eventResult.rows[0];

    const now = new Date();
    const eventDate = new Date(event.start_date);

    // Validaciones
    if (event.enabled_for_enrollment !== true) {
      return res.status(400).json({ message: 'Evento no habilitado para inscripción' });
    }

    if (eventDate <= now || eventDate.toDateString() === now.toDateString()) {
      return res.status(400).json({ message: 'El evento ya sucedió o es hoy' });
    }

    // Chequear capacidad máxima
    const inscritos = enrollments.has(eventId) ? enrollments.get(eventId).size : 0;
    if (inscritos >= event.max_assistance) {
      return res.status(400).json({ message: 'Capacidad máxima alcanzada' });
    }

    // Verificar si ya está registrado
    if (isUserEnrolled(eventId, userId)) {
      return res.status(400).json({ message: 'Usuario ya registrado en este evento' });
    }

    // Registrar usuario
    addEnrollment(eventId, userId);

    return res.status(201).json({ message: 'Registro exitoso' });

  } catch (error) {
    console.error('Error en registerUserToEvent:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/event/:id/enrollment
const unregisterUserFromEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user.id;

    if (!userId) return res.status(401).json({ message: 'No autorizado' });

    // Buscar evento
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    const event = eventResult.rows[0];

    const now = new Date();
    const eventDate = new Date(event.start_date);

    // Validaciones
    if (eventDate <= now || eventDate.toDateString() === now.toDateString()) {
      return res.status(400).json({ message: 'El evento ya sucedió o es hoy' });
    }

    // Verificar si el usuario está registrado
    if (!isUserEnrolled(eventId, userId)) {
      return res.status(400).json({ message: 'Usuario no registrado en este evento' });
    }

    // Remover inscripción
    removeEnrollment(eventId, userId);

    return res.status(200).json({ message: 'Usuario dado de baja del evento' });

  } catch (error) {
    console.error('Error en unregisterUserFromEvent:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};


module.exports = {
  listEvents,
  getEventDetail,
  createEvent,
  updateEvent,
  deleteEvent,
  registerUserToEvent,
  unregisterUserFromEvent,
};