# Tic-Tac-Toe Online ✨

Un juego de tres en raya (o N en raya) moderno, multijugador y en tiempo real, construido con Node.js, WebSockets y Tailwind CSS. Este proyecto va más allá del juego clásico, permitiendo a los jugadores competir en tableros de diferentes tamaños con una interfaz pulida, efectos visuales, y un robusto sistema de reconexión para una experiencia de usuario fluida.

---

## 📋 Tabla de Contenidos
1. [Características Principales](#características-principales-)
2. [Tech Stack](#tech-stack-)
3. [Instalación y Uso](#instalación-y-uso-)
4. [Estructura del Proyecto](#estructura-del-proyecto-)

---

## **Características Principales** 🚀

* **Multijugador en Tiempo Real:** Juega con un amigo en diferentes dispositivos a través de una conexión WebSocket de baja latencia.
* **Tableros Dinámicos:** Elige entre diferentes tamaños de tablero (3x3, 4x4, 5x5, y 6x6) para variar la dificultad y la estrategia.
* **Condiciones de Victoria Adaptables:** El número de fichas en raya necesarias para ganar se ajusta automáticamente según el tamaño del tablero.
* **Sistema de Reconexión:** Si un jugador recarga la página o pierde la conexión, tiene 15 segundos para volver a unirse a la partida sin interrumpir el juego para el oponente.
* **Interfaz Moderna y Reactiva:** Un diseño atractivo creado con Tailwind CSS, con un tema "Neón-Glass", iconos SVG y animaciones.
* **Feedback Visual Avanzado:**
    * Animación de línea que tacha las fichas ganadoras.
    * Resaltado visual de la última jugada realizada.
    * Indicador de turno activo y animado para saber siempre a quién le toca jugar.
* **Efectos de Sonido:** Sonidos para movimientos, victorias y empates que enriquecen la experiencia de juego.
* **Contador de Puntuación:** Lleva un registro de las victorias de cada jugador durante la sesión de juego.

---

## **Tech Stack** 🛠️

Este proyecto utiliza las siguientes tecnologías y librerías:

* **Backend:**
    * [Node.js](https://nodejs.org/): Entorno de ejecución de JavaScript.
    * [Express](https://expressjs.com/): Framework para el servidor web.
    * [ws (WebSocket)](https://github.com/websockets/ws): Librería para la comunicación en tiempo real.
    * [uuid](https://github.com/uuidjs/uuid): Para generar identificadores únicos para la reconexión de jugadores.
* **Frontend:**
    * HTML5
    * [Tailwind CSS](https://tailwindcss.com/) (vía Play CDN): Framework de CSS para un diseño rápido y moderno.
    * JavaScript (ES6+): Lógica del lado del cliente.
* **Entorno de Desarrollo:**
    * [nodemon](https://nodemon.io/): Herramienta que reinicia automáticamente el servidor durante el desarrollo.

---

## **Instalación y Uso** 🏁

Sigue estos pasos para ejecutar el proyecto en tu máquina local.

### **Prerrequisitos**

Asegúrate de tener instalado [Node.js](https://nodejs.org/) (que incluye npm).

### **Pasos**

1.  **Clona el repositorio** (o descarga los archivos en una carpeta):
    ```bash
    git clone https://github.com/laocorp/3-en-linea.git
    ```

2.  **Navega a la carpeta del proyecto:**
    ```bash
    cd 3-en-linea
    ```

3.  **Instala las dependencias del servidor:**
    ```bash
    npm install
    ```
    *Esto instalará `express`, `ws` y `uuid` que se encuentran en el `package.json`.*

4.  **Inicia el servidor en modo de desarrollo:**
    ```bash
    npx nodemon server.js
    ```
    *Verás un mensaje en la consola confirmando que el servidor está corriendo en `http://localhost:3000`.*

5.  **¡A Jugar!**
    * Abre tu navegador y ve a `http://localhost:3000`.
    * Abre una segunda pestaña (o un navegador en otro dispositivo conectado a la misma red) y ve a la misma dirección.
    * Ingresa tu nombre, elige un tamaño de tablero y haz clic en "Jugar". El juego comenzará automáticamente cuando el segundo jugador se una.

---

## **Estructura del Proyecto** 📂

El repositorio está organizado de la siguiente manera:
