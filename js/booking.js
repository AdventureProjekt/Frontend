import {urlBase, fetchAnyUrl, postObjectAsJson, visTid, visDato, lavKvittering} from "./modulejson.js";

console.log("er i booking");

const urlAktiviteter = urlBase + "/activities";
const urlBookinger = urlBase + "/bookings";

const formBooking = document.getElementById("formBooking");
const ddAktivitet = document.getElementById("ddAktivitet");
const inpDato = document.getElementById("inpDato");
const inpAntal = document.getElementById("inpAntal");
const ddTid = document.getElementById("ddTid");

function fillAktivitetDropdown(aktivitet) {
    const option = document.createElement("option");
    option.textContent = aktivitet.navn + " (" + aktivitet.pris + " kr., fra " + aktivitet.aldersgrænse + " år)";
    option.value = aktivitet.id;
    ddAktivitet.appendChild(option);
}

async function fetchAktiviteter() {
    const aktiviteter = await fetchAnyUrl(urlAktiviteter);
    aktiviteter.forEach(fillAktivitetDropdown);

    // Kommer man fra aktivitetssiden, står aktiviteten i url'en: booking.html?aktivitet=2
    const valgtAktivitet = new URLSearchParams(window.location.search).get("aktivitet");
    if (valgtAktivitet) {
        ddAktivitet.value = valgtAktivitet;
    }
    fetchLedigeTider();
}

// Henter starttider for den valgte aktivitet og dato (US2)
async function fetchLedigeTider() {
    if (!ddAktivitet.value || !inpDato.value) {
        return;
    }
    const url = urlBookinger + "/ledige?activityId=" + ddAktivitet.value + "&dato=" + inpDato.value;
    const tider = await fetchAnyUrl(url);

    ddTid.innerHTML = "";
    tider.forEach(ledigTid => {
        const option = document.createElement("option");
        option.value = visTid(ledigTid.tid);
        option.textContent = visTid(ledigTid.tid) + " (" + ledigTid.ledigePladser + " ledige pladser)";
        // Tider uden plads nok kan ikke vælges
        if (ledigTid.ledigePladser < inpAntal.value) {
            option.disabled = true;
        }
        ddTid.appendChild(option);
    });

    if (tider.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Ingen ledige tider denne dag";
        ddTid.appendChild(option);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const booking = {
        activity: {id: ddAktivitet.value},
        kunde: {
            navn: document.getElementById("inpNavn").value,
            tlfnr: document.getElementById("inpTlfnr").value,
            mail: document.getElementById("inpMail").value
        },
        dato: inpDato.value,
        tid: ddTid.value,
        antalPersoner: inpAntal.value,
        minAlder: document.getElementById("inpMinAlder").value
    };

    try {
        const gemt = await postObjectAsJson(urlBookinger, booking, "POST");
        visKvittering(gemt);
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}

// Viser en kvittering i stedet for formularen
function visKvittering(booking) {
    lavKvittering(document.getElementById("kvitteringIndhold"), "Tak for din booking!", [
        ["Bookingnummer", booking.id],
        ["Aktivitet", booking.activity.navn],
        ["Dato", visDato(booking.dato)],
        ["Tid", visTid(booking.tid)],
        ["Personer", booking.antalPersoner],
        ["Pris i alt", booking.activity.pris * booking.antalPersoner + " kr."],
        ["Navn", booking.kunde.navn],
        ["E-mail", booking.kunde.mail]
    ]);
    document.getElementById("divForm").hidden = true;
    document.getElementById("divKvittering").hidden = false;
}

function nyBooking() {
    formBooking.reset();
    inpDato.value = new Date().toLocaleDateString("sv-SE");
    document.getElementById("divKvittering").hidden = true;
    document.getElementById("divForm").hidden = false;
    fetchLedigeTider();
}

// Datoen starter på i dag, og man kan ikke vælge en dato i fortiden
inpDato.value = new Date().toLocaleDateString("sv-SE");
inpDato.min = inpDato.value;

ddAktivitet.addEventListener("change", fetchLedigeTider);
inpDato.addEventListener("change", fetchLedigeTider);
inpAntal.addEventListener("change", fetchLedigeTider);
formBooking.addEventListener("submit", handleFormSubmit);
document.getElementById("pbNyBooking").addEventListener("click", nyBooking);

fetchAktiviteter();
