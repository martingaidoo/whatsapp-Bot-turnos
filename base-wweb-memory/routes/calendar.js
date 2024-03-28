const axios = require('axios');

async function enviarSolicitud(nombre, fecha) {
    const data = {
        name: nombre,
        startDate: fecha
    };

    try {
        const response = await axios.post('https://hook.us1.make.com/kfa1es6r2urptbcfhdgrh7rxy0xdr3w5', data);
        console.log('Solicitud enviada correctamente:', response.data);
    } catch (error) {
        console.error('Error al enviar la solicitud:', error);
    }
}

// Llama a la función para enviar la solicitud
//enviarSolicitud("martin gaido", "2024/03/6 08:00:00");

module.exports = enviarSolicitud;
