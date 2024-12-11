import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc, arrayUnion, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

// Configuración de Firebase.
const firebaseConfig = {
    apiKey: "AIzaSyBwhW0afg1HdeYIc67Dj3vQm8nD3jJOWXA",
    authDomain: "booky-f62d9.firebaseapp.com",
    projectId: "booky-f62d9",
    storageBucket: "booky-f62d9.firebasestorage.app",
    messagingSenderId: "1000843075837",
    appId: "1:1000843075837:web:03bd05df6d52b823859e94"
  };

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Manejo del formulario de inicio de sesión (si lo tienes)


// Ejemplo de escuchador de eventos para el formulario de inicio de sesión
const loginForm = document.getElementById("login-form");
loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usuario = document.getElementById("usuario").value;
    const contrasena = document.getElementById("contrasena").value;
    try {
        await signInWithEmailAndPassword(auth, usuario, contrasena);
        window.location.href = "home.html"; 
    } catch (error) {
        alert("Error de inicio de sesión: " + error.message);
    }
});

// Escuchador de eventos para el botón de cerrar sesión
const cerrarSesionButton = document.getElementById("cerrar-sesion");
cerrarSesionButton?.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "index.html"; 
    } catch (error) {
        alert("Error al cerrar sesión: " + error.message);
    }
});


// Crear un nuevo libro
const crearNuevoLibroButton = document.getElementById("crear-nuevo-libro");
const nuevoLibroFormContainer = document.getElementById("nuevo-libro-form-container");
crearNuevoLibroButton?.addEventListener("click", () => {
    nuevoLibroFormContainer.style.display = "block";
});

const cancelarLibroButton = document.getElementById("cancelar-libro");
cancelarLibroButton?.addEventListener("click", () => {
    nuevoLibroFormContainer.style.display = "none";
    document.getElementById("nombre-libro").value = "";
});

const crearLibroButton = document.getElementById("crear-libro");
crearLibroButton?.addEventListener('click', async () => {
    const nombreLibro = document.getElementById('nombre-libro').value;

    if (nombreLibro.trim() === '') {
        alert('Por favor, ingresa un nombre para el libro.');
        return;
    }

    const q = query(collection(db, "Libro"), where("nombre", "==", nombreLibro));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        alert('Ya existe un libro con ese nombre.');
        return;
    }

    try {
        await addDoc(collection(db, "Libro"), { nombre: nombreLibro, clientes: [] });
        alert('Libro creado correctamente!');
        nuevoLibroFormContainer.style.display = "none";
        document.getElementById("nombre-libro").value = "";
        loadExistingBooks();
    } catch (error) {
        console.error("Error al crear el libro:", error);
        alert('Error al crear el libro. Intenta de nuevo.');
    }
});

const bookContainer = document.querySelector('.book-container');
const bookFormCard = document.getElementById('book-form-card');
const closeFormButton = document.getElementById('close-form');
let currentBookName = null; // Variable para almacenar el nombre del libro actual



async function loadExistingBooks() {
    const librosRef = collection(db, 'Libro');
    const q = query(librosRef);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        bookContainer.innerHTML = '';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const bookDiv = document.createElement('div');
            bookDiv.classList.add('book');
            bookDiv.dataset.libro = data.nombre;

            const img = document.createElement('img');
            img.src = 'img/book-icon.png';
            img.alt = 'Libro ' + data.nombre;
            bookDiv.appendChild(img);

            const title = document.createElement('span');
            title.classList.add('book-title');
            title.textContent = data.nombre;
            bookDiv.appendChild(title);

            bookDiv.appendChild(createActionButton(data.nombre, "edit", openEditModal));
            bookDiv.appendChild(createActionButton(data.nombre, "delete", deleteBook));

            bookDiv.addEventListener('click', () => {
                
                showClientInfo(data.nombre);
            });
            bookContainer.appendChild(bookDiv);
        
    });
});
}

function createActionButton(bookName, actionType, actionHandler){
  const actionButtons = document.createElement('button');
    actionButtons.classList.add('action-button', `${actionType}-button`);
    actionButtons.addEventListener('click', () => actionHandler(bookName));
    return actionButtons;
}

let submitEventListener = null;

async function showClientInfo(bookName) {
    currentBookName = bookName; // Almacena el nombre del libro actual
    bookFormCard.style.display = 'block';
    document.getElementById('book-form-title').textContent = `Libro: ${bookName}`;
    document.getElementById('current-book-name-list').textContent = ` (${bookName})`;
    bookFormCard.querySelector('form').reset();

    const bookForm = bookFormCard.querySelector('form');

    // Eliminar un listener de eventos previamente agregado, si existe
    if (submitEventListener) {
        bookForm.removeEventListener('submit', submitEventListener);
    }

    // Definir el nuevo listener para el evento submit
    submitEventListener = async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const cedula = document.getElementById('cedula').value;

        // Verificar si el cliente ya existe en la base de datos
        const q = query(collection(db, 'customers'), 
                        where("bookId", "==", currentBookName),
                        where("cedula", "==", cedula)); // Puedes usar email también si prefieres

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            alert('Ya existe un cliente con esa cédula en este libro.');
            bookFormCard.querySelector('form').reset();
            return;  // Si el cliente ya existe, no se guarda.
        }

        try {
            // AÑADIR A LA COLECCIÓN "customers"
            await addDoc(collection(db, 'customers'), {
                bookId: currentBookName,  // Aquí se guarda el nombre del libro
                nombre: nombre,
                email: email,
                cedula: cedula,
                deuda: 0
            });

            console.log('Cliente guardado correctamente!');
            bookFormCard.style.display = 'none';
            alert('Datos enviados correctamente!');
            updateClientTable(bookName); // Actualiza la tabla

        } catch (error) {
            console.error('Error al guardar los datos del cliente:', error);
            alert('Error al guardar los datos. Intenta de nuevo.');
        }
    };

    // Añadir el nuevo listener de submit al formulario
    bookForm.addEventListener('submit', submitEventListener);

    updateClientTable(bookName);
}


async function updateClientTable(bookName) {
    const clientListContainer = document.getElementById('client-list-container');
    const clientTable = document.getElementById('client-table');
    const tbody = clientTable.querySelector('tbody');
    tbody.innerHTML = '';

    const bookRef = collection(db, 'customers');
    const q = query(bookRef, where("bookId", "==", bookName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        querySnapshot.forEach(doc => { 
            const client = doc.data(); 

            const row = tbody.insertRow();
            const nombreCell = row.insertCell();
            const cedulaCell = row.insertCell();
            const correoCell = row.insertCell();
            const deudaCell = row.insertCell();
            const accionCell = row.insertCell();

            nombreCell.textContent = client.nombre;
            cedulaCell.textContent = client.cedula;
            correoCell.textContent = client.email;
            deudaCell.textContent = client.deuda ? `$${client.deuda.toFixed(2)} cop` : '$0.00 cop';

            const verHojaButton = document.createElement('button');
            verHojaButton.textContent = 'Ver Hoja';
            verHojaButton.classList.add('ver-hoja-button');
            verHojaButton.addEventListener('click', () => showClientConsumption(client.nombre, client.cedula));


            // *** AQUÍ SE AGREGA EL CÓDIGO PARA EL BOTÓN "ELIMINAR CLIENTE" ***
            const eliminarClienteButton = document.createElement('button');
            eliminarClienteButton.textContent = 'Eliminar';
            eliminarClienteButton.classList.add('eliminar-cliente-button');
            eliminarClienteButton.addEventListener('click', async () => {
                if (confirm(`¿Estás seguro de que quieres eliminar a ${client.nombre}?`)) {
                    try {
                      await deleteDoc(doc.ref);
                      alert("Cliente eliminado correctamente.");
                      updateClientTable(bookName);
                    } catch (error) {
                      console.error("Error al eliminar cliente:", error);
                      alert("Error al eliminar cliente. Intenta de nuevo.");
                    }
                }
            });

            accionCell.appendChild(verHojaButton);
            accionCell.appendChild(eliminarClienteButton);

        });
    } else {
        tbody.innerHTML = '<tr><td colspan="5">No se encontraron clientes para este libro.</td></tr>';
    }
}

//Funcion para actualizar la tabla de consumos y calcular la deuda total.
async function updateConsumptionTable(cedula) {
    const consumoTable = document.getElementById('consumo-table');
    const tbody = consumoTable.querySelector('tbody');
    tbody.innerHTML = '';
    let deudaTotal = 0;

    const consumosRef = collection(db, 'TU_COLECCION_CONSUMOS');
    const q = query(consumosRef, where('cedula', '==', cedula));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(doc => {
        const consumo = doc.data();
        const valorTotal = consumo.cantidad * consumo.valoru;
        deudaTotal += valorTotal;

        const row = tbody.insertRow();
        row.insertCell().textContent = consumo.item;
        row.insertCell().textContent = consumo.descripcion;
        row.insertCell().textContent = consumo.fecha;
        row.insertCell().textContent = consumo.cantidad;
        row.insertCell().textContent = consumo.valoru;
        row.insertCell().textContent = valorTotal.toFixed(2);

             // ---->  CELDA "ACCIÓN" CON BOTÓN "BORRAR"  <----
             const accionCell = row.insertCell();
             const borrarButton = document.createElement('button');
             borrarButton.classList.add('borrar-button'); // Agregar la clase
             borrarButton.textContent = 'Borrar';
             borrarButton.addEventListener('click', async () => {
                 if (confirm("¿Estás seguro de que deseas borrar este consumo?")) {
                     try {
                         await deleteDoc(doc.ref);
                         alert("Consumo borrado correctamente.");
                         updateConsumptionTable(cedula); // Actualizar la tabla
                         const clientTable = document.getElementById('client-table');
                         const rows = clientTable.querySelectorAll('tbody tr');
                         let deudaActualizada = 0;
                         rows.forEach(fila => {
                             const cedulaCell = fila.querySelector('td:nth-child(2)');
                             if(cedulaCell.textContent===cedula){
                               const deudaCell= fila.querySelector('td:nth-child(4)')
                               deudaActualizada =parseFloat(deudaCell.textContent.replace(/[^0-9.-]+/g,""));
                             }
                           })
                         actualizarDeudaClienteJS(cedula,deudaActualizada);
                     } catch (error) {
                         console.error("Error al borrar el consumo:", error);
                         alert("No se pudo borrar el consumo. Intenta de nuevo.");
                     }
                 }
             });
             accionCell.appendChild(borrarButton);
             // ----> FIN DEL CÓDIGO DEL BOTÓN <----
     
     
         


    });

    // Actualiza la deuda en la tabla de clientes 
    actualizarDeudaClienteJS(cedula, deudaTotal);
}

// Función para actualizar la deuda SOLO en la tabla de clientes
function actualizarDeudaClienteJS(cedula, deudaTotal) {
    const clientTable = document.getElementById('client-table');
    const rows = clientTable.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const cedulaCell = row.querySelector('td:nth-child(2)');
        if (cedulaCell && cedulaCell.textContent === cedula) {
            const deudaCell = row.querySelector('td:nth-child(4)');
            deudaCell.textContent = `$${deudaTotal.toFixed(2)} cop`;
        }
    });
}

//Modal de edición
function openEditModal(bookName) {
    const modal = document.getElementById("edit-book-modal");
    const modalContent = document.getElementById("edit-book-modal-content");
    modalContent.querySelector("#current-book-name").value = bookName;
    modal.style.display = "block";

    const closeButton = document.querySelector('.close');
    closeButton.addEventListener('click', closeEditModal);
    const cancelarEdicionButton = document.getElementById("cancelar-edicion");
    cancelarEdicionButton.addEventListener('click', closeEditModal);
}

function closeEditModal() {
    const modal = document.getElementById("edit-book-modal");
    modal.style.display = "none";
    document.getElementById("edit-book-form").reset();
}

// Manejador para actualizar el libro
const actualizarLibroButton = document.getElementById("actualizar-libro");
actualizarLibroButton?.addEventListener('click', async () => {
    const currentBookName = document.getElementById('current-book-name').value;
    const newBookName = document.getElementById('new-book-name').value;

    if (newBookName.trim() === '') {
        alert('Por favor, ingresa un nuevo nombre.');
        return;
    }

    const q = query(collection(db, "Libro"), where("nombre", "==", newBookName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        alert('Ya existe un libro con ese nombre.');
        return;
    }

    try {
        const librosRef = collection(db, 'Libro');
        const q = query(librosRef, where('nombre', '==', currentBookName));
        const querySnapshot = await getDocs(q);

        await Promise.all(querySnapshot.docs.map(async doc => {
            await updateDoc(doc.ref, { nombre: newBookName });
        }));

        alert('Nombre de libro actualizado correctamente.');
        closeEditModal();
        loadExistingBooks();
    } catch (error) {
        console.error('Error al actualizar el nombre del libro:', error);
        alert('Error al actualizar el nombre del libro. Intenta de nuevo.');
    }
});

// Eliminar libro
async function deleteBook(bookName) {
    if (confirm(`¿Estás seguro de que quieres eliminar el libro "${bookName}"?`)) {
        try {
            const librosRef = collection(db, 'Libro');
            const q = query(librosRef, where('nombre', '==', bookName));
            const querySnapshot = await getDocs(q);

            await Promise.all(querySnapshot.docs.map(async doc => {
                await deleteDoc(doc.ref);
            }));

            alert('Libro eliminado correctamente');
            loadExistingBooks();
        } catch (error) {
            console.error('Error al eliminar el libro:', error);
            alert('Error al eliminar el libro. Intenta de nuevo.');
        }
    }
}

//para guardar los consumos
document.getElementById('consumo-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = document.getElementById('segunda-tarjeta').querySelector('.card-header h3').textContent;
  const cedula = titulo.split('- Cédula: ')[1];

  const item = document.getElementById('item').value;
  const descripcion = document.getElementById('descripcion').value;
  const fecha = document.getElementById('fecha').value;
  const cantidad = document.getElementById('cantidad').value;
  const valoru = document.getElementById('valoru').value;

  try {
      await addDoc(collection(db, 'TU_COLECCION_CONSUMOS'), {
          cedula: cedula,
          item: item,
          descripcion: descripcion,
          fecha: fecha,
          cantidad: cantidad,
          valoru: valoru
      });
      alert('Consumo guardado correctamente!');
      document.getElementById('consumo-form').reset();
      updateConsumptionTable(cedula);
  } catch (error) {
      console.error('Error al guardar el consumo:', error);
      alert('Error al guardar el consumo. Intenta de nuevo.');
  }
});


async function showClientConsumption(nombre, cedula){
  document.getElementById('segunda-tarjeta').querySelector('.card-header h3').textContent = `${nombre} - Cédula: ${cedula}`;
  document.getElementById('consumo-form').reset();

  // Esperamos a que se actualice la tabla de consumos antes de buscar la deuda
  await updateConsumptionTable(cedula);

   // Buscamos la deuda del cliente en la tabla
   const clientTable = document.getElementById('client-table');
   const rows = clientTable.querySelectorAll('tbody tr');
   let deudaCliente = 0;

   rows.forEach(row => {
       const cedulaCell = row.querySelector('td:nth-child(2)');
       if (cedulaCell && cedulaCell.textContent === cedula) {
           const deudaCell = row.querySelector('td:nth-child(4)');
           deudaCliente = parseFloat(deudaCell.textContent.replace(/[^0-9.]/g, '')); // Extrae el valor numérico
       }
   });

   //actualiza el elemento de deuda en la tarjeta
   let deudaElement = document.getElementById('deuda-titulo');
   if (!deudaElement) {
       deudaElement = document.createElement('h4');
       deudaElement.id = 'deuda-titulo';
       document.getElementById('segunda-tarjeta').querySelector('.card-body').insertBefore(deudaElement, document.getElementById('consumo-form')); //insertamos antes del formulario
   }
   deudaElement.textContent = `Deuda: $${deudaCliente.toFixed(2)} cop`;

  
   
}
async function mostrarItemsInventario() {
    const itemsInventario = [];
    const inventarioRef = collection(db, 'inventario');

    try {
        const querySnapshot = await getDocs(inventarioRef);
        querySnapshot.forEach((doc) => {
            itemsInventario.push(doc.data());
        });
    } catch (error) {
        console.error("Error al obtener items del inventario:", error);
        alert("Error al cargar los items. Intenta de nuevo.");
        return;
    }

    if (itemsInventario.length === 0) {
        alert("No hay items en el inventario.");
        return;
    }

    const card = document.createElement('div');
    card.classList.add('item-card');

    const listaItems = document.createElement('ul');
    itemsInventario.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.nombreItem;
        li.addEventListener('click', () => {
            document.getElementById('item').value = item.nombreItem;
            document.getElementById('valoru').value = item.valorItem;
            if (card.parentNode) {  // Verificar antes de eliminar
                document.body.removeChild(card); 
            }
        });
        listaItems.appendChild(li);
    });

    card.appendChild(listaItems);


    // ----> Event listener para ocultar la tarjeta al escribir <----
    const inputItem = document.getElementById('item');
    inputItem.addEventListener('input', () => {
        if (card.parentNode) {
            document.body.removeChild(card);
        }
    });
    // ----> Fin del event listener <----

    document.body.appendChild(card);

    // Posicionar la tarjeta
    const inputRect = inputItem.getBoundingClientRect();
    card.style.position = 'absolute';
    card.style.left = inputRect.left + 'px';
    card.style.top = (inputRect.top + inputRect.height) + 'px';
    card.style.zIndex = 2000;
}



// Agregar evento click al input "item"
document.getElementById('item').addEventListener('click', mostrarItemsInventario);


loadExistingBooks();