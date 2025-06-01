const express = require('express');
const router = express.Router();
const dbo = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;
const COLLECTION = 'tables';

// GET /tables — Listar mesas activas
router.get('/', async (req, res) => {
  const db = dbo.getDb();
  const result = await db.collection(COLLECTION).find({}).toArray();
  if (!result.length) return res.status(404).send('No se encontraron mesas');
  res.status(200).json(result);
});

// GET /tables/:id — Obtener mesa por ID
router.get('/:id', async (req, res) => {
  const db = dbo.getDb();
  const query = { _id: new ObjectId(req.params.id) };
  const result = await db.collection(COLLECTION).findOne(query);
  if (!result) return res.status(404).send('Mesa no encontrada');
  res.status(200).json(result);
});

// POST /tables — Crear nueva mesa
router.post('/', async (req, res) => {
  const db = dbo.getDb();
  const newTable = {
    capacity: req.body.capacity,
    location: req.body.location
  };
  const result = await db.collection(COLLECTION).insertOne(newTable);
  res.status(201).location(`/tables/${result.insertedId}`).send();
});

// PUT /tables/:id — Actualizar mesa
router.put('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).send('Invalid table ID');

  const db = dbo.getDb();
  const update = { $set: { capacity: req.body.capacity, location: req.body.location } };
  const result = await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(req.params.id) }, update
  );
  if (result.matchedCount === 0) return res.status(404).send('Mesa no encontrada');
  res.status(204).send();
});

// DELETE /tables/:id — Eliminar mesa
router.delete('/:id', async (req, res) => {
  const db = dbo.getDb();
  const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 0) return res.status(404).send('Mesa no encontrada');
  res.status(204).send();
});

// Dentro de routes/tables.js
router.get('/:id/reservations', async (req, res) => {
  const db = dbo.getDb();
  const tableId = req.params.id;
  const result = await db.collection('reservations')
    .find({ tableId: tableId })
    .toArray();

  if (!result.length) return res.status(404).send('No se encontraron reservas para esta mesa');

  // Opcional: incluir links HATEOAS
  const formatted = result.map(r => ({
    ...r,
    _links: {
      self: { href: `/reservations/${r._id}` },
      cancel: { href: `/reservations/${r._id}`, method: "DELETE" }
    }
  }));

  res.status(200).json({
    _links: {
      self: { href: `/tables/${tableId}/reservations` },
      table: { href: `/tables/${tableId}` }
    },
    _embedded: {
      reservations: formatted
    }
  });
});

module.exports = router;

