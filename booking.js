// US3 + US8: book en aktivitet. US2: vis ledige tider.
const form = document.getElementById("bookingForm");
const aktivitetSelect = document.getElementById("aktivitet");
const aktivitetFakta = document.getElementById("aktivitetFakta");
const datoInput = document.getElementById("dato");
const antalInput = document.getElementById("antalPersoner");
const tiderBoks = document.getElementById("tider");
const ingenTider = document.getElementById("ingenTider");
const aldersHjaelp = document.getElementById("aldersHjaelp");
const opsummeringTekst = document.getElementById("opsummeringTekst");
const totalPris = document.getElementById("totalPris");
const besked = document.getElementById("besked");
const bookKnap = document.getElementById("bookKnap");
const kvittering = document.getElementById("kvittering");

let aktiviteter = [];

async function hentAktiviteter() {
    const response = await fetch(API_BASE + "/activities");
    aktiviteter = await response.json();

    aktivitetSelect.innerHTML = "";
    for (const aktivitet of aktiviteter) {
        const option = document.createElement("option");
        option.value = aktivitet.id;
        option.textContent = aktivitet.navn;
        aktivitetSelect.appendChild(option);
    }

    // Kommer kunden fra aktivitetssiden, er aktiviteten valgt på forhånd (booking.html?aktivitet=3)
    const valgtId = new URLSearchParams(window.location.search).get("aktivitet");
    if (valgtId) {
        aktivitetSelect.value = valgtId;
    }

    visAktivitetInfo();
    hentLedigeTider();
}

function valgtAktivitet() {
    for (const aktivitet of aktiviteter) {
        if (aktivitet.id === Number(aktivitetSelect.value)) {
            return aktivitet;
        }
    }
    return null;
}

// Viser fakta om den valgte aktivitet, så kunden ikke skal huske dem fra en anden side
function visAktivitetInfo() {
    const aktivitet = valgtAktivitet();
    aktivitetFakta.innerHTML = "";
    if (!aktivitet) {
        return;
    }

    const fakta = [
        aktivitet.pris + " kr. pr. person",
        aktivitet.varighed + " min",
        "Fra " + aktivitet.aldersgrænse + " år",
        "Kl. " + formatTid(aktivitet.aabner) + "–" + formatTid(aktivitet.lukker)
    ];
    for (const tekst of fakta) {
        const punkt = document.createElement("li");
        punkt.textContent = tekst;
        aktivitetFakta.appendChild(punkt);
    }

    // Forebyg fejl: browseren tillader ikke en alder under grænsen
    document.getElementById("minAlder").min = aktivitet.aldersgrænse;
    aldersHjaelp.textContent = "Alle deltagere skal være mindst " + aktivitet.aldersgrænse + " år.";
    opdaterOpsummering();
}

// Tæller hentninger, så et gammelt svar ikke overskriver et nyere
let senesteHentning = 0;

// US2: starttider med ledige pladser vises som knapper
async function hentLedigeTider() {
    const tidligereValgt = valgtTid();
    ingenTider.hidden = true;

    if (!aktivitetSelect.value || !datoInput.value) {
        tiderBoks.innerHTML = "";
        return;
    }

    senesteHentning++;
    const denneHentning = senesteHentning;

    const url = API_BASE + "/bookings/ledige?activityId=" + aktivitetSelect.value + "&dato=" + datoInput.value;
    const response = await fetch(url);
    const tider = await response.json();

    // Er der startet en nyere hentning imens, bruges dette svar ikke
    if (denneHentning !== senesteHentning) {
        return;
    }

    tiderBoks.innerHTML = "";
    const antal = Number(antalInput.value);

    let antalMuligeTider = 0;
    for (const ledigTid of tider) {
        const tid = formatTid(ledigTid.tid);
        const erMulig = ledigTid.ledigePladser >= antal;

        const label = document.createElement("label");
        label.className = "tid-valg";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "tid";
        radio.value = tid;
        radio.required = true;
        radio.disabled = !erMulig;
        radio.checked = erMulig && tid === tidligereValgt;
        radio.addEventListener("change", opdaterOpsummering);

        const tekst = document.createElement("span");
        tekst.textContent = tid;
        const ledige = document.createElement("small");
        ledige.textContent = ledigTid.ledigePladser + " ledige";
        tekst.appendChild(ledige);

        label.appendChild(radio);
        label.appendChild(tekst);
        tiderBoks.appendChild(label);

        if (erMulig) {
            antalMuligeTider++;
        }
    }

    ingenTider.hidden = antalMuligeTider > 0;
    opdaterOpsummering();
}

function valgtTid() {
    const valgt = tiderBoks.querySelector("input:checked");
    if (valgt) {
        return valgt.value;
    }
    return null;
}

// Opsummering med totalpris, så kunden kan se, hvad de er ved at booke
function opdaterOpsummering() {
    const aktivitet = valgtAktivitet();
    const antal = Number(antalInput.value) || 0;
    const tid = valgtTid();

    if (!aktivitet) {
        return;
    }

    let tekst = aktivitet.navn + " · " + antal + " personer";
    if (datoInput.value) {
        tekst = tekst + " · " + formatDato(datoInput.value);
    }
    if (tid) {
        tekst = tekst + " kl. " + tid;
    } else {
        tekst = tekst + " · vælg en tid";
    }

    opsummeringTekst.textContent = tekst;
    totalPris.textContent = (aktivitet.pris * antal) + " kr.";
}

async function book(event) {
    event.preventDefault();
    skjulBesked(besked);

    if (!valgtTid()) {
        visBesked(besked, "Vælg en ledig tid i trin 2.", "fejl");
        return;
    }

    const booking = {
        activity: { id: Number(aktivitetSelect.value) },
        kunde: {
            navn: document.getElementById("navn").value,
            mail: document.getElementById("mail").value,
            tlfnr: document.getElementById("tlfnr").value
        },
        dato: datoInput.value,
        tid: valgtTid(),
        antalPersoner: Number(antalInput.value),
        minAlder: Number(document.getElementById("minAlder").value)
    };

    // Feedback: knappen viser, at der arbejdes, og kan ikke trykkes to gange
    bookKnap.disabled = true;
    bookKnap.textContent = "Booker…";

    const response = await fetch(API_BASE + "/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking)
    });

    bookKnap.disabled = false;
    bookKnap.textContent = "Bekræft booking";

    if (!response.ok) {
        visBesked(besked, await response.text() || "Bookingen kunne ikke gennemføres. Prøv igen.", "fejl");
        hentLedigeTider();
        return;
    }

    visKvittering(await response.json());
}

// Afslutning: en tydelig kvittering med alle detaljer
function visKvittering(booking) {
    const detaljer = document.getElementById("kvitteringDetaljer");
    detaljer.innerHTML = "";

    const linjer = [
        ["Bookingnummer", booking.id],
        ["Aktivitet", booking.activity.navn],
        ["Dato", formatDato(booking.dato)],
        ["Tid", formatTid(booking.tid)],
        ["Personer", booking.antalPersoner],
        ["Pris", (booking.activity.pris * booking.antalPersoner) + " kr."],
        ["Navn", booking.kunde.navn]
    ];
    for (const linje of linjer) {
        const dt = document.createElement("dt");
        dt.textContent = linje[0];
        const dd = document.createElement("dd");
        dd.textContent = linje[1];
        detaljer.appendChild(dt);
        detaljer.appendChild(dd);
    }

    form.hidden = true;
    kvittering.hidden = false;
    window.scrollTo(0, 0);
}

function nyBooking() {
    form.reset();
    datoInput.value = iDag();
    kvittering.hidden = true;
    form.hidden = false;
    visAktivitetInfo();
    hentLedigeTider();
}

datoInput.min = iDag();
datoInput.value = iDag();

aktivitetSelect.addEventListener("change", () => {
    visAktivitetInfo();
    hentLedigeTider();
});
datoInput.addEventListener("change", hentLedigeTider);
antalInput.addEventListener("input", hentLedigeTider);
form.addEventListener("submit", book);
document.getElementById("nyBookingKnap").addEventListener("click", nyBooking);

hentAktiviteter();
