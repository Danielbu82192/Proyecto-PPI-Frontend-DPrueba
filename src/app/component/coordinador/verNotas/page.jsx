"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { FiArrowLeft } from "react-icons/fi";

const ReactHTMLTableToExcel = dynamic(() => import('react-html-table-to-excel'), { ssr: false });

function Page() {
    const [equiposConNotas, setEquiposConNotas] = useState({}); // Estado para almacenar los equipos y sus notas
    const [selectedEquipo, setSelectedEquipo] = useState(null); // Estado para el equipo seleccionado
    const [usuarios, setUsuarios] = useState({}); // Estado para almacenar los usuarios
    const [entregas, setEntregas] = useState([]); // Estado para almacenar los tipos de entrega

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const semester = currentMonth >= 1 && currentMonth <= 6 ? 1 : 2;
    const fileName = `Notas PPI ${currentYear} - ${semester}`;

    useEffect(() => {
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
                console.error('Error fetching users:', error);
            }
        };

        // Función para obtener los equipos y sus notas
        const fetchEquipos = async () => {
            try {
                const response = await axios.get('https://td-g-production.up.railway.app/equipo-usuarios/GetAllGroups');
                const equiposAgrupados = response.data.reduce((acc, equipo) => {
                    if (!acc[equipo.Codigo_Equipo]) {
                        acc[equipo.Codigo_Equipo] = [];
                    }
                    acc[equipo.Codigo_Equipo].push(equipo);
                    return acc;
                }, {});
                setEquiposConNotas(equiposAgrupados);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        // Función para obtener los tipos de entrega
        const fetchEntregas = async () => {
            try {
                const response = await axios.get('https://td-g-production.up.railway.app/tipo-entrega/GetAllEntregas');
                setEntregas(response.data);
            } catch (error) {
                console.error('Error fetching entregas:', error);
            }
        };

        fetchUsuarios(); // Llamar la función para obtener usuarios
        fetchEquipos(); // Llamar la función para obtener equipos
        fetchEntregas(); // Llamar la función para obtener tipos de entrega
    }, []);

    // Función para manejar el click en un equipo
    const handleEquipoClick = (codigoEquipo) => {
        const equipoSeleccionado = equiposConNotas[codigoEquipo];
        setSelectedEquipo(equipoSeleccionado);
    };

    // Función para hacer capitalize a una cadena
    const capitalize = (str) => {
        const str2 = str.toLowerCase();
        return str2.replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Función para obtener las calificaciones de un usuario específico
    const fetchCalificaciones = async (idUsuario) => {
        try {
            const response = await axios.get(`https://backend.dbcpolijic2024.online/usuario-calificacion/${idUsuario}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching calificaciones for user ${idUsuario}:`, error);
            return [];
        }
    };

    // Obtener las calificaciones de cada usuario después de obtener los usuarios
    useEffect(() => {
        const asignarCalificaciones = async () => {
            const calificacionesUsuarios = {};
            await Promise.all(
                Object.keys(usuarios).map(async (idUsuario) => {
                    const calificaciones = await fetchCalificaciones(idUsuario);
                    calificacionesUsuarios[idUsuario] = calificaciones;
                })
            );
            // Actualizar la tabla con las calificaciones
            setEquiposConNotas((prevState) => {
                return Object.keys(prevState).reduce((acc, codigoEquipo) => {
                    acc[codigoEquipo] = prevState[codigoEquipo].map((integrante) => {
                        // Obtener las calificaciones del usuario
                        const calificacionesUsuario = calificacionesUsuarios[integrante.Usuario_ID] || [];
                        // Mapear sobre las calificaciones y asignarlas a la tabla
                        calificacionesUsuario.forEach((calificacion) => {
                            const entregaID = calificacion.entrega;
                            integrante[entregaID] = calificacion.calificacion;
                        });
                        return integrante;
                    });
                    return acc;
                }, {});
            });
        };

        if (Object.keys(usuarios).length > 0) {
            asignarCalificaciones();
        }
    }, [usuarios]);

    return (
        <div className="ml-2 mr-6 mt-6 border bg-white border-b">
            <div className='pt-8 pb-8 w-full text-center'> 
                <div className='pt-5 w-full border-b-2 flex items-center sm:items-start justify-center sm:justify-start sm:pl-8 sm:h-22 pb-5 text-center sm:text-left'>
                    <h1 className='text-4xl font-bold text-gray-600'>Tabla de Notas</h1>
                </div>
                <br />
                <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                    <ReactHTMLTableToExcel
                        id="test-table-xls-button"
                        className="download-table-xls-button"
                        table="tabla-notas"
                        filename={fileName}
                        sheet={fileName}
                        buttonText="Exportar a Excel"
                    />
                </button>
                <div className='p-4'>
                    <div className="table-wrapper overflow-x-auto table-responsive">
                        <div className="table-scroll">
                            <table id="tabla-notas" className="min-w-full min-h-full bg-white shadow-md rounded">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border border-gray-300 text-sm px-2 py-1">Equipo</th>
                                        <th className="border border-gray-300 text-sm px-2 py-1">Cédula</th>
                                        {entregas.map((entrega) => (
                                            <th key={entrega.id} className="border text-sm border-gray-300 px-2 py-1">
                                                {entrega.nombre} ({entrega.Porcentaje_Entrega}%)
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(equiposConNotas).map(([codigoEquipo, integrantes]) => (
                                        <React.Fragment key={codigoEquipo}>
                                            {integrantes.map((integrante, idx) => {
                                                const usuario = usuarios[integrante.Usuario_ID];
                                                return (
                                                    <tr key={idx}>
                                                        {idx === 0 && (
                                                            <td
                                                                className="border border-gray-300 text-sm px-4 py-2 font-bold cursor-pointer"
                                                                rowSpan={integrantes.length}
                                                                onClick={() => handleEquipoClick(codigoEquipo)}
                                                            >
                                                                {codigoEquipo}
                                                            </td>
                                                        )}
                                                        <td className="border border-gray-300 text-sm px-4 py-2">{usuario?.documento}</td>
                                                        {entregas.map((entrega) => (
                                                            <td key={entrega.id} className="border border-gray-300 text-sm px-4 py-2">
                                                                {entrega.id === 8 ? integrante.Nota_Asesoria_Definitiva_Individual : integrante[entrega.id]}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}

                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {selectedEquipo && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                        <div className="bg-white p-6 rounded-md w-full max-w-3xl">
                            <h2 className="text-xl font-bold mb-4">Detalles del Equipo</h2>
                            <table className="min-w-full bg-white">
                                <thead>
                                    <tr>
                                        <th className="border px-4 py-2">Cédula</th>
                                        <th className="border px-4 py-2">Nombre</th>
                                        <th className="border px-4 py-2">Correo</th>
                                        <th className="border px-4 py-2">Grupo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedEquipo.map((integrante, idx) => (
                                        <tr key={idx}>
                                            <td className="border px-4 py-2">{usuarios[integrante.Usuario_ID]?.documento}</td>
                                            <td className="border px-4 py-2">{capitalize(usuarios[integrante.Usuario_ID]?.nombre)}</td>
                                            <td className="border px-4 py-2">{usuarios[integrante.Usuario_ID]?.correo}</td>
                                            <td className="border px-4 py-2">{integrante.Grupo_Codigo}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button
                                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => setSelectedEquipo(null)}
                            >
                                <FiArrowLeft className="inline-block mr-2" />
                                Volver
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Page;
