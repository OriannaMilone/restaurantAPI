const express = require('express');
const router = express.Router();
const dbo = require('../db/conn');
const ObjectId = require('mongodb').ObjectId;
const COLLECTION = 'reservations';

// GET /reservations — Listar todas las reservas
router.get('/', async (req, res) => {
  const db = dbo.getDb();
  const result = await db.collection(COLLECTION).find({}).toArray();
  if (!result.length) return res.status(404).send('No se encontraron reservas');
  res.status(200).json(result);
});

// GET /reservations/:id — Obtener reserva
router.get('/:id', async (req, res) => {
  const db = dbo.getDb();
  const result = await db.collection(COLLECTION).findOne({ _id: new ObjectId(req.params.id) });
  if (!result) return res.status(404).send('Reserva no encontrada');
  res.status(200).json(result);
});

// POST /reservations — Crear reserva
router.post('/', async (req, res) => {
  const db = dbo.getDb();
  const newReservation = {
    tableId: req.body.tableId,
    dateTime: req.body.dateTime,
    partySize: req.body.partySize
  };
  const result = await db.collection(COLLECTION).insertOne(newReservation);
  res.status(201).location(`/reservations/${result.insertedId}`).send();
});

// PUT /reservations/:id — Actualizar reserva
router.put('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).send('Invalid reservation ID');

  const db = dbo.getDb();
  const update = {
    $set: {
      dateTime: req.body.dateTime,
      partySize: req.body.partySize
    }
  };
  const result = await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(req.params.id) }, update
  );
  if (result.matchedCount === 0) return res.status(404).send('Reserva no encontrada');
  res.status(204).send();
});

// DELETE /reservations/:id — Cancelar reserva
router.delete('/:id', async (req, res) => {
  const db = dbo.getDb();
  const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 0) return res.status(404).send('Reserva no encontrada');
  res.status(204).send();
});

module.exports = router;
