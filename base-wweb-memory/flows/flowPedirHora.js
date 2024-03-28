const { addKeyword } = require('@bot-whatsapp/bot');
const { addEvent, deleteEvent, listEvents, authorize, deleteEventOnDateAndTime} = require('../pruebas.js'); //calendario
const {agregarDato, consultarDisponibilidad} = require("../functions/function.js");
const Cliente = require("../models/Clientes");




const flowPedirHora = addKeyword(['flowPedirHora'])
    .addAction(async (_, {flowDynamic, state}) =>{
            const myState = state.getMyState()
            const arrayTurno = myState.fecha
            var mensaje = "📄 Puedes elegir una hora para tu turno \n La fecha para tu turno es: " + arrayTurno[0]
            var numeros = []

            const disponibilidad = await consultarDisponibilidad(arrayTurno);
            
            for (let index = 1; index < arrayTurno.length; index++) {
                if (disponibilidad[index-1] == "Disponible"){
                    numeros.push(index.toString())
                    mensaje = mensaje + "\n" + "*"+index+"*" + ':  ' + arrayTurno[index] + '  '+ disponibilidad[index-1] + "  ✅"
                }else{
                    mensaje = mensaje + "\n" + "*"+index+"*" + ':  ' + arrayTurno[index] + '  '+ disponibilidad[index-1]+ "  ❌"
                }
            }
            mensaje = mensaje + "\n" + '*0*: Volver  🔙'

            await state.update({ valido: numeros })

            return flowDynamic(mensaje)
        })

    .addAction({ capture: true }, async (ctx, { flowDynamic, state, fallBack, gotoFlow}) => {
            
            const myState = state.getMyState()

            const arrayTurno = myState.fecha //este es un array donde se encuentra primero la fecha seleccionada, y luego la hora en la que se trabaja

            const numeros = myState.valido //traigo los unicos numeros que son validos ingresar
            if (ctx.body == "0"){
                
                //return gotoFlow(flowPedir)
                return gotoFlow(require('./flowPedir.js'));

            }
            console.log(numeros)
            if (numeros ==undefined){
                flowDynamic("‼*El mensaje que enviaste no coincide con ninguna de las opciones, por favor ingrese otro valor*‼\n\n‼*Recuerda que solo tienes que enviar el numero que corresponde a la opcion que quieras realizar*‼")
                //adapterProvider.sendText('5493533417461@c.us', 'Mensaje desde API') enviar mensaje
                return fallBack();
            }else{
                if (!numeros.includes(ctx.body)) {
                    flowDynamic("‼*El mensaje que enviaste no coincide con ninguna de las opciones, por favor ingrese otro valor*‼\n\n‼*Recuerda que solo tienes que enviar el numero que corresponde a la opcion que quieras realizar*‼")
                    //adapterProvider.sendText('5493533417461@c.us', 'Mensaje desde API') enviar mensaje
                    return fallBack();
                }
                else{
                    const client = await Cliente.find({telefono: ctx.from});                    
                    const fechaFormateada2 = arrayTurno[0].substring(6,10) +"-"+ arrayTurno[0].substring(3,5) +"-"+ arrayTurno[0].substring(0,2);
                    if (arrayTurno[ctx.body].length > 4){
                        var horaFormateada = "T"+ arrayTurno[ctx.body] + ":00"
                    }else{
                        var horaFormateada = "T0"+ arrayTurno[ctx.body] + ":00"
                    }
                    console.log(fechaFormateada2 + horaFormateada)
                    agregarDato(arrayTurno[0], arrayTurno[ctx.body], client[0].documento + '::' + client[0].nombre + ' ' + client[0].apellido);

                    authorize().then(auth => addEvent(auth, client[0].nombre+" "+client[0].apellido, fechaFormateada2 + horaFormateada, client[0].documento, ctx.from)).catch(console.error);

                    return flowDynamic(`📄Se registro tu turno ✅\n\nCliente: *${client[0].nombre}* *${client[0].apellido}*\nDia: *${arrayTurno[0]}*\nHora: *${arrayTurno[ctx.body]}*\n\nSera notificado un dia antes a este numero 🕔, muchas gracias🤗`)                
                }
            }
            })

module.exports = flowPedirHora;