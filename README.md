# 3 en linea Online ✨

Un juego de tres en linea (o N en linea) moderno, multijugador y en tiempo real, construido con Node.js, WebSockets y Tailwind CSS. Este proyecto es una aplicación web completa que ofrece tableros de tamaño dinámico, un oponente de IA imbatible (Minimax), un robusto sistema de reconexión y una interfaz de usuario pulida con animaciones y efectos de sonido.

---

## 📋 Tabla de Contenidos
1. [Características Principales](#características-principales-)
2. [Tech Stack](#tech-stack-)
3. [Instalación y Uso](#instalación-y-uso-)
4. [Cómo Jugar](#cómo-jugar-)
5. [Estructura del Proyecto](#estructura-del-proyecto-)

---

## **Características Principales** 🚀

* **Modo de Juego Dual:**
    * **Multijugador en Tiempo Real:** Juega con un amigo en diferentes dispositivos compartiendo la URL.
    * **Un Jugador vs. IA:** Enfréntate a un oponente controlado por la computadora.
* **Inteligencia Artificial Avanzada:**
    * La IA utiliza el **algoritmo Minimax**, lo que la convierte en un oponente perfecto, incapaz de perder en tableros de 3x3.
* **Tableros y Reglas Dinámicas:**
    * Elige entre tableros de **3x3, 4x4, 5x5 y 6x6**.
    * Las **condiciones de victoria se adaptan** al tamaño del tablero (3, 4 o 5 en raya).
* **Sistema de Reconexión Robusto:**
    * Si un jugador recarga la página o pierde la conexión, tiene **15 segundos de gracia** para reconectarse automáticamente sin terminar la partida.
* **Interfaz y Experiencia de Usuario de Alta Calidad:**
    * **Diseño "Neón-Glass"** moderno construido con Tailwind CSS.
    * **Feedback Visual Avanzado:** Animación de línea ganadora, resaltado del último movimiento y un indicador de turno activo que brilla.
    * **Efectos de Sonido (SFX)** para movimientos, victorias y empates.
    * Iconos **SVG** para 'X' y 'O' con animaciones de aparición.
* **Funcionalidades Adicionales:**
    * **Turno Inicial Aleatorio:** El jugador que empieza cada partida se elige al azar.
    * **Contador de Puntuación** por sesión.

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

1.  **Clona el repositorio:**
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
    *Esto instalará `express`, `ws` y `uuid`.*

4.  **Inicia el servidor en modo de desarrollo:**
    ```bash
    npx nodemon server.js
    ```
    *Verás un mensaje en la consola confirmando que el servidor está corriendo en `http://localhost:3000`.*

5.  **Abre el juego** en tu navegador yendo a `http://localhost:3000`.

---

## **Cómo Jugar** 🎮

1.  **Elige tu Modo:** Al abrir el juego, aparecerá un modal. Ingresa tu nombre y elige el tamaño del tablero.
2.  **Para jugar contra la IA:** Haz clic en el botón **"Jugar contra IA"**.
3.  **Para jugar con un amigo:**
    * Haz clic en **"Jugar con Amigo"**.
    * Comparte la URL de la página (`http://localhost:3000` o tu URL pública) con otra persona.
    * El juego comenzará automáticamente cuando tu amigo se una.

---

## **Estructura del Proyecto** 📂

```
/
├── public/                 # Contiene los archivos del frontend
│   ├── sounds/             # Archivos de audio del juego (.mp3)
│   ├── index.html          # Estructura principal de la UI
│   └── script.js           # Lógica del cliente y manipulación del DOM
├── server.js               # Lógica del backend, servidor web y WebSocket
├── package.json            # Define las dependencias y scripts del proyecto
└── README.md               # Este archivo
```
