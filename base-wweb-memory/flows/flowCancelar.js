const { addKeyword } = require('@bot-whatsapp/bot');
const {consultarAsistencia, obtenerDiaSemana, borrarAsistencia} = require("../functions/function.js");
const { addEvent, deleteEvent, listEvents, authorize, deleteEventOnDateAndTime} = require('../pruebas.js'); //calendario


const flowCancelar = addKeyword("flowCancelar")
    .addAction(async (ctx, {flowDynamic, state}) => {
        var [mensaje, asistencia, tieneTurno] = await consultarAsistencia(ctx.from) //consigo el mensaje que se imprime, y la asistencia y si tiene o no turno
        console.log("primero: "+asistencia)
        await state.update({TieneTurno: tieneTurno})
        if (tieneTurno != 0){
            await state.update({asistencias: asistencia})
            mensaje = mensaje + "\n\n*SOLO DIGITE LA OPCION QUE DESEE CANCELAR, MUCHAS GRACIAS*"
            return flowDynamic(mensaje)
        }
        else{
            return flowDynamic("‼*Por el momento no sacaste ningun turno*‼  🙅‍♂")
        }
    }
)
    .addAction({capture:true} ,async (ctx, {flowDynamic,gotoFlow, state, fallBack}) => {
        const myState = state.getMyState()
        const tieneTurno = myState.TieneTurno

        if (tieneTurno != 0){
            var valores = []
            for (var i = 0; i<tieneTurno; i++){
                valores.push((i+1).toString())
            }
            if (valores.includes(ctx.body)){
                const asistencia = myState.asistencias
                console.log(asistencia)
                const dia = obtenerDiaSemana(asistencia[(ctx.body*2)-2]);
                const fechaFormateada = asistencia[(ctx.body*2)-2].substring(6,10) +"-"+ asistencia[(ctx.body*2)-2].substring(3,5) +"-"+ asistencia[(ctx.body*2)-2].substring(0,2);
                
                console.log(asistencia[(ctx.body*2)-1].length)
                if (asistencia[(ctx.body*2)-1].length > 4){
                    var horaFormateada = asistencia[(ctx.body*2)-1]+ ":00"
                }else{
                    var horaFormateada = "0"+asistencia[(ctx.body*2)-1]+ ":00"
                }

                console.log(fechaFormateada)
                console.log(horaFormateada)

                console.log(asistencia[(ctx.body*2)-2])
                console.log(asistencia[(ctx.body*2)-1])
                borrarAsistencia(asistencia[(ctx.body*2)-2], asistencia[(ctx.body*2)-1])
                authorize().then(auth => deleteEventOnDateAndTime(auth, fechaFormateada, horaFormateada)).catch(console.error)
                flowDynamic("*El turno:*\n\nDia: *"+dia+ " "+asistencia[(ctx.body*2)-2]+ "*\nHora: *"+ asistencia[(ctx.body*2)-1]+"*\n\n*Fue cancelado con exito*")
            }
            else{
                flowDynamic("‼*El mensaje que enviaste no coincide con ninguna de las opciones, por favor ingrese otro valor*‼\n\n‼*Recuerda que solo tienes que enviar el numero que corresponde a la opcion que quieras realizar*‼")
                return fallBack();
            }
    }})

module.exports = flowCancelar;