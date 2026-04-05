export const COINS = Object.freeze([50, 100, 200, 500]);
export const TRAP_STATE = "TRAMPA";
const STEP = 50;

export const PRODUCTS = Object.freeze([
    { id: "jet", name: "Chocolatina Jet", price: 300 },
    { id: "bonbonbum", name: "Bon Bon Bum", price: 250 },
    { id: "trululu", name: "Trululu", price: 350 },
    { id: "chocoramo-mini", name: "Chocoramo Mini", price: 400 },
]);

function assertValidTarget(target) {
    if (!Number.isInteger(target) || target <= 0) {
        throw new Error("El precio objetivo debe ser un entero positivo.");
    }
    if (target % STEP !== 0) {
        throw new Error("El precio objetivo debe ser múltiplo de 50.");
    }
}

function stateKey(state) {
    return state === TRAP_STATE ? TRAP_STATE : String(state);
}

export function labelState(state) {
    return state === TRAP_STATE ? "qT" : `q${state}`;
}

export function findProductById(productId) {
    return PRODUCTS.find((product) => product.id === productId) ?? PRODUCTS[0];
}

function resolveNextState(state, coin, target) {
    if (state === TRAP_STATE) {
        return TRAP_STATE;
    }
    const next = state + coin;
    if (next > target) {
        return TRAP_STATE;
    }
    return next;
}

export function buildAutomaton(target, coins = COINS) {
    assertValidTarget(target);

    const states = [];
    for (let sum = 0; sum <= target; sum += STEP) {
        states.push(sum);
    }
    states.push(TRAP_STATE);

    const transitions = {};
    for (const state of states) {
        const key = stateKey(state);
        transitions[key] = {};
        for (const coin of coins) {
            transitions[key][coin] = resolveNextState(state, coin, target);
        }
    }

    return {
        target,
        coins: [...coins],
        states,
        transitions,
        initialState: 0,
        acceptanceStates: [target],
        trapState: TRAP_STATE,
    };
}

export function getNextState(automaton, state, coin) {
    const stateTransitions = automaton.transitions[stateKey(state)];
    if (!stateTransitions || !Object.prototype.hasOwnProperty.call(stateTransitions, coin)) {
        throw new Error(`Transición no encontrada para estado=${state} y moneda=${coin}`);
    }
    return stateTransitions[coin];
}

export function simulateSequence(automaton, sequence) {
    let current = automaton.initialState;
    const path = [current];

    for (const coin of sequence) {
        current = getNextState(automaton, current, coin);
        path.push(current);
    }

    const accepted = automaton.acceptanceStates.includes(current);

    return {
        finalState: current,
        path,
        accepted,
        trapped: current === automaton.trapState,
    };
}

export function serializeSequence(sequence) {
    return sequence.join("-");
}

export function enumerateValidSequences(target, coins = COINS) {
    assertValidTarget(target);
    const valid = [];

    function dfs(sum, path) {
        if (sum === target) {
            valid.push([...path]);
            return;
        }

        for (const coin of coins) {
            const next = sum + coin;
            if (next <= target) {
                path.push(coin);
                dfs(next, path);
                path.pop();
            }
        }
    }

    dfs(0, []);
    valid.sort((a, b) => {
        if (a.length !== b.length) {
            return a.length - b.length;
        }
        return serializeSequence(a).localeCompare(serializeSequence(b), "es");
    });

    return valid;
}

export function buildRegularExpression(target, coins = COINS) {
    const alternatives = enumerateValidSequences(target, coins).map((sequence) => serializeSequence(sequence));
    if (!alternatives.length) {
        return "^(?!)$";
    }
    if (alternatives.length === 1) {
        return `^${alternatives[0]}$`;
    }
    return `^(?:${alternatives.join("|")})$`;
}

export function buildTransitionTable(automaton) {
    return automaton.states.map((state) => {
        const row = { state: labelState(state) };
        for (const coin of automaton.coins) {
            row[coin] = labelState(getNextState(automaton, state, coin));
        }
        return row;
    });
}

export function buildDegreeTable(automaton) {
    const inDegree = new Map(automaton.states.map((state) => [stateKey(state), 0]));
    const outDegree = new Map(automaton.states.map((state) => [stateKey(state), automaton.coins.length]));

    for (const state of automaton.states) {
        for (const coin of automaton.coins) {
            const next = getNextState(automaton, state, coin);
            const key = stateKey(next);
            inDegree.set(key, (inDegree.get(key) ?? 0) + 1);
        }
    }

    return automaton.states.map((state) => {
        const key = stateKey(state);
        const entrada = inDegree.get(key) ?? 0;
        const salida = outDegree.get(key) ?? 0;

        return {
            state: labelState(state),
            entrada,
            salida,
            total: entrada + salida,
        };
    });
}

export function buildDotGraph(automaton) {
    const lines = [
        "digraph AFD {",
        "  rankdir=LR;",
        '  bgcolor="white";',
        '  node [shape=circle, fontname="IBM Plex Mono", fontsize=11];',
        "  start [shape=point];",
        `  start -> ${labelState(automaton.initialState)};`,
        "",
    ];

    for (const state of automaton.states) {
        const node = labelState(state);
        if (automaton.acceptanceStates.includes(state)) {
            lines.push(`  ${node} [shape=doublecircle];`);
        } else if (state === automaton.trapState) {
            lines.push(`  ${node} [shape=octagon];`);
        }
    }
    lines.push("");

    for (const fromState of automaton.states) {
        const grouped = new Map();
        for (const coin of automaton.coins) {
            const toState = getNextState(automaton, fromState, coin);
            const key = stateKey(toState);
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(coin);
        }

        for (const [toKey, coinLabels] of grouped.entries()) {
            const from = labelState(fromState);
            const to = labelState(toKey === TRAP_STATE ? TRAP_STATE : Number(toKey));
            lines.push(`  ${from} -> ${to} [label="${coinLabels.join(", ")}"];`);
        }
    }

    lines.push("}");
    return lines.join("\n");
}
