const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
//const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), './credencialesCalendar.json');



/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
} catch (err) {
    return null;
}
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function addEvent(auth, cliente, fecha, documento, numero) {
    //ejemplo entrada 2024-03-12T12:30:00
    //ejemplo entrada 2024-03-12T12:30:00
    let fechaInicio = new Date(fecha);
    let fechaFin = new Date(fechaInicio.getTime() + 30*60000); // Agrega 30 minutos

    const event = {
        summary: "Turno("+cliente+")",
        description: "Documento: "+ documento + "\nnumero: "+ numero,
        start: {
          //dateTime: '2024-03-15T09:00:00-03:00', // Ajustado a la zona horaria de Argentina
          dateTime: fechaInicio.toISOString(),
        },
        end: {
          //dateTime: '2024-03-15T09:30:00-03:00', // Ajustado a la zona horaria de Argentina
            dateTime: fechaFin.toISOString(),
        },
    };
    const calendar = google.calendar({version: 'v3', auth});
    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      console.log('Event created: %s', response.data.htmlLink);
      console.log(response.data.id);
      return response.data.id;  // Devuelve el ID del evento creado
    } catch (err) {
      console.log('Error: ' + err);
    }
}


async function deleteEvent(auth, eventId) {
    
    const calendar = google.calendar({version: 'v3', auth});
    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
      console.log('Event deleted');
    } catch (err) {
      console.log('Error: ' + err);
    }
  }

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });
  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log('No upcoming events found.');
    return;
  }
  console.log('Upcoming 10 events:');
  events.map((event, i) => {
    const start = event.start.dateTime || event.start.date;
    console.log(`${start} - ${event.summary}`);
  });
}
async function deleteEventOnDateAndTime(auth, date, time) {
    const calendar = google.calendar({version: 'v3', auth});
    try {
        const dateTime = new Date(date + 'T' + time);
        const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: dateTime.toISOString(),
            timeMax: new Date(dateTime.getTime() + 60 * 60 * 1000).toISOString(), // +1 hour
            singleEvents: true,
            orderBy: 'startTime',
        });
        const events = res.data.items;
        if (!events || events.length === 0) {
            console.log('No events found at this date and time.');
            return;
        }
        for (let event of events) {
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: event.id,
            });
            console.log('Event deleted: ' + event.id);
        }
    } catch (err) {
        console.log('Error: ' + err);
    }
}


//authorize().then(auth => deleteEvent(auth, "recqe7l1ks48ktufn8r9gcqbh4")).catch(console.error);
//authorize().then(auth => addEvent(auth, "Martin Gaido", "2024-03-13T12:30:00", "45087673", "353399701")).catch(console.error);
authorize().then(auth => deleteEventOnDateAndTime(auth, "2024-03-18", "08:00:00")).catch(console.error);
//authorize().then(listEvents).catch(console.error);

module.exports = {
    loadSavedCredentialsIfExist,
    saveCredentials,
    authorize,
    addEvent,
    deleteEvent,
    listEvents,
    deleteEventOnDateAndTime
};