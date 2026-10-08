// US10: dagsoversigt over bookinger. US9: se, ret og slet bookinger.
const datoInput = document.getElementById("dato");
const tabel = document.getElementById("bookingTabel");
const ingenBookinger = document.getElementById("ingenBookinger");
const listeBesked = document.getElementById("listeBesked");

const redigerSektion = document.getElementById("redigerSektion");
const redigerTitel = document.getElementById("redigerTitel");
const redigerForm = document.getElementById("redigerForm");
const redigerDato = document.getElementById("redigerDato");
const redigerTid = document.getElementById("redigerTid");
const redigerAntal = document.getElementById("redigerAntal");
const redigerMinAlder = document.getElementById("redigerMinAlder");
const redigerBesked = document.getElementById("redigerBesked");

// Den booking, der rettes lige nu (null = ingen)
let redigeresBooking = null;

async function hentBookinger() {
    const response = await fetch(API_BASE + "/bookings?dato=" + datoInput.value);
    const bookinger = await response.json();

    tabel.innerHTML = "";
    ingenBookinger.hidden = bookinger.length > 0;

    let personer = 0;
    for (const booking of bookinger) {
        tabel.appendChild(lavRaekke(booking));
        personer = personer + booking.antalPersoner;
    }
    document.getElementById("antalBookinger").textContent = bookinger.length;
    document.getElementById("antalPersoner").textContent = personer;
}

function lavRaekke(booking) {
    const raekke = document.createElement("tr");
    if (redigeresBooking && redigeresBooking.id === booking.id) {
        raekke.className = "valgt";
    }

    tilfoejCelle(raekke, formatTid(booking.tid));
    tilfoejCelle(raekke, booking.activity.navn);

    // Kundens navn med kontaktoplysninger nedenunder (nærhed: hører til samme kunde)
    const kundeCelle = tilfoejCelle(raekke, booking.kunde.navn);
    const kontakt = document.createElement("span");
    kontakt.className = "svag";
    kontakt.textContent = booking.kunde.tlfnr + " · " + booking.kunde.mail;
    kundeCelle.appendChild(kontakt);

    tilfoejCelle(raekke, booking.antalPersoner).className = "tal";
    tilfoejCelle(raekke, booking.minAlder + " år").className = "tal";

    const knapCelle = document.createElement("td");
    knapCelle.className = "handlinger";
    knapCelle.appendChild(lavKnap("Ret", "sekundaer", () => startRediger(booking)));
    knapCelle.appendChild(lavKnap("Slet", "fare", () => sletBooking(booking)));
    raekke.appendChild(knapCelle);
    return raekke;
}

async function sletBooking(booking) {
    if (!confirm("Slet bookingen for " + booking.kunde.navn + " kl. " + formatTid(booking.tid) + "?\nDet kan ikke fortrydes.")) {
        return;
    }
    const response = await fetch(API_BASE + "/bookings/" + booking.id, { method: "DELETE" });
    if (response.ok) {
        visBesked(listeBesked, "Bookingen for " + booking.kunde.navn + " er slettet.", "ok");
    } else {
        visBesked(listeBesked, "Bookingen kunne ikke slettes.", "fejl");
    }
    if (redigeresBooking && redigeresBooking.id === booking.id) {
        stopRediger();
    }
    hentBookinger();
}

function startRediger(booking) {
    redigeresBooking = booking;
    redigerTitel.textContent = "Ret booking: " + booking.activity.navn + " for " + booking.kunde.navn;
    redigerDato.value = booking.dato;
    redigerDato.min = iDag();
    redigerAntal.value = booking.antalPersoner;
    redigerMinAlder.value = booking.minAlder;
    skjulBesked(redigerBesked);
    skjulBesked(listeBesked);
    redigerSektion.hidden = false;
    hentTiderTilRedigering(formatTid(booking.tid));
    hentBookinger();
    redigerSektion.scrollIntoView({ behavior: "smooth" });
}

// Viser aktivitetens starttider på den valgte dato
async function hentTiderTilRedigering(valgtTid) {
    const url = API_BASE + "/bookings/ledige?activityId=" + redigeresBooking.activity.id + "&dato=" + redigerDato.value;
    const response = await fetch(url);
    const tider = await response.json();

    redigerTid.innerHTML = "";
    for (const ledigTid of tider) {
        let ledige = ledigTid.ledigePladser;
        // Bookingens egne pladser er stadig ledige for den selv
        if (redigerDato.value === redigeresBooking.dato && formatTid(ledigTid.tid) === formatTid(redigeresBooking.tid)) {
            ledige = ledige + redigeresBooking.antalPersoner;
        }
        const option = document.createElement("option");
        option.value = formatTid(ledigTid.tid);
        option.textContent = formatTid(ledigTid.tid) + " (" + ledige + " ledige)";
        redigerTid.appendChild(option);
    }
    if (valgtTid) {
        redigerTid.value = valgtTid;
    }
}

async function gemAendringer(event) {
    event.preventDefault();

    const nyeVaerdier = {
        activity: { id: redigeresBooking.activity.id },
        dato: redigerDato.value,
        tid: redigerTid.value,
        antalPersoner: Number(redigerAntal.value),
        minAlder: Number(redigerMinAlder.value)
    };

    const response = await fetch(API_BASE + "/bookings/" + redigeresBooking.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nyeVaerdier)
    });

    if (!response.ok) {
        visBesked(redigerBesked, await response.text() || "Ændringerne kunne ikke gemmes.", "fejl");
        return;
    }

    const navn = redigeresBooking.kunde.navn;
    stopRediger();
    visBesked(listeBesked, "Bookingen for " + navn + " er opdateret.", "ok");
    hentBookinger();
}

function stopRediger() {
    redigeresBooking = null;
    redigerSektion.hidden = true;
    hentBookinger();
}

function skiftDato(dage) {
    datoInput.value = plusDage(datoInput.value, dage);
    skjulBesked(listeBesked);
    hentBookinger();
}

datoInput.value = iDag();
datoInput.addEventListener("change", hentBookinger);
document.getElementById("forrigeDag").addEventListener("click", () => skiftDato(-1));
document.getElementById("naesteDag").addEventListener("click", () => skiftDato(1));
document.getElementById("iDagKnap").addEventListener("click", () => {
    datoInput.value = iDag();
    hentBookinger();
});
redigerDato.addEventListener("change", () => hentTiderTilRedigering(null));
redigerForm.addEventListener("submit", gemAendringer);
document.getElementById("annullerKnap").addEventListener("click", stopRediger);

hentBookinger();
