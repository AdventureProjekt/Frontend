import {urlBase, fetchAnyUrl, postObjectAsJson, restDelete, visTid, visDato, visBekraeftelse} from "./modulejson.js";

console.log("er i manager-bookinger");

const urlBookinger = urlBase + "/bookings";

const inpDato = document.getElementById("inpDato");
const tblBookinger = document.getElementById("tblBookinger");
const txtIngen = document.getElementById("txtIngen");
const divRet = document.getElementById("divRet");
const formRet = document.getElementById("formRet");
const ddRetTid = document.getElementById("ddRetTid");
const txtBekraeftelse = document.getElementById("txtBekraeftelse");

// Den booking der rettes lige nu
let valgtBooking = null;

function createTable(booking) {
    let cellCount = 0;
    let rowCount = tblBookinger.rows.length;
    let row = tblBookinger.insertRow(rowCount);

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

    cell = row.insertCell(cellCount++);
    const pbRet = document.createElement("button");
    pbRet.textContent = "Ret";
    pbRet.onclick = function () {
        visRetFormular(booking);
    };
    cell.appendChild(pbRet);

    cell = row.insertCell(cellCount++);
    const pbSlet = document.createElement("button");
    pbSlet.textContent = "Slet";
    pbSlet.className = "btn1";
    pbSlet.onclick = function () {
        sletBooking(booking);
    };
    cell.appendChild(pbSlet);
}

// Fjerner alle rækker undtagen overskriften
function clearTable() {
    while (tblBookinger.rows.length > 1) {
        tblBookinger.deleteRow(1);
    }
}

async function fetchBookinger() {
    clearTable();
    const bookinger = await fetchAnyUrl(urlBookinger + "?dato=" + inpDato.value);
    console.log(bookinger);
    bookinger.forEach(createTable);

    if (bookinger.length === 0) {
        txtIngen.textContent = "Ingen bookinger denne dag";
    } else {
        txtIngen.textContent = "";
    }
}

async function sletBooking(booking) {
    if (!confirm("Vil du slette booking nr. " + booking.id + " for " + booking.kunde.navn + "?")) {
        return;
    }
    try {
        await restDelete(urlBookinger + "/" + booking.id);
        visBekraeftelse(txtBekraeftelse, "Booking nr. " + booking.id + " for " + booking.kunde.navn + " (" + booking.activity.navn
            + " kl. " + visTid(booking.tid) + ") er slettet.");
        fetchBookinger();
    } catch (error) {
        alert(error.message);
    }
}

async function visRetFormular(booking) {
    valgtBooking = booking;
    document.getElementById("txtRetTitel").textContent = "Ret booking nr. " + booking.id + " for " + booking.kunde.navn;
    document.getElementById("inpRetDato").value = booking.dato;
    document.getElementById("inpRetAntal").value = booking.antalPersoner;
    document.getElementById("inpRetMinAlder").value = booking.minAlder;
    await fetchTider(visTid(booking.tid));
    divRet.hidden = false;
}

// Fylder dropdown med aktivitetens starttider på den valgte dato
async function fetchTider(valgtTid) {
    const dato = document.getElementById("inpRetDato").value;
    const url = urlBookinger + "/ledige?activityId=" + valgtBooking.activity.id + "&dato=" + dato;
    const tider = await fetchAnyUrl(url);

    ddRetTid.innerHTML = "";
    tider.forEach(ledigTid => {
        const option = document.createElement("option");
        option.value = visTid(ledigTid.tid);
        option.textContent = visTid(ledigTid.tid);
        ddRetTid.appendChild(option);
    });
    if (valgtTid) {
        ddRetTid.value = valgtTid;
    }
}

async function handleRetSubmit(event) {
    event.preventDefault();
    const booking = {
        activity: {id: valgtBooking.activity.id},
        dato: document.getElementById("inpRetDato").value,
        tid: ddRetTid.value,
        antalPersoner: document.getElementById("inpRetAntal").value,
        minAlder: document.getElementById("inpRetMinAlder").value
    };
    try {
        const opdateret = await postObjectAsJson(urlBookinger + "/" + valgtBooking.id, booking, "PUT");
        visBekraeftelse(txtBekraeftelse, "Booking nr. " + opdateret.id + " for " + opdateret.kunde.navn + " er opdateret: "
            + opdateret.activity.navn + " d. " + visDato(opdateret.dato) + " kl. " + visTid(opdateret.tid)
            + ", " + opdateret.antalPersoner + " personer.");
        divRet.hidden = true;
        window.scrollTo(0, 0);
        fetchBookinger();
    } catch (error) {
        alert(error.message);
    }
}

inpDato.value = new Date().toLocaleDateString("sv-SE");
inpDato.addEventListener("change", fetchBookinger);
document.getElementById("inpRetDato").addEventListener("change", () => fetchTider(null));
formRet.addEventListener("submit", handleRetSubmit);
document.getElementById("pbAnnuller").addEventListener("click", () => divRet.hidden = true);

fetchBookinger();
