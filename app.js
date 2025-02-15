// Almacenamiento de datos en localStorage
const STORAGE_KEY = 'amigoSecreto2025';

const participantes = {
    lista: [],
    asignaciones: new Map(),
    historial: [],

    // Guardar datos en localStorage
    guardar() {
        const datos = {
            lista: this.lista,
            asignaciones: Array.from(this.asignaciones.entries()),
            historial: this.historial
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
    },

    // Cargar datos desde localStorage
    cargar() {
        const datos = localStorage.getItem(STORAGE_KEY);
        if (datos) {
            const parsed = JSON.parse(datos);
            this.lista = parsed.lista || [];
            this.asignaciones = new Map(parsed.asignaciones || []);
            this.historial = parsed.historial || [];
            actualizarListaParticipantes();
            actualizarEstadoBotonSorteo();
        }
    }
};

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    participantes.cargar();
});

/**
 * Agrega un nuevo participante validando datos y evitando duplicados
 * @param {Event} event - Evento del formulario
 */
function agregarParticipante(event) {
    event && event.preventDefault();
    
    const inputParticipante = document.getElementById("amigo");
    const nombre = inputParticipante.value.trim();

    // Validaciones
    if (nombre === "") {
        mostrarNotificacion("Por favor, ingresa un nombre", "error");
        return;
    }

    if (nombre.length < 2) {
        mostrarNotificacion("El nombre debe tener al menos 2 caracteres", "error");
        return;
    }

    if (participantes.lista.includes(nombre)) {
        mostrarNotificacion("Este participante ya está en la lista", "error");
        return;
    }

    // Agregar participante
    participantes.lista.push(nombre);
    participantes.guardar(); // Guardar después de agregar
    
    // Limpiar input y actualizar UI
    inputParticipante.value = "";
    actualizarListaParticipantes();
    actualizarEstadoBotonSorteo();
    
    mostrarNotificacion(`¡${nombre} ha sido agregado a la lista!`, "success");
}

/**
 * Elimina un participante de la lista
 * @param {number} index - Índice del participante a eliminar
 */
function eliminarParticipante(index) {
    const nombre = participantes.lista[index];
    participantes.lista.splice(index, 1);
    participantes.guardar(); // Guardar después de eliminar
    
    actualizarListaParticipantes();
    actualizarEstadoBotonSorteo();
    mostrarNotificacion(`${nombre} ha sido eliminado de la lista`, "success");
}

/**
 * Actualiza la visualización de la lista de participantes
 */
function actualizarListaParticipantes() {
    const listaHTML = document.querySelector("#listaAmigos");
    listaHTML.innerHTML = "";

    participantes.lista.forEach((participante, index) => {
        const li = document.createElement("li");
        li.className = "participante-item";
        
        li.innerHTML = `
            <span>${participante}</span>
            <button 
                onclick="eliminarParticipante(${index})" 
                class="delete-button" 
                aria-label="Eliminar ${participante}"
            >×</button>
        `;
        
        listaHTML.appendChild(li);
    });

    // Actualizar contador de participantes
    const contador = document.getElementById('participantCount');
    if (contador) {
        contador.textContent = participantes.lista.length;
    }
}

/**
 * Realiza el sorteo de amigo secreto
 */
function realizarSorteo() {
    const cantidadParticipantes = participantes.lista.length;

    // Validaciones
    if (cantidadParticipantes < 3) {
        mostrarNotificacion("Se necesitan al menos 3 participantes para el sorteo", "error");
        return;
    }

    // Limpiar asignaciones previas
    participantes.asignaciones.clear();

    // Crear array de participantes disponibles
    let disponibles = [...participantes.lista];
    let asignados = [...participantes.lista];
    let intentos = 0;
    const maxIntentos = 100;

    // Intentar hacer el sorteo hasta que sea válido
    while (intentos < maxIntentos) {
        participantes.asignaciones.clear();
        disponibles = [...participantes.lista];
        let exitoso = true;

        for (let participante of participantes.lista) {
            // Filtrar participantes disponibles (no el mismo y no ya asignado)
            let posiblesAsignaciones = disponibles.filter(p => 
                p !== participante && !Array.from(participantes.asignaciones.values()).includes(p)
            );

            if (posiblesAsignaciones.length === 0) {
                exitoso = false;
                break;
            }

            const indiceAleatorio = Math.floor(Math.random() * posiblesAsignaciones.length);
            const amigoAsignado = posiblesAsignaciones[indiceAleatorio];
            
            participantes.asignaciones.set(participante, amigoAsignado);
            disponibles = disponibles.filter(p => p !== amigoAsignado);
        }

        if (exitoso) {
            break;
        }
        intentos++;
    }

    if (intentos === maxIntentos) {
        mostrarNotificacion("Error al realizar el sorteo. Por favor, inténtalo de nuevo.", "error");
        return;
    }

    // Guardar el resultado
    participantes.guardar();
    
    mostrarResultadoSorteo();
    mostrarNotificacion("¡Sorteo realizado con éxito!", "success");
}

/**
 * Muestra el resultado del sorteo
 */
function mostrarResultadoSorteo() {
    const resultadoHTML = document.getElementById("resultado");
    let resultado = "<h3>Resultados del Sorteo</h3>";

    participantes.asignaciones.forEach((amigoAsignado, participante) => {
        resultado += `
            <div class="resultado-item">
                <strong>${participante}</strong> 
                <span class="flecha">→</span> 
                <em>${amigoAsignado}</em>
            </div>
        `;
    });

    resultadoHTML.innerHTML = resultado;
}

/**
 * Actualiza el estado del botón de sorteo
 */
function actualizarEstadoBotonSorteo() {
    const botonSorteo = document.querySelector(".draw-button");
    if (botonSorteo) {
        const habilitado = participantes.lista.length >= 3;
        botonSorteo.disabled = !habilitado;
        
        if (habilitado) {
            botonSorteo.classList.remove('disabled');
        } else {
            botonSorteo.classList.add('disabled');
        }
    }
}

/**
 * Muestra una notificación
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de notificación ('success' o 'error')
 */
function mostrarNotificacion(mensaje, tipo) {
    const notificationContainer = document.getElementById('notification-container') || document.body;
    
    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${tipo === 'error' ? '❌' : '✅'}</span>
            <span class="notification-message">${mensaje}</span>
        </div>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Event listeners
document.getElementById("formParticipante").addEventListener("submit", agregarParticipante);
