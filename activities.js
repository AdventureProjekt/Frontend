// US12: ejeren opretter, retter og sletter aktiviteter
const API_URL = API_BASE + "/activities";

const form = document.getElementById("aktivitetForm");
const formSektion = document.getElementById("formSektion");
const formTitel = document.getElementById("formTitel");
const gemKnap = document.getElementById("gemKnap");
const fejlbesked = document.getElementById("fejlbesked");
const listeBesked = document.getElementById("listeBesked");
const tabel = document.getElementById("aktivitetTabel");
const ingenAktiviteter = document.getElementById("ingenAktiviteter");

// null = vi opretter en ny aktivitet, ellers id'et på den vi retter
let redigererId = null;

async function hentAktiviteter() {
    const response = await fetch(API_URL);
    const aktiviteter = await response.json();

    tabel.innerHTML = "";
    ingenAktiviteter.hidden = aktiviteter.length > 0;
    for (const aktivitet of aktiviteter) {
        tabel.appendChild(lavRaekke(aktivitet));
    }
}

function lavRaekke(aktivitet) {
    const raekke = document.createElement("tr");
    if (aktivitet.id === redigererId) {
        raekke.className = "valgt";
    }

    // Navn med beskrivelse nedenunder (nærhed)
    const navnCelle = tilfoejCelle(raekke, aktivitet.navn);
    const beskrivelse = document.createElement("span");
    beskrivelse.className = "svag";
    beskrivelse.textContent = aktivitet.beskrivelse;
    navnCelle.appendChild(beskrivelse);

    tilfoejCelle(raekke, aktivitet.pris + " kr.").className = "tal";
    tilfoejCelle(raekke, aktivitet.aldersgrænse + "+").className = "tal";
    tilfoejCelle(raekke, aktivitet.varighed + " min").className = "tal";
    tilfoejCelle(raekke, aktivitet.kapacitet).className = "tal";
    tilfoejCelle(raekke, formatTid(aktivitet.aabner) + "–" + formatTid(aktivitet.lukker));

    const knapCelle = document.createElement("td");
    knapCelle.className = "handlinger";
    knapCelle.appendChild(lavKnap("Ret", "sekundaer", () => startRediger(aktivitet)));
    knapCelle.appendChild(lavKnap("Slet", "fare", () => sletAktivitet(aktivitet)));
    raekke.appendChild(knapCelle);

    return raekke;
}

function laesFormular() {
    return {
        navn: document.getElementById("navn").value,
        pris: Number(document.getElementById("pris").value),
        beskrivelse: document.getElementById("beskrivelse").value,
        aldersgrænse: Number(document.getElementById("aldersgraense").value),
        varighed: Number(document.getElementById("varighed").value),
        kapacitet: Number(document.getElementById("kapacitet").value),
        aabner: document.getElementById("aabner").value,
        lukker: document.getElementById("lukker").value
    };
}

async function gemAktivitet(event) {
    event.preventDefault();
    skjulBesked(fejlbesked);

    const aktivitet = laesFormular();

    let url = API_URL;
    let method = "POST";
    if (redigererId !== null) {
        url = API_URL + "/" + redigererId;
        method = "PUT";
    }

    gemKnap.disabled = true;
    const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aktivitet)
    });
    gemKnap.disabled = false;

    if (!response.ok) {
        visBesked(fejlbesked, await response.text() || "Aktiviteten kunne ikke gemmes.", "fejl");
        return;
    }

    if (redigererId !== null) {
        visBesked(listeBesked, aktivitet.navn + " er opdateret.", "ok");
    } else {
        visBesked(listeBesked, aktivitet.navn + " er oprettet.", "ok");
    }
    lukFormular();
}

function aabnNyAktivitet() {
    redigererId = null;
    form.reset();
    formTitel.textContent = "Ny aktivitet";
    gemKnap.textContent = "Opret aktivitet";
    skjulBesked(fejlbesked);
    skjulBesked(listeBesked);
    formSektion.hidden = false;
    hentAktiviteter();
    document.getElementById("navn").focus();
}

function startRediger(aktivitet) {
    redigererId = aktivitet.id;

    document.getElementById("navn").value = aktivitet.navn;
    document.getElementById("pris").value = aktivitet.pris;
    document.getElementById("beskrivelse").value = aktivitet.beskrivelse;
    document.getElementById("aldersgraense").value = aktivitet.aldersgrænse;
    document.getElementById("varighed").value = aktivitet.varighed;
    document.getElementById("kapacitet").value = aktivitet.kapacitet;
    document.getElementById("aabner").value = formatTid(aktivitet.aabner);
    document.getElementById("lukker").value = formatTid(aktivitet.lukker);

    formTitel.textContent = "Ret " + aktivitet.navn;
    gemKnap.textContent = "Gem ændringer";
    skjulBesked(fejlbesked);
    skjulBesked(listeBesked);
    formSektion.hidden = false;
    hentAktiviteter();
    formSektion.scrollIntoView({ behavior: "smooth" });
}

function lukFormular() {
    redigererId = null;
    form.reset();
    formSektion.hidden = true;
    hentAktiviteter();
}

async function sletAktivitet(aktivitet) {
    if (!confirm("Slet " + aktivitet.navn + "?\nDet kan ikke fortrydes.")) {
        return;
    }

    const response = await fetch(API_URL + "/" + aktivitet.id, { method: "DELETE" });
    if (response.ok) {
        visBesked(listeBesked, aktivitet.navn + " er slettet.", "ok");
    } else {
        visBesked(listeBesked, await response.text() || "Aktiviteten kunne ikke slettes.", "fejl");
    }
    if (redigererId === aktivitet.id) {
        lukFormular();
    }
    hentAktiviteter();
}

form.addEventListener("submit", gemAktivitet);
document.getElementById("nyKnap").addEventListener("click", aabnNyAktivitet);
document.getElementById("annullerKnap").addEventListener("click", lukFormular);

hentAktiviteter();
