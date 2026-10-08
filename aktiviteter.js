// US1: kunden ser parkens aktiviteter med beskrivelse, pris og aldersgrænse
const liste = document.getElementById("aktivitetListe");

async function hentAktiviteter() {
    const response = await fetch(API_BASE + "/activities");
    const aktiviteter = await response.json();

    liste.innerHTML = "";
    if (aktiviteter.length === 0) {
        const tom = document.createElement("p");
        tom.className = "tom-tilstand";
        tom.textContent = "Der er ingen aktiviteter endnu.";
        liste.appendChild(tom);
        return;
    }

    for (const aktivitet of aktiviteter) {
        liste.appendChild(lavKort(aktivitet));
    }
}

function lavKort(aktivitet) {
    const kort = document.createElement("section");
    kort.className = "kort";

    const titel = document.createElement("h2");
    titel.textContent = aktivitet.navn;

    const beskrivelse = document.createElement("p");
    beskrivelse.className = "undertekst";
    beskrivelse.textContent = aktivitet.beskrivelse;

    // Fakta samlet i små mærker, så de er lette at sammenligne mellem aktiviteter (lighed)
    const fakta = document.createElement("ul");
    fakta.className = "fakta";
    tilfoejFakta(fakta, aktivitet.pris + " kr. pr. person");
    tilfoejFakta(fakta, aktivitet.varighed + " min");
    tilfoejFakta(fakta, "Fra " + aktivitet.aldersgrænse + " år");
    tilfoejFakta(fakta, "Kl. " + formatTid(aktivitet.aabner) + "–" + formatTid(aktivitet.lukker));

    const bookKnap = document.createElement("a");
    bookKnap.className = "knap";
    bookKnap.textContent = "Book " + aktivitet.navn;
    bookKnap.href = "booking.html?aktivitet=" + aktivitet.id;

    kort.appendChild(titel);
    kort.appendChild(beskrivelse);
    kort.appendChild(fakta);
    kort.appendChild(bookKnap);
    return kort;
}

function tilfoejFakta(liste, tekst) {
    const punkt = document.createElement("li");
    punkt.textContent = tekst;
    liste.appendChild(punkt);
}

hentAktiviteter();
