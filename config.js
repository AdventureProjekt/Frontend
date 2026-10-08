// Fælles indstillinger og hjælpefunktioner, som alle sider bruger
const API_BASE = "https://adventure-backend.graymeadow-560f0954.swedencentral.azurecontainerapps.io/api";

const STATUS_TEKSTER = {
    AFVENTER: "Afventer",
    GODKENDT: "Godkendt",
    AFVIST: "Afvist"
};

// "10:30:00" -> "10:30"
function formatTid(tid) {
    return tid.substring(0, 5);
}

// "2026-10-20" -> "20-10-2026"
function formatDato(dato) {
    const dele = dato.split("-");
    return dele[2] + "-" + dele[1] + "-" + dele[0];
}

// Dagens dato som "2026-10-20" (bruges i <input type="date">)
function iDag() {
    return new Date().toLocaleDateString("sv-SE");
}

// Lægger et antal dage til en dato: ("2026-10-20", 1) -> "2026-10-21"
function plusDage(dato, dage) {
    const d = new Date(dato + "T12:00:00");
    d.setDate(d.getDate() + dage);
    return d.toLocaleDateString("sv-SE");
}

// Viser en besked i et element. type er "ok", "fejl" eller "info".
function visBesked(element, tekst, type) {
    element.textContent = tekst;
    element.className = "banner " + type;
}

function skjulBesked(element) {
    element.textContent = "";
}

// Laver en celle med tekst og tilføjer den til en tabelrække
function tilfoejCelle(raekke, tekst) {
    const celle = document.createElement("td");
    celle.textContent = tekst;
    raekke.appendChild(celle);
    return celle;
}

// Laver en knap. type er "", "sekundaer" eller "fare".
function lavKnap(tekst, type, handling) {
    const knap = document.createElement("button");
    knap.type = "button";
    knap.textContent = tekst;
    knap.className = "lille " + type;
    knap.addEventListener("click", handling);
    return knap;
}

// Laver et farvet statusmærke, fx "Afventer"
function lavStatusMaerke(status) {
    const maerke = document.createElement("span");
    maerke.className = "status " + status;
    maerke.textContent = STATUS_TEKSTER[status];
    return maerke;
}

// Viser en tydelig fejl øverst, hvis serveren ikke svarer (fx hvis backenden ikke kører)
window.addEventListener("unhandledrejection", (event) => {
    if (event.reason instanceof TypeError) {
        const banner = document.getElementById("serverFejl");
        if (banner) {
            banner.textContent = "Kan ikke få forbindelse til serveren. Prøv igen om lidt – eller tjek at backenden kører.";
            banner.hidden = false;
        }
    }
});
