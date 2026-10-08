import {urlBase, fetchAnyUrl, postObjectAsJson, visDato, lavKvittering} from "./modulejson.js";

console.log("er i firma");

const urlAktiviteter = urlBase + "/activities";
const urlForespoergsler = urlBase + "/forespoergsler";

const formFirma = document.getElementById("formFirma");
const divAktiviteter = document.getElementById("divAktiviteter");
const pbVisStatus = document.getElementById("pbVisStatus");
const txtStatus = document.getElementById("txtStatus");

// En checkbox for hver aktivitet
function createCheckbox(aktivitet) {
    const label = document.createElement("label");
    label.className = "checkbox";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = aktivitet.id;

    label.appendChild(checkbox);
    label.append(" " + aktivitet.navn);
    divAktiviteter.appendChild(label);
}

async function fetchAktiviteter() {
    const aktiviteter = await fetchAnyUrl(urlAktiviteter);
    aktiviteter.forEach(createCheckbox);
}

async function handleFormSubmit(event) {
    event.preventDefault();
    try {
        const formData = new FormData(formFirma);
        const forespoergsel = Object.fromEntries(formData.entries());

        // De valgte aktiviteter sendes som en liste med id'er: [{id: 1}, {id: 3}]
        forespoergsel.aktiviteter = [];
        divAktiviteter.querySelectorAll("input:checked").forEach(checkbox => {
            forespoergsel.aktiviteter.push({id: checkbox.value});
        });

        const gemt = await postObjectAsJson(urlForespoergsler, forespoergsel, "POST");
        visKvittering(gemt);
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}

// Viser en kvittering i stedet for formularen
function visKvittering(forespoergsel) {
    const navne = forespoergsel.aktiviteter.map(aktivitet => aktivitet.navn);
    lavKvittering(document.getElementById("kvitteringIndhold"), "Tak, vi har modtaget jeres forespørgsel", [
        ["Forespørgselsnummer", forespoergsel.id],
        ["Firma", forespoergsel.firmanavn],
        ["Kontaktperson", forespoergsel.kontaktperson],
        ["Dato", visDato(forespoergsel.dato)],
        ["Deltagere", forespoergsel.antalDeltagere],
        ["Aktiviteter", navne.join(", ")],
        ["Status", "Afventer"]
    ]);
    document.getElementById("inpForespoergselId").value = forespoergsel.id;
    document.getElementById("divForm").hidden = true;
    document.getElementById("divKvittering").hidden = false;
}

function nyForespoergsel() {
    formFirma.reset();
    document.getElementById("divKvittering").hidden = true;
    document.getElementById("divForm").hidden = false;
}

async function visStatus() {
    const id = document.getElementById("inpForespoergselId").value;
    const response = await fetch(urlForespoergsler + "/" + id);
    if (!response.ok) {
        txtStatus.textContent = "Der findes ingen forespørgsel med nummer " + id;
        return;
    }
    const forespoergsel = await response.json();
    const statusTekst = {AFVENTER: "Afventer behandling", GODKENDT: "Godkendt", AFVIST: "Afvist"};
    txtStatus.textContent = forespoergsel.firmanavn + " d. " + visDato(forespoergsel.dato) + ": " + statusTekst[forespoergsel.status];
}

document.getElementById("inpDato").min = new Date().toLocaleDateString("sv-SE");
formFirma.addEventListener("submit", handleFormSubmit);
pbVisStatus.addEventListener("click", visStatus);
document.getElementById("pbNyForespoergsel").addEventListener("click", nyForespoergsel);

fetchAktiviteter();
