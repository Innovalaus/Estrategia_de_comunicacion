import React, { useState, useRef } from 'react';
import { Target, Download, ChevronRight, ChevronLeft, Save, Trash2, MessageSquare, FolderInput, Megaphone, CheckCircle, ShieldAlert, Lightbulb, Eye, EyeOff, Info, Users, Lock, Activity, Plus, Sparkles, Loader2 } from 'lucide-react';

/* --- Llamada al proxy (Apps Script) -----------------------------------------
   El alumno ya NO necesita API Key. Las peticiones van a la Web App de Apps
   Script, que guarda la key de IFV y habla con Gemini. La cascada de modelos
   y el límite diario viven en el Apps Script, no aquí.
--------------------------------------------------------------------------- */
const PROXY_URL = 'https://script.google.com/macros/s/AKfycbzR51-yQRqPSIyqOc1Ocm9i_Zguwe5svZOGLr0CX9KOViDCo549Eald4UjP2pRF1JTX/exec';
const APP_ID = 'estrategia-comunicacion'; // Identifica la app en el proxy

async function callGemini(prompt, maxRetries = 2) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        // text/plain evita el preflight CORS que Apps Script no acepta.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ prompt, app: APP_ID })
      });

      const data = await res.json();

      // Errores del propio proxy (límite diario, modelos caídos...): no reintentamos.
      if (data.error) {
        const err = new Error(data.error);
        err.fromServer = true;
        throw err;
      }
      if (!data.text) {
        const err = new Error('El servidor devolvió una respuesta vacía.');
        err.fromServer = true;
        throw err;
      }
      return data.text;
    } catch (error) {
      lastError = error;
      if (error.fromServer) break;
      // Fallo de red: esperamos un poco y reintentamos.
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, 3000));
    }
  }

  throw lastError;
}

// Normaliza el tipo de creencia que devuelve la IA ("Conductual", "Normativas", "de control"...)
const BELIEF_TYPES = ['conductual', 'normativa', 'control'];
const normalizeType = (t) => {
  const clean = String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return BELIEF_TYPES.find(type => clean.includes(type)) || null;
};

// --- ICONO PERSONALIZADO PEONZA (TOTEM ORIGEN) ---
const SpinningTopIcon = ({ size = 24, strokeWidth = 2.5 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
  >
    <path d="M12 20L3 8h18L12 20z" />
    <path d="M12 2v6" />
    <ellipse cx="12" cy="8" rx="9" ry="3" />
  </svg>
);

// --- ESTILOS CONSTANTES ---
const THEME = {
  appBg: "bg-[#0b1d33]",
  pageBg: "bg-gray-100",
  text: "text-white",
  textMuted: "text-gray-300",
  inputBg: "bg-white",
  inputText: "text-gray-900",
  accent: "white", 
  accentBorder: "border-white",
  mainWrapper: "min-h-screen w-full flex flex-col items-center py-10 px-4 sm:px-6 bg-gray-100 font-sans",
  contentContainer: "w-full max-w-5xl flex flex-col gap-0", 
  stepCard: "w-full bg-[#0b1d33] p-8 rounded-b-xl shadow-2xl min-h-[600px] border-t-0 border border-white/10",
};

// --- COMPONENTES UI ---

const SectionTitle = ({ title, icon: Icon, subtitle, RightElement }) => (
  <div className={`mb-6 border-b-2 ${THEME.accentBorder} pb-2 w-full flex justify-between items-end`}>
    <div className="flex items-center gap-3">
      <div className={`bg-white p-2 rounded-lg text-[#0b1d33]`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <h2 className={`text-2xl font-bold ${THEME.text} uppercase tracking-tight`}>{title}</h2>
        {subtitle && <p className={`text-sm ${THEME.textMuted} mt-1`}>{subtitle}</p>}
      </div>
    </div>
    {RightElement && <div className="mb-1">{RightElement}</div>}
  </div>
);

const InputField = ({ label, value, onChange, placeholder, type = "text", multiline = false, rows = 3 }) => (
  <div className="mb-4 w-full">
    <label className={`block text-sm font-bold ${THEME.text} mb-1 uppercase text-xs tracking-wider opacity-90`}>{label}</label>
    {multiline ? (
      <textarea
        className={`w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all outline-none ${THEME.inputBg} ${THEME.inputText}`}
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    ) : (
      <input
        type={type}
        className={`w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all outline-none ${THEME.inputBg} ${THEME.inputText}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </div>
);

// --- COMPONENTE HELPER PARA RENDERIZAR BLOQUES DE CREENCIAS ---
const BeliefGroup = ({ title, type, colorClass, icon: Icon, items, onAdd, onRemove, onChange }) => (
  <div className={`mb-6 rounded-lg overflow-hidden border border-${colorClass}-500/30`}>
      <div className={`bg-${colorClass}-900/40 p-3 border-b border-${colorClass}-500/30 flex justify-between items-center gap-2`}>
          <div className="flex items-center gap-2">
            <Icon size={18} className={`text-${colorClass}-400`} />
            <h3 className={`text-${colorClass}-300 font-bold text-sm uppercase tracking-wide`}>{title}</h3>
          </div>
          <button 
            onClick={() => onAdd(type)} 
            className={`flex items-center gap-1 text-${colorClass}-300 hover:text-white text-xs font-bold border border-${colorClass}-500/50 px-3 py-1.5 rounded bg-${colorClass}-500/10 hover:bg-${colorClass}-500/30 transition shadow-sm`}
          >
            <Plus size={14} /> Añadir Fila
          </button>
      </div>
      <div className="p-4 bg-[#162a45] space-y-4">
          {items.map((belief, i) => (
              <div key={belief.id} className="flex flex-col md:flex-row gap-4 items-start relative group animate-fade-in">
                  <div className={`bg-white/10 text-white font-bold px-3 py-1 rounded text-xs mt-1 w-fit flex items-center gap-2`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField 
                          label="Idea a Implantar"
                          value={belief.idea} 
                          onChange={v => onChange(belief.id, 'idea', v)} 
                          placeholder="Escribe la creencia..." 
                      />
                      <InputField 
                          label="Metodología (Prueba/Argumento)" 
                          value={belief.method} 
                          onChange={v => onChange(belief.id, 'method', v)} 
                          placeholder="Cómo la demostrarás..." 
                      />
                  </div>
                  <button 
                    onClick={() => onRemove(belief.id)} 
                    className="absolute -right-2 -top-2 md:static md:mt-8 text-gray-500 hover:text-red-400 p-2 opacity-100 md:opacity-40 md:hover:opacity-100 transition rounded-full hover:bg-white/5"
                    title="Eliminar fila"
                  >
                    <Trash2 size={18}/>
                  </button>
              </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-6 border border-dashed border-gray-600 rounded-lg">
                <p className="text-gray-400 text-sm italic mb-2">No has añadido creencias de este tipo.</p>
                <button onClick={() => onAdd(type)} className="text-xs text-blue-300 hover:text-white underline">Añadir una ahora</button>
            </div>
          )}
      </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
   
  // ESTADO MODAL
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alert', 
    message: '',
    onConfirm: null
  });
   
  // DATOS DEL FORMULARIO
  const [formData, setFormData] = useState({
    // SECCIÓN 1: PROPUESTA DE VALOR - CONSTRUCTOR
    niche: "",
    product: "",
    puv_avatar: "",
    puv_benefit: "",
    puv_objection: "",
    puv_system: "",
    puv_show_avatar: true, puv_show_benefit: true, puv_show_objection: true, puv_show_system: true,
    puvSentence: "",

    // SECCIÓN 2
    nightmares: ["", "", ""],
    dreams: ["", "", ""],
    credibility: "", 
    message1: "", 
    message2: "", 
    message3: "", 

    // SECCIÓN 3: MAPA DE CREENCIAS
    beliefs: [
        { id: 1, type: "conductual", idea: "", method: "" },
        { id: 2, type: "conductual", idea: "", method: "" },
        { id: 3, type: "conductual", idea: "", method: "" },
        { id: 4, type: "conductual", idea: "", method: "" },
        
        { id: 5, type: "normativa", idea: "", method: "" },
        { id: 6, type: "normativa", idea: "", method: "" },
        { id: 7, type: "normativa", idea: "", method: "" },
        { id: 8, type: "normativa", idea: "", method: "" },
        
        { id: 9, type: "control", idea: "", method: "" },
        { id: 10, type: "control", idea: "", method: "" },
        { id: 11, type: "control", idea: "", method: "" },
        { id: 12, type: "control", idea: "", method: "" },
    ]
  });

  const importInputRef = useRef(null);

  // --- HELPERS ---
  const showAlert = (message) => setModalConfig({ isOpen: true, type: 'alert', message, onConfirm: null });
  const showConfirm = (message, onConfirmAction) => setModalConfig({ isOpen: true, type: 'confirm', message, onConfirm: onConfirmAction });
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));
  const handleModalConfirm = () => {
    const action = modalConfig.onConfirm;
    closeModal();
    if (action) action();
  };

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
   
  const constructSentence = (data) => {
      let parts = ["Ayudo"];
      if (data.puv_show_avatar) parts.push(`a ${data.puv_avatar || '[avatar]'}`);
      if (data.puv_show_benefit) parts.push(`a ${data.puv_benefit || '[beneficio]'}`);
      if (data.puv_show_objection) parts.push(`sin ${data.puv_objection || '[objeción]'}`);
      if (data.puv_show_system) parts.push(`con ${data.puv_system || '[sistema]'}`);
      return parts.join(" ");
  };

  const handlePuvChange = (field, value) => {
    setFormData(prev => {
        const newData = { ...prev, [field]: value };
        if (field === 'puv_avatar') newData.niche = value;
        if (field === 'puv_system') newData.product = value;
        newData.puvSentence = constructSentence(newData);
        return newData;
    });
  };

  const togglePuvPart = (partKey) => {
      setFormData(prev => {
          const newData = { ...prev, [partKey]: !prev[partKey] };
          newData.puvSentence = constructSentence(newData);
          return newData;
      });
  };

  // --- LÓGICA DE CREENCIAS (Añadir/Quitar/Editar) ---

  const handleAddBelief = (type) => {
      const newBelief = { id: Date.now(), type, idea: "", method: "" };
      setFormData(prev => ({
          ...prev,
          beliefs: [...prev.beliefs, newBelief]
      }));
  };

  const handleRemoveBelief = (id) => {
      setFormData(prev => ({
          ...prev,
          beliefs: prev.beliefs.filter(b => b.id !== id)
      }));
  };

  const handleBeliefChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      beliefs: prev.beliefs.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };

  // --- LÓGICA IA (a través del proxy) ---
  const runBeliefsGeneration = async () => {
    setIsAiLoading(true);

    const contextPrompt = `
      Actúa como un estratega experto en comunicación persuasiva y psicología del consumidor.
      Tu tarea es generar un "Mapa de Creencias" (basado en la Teoría del Comportamiento Planificado) para una estrategia de marketing.
      
      CONTEXTO DEL CLIENTE:
      - Avatar (Cliente Ideal): ${formData.puv_avatar || "No especificado"}
      - Beneficio Principal (Deseo): ${formData.puv_benefit || "No especificado"}
      - Objeción Principal (Dolor): ${formData.puv_objection || "No especificado"}
      - Sistema/Método: ${formData.puv_system || "No especificado"}
      
      MENSAJES CLAVE DEFINIDOS:
      1. Qué hacer: ${formData.message1 || "No especificado"}
      2. Qué dejar de hacer: ${formData.message2 || "No especificado"}
      3. Consecuencia de no actuar: ${formData.message3 || "No especificado"}

      TAREA:
      Genera una lista de creencias que necesitamos implantar en la mente del avatar para que compre el producto/servicio.
      Debes generar EXACTAMENTE:
      - 4 Creencias de TIPO "conductual" (Actitud hacia la conducta: valdrá la pena, es para mí).
      - 4 Creencias de TIPO "normativa" (Presión social: otros lo hacen, es la nueva norma, autoridades lo avalan).
      - 4 Creencias de TIPO "control" (Autoeficacia: soy capaz, es fácil, es seguro, tengo tiempo/dinero).

      FORMATO DE RESPUESTA (SOLO JSON VÁLIDO):
      {
        "beliefs": [
          { "type": "conductual", "idea": "...", "method": "..." },
          ...
        ]
      }
      
      El campo "type" debe ser EXACTAMENTE una de estas palabras, en minúsculas: conductual, normativa, control.
      Para "method", sugiere brevemente CÓMO demostrar esa creencia (ej: "Testimonio de X", "Estudio científico", "Garantía", "Demo").
      El tono debe ser profesional pero persuasivo.
    `;

    try {
        const text = await callGemini(contextPrompt);
        const clean = text.replace(/```json|```/g, "").trim();
        const parsedData = JSON.parse(clean);

        if (!parsedData || !Array.isArray(parsedData.beliefs)) {
            throw new Error("Formato de respuesta incorrecto por parte de la IA.");
        }

        // Normalizamos tipos y campos; descartamos lo que no encaje en los 3 bloques.
        const newBeliefs = parsedData.beliefs
            .map((b, index) => ({
                id: Date.now() + index,
                type: normalizeType(b.type),
                idea: b.idea || "",
                method: b.method || ""
            }))
            .filter(b => b.type);

        if (newBeliefs.length === 0) {
            throw new Error("La IA no devolvió creencias válidas.");
        }

        setFormData(prev => ({ ...prev, beliefs: newBeliefs }));
        showAlert("¡Creencias generadas con éxito! Revísalas y adáptalas si es necesario.");
    } catch (error) {
        console.error("Error IA:", error);
        const msg = error instanceof SyntaxError
          ? "La IA devolvió una respuesta con formato incorrecto. Pulsa de nuevo en Autorellenar."
          : `No se pudo generar el mapa: ${error.message} Si persiste, revisa tu conexión a internet.`;
        showAlert(msg);
    } finally {
        setIsAiLoading(false);
    }
  };

  const generateBeliefsWithAI = () => {
    if (isAiLoading) return;

    // Validar que haya contexto mínimo
    if (!formData.puv_avatar && !formData.puv_benefit) {
        showAlert("Por favor, completa al menos el Avatar y el Beneficio en el Paso 1 para que la IA tenga contexto.");
        return;
    }

    // Si ya hay creencias escritas, avisamos antes de sobrescribirlas
    const hasContent = formData.beliefs.some(b => (b.idea || "").trim() || (b.method || "").trim());
    if (hasContent) {
        showConfirm("La IA sustituirá las creencias que ya has escrito. ¿Quieres continuar?", runBeliefsGeneration);
    } else {
        runBeliefsGeneration();
    }
  };

  const handleResetForm = () => {
    showConfirm("¿Borrar toda la estrategia y empezar de cero?", () => {
      // Reiniciar a 4 por defecto de cada tipo
      const defaultBeliefs = [
        { id: 1, type: "conductual", idea: "", method: "" },
        { id: 2, type: "conductual", idea: "", method: "" },
        { id: 3, type: "conductual", idea: "", method: "" },
        { id: 4, type: "conductual", idea: "", method: "" },
        { id: 5, type: "normativa", idea: "", method: "" },
        { id: 6, type: "normativa", idea: "", method: "" },
        { id: 7, type: "normativa", idea: "", method: "" },
        { id: 8, type: "normativa", idea: "", method: "" },
        { id: 9, type: "control", idea: "", method: "" },
        { id: 10, type: "control", idea: "", method: "" },
        { id: 11, type: "control", idea: "", method: "" },
        { id: 12, type: "control", idea: "", method: "" },
      ];

      setFormData({
        niche: "", product: "",
        puv_avatar: "", puv_benefit: "", puv_objection: "", puv_system: "",
        puv_show_avatar: true, puv_show_benefit: true, puv_show_objection: true, puv_show_system: true,
        puvSentence: "",
        nightmares: ["", "", ""], dreams: ["", "", ""],
        credibility: "",
        message1: "", message2: "", message3: "",
        beliefs: defaultBeliefs
      });
      setStep(1);
    });
  };

  // --- EXPORTAR / IMPORTAR JSON ---
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Estrategia_Comunicacion_${formData.niche || 'Nicho'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported) {
             const normalizeArray = (arr, size) => {
                 const newArr = Array.isArray(arr) ? [...arr] : [];
                 while (newArr.length < size) newArr.push("");
                 return newArr.slice(0, size);
             };
             
             let finalBeliefs = [];
             
             if (Array.isArray(imported.beliefs)) {
                 finalBeliefs = imported.beliefs.map((b, i) => ({
                    ...b,
                    id: b.id || Date.now() + i,
                    type: normalizeType(b.type) || (i < 4 ? "conductual" : i < 8 ? "normativa" : "control"),
                    idea: b.idea || "",
                    method: b.method || ""
                 }));
             } else {
                 finalBeliefs = formData.beliefs; 
             }

             setFormData(prev => ({ 
                 ...prev,
                 puv_show_avatar: true, puv_show_benefit: true, puv_show_objection: true, puv_show_system: true,
                 ...imported,
                 nightmares: normalizeArray(imported.nightmares, 3),
                 dreams: normalizeArray(imported.dreams, 3),
                 beliefs: finalBeliefs
             }));
             showAlert("¡Estrategia importada correctamente!");
          } else {
             showAlert("El archivo no es válido.");
          }
        } catch (error) {
          console.error(error);
          showAlert("Error al leer el archivo.");
        }
      };
      reader.readAsText(file);
    }
    e.target.value = null;
  };

  // --- PDF EXPORT ---
  const exportPDF = () => {
    setGeneratingPDF(true);
    const element = document.getElementById('printable-area');
     
    const opt = {
      margin: [10, 10, 10, 10], 
      filename: `Estrategia_${formData.niche || 'Completa'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    const runExport = () => {
         if (window.html2pdf) {
             window.html2pdf().set(opt).from(element).save()
                .then(() => setGeneratingPDF(false))
                .catch(err => {
                   console.error("Error PDF:", err);
                   setGeneratingPDF(false);
                   showAlert("Error al generar PDF.");
                });
         } else {
             setGeneratingPDF(false);
             showAlert("La librería PDF aún se está cargando. Prueba en unos segundos.");
         }
    };

    if (typeof window.html2pdf === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = runExport;
        script.onerror = () => {
            setGeneratingPDF(false);
            showAlert("No se pudo cargar el generador de PDF. Comprueba tu conexión.");
        };
        document.head.appendChild(script);
    } else {
        runExport();
    }
  };

  // --- RENDER MODAL ---
  const renderCustomModal = () => {
    if (!modalConfig.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] animate-fade-in p-4">
        <div className="bg-[#0b1d33] text-white p-6 rounded-xl w-full max-w-sm shadow-2xl border border-white/20">
           <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
             <MessageSquare className="text-slate-200" size={24} /> 
             <h3 className="text-lg font-bold">Aviso</h3>
           </div>
           <p className="text-gray-300 mb-6 text-sm">{modalConfig.message}</p>
           <div className="flex justify-end gap-3">
             {modalConfig.type === 'confirm' && (
                 <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
             )}
             <button onClick={handleModalConfirm} className="bg-white text-[#0b1d33] px-6 py-2 rounded-lg font-bold hover:bg-gray-200 text-sm">Aceptar</button>
           </div>
        </div>
      </div>
    );
  };

  // --- SECCIONES / PASOS ---

  const renderStep1 = () => (
    <div className="animate-fade-in w-full">
      <SectionTitle title="1. Creación de tu Propuesta de Valor" icon={Target} subtitle="Rellena cada sección para construir tu frase automáticamente." />
       
      <div className="mb-6 bg-blue-900/20 border border-blue-500/20 p-3 rounded-lg flex items-center gap-3 text-sm text-blue-200">
          <Eye size={18} className="text-blue-300 shrink-0" />
          <p>Marca o desmarca el icono del ojo en cada bloque para que aparezca o no en tu Propuesta Única de Valor.</p>
      </div>

      <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AVATAR */}
              <div className={`bg-[#162a45] p-5 rounded-lg border transition-all duration-300 ${formData.puv_show_avatar ? 'border-white/10 opacity-100' : 'border-white/5 opacity-50'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-blue-300 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">Ayudo a...</h3>
                    <button onClick={() => togglePuvPart('puv_show_avatar')} className="text-gray-400 hover:text-white">
                        {formData.puv_show_avatar ? <Eye size={18}/> : <EyeOff size={18}/>}
                    </button>
                  </div>
                  {formData.puv_show_avatar && (
                    <>
                        <InputField label="Tu Avatar (¿Quién es?)" value={formData.puv_avatar} onChange={v => handlePuvChange('puv_avatar', v)} placeholder="Ej: Deportistas con hernias discales..." />
                        <p className="text-xs text-gray-400 mt-[-10px]">¿A quién te diriges específicamente?</p>
                    </>
                  )}
              </div>

              {/* BENEFICIO */}
              <div className={`bg-[#162a45] p-5 rounded-lg border transition-all duration-300 ${formData.puv_show_benefit ? 'border-white/10 opacity-100' : 'border-white/5 opacity-50'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-green-300 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">A conseguir...</h3>
                    <button onClick={() => togglePuvPart('puv_show_benefit')} className="text-gray-400 hover:text-white">
                        {formData.puv_show_benefit ? <Eye size={18}/> : <EyeOff size={18}/>}
                    </button>
                  </div>
                  {formData.puv_show_benefit && (
                      <>
                        <InputField label="Beneficio Principal / Sueño" value={formData.puv_benefit} onChange={v => handlePuvChange('puv_benefit', v)} placeholder="Ej: A recuperarse..." />
                        <p className="text-xs text-gray-400 mt-[-10px]">¿Qué es lo que más desean lograr?</p>
                      </>
                  )}
              </div>

              {/* OBJECIÓN */}
              <div className={`bg-[#162a45] p-5 rounded-lg border transition-all duration-300 ${formData.puv_show_objection ? 'border-white/10 opacity-100' : 'border-white/5 opacity-50'}`}>
                    <div className="flex justify-between items-center mb-3">
                    <h3 className="text-red-300 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">Sin...</h3>
                    <button onClick={() => togglePuvPart('puv_show_objection')} className="text-gray-400 hover:text-white">
                        {formData.puv_show_objection ? <Eye size={18}/> : <EyeOff size={18}/>}
                    </button>
                  </div>
                  {formData.puv_show_objection && (
                      <>
                        <InputField label="Objeción / Dolor" value={formData.puv_objection} onChange={v => handlePuvChange('puv_objection', v)} placeholder="Ej: Sin cirugía ni reposo..." />
                        <p className="text-xs text-gray-400 mt-[-10px]">¿Qué quieren evitar a toda costa?</p>
                      </>
                  )}
              </div>

              {/* SISTEMA */}
              <div className={`bg-[#162a45] p-5 rounded-lg border transition-all duration-300 ${formData.puv_show_system ? 'border-white/10 opacity-100' : 'border-white/5 opacity-50'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-yellow-300 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">Con...</h3>
                    <button onClick={() => togglePuvPart('puv_show_system')} className="text-gray-400 hover:text-white">
                        {formData.puv_show_system ? <Eye size={18}/> : <EyeOff size={18}/>}
                    </button>
                  </div>
                  {formData.puv_show_system && (
                      <>
                        <InputField label="Tu Sistema / Método" value={formData.puv_system} onChange={v => handlePuvChange('puv_system', v)} placeholder="Ej: Con programación bioconductual..." />
                        <p className="text-xs text-gray-400 mt-[-10px]">¿Cómo se llama tu solución única?</p>
                      </>
                  )}
              </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-[#1f3a5c] to-[#162a45] p-6 rounded-xl border border-white/20 shadow-lg text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
              <h3 className="text-gray-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">Propuesta Única de Valor</h3>
              <p className="text-xl md:text-2xl font-serif italic text-white leading-relaxed">
                  "Ayudo 
                  {formData.puv_show_avatar && <> a <span className="text-blue-300 font-bold border-b border-blue-300/30">{formData.puv_avatar || "..."}</span></>}
                  {formData.puv_show_benefit && <> a <span className="text-green-300 font-bold border-b border-green-300/30">{formData.puv_benefit || "..."}</span></>}
                  {formData.puv_show_objection && <> sin <span className="text-red-300 font-bold border-b border-red-300/30">{formData.puv_objection || "..."}</span></>}
                  {formData.puv_show_system && <> con <span className="text-yellow-300 font-bold border-b border-yellow-300/30">{formData.puv_system || "..."}</span></>}
                  "
              </p>
          </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-fade-in w-full">
      <SectionTitle title="2. Tus 3 Mensajes" icon={Megaphone} subtitle="Define el contenido educativo para llevarlos a la acción." />
      <div className="grid grid-cols-1 gap-6 w-full">
        <div className="bg-[#162a45] p-6 rounded-lg border border-green-500/30 w-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle size={64} className="text-green-500"/></div>
              <h3 className="font-bold text-green-400 mb-2 flex items-center gap-2 text-lg">Mensaje 1: Qué tiene que HACER</h3>
              <p className="text-xs text-gray-400 mb-4">Lo que sí o sí debe hacer para conseguir su objetivo (máximo 1-2 cosas).</p>
              <InputField multiline rows={4} label="Redacta el mensaje" value={formData.message1} onChange={v => handleInputChange('message1', v)} placeholder="Para recuperarte, lo primero que debes hacer es..." />
        </div>
        <div className="bg-[#162a45] p-6 rounded-lg border border-red-500/30 w-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert size={64} className="text-red-500"/></div>
              <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2 text-lg">Mensaje 2: Qué tiene que DEJAR DE HACER</h3>
              <p className="text-xs text-gray-400 mb-4">Lo que debe abandonar aunque crea que es lo mejor.</p>
              <InputField multiline rows={4} label="Redacta el mensaje" value={formData.message2} onChange={v => handleInputChange('message2', v)} placeholder="Deja de aplicar hielo y reposo, porque..." />
        </div>
        <div className="bg-[#162a45] p-6 rounded-lg border border-yellow-500/30 w-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Lightbulb size={64} className="text-yellow-500"/></div>
              <h3 className="font-bold text-yellow-400 mb-2 flex items-center gap-2 text-lg">Mensaje 3: Qué le ocurrirá si SIGUE IGUAL</h3>
              <p className="text-xs text-gray-400 mb-4">Consecuencia emocional de no tomar acción.</p>
              <InputField multiline rows={4} label="Redacta el mensaje" value={formData.message3} onChange={v => handleInputChange('message3', v)} placeholder="Si sigues ignorando el dolor, dentro de un año..." />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-fade-in w-full">
      <SectionTitle 
        title="3. Origen: Mapa de Creencias" 
        icon={SpinningTopIcon} 
        subtitle="Las ideas clave que debes implantar en su mente." 
        RightElement={
            <button 
                onClick={generateBeliefsWithAI}
                disabled={isAiLoading}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
            >
                {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-yellow-300" />}
                {isAiLoading ? "Generando..." : "Autorellenar con IA"}
            </button>
        }
      />
       
      <div className="bg-white/5 p-4 rounded mb-6 text-sm text-gray-300 border border-white/10 flex items-center gap-3">
        <Info size={20} className="shrink-0 text-blue-300" />
        <p>Personaliza tu mapa: añade o elimina filas según lo que sea más relevante para tu nicho. Recuerda mantener un equilibrio para un cambio de conducta efectivo.</p>
      </div>

      <BeliefGroup 
        title="Creencias Conductuales (Actitud)" 
        type="conductual"
        colorClass="blue"
        icon={Activity}
        items={formData.beliefs.filter(b => b.type === 'conductual')} 
        onAdd={handleAddBelief}
        onRemove={handleRemoveBelief}
        onChange={handleBeliefChange}
      />

      <BeliefGroup 
        title="Creencias Normativas (Entorno/Social)" 
        type="normativa"
        colorClass="purple"
        icon={Users}
        items={formData.beliefs.filter(b => b.type === 'normativa')} 
        onAdd={handleAddBelief}
        onRemove={handleRemoveBelief}
        onChange={handleBeliefChange}
      />

      <BeliefGroup 
        title="Creencias de Control (Barreras/Capacidad)" 
        type="control"
        colorClass="green"
        icon={Lock}
        items={formData.beliefs.filter(b => b.type === 'control')} 
        onAdd={handleAddBelief}
        onRemove={handleRemoveBelief}
        onChange={handleBeliefChange}
      />

    </div>
  );

  // --- PREVIEW PDF ---
  if (showPreview) {
    return (
      <div className="min-h-screen bg-[#111827] flex justify-center items-start overflow-y-auto py-10 px-4 w-full">
        {renderCustomModal()}
        <div className="bg-white w-[210mm] shadow-2xl mx-auto rounded-none relative min-h-[297mm]">
            <style>{`
                .pdf-section { margin-bottom: 30px; } 
                .pdf-header { background-color: #0b1d33; color: white; padding: 20px; margin-bottom: 30px; }
                .pdf-table { width: 100%; border-collapse: collapse; font-size: 12px; }
                .pdf-table th { background-color: #0b1d33; color: white; padding: 8px; text-align: left; }
                .pdf-table td { border: 1px solid #e5e7eb; padding: 10px; vertical-align: top; word-wrap: break-word; }
                .pdf-table tr { page-break-inside: avoid; }
                .pdf-box { border: 1px solid #e5e7eb; padding: 15px; border-radius: 5px; background-color: #f9fafb; margin-bottom: 15px; page-break-inside: avoid; }
                .pdf-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: white; text-transform: uppercase; }
                .badge-conductual { background-color: #3b82f6; }
                .badge-normativa { background-color: #a855f7; }
                .badge-control { background-color: #22c55e; }
            `}</style>
            
            <div className="fixed top-4 right-4 flex gap-2 z-50 no-print">
                <button onClick={exportPDF} disabled={generatingPDF} className="bg-[#0b1d33] hover:bg-[#162a45] text-white px-4 py-2 rounded shadow font-bold flex items-center gap-2 border border-white disabled:opacity-50">
                    {generatingPDF ? <span className="animate-spin">⌛</span> : <Download size={18} />} {generatingPDF ? "Generando..." : "PDF"}
                </button>
                <button onClick={() => setShowPreview(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300">Editar</button>
            </div>

            <div id="printable-area" className="bg-white text-gray-800 font-sans w-full h-full pb-10">
                {/* Header PDF */}
                <div className="pdf-header flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-widest">Estrategia de Comunicación</h1>
                        <p className="text-sm text-gray-300 mt-1">Propuesta de Valor, Mensajes y Creencias</p>
                    </div>
                </div>

                <div className="px-12 py-6">
                    {/* SECCIÓN 1: PUV */}
                    <div className="pdf-section">
                        <h2 className="text-[#0b1d33] font-bold text-lg border-b-2 border-[#0b1d33] pb-2 mb-4 uppercase">1. Creación de tu Propuesta de Valor</h2>
                        <div className="pdf-box border-l-4 border-l-[#0b1d33] bg-[#0b1d33]/5 mt-6">
                            <h3 className="text-xs font-bold text-[#0b1d33] uppercase mb-2">Propuesta Única de Valor (PUV)</h3>
                            <p className="text-lg italic font-medium text-[#0b1d33]">"{formData.puvSentence || "Completa el paso 1 para ver tu promesa aquí."}"</p>
                        </div>
                    </div>

                    {/* SECCIÓN 2: 3 MENSAJES */}
                    <div className="pdf-section">
                        <h2 className="text-[#0b1d33] font-bold text-lg border-b-2 border-[#0b1d33] pb-2 mb-4 uppercase">2. Tus 3 Mensajes</h2>
                        <div className="pdf-box border-l-4 border-l-green-500 mb-4">
                            <strong className="text-green-700 block mb-1 uppercase text-sm">Mensaje 1: Qué hacer</strong>
                            <p className="text-sm whitespace-pre-line text-gray-700">{formData.message1}</p>
                        </div>
                        <div className="pdf-box border-l-4 border-l-red-500 mb-4">
                            <strong className="text-red-700 block mb-1 uppercase text-sm">Mensaje 2: Qué dejar de hacer</strong>
                            <p className="text-sm whitespace-pre-line text-gray-700">{formData.message2}</p>
                        </div>
                        <div className="pdf-box border-l-4 border-l-yellow-500">
                            <strong className="text-yellow-700 block mb-1 uppercase text-sm">Mensaje 3: Consecuencia</strong>
                            <p className="text-sm whitespace-pre-line text-gray-700">{formData.message3}</p>
                        </div>
                    </div>

                    {/* SECCIÓN 3: MAPA DE CREENCIAS */}
                    <div className="pdf-section">
                        <h2 className="text-[#0b1d33] font-bold text-lg border-b-2 border-[#0b1d33] pb-2 mb-4 uppercase">3. Origen: Mapa de Creencias</h2>
                        <table className="pdf-table">
                            <thead>
                                <tr>
                                    <th style={{width: '5%'}}>#</th>
                                    <th style={{width: '15%'}}>Tipo</th>
                                    <th style={{width: '40%'}}>Idea a Implantar</th>
                                    <th style={{width: '40%'}}>Metodología para implantarla</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.beliefs
                                  .filter(b => (b.idea || "").trim() !== "" || (b.method || "").trim() !== "")
                                  .map((b, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="text-center font-bold text-gray-400">{i + 1}</td>
                                        <td className="align-middle">
                                            <span className={`pdf-badge badge-${b.type}`}>
                                                {b.type === 'conductual' ? 'Conductual' : b.type === 'normativa' ? 'Normativa' : 'Control'}
                                            </span>
                                        </td>
                                        <td className="text-gray-800 font-medium">{b.idea}</td>
                                        <td className="text-gray-600 italic">{b.method}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 text-center text-xs text-gray-400 border-t pt-4">
                        Instituto Fisio Virtual &copy; {new Date().getFullYear()}
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- LAYOUT PRINCIPAL ---
  return (
    <div className={THEME.mainWrapper}>
      {renderCustomModal()}

      <div className={THEME.contentContainer}>
          {/* Header */}
          <div className="w-full bg-[#0b1d33] p-6 rounded-t-xl border-b border-white/20 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                 <div className="flex flex-col">
                    <h1 className="text-xl font-bold tracking-tight text-white uppercase">ESTRATEGIA DE COMUNICACIÓN</h1>
                    <span className="text-xs tracking-widest text-gray-300">INSTITUTO FISIO VIRTUAL</span>
                 </div>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
                <button onClick={() => importInputRef.current?.click()} className="text-white hover:bg-white/10 px-3 py-2 transition flex gap-2 items-center text-xs font-bold bg-transparent border border-white/30 rounded" title="Importar"><FolderInput size={16}/> <span className="hidden sm:inline">Importar</span></button>
                <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportJSON} />
                <button onClick={handleExportJSON} className="text-white hover:bg-white/10 px-3 py-2 transition flex gap-2 items-center text-xs font-bold bg-transparent border border-white/30 rounded" title="Guardar"><Save size={16}/> <span className="hidden sm:inline">Guardar</span></button>
                <button onClick={() => setShowPreview(true)} className="text-white hover:bg-white/10 px-3 py-2 transition flex gap-2 items-center text-xs font-bold bg-transparent border border-white/30 rounded" title="Ver PDF"><Eye size={16}/> <span className="hidden sm:inline">Ver PDF</span></button>
                <button onClick={handleResetForm} className="text-gray-400 hover:text-red-500 p-2 transition" title="Borrar todo"><Trash2 size={18}/></button>
            </div>
          </div>

          {/* Progress Bar (3 Pasos) */}
          <div className="w-full bg-[#162a45] h-1 border-t border-b border-white/10">
            <div className="bg-white h-1 transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>

          <div className={THEME.stepCard}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <div className="mt-10 flex justify-between pt-6 border-t border-white/20 w-full">
                <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${step === 1 ? 'opacity-0 cursor-default' : 'bg-[#162a45] text-white hover:bg-[#1f385c] border border-gray-600'}`}><ChevronLeft size={20} /> Anterior</button>
                {step < 3 ? (
                    <button onClick={() => setStep(s => Math.min(3, s + 1))} className="flex items-center gap-2 bg-white text-[#0b1d33] px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition shadow-lg hover:shadow-xl">Siguiente <ChevronRight size={20} /></button>
                ) : (
                    <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 bg-white text-[#0b1d33] px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition shadow-lg hover:shadow-xl animate-pulse"><Save size={20} /> Ver Informe y Exportar</button>
                )}
            </div>
          </div>
           
          <p className="mt-6 text-gray-500 text-sm text-center">Instituto Fisio Virtual &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}