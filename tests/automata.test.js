import assert from "node:assert/strict";
import test from "node:test";

import {
    COINS,
    TRAP_STATE,
    buildAutomaton,
    buildRegularExpression,
    serializeSequence,
    simulateSequence,
} from "../static/js/automata.js";

test("el AFD es completo y determinista para cada estado y símbolo", () => {
    const automaton = buildAutomaton(300, COINS);

    for (const state of automaton.states) {
        const transitions = automaton.transitions[state === TRAP_STATE ? TRAP_STATE : String(state)];
        assert.ok(transitions);
        for (const coin of COINS) {
            assert.ok(Object.prototype.hasOwnProperty.call(transitions, coin));
        }
    }
});

test("acepta secuencias de monto exacto", () => {
    const automaton = buildAutomaton(300, COINS);
    const accepted = simulateSequence(automaton, [100, 200]);

    assert.equal(accepted.accepted, true);
    assert.equal(accepted.trapped, false);
    assert.equal(accepted.finalState, 300);
});

test("rechaza secuencias que exceden el monto objetivo", () => {
    const automaton = buildAutomaton(300, COINS);
    const rejected = simulateSequence(automaton, [200, 200]);

    assert.equal(rejected.accepted, false);
    assert.equal(rejected.trapped, true);
    assert.equal(rejected.finalState, TRAP_STATE);
});

test("la expresión regular reconoce exactamente secuencias válidas", () => {
    const regexSource = buildRegularExpression(250, COINS);
    const regex = new RegExp(regexSource);

    assert.match(serializeSequence([50, 200]), regex);
    assert.match(serializeSequence([100, 100, 50]), regex);
    assert.match(serializeSequence([200, 50]), regex);

    assert.doesNotMatch(serializeSequence([100, 100]), regex);
    assert.doesNotMatch(serializeSequence([500]), regex);
    assert.doesNotMatch(serializeSequence([50, 50, 200]), regex);
});
