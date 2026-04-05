import {
    COINS,
    TRAP_STATE,
    PRODUCTS,
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
    vendingMachine: document.getElementById("vendingMachine"),
    productSelect: document.getElementById("productSelect"),
    priceValue: document.getElementById("priceValue"),
    insertedAmount: document.getElementById("insertedAmount"),
    coinButtons: document.getElementById("coinButtons"),
    currentState: document.getElementById("currentState"),
    sequenceValue: document.getElementById("sequenceValue"),
    statusMessage: document.getElementById("statusMessage"),
    resetButton: document.getElementById("resetButton"),
    productWindow: document.getElementById("productWindow"),
    trayProduct: document.getElementById("trayProduct"),
    progressFill: document.getElementById("progressFill"),
    machineDisplayState: document.getElementById("machineDisplayState"),
    lightNeutral: document.getElementById("lightNeutral"),
    lightPending: document.getElementById("lightPending"),
    lightOk: document.getElementById("lightOk"),
    lightError: document.getElementById("lightError"),
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
    statusType: "neutral",
};

let renderNonce = 0;

function formatMoney(value) {
    return `$${value}`;
}

function getInsertedTotal() {
    return state.insertedCoins.reduce((acc, coin) => acc + coin, 0);
}

function createProductOptions() {
    for (const product of PRODUCTS) {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent = `${product.name} (${formatMoney(product.price)})`;
        ui.productSelect.append(option);
    }
}

function createVisualProducts() {
    ui.productWindow.innerHTML = "";
    for (const product of PRODUCTS) {
        const item = document.createElement("article");
        item.className = "machine-item";
        item.dataset.productId = product.id;

        const name = document.createElement("p");
        name.className = "machine-item-name";
        name.textContent = product.name;
        item.append(name);

        const price = document.createElement("span");
        price.className = "machine-item-price";
        price.textContent = formatMoney(product.price);
        item.append(price);

        ui.productWindow.append(item);
    }
}

function highlightSelectedProduct() {
    for (const item of ui.productWindow.querySelectorAll(".machine-item")) {
        item.classList.toggle("selected", item.dataset.productId === state.selectedProduct.id);
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

function setStatusLight(type) {
    const mapping = {
        neutral: ui.lightNeutral,
        pending: ui.lightPending,
        ok: ui.lightOk,
        error: ui.lightError,
    };

    for (const light of [ui.lightNeutral, ui.lightPending, ui.lightOk, ui.lightError]) {
        light.classList.remove("active");
    }

    const light = mapping[type] ?? ui.lightNeutral;
    light.classList.add("active");
}

function setStatus(message, type) {
    state.statusType = type;
    ui.statusMessage.textContent = message;
    ui.statusMessage.className = `status ${type}`;
    setStatusLight(type);
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

function animateCoinDrop(coin) {
    const token = document.createElement("div");
    token.className = "coin-fall";
    token.textContent = coin;
    ui.vendingMachine.append(token);
    token.addEventListener("animationend", () => token.remove());
}

function renderTray() {
    if (!state.simulation) {
        return;
    }

    if (state.simulation.accepted) {
        ui.trayProduct.className = "tray-item dispensed";
        ui.trayProduct.textContent = state.selectedProduct.name;
        return;
    }

    if (state.simulation.trapped) {
        ui.trayProduct.className = "tray-item error";
        ui.trayProduct.textContent = "Pago excedido";
        return;
    }

    ui.trayProduct.className = "tray-item empty";
    ui.trayProduct.textContent = "Esperando pago exacto";
}

function renderMachineProgress(inserted, target) {
    const percent = Math.min((inserted / target) * 100, 100);
    ui.progressFill.style.width = `${percent}%`;
    ui.progressFill.className = "machine-progress-fill";
    if (state.simulation?.accepted) {
        ui.progressFill.classList.add("ok");
    } else if (state.simulation?.trapped) {
        ui.progressFill.classList.add("error");
    }
}

function renderMachineDisplay() {
    if (!state.simulation) {
        return;
    }

    const inserted = getInsertedTotal();
    const target = state.selectedProduct.price;

    ui.machineDisplayState.textContent = labelState(state.simulation.finalState);
    ui.priceValue.textContent = formatMoney(target);
    ui.insertedAmount.textContent = formatMoney(inserted);

    renderMachineProgress(inserted, target);
    renderTray();
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
    } else if (state.simulation.trapped) {
        setStatus("Rechazado: monto excedido. Operacion enviada al estado trampa.", "error");
    } else if (state.insertedCoins.length === 0) {
        setStatus("Esperando monedas.", "neutral");
    } else {
        const accumulated = state.simulation.finalState === TRAP_STATE ? getInsertedTotal() : state.simulation.finalState;
        const missing = state.selectedProduct.price - accumulated;
        setStatus(`Secuencia valida. Faltan ${formatMoney(Math.max(missing, 0))} para aceptar.`, "pending");
    }

    updateCoinButtonsAvailability();
    renderMachineDisplay();
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
    updateSessionPanel();
}

function refreshAllPanels() {
    highlightSelectedProduct();
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

    animateCoinDrop(coin);
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
    createVisualProducts();
    createCoinButtons();

    ui.productSelect.value = PRODUCTS[0].id;
    buildAutomatonForSelection(PRODUCTS[0].id);
    refreshAllPanels();

    ui.productSelect.addEventListener("change", handleProductChange);
    ui.resetButton.addEventListener("click", resetOperation);
}

init();
