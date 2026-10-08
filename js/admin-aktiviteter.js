import {urlBase, fetchAnyUrl, postObjectAsJson, restDelete, visTid, visBekraeftelse} from "./modulejson.js";

console.log("er i admin-aktiviteter");

const urlAktiviteter = urlBase + "/activities";

const formAktivitet = document.getElementById("formAktivitet");
const tblAktiviteter = document.getElementById("tblAktiviteter");
const pbGem = document.getElementById("pbGem");
const pbAnnuller = document.getElementById("pbAnnuller");
const txtBekraeftelse = document.getElementById("txtBekraeftelse");

// null = vi opretter en ny aktivitet, ellers id'et på den vi retter
let retId = null;

function createTable(aktivitet) {
    let cellCount = 0;
    let rowCount = tblAktiviteter.rows.length;
    let row = tblAktiviteter.insertRow(rowCount);

    let cell = row.insertCell(cellCount++);
    cell.textContent = aktivitet.navn;

    cell = row.insertCell(cellCount++);
    cell.textContent = aktivitet.pris + " kr.";

    cell = row.insertCell(cellCount++);
    cell.textContent = aktivitet.aldersgrænse + " år";

    cell = row.insertCell(cellCount++);
    cell.textContent = aktivitet.varighed + " min";

    cell = row.insertCell(cellCount++);
    cell.textContent = aktivitet.kapacitet;

    cell = row.insertCell(cellCount++);
    cell.textContent = visTid(aktivitet.aabner) + " - " + visTid(aktivitet.lukker);

    cell = row.insertCell(cellCount++);
    const pbRet = document.createElement("button");
    pbRet.textContent = "Ret";
    pbRet.onclick = function () {
        startRet(aktivitet);
    };
    cell.appendChild(pbRet);

    cell = row.insertCell(cellCount++);
    const pbSlet = document.createElement("button");
    pbSlet.textContent = "Slet";
    pbSlet.className = "btn1";
    pbSlet.onclick = function () {
        sletAktivitet(aktivitet);
    };
    cell.appendChild(pbSlet);

    cell = row.insertCell(cellCount++);
    const pbUdstyr = document.createElement("button");
    pbUdstyr.textContent = "Udstyr";
    pbUdstyr.className = "btn2";
    pbUdstyr.onclick = function () {
        visUdstyr(aktivitet);
    };
    cell.appendChild(pbUdstyr);
}

// ---------- Udstyr til en aktivitet ----------

const urlUdstyr = urlBase + "/udstyr";
const divUdstyr = document.getElementById("divUdstyr");
const tblUdstyr = document.getElementById("tblUdstyr");
const formUdstyr = document.getElementById("formUdstyr");

// Den aktivitet hvis udstyr vises lige nu
let udstyrAktivitet = null;

function createUdstyrRow(udstyr) {
    let cellCount = 0;
    let row = tblUdstyr.insertRow(tblUdstyr.rows.length);

    let cell = row.insertCell(cellCount++);
    cell.textContent = udstyr.navn;

    cell = row.insertCell(cellCount++);
    cell.textContent = udstyr.antalPrPerson;

    cell = row.insertCell(cellCount++);
    const pbSlet = document.createElement("button");
    pbSlet.textContent = "Slet";
    pbSlet.className = "btn1";
    pbSlet.onclick = async function () {
        try {
            await restDelete(urlUdstyr + "/" + udstyr.id);
            visBekraeftelse(document.getElementById("txtUdstyrBekraeftelse"), udstyr.navn + " er fjernet fra " + udstyrAktivitet.navn + ".");
            fetchUdstyr();
        } catch (error) {
            alert(error.message);
        }
    };
    cell.appendChild(pbSlet);
}

async function fetchUdstyr() {
    while (tblUdstyr.rows.length > 1) {
        tblUdstyr.deleteRow(1);
    }
    const udstyrListe = await fetchAnyUrl(urlUdstyr + "?activityId=" + udstyrAktivitet.id);
    udstyrListe.forEach(createUdstyrRow);
}

function visUdstyr(aktivitet) {
    udstyrAktivitet = aktivitet;
    document.getElementById("txtUdstyrBekraeftelse").hidden = true;
    document.getElementById("txtUdstyrTitel").textContent = "Udstyr til " + aktivitet.navn;
    divUdstyr.hidden = false;
    fetchUdstyr();
    divUdstyr.scrollIntoView();
}

async function handleUdstyrSubmit(event) {
    event.preventDefault();
    try {
        const formData = new FormData(formUdstyr);
        const udstyr = Object.fromEntries(formData.entries());
        udstyr.activity = {id: udstyrAktivitet.id};
        await postObjectAsJson(urlUdstyr, udstyr, "POST");
        visBekraeftelse(document.getElementById("txtUdstyrBekraeftelse"), udstyr.navn + " er tilføjet til " + udstyrAktivitet.navn + ".");
        formUdstyr.reset();
        fetchUdstyr();
    } catch (error) {
        alert(error.message);
    }
}

formUdstyr.addEventListener("submit", handleUdstyrSubmit);
document.getElementById("pbLukUdstyr").addEventListener("click", () => divUdstyr.hidden = true);

function clearTable() {
    while (tblAktiviteter.rows.length > 1) {
        tblAktiviteter.deleteRow(1);
    }
}

async function fetchAktiviteter() {
    clearTable();
    const aktiviteter = await fetchAnyUrl(urlAktiviteter);
    console.log(aktiviteter);
    aktiviteter.forEach(createTable);
}

async function handleFormSubmit(event) {
    event.preventDefault();
    try {
        const formData = new FormData(formAktivitet);
        const aktivitet = Object.fromEntries(formData.entries());

        if (retId === null) {
            await postObjectAsJson(urlAktiviteter, aktivitet, "POST");
            visBekraeftelse(txtBekraeftelse, aktivitet.navn + " er oprettet.");
        } else {
            await postObjectAsJson(urlAktiviteter + "/" + retId, aktivitet, "PUT");
            visBekraeftelse(txtBekraeftelse, aktivitet.navn + " er opdateret.");
        }
        nulstilFormular();
        fetchAktiviteter();
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}

// Fylder formularen med aktivitetens værdier, så den kan rettes
function startRet(aktivitet) {
    retId = aktivitet.id;
    document.getElementById("inpNavn").value = aktivitet.navn;
    document.getElementById("inpBeskrivelse").value = aktivitet.beskrivelse;
    document.getElementById("inpPris").value = aktivitet.pris;
    document.getElementById("inpAlder").value = aktivitet.aldersgrænse;
    document.getElementById("inpVarighed").value = aktivitet.varighed;
    document.getElementById("inpKapacitet").value = aktivitet.kapacitet;
    document.getElementById("inpAabner").value = visTid(aktivitet.aabner);
    document.getElementById("inpLukker").value = visTid(aktivitet.lukker);

    document.getElementById("txtFormTitel").textContent = "Ret " + aktivitet.navn;
    pbGem.textContent = "Gem ændringer";
    pbAnnuller.hidden = false;
    window.scrollTo(0, 0);
}

function nulstilFormular() {
    retId = null;
    formAktivitet.reset();
    document.getElementById("txtFormTitel").textContent = "Opret aktivitet";
    pbGem.textContent = "Opret";
    pbAnnuller.hidden = true;
}

async function sletAktivitet(aktivitet) {
    if (!confirm("Vil du slette " + aktivitet.navn + "?")) {
        return;
    }
    try {
        await restDelete(urlAktiviteter + "/" + aktivitet.id);
        visBekraeftelse(txtBekraeftelse, aktivitet.navn + " er slettet.");
        divUdstyr.hidden = true;
        fetchAktiviteter();
        window.scrollTo(0, 0);
    } catch (error) {
        alert(error.message);
    }
}

formAktivitet.addEventListener("submit", handleFormSubmit);
pbAnnuller.addEventListener("click", nulstilFormular);

fetchAktiviteter();
