import {urlBase, fetchAnyUrl, visTid} from "./modulejson.js";

console.log("er i aktiviteter");

const urlAktiviteter = urlBase + "/activities";
const tblAktiviteter = document.getElementById("tblAktiviteter");

function createTable(aktivitet) {
    let cellCount = 0;
    let rowCount = tblAktiviteter.rows.length;
    let row = tblAktiviteter.insertRow(rowCount);

    let cell = row.insertCell(cellCount++);
    cell.textContent = aktivitet.navn;

    cell = row.insertCell(cellCount++);
    cell.textContent = aktivitet.beskrivelse;

    cell = row.insertCell(cellCount++);
    cell.textContent = aktivitet.pris + " kr.";

    cell = row.insertCell(cellCount++);
    cell.textContent = aktivitet.aldersgrænse + " år";

    cell = row.insertCell(cellCount++);
    cell.textContent = aktivitet.varighed + " min";

    cell = row.insertCell(cellCount++);
    cell.textContent = visTid(aktivitet.aabner) + " - " + visTid(aktivitet.lukker);

    // Link til bookingsiden, hvor aktiviteten er valgt på forhånd
    cell = row.insertCell(cellCount++);
    const link = document.createElement("a");
    link.href = "booking.html?aktivitet=" + aktivitet.id;
    link.textContent = "Book";
    cell.appendChild(link);
}

async function fetchAktiviteter() {
    const aktiviteter = await fetchAnyUrl(urlAktiviteter);
    console.log(aktiviteter);
    aktiviteter.forEach(createTable);
}

fetchAktiviteter();
