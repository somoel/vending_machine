import {
    COINS,
    PRODUCTS,
    TRAP_STATE,
    buildAutomaton,
    buildDegreeTable,
    buildDotGraph,
    buildRegularExpression,
    buildTransitionTable,
    findProductById,
    labelState,
    simulateSequence,
} from "./automata.js";

const ui = {
    productSelect: document.getElementById("productSelect"),
    priceValue: document.getElementById("priceValue"),
    coinButtons: document.getElementById("coinButtons"),
    currentState: document.getElementById("currentState"),
    sequenceValue: document.getElementById("sequenceValue"),
    statusMessage: document.getElementById("statusMessage"),
    resetButton: document.getElementById("resetButton"),
    alphabetValue: document.getElementById("alphabetValue"),
    initialValue: document.getElementById("initialValue"),
    stateCountValue: document.getElementById("stateCountValue"),
    acceptanceValue: document.getElementById("acceptanceValue"),
    regexValue: document.getElementById("regexValue"),
    transitionTable: document.getElementById("transitionTable"),
    degreeTable: document.getElementById("degreeTable"),
    graphContainer: document.getElementById("graphContainer"),
    dotCode: document.getElementById("dotCode"),
};

const state = {
    selectedProduct: PRODUCTS[0],
    automaton: null,
    insertedCoins: [],
    simulation: null,
};

let renderNonce = 0;

function formatMoney(value) {
    return `$${value}`;
}

function createProductOptions() {
    for (const product of PRODUCTS) {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent = `${product.name} (${formatMoney(product.price)})`;
        ui.productSelect.append(option);
    }
}

function createCoinButtons() {
    for (const coin of COINS) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = formatMoney(coin);
        button.dataset.coin = String(coin);
        button.addEventListener("click", () => insertCoin(coin));
        ui.coinButtons.append(button);
    }
}

function setStatus(message, type) {
    ui.statusMessage.textContent = message;
    ui.statusMessage.className = `status ${type}`;
}

function isFinished() {
    if (!state.simulation) {
        return false;
    }
    return state.simulation.accepted || state.simulation.trapped;
}

function updateCoinButtonsAvailability() {
    const disabled = isFinished();
    for (const button of ui.coinButtons.querySelectorAll("button")) {
        button.disabled = disabled;
    }
}

function updateSessionPanel() {
    if (!state.simulation) {
        return;
    }

    ui.currentState.textContent = labelState(state.simulation.finalState);
    ui.sequenceValue.textContent =
        state.insertedCoins.length > 0 ? state.insertedCoins.join(" - ") : "-";

    if (state.simulation.accepted) {
        setStatus(`Aceptado: se entrega ${state.selectedProduct.name}.`, "ok");
        updateCoinButtonsAvailability();
        return;
    }

    if (state.simulation.trapped) {
        setStatus("Rechazado: monto excedido. Operación enviada al estado trampa.", "error");
        updateCoinButtonsAvailability();
        return;
    }

    const accumulated = state.simulation.finalState;
    const missing = state.selectedProduct.price - accumulated;
    setStatus(`Secuencia válida. Faltan ${formatMoney(missing)} para aceptar.`, "pending");
    updateCoinButtonsAvailability();
}

function renderTransitionTable() {
    const rows = buildTransitionTable(state.automaton);
    ui.transitionTable.innerHTML = "";

    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    const firstHeader = document.createElement("th");
    firstHeader.textContent = "Estado";
    headRow.append(firstHeader);

    for (const coin of state.automaton.coins) {
        const th = document.createElement("th");
        th.textContent = coin;
        headRow.append(th);
    }
    head.append(headRow);
    ui.transitionTable.append(head);

    const body = document.createElement("tbody");
    for (const row of rows) {
        const tr = document.createElement("tr");
        const stateCell = document.createElement("td");
        stateCell.textContent = row.state;
        tr.append(stateCell);
        for (const coin of state.automaton.coins) {
            const td = document.createElement("td");
            td.textContent = row[coin];
            tr.append(td);
        }
        body.append(tr);
    }
    ui.transitionTable.append(body);
}

function renderDegreeTable() {
    const rows = buildDegreeTable(state.automaton);
    ui.degreeTable.innerHTML = "";

    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Estado", "Grado entrada", "Grado salida", "Grado total"].forEach((headerText) => {
        const th = document.createElement("th");
        th.textContent = headerText;
        headRow.append(th);
    });
    head.append(headRow);
    ui.degreeTable.append(head);

    const body = document.createElement("tbody");
    for (const row of rows) {
        const tr = document.createElement("tr");
        [row.state, row.entrada, row.salida, row.total].forEach((value) => {
            const td = document.createElement("td");
            td.textContent = String(value);
            tr.append(td);
        });
        body.append(tr);
    }
    ui.degreeTable.append(body);
}

async function renderGraph(dot) {
    renderNonce += 1;
    const currentNonce = renderNonce;
    ui.graphContainer.textContent = "Renderizando grafo...";

    try {
        if (typeof Viz === "undefined") {
            ui.graphContainer.textContent = "Graphviz no disponible en el navegador.";
            return;
        }
        const viz = new Viz();
        const svg = await viz.renderSVGElement(dot);
        if (currentNonce !== renderNonce) {
            return;
        }
        ui.graphContainer.innerHTML = "";
        ui.graphContainer.append(svg);
    } catch (error) {
        if (currentNonce !== renderNonce) {
            return;
        }
        ui.graphContainer.textContent = "No fue posible renderizar el grafo.";
        console.error(error);
    }
}

function renderFormalDefinition() {
    ui.priceValue.textContent = formatMoney(state.selectedProduct.price);
    ui.alphabetValue.textContent = `{${state.automaton.coins.join(", ")}}`;
    ui.initialValue.textContent = labelState(state.automaton.initialState);
    ui.stateCountValue.textContent = String(state.automaton.states.length);
    ui.acceptanceValue.textContent = labelState(state.automaton.acceptanceStates[0]);
    ui.regexValue.textContent = buildRegularExpression(state.selectedProduct.price, state.automaton.coins);
}

function renderGraphPanel() {
    const dot = buildDotGraph(state.automaton);
    ui.dotCode.textContent = dot;
    renderGraph(dot);
}

function buildAutomatonForSelection(productId) {
    state.selectedProduct = findProductById(productId);
    state.automaton = buildAutomaton(state.selectedProduct.price, COINS);
}

function resetOperation() {
    state.insertedCoins = [];
    state.simulation = simulateSequence(state.automaton, []);
    ui.currentState.textContent = labelState(0);
    ui.sequenceValue.textContent = "-";
    setStatus("Esperando monedas.", "neutral");
    updateCoinButtonsAvailability();
}

function refreshAllPanels() {
    renderFormalDefinition();
    renderTransitionTable();
    renderDegreeTable();
    renderGraphPanel();
    resetOperation();
}

function insertCoin(coin) {
    if (!state.simulation || isFinished()) {
        return;
    }
    state.insertedCoins.push(coin);
    state.simulation = simulateSequence(state.automaton, state.insertedCoins);
    updateSessionPanel();
}

function handleProductChange(event) {
    buildAutomatonForSelection(event.target.value);
    refreshAllPanels();
}

function init() {
    createProductOptions();
    createCoinButtons();

    ui.productSelect.value = PRODUCTS[0].id;
    buildAutomatonForSelection(PRODUCTS[0].id);
    refreshAllPanels();

    ui.productSelect.addEventListener("change", handleProductChange);
    ui.resetButton.addEventListener("click", resetOperation);
}

init();
