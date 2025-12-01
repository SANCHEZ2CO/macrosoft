import React, { useState, useMemo, useEffect } from 'react';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import stringSimilarity from 'string-similarity';
import { menuData } from './data/menuData';
import { ShoppingCart, ChefHat, Search, ArrowLeft, Trash2, Mic, MicOff, CheckCircle, Package, Loader2, AlertTriangle, X, FileText, List } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// URL del Logo (Cámbiala aquí una sola vez)
const BRAND_LOGO = "/logo.png";

// --- COMPONENTE MODAL DE CONFIRMACIÓN ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="bg-red-50 p-3 rounded-full mb-4">
                        <AlertTriangle className="text-red-500" size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {title}
                    </h3>

                    <p className="text-gray-500 mb-6 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all transform active:scale-95"
                        >
                            Sí, confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE MODAL DE CARRITO (HU-006) ---
const CartModal = ({ isOpen, onClose, cart, menuData, onAdd, onRemove, onClear, onConfirm }) => {
    if (!isOpen) return null;

    const cartItems = Object.entries(cart).map(([id, qty]) => {
        const product = menuData.find(p => p.id === id);
        return product ? { ...product, qty } : null;
    }).filter(Boolean);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 duration-300">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart className="text-blue-600" size={20} />
                        Revisar Pedido
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cartItems.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <Package size={48} className="mx-auto mb-3 opacity-50" />
                            <p>El carrito está vacío</p>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className="font-bold text-gray-800 truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">ID: {item.id}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => onRemove(item.id)} className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-lg transition-colors font-bold">-</button>
                                    <span className="w-6 text-center font-bold text-lg">{item.qty}</span>
                                    <button onClick={() => onAdd(item.id)} className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors font-bold">+</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl space-y-3">
                    {cartItems.length > 0 && (
                        <button
                            onClick={onClear}
                            className="w-full py-2 text-red-500 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={16} /> Vaciar Todo
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                    >
                        <ChefHat size={20} />
                        CONFIRMAR Y COCINAR
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const [cart, setCart] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [view, setView] = useState('dashboard');
    const [lastAdded, setLastAdded] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false); // HU-006

    // Estado para el Modal de Confirmación
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { }
    });

    // Helper para abrir el modal
    const requestConfirmation = (title, message, action) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            onConfirm: action
        });
    };

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    // --- 1. LÓGICA DE TRANSICIONES (LOADER) ---
    const switchView = (targetView) => {
        setIsLoading(true);
        setTimeout(() => {
            setView(targetView);
            setIsLoading(false);
        }, 1200);
    };

    // --- 2. LÓGICA DE VOZ AVANZADA (REGEX PARSER) ---
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable,
        error
    } = useSpeechRecognition();

    // Debugging logs
    useEffect(() => {
        if (error) {
            console.error("Speech Recognition Error:", error);
            alert(`Error de voz: ${error.error || JSON.stringify(error)}`); // Alert user visibly
        }
    }, [error]);

    useEffect(() => {
        console.log("Browser supports speech recognition:", browserSupportsSpeechRecognition);
        console.log("Microphone available:", isMicrophoneAvailable);
    }, [browserSupportsSpeechRecognition, isMicrophoneAvailable]);

    const handleAdd = (id, qty = 1) => {
        setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + qty }));
    };

    const handleRemove = (id) => {
        setCart(prev => {
            const currentQty = prev[id] || 0;
            if (currentQty <= 1) {
                const newCart = { ...prev };
                delete newCart[id];
                return newCart;
            }
            return { ...prev, [id]: currentQty - 1 };
        });
    };

    const clearCart = () => setCart({});

    const wordToNum = {
        'un': 1, 'uno': 1, 'una': 1, 'unos': 1, 'unas': 1,
        'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
        'quince': 15, 'veinte': 20
    };

    const processVoiceCommand = (text) => {
        if (!text) return;
        const lowerTranscript = text.toLowerCase();
        console.log("Analizando texto:", lowerTranscript);

        const numberPattern = Object.keys(wordToNum).join('|');
        // Regex mejorado para capturar comandos completos
        const regex = new RegExp(`(\\d+|${numberPattern})\\s+(.+?)(?=\\s+(\\d+|${numberPattern})|$)`, 'gi');

        let match;
        let itemsFound = [];
        let matchFound = false;

        while ((match = regex.exec(lowerTranscript)) !== null) {
            const qtyRaw = match[1];
            const nameRaw = match[2].trim();

            let quantity = 1;
            if (wordToNum[qtyRaw]) quantity = wordToNum[qtyRaw];
            else if (!isNaN(qtyRaw)) quantity = parseInt(qtyRaw);

            const cleanName = nameRaw.replace(/^(de |del |con )/, '');

            if (cleanName.length < 3) continue;

            const productNames = menuData.map(p => p.name.toLowerCase());
            const matches = stringSimilarity.findBestMatch(cleanName, productNames);

            // Si la coincidencia es buena, agregamos y marcamos éxito
            if (matches.bestMatch.rating > 0.45) { // Subimos un poco el umbral para evitar falsos positivos en tiempo real
                const targetProduct = menuData[matches.bestMatchIndex];
                handleAdd(targetProduct.id, quantity);
                itemsFound.push(`${quantity}x ${targetProduct.name}`);
                matchFound = true;
            }
        }

        if (itemsFound.length > 0) {
            setLastAdded(itemsFound.join(", "));
            setTimeout(() => setLastAdded(null), 4000);

            // Only reset if it was a real voice command (we can't easily know here, but the effect handles it)
        }
        return matchFound;
    };

    // Procesar en tiempo real (cada vez que cambia el texto)
    useEffect(() => {
        if (listening && transcript) {
            // Debounce pequeño para no procesar palabras a medias
            const timer = setTimeout(() => {
                const found = processVoiceCommand(transcript);
                if (found) resetTranscript();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [transcript, listening]);

    const toggleMic = async () => {
        if (!browserSupportsSpeechRecognition) {
            alert("Tu navegador no soporta reconocimiento de voz. Intenta usar Chrome.");
            return;
        }

        if (listening) {
            // Usamos abortListening para un apagado inmediato y forzoso
            await SpeechRecognition.abortListening();
            resetTranscript();
        } else {
            resetTranscript();
            SpeechRecognition.startListening({ language: 'es-CO', continuous: true })
                .catch(err => console.error("Error starting speech recognition:", err));
        }
    };

    // --- HU-007: GENERACIÓN DE PDF ---
    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const fecha = new Date().toLocaleString();

        // Encabezado
        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text("Desayunos del Cielo - Reporte de Producción", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generado: ${fecha}`, 14, 30);

        // 1. Tabla de Productos (Resumen de Pedidos)
        const productsSummary = Object.entries(cart).map(([id, qty]) => {
            const product = menuData.find(p => p.id === id);
            return product ? [product.name, qty] : null;
        }).filter(Boolean);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Resumen de Pedidos:", 14, 40);

        autoTable(doc, {
            head: [['Producto', 'Cantidad']],
            body: productsSummary,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] }, // Greenish
            styles: { fontSize: 10, cellPadding: 3 },
        });

        // 2. Tabla de Insumos
        const tableData = productionList.map(item => [item.nombre, item.total]);

        const finalYProducts = doc.lastAutoTable.finalY || 45;

        doc.setFontSize(12);
        doc.text("Detalle de Insumos / Producción:", 14, finalYProducts + 10);

        autoTable(doc, {
            head: [['Insumo / Actividad', 'Cantidad Total']],
            body: tableData,
            startY: finalYProducts + 15,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] }, // Blue
            styles: { fontSize: 10, cellPadding: 3 },
        });

        // Pie de página
        const finalY = doc.lastAutoTable.finalY || 40;
        doc.setFontSize(10);
        doc.text(`Total Desayunos Vendidos: ${totalItems}`, 14, finalY + 10);

        doc.save(`produccion_${Date.now()}.pdf`);
    };

    // --- 3. LÓGICA DE CÁLCULO (KITCHEN) ---
    const productionList = useMemo(() => {
        const ingredientesTotales = {};
        Object.entries(cart).forEach(([productId, qtyVenta]) => {
            const productoInfo = menuData.find(p => p.id === productId);
            if (!productoInfo) return;
            productoInfo.ingredients.forEach(insumo => {
                const key = insumo.id;
                if (!ingredientesTotales[key]) {
                    ingredientesTotales[key] = { nombre: insumo.name, total: 0 };
                }
                ingredientesTotales[key].total += (insumo.qty * qtyVenta);
            });
        });
        return Object.values(ingredientesTotales).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [cart]);

    const filteredProducts = menuData.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);


    // --- RENDERIZADO ---

    return (
        <>
            {/* Modal de Confirmación Global */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />

            {/* Loader Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                        <img src={BRAND_LOGO} alt="Loading Logo" className="h-16 relative z-10 object-contain animate-pulse" />
                    </div>
                    <p className="mt-8 text-gray-500 font-medium animate-pulse">Procesando solicitud...</p>
                </div>
            )}

            {/* VISTA: COCINA */}
            {view === 'cocina' && (
                <div className="min-h-screen bg-[#1a1c23] text-gray-200 font-sans p-4 sm:p-6">
                    <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-700 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-white p-2 rounded-lg">
                                <img src={BRAND_LOGO} alt="Logo" className="h-8 object-contain" />
                            </div>
                            <div className="h-8 w-px bg-gray-600 hidden sm:block"></div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                <ChefHat className="text-yellow-500" /> S2CO <span className="text-gray-500 text-lg font-normal hidden sm:inline">| Producción</span>
                            </h2>
                        </div>
                        <button
                            onClick={() => switchView('dashboard')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg transition-all"
                        >
                            <ArrowLeft size={18} /> Volver
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg transition-all shadow-lg"
                        >
                            <FileText size={18} /> Descargar PDF
                        </button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
                        {productionList.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
                                <ChefHat size={64} />
                                <p className="mt-4 text-xl">Sin datos de producción</p>
                            </div>
                        ) : (
                            productionList.map((ingrediente, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-[#252836] p-5 rounded-xl border border-gray-700 shadow-lg group hover:border-yellow-500/50 transition-colors">
                                    <span className="text-lg text-gray-300 font-medium leading-tight pr-4">
                                        {ingrediente.nombre}
                                    </span>
                                    <div className="bg-[#2d303e] min-w-[3.5rem] h-14 flex items-center justify-center rounded-lg border border-gray-600 group-hover:bg-yellow-500 group-hover:text-black group-hover:border-yellow-500 transition-all">
                                        <span className="text-3xl font-bold">{ingrediente.total}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="fixed bottom-6 right-6 left-6 sm:left-auto flex gap-4 justify-end">
                        <button
                            onClick={() => requestConfirmation(
                                '¿Finalizar orden?',
                                'Esto limpiará la pantalla y marcará la orden como completada. ¿Estás seguro?',
                                () => { clearCart(); switchView('dashboard'); }
                            )}
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 font-bold text-lg transform hover:scale-105 transition-all"
                        >
                            <CheckCircle size={24} /> ORDEN LISTA
                        </button>
                    </div>
                </div>
            )}

            {/* VISTA: DASHBOARD (HU-008: Slim Header & Compact UI) */}
            {view === 'dashboard' && (
                <div className="min-h-screen bg-gray-50/50 font-sans pb-32">
                    <header className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100 transition-all">
                        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-auto sm:h-16 py-2 sm:py-0 flex flex-col sm:flex-row items-center justify-between gap-2">

                            <div className="w-full sm:w-auto flex justify-between items-center">
                                <img src={BRAND_LOGO} alt="Logo Marca" className="h-10 object-contain opacity-90" />

                                {totalItems > 0 && (
                                    <button
                                        onClick={() => requestConfirmation(
                                            '¿Borrar pedido?',
                                            'Se eliminarán todos los productos del carrito actual. Esta acción no se puede deshacer.',
                                            clearCart
                                        )}
                                        className="sm:hidden text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>

                            <div className="w-full sm:flex-1 max-w-2xl flex items-center gap-2">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Buscar... o Dictar"
                                        className="w-full pl-9 pr-4 py-2 rounded-full bg-gray-100 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={toggleMic}
                                    className={`p-2 rounded-full transition-all shadow-sm flex-shrink-0 relative
                    ${listening
                                            ? 'bg-red-50 text-red-600 ring-2 ring-red-100'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {listening ? <MicOff size={22} className="animate-pulse" /> : <Mic size={22} />}
                                    {listening && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                                </button>
                            </div>
                        </div>

                        {(listening || lastAdded) && (
                            <div className="bg-blue-50/90 backdrop-blur-sm border-b border-blue-100 px-4 py-2 text-center text-sm transition-all">
                                {listening && <span className="text-blue-600 font-medium animate-pulse block sm:inline">🎙️ Escuchando... Di: "Cantidad + Producto"</span>}
                                {lastAdded && <span className="text-green-600 font-bold ml-0 sm:ml-4 flex items-center justify-center gap-1 inline-flex mt-1 sm:mt-0"><CheckCircle size={14} /> {lastAdded}</span>}
                            </div>
                        )}
                    </header>

                    {/* VISTA: DASHBOARD */}
                    {/* ... (header content) ... */}

                    {/* VISUAL TRANSCRIPT (Floating or Fixed) */}
                    <div className={`transition-all duration-300 overflow-hidden ${listening || transcript ? 'max-h-20 opacity-100 py-2' : 'max-h-0 opacity-0 py-0'}`}>
                        <div className="max-w-2xl mx-auto px-4">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-3 shadow-lg shadow-blue-500/20 flex items-center gap-3 text-white">
                                <div className="bg-white/20 p-2 rounded-lg animate-pulse">
                                    <Mic size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-blue-100 font-medium uppercase tracking-wider mb-0.5">
                                        {listening ? "Escuchando..." : "Procesando..."}
                                    </p>
                                    <p className="text-sm font-medium truncate">
                                        {transcript || "Di algo como: 'Una bandeja promesas'..."}
                                    </p>
                                </div>
                                {transcript && (
                                    <button
                                        onClick={resetTranscript}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Menú</h1>
                                <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-md">{filteredProducts.length}</span>
                            </div>

                            {totalItems > 0 && (
                                <button
                                    onClick={() => requestConfirmation(
                                        '¿Vaciar todo el pedido?',
                                        'Estás a punto de eliminar todos los items del carrito. ¿Deseas continuar?',
                                        clearCart
                                    )}
                                    className="hidden sm:flex items-center gap-2 text-sm text-gray-400 hover:text-red-600 transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
                                >
                                    <Trash2 size={16} /> Vaciar Todo
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {filteredProducts.map(product => {
                                const qty = cart[product.id] || 0;
                                return (
                                    <div key={product.id} className={`group relative bg-white rounded-xl p-3 border transition-all duration-200 flex flex-col justify-between min-h-[140px] ${qty > 0 ? 'border-blue-500 ring-2 ring-blue-50/50 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                                        <div className="mb-2">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg"><Package size={16} /></div>
                                                {qty > 0 && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{qty}</span>}
                                            </div>
                                            <h3 className="font-bold text-gray-800 text-sm sm:text-base leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{product.name}</h3>
                                        </div>

                                        <div className="mt-auto flex items-center bg-gray-50 rounded-lg p-1 gap-1 border border-gray-100">
                                            <button onClick={() => handleRemove(product.id)} className={`w-8 h-8 flex items-center justify-center rounded-md font-bold text-lg transition-all ${qty === 0 ? 'text-gray-300' : 'bg-white text-gray-700 shadow-sm hover:text-red-500 active:scale-90'}`} disabled={qty === 0}>-</button>
                                            <div className="flex-1 text-center"><span className={`text-lg font-bold ${qty > 0 ? 'text-gray-900' : 'text-gray-300'}`}>{qty}</span></div>
                                            <button onClick={() => handleAdd(product.id)} className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 font-bold text-lg active:scale-90 transition-all">+</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </main>

                    {totalItems > 0 && (
                        <div className="fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
                            <div className="max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl p-3 sm:p-4 shadow-2xl shadow-blue-900/20 flex items-center justify-between gap-4 pl-4 sm:pl-6">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="relative">
                                        <ShoppingCart className="text-blue-400" size={24} />
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-900">{totalItems}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">Total Items</p>
                                        <p className="font-bold text-lg leading-none">{totalItems}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsCartOpen(true)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 sm:px-8 py-3 rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-blue-600/30 flex items-center gap-2 transform active:scale-95 transition-all"
                                >
                                    <List size={18} />
                                    <span className="hidden sm:inline">REVISAR</span> ({totalItems})
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Cart Modal */}
                    <CartModal
                        isOpen={isCartOpen}
                        onClose={() => setIsCartOpen(false)}
                        cart={cart}
                        menuData={menuData}
                        onAdd={handleAdd}
                        onRemove={handleRemove}
                        onClear={() => {
                            requestConfirmation('¿Vaciar todo?', 'Se borrarán todos los items.', clearCart);
                            setIsCartOpen(false);
                        }}
                        onConfirm={() => {
                            setIsCartOpen(false);
                            switchView('cocina');
                        }}
                    />


                </div>
            )}
        </>
    );
}
