// US5: liste over forespørgsler. US6: detaljer. US7: godkend eller afvis.
const statusFilter = document.getElementById("statusFilter");
const tabel = document.getElementById("forespoergselTabel");
const ingenForespoergsler = document.getElementById("ingenForespoergsler");

const detaljeSektion = document.getElementById("detaljeSektion");
const detaljeTitel = document.getElementById("detaljeTitel");
const detaljer = document.getElementById("detaljer");
const tidsvalg = document.getElementById("tidsvalg");
const godkendForm = document.getElementById("godkendForm");
const detaljeBesked = document.getElementById("detaljeBesked");
const godkendKnap = document.getElementById("godkendKnap");
const afvisKnap = document.getElementById("afvisKnap");

// Den forespørgsel, der vises lige nu
let valgt = null;

// US5
async function hentForespoergsler() {
    let url = API_BASE + "/forespoergsler";
    if (statusFilter.value) {
        url = url + "?status=" + statusFilter.value;
    }
    const response = await fetch(url);
    const forespoergsler = await response.json();

    tabel.innerHTML = "";
    ingenForespoergsler.hidden = forespoergsler.length > 0;

    for (const f of forespoergsler) {
        const raekke = document.createElement("tr");
        if (valgt && valgt.id === f.id) {
            raekke.className = "valgt";
        }
        tilfoejCelle(raekke, f.id);
        tilfoejCelle(raekke, f.firmanavn);
        tilfoejCelle(raekke, formatDato(f.dato));
        tilfoejCelle(raekke, f.antalDeltagere).className = "tal";

        const statusCelle = document.createElement("td");
        statusCelle.appendChild(lavStatusMaerke(f.status));
        raekke.appendChild(statusCelle);

        const knapCelle = document.createElement("td");
        knapCelle.className = "handlinger";
        knapCelle.appendChild(lavKnap("Åbn", "sekundaer", () => visDetaljer(f.id)));
        raekke.appendChild(knapCelle);

        tabel.appendChild(raekke);
    }
}

// US6
async function visDetaljer(id) {
    const response = await fetch(API_BASE + "/forespoergsler/" + id);
    valgt = await response.json();

    detaljeTitel.textContent = "Forespørgsel nr. " + valgt.id + " – " + valgt.firmanavn;

    detaljer.innerHTML = "";
    tilfoejDetalje("Status", lavStatusMaerke(valgt.status));
    tilfoejDetalje("Kontaktperson", valgt.kontaktperson);
    tilfoejDetalje("Telefon", valgt.tlfnr);
    tilfoejDetalje("E-mail", valgt.mail);
    tilfoejDetalje("Dato", formatDato(valgt.dato));
    tilfoejDetalje("Deltagere", valgt.antalDeltagere);
    if (valgt.besked) {
        tilfoejDetalje("Besked", valgt.besked);
    }

    // Kun forespørgsler, der afventer, kan behandles (forebyg fejl)
    const kanBehandles = valgt.status === "AFVENTER";
    godkendKnap.hidden = !kanBehandles;
    afvisKnap.hidden = !kanBehandles;
    skjulBesked(detaljeBesked);

    await lavTidsvalg(kanBehandles);
    detaljeSektion.hidden = false;
    hentForespoergsler();
    detaljeSektion.scrollIntoView({ behavior: "smooth" });
}

function tilfoejDetalje(navn, vaerdi) {
    const dt = document.createElement("dt");
    dt.textContent = navn;
    const dd = document.createElement("dd");
    if (vaerdi instanceof HTMLElement) {
        dd.appendChild(vaerdi);
    } else {
        dd.textContent = vaerdi;
    }
    detaljer.appendChild(dt);
    detaljer.appendChild(dd);
}

// Én dropdown med starttider pr. aktivitet. Tider med for få pladser kan ikke vælges.
async function lavTidsvalg(kanBehandles) {
    tidsvalg.innerHTML = "";

    for (const aktivitet of valgt.aktiviteter) {
        const label = document.createElement("label");
        label.textContent = aktivitet.navn + " (" + aktivitet.varighed + " min)";

        const select = document.createElement("select");
        select.dataset.activityId = aktivitet.id;
        select.disabled = !kanBehandles;

        const url = API_BASE + "/bookings/ledige?activityId=" + aktivitet.id + "&dato=" + valgt.dato;
        const response = await fetch(url);
        const tider = await response.json();

        for (const ledigTid of tider) {
            const option = document.createElement("option");
            option.value = formatTid(ledigTid.tid);
            option.textContent = formatTid(ledigTid.tid) + " (" + ledigTid.ledigePladser + " ledige)";
            if (ledigTid.ledigePladser < valgt.antalDeltagere) {
                option.disabled = true;
            }
            select.appendChild(option);
        }

        const foersteLedige = select.querySelector("option:not([disabled])");
        if (foersteLedige) {
            select.value = foersteLedige.value;
        } else {
            // Forklar hvorfor der ikke kan vælges en tid (fx for få pladser til hele gruppen)
            const ingen = document.createElement("option");
            ingen.value = "";
            ingen.textContent = "Ingen tid med plads til " + valgt.antalDeltagere + " personer (max " + aktivitet.kapacitet + ")";
            select.prepend(ingen);
            select.value = "";
        }

        label.appendChild(select);
        tidsvalg.appendChild(label);
    }
}

// US7: godkend
async function godkend(event) {
    event.preventDefault();

    const tider = [];
    for (const select of tidsvalg.querySelectorAll("select")) {
        tider.push({ activityId: Number(select.dataset.activityId), tid: select.value });
    }

    godkendKnap.disabled = true;
    godkendKnap.textContent = "Godkender…";

    const response = await fetch(API_BASE + "/forespoergsler/" + valgt.id + "/godkend", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tider)
    });

    godkendKnap.disabled = false;
    godkendKnap.textContent = "Godkend og opret bookinger";

    if (!response.ok) {
        visBesked(detaljeBesked, await response.text() || "Forespørgslen kunne ikke godkendes.", "fejl");
        return;
    }

    await visDetaljer(valgt.id);
    visBesked(detaljeBesked, "Forespørgslen er godkendt, og bookingerne er oprettet.", "ok");
}

// US7: afvis
async function afvis() {
    if (!confirm("Afvis forespørgslen fra " + valgt.firmanavn + "?\nDet kan ikke fortrydes.")) {
        return;
    }

    const response = await fetch(API_BASE + "/forespoergsler/" + valgt.id + "/afvis", { method: "PUT" });
    if (!response.ok) {
        visBesked(detaljeBesked, await response.text() || "Forespørgslen kunne ikke afvises.", "fejl");
        return;
    }

    await visDetaljer(valgt.id);
    visBesked(detaljeBesked, "Forespørgslen er afvist.", "ok");
}

function luk() {
    valgt = null;
    detaljeSektion.hidden = true;
    hentForespoergsler();
}

statusFilter.addEventListener("change", hentForespoergsler);
godkendForm.addEventListener("submit", godkend);
afvisKnap.addEventListener("click", afvis);
document.getElementById("lukKnap").addEventListener("click", luk);

hentForespoergsler();
