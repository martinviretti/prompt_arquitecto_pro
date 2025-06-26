// script.js for Prompt Architect v6

// --- ANIMACIÓN DE PARTÍCULAS (SIN CAMBIOS) ---
const particlesCanvas = document.getElementById('particles-js');
if (particlesCanvas) {
    const ctx = particlesCanvas.getContext('2d');
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
    let neurons = [];
    const connectionDistance = 200;
    const pulseSpeed = 0.05;
    class Neuron {
        constructor(x, y) { this.x = x; this.y = y; this.radius = Math.random() * 2 + 1; this.color = `rgba(167, 139, 250, ${Math.random() * 0.5 + 0.2})`; this.connections = []; }
        draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill(); }
    }
    class Connection {
        constructor(from, to) { this.from = from; this.to = to; this.pulsePosition = Math.random(); this.pulseDirection = Math.random() > 0.5 ? 1 : -1; }
        draw() {
            ctx.beginPath(); ctx.moveTo(this.from.x, this.from.y); ctx.lineTo(this.to.x, this.to.y); ctx.strokeStyle = `rgba(196, 181, 253, 0.1)`; ctx.stroke();
            const pulseX = this.from.x + (this.to.x - this.from.x) * this.pulsePosition; const pulseY = this.from.y + (this.to.y - this.from.y) * this.pulsePosition;
            ctx.beginPath(); ctx.arc(pulseX, pulseY, 2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctx.fill();
        }
        update() { this.pulsePosition += pulseSpeed * this.pulseDirection; if (this.pulsePosition > 1 || this.pulsePosition < 0) { this.pulseDirection *= -1; } this.draw(); }
    }
    function initNeurons() {
        neurons = []; let numberOfNeurons = (particlesCanvas.width * particlesCanvas.height) / 12000;
        for (let i = 0; i < numberOfNeurons; i++) { neurons.push(new Neuron(Math.random() * particlesCanvas.width, Math.random() * particlesCanvas.height)); }
        for (let i = 0; i < neurons.length; i++) {
            for (let j = i + 1; j < neurons.length; j++) {
                const dx = neurons[i].x - neurons[j].x; const dy = neurons[i].y - neurons[j].y; const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < connectionDistance) { neurons[i].connections.push(new Connection(neurons[i], neurons[j])); }
            }
        }
    }
    function animateNetwork() { requestAnimationFrame(animateNetwork); ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height); for (const neuron of neurons) { neuron.draw(); for (const connection of neuron.connections) { connection.update(); } } }
    window.addEventListener('resize', () => { particlesCanvas.width = window.innerWidth; particlesCanvas.height = window.innerHeight; initNeurons(); });
    initNeurons();
    animateNetwork();
}


document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DE LA UI ---
    const ui = {
        loginScreen: document.getElementById('login-screen'),
        appContainer: document.getElementById('app-container'),
        enterBtn: document.getElementById('enter-btn'),
        projectSelector: document.getElementById('project-selector'),
        saveBtn: document.getElementById('save-btn'),
        deleteBtn: document.getElementById('delete-btn'),
        archetypeRadios: document.querySelectorAll('input[name="appArchetype"]'),
        complexityRadios: document.querySelectorAll('input[name="appComplexity"]'),
        contentDepthSlider: document.getElementById('content-depth'),
        temaCentral: document.getElementById('tema-central'),
        audiencia: document.getElementById('audiencia'),
        tono: document.getElementById('tono'),
        structureMethodRadios: document.querySelectorAll('input[name="structureMethod"]'),
        subtemasContainerAi: document.getElementById('subtemas-container-ai'),
        subtemasContainerManual: document.getElementById('subtemas-container-manual'),
        addSubtemaBtn: document.getElementById('add-subtema-btn'),
        recommendationArea: document.getElementById('recommendation-area'),
        externalDocsRadios: document.querySelectorAll('input[name="useExternalDocs"]'),
        referenceMaterialSection: document.getElementById('reference-material-section'),
        referenceMaterialInput: document.getElementById('reference-material-input'),
        outputPrompt: document.getElementById('output-prompt'),
        copyBtn: document.getElementById('copy-btn'),
        analyzeBtn: document.getElementById('analyze-btn'),
        analysisModal: document.getElementById('analysis-modal'),
        analysisContent: document.getElementById('analysis-content'),
        closeModalBtn: document.getElementById('close-modal-btn'),
    };

    // --- ESTADO GLOBAL DE LA APLICACIÓN ---
    let state = {};
    const getNewState = () => ({
        id: `proj_${Date.now()}`,
        name: "Nuevo Proyecto Sin Título",
        lastModified: new Date().toISOString(),
        appArchetype: 'tutorial',
        appComplexity: 'Intermedia',
        contentDepth: '2',
        temaCentral: '',
        audiencia: '',
        tono: 'Lúdico e infantil',
        structureMethod: 'ai',
        subtemas: [],
        recommendedModel: {},
        useExternalDocs: 'no',
        referenceMaterial: '',
    });

    // --- LÓGICA DE GESTIÓN DE PROYECTOS (localStorage) ---
    const projectManager = {
        storageKey: 'promptArchitectProjects',
        getProjects: function() {
            try {
                const projects = localStorage.getItem(this.storageKey);
                return projects ? JSON.parse(projects) : this.getInitialTemplates();
            } catch (e) {
                console.error("Error loading projects:", e);
                return this.getInitialTemplates();
            }
        },
        saveProjects: function(projects) {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(projects));
            } catch (e) {
                console.error("Error saving projects:", e);
            }
        },
        saveCurrentState: function() {
            const projectName = prompt("Guardar proyecto como:", state.name);
            if (!projectName) return; // User cancelled

            state.name = projectName;
            state.lastModified = new Date().toISOString();
            
            let projects = this.getProjects();
            const projectIndex = projects.findIndex(p => p.id === state.id);

            if (projectIndex > -1) {
                projects[projectIndex] = state; // Update existing
            } else {
                projects.push(state); // Add new
            }
            this.saveProjects(projects);
            populateProjectSelector(); // Refresh selector
            ui.projectSelector.value = state.id;
            alert("Proyecto guardado exitosamente!");
        },
        deleteProject: function(projectId) {
            if (!confirm("¿Estás seguro de que quieres borrar este proyecto? Esta acción no se puede deshacer.")) return;
            let projects = this.getProjects();
            const updatedProjects = projects.filter(p => p.id !== projectId);
            this.saveProjects(updatedProjects);
            loadState(); // Load default or first project
        },
        getInitialTemplates: function() {
            // Biblioteca de prompts para onboarding
            return [
                { id: `proj_tpl_1`, name: "Plantilla: Curso de Python", lastModified: new Date().toISOString(), appArchetype: 'tutorial', appComplexity: 'Intermedia', contentDepth: '2', temaCentral: 'Introducción a Python para principiantes', audiencia: 'Estudiantes sin experiencia en programación', tono: 'Profesional y claro', structureMethod: 'ai', subtemas: [], recommendedModel: {}, useExternalDocs: 'no', referenceMaterial: '' },
                { id: `proj_tpl_2`, name: "Plantilla: Juego del Sistema Solar", lastModified: new Date().toISOString(), appArchetype: 'juego', appComplexity: 'Avanzada', contentDepth: '2', temaCentral: 'Exploración del Sistema Solar', audiencia: 'Niños de 8 a 12 años', tono: 'Lúdico e infantil', structureMethod: 'ai', subtemas: [], recommendedModel: {}, useExternalDocs: 'no', referenceMaterial: '' },
            ];
        }
    };

    // --- COMUNICACIÓN CON API (PROXY SEGURO) ---
    const api = {
        generate: async function(prompt) {
            try {
                // IMPORTANT: In a real deployment, this URL should point to your deployed serverless function.
                // For local testing, it would point to your local serverless function endpoint.
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });
                if (!response.ok) {
                    throw new Error(`API Error: ${response.statusText}`);
                }
                const data = await response.json();
                return data.text;
            } catch (error) {
                console.error("Failed to call generation API:", error);
                alert("Error: No se pudo comunicar con la IA. Revisa la consola para más detalles.");
                return null;
            }
        },
        getSubtopics: async function() {
            if (!state.temaCentral || !state.audiencia) return;
            setLoading(ui.subtemasContainerAi, true);
            const prompt = `Eres un diseñador instruccional experto. Basado en el tema central '${state.temaCentral}' para una audiencia de '${state.audiencia}', genera un array JSON con 4 a 5 subtemas o módulos lógicos y ordenados para una aplicación educativa. La salida debe ser únicamente el array JSON, sin texto adicional ni markdown. Ejemplo de salida: ["Introducción", "Conceptos Clave", "Ejemplos Prácticos", "Conclusión"]`;
            const result = await this.generate(prompt);
            setLoading(ui.subtemasContainerAi, false);
            if (result) {
                try {
                    // Clean the result to ensure it's valid JSON
                    const cleanedResult = result.match(/\[.*\]/s)[0];
                    state.subtemas = JSON.parse(cleanedResult);
                    renderUI();
                } catch (e) {
                    console.error("Failed to parse subtopics JSON:", e, "Raw result:", result);
                    state.subtemas = ["Error al generar subtemas."];
                    renderUI();
                }
            }
        },
        getPedagogy: async function() {
            if (!state.temaCentral || !state.audiencia) return;
            setLoading(ui.recommendationArea, true);
            const prompt = `Eres un experto en ciencias del aprendizaje. Analiza el siguiente concepto de aplicación: Tema: '${state.temaCentral}', Audiencia: '${state.audiencia}'. Recomienda el modelo pedagógico más efectivo (ej. 'Aprendizaje Basado en Proyectos'). Proporciona tu respuesta como un objeto JSON con dos claves: "model" (el nombre del modelo) y "justification" (una breve explicación de 1-2 frases sobre por qué este modelo es adecuado). La salida debe ser únicamente el objeto JSON.`;
            const result = await this.generate(prompt);
             setLoading(ui.recommendationArea, false);
            if (result) {
                try {
                    const cleanedResult = result.match(/\{.*\}/s)[0];
                    state.recommendedModel = JSON.parse(cleanedResult);
                    renderUI();
                } catch (e) {
                    console.error("Failed to parse pedagogy JSON:", e, "Raw result:", result);
                    state.recommendedModel = { model: "Error", justification: "No se pudo generar recomendación." };
                    renderUI();
                }
            }
        },
        analyzeQuality: async function() {
            setLoading(ui.analysisContent, true, "Analizando...");
            ui.analysisModal.classList.add('visible');
            const currentPrompt = generateFinalPrompt();
            const prompt = `Eres un experto en ingeniería de prompts. Analiza el siguiente prompt diseñado para generar una aplicación web. Proporciona una lista concisa y con viñetas de sugerencias accionables para mejorar su claridad, especificidad y efectividad. Céntrate en posibles ambigüedades o detalles faltantes. Si el prompt ya es excelente, indícalo. Formatea tu respuesta con Markdown. Prompt a analizar:\n\n---\n\n${currentPrompt}`;
            const result = await this.generate(prompt);
            setLoading(ui.analysisContent, false);
            if (result) {
                ui.analysisContent.innerText = result;
            } else {
                ui.analysisContent.innerText = "No se pudo completar el análisis.";
            }
        }
    };
    
    // --- LÓGICA DE RENDERIZADO Y UI ---
    
    const debounce = (func, delay) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; };

    function setLoading(element, isLoading, text = '') {
        if (isLoading) {
            element.innerHTML = `<div class="flex flex-col items-center justify-center h-full w-full text-sm text-gray-400"><div class="spinner mb-2"></div>${text}</div>`;
        } else {
            element.innerHTML = '';
        }
    }
    
    function populateProjectSelector() {
        const projects = projectManager.getProjects();
        ui.projectSelector.innerHTML = '<option value="" disabled>Selecciona un proyecto</option>';
        const newOption = document.createElement('option');
        newOption.value = "new";
        newOption.textContent = "--- CREAR NUEVO PROYECTO ---";
        ui.projectSelector.appendChild(newOption);

        projects.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name;
            ui.projectSelector.appendChild(option);
        });
    }
    
    function loadState(projectId) {
        if (!projectId || projectId === "new") {
            state = getNewState();
        } else {
            const projects = projectManager.getProjects();
            const projectToLoad = projects.find(p => p.id === projectId);
            state = projectToLoad ? { ...projectToLoad } : getNewState();
        }
        ui.projectSelector.value = state.id;
        renderUI();
        if (state.structureMethod === 'ai' && state.temaCentral && state.audiencia) {
            api.getSubtopics();
            api.getPedagogy();
        }
    }
    
    function renderUI() {
        // Update all form inputs to reflect the current state
        ui.archetypeRadios.forEach(r => r.checked = r.value === state.appArchetype);
        ui.complexityRadios.forEach(r => r.checked = r.value === state.appComplexity);
        ui.contentDepthSlider.value = state.contentDepth;
        ui.temaCentral.value = state.temaCentral;
        ui.audiencia.value = state.audiencia;
        ui.tono.value = state.tono;
        ui.structureMethodRadios.forEach(r => r.checked = r.value === state.structureMethod);
        ui.externalDocsRadios.forEach(r => r.checked = r.value === state.useExternalDocs);
        ui.referenceMaterialInput.value = state.referenceMaterial;
        
        // Handle conditional UI visibility
        ui.referenceMaterialSection.style.display = state.useExternalDocs === 'si' ? 'block' : 'none';
        
        // Render dynamic content areas
        renderSubtopicsUI();
        renderPedagogyUI();
        
        // Generate the final prompt text
        ui.outputPrompt.value = generateFinalPrompt();
    }

    function renderSubtopicsUI() {
        if (state.structureMethod === 'ai') {
            ui.subtemasContainerAi.classList.remove('hidden');
            ui.subtemasContainerManual.classList.add('hidden');
            ui.addSubtemaBtn.classList.add('hidden');
            if (state.subtemas.length > 0) {
                ui.subtemasContainerAi.innerHTML = state.subtemas.map(s => `<p class="text-gray-300">- ${s}</p>`).join('');
            } else if(state.temaCentral && state.audiencia) {
                 setLoading(ui.subtemasContainerAi, true, 'Generando...');
            } else {
                 ui.subtemasContainerAi.innerHTML = `<p class="text-gray-500 text-sm">Define tema y audiencia para generar subtemas.</p>`;
            }
        } else { // manual
            ui.subtemasContainerAi.classList.add('hidden');
            ui.subtemasContainerManual.classList.remove('hidden');
            ui.addSubtemaBtn.classList.remove('hidden');
            ui.subtemasContainerManual.innerHTML = state.subtemas.map((subtema, index) => `<div class="flex items-center space-x-2"><input type="text" value="${subtema}" class="form-input flex-grow" data-index="${index}" placeholder="Título del subtema"><button class="btn !bg-red-800 !p-2" title="Eliminar" data-index="${index}">-</button></div>`).join('');
        }
    }

    function renderPedagogyUI() {
        if (state.recommendedModel && state.recommendedModel.model) {
            ui.recommendationArea.innerHTML = `<p class="font-semibold text-violet-300">Recomendación IA: <span class="font-bold text-white">${state.recommendedModel.model}</span></p><p class="text-sm text-violet-400 mt-1">${state.recommendedModel.justification}</p>`;
        } else if(state.temaCentral && state.audiencia) {
            setLoading(ui.recommendationArea, true, 'Generando...');
        } else {
            ui.recommendationArea.innerHTML = `<p class="text-sm text-gray-400">Define tema y audiencia para una recomendación.</p>`;
        }
    }

    function generateFinalPrompt() {
        // This function now just pieces together the final text from the state
        // The core logic is handled by the API calls
        const archetypeData = {
            tutorial: { name: 'Tutorial Interactivo', description: 'Enfocado en guiar al usuario a través de un tema con explicaciones paso a paso, ejemplos interactivos y comprobaciones de conocimiento.' },
            herramienta: { name: 'Herramienta Práctica', description: 'Enfocado en resolver un problema específico del usuario. Debe tener campos de entrada claros y mostrar un resultado útil y accionable.' },
            juego: { name: 'Juego Educativo', description: 'Enfocado en la gamificación del aprendizaje. Debe tener reglas claras, un objetivo y un ciclo de juego que motive a seguir participando.' }
        };
        const selectedArchetype = archetypeData[state.appArchetype];

        let prompt = `
# MEGA-PROMPT PARA CREACIÓN DE APLICACIÓN WEB v6

## 1. ROL Y OBJETIVO
**Actúa como** un desarrollador full-stack experto y diseñador instruccional.
**Tu objetivo es** generar el código completo (HTML, CSS, JS) para una aplicación web monolítica, funcional y lista para usar, siguiendo rigurosamente las especificaciones de este prompt.

## 2. CONCEPTO CENTRAL DE LA APLICACIÓN
- **Arquetipo de App:** ${selectedArchetype.name}.
- **Tema Central:** ${state.temaCentral || '(No definido)'}
- **Audiencia Objetivo:** ${state.audiencia || '(No definida)'}
- **Tono y Estilo:** ${state.tono}

## 3. ESPECIFICACIONES FUNCIONALES Y DE CONTENIDO
- **Instrucción Clave del Arquetipo:** ${selectedArchetype.description}
- **Nivel de Complejidad:** ${state.appComplexity}
- **Estructura de Contenido:**
${state.subtemas.length > 0 ? state.subtemas.map(s => `  - ${s}`).join('\n') : '  - (La IA debe generar una estructura lógica)'}
- **Modelo Pedagógico:** ${state.recommendedModel.model || 'No determinado'}.
- **Justificación Pedagógica:** ${state.recommendedModel.justification || 'N/A'}.

## 4. FUENTES DE CONTENIDO
- **Uso de Material de Referencia:** ${state.useExternalDocs === 'si' ? 'Sí' : 'No'}.
${state.useExternalDocs === 'si' && state.referenceMaterial ? `
## 5. CONTEXTO ADICIONAL DEL USUARIO
\`\`\`
${state.referenceMaterial}
\`\`\`
` : ''}

## 6. REQUISITOS TÉCNICOS OBLIGATORIOS
- **Stack:** HTML, TailwindCSS, y JavaScript moderno (ES6+), todo en un único archivo \`.html\`.
- **NO USAR \`alert()\` O \`confirm()\`.** Usa modales o divs en el HTML para notificaciones.
- **CÓDIGO COMENTADO, RESPONSIVO Y AUTOCONTENIDO.**
- **IA en la App (si se requiere):** Usar la API de Google Gemini (gemini-1.5-flash).

## 7. INSTRUCCIÓN FINAL
Genera el código completo para la aplicación descrita.`;
        return prompt.trim();
    }
    
    // --- EVENT LISTENERS ---
    
    const debouncedAiCall = debounce(() => {
        if (state.structureMethod === 'ai' && state.temaCentral && state.audiencia) {
            api.getSubtopics();
            api.getPedagogy();
        }
    }, 1200);

    ui.enterBtn.addEventListener('click', () => {
        ui.loginScreen.style.opacity = '0';
        setTimeout(() => {
            ui.loginScreen.style.display = 'none';
            ui.appContainer.classList.remove('hidden');
            ui.appContainer.classList.add('visible', 'opacity-100');
        }, 500);
    });

    ui.projectSelector.addEventListener('change', (e) => loadState(e.target.value));
    ui.saveBtn.addEventListener('click', () => projectManager.saveCurrentState());
    ui.deleteBtn.addEventListener('click', () => projectManager.deleteProject(state.id));

    // Listeners for form inputs
    document.body.addEventListener('input', (e) => {
        const { id, value, type, name } = e.target;
        if (type === 'radio') {
            state[name] = value;
        } else if (id in state) {
            state[id] = value;
        } else if (id === 'reference-material-input') {
            state.referenceMaterial = value;
        }
        
        if (id === 'tema-central' || id === 'audiencia') {
            debouncedAiCall();
        }
        
        renderUI();
    });
    
    // Manual subtopic management
    ui.addSubtemaBtn.addEventListener('click', () => { state.subtemas.push(''); renderUI(); });
    ui.subtemasContainerManual.addEventListener('click', e => { 
        if(e.target.matches('button')) { state.subtemas.splice(parseInt(e.target.dataset.index), 1); renderUI(); }
    });
    ui.subtemasContainerManual.addEventListener('input', e => { 
        if(e.target.matches('input')) { state.subtemas[parseInt(e.target.dataset.index)] = e.target.value; renderUI(); }
    });
    
    // Action buttons
    ui.copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(ui.outputPrompt.value).then(() => {
            ui.copyBtn.textContent = '¡Copiado!';
            setTimeout(() => { ui.copyBtn.textContent = 'Copiar Prompt'; }, 2000);
        });
    });
    
    ui.analyzeBtn.addEventListener('click', () => api.analyzeQuality());
    ui.closeModalBtn.addEventListener('click', () => ui.analysisModal.classList.remove('visible'));

    // --- INICIALIZACIÓN ---
    function init() {
        populateProjectSelector();
        const projects = projectManager.getProjects();
        const firstProjectId = projects.length > 0 ? projects[0].id : "new";
        loadState(firstProjectId);
    }

    init();
});
