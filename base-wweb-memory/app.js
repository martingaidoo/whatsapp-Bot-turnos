const fs = require('fs');// Importa el módulo 'fs' para manipular el sistema de archivos (opcional, solo si lo necesitas)
const { GoogleSpreadsheet } = require('google-spreadsheet'); // esto es la base de la hoja de sheets
const RESPONSES_SHEET_ID = '11XJabkmygBQ79l1lIL4Yii18m79FVBPDZVYhR2Ylerg'; //Aquí pondras el ID de tu hoja de Sheets
const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID);
const CREDENTIALS = JSON.parse(fs.readFileSync('./credenciales.json'));
const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const { EVENTS } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const WebWhatsappProvider = require('@bot-whatsapp/provider/web-whatsapp')
const MockAdapter = require('@bot-whatsapp/database/mock')
const { addEvent, deleteEvent, listEvents, authorize, deleteEventOnDateAndTime} = require('./pruebas.js'); //calendario
const { parse, format, getDay } = require('date-fns');
const flowConsultarPeluquero = require('./flows/flowConsultarPeluquero'); // flujo 5 principal
const flowConsultar = require('./flows/flowConsultar');
const flowCancelar = require('./flows/flowCancelar');
const flowPedirHora = require('./flows/flowPedirHora');
const flowPedir = require('./flows/flowPedir');

const adapterProvider = createProvider(WebWhatsappProvider)

const Cliente = require("./models/Clientes");//la base de datos del cliente
const ListaNegra = require("./models/ListaNegra");//la base de datos de lista negra

const express = require('express')
const app = express();
const port = 4000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('¡Hola Mundo!');
});

app.post('/send-message-bot', async (req, res) => {
    console.log(req.body)
    await adapterProvider.sendText(req.body.numero +'@c.us', req.body.mensaje);
    res.send({ data: 'enviado!' })
})

app.listen(port, () => {
    console.log(`La aplicación está escuchando en http://localhost:${port}`);
});


/*
*                try {
*                    // Buscar todos los clientes en la base de datos
*                    const clientes = await Cliente.find({});
*                    console.log('Clientes encontrados:');
*                    clientes.forEach(cliente => {
*                        console.log('Nombre:', cliente.nombre);
*                        console.log('Apellido:', cliente.apellido);
*                        console.log('Documento:', cliente.documento);
*                        console.log('Teléfono:', cliente.telefono);
*                        console.log('------------------------');
*                    });
*                } catch (error) {
*                    console.error('Error al buscar clientes:', error);
*                }
*/

const flowActivarConversacion = addKeyword('flowActivarConversacion')
    .addAction(async (_, {flowDynamic, state }) =>{
        let mensaje = "Los clientes que estan desactivados son:\n\n";
        let arrayListaNegra = [];
        let valores=[]
        let contador = 0
        try {
            // Buscar todos los clientes en la base de datos
            const listaNegra = await ListaNegra.find({});
            for (const numero of listaNegra) {
                contador +=1
                valores.push(contador.toString())
                arrayListaNegra.push(numero.telefono);
                const client = await Cliente.find({telefono: numero.telefono});
                mensaje = mensaje +contador+":\nNombre: " + client[0].nombre + " " + client[0].apellido + "\nTelefono: " + client[0].telefono + "\nDocumento: "+client[0].documento +"\n-----------------\n";
                console.log(mensaje)
            }
        } catch (error) {
            console.error('Error al buscar clientes:', error);
        }
        mensaje = mensaje + "\n\n*0*: Volver"
        await state.update({lista: arrayListaNegra})
        await state.update({valoress: valores})
        return flowDynamic(mensaje)
    })
    .addAction({capture: true}, async (ctx,{flowDynamic, state, fallBack, gotoFlow}) => {
        const myState = state.getMyState()
        console.log(myState)
        if (myState.lista === undefined){
            var arrayListaNegra = ["dsafsdaadsf"]
            var valores = []
        }else {
            var arrayListaNegra = myState.lista
            var valores = myState.valoress
        }
        if (ctx.body== "0"){
            return gotoFlow(flowPeluquero)
        }
        else if(valores.includes(ctx.body)){
            console.log(Number(ctx.body)-1)
            console.log("se borra supuestamente")
            const listaNegra = await ListaNegra.findOneAndDelete({telefono: arrayListaNegra[Number(ctx.body)-1]})
            return(flowDynamic("se borro correctamente"));
        }else{
            flowDynamic("‼*El mensaje que enviaste no coincide con ninguna de las opciones, por favor ingrese otro valor*‼\n\n‼*Recuerda que solo tienes que enviar el numero que corresponde a la opcion que quieras realizar*‼")
            return fallBack();
        }
    })

const flowDesactivarConversacion = addKeyword('flowDesactivarConversacion')
    .addAnswer('Dime el numero del cliente que quieres detener\n\n*0*: Cancelar',
    {capture: true},
    async (ctx, { fallBack, gotoFlow, flowDynamic}) => {
        const doc = ctx.body
        console.log(doc)

        let ifExist;
        if (ctx.body != "0"){

            try {
                ifExist = await Cliente.exists({ documento: doc });
                if(ifExist){
                    // Si existe lo enviamos al flujo de regostrados..
                    const client = await Cliente.find({documento: doc});
                    
                    await new ListaNegra({
                        telefono: client[0].telefono
                    }).save()
                    
                    return flowDynamic("se registro correctamente en la lista para no interactuar con el bot")
                }
                else{   
                    return fallBack();
                }
            } catch (error) {
                // Manejar el error de alguna manera
                console.error('Error al buscar en la base de datos:', error);
            }
        }else{
            return flowDynamic("se cancelo")
        }
        return fallBack();
    }
)


const flowPeluquero = addKeyword('flowPeluquero')
    .addAnswer('Bienvenido❗🤗\n\nQue es lo que quieres realizar: 🤔\n\n*1*: 👉 Desactivar una conversacion\n*2*: 👉 Activar una conversacion\n*3*: 👉 consultar turnos\n*4*: 👉 informar inasistencia del cliente',
    {capture: true},
    (ctx, { fallBack, gotoFlow, flowDynamic}) => {
        if (!['1', '2', '3', '4', '5',].includes(ctx.body)) {
            flowDynamic("‼*El mensaje que enviaste no coincide con ninguna de las opciones, por favor ingrese otro valor*‼")
            return fallBack();
        }else if (ctx.body === '1') {
            gotoFlow(flowDesactivarConversacion)
        }
        else if (ctx.body === '2') {
            gotoFlow(flowActivarConversacion)
        }
        else if(ctx.body === '3') {
            console.log("3")
        }
        else if (ctx.body === '4') {
            console.log("4")
        }
        else if(ctx.body === '5') {
            console.log("5")
        }
    });

const flujoUsuariosRegistrados = addKeyword('USUARIOS_REGISTRADOS')
    .addAnswer('Bienvenido❗🤗\n\nQue es lo que quieres realizar: 🤔\n\n*1*: 👉 Sacar un *Turno* 📝\n*2*: 👉 Consultar *Turnos* sacados 🗓\n*3*: 👉 Cancelar algun *Turno* ❌\n*4*: 👉 Hablar en privado con el peluquero 👤\n\n‼*Recuerda que solo tienes que enviar el digito que corresponde a la opcion que quieras realizar*‼',
                
    {capture: true},
    (ctx, { fallBack, gotoFlow, flowDynamic}) => {
        console.log(ctx.body);
        if (!['1', '2', '3', '4',].includes(ctx.body)) {
            flowDynamic("‼*El mensaje que enviaste no coincide con ninguna de las opciones, por favor ingrese otro valor*‼")
            return fallBack();
        }else if (ctx.body === '1') {
            gotoFlow(flowPedir)
        }
        else if (ctx.body === '2') {
            gotoFlow(flowConsultar)
        }
        else if(ctx.body === '3') {
            gotoFlow(flowCancelar)
        }
        else if (ctx.body === '4') {
            gotoFlow(flowConsultarPeluquero)
        }
    });
    

const flujoUsuariosNORegistrados = addKeyword('USUARIOS_NO_REGISTRADOS') //aca registramos el cliente cuando es la primera vez que ingresa
        .addAnswer("Bienvenido❗🤗\n\nVeo que es tu primera vez por aqui")
        .addAction(async (_,{flowDynamic})=> {
            return flowDynamic('¿Cual es tu nombre?\nPor favor solo ingrese el nombre')
        })

        .addAction({ capture: true }, async (ctx, { flowDynamic, state, fallBack}) => {

            await state.update({ telefono: ctx.from })
            await state.update({ nombre: ctx.body })
            if (ctx.body.length > 15){
                flowDynamic("El nombre es demasiado largo, por favor ingrese uno mas corto:")
                return fallBack();
            }
            return flowDynamic('¿Cual es tu apellido?\nPor favor solo ingrese el apellido')
        })
        .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack}) => {
            await state.update({ apellido: ctx.body })
            if (ctx.body.length > 15){
                flowDynamic("El apellido es demasiado largo, por favor ingrese uno mas corto:")
                return fallBack();
            }
            return flowDynamic('¿Cual es tu documento?\nPor favor solo ingrese el documento')
        })
        .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack}) => {
            const regexTelefono = /^[0-9]{8}$/;

            if (!regexTelefono.test(ctx.body)){
                flowDynamic("El documento ingresado no es valido, por favor ingrese un documento valido:")
                return fallBack();
            }

            await state.update({ documento: ctx.body })
            const myState = await state.getMyState()

            await flowDynamic(`Ya te registramos..`)
            await flowDynamic("Tu nombre es: "+myState.nombre + "\nTu apellido es: "+myState.apellido+"\nTu documento es: "+myState.documento+"\nTu numero es: "+myState.telefono)

            //registro un cliente en la base de datos
            return flowDynamic("Confirma si los datos ingresados son correctos:\n\n*1*: Confirmar\n\n*2*: Incorrecto")
        })
        .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack}) => {
            if (ctx.body === '1'){
                const myState = await state.getMyState()
                await new Cliente({
                    nombre: MyState.nombre,
                    apellido: MyState.apellido,
                    documento: MyState.documento,
                    telefono: MyState.telefono
                }).save()
                flowDynamic(`Usuario registrado con exito`)
                return await gotoFlow(flujoUsuariosRegistrados);
            }
            else if(ctx.body === '2'){
                flowDynamic(`Ya que los datos son incorrectos le pediremos que vuelva a ingresarlos de nuevo`)
                return gotoFlow(flujoUsuariosNORegistrados);
            }else{
                flowDynamic("‼*El mensaje que enviaste no coincide con ninguna de las opciones, por favor ingrese otro valor*‼\n\n*1*: Confirmar\n\n*2*: Incorrecto")
                return fallBack();
            }
        })

const flowBienvenida = addKeyword('hola')
        .addAction(async (ctx,{flowDynamic,gotoFlow })=> {
            var arrayListaNegra= [];
            try {
                // Buscar todos los clientes en la base de datos
                const listaNegra = await ListaNegra.find({});
                listaNegra.forEach(numero => {
                    arrayListaNegra.push(numero.telefono);
                });
            } catch (error) {
                console.error('Error al buscar clientes:', error);
            }
            const numero = ctx.from
            if (numero == "5493533417461"){
                gotoFlow(flowPeluquero)
            }
            else{
                if (!arrayListaNegra.includes(Number(numero))) {
                    //const clientes = await Cliente.find();
                    //console.log(clientes);
                    //consultando en base de datos si existe el numero registrado....
                    
                    const ifExist = await Cliente.exists({ telefono: numero });
                    //const ifExist = false
                    if(ifExist){
                        // Si existe lo enviamos al flujo de regostrados..
                        gotoFlow(flujoUsuariosRegistrados)
                    }else{
                        // Si NO existe lo enviamos al flujo de NO registrados..
                        gotoFlow(flujoUsuariosNORegistrados)
                    }
                }
            }
            })


const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowBienvenida, flujoUsuariosRegistrados,flowPeluquero,flowDesactivarConversacion, flowActivarConversacion, flujoUsuariosNORegistrados, flowPedirHora, flowPedir, flowConsultar, flowCancelar, flowConsultarPeluquero])
    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    },{
        blackList:[]
    }
    )
    QRPortalWeb()
}

main()