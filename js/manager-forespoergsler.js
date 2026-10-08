import {urlBase, fetchAnyUrl, postObjectAsJson, visTid, visBekraeftelse} from "./modulejson.js";

console.log("er i manager-forespoergsler");

const urlForespoergsler = urlBase + "/forespoergsler";
const urlLedige = urlBase + "/bookings/ledige";

const ddStatus = document.getElementById("ddStatus");
const tblForespoergsler = document.getElementById("tblForespoergsler");
const divDetaljer = document.getElementById("divDetaljer");
const divTider = document.getElementById("divTider");
const txtBekraeftelse = document.getElementById("txtBekraeftelse");

// Den forespørgsel der vises lige nu
let valgt = null;

function createTable(forespoergsel) {
    let cellCount = 0;
    let rowCount = tblForespoergsler.rows.length;
    let row = tblForespoergsler.insertRow(rowCount);

    let cell = row.insertCell(cellCount++);
    cell.textContent = forespoergsel.id;

    cell = row.insertCell(cellCount++);
    cell.textContent = forespoergsel.firmanavn;

    cell = row.insertCell(cellCount++);
    cell.textContent = forespoergsel.dato;

    cell = row.insertCell(cellCount++);
    cell.textContent = forespoergsel.antalDeltagere;

    cell = row.insertCell(cellCount++);
    cell.textContent = forespoergsel.status;

    cell = row.insertCell(cellCount++);
    const pbVis = document.createElement("button");
    pbVis.textContent = "Vis";
    pbVis.onclick = function () {
        visDetaljer(forespoergsel);
    };
    cell.appendChild(pbVis);
}

function clearTable() {
    while (tblForespoergsler.rows.length > 1) {
        tblForespoergsler.deleteRow(1);
    }
}

async function fetchForespoergsler() {
    clearTable();
    let url = urlForespoergsler;
    if (ddStatus.value) {
        url = url + "?status=" + ddStatus.value;
    }
    const forespoergsler = await fetchAnyUrl(url);
    console.log(forespoergsler);
    forespoergsler.forEach(createTable);
}

async function visDetaljer(forespoergsel) {
    valgt = forespoergsel;
    document.getElementById("txtTitel").textContent = "Forespørgsel " + forespoergsel.id + ": " + forespoergsel.firmanavn;
    document.getElementById("txtKontakt").textContent = forespoergsel.kontaktperson + ", " + forespoergsel.tlfnr + ", " + forespoergsel.mail
        + ". " + forespoergsel.antalDeltagere + " deltagere d. " + forespoergsel.dato;
    document.getElementById("txtBesked").textContent = forespoergsel.besked ? "Besked: " + forespoergsel.besked : "";

    // En dropdown med starttider for hver aktivitet
    divTider.innerHTML = "";
    for (const aktivitet of forespoergsel.aktiviteter) {
        const label = document.createElement("label");
        label.textContent = aktivitet.navn;

        const dropdown = document.createElement("select");
        dropdown.className = "inputfield";
        dropdown.dataset.activityId = aktivitet.id;

        const tider = await fetchAnyUrl(urlLedige + "?activityId=" + aktivitet.id + "&dato=" + forespoergsel.dato);
        tider.forEach(ledigTid => {
            const option = document.createElement("option");
            option.value = visTid(ledigTid.tid);
            option.textContent = visTid(ledigTid.tid) + " (" + ledigTid.ledigePladser + " ledige)";
            // Der skal være plads til hele firmaet
            if (ledigTid.ledigePladser < forespoergsel.antalDeltagere) {
                option.disabled = true;
            }
            dropdown.appendChild(option);
        });

        const div = document.createElement("div");
        div.className = "form-group";
        div.appendChild(label);
        div.appendChild(dropdown);
        divTider.appendChild(div);
    }

    // Kun forespørgsler der afventer kan godkendes eller afvises
    const kanBehandles = forespoergsel.status === "AFVENTER";
    document.getElementById("pbGodkend").hidden = !kanBehandles;
    document.getElementById("pbAfvis").hidden = !kanBehandles;
    divDetaljer.hidden = false;
}

async function godkend() {
    const tider = [];
    const tekster = [];
    divTider.querySelectorAll("select").forEach(dropdown => {
        tider.push({activityId: dropdown.dataset.activityId, tid: dropdown.value});
        tekster.push(dropdown.previousSibling.textContent + " kl. " + dropdown.value);
    });
    try {
        await postObjectAsJson(urlForespoergsler + "/" + valgt.id + "/godkend", tider, "PUT");
        visBekraeftelse(txtBekraeftelse, "Forespørgsel " + valgt.id + " fra " + valgt.firmanavn
            + " er godkendt. Oprettede bookinger: " + tekster.join(", ") + ".");
        divDetaljer.hidden = true;
        window.scrollTo(0, 0);
        fetchForespoergsler();
    } catch (error) {
        alert(error.message);
    }
}

async function afvis() {
    if (!confirm("Vil du afvise forespørgslen fra " + valgt.firmanavn + "?")) {
        return;
    }
    try {
        await postObjectAsJson(urlForespoergsler + "/" + valgt.id + "/afvis", {}, "PUT");
        visBekraeftelse(txtBekraeftelse, "Forespørgsel " + valgt.id + " fra " + valgt.firmanavn + " er afvist.");
        divDetaljer.hidden = true;
        window.scrollTo(0, 0);
        fetchForespoergsler();
    } catch (error) {
        alert(error.message);
    }
}

ddStatus.addEventListener("change", fetchForespoergsler);
document.getElementById("pbGodkend").addEventListener("click", godkend);
document.getElementById("pbAfvis").addEventListener("click", afvis);
document.getElementById("pbLuk").addEventListener("click", () => divDetaljer.hidden = true);

fetchForespoergsler();
