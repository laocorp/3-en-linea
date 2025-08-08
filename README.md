# Tic-Tac-Toe Online ✨

Un juego de tres en raya (o N en raya) moderno, multijugador y en tiempo real, construido con Node.js, WebSockets y Tailwind CSS. Este proyecto va más allá del juego clásico, permitiendo a los jugadores competir en tableros de diferentes tamaños con una interfaz pulida y reactiva.

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
* **Condiciones de Victoria Adaptables:** El número de fichas en raya necesarias para ganar se ajusta automáticamente según el tamaño del tablero (3 para 3x3, 4 para 4x4, y 5 para tableros más grandes).
* **Interfaz Moderna:** Un diseño atractivo y responsivo creado con Tailwind CSS, enfocado en la experiencia de usuario con efectos visuales y animaciones.
* **Contador de Puntuación:** Lleva un registro de las victorias de cada jugador durante la sesión de juego.
* **Lógica Encapsulada:** El backend está estructurado con una clase `Game` que maneja toda la lógica y el estado, promoviendo un código limpio y mantenible.

---

## **Tech Stack** 🛠️

Este proyecto utiliza las siguientes tecnologías y librerías:

* **Backend:**
    * [Node.js](https://nodejs.org/): Entorno de ejecución de JavaScript.
    * [Express](https://expressjs.com/): Framework para el servidor web.
    * [ws (WebSocket)](https://github.com/websockets/ws): Librería para la comunicación en tiempo real.
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
    git clone [https://github.com/laocorp/3-en-linea.git]
    ```

2.  **Navega a la carpeta del proyecto:**
    ```bash
    cd tic-tac-toe-online
    ```

3.  **Instala las dependencias del servidor:**
    ```bash
    npm install
    ```
    *Esto instalará `express` y `ws` que se encuentran en el `package.json`.*

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

```
/
├── public/                 # Contiene los archivos del frontend
│   ├── index.html          # Estructura principal de la UI
│   └── script.js           # Lógica del cliente y manipulación del DOM
├── server.js               # Lógica del backend, servidor web y WebSocket
├── package.json            # Define las dependencias y scripts del proyecto
└── README.md               # Este archivo
```
