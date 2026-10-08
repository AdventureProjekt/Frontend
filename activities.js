javascript
const API_URL = "https://adventure-backend.graymeadow-560f0954.swedencentral.azurecontainerapps.io/api/activities";

const form = document.getElementById("aktivitetForm");
const formTitel = document.getElementById("formTitel");
const gemKnap = document.getElementById("gemKnap");
const annullerKnap = document.getElementById("annullerKnap");
const fejlbesked = document.getElementById("fejlbesked");
const tabel = document.getElementById("aktivitetTabel");

// null = vi opretter en ny aktivitet, ellers id'et på den vi redigerer
let redigererId = null;

async function hentAktiviteter() {
    const response = await fetch(API_URL);
    const aktiviteter = await response.json();

    tabel.innerHTML = "";

    for (const aktivitet of aktiviteter) {
        tabel.appendChild(lavRaekke(aktivitet));
    }
}

function lavRaekke(aktivitet) {
    const raekke = document.createElement("tr");

    tilfoejCelle(raekke, aktivitet.navn);
    tilfoejCelle(raekke, aktivitet.beskrivelse);
    tilfoejCelle(raekke, aktivitet.pris + " kr.");
    tilfoejCelle(raekke, aktivitet.aldersgrænse + "+");
    tilfoejCelle(raekke, aktivitet.varighed + " min");
    tilfoejCelle(raekke, aktivitet.kapacitet);

    const knapCelle = document.createElement("td");

    const redigerKnap = document.createElement("button");
    redigerKnap.textContent = "Rediger";
    redigerKnap.addEventListener("click", () => startRediger(aktivitet));

    const sletKnap = document.createElement("button");
    sletKnap.textContent = "Slet";
    sletKnap.addEventListener("click", () => sletAktivitet(aktivitet.id));

    knapCelle.appendChild(redigerKnap);
    knapCelle.appendChild(sletKnap);
    raekke.appendChild(knapCelle);

    return raekke;
}

function tilfoejCelle(raekke, tekst) {
    const celle = document.createElement("td");
    celle.textContent = tekst;
    raekke.appendChild(celle);
}

function laesFormular() {
    return {
        navn: document.getElementById("navn").value,
        pris: Number(document.getElementById("pris").value),
        beskrivelse: document.getElementById("beskrivelse").value,
        aldersgrænse: Number(document.getElementById("aldersgraense").value),
        varighed: Number(document.getElementById("varighed").value),
        kapacitet: Number(document.getElementById("kapacitet").value)
    };
}

async function gemAktivitet(event) {
    event.preventDefault();
    fejlbesked.textContent = "";

    const aktivitet = laesFormular();

    let url = API_URL;
    let method = "POST";

    if (redigererId !== null) {
        url = API_URL + "/" + redigererId;
        method = "PUT";
    }

    const response = await fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(aktivitet)
    });

    if (!response.ok) {
        fejlbesked.textContent =
            await response.text() || "Noget gik galt";
        return;
    }

    nulstilFormular();
    hentAktiviteter();
}

function startRediger(aktivitet) {
    redigererId = aktivitet.id;

    document.getElementById("navn").value = aktivitet.navn;
    document.getElementById("pris").value = aktivitet.pris;
    document.getElementById("beskrivelse").value = aktivitet.beskrivelse;
    document.getElementById("aldersgraense").value = aktivitet.aldersgrænse;
    document.getElementById("varighed").value = aktivitet.varighed;
    document.getElementById("kapacitet").value = aktivitet.kapacitet;

    formTitel.textContent = "Rediger aktivitet";
    gemKnap.textContent = "Gem ændringer";
    annullerKnap.hidden = false;
    fejlbesked.textContent = "";
}

function nulstilFormular() {
    redigererId = null;
    form.reset();
    formTitel.textContent = "Opret aktivitet";
    gemKnap.textContent = "Opret";
    annullerKnap.hidden = true;
    fejlbesked.textContent = "";
}

async function sletAktivitet(id) {
    if (!confirm("Er du sikker på, at du vil slette aktiviteten?")) {
        return;
    }

    const response = await fetch(API_URL + "/" + id, {
        method: "DELETE"
    });

    if (!response.ok) {
        alert("Aktiviteten kunne ikke slettes");
    }

    hentAktiviteter();
}

form.addEventListener("submit", gemAktivitet);
annullerKnap.addEventListener("click", nulstilFormular);

hentAktiviteter();