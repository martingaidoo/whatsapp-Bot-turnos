const { addKeyword } = require('@bot-whatsapp/bot');
const {enviarSolicitud} = require('../functions/function');
const Cliente = require("../models/Clientes");

const flowConsultarPeluquero = addKeyword("flowConsultarPeluquero")
    .addAction(async (ctx, {flowDynamic, state}) => {
        flowDynamic("Te pondremos en contacto con el peluquero, Por favor *CUENTAME EN UN SOLO MENSAJE* algo sobre su consulta\n\nPuedes ingresar tu cunsulta, solo envia un mensaje:")
    }
)
    .addAction({capture:true} ,async (ctx, {flowDynamic,gotoFlow, state, fallBack}) => {

        const client = await Cliente.find({telefono: ctx.from});
        var mensajePeluquero = "El cliente "+ client[0].nombre + " " + client[0].apellido + "\nCon el numero de telefono: " + client[0].telefono + "\nDocumento: "+client[0].documento+" *tiene una consulta:*\n\n" + ctx.body;        

        enviarSolicitud(mensajePeluquero, "5493533417461");// en el segundo parametro va el numero del peluquero
        flowDynamic("El Mensaje:\n*"+ctx.body+"*\n\nSera notificado a su peluquero, por favor en la brevedad recibira su respuesta, Muchas gracias")
        return("hola mundo");
            }
    )

module.exports = flowConsultarPeluquero;