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
    const [equiposConNotas, setEquiposConNotas] = useState([]); // Estado para almacenar los equipos y sus notas
    const [usuarios, setUsuarios] = useState({}); // Estado para almacenar los usuarios

    // /usuario-calificacion/{user}
    /* Response:
        [
            {
                "id": 3,
                "user": 61566,
                "entrega": 3,
                "calificacion": "4.5"
            },
            {
                "id": 2,
                "user": 61566,
                "entrega": 4,
                "calificacion": "2.3"
            },
            {
                "id": 1,
                "user": 61566,
                "entrega": 1,
                "calificacion": "3.9"
            }
        ]
    */
    const getCalificacionesUsuario = (user) => {
        axios.get(`https://td-g-production.up.railway.app/usuario-calificacion/${user}`)
            .then(response => {
                console.log(response.data);
            })
            .catch(error => {
                console.error('Error fetching user ratings:', error);
            });
    };

    /* getCalificacionesUsuario(61566);
    console.log('prueba') */

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
            } catch (error) {
                console.error('Error al obtener las entregas:', error);
            }
        }

        fetchEntregas();
    }, [equipos]);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('https://td-g-production.up.railway.app/configuracion-entrega/GetPPIEntregaAsesor');
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

                    // Obtener las notas de los integrates de cada equipo
                    const promises = Object.entries(equiposAgrupados).map(async ([codigoEquipo, integrantes]) => {
                        const notas = await Promise.all(integrantes.map(async integrante => {
                            const response = await fetch(`https://td-g-production.up.railway.app/usuario-calificacion/${integrante.Usuario_ID}`);
                            if (response.ok) {
                                const data = await response.json();
                                return { integrante, notas: data };
                            } else {
                                console.error('Error al obtener las notas del usuario', integrante.Usuario_ID);
                                return { integrante, notas: [] };
                            }
                        }));
                        return { codigoEquipo, integrantes: notas };
                    });

                    const equiposConNotas = await Promise.all(promises);
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

    // Agregar las notas del usuario a cada usuario del equipo
    const equiposAgrupados = grupos.reduce((acc, equipo) => {
        if (!acc[equipo.Codigo_Equipo]) {
            acc[equipo.Codigo_Equipo] = [];
        }
        acc[equipo.Codigo_Equipo].push(equipo);
        return acc;
    }, {});



    // equipos Con Notas Agrupodos
    const equiposAgrupadosConNotas = equiposConNotas?.reduce((acc, equipo) => {
        if (!acc[equipo.codigoEquipo]) {
            acc[equipo.codigoEquipo] = [];
        }
        acc[equipo.codigoEquipo].push(
            ...equipo.integrantes.map(integrante => {
                const usuario = usuarios[integrante.integrante.Usuario_ID];
                return {
                    ...integrante.integrante,
                    notas: integrante.notas
                };
            }
            ));
        return acc;
    }, {});

    return (
        <div className="ml-6 mr-6 mt-6 border bg-white border-b">
            <div className='pt-8 pb-8 w-full text-center'>
                <div className='md:h-22 lg:h-22 xl:h-22 sm:h-22 border-b-2 pl-8 pb-5 pr-52 flex justify-between items-center'>
                    <div>
                        <h1 className='text-4xl font-bold text-gray-600'>Calificar Entregas</h1>
                    </div>
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
                                    <table id="tabla" className="min-w-full min-h-full bg-white shadow-md rounded">
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
                                                <th scope="col" className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Entrega
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">

                                            {Object.entries(equiposAgrupadosConNotas).map(([codigoEquipo, integrantes]) => (
                                                <React.Fragment key={codigoEquipo}>
                                                    {console.log("integrantes:", integrantes)}
                                                    {integrantes.map((integrante, idx) => {
                                                        const usuario = usuarios[integrante.Usuario_ID];
                                                        const entregaEquipo = entregasMap.get(parseInt(codigoEquipo));
                                                        return (
                                                            <tr key={idx} className="hover:bg-gray-50">
                                                                {idx === 0 && (
                                                                    <td rowSpan={integrantes.length} className="px-0.5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center border-r border-gray-200">{codigoEquipo}</td>
                                                                )}
                                                                <td className="px-0.5 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{integrante.Usuario_Nombre}</td>
                                                                <td className="px-0.5 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{usuario?.documento ?? ''}</td>
                                                                <td className="whitespace-nowrap text-sm text-gray-500 text-center">
                                                                    {entregaEquipo?.length > 0 ? (
                                                                        <table id="tabla-notas" className="min-w-full min-h-full bg-white rounded">
                                                                            <thead>
                                                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                                                    <th scope="col" className="px-0.5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                                        Nombre
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
                                                                                {ppiEntregaSOL.map(entrega => {
                                                                                    const fechaPlazo = new Date(entrega.Plazo_Calificacion);
                                                                                    const fechaActual = new Date(); // Fecha y hora actual
                                                                                    const fechaFormateada = fechaPlazo.toLocaleString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

                                                                                    // Verificar si el plazo para calificar ha pasado
                                                                                    const plazoPasado = fechaActual > fechaPlazo;

                                                                                    // Verificar si hay una entrega asociada al equipo actual
                                                                                    const tieneEntrega = entregaEquipo && entregaEquipo.find(entregaEquipo => entregaEquipo.Tipo_Entrega_Descripcion === entrega.Tipo_Entrega_Descripcion && entregaEquipo.Entrega_Equipo_PPI_ID !== null);

                                                                                    // Si hay entrega, obtener la ubicación del adjunto
                                                                                    const ubicacionAdjunto = tieneEntrega ? entregaEquipo.Ubicacion_Entrega : '';

                                                                                    // Si la entrega ha sido cargada, mostrarla en la tabla
                                                                                    if (tieneEntrega) {
                                                                                        return (
                                                                                            <tr key={entrega.Tipo_Entrega_ID} className="px-0.5 py-1 whitespace-nowrap text-sm text-gray-500 text-center hover:bg-gray-50">
                                                                                                <td className="px-0.5 py-1 whitespace-nowrap text-sm text-gray-500 text-center">{entrega.Tipo_Entrega_Descripcion}</td>
                                                                                                <td className="px-0.5 py-1 whitespace-nowrap text-sm text-gray-500 text-center">{entrega.Porcentaje_Entrega}%</td>
                                                                                                <td className={`px-0.5 py-1 whitespace-nowrap text-sm text-gray-500 text-center ${plazoPasado ? 'text-red-500' : ''}`}>
                                                                                                    {fechaFormateada}
                                                                                                    {plazoPasado ? null : <CountdownTimer deadline={fechaPlazo} />}
                                                                                                </td>
                                                                                                <td className="px-0.5 py-1 whitespace-nowrap text-sm text-gray-500 text-center flex justify-center items-center">
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
                                                                                                <td className="px-0.5 py-1 whitespace-nowrap text-sm text-gray-500 text-center">
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
                                                                                                        defaultValue={integrante.notas.find(nota => nota.entrega === entrega.Tipo_Entrega_ID)?.calificacion ?? ''}
                                                                                                        onChange={(event) => {
                                                                                                            // Actualizar las notas del integrante actual con la nueva calificación
                                                                                                            {/*const newNotas = integrante.notas.map(nota => {
                                                                                                                if (nota.entrega === entrega.Tipo_Entrega_ID) {
                                                                                                                    return { ...nota, calificacion: event.target.value };
                                                                                                                } else {
                                                                                                                    const notaToAdd = {
                                                                                                                        user: integrante.Usuario_ID,
                                                                                                                        entrega: entrega.Tipo_Entrega_ID,
                                                                                                                        calificacion: event.target.value
                                                                                                                    };

                                                                                                                    return {
                                                                                                                        ...nota,
                                                                                                                        ...notaToAdd
                                                                                                                    }
                                                                                                                }
                                                                                                            });*/}

                                                                                                            // Suponiendo que 'event.target.value' contiene la nueva calificación ingresada por el usuario

                                                                                                            const newNotas = integrante.notas.map(nota => {
                                                                                                                // Verificar si la nota actual es para la entrega específica
                                                                                                                if (nota.entrega === entrega.Tipo_Entrega_ID) {
                                                                                                                    // Actualizar la calificación existente
                                                                                                                    return { ...nota, calificacion: event.target.value };
                                                                                                                } else {
                                                                                                                    // Si la entrega no coincide, devolver la nota sin cambios
                                                                                                                    return nota;
                                                                                                                }
                                                                                                            });

                                                                                                            // Verificar si la nota para la entrega específica ya existe
                                                                                                            const notaExistente = integrante.notas.find(nota => nota.entrega === entrega.Tipo_Entrega_ID);

                                                                                                            if (!notaExistente) {
                                                                                                                // Si no existe una nota para la entrega específica, agregar una nueva nota
                                                                                                                const nuevaNota = {
                                                                                                                    user: integrante.Usuario_ID,
                                                                                                                    entrega: entrega.Tipo_Entrega_ID,
                                                                                                                    calificacion: event.target.value
                                                                                                                };
                                                                                                                newNotas.push(nuevaNota);
                                                                                                            }

                                                                                                            console.log("newNotas2: ", newNotas);

                                                                                                            setEquiposConNotas(prevEquiposConNotas => {
                                                                                                                return prevEquiposConNotas.map(equipo => {
                                                                                                                    if (equipo.codigoEquipo === codigoEquipo) {
                                                                                                                        return {
                                                                                                                            ...equipo,
                                                                                                                            integrantes: equipo.integrantes.map(integrante => {
                                                                                                                                if (integrante.integrante.Usuario_ID === usuario.id) {
                                                                                                                                    return { ...integrante, notas: newNotas };
                                                                                                                                } else {
                                                                                                                                    return integrante;
                                                                                                                                }
                                                                                                                            })
                                                                                                                        };
                                                                                                                    } else {
                                                                                                                        return equipo;
                                                                                                                    }
                                                                                                                });
                                                                                                            });
                                                                                                        }}
                                                                                                    />
                                                                                                </td>
                                                                                            </tr>
                                                                                        );
                                                                                    }
                                                                                }
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    ) : (
                                                                        <p className="text-center text-gray-500">No hay entregas disponibles para mostrar.</p>
                                                                    )
                                                                    }
                                                                </td>
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
                                            const dataToSend2 = [];

                                            let valid = true; // Variable para controlar si las calificaciones son válidas


                                            console.log(equipos);

                                            [...equipos].forEach(equipo => {

                                                console.log(ppiEntregaSOL);

                                                ppiEntregaSOL.forEach(entrega => {

                                                    console.log(entregasMap);

                                                    const entregaEquipo = entregasMap.get(parseInt(equipo));

                                                    console.log("Parse:", entregasMap.get(parseInt(equipo)));

                                                    if (entrega.Tipo_Entrega_ID === 2 && equipo.Codigo_Equipo === "100") {
                                                        console.log('entrega', entrega)
                                                        console.log('equipo', equipo)
                                                        console.log('entregaEquipo', entregaEquipo)
                                                    }
                                                    if (entregaEquipo) {
                                                        const entregaEnEquipo = entregaEquipo.find(entregaEquipo => entregaEquipo.Tipo_Entrega_Descripcion === entrega.Tipo_Entrega_Descripcion && entregaEquipo.Entrega_Equipo_PPI_ID !== null);
                                                        if (entregaEnEquipo) {
                                                            // Obtener la calificación del integrante actual
                                                            {
                                                                equiposAgrupadosConNotas[equipo].map(integrante => {
                                                                    console.log('equiposAgrupadosConNotas', equiposAgrupadosConNotas)
                                                                    console.log('equiposConNotas', equiposConNotas)
                                                                    const calificacion = integrante.notas.find(nota => nota.entrega === entrega.Tipo_Entrega_ID)?.calificacion;

                                                                    // Verificar si la calificación es válida
                                                                    if (calificacion !== '' && calificacion !== undefined) {
                                                                        // Normalizar la calificación para que sea un número decimal
                                                                        const calificacionNormalized = calificacion?.replace(',', '.');
                                                                        const parsedCalificacion = parseFloat(calificacionNormalized);
                                                                        if (parsedCalificacion >= 0 && parsedCalificacion <= 5) {
                                                                            dataToSend.push({
                                                                                user: integrante.Usuario_ID,
                                                                                entrega: entrega.Tipo_Entrega_ID,
                                                                                calificacion: parsedCalificacion
                                                                            });
                                                                            console.log('dataToSend', dataToSend)
                                                                        } else {
                                                                            // Si la calificación está fuera del rango, marcamos como inválido y mostramos un mensaje
                                                                            valid = false;
                                                                            alert(`La calificación de ${integrante.Usuario_Nombre} para la entrega ${entrega.Tipo_Entrega_Descripcion} no es válida. Por favor, ingrese un número entre 0 y 5.`);
                                                                        }
                                                                    }
                                                                })
                                                            }
                                                            /* {equiposConNotas.integrantes.map(integrante => {
                                                                 const calificacion = integrante.notas.find(nota => nota.entrega === entrega.Tipo_Entrega_ID)?.calificacion;
                                                                 
                                                                 // Verificar si la calificación es válida
                                                                 if (calificacion !== '' && calificacion !== undefined) {
                                                                     // Normalizar la calificación para que sea un número decimal
                                                                     const calificacionNormalized = calificacion?.replace(',', '.');
                                                                     const parsedCalificacion = parseFloat(calificacionNormalized);
                                                                     if (parsedCalificacion >= 0 && parsedCalificacion <= 5) {
                                                                         dataToSend2.push({
                                                                             user: integrante.integrante.Usuario_ID,
                                                                             entrega: entrega.Tipo_Entrega_ID,
                                                                             calificacion: parsedCalificacion
                                                                         });
                                                                     } else {
                                                                         // Si la calificación está fuera del rango, marcamos como inválido y mostramos un mensaje
                                                                         valid = false;
                                                                         alert(`La calificación de ${integrante.integrante.Usuario_Nombre} para la entrega ${entrega.Tipo_Entrega_Descripcion} no es válida. Por favor, ingrese un número entre 0 y 5.`);
                                                                     }
                                                                 }
                                                             }
                                                             )}*/
                                                        }
                                                    }
                                                });
                                            });

                                            console.log('dataToSend', dataToSend);
                                            console.log('dataToSend2', dataToSend2);

                                            if (valid) {
                                                // Si todas las calificaciones son válidas, realizamos la solicitud fetch
                                                fetch('https://td-g-production.up.railway.app/usuario-calificacion/actualizar-calificaciones', {
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
