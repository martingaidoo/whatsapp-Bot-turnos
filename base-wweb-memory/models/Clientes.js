const mongoose = require('mongoose');

const db = mongoose.connect("mongodb://localhost:27017/Peluqueria");

db.then(() => console.log('Conexión exitosa a la base de datos'))
.catch((err) => console.error('Error al conectar a la base de datos:', err));

const ClientesSchema = new mongoose.Schema({
    nombre: String,
    apellido: String,
    documento: Number,
    telefono: String
}, {collection: 'Cliente'});

const Cliente = mongoose.model('Cliente', ClientesSchema);

module.exports = Cliente;