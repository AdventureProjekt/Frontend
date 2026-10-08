// US4: firmakunden sender en forespørgsel og kan følge status
const form = document.getElementById("forespoergselForm");
const aktivitetValg = document.getElementById("aktivitetValg");
const besked = document.getElementById("besked");
const sendKnap = document.getElementById("sendKnap");
const kvittering = document.getElementById("kvittering");
const statusResultat = document.getElementById("statusResultat");

async function hentAktiviteter() {
    const response = await fetch(API_BASE + "/activities");
    const aktiviteter = await response.json();

    aktivitetValg.innerHTML = "";
    for (const aktivitet of aktiviteter) {
        const label = document.createElement("label");
        label.className = "afkryds";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = aktivitet.id;

        const tekst = document.createElement("span");
        tekst.textContent = aktivitet.navn + " (" + aktivitet.varighed + " min)";

        label.appendChild(checkbox);
        label.appendChild(tekst);
        aktivitetValg.appendChild(label);
    }
}

async function sendForespoergsel(event) {
    event.preventDefault();
    skjulBesked(besked);

    // Aktiviteterne sendes som en liste af objekter med kun id'et
    const valgte = [];
    for (const checkbox of aktivitetValg.querySelectorAll("input:checked")) {
        valgte.push({ id: Number(checkbox.value) });
    }
    if (valgte.length === 0) {
        visBesked(besked, "Vælg mindst én aktivitet i trin 2.", "fejl");
        return;
    }

    const forespoergsel = {
        firmanavn: document.getElementById("firmanavn").value,
        kontaktperson: document.getElementById("kontaktperson").value,
        mail: document.getElementById("mail").value,
        tlfnr: document.getElementById("tlfnr").value,
        dato: document.getElementById("dato").value,
        antalDeltagere: Number(document.getElementById("antalDeltagere").value),
        besked: document.getElementById("beskedTekst").value,
        aktiviteter: valgte
    };

    sendKnap.disabled = true;
    sendKnap.textContent = "Sender…";

    const response = await fetch(API_BASE + "/forespoergsler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forespoergsel)
    });

    sendKnap.disabled = false;
    sendKnap.textContent = "Send forespørgsel";

    if (!response.ok) {
        visBesked(besked, await response.text() || "Forespørgslen kunne ikke sendes. Prøv igen.", "fejl");
        return;
    }

    visKvittering(await response.json());
}

function visKvittering(forespoergsel) {
    const detaljer = document.getElementById("kvitteringDetaljer");
    detaljer.innerHTML = "";

    const navne = [];
    for (const aktivitet of forespoergsel.aktiviteter) {
        navne.push(aktivitet.navn);
    }

    const linjer = [
        ["Forespørgselsnummer", forespoergsel.id],
        ["Firma", forespoergsel.firmanavn],
        ["Dato", formatDato(forespoergsel.dato)],
        ["Deltagere", forespoergsel.antalDeltagere],
        ["Aktiviteter", navne.join(", ")],
        ["Status", STATUS_TEKSTER[forespoergsel.status]]
    ];
    for (const linje of linjer) {
        const dt = document.createElement("dt");
        dt.textContent = linje[0];
        const dd = document.createElement("dd");
        dd.textContent = linje[1];
        detaljer.appendChild(dt);
        detaljer.appendChild(dd);
    }

    document.getElementById("statusId").value = forespoergsel.id;
    form.hidden = true;
    kvittering.hidden = false;
    window.scrollTo(0, 0);
}

function nyForespoergsel() {
    form.reset();
    kvittering.hidden = true;
    form.hidden = false;
}

async function visStatus(event) {
    event.preventDefault();
    const id = document.getElementById("statusId").value;
    statusResultat.innerHTML = "";

    const response = await fetch(API_BASE + "/forespoergsler/" + id);
    if (!response.ok) {
        const fejl = document.createElement("p");
        visBesked(fejl, "Der findes ingen forespørgsel med nummer " + id + ".", "fejl");
        statusResultat.appendChild(fejl);
        return;
    }

    const forespoergsel = await response.json();
    const linje = document.createElement("p");
    linje.style.margin = "0";
    linje.textContent = forespoergsel.firmanavn + " · " + formatDato(forespoergsel.dato) + " · ";
    linje.appendChild(lavStatusMaerke(forespoergsel.status));
    statusResultat.appendChild(linje);
}

document.getElementById("dato").min = iDag();
form.addEventListener("submit", sendForespoergsel);
document.getElementById("nyForespoergselKnap").addEventListener("click", nyForespoergsel);
document.getElementById("statusForm").addEventListener("submit", visStatus);

hentAktiviteter();
