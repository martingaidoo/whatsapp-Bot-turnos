const mongoose = require("mongoose");
const db = mongoose.connect("mongodb://localhost:27017/Peluqueria");

db.then(()=>console.log('Conexión exitosa a la base de datos'))
.catch((err)=>console.error('Error al conectar a la base de datos:', err));

const ListaNegraSchema = new mongoose.Schema({
    telefono: Number
}, {collection: 'ListaNegra'});

const ListaNegra = mongoose.model('ListaNegra', ListaNegraSchema);

module.exports = ListaNegra;