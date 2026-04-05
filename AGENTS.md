# AGENTS.md

## Propósito del proyecto

Este repositorio implementa una app web estática que modela una máquina expendedora como un **AFD determinista** con pago de **monto exacto**.

## Objetivo funcional

- Seleccionar una golosina.
- Insertar monedas del alfabeto `{50, 100, 200, 500}`.
- Entregar producto solo si la suma llega exactamente al precio.
- En caso de exceder el precio, transicionar al estado trampa.

## Arquitectura

- `index.html`: layout de la app y contenedores UI.
- `static/js/automata.js`: modelo formal (estados, transiciones, regex, grados, DOT).
- `static/js/app.js`: control de interfaz, simulación de inserciones y render de tablas/grafo.
- `static/css/styles.css`: estilos y responsive.
- `tests/automata.test.js`: validación automática del motor.

## Convenciones técnicas

- Mantener el sitio **estático** y compatible con GitHub Pages.
- Evitar dependencias de backend para funcionalidades core.
- Todo texto de UI/documentación en español.
- Conservar el formato de secuencias para regex: `50-100-200`.
- El estado trampa se representa como `qT`.

## Reglas de modelado del AFD

- Estados: acumulados de dinero en múltiplos de 50 desde `q0` hasta `qPrecio`, más `qT`.
- Estado inicial: `q0`.
- Estado de aceptación: `qPrecio` del producto seleccionado.
- Función de transición:
  - si `acumulado + moneda <= precio` -> nuevo estado de acumulado;
  - en otro caso -> `qT`.
- `qT` tiene lazo para todos los símbolos del alfabeto.

## Comandos útiles

- Ejecutar local: `npm start`
- Pruebas: `npm test`

## Despliegue

Workflow en `.github/workflows/pages.yml`:
- corre tests en Node;
- empaqueta `index.html` y `static/`;
- despliega en GitHub Pages mediante GitHub Actions.
