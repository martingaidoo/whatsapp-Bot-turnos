const { addKeyword } = require('@bot-whatsapp/bot');
const {sumarDiasAFecha, obtenerDiaSemana, conseguirTurnosDisponibilidad, consultarDatos} = require("../functions/function.js");
const flowPedirHora = require('./flowPedirHora');

const flowPedir = addKeyword(['flowPedir'])
    .addAction(async (_, {flowDynamic, state }) =>{
        var mensaje = ('📄 Puedes elegir una fecha para tu turno\n')
        var valorDisponible = []

        const [trabajo, arrayDisponibilidad]  = await conseguirTurnosDisponibilidad()

        for (let index = 1; index < 10; index++) {

            const disponibilidad = arrayDisponibilidad[index-1]
            //const disponibilidad = await consultarDisponibilidad(fecha);

            console.log(disponibilidad)

            //const dia = await obtenerDiaSemana(sumarDiasAFecha(index-1));
            const dia = obtenerDiaSemana(trabajo[index-1][0]);
            console.log(dia)

            if (Array.isArray(disponibilidad) && disponibilidad.length === 0){
                mensaje = mensaje + "*" + index+ "*"  + ': '+ dia + '  '  + sumarDiasAFecha(index-1) + '  Cerrado  🔐\n'
            }
            else if (Array.isArray(disponibilidad) && disponibilidad.includes("Disponible")){
                mensaje = mensaje + "*"+ index + "*" + ': ' + dia + '  ' + sumarDiasAFecha(index-1) + '  Disponible  ✅\n'
                valorDisponible.push(index.toString())
            }else{
                mensaje = mensaje +"*"+ index+"*" + ': '+ dia + '  ' + sumarDiasAFecha(index-1) + '  Ocupado  ❌\n'
            }
            }
        
        mensaje = mensaje + '*0*: Cancelar  ❌';

        await state.update({ valor: valorDisponible })
        await state.update({ mensaje: mensaje })
        return flowDynamic(mensaje)
})

.addAction({ capture: true }, async (ctx, { flowDynamic, state, fallBack, gotoFlow, endFlow }) => {
    const myState = state.getMyState()
    let valorDisponible;

    if (myState === undefined || myState.valor === undefined){
        valorDisponible = "sdfgdsdfsfas"
    }else{
        valorDisponible = myState.valor
    }
    if (ctx.body == "0"){
        return endFlow("‼*No se tomo ningun turno*‼  🛑")
    }
    if (!valorDisponible.includes(ctx.body)) {
        flowDynamic("‼*El mensaje que enviaste no coincide con ninguna de las opciones, por favor ingrese otro valor*‼\n\n‼*Recuerda que solo tienes que enviar el numero que corresponde a la opcion que quieras realizar*‼")
        //adapterProvider.sendText('5493533417461@c.us', 'Mensaje desde API')  envia un mensaje
        return fallBack();
    }   else
        {
            // Espera a que la promesa se resuelva antes de usar su resultado
            const fecha = await consultarDatos(sumarDiasAFecha(parseInt(ctx.body)-1));
            await state.update({ fecha: fecha })
            return gotoFlow(flowPedirHora)
        }
})

module.exports = flowPedir;