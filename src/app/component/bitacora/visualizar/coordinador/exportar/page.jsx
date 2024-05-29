/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from "next/navigation";

function page() {

    const [showAlertDelete, setShowAlertDelete] = useState(false);
    const [showCorrecto, setShowCorrecto] = useState(false);
    const router = useRouter();
    const [downloading, setDownloading] = useState(false);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    let semester;
    if (currentMonth >= 1 && currentMonth <= 6) {
        semester = 1;
    } else {
        semester = 2;
    }



    const fetchDataAndExportExcel = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('https://td-g-production.up.railway.app/entrega-equipo-ppi/equipos-mora');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            setData(result);
            exportToExcel(result);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchDataAndExportAnotherExcel = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('https://td-g-production.up.railway.app/entrega-equipo-ppi/docentes-mora');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            setData(result);
            exportToAnotherExcel(result);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchDataAndExportNewExcel = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('https://td-g-production.up.railway.app/entrega-equipo-ppi/asesorias-mora');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            setData(result);
            exportToNewExcel(result);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = (data) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        const currentDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
        const [date, time] = currentDate.split(', ');
        const formattedDate = date.replace(/-/g, '/');
        const formattedTime = time.replace(/:/g, '-').replace(' ', ' ');
        const filename = `Equipos con Mora | ${formattedDate} ${formattedTime}.xlsx`;

        XLSX.writeFile(workbook, filename);
    };

    const exportToAnotherExcel = (data) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        const currentDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
        const [date, time] = currentDate.split(', ');
        const formattedDate = date.replace(/-/g, '/');
        const formattedTime = time.replace(/:/g, '-').replace(' ', ' ');
        const filename = `Docentes con Mora | ${formattedDate} ${formattedTime}.xlsx`;

        XLSX.writeFile(workbook, filename);
    };

    const exportToNewExcel = (data) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        const currentDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
        const [date, time] = currentDate.split(', ');
        const formattedDate = date.replace(/-/g, '/');
        const formattedTime = time.replace(/:/g, '-').replace(' ', ' ');
        const filename = `Estudiantes sin Asesoría | ${formattedDate} ${formattedTime}.xlsx`;

        XLSX.writeFile(workbook, filename);
    };

    const fileName = `Backup PPI ${currentYear} - ${semester}.zip`;

    const Limpiar = async () => {
        showAlertDelete(false)
        fetchDataAndExportNewExcel()
        fetchDataAndExportAnotherExcel()
        fetchDataAndExportExcel()
        const response = await fetch('https://td-g-production.up.railway.app/equipo-ppi/exportar/-1');
        const filePath = await response.text()
        const baseUrl = 'https://td-g-production.up.railway.app';
        const fileUrl = new URL(filePath.replace('/public', ''), baseUrl).href;
        const newWindow = window.open(fileUrl, '_blank');
        if (newWindow) {
            setTimeout(() => {
                newWindow.close();
            }, 2000);
            const response = await fetch('https://td-g-production.up.railway.app/hora-semanal/exportar/');
            const filePath = await response.text()
            const baseUrl = 'https://td-g-production.up.railway.app';
            const fileUrl = new URL(filePath.replace('/public', ''), baseUrl).href;
            const newWindow = window.open(fileUrl, '_blank');
            if (newWindow) {
                setTimeout(() => {
                    newWindow.close();
                }, 2000);
                try {
                    setDownloading(true);
                    const response = await axios.get(
                        "https://td-g-production.up.railway.app/backup/download-and-clean-bucket",
                        {
                            responseType: "blob",
                        }
                    );

                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", fileName);
                    document.body.appendChild(link);
                    link.click();
                    link.parentNode.removeChild(link);
                    setDownloading(false);
                } catch (error) {
                    console.error("Error:", error);
                    setDownloading(false);
                }
            }

        }
    }


    useEffect(() => {
        if (showCorrecto) {
            const timer = setTimeout(() => {
                setShowCorrecto(false);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [showCorrecto]);
    return (
        <div className="ml-6 mr-6 mt-6 border   bg-white border-b flex justify-between">
            <div className='pt-8  pb-8 w-full'>
                <div className='  h-22 pb-2 flex-col  border-b-2 flex justify-between items-center'>
                    <div>
                        <h1 className='ml-5 text-4xl font-bold text-gray-600'>Limpiar sistema</h1>
                    </div>
                </div>
                <div className='p-10'>
                    <div className='text-xl text-gray-500'>
                        <span>Para poder eliminar información del sistema, se debe tener en cuenta que, cuando se realice esta acción, se eliminará la siguiente información:</span>
                        <ul class="list-disc ml-10">
                            <li class="py-2">Citas de asesorías</li>
                            <li class="py-2">Bitácoras</li>
                            <li class="py-2">Semanas</li>
                            <li class="py-2">Notificaciones</li>
                        </ul>
                        <button onClick={() => { setShowAlertDelete(true); }} className="mt-6 text-white py-2 px-4 w-full rounded bg-red-400 hover:bg-red-500 shadow hover:shadow-lg font-medium transition transform hover:-translate-y-0.5 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-white">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            Limpar sistema
                        </button>
                    </div>
                </div>
            </div>
            {showAlertDelete && (<>
                <div className="fixed inset-0 z-10 bg-grey bg-opacity-10 backdrop-blur-sm flex justify-center items-center">
                    <div class="flex flex-col justify-center content-center items-center rounded-lg bg-white p-4 shadow-2xl min-w-[50vw] max-w-[50vw] border border-solid border-gray-300">
                        <h2 class="text-lg font-bold">¿Deseas limpiar el sistema?</h2>
                        <p class="mt-2 text-sm text-gray-800">
                            Está seguro de que desea limpiar el sistema, al limpiar el sistema se exportaran la información.
                        </p>

                        <div class="mt-4 flex flex-row flex-wrap min-w-full items-center content-center justify-center gap-2">
                            <button type="button" class="min-w-[25%] rounded-lg bg-green-400 px-4 py-2 text-sm font-medium text-white hover:bg-green-500" onClick={() => Limpiar()}>
                                Confirmar
                            </button>
                            <button type="button" class="min-w-[25%] rounded-lg bg-red-400 px-4 py-2 text-sm font-medium text-white hover:bg-red-500" onClick={() => setShowAlertDelete(false)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </>
            )}
            {
                showCorrecto && (
                    <div className="fixed bottom-0 right-0 mb-8 mr-8">
                        <div className="flex w-96 shadow-lg rounded-lg">
                            <div class="bg-green-600 py-4 px-6 rounded-l-lg flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="text-white fill-current" viewBox="0 0 16 16" width="20" height="20"><path fill-rule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path></svg>
                            </div>
                            <div className="px-4 py-6 bg-white rounded-r-lg flex justify-between items-center w-full border border-l-transparent border-gray-200">
                                <div>El sistema se limpió correctamente.</div>
                                <button onClick={() => { setShowCorrecto(!showCorrecto) }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="fill-current text-gray-700" viewBox="0 0 16 16" width="20" height="20">
                                        <path fillRule="evenodd" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}

export default page
