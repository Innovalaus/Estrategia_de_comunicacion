import React, { useState } from 'react';
import { Target, Download, ChevronRight, ChevronLeft, MessageSquare, Megaphone, CheckCircle, ShieldAlert, Lightbulb, Eye, EyeOff, Info, Users } from 'lucide-react';
import innovalausLogo from './assets/innovalaus-logo.png';

const BELIEF_TYPES = ['conductual', 'normativa', 'control'];

const BELIEFS_PER_SECTION = 3;
const createEmptyBeliefs = () => BELIEF_TYPES.flatMap((type, typeIndex) =>
  Array.from({ length: BELIEFS_PER_SECTION }, (_, index) => ({
    id: typeIndex * BELIEFS_PER_SECTION + index + 1,
    type,
    idea: '',
    method: ''
  }))
);

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
  appBg: "bg-[#3D6F9F]",
  pageBg: "bg-gray-100",
  text: "text-white",
  textMuted: "text-gray-300",
  inputBg: "bg-white",
  inputText: "text-gray-900",
  accent: "white", 
  accentBorder: "border-white",
  mainWrapper: "min-h-screen w-full flex flex-col items-center py-10 px-4 sm:px-6 bg-gray-100 font-sans",
  contentContainer: "w-full max-w-5xl flex flex-col gap-0", 
  stepCard: "w-full bg-[#3D6F9F] p-8 rounded-b-xl shadow-2xl min-h-[600px] border-t-0 border border-white/10",
};

// --- COMPONENTES UI ---

const SectionTitle = ({ title, icon: Icon, subtitle }) => (
  <div className={`mb-6 border-b-2 ${THEME.accentBorder} pb-2 w-full flex justify-between items-end`}>
    <div className="flex items-center gap-3">
      <div className={`bg-white p-2 rounded-lg text-[#3D6F9F]`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <h2 className={`text-2xl font-bold ${THEME.text} uppercase tracking-tight`}>{title}</h2>
        {subtitle && <p className={`text-sm ${THEME.textMuted} mt-1`}>{subtitle}</p>}
      </div>
    </div>
  </div>
);

const InputField = ({ label, value, onChange, placeholder, type = "text", multiline = false, rows = 3, required = false }) => (
  <div className="mb-4 w-full">
    <label className={`block text-sm font-bold ${THEME.text} mb-1 uppercase text-xs tracking-wider opacity-90`}>{label}{required && ' *'}</label>
    {multiline ? (
      <textarea
        className={`w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all outline-none ${THEME.inputBg} ${THEME.inputText}`}
        rows={rows}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    ) : (
      <input
        type={type}
        required={required}
        className={`w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all outline-none ${THEME.inputBg} ${THEME.inputText}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </div>
);

// --- COMPONENTE HELPER PARA RENDERIZAR BLOQUES DE CREENCIAS ---
const BeliefGroup = ({ title, description, example, questionLabel, responseLabel, questionExample, responseExample, colorClass, icon: Icon, items, onChange }) => (
  <div className={`mb-6 rounded-lg overflow-hidden border border-${colorClass}-500/30`}>
      <div className={`bg-${colorClass}-900/40 p-3 border-b border-${colorClass}-500/30 flex justify-between items-center gap-2`}>
          <div className="flex items-center gap-2">
            <Icon size={18} className={`text-${colorClass}-400`} />
            <h3 className={`text-${colorClass}-300 font-bold text-sm uppercase tracking-wide`}>{title}</h3>
          </div>
          <span className="text-xs font-semibold text-white/80">3 filas obligatorias</span>
      </div>
      <div className="bg-[#315C84] p-4 sm:p-5">
        <div className="mb-6 space-y-2 text-base leading-relaxed text-white/90">
          <p><strong className="text-white">Qué debes explicar:</strong> {description}</p>
          <p><strong className="text-white">Ejemplo:</strong> {example}</p>
        </div>
        <div className="space-y-6">
          {items.map((belief, i) => (
              <div key={belief.id} className="flex flex-col md:flex-row gap-4 items-start relative group animate-fade-in">
                  <div className={`bg-white/10 text-white font-bold px-3 py-1 rounded text-xs mt-1 w-fit flex items-center gap-2`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField 
                          label={questionLabel}
                          required
                          value={belief.idea} 
                          onChange={v => onChange(belief.id, 'idea', v)} 
                          placeholder={questionExample}
                      />
                      <InputField 
                          label={responseLabel}
                          required
                          value={belief.method} 
                          onChange={v => onChange(belief.id, 'method', v)} 
                          placeholder={responseExample}
                      />
                  </div>
              </div>
          ))}
        </div>
      </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
   
  // ESTADO MODAL
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    message: ''
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

    // SECCIÓN 2: PERFIL PSICOLÓGICO DEL CLIENTE IDEAL
    avatar_decision_maker: "",
    avatar_problem: "",
    avatar_fear: "",
    avatar_desire: "",
    avatar_objection: "",
    avatar_words: "",

    // SECCIÓN 3: MENSAJES PARA REDES
    nightmares: ["", "", ""],
    dreams: ["", "", ""],
    credibility: "", 
    message1: "", 
    message2: "", 
    message3: "", 

    // SECCIÓN 4: MAPA DEL CLIENTE IDEAL
    beliefs: createEmptyBeliefs()
  });

  // --- HELPERS ---
  const showAlert = (message) => setModalConfig({ isOpen: true, message });
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
   
  const constructSentence = (data) => {
      let parts = ["Ayudo"];
      if (data.puv_show_avatar) parts.push(`a ${data.puv_avatar || '[tipo de empresa]'}`);
      if (data.puv_show_benefit) parts.push(`a ${data.puv_benefit || '[objetivo de financiación]'}`);
      if (data.puv_show_objection) parts.push(`sin ${data.puv_objection || '[barrera principal]'}`);
      if (data.puv_show_system) parts.push(`con ${data.puv_system || '[servicio de gestión]'}`);
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

  // --- LÓGICA DE CREENCIAS ---

  const handleBeliefChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      beliefs: prev.beliefs.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };

  const openPreview = () => {
    const incomplete = formData.beliefs.find(b => !b.idea.trim() || !b.method.trim());
    if (incomplete) {
      setStep(4);
      const section = incomplete.type === 'conductual' ? 'Miedos y problemas' : incomplete.type === 'normativa' ? 'Motivaciones y deseos' : 'Barreras y soluciones';
      const row = formData.beliefs.filter(b => b.type === incomplete.type).findIndex(b => b.id === incomplete.id) + 1;
      showAlert(`Completa los dos campos de la fila ${row} en «${section}» antes de ver el informe.`);
      return;
    }
    setShowPreview(true);
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
        <div className="bg-[#3D6F9F] text-white p-6 rounded-xl w-full max-w-sm shadow-2xl border border-white/20">
           <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
             <MessageSquare className="text-slate-200" size={24} /> 
             <h3 className="text-lg font-bold">Aviso</h3>
           </div>
           <p className="text-gray-300 mb-6 text-sm">{modalConfig.message}</p>
           <div className="flex justify-end gap-3">
             <button onClick={closeModal} className="bg-white text-[#3D6F9F] px-6 py-2 rounded-lg font-bold hover:bg-gray-200 text-sm">Aceptar</button>
           </div>
        </div>
      </div>
    );
  };

  // --- SECCIONES / PASOS ---

  const renderStep1 = () => (
    <div className="animate-fade-in w-full">
      <SectionTitle title="1. Propuesta de valor" icon={Target} subtitle="Define a qué empresas ayudáis, para qué proyectos y cómo gestionáis sus ayudas." />
       
      <div className="mb-6 bg-blue-900/20 border border-blue-500/20 p-3 rounded-lg flex items-center gap-3 text-sm text-blue-200">
          <Eye size={18} className="text-blue-300 shrink-0" />
          <p>Marca o desmarca el icono del ojo en cada bloque para que aparezca o no en tu Propuesta Única de Valor.</p>
      </div>

      <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AVATAR */}
              <div className={`bg-[#315C84] p-5 rounded-lg border transition-all duration-300 ${formData.puv_show_avatar ? 'border-white/10 opacity-100' : 'border-white/5 opacity-50'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-blue-300 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">Ayudo a...</h3>
                    <button onClick={() => togglePuvPart('puv_show_avatar')} className="text-gray-400 hover:text-white">
                        {formData.puv_show_avatar ? <Eye size={18}/> : <EyeOff size={18}/>}
                    </button>
                  </div>
                  {formData.puv_show_avatar && (
                    <>
                        <InputField label="¿Qué empresas y proyectos atendéis?" value={formData.puv_avatar} onChange={v => handlePuvChange('puv_avatar', v)} placeholder="Ej: pymes industriales con proyectos de inversión o innovación" />
                        <p className="text-xs text-gray-400 mt-[-10px]">Concreta tamaño, sector, ubicación o tipo de proyecto si son relevantes.</p>
                    </>
                  )}
              </div>

              {/* BENEFICIO */}
              <div className={`bg-[#315C84] p-5 rounded-lg border transition-all duration-300 ${formData.puv_show_benefit ? 'border-white/10 opacity-100' : 'border-white/5 opacity-50'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-green-300 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">A conseguir...</h3>
                    <button onClick={() => togglePuvPart('puv_show_benefit')} className="text-gray-400 hover:text-white">
                        {formData.puv_show_benefit ? <Eye size={18}/> : <EyeOff size={18}/>}
                    </button>
                  </div>
                  {formData.puv_show_benefit && (
                      <>
                        <InputField label="¿Qué objetivo de financiación les ayudáis a perseguir?" value={formData.puv_benefit} onChange={v => handlePuvChange('puv_benefit', v)} placeholder="Ej: identificar ayudas adecuadas y presentar solicitudes sólidas para financiar sus proyectos" />
                        <p className="text-xs text-gray-400 mt-[-10px]">Describe el resultado que buscáis facilitar, sin garantizar la concesión.</p>
                      </>
                  )}
              </div>

              {/* OBJECIÓN */}
              <div className={`bg-[#315C84] p-5 rounded-lg border transition-all duration-300 ${formData.puv_show_objection ? 'border-white/10 opacity-100' : 'border-white/5 opacity-50'}`}>
                    <div className="flex justify-between items-center mb-3">
                    <h3 className="text-red-300 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">Sin...</h3>
                    <button onClick={() => togglePuvPart('puv_show_objection')} className="text-gray-400 hover:text-white">
                        {formData.puv_show_objection ? <Eye size={18}/> : <EyeOff size={18}/>}
                    </button>
                  </div>
                  {formData.puv_show_objection && (
                      <>
                        <InputField label="¿Qué carga o dificultad les ayudáis a evitar?" value={formData.puv_objection} onChange={v => handlePuvChange('puv_objection', v)} placeholder="Ej: perder tiempo interpretando bases y coordinando trámites en solitario" />
                        <p className="text-xs text-gray-400 mt-[-10px]">Piensa en plazos, documentación, requisitos y recursos internos.</p>
                      </>
                  )}
              </div>

              {/* SISTEMA */}
              <div className={`bg-[#315C84] p-5 rounded-lg border transition-all duration-300 ${formData.puv_show_system ? 'border-white/10 opacity-100' : 'border-white/5 opacity-50'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-yellow-300 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">Con...</h3>
                    <button onClick={() => togglePuvPart('puv_show_system')} className="text-gray-400 hover:text-white">
                        {formData.puv_show_system ? <Eye size={18}/> : <EyeOff size={18}/>}
                    </button>
                  </div>
                  {formData.puv_show_system && (
                      <>
                        <InputField label="¿Cómo gestionáis el proceso?" value={formData.puv_system} onChange={v => handlePuvChange('puv_system', v)} placeholder="Ej: un acompañamiento desde la búsqueda de ayudas hasta la justificación" />
                        <p className="text-xs text-gray-400 mt-[-10px]">Explica vuestro trabajo real: análisis, solicitud, seguimiento y justificación.</p>
                      </>
                  )}
              </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-[#5182AE] to-[#315C84] p-6 rounded-xl border border-white/20 shadow-lg text-center relative overflow-hidden">
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
      <SectionTitle title="2. Psicología del cliente ideal" icon={Users} subtitle="Describe a la persona que decide o influye en la contratación, además de la empresa a la que representa." />
      <div className="bg-white/5 p-4 rounded mb-6 text-sm text-gray-200 border border-white/10 flex items-center gap-3">
        <Info size={20} className="shrink-0 text-blue-200" />
        <p>Escribe situaciones y frases concretas que hayas escuchado en reuniones, consultas o mensajes. Si aún son hipótesis, podrás contrastarlas con clientes reales antes de usarlas en redes.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[#315C84] p-5 rounded-lg">
          <InputField multiline rows={3} label="¿Quién busca o aprueba la ayuda dentro de la empresa?" value={formData.avatar_decision_maker} onChange={v => handleInputChange('avatar_decision_maker', v)} placeholder="Ej: dirección general, finanzas o responsable de innovación de una pyme" />
          <p className="text-xs text-gray-200">Indica cargo, responsabilidades y qué le importa al decidir.</p>
        </div>
        <div className="bg-[#315C84] p-5 rounded-lg">
          <InputField multiline rows={3} label="¿Qué problema concreto vive ahora?" value={formData.avatar_problem} onChange={v => handleInputChange('avatar_problem', v)} placeholder="Ej: quiere invertir en maquinaria, pero desconoce qué ayudas encajan y cuándo solicitar" />
          <p className="text-xs text-gray-200">Describe una situación visible, no una categoría genérica.</p>
        </div>
        <div className="bg-[#315C84] p-5 rounded-lg">
          <InputField multiline rows={3} label="¿Qué teme perder o que salga mal?" value={formData.avatar_fear} onChange={v => handleInputChange('avatar_fear', v)} placeholder="Ej: dedicar semanas a una solicitud inviable o tener que devolver una ayuda por errores" />
          <p className="text-xs text-gray-200">Piensa en dinero, tiempo, reputación y carga administrativa.</p>
        </div>
        <div className="bg-[#315C84] p-5 rounded-lg">
          <InputField multiline rows={3} label="¿Qué quiere conseguir de verdad?" value={formData.avatar_desire} onChange={v => handleInputChange('avatar_desire', v)} placeholder="Ej: financiar una inversión sin frenar la actividad ni desbordar al equipo" />
          <p className="text-xs text-gray-200">Incluye el objetivo empresarial y cómo espera sentirse al lograrlo.</p>
        </div>
        <div className="bg-[#315C84] p-5 rounded-lg">
          <InputField multiline rows={3} label="¿Qué le frena para pedir ayuda externa?" value={formData.avatar_objection} onChange={v => handleInputChange('avatar_objection', v)} placeholder="Ej: duda si el coste de la consultoría compensa o cree que puede hacerlo internamente" />
          <p className="text-xs text-gray-200">Anota objeciones reales, no respuestas que te gustaría que diera.</p>
        </div>
        <div className="bg-[#315C84] p-5 rounded-lg">
          <InputField multiline rows={3} label="¿Cómo expresa el problema con sus propias palabras?" value={formData.avatar_words} onChange={v => handleInputChange('avatar_words', v)} placeholder="Ej: «No sé si mi proyecto encaja» o «No tenemos tiempo para revisar todas las bases»" />
          <p className="text-xs text-gray-200">Estas frases pueden convertirse en titulares y preguntas para redes.</p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-fade-in w-full">
      <SectionTitle title="3. Mensajes para redes" icon={Megaphone} subtitle="Transforma lo que piensa el cliente ideal en contenido que le ayude a reconocer su problema y valorar una solución." />
      <div className="grid grid-cols-1 gap-6 w-full">
        <div className="bg-[#315C84] p-6 rounded-lg border border-green-500/30 w-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle size={64} className="text-green-500"/></div>
              <h3 className="font-bold text-green-400 mb-2 flex items-center gap-2 text-lg">Mensaje 1: Haz visible su problema</h3>
              <p className="text-xs text-gray-200 mb-4">¿Qué situación reconocerá al instante la persona decisora? Usa un síntoma o una frase del paso 2.</p>
              <InputField multiline rows={4} label="¿Qué le dirías en una publicación?" value={formData.message1} onChange={v => handleInputChange('message1', v)} placeholder="Tienes un proyecto de inversión, pero no sabes qué convocatorias encajan ni por dónde empezar..." />
        </div>
        <div className="bg-[#315C84] p-6 rounded-lg border border-red-500/30 w-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert size={64} className="text-red-500"/></div>
              <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2 text-lg">Mensaje 2: Responde a su miedo</h3>
              <p className="text-xs text-gray-200 mb-4">¿Qué le preocupa de los plazos, la elegibilidad, el esfuerzo o la justificación? Reconoce el riesgo sin exagerarlo.</p>
              <InputField multiline rows={4} label="¿Cómo abordarías esa preocupación?" value={formData.message2} onChange={v => handleInputChange('message2', v)} placeholder="Antes de invertir horas en una solicitud, revisa los requisitos y la documentación necesaria..." />
        </div>
        <div className="bg-[#315C84] p-6 rounded-lg border border-yellow-500/30 w-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Lightbulb size={64} className="text-yellow-500"/></div>
              <h3 className="font-bold text-yellow-400 mb-2 flex items-center gap-2 text-lg">Mensaje 3: Muestra una solución posible</h3>
              <p className="text-xs text-gray-200 mb-4">¿Qué paso concreto puede dar y en qué parte del proceso le acompañáis? Evita garantizar la concesión.</p>
              <InputField multiline rows={4} label="¿Qué camino le propondrías?" value={formData.message3} onChange={v => handleInputChange('message3', v)} placeholder="Podemos analizar tu proyecto, localizar ayudas aplicables y preparar contigo una solicitud completa..." />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="animate-fade-in w-full">
      <SectionTitle 
        title="4. Mapa visual del cliente ideal" 
        icon={SpinningTopIcon} 
        subtitle="Relaciona lo que vive y piensa tu cliente con la ayuda que realmente necesita." 
      />
       
      <div className="bg-white/5 p-4 rounded mb-6 text-sm text-gray-300 border border-white/10 flex items-center gap-3">
        <Info size={20} className="shrink-0 text-blue-300" />
        <p>Completa tres ejemplos concretos en cada bloque. Piensa en una persona real que decide sobre las subvenciones: qué problema vive, qué teme, qué busca y qué necesita oír para confiar. Escribe sus palabras, no solo la descripción del servicio.</p>
      </div>

      <BeliefGroup 
        title="Miedos y problemas"
        description="Describe una situación concreta que vive la persona responsable, qué consecuencia teme y cómo lo cuenta. Escribe desde su perspectiva, con un miedo distinto en cada fila."
        example="Quiere invertir en maquinaria, pero teme dedicar semanas a una solicitud para la que su empresa no cumple los requisitos."
        questionLabel="¿Qué problema o miedo tiene?"
        responseLabel="¿Cómo lo vive o lo expresa?"
        questionExample="Ej: desconoce qué ayudas encajan con su proyecto"
        responseExample="Ej: «No quiero invertir tiempo en una solicitud que no cumple los requisitos»"
        colorClass="blue"
        icon={ShieldAlert}
        items={formData.beliefs.filter(b => b.type === 'conductual')} 
        onChange={handleBeliefChange}
      />

      <BeliefGroup 
        title="Motivaciones y deseos"
        description="Explica qué quiere lograr para su empresa y qué necesita saber antes de contratar ayuda externa. Piensa en el resultado práctico y en su criterio de decisión: tiempo, coste, claridad o tranquilidad."
        example="Quiere financiar una inversión sin sobrecargar al equipo y necesita entender el alcance y el coste del servicio."
        questionLabel="¿Qué quiere conseguir?"
        responseLabel="¿Qué necesita para decidir?"
        questionExample="Ej: financiar una inversión sin paralizar al equipo"
        responseExample="Ej: entender costes, plazos y posibilidades reales antes de contratar"
        colorClass="purple"
        icon={Target}
        items={formData.beliefs.filter(b => b.type === 'normativa')} 
        onChange={handleBeliefChange}
      />

      <BeliefGroup 
        title="Barreras y soluciones"
        description="Identifica qué le impide iniciar o completar la solicitud. Después explica una ayuda concreta de INNOVALAUS y qué mostrarías en redes para respaldarla. Evita prometer la concesión de la ayuda."
        example="No sabe si su proyecto es elegible; puedes explicar el análisis previo de requisitos y mostrar una lista de comprobación."
        questionLabel="¿Qué barrera le impide avanzar?"
        responseLabel="¿Qué solución y prueba le ofreceréis?"
        questionExample="Ej: no sabe si su proyecto cumple los requisitos"
        responseExample="Ej: explicar el análisis previo de elegibilidad y mostrar una lista de comprobación"
        colorClass="green"
        icon={Lightbulb}
        items={formData.beliefs.filter(b => b.type === 'control')} 
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
                .pdf-header { background-color: #3D6F9F; color: white; padding: 20px; margin-bottom: 30px; }
                .pdf-table { width: 100%; border-collapse: collapse; font-size: 12px; }
                .pdf-table th { background-color: #3D6F9F; color: white; padding: 8px; text-align: left; }
                .pdf-table td { border: 1px solid #e5e7eb; padding: 10px; vertical-align: top; word-wrap: break-word; }
                .pdf-table tr { page-break-inside: avoid; }
                .pdf-box { border: 1px solid #e5e7eb; padding: 15px; border-radius: 5px; background-color: #f9fafb; margin-bottom: 15px; page-break-inside: avoid; }
                .pdf-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: white; text-transform: uppercase; }
                .badge-conductual { background-color: #3b82f6; }
                .badge-normativa { background-color: #a855f7; }
                .badge-control { background-color: #22c55e; }
            `}</style>
            
            <div className="fixed top-4 right-4 flex gap-2 z-50 no-print">
                <button onClick={exportPDF} disabled={generatingPDF} className="bg-[#3D6F9F] hover:bg-[#315C84] text-white px-4 py-2 rounded shadow font-bold flex items-center gap-2 border border-white disabled:opacity-50">
                    {generatingPDF ? <span className="animate-spin">⌛</span> : <Download size={18} />} {generatingPDF ? "Generando..." : "PDF"}
                </button>
                <button onClick={() => setShowPreview(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-300">Editar</button>
            </div>

            <div id="printable-area" className="bg-white text-gray-800 font-sans w-full h-full pb-10">
                {/* Header PDF */}
                <div className="pdf-header flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-widest">Estrategia de Comunicación</h1>
                        <p className="text-sm text-gray-300 mt-1">Cliente ideal, psicología, mensajes y mapa final</p>
                    </div>
                    <img src={innovalausLogo} alt="Logo de INNOVALAUS" className="w-16 h-16 rounded-md bg-white object-contain" />
                </div>

                <div className="px-12 py-6">
                    {/* SECCIÓN 1: PUV */}
                    <div className="pdf-section">
                        <h2 className="text-[#3D6F9F] font-bold text-lg border-b-2 border-[#3D6F9F] pb-2 mb-4 uppercase">1. Propuesta de valor</h2>
                        <div className="pdf-box border-l-4 border-l-[#3D6F9F] bg-[#3D6F9F]/5 mt-6">
                            <h3 className="text-xs font-bold text-[#3D6F9F] uppercase mb-2">Propuesta Única de Valor (PUV)</h3>
                            <p className="text-lg italic font-medium text-[#3D6F9F]">"{formData.puvSentence || "Completa el paso 1 para ver tu promesa aquí."}"</p>
                        </div>
                    </div>

                    {/* SECCIÓN 2: PSICOLOGÍA DEL CLIENTE IDEAL */}
                    <div className="pdf-section">
                        <h2 className="text-[#3D6F9F] font-bold text-lg border-b-2 border-[#3D6F9F] pb-2 mb-4 uppercase">2. Psicología del cliente ideal</h2>
                        {[
                          ['Quién decide o influye', formData.avatar_decision_maker],
                          ['Problema actual', formData.avatar_problem],
                          ['Miedos y riesgos percibidos', formData.avatar_fear],
                          ['Deseo y objetivo', formData.avatar_desire],
                          ['Objeción a contratar ayuda externa', formData.avatar_objection],
                          ['Palabras que utiliza', formData.avatar_words]
                        ].map(([label, value]) => (
                          <div key={label} className="pdf-box mb-3">
                            <strong className="text-[#3D6F9F] block mb-1 uppercase text-sm">{label}</strong>
                            <p className="text-sm whitespace-pre-line text-gray-700">{value || 'Sin completar'}</p>
                          </div>
                        ))}
                    </div>

                    {/* SECCIÓN 3: MENSAJES PARA REDES */}
                    <div className="pdf-section">
                        <h2 className="text-[#3D6F9F] font-bold text-lg border-b-2 border-[#3D6F9F] pb-2 mb-4 uppercase">3. Mensajes para redes</h2>
                        <div className="pdf-box border-l-4 border-l-green-500 mb-4">
                            <strong className="text-green-700 block mb-1 uppercase text-sm">Mensaje 1: Problema que reconoce</strong>
                            <p className="text-sm whitespace-pre-line text-gray-700">{formData.message1}</p>
                        </div>
                        <div className="pdf-box border-l-4 border-l-red-500 mb-4">
                            <strong className="text-red-700 block mb-1 uppercase text-sm">Mensaje 2: Miedo que hay que abordar</strong>
                            <p className="text-sm whitespace-pre-line text-gray-700">{formData.message2}</p>
                        </div>
                        <div className="pdf-box border-l-4 border-l-yellow-500">
                            <strong className="text-yellow-700 block mb-1 uppercase text-sm">Mensaje 3: Camino hacia la solución</strong>
                            <p className="text-sm whitespace-pre-line text-gray-700">{formData.message3}</p>
                        </div>
                    </div>

                    {/* SECCIÓN 4: MAPA DEL CLIENTE IDEAL */}
                    <div className="pdf-section">
                        <h2 className="text-[#3D6F9F] font-bold text-lg border-b-2 border-[#3D6F9F] pb-2 mb-4 uppercase">4. Mapa del cliente ideal</h2>
                        <table className="pdf-table">
                            <thead>
                                <tr>
                                    <th style={{width: '5%'}}>#</th>
                                    <th style={{width: '20%'}}>Bloque</th>
                                    <th style={{width: '37.5%'}}>Lo que vive o necesita</th>
                                    <th style={{width: '37.5%'}}>Cómo lo expresa o cómo responder</th>
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
                                                {b.type === 'conductual' ? 'Miedos' : b.type === 'normativa' ? 'Motivaciones' : 'Barreras'}
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
                        INNOVALAUS &copy; {new Date().getFullYear()}
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
          <div className="w-full bg-[#3D6F9F] p-6 rounded-t-xl border-b border-white/20 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                 <img src={innovalausLogo} alt="Logo de INNOVALAUS" className="w-20 h-20 rounded-lg bg-white object-contain shrink-0" />
                 <div className="flex flex-col">
                    <h1 className="text-xl font-bold tracking-tight text-white uppercase">ESTRATEGIA DE COMUNICACIÓN</h1>
                    <span className="text-xs tracking-widest text-gray-300">INNOVALAUS</span>
                 </div>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
                <button onClick={openPreview} className="text-white hover:bg-white/10 px-3 py-2 transition flex gap-2 items-center text-xs font-bold bg-transparent border border-white/30 rounded" title="Ver PDF"><Eye size={16}/> <span className="hidden sm:inline">Ver PDF</span></button>
            </div>
          </div>

          {/* Progress Bar (4 Pasos) */}
          <div className="w-full bg-[#315C84] h-1 border-t border-b border-white/10">
            <div className="bg-white h-1 transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${(step / 4) * 100}%` }}></div>
          </div>

          <div className={THEME.stepCard}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            <div className="mt-10 flex justify-between pt-6 border-t border-white/20 w-full">
                <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${step === 1 ? 'opacity-0 cursor-default' : 'bg-[#315C84] text-white hover:bg-[#274F75] border border-gray-600'}`}><ChevronLeft size={20} /> Anterior</button>
                {step < 4 ? (
                    <button onClick={() => setStep(s => Math.min(4, s + 1))} className="flex items-center gap-2 bg-white text-[#3D6F9F] px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition shadow-lg hover:shadow-xl">Siguiente <ChevronRight size={20} /></button>
                ) : (
                    <button onClick={openPreview} className="flex items-center gap-2 bg-white text-[#3D6F9F] px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition shadow-lg hover:shadow-xl animate-pulse"><Eye size={20} /> Ver Informe y Exportar</button>
                )}
            </div>
          </div>
           
          <p className="mt-6 text-gray-500 text-sm text-center">INNOVALAUS &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
