# Restify - Aplicación Web de Productividad y Relajación  
Una aplicación web de una sola página que combina gestión del tiempo con funciones de relajación para ayudarte a mantener el enfoque mientras tomas descansos significativos.

## Características

### Temporizador Pomodoro
- Periodos de trabajo y descanso configurables con entradas de minutos/segundos
- Conteo de ciclos personalizable para sesiones repetidas de trabajo/descanso
- Máquina de estados que gestiona las fases detenido/trabajo/descanso con transiciones automáticas
- Sistema de eventos para controlar otros módulos durante las fases del temporizador

### Juego de Sudoku
- Generación automática de rompecabezas con 40 celdas removidas para aumentar la dificultad
- Cuadrícula interactiva 9×9 con validación de entrada para números del 1 al 9
- Validación de solución basada en las reglas del Sudoku
- Integración con modo de enfoque: se bloquea durante periodos de trabajo y se desbloquea durante descansos

### Reproductor de Música Lofi
- Gestión de playlist con pistas cargadas desde assets/music/playlist.json  
- Controles de reproducción completos: reproducir, pausar, siguiente, anterior  
- Barra de progreso interactiva con soporte para ratón y táctil  
- Avance automático a la siguiente pista cuando termina la actual  

---

## Stack Técnico
- **HTML5**: estructura semántica y elemento de audio  
- **CSS3**: diseño con grid, diseño responsivo, propiedades personalizadas  
- **JavaScript (ES6+)**: JS puro con módulos, sin frameworks  
- **JSON**: almacenamiento de metadatos de playlist  

---

## Arquitectura

### Organización de Módulos
La aplicación usa tres módulos JavaScript independientes envueltos en IIFEs para evitar contaminar el espacio global
js/
├── pomodoro.js # Máquina de estados del temporizador y emisión de eventos
├── sudoku.js # Generación y validación de rompecabezas
└── player.js # Control de reproducción de audio

### Comunicación Basada en Eventos
Los módulos se comunican a través de eventos personalizados del DOM:

- **work:start** – Bloquea el Sudoku durante el tiempo de enfoque
- **rest:start** – Desbloquea el Sudoku durante los descansos

### Diseño Responsive
El diseño con CSS Grid se adapta a tres puntos de ruptura:

- **Escritorio**: diseño en cuadrícula 4×4  
- **Tablet (≤1150px)**: cuadrícula 3×3  
- **Móvil (≤870px)**: columna única vertical  

### Sistema de Cursores Personalizados
Cuatro tipos de cursor proporcionan retroalimentación visual:

- Cursor normal para visualización  
- Cursor de entrada para campos editables  
- Cursor de mano para elementos clicables  
- Cursor prohibido para estados deshabilitados/bloqueados  

---

## Estructura de Archivos
Restify/
├── index.html # Punto de entrada principal
├── css/
│ └── style.css # Grid, diseño responsive, estilos
├── js/
│ ├── pomodoro.js # Funcionalidad del temporizador
│ ├── sudoku.js # Lógica del Sudoku
│ └── player.js # Controles del reproductor
└── assets/
├── img/ # Cursores, fondos, iconos
└── music/ # Pistas de audio y playlist.json

---

## Cómo Empezar
1. Entra en https://nereasanlop.github.io/Restify/ y a trabajar!

---

## Uso
- **Configura tu sesión Pomodoro:** establece duración del trabajo, duración del descanso y número de ciclos  
- **Inicia el temporizador:** haz clic en *start* para comenzar la sesión de enfoque — el Sudoku se bloqueará  
- **Toma descansos:** durante los descansos, el Sudoku se desbloquea para relajación mental  
- **Disfruta la música:** usa el reproductor para escuchar pistas lofi mientras trabajas o descansas  

