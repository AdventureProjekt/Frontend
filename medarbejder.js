// US11: aktivitetsmedarbejderen ser dagens bookinger for sin aktivitet
const aktivitetSelect = document.getElementById("aktivitet");
const datoInput = document.getElementById("dato");
const tabel = document.getElementById("bookingTabel");
const ingenBookinger = document.getElementById("ingenBookinger");

let aktiviteter = [];

async function hentAktiviteter() {
    const response = await fetch(API_BASE + "/activities");
    aktiviteter = await response.json();

    for (const aktivitet of aktiviteter) {
        const option = document.createElement("option");
        option.value = aktivitet.id;
        option.textContent = aktivitet.navn;
        aktivitetSelect.appendChild(option);
    }
    hentBookinger();
}

async function hentBookinger() {
    tabel.innerHTML = "";
    if (!aktivitetSelect.value) {
        ingenBookinger.textContent = "Der er ingen aktiviteter endnu.";
        ingenBookinger.hidden = false;
        return;
    }

    for (const aktivitet of aktiviteter) {
        if (aktivitet.id === Number(aktivitetSelect.value)) {
            document.getElementById("kapacitet").textContent = aktivitet.kapacitet;
        }
    }

    const url = API_BASE + "/bookings/aktivitet/" + aktivitetSelect.value + "?dato=" + datoInput.value;
    const response = await fetch(url);
    const bookinger = await response.json();

    let personerIAlt = 0;
    for (const booking of bookinger) {
        const raekke = document.createElement("tr");
        tilfoejCelle(raekke, formatTid(booking.tid));
        tilfoejCelle(raekke, booking.kunde.navn);
        tilfoejCelle(raekke, booking.kunde.tlfnr);
        tilfoejCelle(raekke, booking.antalPersoner).className = "tal";
        tilfoejCelle(raekke, booking.minAlder + " år").className = "tal";
        tabel.appendChild(raekke);
        personerIAlt = personerIAlt + booking.antalPersoner;
    }

    ingenBookinger.textContent = "Ingen bookinger for denne aktivitet på denne dato.";
    ingenBookinger.hidden = bookinger.length > 0;
    document.getElementById("antalBookinger").textContent = bookinger.length;
    document.getElementById("antalPersoner").textContent = personerIAlt;
}

function skiftDato(dage) {
    datoInput.value = plusDage(datoInput.value, dage);
    hentBookinger();
}

datoInput.value = iDag();
aktivitetSelect.addEventListener("change", hentBookinger);
datoInput.addEventListener("change", hentBookinger);
document.getElementById("forrigeDag").addEventListener("click", () => skiftDato(-1));
document.getElementById("naesteDag").addEventListener("click", () => skiftDato(1));
document.getElementById("iDagKnap").addEventListener("click", () => {
    datoInput.value = iDag();
    hentBookinger();
});

hentAktiviteter();
