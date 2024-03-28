
const fs = require('fs');// Importa el módulo 'fs' para manipular el sistema de archivos (opcional, solo si lo necesitas)
const { parse, format, getDay } = require('date-fns');

const RESPONSES_SHEET_ID = '11XJabkmygBQ79l1lIL4Yii18m79FVBPDZVYhR2Ylerg'; //Aquí pondras el ID de tu hoja de Sheets
const { GoogleSpreadsheet } = require('google-spreadsheet'); // esto es la base de la hoja de sheets
const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID);

const CREDENTIALS = JSON.parse(fs.readFileSync('./credenciales.json'));
const axios = require('axios');


const Cliente = require("../models/Clientes");



function sumarDiasAFecha(cantidadDias) {
    const fechaActual = new Date();
    const nuevaFecha = new Date();
    
    nuevaFecha.setDate(fechaActual.getDate() + cantidadDias);

    const nuevaFechaFormateada = `${('0' + nuevaFecha.getDate()).slice(-2)}/${('0' + (nuevaFecha.getMonth() + 1)).slice(-2)}/${nuevaFecha.getFullYear()}`;

    return nuevaFechaFormateada;
}


function obtenerDiaSemana(fechaString) { // esto le daras una fecha y te devuelte el dia de lunes a domingo
    // Parseamos la fecha
    const fecha = parse(fechaString, 'dd/MM/yyyy', new Date());
    
    // Obtenemos el número correspondiente al día de la semana (0 para Domingo, 1 para Lunes, ..., 6 para Sábado)
    const diaSemana = getDay(fecha);
    
    // Array con los nombres de los días de la semana
    const nombresDias = ['Domingo', 'Lunes     ', 'Martes  ', 'Miércoles', 'Jueves    ', 'Viernes  ', 'Sábado  '];
    
    // Retornamos el nombre del día de la semana
    return nombresDias[diaSemana];}



async function consultarAsistencia(numero){ //numero del cliente que se quiera consultar los turnos
    console.log("hola mundo")
    const client = await Cliente.find({telefono: numero});
    if (!client[0]) {
        console.log(`No se encontró ningún cliente con el número de teléfono ${numero}`);
        return;
    }
    var tieneTurno = 0
    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key
    });
    await doc.loadInfo();
    let horas = [
        'Fecha', '8:00',  '8:30',
        '9:00',  '9:30',  '10:00',
        '10:30', '11:00', '11:30',
        '12:00', '12:30', '17:00',
        '18:30', '19:00', '19:30',
        '20:00', '20:30'
    ]
    let sheet = doc.sheetsByTitle['turno'];
    var contador = 0;
    var turno = [];
    var asistencia = [];
    let rows = await sheet.getRows();
    let indice = 1;
    let mensaje = "Cliente: *" + client[0].nombre + " "+ client[0].apellido+ "  👤*\n\n*Tus turnos:*  🗓";
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        if (row.Fecha == sumarDiasAFecha(contador)) {
            if (row._rawData.includes(client[0].documento + '::' + client[0].nombre + ' ' + client[0].apellido)){
                for(var j=0; j < row._rawData.length; j++) {
                    if (row._rawData[j] == client[0].documento + '::' + client[0].nombre + ' ' + client[0].apellido){
                        asistencia.push(row.Fecha)
                        asistencia.push(horas[j])
                        const dia = obtenerDiaSemana(row.Fecha);
                        mensaje = mensaje +"\n\n*" +indice+":*\n"+"Fecha: *"+ dia+" "+ row.Fecha + "*  🌞\nHora: *"+horas[j]+"*  🕔\n\n----------------------";
                        indice = indice+1;
                        tieneTurno = tieneTurno +1
                    }
                }
            }
            turno.push(row._rawData) // conseguir los horarios de una fecha
            contador = contador+1;
            if (contador == 9){
                contador = 0
            }
        }
    }
    return [mensaje, asistencia, tieneTurno];
};



async function borrarAsistencia(fila, columna){ //fecha y hora que se quiera borrar la asistencia
    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key
    });
    await doc.loadInfo();
    let sheet = doc.sheetsByTitle['turno'];
    // Encontrar el número de fila y columna por su nombre

    const rows = await sheet.getRows();
    let columns = rows[0] ? Object.keys(rows[0]) : [];

    let horas = [
        'Fecha', '8:00',  '8:30',
        '9:00',  '9:30',  '10:00',
        '10:30', '11:00', '11:30',
        '12:00', '12:30', '17:00',
        '18:30', '19:00', '19:30',
        '20:00', '20:30'
    ]
    for (var index = 0; index < rows.length; index++){
        const row = rows[index];
        if (row.Fecha == fila){
            for (j = 0; j < columns.length; j++){
                if (columna == horas[j] && horas[j] != undefined){
                    await sheet.loadCells();
                    const cell = sheet.getCell(index+1, j);
                    cell.value = ''; // Cambia esto
                    await sheet.saveUpdatedCells(); // Asegúrate de guardar los cambios
                }
            }
        }
    }
};


async function agregarDato(fecha, hora, dato) { //fecha de la que se quiera agregar la asistencia
    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key
    });

    await doc.loadInfo();
    let sheet = doc.sheetsByTitle['turno']; // AQUÍ DEBES PONER EL NOMBRE DE TU HOJA

    let rows = await sheet.getRows();

    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        if (row.Fecha == fecha) {
            row[hora] = dato; // reemplaza 'NombreDeLaColumna' con el nombre de la columna donde quieres agregar el dato
            await row.save(); // guarda los cambios en la hoja
        }
    }
}



/**
 * Consults the availability for a given date and time in the Google Sheets.
 * @param {string[]} fechaHora - An array containing the date and time to check availability.
 * @returns {string[]} - An array containing the availability status for each time slot.
 */
async function consultarDisponibilidad(fechaHora){ //busca una fecha en el sheets y me devuelve un array con la disponibilidad
    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key
    });
    await doc.loadInfo();
    let sheet = doc.sheetsByTitle['turno'];// AQUÍ DEBES PONER EL NOMBRE DE TU HOJA

    disponibilidad = [];

    let rows = await sheet.getRows();//obtengo el largo de filas
    let columns = rows[0] ? Object.keys(rows[0]) : [];//obtengo el largo de la columnas
    let horas = [
        'Fecha', '8:00',  '8:30',
        '9:00',  '9:30',  '10:00',
        '10:30', '11:00', '11:30',
        '12:00', '12:30', '17:00',
        '18:30', '19:00', '19:30',
        '20:00', '20:30'
    ]
    //let horas = ["Horario1", "Horario2", "Horario3","Horario4", "Horario5", "Horario6", "Horario7", "Horario8", "Horario9", "Horario10", "Horario11", "Horario12", "Horario13","Horario14", "Horario15", "Horario16"]
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
    
        if (row.Fecha == fechaHora[0]) {

            for (j = 1; j < columns.length; j++) {
                // Accede a las propiedades de 'row' usando los valores de 'horas' como claves.
                
                if (fechaHora[j] == horas[j] && fechaHora[j] != undefined){
                
                    if(row[horas[j]] == "" || row[horas[j]] == undefined) {
                        disponibilidad.push("Disponible")
                    }else{disponibilidad.push("Ocupado")}
                }
                //disponibilidad = row // conseguir los horarios de una fecha
    
                //console.log(disponibilidad)
            }
        }
    }
console.log(disponibilidad)
return disponibilidad
};


async function conseguirTurnosDisponibilidad(){
    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key
    });
    await doc.loadInfo();

    let sheetTurno = doc.sheetsByTitle['turno'];
    let sheetTrabajo = doc.sheetsByTitle['trabajo'];

    let trabajo = [];
    let rows = await sheetTrabajo.getRows();
    var contador = 0;
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        if (row.Fecha == sumarDiasAFecha(contador)) {
            trabajo.push(row._rawData) // conseguir los horarios de una fecha
            contador = contador+1;
            if (contador == 9){
                contador = 0
            }
        }
    }
    console.log(trabajo)
    let arrayDisponibilidad = []
    let disponibilidad = []
    let rowsTurno = await sheetTurno.getRows()
    
    let columns = rows[0] ? Object.keys(rows[0]) : [];//obtengo el largo de la columnas
    let horas = [
        'Fecha', '8:00',  '8:30',
        '9:00',  '9:30',  '10:00',
        '10:30', '11:00', '11:30',
        '12:00', '12:30', '17:00',
        '18:30', '19:00', '19:30',
        '20:00', '20:30'
    ]
    var contador = 0;
    for (let index = 0; index < rowsTurno.length; index++) {
        const row = rowsTurno[index];

        if (row.Fecha == trabajo[contador][0]) {
            for (j = 1; j < columns.length; j++) {
                // Accede a las propiedades de 'row' usando los valores de 'horas' como claves.
                if (trabajo[contador][j] == horas[j] && horas[j] != undefined){

                    if(row[horas[j]] == "" || row[horas[j]] == undefined) {
                        disponibilidad.push("Disponible")
                    }else{disponibilidad.push("Ocupado")}
                }
                //disponibilidad = row // conseguir los horarios de una fecha
    
                //console.log(disponibilidad)
            }
            arrayDisponibilidad.push(disponibilidad)
            disponibilidad = []
            contador = contador + 1
            if (contador==9){
                contador = 0
            }
        }
    }
    console.log(arrayDisponibilidad)
    return [trabajo, arrayDisponibilidad];
};


async function consultarDatos(fecha){ //busca una fecha en el sheets y me devuelve un array con los horarios en los que se trabaja
    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key
    });
    await doc.loadInfo();
    let sheet = doc.sheetsByTitle['trabajo'];// AQUÍ DEBES PONER EL NOMBRE DE TU HOJA

    consultados = [];

    let rows = await sheet.getRows();
    
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        if (row.Fecha == fecha) {
            consultados = row._rawData // conseguir los horarios de una fecha
        }
}
return consultados
};


async function enviarSolicitud(texto, num) {
    const data = {
        mensaje: texto,
        numero: num
    };

    try {
        const response = await axios.post('http://localhost:4000/send-message-bot', data);
        console.log('Solicitud enviada correctamente:', response.data);
    } catch (error) {
        console.error('Error al enviar la solicitud:', error);
    }
}



module.exports = {consultarAsistencia, obtenerDiaSemana, 
    borrarAsistencia, agregarDato, consultarDisponibilidad,
    conseguirTurnosDisponibilidad, sumarDiasAFecha, consultarDatos,
    enviarSolicitud};