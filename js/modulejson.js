// Fælles funktioner til at snakke med backenden

// Backenden kører på samme maskine som siden, på port 8080.
// Lokalt bliver det http://localhost:8080/api, på VM'en http://<VM-IP>:8080/api
const urlBase = "http://" + window.location.hostname + ":8080/api";

function fetchAnyUrl(url) {
    return fetch(url).then(response => response.json());
}

async function postObjectAsJson(url, object, httpVerbum) {
    const objectAsJsonString = JSON.stringify(object);
    console.log(objectAsJsonString);
    const fetchOptions = {
        method: httpVerbum,
        headers: {
            "Content-Type": "application/json",
        },
        body: objectAsJsonString,
    };
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
    return response.json();
}

async function restDelete(url) {
    const fetchOptions = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: ""
    };
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
    return response.text();
}

// "10:30:00" -> "10:30"
function visTid(tid) {
    return tid.substring(0, 5);
}

// "2026-10-20" -> "20-10-2026"
function visDato(dato) {
    const dele = dato.split("-");
    return dele[2] + "-" + dele[1] + "-" + dele[0];
}

// Viser en grøn bekræftelse, fx "Bookingen er slettet"
function visBekraeftelse(element, tekst) {
    element.textContent = tekst;
    element.hidden = false;
}

// Fylder en kvittering med en overskrift og linjer: [["Dato", "20-10-2026"], ["Tid", "10:30"]]
function lavKvittering(element, overskrift, linjer) {
    element.innerHTML = "";

    const h2 = document.createElement("h2");
    h2.textContent = overskrift;
    element.appendChild(h2);

    const table = document.createElement("table");
    linjer.forEach(linje => {
        const row = table.insertRow(table.rows.length);
        const cell1 = row.insertCell(0);
        cell1.textContent = linje[0];
        const cell2 = row.insertCell(1);
        cell2.textContent = linje[1];
    });
    element.appendChild(table);
    element.hidden = false;
}

export {urlBase, fetchAnyUrl, postObjectAsJson, restDelete, visTid, visDato, visBekraeftelse, lavKvittering};
