"use client";
import React, { useState, useEffect } from 'react';
import './page.css';
import CountdownTimer from '@/utils/timer';
import axios from 'axios';
import CryptoJS from 'crypto-js';

function Page() {
    const [asignaturas, setAsignaturas] = useState([]);
    const [asignaturasUnicas, setAsignaturasUnicas] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [equipos, setEquipos] = useState(new Set());
    const [ppiEntregaSOL, setPpiEntregaSOL] = useState([]);
    const [entregasMap, setEntregasMap] = useState(new Map());
    const [calificaciones, setCalificaciones] = useState(new Map());
    const [equiposConNotas, setEquiposConNotas] = useState([]); // Estado para almacenar los equipos y sus notas
    const [usuarios, setUsuarios] = useState({}); // Estado para almacenar los usuarios

    useEffect(() => {
        async function fetchEntregas() {
            try {
                const promises = [...equipos].map(async equipo => {
                    const response = await fetch(`https://td-g-production.up.railway.app/entrega-equipo-ppi/GetPPIEntregaByID/${equipo}`);
                    if (response.ok) {
                        const data = await response.json();
                        return { equipo, entregas: data };
                    } else {
                        console.error(`Error al obtener la entrega para el equipo ${equipo}`);
                        return { equipo, entregas: [] };
                    }
                });

                const entregas = await Promise.all(promises);
                const entregasMap = new Map(entregas.map(({ equipo, entregas }) => [equipo, entregas]));
                setEntregasMap(entregasMap);

                const calificacionesMap = new Map();
                entregas.forEach(({ entregas }) => {
                    entregas.forEach(entrega => {
                        calificacionesMap.set(`${entrega.Codigo_Equipo}-${entrega.Tipo_Entrega_ID}`, entrega.Calificacion_Entrega || ''); // Si la calificación es null, se asigna una cadena vacía
                    });
                });
                setCalificaciones(calificacionesMap);
            } catch (error) {
                console.error('Error al obtener las entregas:', error);
            }
        }

        fetchEntregas();
    }, [equipos]);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('https://td-g-production.up.railway.app/configuracion-entrega/GetPPIEntregaCoordinador');
                if (response.ok) {
                    const data = await response.json();
                    setPpiEntregaSOL(data);
                } else {
                    console.error('Error al obtener los datos');
                }
            } catch (error) {
                console.error('Error al obtener los datos:', error);
            }
        }

        fetchData();
    }, []);


    useEffect(() => {
        async function fetchAsignaturas() {
            try {

                const usuarioNest = localStorage.getItem('U2FsdGVkX1');
                const bytes = CryptoJS.AES.decrypt(usuarioNest, 'PPIITYTPIJC');
                const NestOriginal = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
                const response = await fetch('https://td-g-production.up.railway.app/usuario-asignatura/GroupsDocente/' + NestOriginal.id);
                if (response.ok) {
                    const data = await response.json();
                    setAsignaturas(data);
                    const nombresUnicos = [...new Set(data.map(asignatura => asignatura.Asignatura_Nombre))];
                    setAsignaturasUnicas(nombresUnicos);
                } else {
                    console.error('Error al obtener las asignaturas');
                }
            } catch (error) {
                console.error('Error al obtener las asignaturas:', error);
            }
        }

        // Función para obtener los usuarios
        const fetchUsuarios = async () => {
            try {
                const response = await axios.get('https://td-g-production.up.railway.app/usuario');
                const usuariosMap = {};
                response.data.forEach(usuario => {
                    usuariosMap[usuario.id] = usuario;
                });
                setUsuarios(usuariosMap);
            } catch (error) {
                console.log('Error fetching users:', error);
            }
        };

        fetchAsignaturas();
        fetchUsuarios();
    }, []);


    useEffect(() => {
        async function buscarEquipos() {
            try {
                const response = await fetch(`https://td-g-production.up.railway.app/equipo-usuarios/GetAllGroups`);
                if (response.ok) {
                    const data = await response.json();
                    setGrupos(data);
                    setEquipos(new Set(data.map(equipo => equipo.Codigo_Equipo)));
                    const equiposAgrupados = data.reduce((acc, equipo) => {
                        if (!acc[equipo.Codigo_Equipo]) {
                            acc[equipo.Codigo_Equipo] = [];
                        }
                        acc[equipo.Codigo_Equipo].push(equipo);
                        return acc;
                    }, {});
                    const equiposConNotas = Object.entries(equiposAgrupados).map(([equipo, integrantes]) => {
                        const notas = integrantes.map(integrante => integrante.Nota);
                        return [equipo, notas];
                    });
                    setEquiposConNotas(equiposConNotas);
                } else {
                    console.error('Error al obtener los equipos');
                }
            } catch (error) {
                console.error('Error al obtener los equipos:', error);
            }
        }

        buscarEquipos();
    }, []);

    const equiposAgrupados = grupos.reduce((acc, equipo) => {
        if (!acc[equipo.Codigo_Equipo]) {
            acc[equipo.Codigo_Equipo] = [];
        }
        acc[equipo.Codigo_Equipo].push(equipo);
        return acc;
    }, {});

    return (
        <div className="ml-6 mr-6 mt-6 border bg-white border-b">
            <div className='pt-8 pb-8 w-full text-center'>
                <div className='pt-5 w-full border-b-2 flex items-center sm:items-start justify-center sm:justify-start sm:pl-8 sm:h-22 pb-5 text-center sm:text-left'>
                    <h1 className='text-4xl font-bold text-gray-600'>Calificar Entregas</h1>
                </div>
                <div className='p-5'>
                    <div>
                        {/*<p>Esta es la ventana de Calificar Entregas. Aquí podrás revisar y evaluar el trabajo que han entregado los equipos de tus grupos en todas las asignaturas que enseñas. Si ves una tabla vacía para algún grupo, significa que ninguno de los equipos ha entregado nada todavía. Recuerda calificar grupo por grupo para evitar inconsistencias.</p>
                        <p>Una vez hagas click en el botón de Guardar Notas, deberás esperar a que salga la alerta de confirmación de guardado.</p>*/}
                    </div>
                    <br />
                    {ppiEntregaSOL.length > 0 && (
                        <div className="overflow-x-auto">
                            <div className="table-wrapper overflow-x-auto table-responsive">
                                <div className="table-scroll">
                                    <table id="tabla-notas" className="min-w-full min-h-full bg-white shadow-md rounded">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th scope="col" className="px-0.5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Equipo
                                                </th>
                                                <th scope="col" className="px-0.5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Integrante
                                                </th>
                                                <th scope="col" className="px-0.5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Cédula
                                                </th>
                                                <th scope="col" className="px-0.5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Entrega
                                                </th>
                                                <th scope="col" className="px-0.5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Porcentaje
                                                </th>
                                                <th scope="col" className="px-0.5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Plazo para Calificar
                                                </th>
                                                <th scope="col" className="px-0.5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Archivos
                                                </th>
                                                <th scope="col" className="px-0.5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Calificación
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {Object.entries(equiposAgrupados).map(([codigoEquipo, integrantes]) => (
                                                <React.Fragment key={codigoEquipo}>
                                                    {integrantes.map((integrante, idx) => {
                                                        const usuario = usuarios[integrante.Usuario_ID];
                                                        return (
                                                            <tr key={idx}>
                                                                {idx === 0 && (
                                                                    <td rowSpan={integrantes.length} className="px-0.5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">{codigoEquipo}</td>
                                                                )}
                                                                <td className="px-0.5 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{integrante.Usuario_Nombre}</td>
                                                                <td className="px-0.5 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{usuario?.documento ?? ''}</td>
                                                                {ppiEntregaSOL.map(entrega => {
                                                                    const fechaPlazo = new Date(entrega.Plazo_Calificacion);
                                                                    const fechaActual = new Date(); // Fecha y hora actual
                                                                    const fechaFormateada = fechaPlazo.toLocaleString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

                                                                    // Verificar si el plazo para calificar ha pasado
                                                                    const plazoPasado = fechaActual > fechaPlazo;

                                                                    // Verificar si hay una entrega asociada al equipo actual
                                                                    const entregaEquipo = entregasMap.get(parseInt(codigoEquipo));
                                                                    const tieneEntrega = entregaEquipo && entregaEquipo.find(entregaEquipo => entregaEquipo.Tipo_Entrega_Descripcion === entrega.Tipo_Entrega_Descripcion && entregaEquipo.Entrega_Equipo_PPI_ID !== null);

                                                                    // Si hay entrega, obtener la ubicación del adjunto
                                                                    const ubicacionAdjunto = tieneEntrega ? entregaEquipo.Ubicacion_Entrega : '';

                                                                    // Si la entrega ha sido cargada, mostrarla en la tabla
                                                                    if (tieneEntrega) {
                                                                        return (
                                                                            <React.Fragment key={entrega.Tipo_Entrega_ID}>
                                                                                <td className="px-0.5 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{entrega.Tipo_Entrega_Descripcion}</td>
                                                                                <td className="px-0.5 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{entrega.Porcentaje_Entrega}%</td>
                                                                                <td className={`px-0.5 py-4 whitespace-nowrap text-sm text-gray-500 text-center ${plazoPasado ? 'text-red-500' : ''}`}>
                                                                                    {fechaFormateada}
                                                                                    {plazoPasado ? null : <CountdownTimer deadline={fechaPlazo} />}
                                                                                </td>
                                                                                <td className="px-0.5 py-4 whitespace-nowrap text-sm text-gray-500 text-center flex justify-center items-center">
                                                                                    {/* Mostrar botón con logo SVG si hay entrega */}
                                                                                    {tieneEntrega && (
                                                                                        <svg
                                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                                            viewBox="0 0 24 24"
                                                                                            width="24"
                                                                                            height="24"
                                                                                            color="#000000"
                                                                                            fill="none"
                                                                                            className="cursor-pointer"
                                                                                            onClick={async () => {
                                                                                                try {
                                                                                                    const response = await fetch(`https://td-g-production.up.railway.app/entrega-equipo-ppi/GetPPIEntregaByID/${codigoEquipo}`);
                                                                                                    if (response.ok) {
                                                                                                        const data = await response.json();
                                                                                                        const tipoEntregaActual = entrega.Tipo_Entrega_Descripcion; // CONFIGURACION Suponiendo que esta variable esté disponible en el alcance de esta función
                                                                                                        const entregaEquipo = data.find(entrega => entrega.Tipo_Entrega_Descripcion === tipoEntregaActual);

                                                                                                        if (entregaEquipo && (entregaEquipo.Ubicacion_Entrega !== null && entregaEquipo.Ubicacion_Entrega !== '')) {
                                                                                                            window.open(entregaEquipo.Ubicacion_Entrega, '_blank');
                                                                                                        } else {
                                                                                                            alert("Esta entrega no tiene un archivo adjunto.");
                                                                                                        }
                                                                                                    } else {
                                                                                                        console.error('Error al obtener las entregas para el equipo', codigoEquipo);
                                                                                                    }
                                                                                                } catch (error) {
                                                                                                    console.error('Error al obtener las entregas para el equipo', codigoEquipo, error);
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <path d="M17.4776 9.01106C17.485 9.01102 17.4925 9.01101 17.5 9.01101C19.9853 9.01101 22 11.0294 22 13.5193C22 15.8398 20.25 17.7508 18 18M17.4776 9.01106C17.4924 8.84606 17.5 8.67896 17.5 8.51009C17.5 5.46695 15.0376 3 12 3C9.12324 3 6.76233 5.21267 6.52042 8.03192M17.4776 9.01106C17.3753 10.1476 16.9286 11.1846 16.2428 12.0165M6.52042 8.03192C3.98398 8.27373 2 10.4139 2 13.0183C2 15.4417 3.71776 17.4632 6 17.9273M6.52042 8.03192C6.67826 8.01687 6.83823 8.00917 7 8.00917C8.12582 8.00917 9.16474 8.38194 10.0005 9.01101" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                                            <path d="M12 21L12 13M12 21C11.2998 21 9.99153 19.0057 9.5 18.5M12 21C12.7002 21 14.0085 19.0057 14.5 18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                                        </svg>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-0.5 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                                                    <input
                                                                                        type="text"
                                                                                        className={`border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:border-indigo-500 ${plazoPasado ? 'cursor-not-allowed' : ''}`}
                                                                                        size="4"
                                                                                        pattern="[0-5](,[0-9])?$"
                                                                                        title="Debe ser un número entre 0 y 5, opcionalmente seguido de un decimal separado por coma."
                                                                                        onKeyPress={(event) => {
                                                                                            // Evita que se ingresen caracteres que no sean números, comas o el punto de decimal
                                                                                            const allowedCharacters = /[0-9,]/;
                                                                                            const key = event.key;
                                                                                            if (!allowedCharacters.test(key)) {
                                                                                                event.preventDefault();
                                                                                            }
                                                                                        }}
                                                                                        // Desactivar la casilla si el plazo ha pasado
                                                                                        disabled={plazoPasado}
                                                                                        // Establecer el valor predeterminado de la casilla
                                                                                        value={calificaciones.has(`${codigoEquipo}-${entrega.Tipo_Entrega_ID}`) ? calificaciones.get(`${codigoEquipo}-${entrega.Tipo_Entrega_ID}`).replace('.', ',') : ''}
                                                                                        onChange={(event) => {
                                                                                            // Actualizar la calificación en el estado mientras se edita
                                                                                            const newValue = event.target.value.replace(',', '.');
                                                                                            setCalificaciones(prevCalificaciones => {
                                                                                                const newCalificaciones = new Map(prevCalificaciones);
                                                                                                newCalificaciones.set(`${codigoEquipo}-${entrega.Tipo_Entrega_ID}`, newValue);
                                                                                                return newCalificaciones;
                                                                                            });
                                                                                        }}
                                                                                    />
                                                                                </td>

                                                                                {/* <td className="px-0.5 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max="5"
                                                                                        step="0.1"
                                                                                        className="w-16 text-center"
                                                                                        value={calificaciones.get(`${codigoEquipo}-${entrega.Tipo_Entrega_ID}`)}
                                                                                        onChange={e => {
                                                                                            const newCalificaciones = new Map(calificaciones);
                                                                                            newCalificaciones.set(`${codigoEquipo}-${entrega.Tipo_Entrega_ID}`, e.target.value);
                                                                                            setCalificaciones(newCalificaciones);
                                                                                        }}
                                                                                    />
                                                                                </td> */}
                                                                            </React.Fragment>
                                                                        );
                                                                    }
                                                                }
                                                                )}
                                                            </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <br />
                            {equipos.size !== 0 && (
                                <div>
                                    <button
                                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                        onClick={() => {
                                            const dataToSend = [];

                                            let valid = true; // Variable para controlar si las calificaciones son válidas

                                            [...equipos].forEach(equipo => {
                                                ppiEntregaSOL.forEach(entrega => {
                                                    const entregaEquipo = entregasMap.get(equipo);
                                                    if (entregaEquipo) {
                                                        const entregaEnEquipo = entregaEquipo.find(entregaEquipo => entregaEquipo.Tipo_Entrega_Descripcion === entrega.Tipo_Entrega_Descripcion && entregaEquipo.Entrega_Equipo_PPI_ID !== null);
                                                        if (entregaEnEquipo) {
                                                            const calificacion = calificaciones.get(`${equipo}-${entrega.Tipo_Entrega_ID}`);

                                                            // Validación de la calificación
                                                            if (calificacion !== '') {
                                                                const parsedCalificacion = parseFloat(calificacion);
                                                                if (parsedCalificacion >= 0 && parsedCalificacion <= 5) {
                                                                    dataToSend.push({
                                                                        Entrega_Equipo_PPI_ID: entregaEnEquipo.Entrega_Equipo_PPI_ID,
                                                                        Calificacion: parsedCalificacion
                                                                    });
                                                                } else {
                                                                    // Si la calificación está fuera del rango, marcamos como inválido y mostramos un mensaje
                                                                    valid = false;
                                                                    alert('Por favor, asegúrate de que todas las calificaciones estén entre 0 y 5.');
                                                                }
                                                            }
                                                        }
                                                    }
                                                });
                                            });

                                            if (valid) {
                                                // Si todas las calificaciones son válidas, realizamos la solicitud fetch
                                                fetch('https://td-g-production.up.railway.app/entrega-equipo-ppi/updateScores', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json'
                                                    },
                                                    body: JSON.stringify(dataToSend)
                                                })
                                                    .then(response => {
                                                        if (response.ok) {
                                                            alert('Calificaciones actualizadas correctamente.');
                                                            window.location.reload();
                                                        } else {
                                                            console.error('Error al enviar los datos al backend:', response.statusText);
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error('Error al enviar los datos al backend:', error);
                                                    });
                                            }
                                        }}
                                    >
                                        Guardar Notas
                                    </button>

                                </div>
                            )}
                        </div>
                    )}
                    {/* Mostrar mensaje si no hay entregas para mostrar */}
                    {equipos.size === 0 && (
                        <p className="text-center mt-4 text-gray-500">No hay equipos disponibles para mostrar.</p>
                    )}

                </div>
            </div>
        </div>
    );
}

export default Page;
