import {urlBase, fetchAnyUrl, visTid} from "./modulejson.js";

console.log("er i medarbejder");

const urlAktiviteter = urlBase + "/activities";
const urlBookinger = urlBase + "/bookings";
const urlUdstyr = urlBase + "/udstyr";
const urlUdstyrBehov = urlBase + "/udstyr/behov";

const ddAktivitet = document.getElementById("ddAktivitet");
const inpDato = document.getElementById("inpDato");
const tblBookinger = document.getElementById("tblBookinger");
const tblUdstyr = document.getElementById("tblUdstyr");
const txtOpsummering = document.getElementById("txtOpsummering");
const txtIngenUdstyr = document.getElementById("txtIngenUdstyr");

// Udstyr for hver aktivitet: aktivitetens id -> liste med udstyr
let udstyrMap = new Map();

function fillDropdown(aktivitet) {
    const option = document.createElement("option");
    option.textContent = aktivitet.navn;
    option.value = aktivitet.id;
    ddAktivitet.appendChild(option);
}

function createBookingRow(booking) {
    let cellCount = 0;
    let row = tblBookinger.insertRow(tblBookinger.rows.length);

    let cell = row.insertCell(cellCount++);
    cell.textContent = booking.id;

    cell = row.insertCell(cellCount++);
    cell.textContent = visTid(booking.tid);

    cell = row.insertCell(cellCount++);
    cell.textContent = booking.activity.navn;

    cell = row.insertCell(cellCount++);
    cell.textContent = booking.kunde.navn;

    cell = row.insertCell(cellCount++);
    cell.textContent = booking.kunde.tlfnr;

    cell = row.insertCell(cellCount++);
    cell.textContent = booking.antalPersoner;

    cell = row.insertCell(cellCount++);
    cell.textContent = booking.minAlder + " år";

    // Udstyr til netop denne booking, fx "6 Hjelm, 6 Handsker"
    cell = row.insertCell(cellCount++);
    cell.textContent = udstyrTilBooking(booking);
}

function udstyrTilBooking(booking) {
    const udstyrListe = udstyrMap.get(booking.activity.id);
    if (!udstyrListe || udstyrListe.length === 0) {
        return "-";
    }
    const tekster = udstyrListe.map(udstyr => (udstyr.antalPrPerson * booking.antalPersoner) + " " + udstyr.navn);
    return tekster.join(", ");
}

function createUdstyrRow(behov) {
    let cellCount = 0;
    let row = tblUdstyr.insertRow(tblUdstyr.rows.length);

    let cell = row.insertCell(cellCount++);
    cell.textContent = behov.aktivitet;

    cell = row.insertCell(cellCount++);
    cell.textContent = behov.udstyr;

    cell = row.insertCell(cellCount++);
    cell.textContent = behov.antal;
}

// Fjerner alle rækker undtagen overskriften
function clearTable(table) {
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
}

async function fetchBookinger() {
    clearTable(tblBookinger);

    // 0 betyder alle aktiviteter
    let url = urlBookinger + "?dato=" + inpDato.value;
    if (ddAktivitet.value !== "0") {
        url = urlBookinger + "/aktivitet/" + ddAktivitet.value + "?dato=" + inpDato.value;
    }
    const bookinger = await fetchAnyUrl(url);
    bookinger.forEach(createBookingRow);

    let personer = 0;
    bookinger.forEach(booking => personer = personer + booking.antalPersoner);
    txtOpsummering.textContent = bookinger.length + " bookinger, " + personer + " personer i alt";
}

async function fetchUdstyr() {
    clearTable(tblUdstyr);
    const url = urlUdstyrBehov + "?dato=" + inpDato.value + "&activityId=" + ddAktivitet.value;
    const udstyrListe = await fetchAnyUrl(url);
    udstyrListe.forEach(createUdstyrRow);

    if (udstyrListe.length === 0) {
        txtIngenUdstyr.textContent = "Intet udstyr skal gøres klar";
    } else {
        txtIngenUdstyr.textContent = "";
    }
}

function opdater() {
    fetchUdstyr();
    fetchBookinger();
}

async function fetchAktiviteter() {
    const aktiviteter = await fetchAnyUrl(urlAktiviteter);
    aktiviteter.forEach(fillDropdown);

    // Hent udstyret for hver aktivitet én gang, så det kan vises ved hver booking
    for (const aktivitet of aktiviteter) {
        const udstyrListe = await fetchAnyUrl(urlUdstyr + "?activityId=" + aktivitet.id);
        udstyrMap.set(aktivitet.id, udstyrListe);
    }
    opdater();
}

inpDato.value = new Date().toLocaleDateString("sv-SE");
ddAktivitet.addEventListener("change", opdater);
inpDato.addEventListener("change", opdater);

fetchAktiviteter();
