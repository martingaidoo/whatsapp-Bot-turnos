const { addKeyword } = require('@bot-whatsapp/bot');
const {consultarAsistencia} = require("../functions/function");

const flowConsultar = addKeyword("flowConsultar").addAction(
    async (ctx, {flowDynamic, state}) => {
        console.log(ctx.from);
        const [mensaje, asistencia, tieneTurno] = await consultarAsistencia(ctx.from)
        if (tieneTurno != 0){
            return flowDynamic(mensaje)
        }
        else{
            return flowDynamic("‼*Por el momento no sacaste ningun turno*‼  🙅‍♂")
        }
        
    }
)

module.exports = flowConsultar;