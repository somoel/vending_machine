# Máquina expendedora como AFD (Web)

App web estática que modela una máquina expendedora como **Autómata Finito Determinista (AFD)**, con monedas y monto exacto.

## Configuración base elegida

- Tipo de autómata: AFD determinista completo.
- Modalidad: una compra por operación (se selecciona producto y luego se insertan monedas).
- Monedas aceptadas: `50`, `100`, `200`, `500`.
- Regla de pago: monto exacto (si se excede, va a estado trampa).
- Productos (golosinas colombianas):
  - Bon Bon Bum: `$250`
  - Chocolatina Jet: `$300`
  - Trululu: `$350`
  - Chocoramo Mini: `$400`
- Visualización de grafo: Graphviz en navegador (DOT renderizado con `viz.js`).
- Expresión regular: secuencias válidas de monedas en formato `50-100-200`.
- Idioma de la UI: español.

## Qué muestra la app

- Alfabeto.
- Estado inicial.
- Cantidad de estados.
- Estado de aceptación.
- Tabla de transición.
- Grado de cada estado (entrada, salida, total).
- Grafo del AFD.
- Expresión regular equivalente de secuencias válidas.

## Estructura

- `index.html`: interfaz principal.
- `static/css/styles.css`: estilos.
- `static/js/automata.js`: motor formal del AFD.
- `static/js/app.js`: interacción y render en pantalla.
- `tests/automata.test.js`: pruebas automáticas.

## Ejecutar local (Flask)

```bash
python app.py
```

Luego abre `http://127.0.0.1:5000`.

## Ejecutar local (estático)

```bash
npm start
```

Luego abre `http://localhost:8000`.

## Pruebas automáticas

```bash
npm test
```

## GitHub Pages

Incluye workflow en `.github/workflows/pages.yml` que:
1. Ejecuta tests.
2. Publica `index.html` + `static/` en GitHub Pages.

Para activarlo:
1. Sube el repo a GitHub.
2. Verifica que la rama principal sea `main`.
3. En GitHub, en **Settings > Pages**, deja **Source: GitHub Actions**.
