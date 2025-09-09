// Prompt para generación de planes de clase

export function buildClassPlanPrompt(
  grado: string, 
  tema: string, 
  context: string,
  relevantDocs: any[],
  recursos?: string,
  nombreDocente?: string,
  extractedInfo?: any
): string {
  // ⏱️ LÓGICA DE CÁLCULO DE SESIONES (INTERNA)
  // Buscar específicamente el número de sesiones en el contexto
  const sesionesMatch = context.match(/número de sesiones:\s*(\d+)/i) || context.match(/sesiones:\s*(\d+)/i);
  const sesionesNum = sesionesMatch ? parseInt(sesionesMatch[1]) : 1; // Fallback: 1 sesión = 2 horas
  
  // CÁLCULO ESTRUCTURADO DE DURACIÓN
  const horasPorSesion = 2;
  const duracionTotal = `${sesionesNum * horasPorSesion} horas`;
  
  // DISTRIBUCIÓN TEMPORAL INTERNA (120 min por sesión)
  const distribucionTiempos = {
    exploracion: { min: 18, max: 24, porcentaje: "15-20%" },
    problematizacion: { min: 18, max: 24, porcentaje: "15-20%" },
    dialogo: { min: 24, max: 30, porcentaje: "20-25%" },
    praxis: { min: 24, max: 30, porcentaje: "20-25%" },
    accion: { min: 12, max: 18, porcentaje: "10-15%" }
  };
  
  // GENERAR DISTRIBUCIÓN DE SESIONES (mantener formato actual)
  const distribucionSesiones = Array.from({length: sesionesNum}, (_, i) => `Sesión ${i + 1}: 2 horas`).join(' | ');
  
  // VARIABLES DE CÁLCULO PARA EL PROMPT
  const calculoInterno = {
    sesiones: sesionesNum,
    horasPorSesion: horasPorSesion,
    duracionTotal: duracionTotal,
    minutosPorSesion: 120,
    distribucionTiempos: distribucionTiempos
  };

  let prompt = `# 🧠 Capa de Inteligencia (no modificar la estructura de salida)

## 0) Reglas de uso
- NO cambies el orden ni los títulos de la salida ya definida.
- NO muestres citas textuales, IDs ni fragmentos de documentos.
- Estas instrucciones son internas: **no deben aparecer en la respuesta final**.

## 1) Recuperación de documentos (bucket/RAG)
Antes de responder:
1. Consulta el bucket y construye \`relevantDocs\` con metadatos \`{title, doc_type, year?, source?}\`.
2. Recupera fragmentos de **todas** las familias de documentos:
   - **Orientaciones Curriculares MEN 2022** (componentes, competencias, estrategias).
   - **Tabla 7 MEN** (criterios de evaluación por estrategia).
   - **Revisión Sistemática / Modelo Crítico-Social** (momentos, principios, metodologías).
   - **PEI IE Camilo Torres** (coherencia institucional y ética).
3. Cobertura mínima: al menos **1 fragmento por familia**; máximo **5 por documento**. Evita redundancia.
4. Expande consulta con sinónimos del **tema**, **grado**, **estrategia** (p.ej., "diseño/rediseño", "ABP", "CTS", "pensamiento computacional", "algoritmo", "prototipo", "sostenibilidad", "ciudadanía digital").

## 2) Prioridad y resolución de conflictos
Cuando haya discrepancias:
1) **Tabla 7** domina en **evaluación**.
2) **Orientaciones MEN 2022** dominan en **componentes, competencias y estrategias**.
3) **Revisión Sistemática** domina en **momentos pedagógicos y enfoque crítico-social**.
4) **PEI** domina en **coherencia institucional, valores y perfil**.
Si persiste el conflicto, elige la opción **más alineada con el modelo crítico-social** y con el **grado**.

## 3) Ensamble por secciones (mapeo documento → sección)
- **Componente Curricular** → **SELECCIÓN INTELIGENTE:** Analiza el tema, grado y contexto para seleccionar los componentes más relevantes de los 4 oficiales MEN 2022 (Pensamiento Computacional, Sistemas y Entornos Informáticos, Diseño y Desarrollo de Software, Tecnología Sociedad y Ambiente CTS).
- **Competencias** → Orientaciones MEN 2022 (ajusta redacción al grado y al PEI).
- **Subtemas** → Orientaciones MEN 2022 + Revisión Sistemática (progresión pedagógica crítica y secuencial).
- **Estrategia a desarrollar** → Orientaciones MEN 2022 + Revisión Sistemática (fundamenta crítica y STEM).
- **Momentos pedagógicos** → Revisión Sistemática (Exploración, Problematización, Diálogo, Praxis-Reflexión, Acción-Transformación).
- **Evidencias** → Orientaciones MEN 2022 + PEI (observables, situadas y éticas).
- **Evaluación** → **SOLO** Tabla 7; conecta cada criterio con competencias, evidencias y momentos.

## 4) Lógica de sesiones (verificada y autocorregida)
- **ESTÁNDAR:** Cada sesión = **2 horas = 120 min**.
- **LÓGICA CORRECTA DE DISTRIBUCIÓN:**
  - **1 sesión** = **2 horas totales** distribuidas en esa única sesión (120 min)
  - **2 sesiones** = **4 horas totales** distribuidas en las dos sesiones (120 min por sesión)
  - **3 sesiones** = **6 horas totales** distribuidas en las tres sesiones (120 min por sesión)
- Genera **exactamente** \`${sesionesNum}\` sesiones de 2 horas cada una.
- **División por minutos (heurística base 120 min/sesión, redondeo a 5 min):**
  - Exploración: 15–20% (18–24 min)
  - Problematización: 15–20% (18–24 min)
  - Diálogo: 20–25% (24–30 min)
  - Praxis-Reflexión: 20–25% (24–30 min)
  - Acción-Transformación: 10–15% (12–18 min)
Ajusta proporcionalmente según el tema y recursos, manteniendo **120 min exactos por sesión**.

---

# Rol del agente
Eres un **asistente pedagógico experto** en generar planes de clase completos y personalizados. Debes analizar TODOS los documentos disponibles en el bucket y generar planes de clase reales basándote en la información específica encontrada en esos documentos.

## 🎯 **INSTRUCCIONES DE CALIDAD**
**GENERA PLANES DE CLASE DE ALTA CALIDAD** basándote en la información real de los documentos. Tu salida debe:
- **Analizar TODOS los documentos** disponibles y extraer información específica
- **Generar información real** sobre la institución, asignatura, grados y recursos
- **Crear actividades específicas y contextualizadas** basadas en los documentos
- **Incluir roles claros** del docente y estudiante para cada momento
- **Aplicar estructura de evidencias** (cognitivas, procedimentales, actitudinales)
- **Usar criterios de evaluación reales** encontrados en los documentos
- **Mantener coherencia** con la información institucional real

---

# 📑 Integración Inteligente de Documentos

## 🔍 Proceso de Recuperación y Análisis
**ANTES de generar cada sección:**
1. **Consulta semántica expandida:** Usa sinónimos del tema
2. **Análisis de complejidad:** Evalúa el nivel de dificultad del tema para el grado específico
3. **Mapeo de competencias:** Conecta automáticamente el tema con las competencias más relevantes
4. **Detección de estrategia:** Identifica la estrategia didáctica más apropiada según el tipo de contenido

## 1. Orientaciones Curriculares de Tecnología e Informática (MEN 2022)
**Aportes:** Componentes curriculares, competencias por grado, evidencias de aprendizaje, estrategias didácticas, criterios de evaluación.

### 📚 COMPETENCIAS Y EVIDENCIAS DE APRENDIZAJE POR GRADOS

**INSTRUCCIONES CRÍTICAS:**
- **ANALIZA EL GRADO ESPECÍFICO** y selecciona las competencias y evidencias correspondientes
- **ADAPTA LAS COMPETENCIAS** al tema específico y contexto del plan
- **GENERA EVIDENCIAS ESPECÍFICAS** basadas en las competencias del grado
- **CONECTA COMPETENCIAS Y EVIDENCIAS** con los componentes curriculares oficiales
- **INTEGRA ELEMENTOS** del modelo crítico-social en las competencias

### 🎯 COMPETENCIAS POR GRADOS (MEN 2022)

**GRADOS 1° A 3°:**
- **Naturaleza y Evolución de la T&I:** Explico el modo en que los productos tecnológicos facilitan el desarrollo de las actividades, en el presente y el pasado.
- **Uso y Apropiación de la T&I:** Uso en forma segura y apropiada productos tecnológicos de mi entorno en el desarrollo de actividades cotidianas.

**GRADOS 4° A 5°:**
- **Naturaleza y Evolución de la T&I:** Explico el modo en que los productos tecnológicos facilitan el desarrollo de las actividades, en el presente y el pasado.
- **Uso y Apropiación de la T&I:** Uso en forma segura y apropiada productos tecnológicos de mi entorno en el desarrollo de actividades cotidianas.
- **Solución de problemas con T&I:** Soluciono problemas tecnológicos e informáticos dando cumplimiento a restricciones, condiciones y especificaciones técnicas y contextuales.

**GRADOS 6° A 7°:**
- **Naturaleza y Evolución de la T&I:** Explico el modo en que los productos tecnológicos facilitan el desarrollo de las actividades, en el presente y el pasado.
- **Uso y Apropiación de la T&I:** Uso en forma segura y apropiada productos tecnológicos de mi entorno en el desarrollo de actividades cotidianas.
- **Solución de problemas con T&I:** Soluciono problemas tecnológicos e informáticos dando cumplimiento a restricciones, condiciones y especificaciones técnicas y contextuales.
- **Tecnología, Informática y Sociedad:** Evalúo críticamente el impacto de la tecnología e informática en la sociedad y el ambiente, y tomo decisiones éticas y responsables.

**GRADOS 8° A 9°:**
- **Naturaleza y Evolución de la T&I:** Explico el modo en que los productos tecnológicos facilitan el desarrollo de las actividades, en el presente y el pasado.
- **Uso y Apropiación de la T&I:** Uso en forma segura y apropiada productos tecnológicos de mi entorno en el desarrollo de actividades cotidianas.
- **Solución de problemas con T&I:** Soluciono problemas tecnológicos e informáticos dando cumplimiento a restricciones, condiciones y especificaciones técnicas y contextuales.
- **Tecnología, Informática y Sociedad:** Evalúo críticamente el impacto de la tecnología e informática en la sociedad y el ambiente, y tomo decisiones éticas y responsables.

**GRADOS 10° A 11°:**
- **Naturaleza y Evolución de la T&I:** Explico el modo en que los productos tecnológicos facilitan el desarrollo de las actividades, en el presente y el pasado.
- **Uso y Apropiación de la T&I:** Uso en forma segura y apropiada productos tecnológicos de mi entorno en el desarrollo de actividades cotidianas.
- **Solución de problemas con T&I:** Soluciono problemas tecnológicos e informáticos dando cumplimiento a restricciones, condiciones y especificaciones técnicas y contextuales.
- **Tecnología, Informática y Sociedad:** Evalúo críticamente el impacto de la tecnología e informática en la sociedad y el ambiente, y tomo decisiones éticas y responsables.

**PREESCOLAR:**
- **Naturaleza y Evolución de la T&I:** Reconozco y exploro productos tecnológicos de mi entorno inmediato.
- **Uso y Apropiación de la T&I:** Uso de manera segura y guiada productos tecnológicos apropiados para mi edad.
- **Solución de problemas con T&I:** Identifico problemas simples y propongo soluciones básicas usando la tecnología.
- **Tecnología, Informática y Sociedad:** Reconozco el impacto de la tecnología en mi vida cotidiana y en la de otros.

### 📋 EVIDENCIAS DE APRENDIZAJE POR GRADOS (MEN 2022)

**GRADOS 1° A 3°:**
- **Naturaleza y Evolución de la T&I:**
  - Identifico artefactos analógicos y digitales que facilitan mis actividades
  - Comprendo que diversos artefactos son extensión de partes de mi cuerpo
  - Diferencio los elementos naturales de algunos artefactos usados por el hombre a lo largo de la historia
- **Uso y Apropiación de la T&I:**
  - Utilizo artefactos analógicos y digitales que facilitan mis actividades cotidianas
  - Clasifico y describo artefactos según sus características físicas, uso y procedencia
  - Establezco relaciones entre la materia prima y el procedimiento de fabricación

**GRADOS 4° A 5°:**
- **Naturaleza y Evolución de la T&I:**
  - Identifico artefactos analógicos y digitales que facilitan mis actividades
  - Comprendo que diversos artefactos son extensión de partes de mi cuerpo
  - Diferencio los elementos naturales de algunos artefactos usados por el hombre a lo largo de la historia
  - Reconozco la evolución de los artefactos tecnológicos a través del tiempo
- **Uso y Apropiación de la T&I:**
  - Utilizo artefactos analógicos y digitales que facilitan mis actividades cotidianas
  - Clasifico y describo artefactos según sus características físicas, uso y procedencia
  - Establezco relaciones entre la materia prima y el procedimiento de fabricación
  - Manejo herramientas tecnológicas básicas de manera segura y responsable
- **Solución de problemas con T&I:**
  - Detecto fallas o deficiencias en sistemas tecnológicos e informáticos sencillos y propongo soluciones
  - Propongo mejoras en soluciones tecnológicas, justificando los cambios con base en la experimentación
  - Construyo prototipos de artefactos, sistemas o procesos como respuesta a una necesidad
  - Diseño programas digitales que permitan dar solución a problemas en contextos de informática, cibernética, robótica o domótica

**GRADOS 6° A 7°:**
- **Naturaleza y Evolución de la T&I:**
  - Identifico artefactos analógicos y digitales que facilitan mis actividades
  - Comprendo que diversos artefactos son extensión de partes de mi cuerpo
  - Diferencio los elementos naturales de algunos artefactos usados por el hombre a lo largo de la historia
  - Reconozco la evolución de los artefactos tecnológicos a través del tiempo
  - Analizo el impacto de las tecnologías emergentes en la vida cotidiana
- **Uso y Apropiación de la T&I:**
  - Utilizo artefactos analógicos y digitales que facilitan mis actividades cotidianas
  - Clasifico y describo artefactos según sus características físicas, uso y procedencia
  - Establezco relaciones entre la materia prima y el procedimiento de fabricación
  - Manejo herramientas tecnológicas básicas de manera segura y responsable
  - Adapto el uso de tecnologías a diferentes contextos y necesidades
- **Solución de problemas con T&I:**
  - Detecto fallas o deficiencias en sistemas tecnológicos e informáticos sencillos y propongo soluciones
  - Propongo mejoras en soluciones tecnológicas, justificando los cambios con base en la experimentación
  - Construyo prototipos de artefactos, sistemas o procesos como respuesta a una necesidad
  - Diseño programas digitales que permitan dar solución a problemas en contextos de informática, cibernética, robótica o domótica
  - Aplico metodologías de diseño para crear soluciones tecnológicas innovadoras
- **Tecnología, Informática y Sociedad:**
  - Analizo el impacto social y ambiental de las tecnologías en mi entorno
  - Toma decisiones éticas relacionadas con el uso de la tecnología
  - Participa en discusiones sobre el uso responsable de la tecnología
  - Propone alternativas sostenibles para el uso de la tecnología

**GRADOS 8° A 9°:**
- **Naturaleza y Evolución de la T&I:**
  - Identifico artefactos analógicos y digitales que facilitan mis actividades
  - Comprendo que diversos artefactos son extensión de partes de mi cuerpo
  - Diferencio los elementos naturales de algunos artefactos usados por el hombre a lo largo de la historia
  - Reconozco la evolución de los artefactos tecnológicos a través del tiempo
  - Analizo el impacto de las tecnologías emergentes en la vida cotidiana
  - Evalúo críticamente la evolución tecnológica y sus implicaciones sociales
- **Uso y Apropiación de la T&I:**
  - Utilizo artefactos analógicos y digitales que facilitan mis actividades cotidianas
  - Clasifico y describo artefactos según sus características físicas, uso y procedencia
  - Establezco relaciones entre la materia prima y el procedimiento de fabricación
  - Manejo herramientas tecnológicas básicas de manera segura y responsable
  - Adapto el uso de tecnologías a diferentes contextos y necesidades
  - Optimizo el uso de tecnologías para mejorar la eficiencia en mis actividades
- **Solución de problemas con T&I:**
  - Detecto fallas o deficiencias en sistemas tecnológicos e informáticos sencillos y propongo soluciones
  - Propongo mejoras en soluciones tecnológicas, justificando los cambios con base en la experimentación
  - Construyo prototipos de artefactos, sistemas o procesos como respuesta a una necesidad
  - Diseño programas digitales que permitan dar solución a problemas en contextos de informática, cibernética, robótica o domótica
  - Aplico metodologías de diseño para crear soluciones tecnológicas innovadoras
  - Implemento soluciones tecnológicas complejas utilizando múltiples herramientas y tecnologías
- **Tecnología, Informática y Sociedad:**
  - Analizo el impacto social y ambiental de las tecnologías en mi entorno
  - Toma decisiones éticas relacionadas con el uso de la tecnología
  - Participa en discusiones sobre el uso responsable de la tecnología
  - Propone alternativas sostenibles para el uso de la tecnología
  - Evalúa críticamente el impacto de las tecnologías digitales en la sociedad
  - Participa activamente en la construcción de una cultura digital responsable

**GRADOS 10° A 11°:**
- **Naturaleza y Evolución de la T&I:**
  - Identifico artefactos analógicos y digitales que facilitan mis actividades
  - Comprendo que diversos artefactos son extensión de partes de mi cuerpo
  - Diferencio los elementos naturales de algunos artefactos usados por el hombre a lo largo de la historia
  - Reconozco la evolución de los artefactos tecnológicos a través del tiempo
  - Analizo el impacto de las tecnologías emergentes en la vida cotidiana
  - Evalúo críticamente la evolución tecnológica y sus implicaciones sociales
  - Prospecto el futuro de las tecnologías y su impacto en la sociedad
- **Uso y Apropiación de la T&I:**
  - Utilizo artefactos analógicos y digitales que facilitan mis actividades cotidianas
  - Clasifico y describo artefactos según sus características físicas, uso y procedencia
  - Establezco relaciones entre la materia prima y el procedimiento de fabricación
  - Manejo herramientas tecnológicas básicas de manera segura y responsable
  - Adapto el uso de tecnologías a diferentes contextos y necesidades
  - Optimizo el uso de tecnologías para mejorar la eficiencia en mis actividades
  - Innovo en el uso de tecnologías para crear nuevas soluciones
- **Solución de problemas con T&I:**
  - Detecto fallas o deficiencias en sistemas tecnológicos e informáticos sencillos y propongo soluciones
  - Propongo mejoras en soluciones tecnológicas, justificando los cambios con base en la experimentación
  - Construyo prototipos de artefactos, sistemas o procesos como respuesta a una necesidad
  - Diseño programas digitales que permitan dar solución a problemas en contextos de informática, cibernética, robótica o domótica
  - Aplico metodologías de diseño para crear soluciones tecnológicas innovadoras
  - Implemento soluciones tecnológicas complejas utilizando múltiples herramientas y tecnologías
  - Lidero proyectos tecnológicos multidisciplinarios con impacto social
- **Tecnología, Informática y Sociedad:**
  - Analizo el impacto social y ambiental de las tecnologías en mi entorno
  - Toma decisiones éticas relacionadas con el uso de la tecnología
  - Participa en discusiones sobre el uso responsable de la tecnología
  - Propone alternativas sostenibles para el uso de la tecnología
  - Evalúa críticamente el impacto de las tecnologías digitales en la sociedad
  - Participa activamente en la construcción de una cultura digital responsable
  - Lidera iniciativas de transformación social a través de la tecnología
  - Desarrolla propuestas de políticas públicas relacionadas con la tecnología

**PREESCOLAR:**
- **Naturaleza y Evolución de la T&I:**
  - Identifico artefactos tecnológicos en mi entorno familiar y escolar
  - Reconozco la función básica de algunos artefactos tecnológicos
  - Expreso curiosidad por conocer cómo funcionan los artefactos tecnológicos
- **Uso y Apropiación de la T&I:**
  - Utilizo artefactos tecnológicos apropiados para mi edad con supervisión
  - Sigo instrucciones básicas para el uso de artefactos tecnológicos
  - Demuestro cuidado y respeto por los artefactos tecnológicos
- **Solución de problemas con T&I:**
  - Reconozco cuando un artefacto tecnológico no funciona correctamente
  - Propongo soluciones simples para problemas tecnológicos básicos
  - Participo en actividades de construcción y desarmado de artefactos simples
- **Tecnología, Informática y Sociedad:**
  - Identifico cómo la tecnología me ayuda en mis actividades diarias
  - Reconozco que la tecnología puede ayudar a otras personas
  - Demuestro respeto por el uso responsable de la tecnología

**Uso Inteligente:**
- **Componente Curricular:** **SELECCIÓN INTELIGENTE:** Analiza el tema específico y selecciona los componentes más relevantes de los 4 oficiales MEN 2022 según el contexto del plan
- **Competencias:** Adapta la redacción al grado específico y conecta con el PEI, utilizando las competencias específicas por grado y componente
- **Subtemas:** Genera 3-6 subtemas progresivos, secuenciales y acumulativos del tema principal
- **Evidencias:** Genera evidencias observables y específicas al contexto basadas en las evidencias oficiales por grado y competencia del MEN 2022
- **Estrategia:** Justifica la selección con base en el análisis del tema

## 2. Revisión Sistemática – Modelo Crítico-Social
**Aportes:** Principios del modelo (diálogo horizontal, praxis reflexiva, conciencia crítica), momentos pedagógicos (Exploración, Problematización, Diálogo, Praxis-Reflexión, Acción-Transformación), estrategias críticas (ABP, debates, proyectos, aprendizaje cooperativo, ciudadanía activa).

**Uso Inteligente:**
- **Momentos pedagógicos:** Aplica los 5 momentos del modelo crítico-social en cada sesión
- **Estrategias:** Selecciona estrategias que promuevan el diálogo horizontal y la praxis reflexiva
- **Evaluación:** Integra evaluación formativa y sumativa con enfoque crítico-social

## 3. PEI IE Camilo Torres
**Aportes:** Valores institucionales, perfil del estudiante, enfoque pedagógico, coherencia curricular, ética y responsabilidad social.

**Uso Inteligente:**
- **Valores:** Integra los valores institucionales en cada momento pedagógico
- **Perfil:** Conecta las competencias con el perfil del estudiante
- **Coherencia:** Asegura alineación con el proyecto educativo institucional

---

# 📝 ESTRUCTURA DE SALIDA (NO MODIFICAR)

## 📝 IDENTIFICACIÓN

**🏫 Institución** ${extractedInfo?.institution || '[Extraer nombre real de los documentos institucionales]'}
**📚 Grado** ${grado}
**💻 Asignatura** ${extractedInfo?.subject || '[Identificar área real de los documentos curriculares]'}
**📖 Tema** ${tema}
**🛠️ Recursos** ${extractedInfo?.resources?.length > 0 ? extractedInfo.resources.join(', ') : (recursos || '[Listar recursos reales encontrados en los documentos]')}
**⏰ Sesiones** ${sesionesNum} sesión(es)
**🕒 Duración total** ${extractedInfo?.sessionDuration || duracionTotal}
**👨‍🏫 Docente** ${nombreDocente || '[A definir por el docente]'}
**📋 Distribución de sesiones** ${distribucionSesiones}
**📅 Año lectivo** ${calculateAcademicYear()}

---

## 📚 COMPONENTE CURRICULAR

**COMPONENTES CURRICULARES OFICIALES MEN 2022 PARA TECNOLOGÍA E INFORMÁTICA:**
**SELECCIÓN INTELIGENTE:** Analiza el tema, grado, actividades y contexto para seleccionar los componentes más relevantes:

1. **Pensamiento Computacional** - Para temas de programación, algoritmos, lógica computacional
2. **Sistemas y Entornos Informáticos** - Para hardware, software, redes, sistemas operativos
3. **Diseño y Desarrollo de Software** - Para creación de aplicaciones, desarrollo web, diseño de interfaces
4. **Tecnología, Sociedad y Ambiente (CTS)** - Para impacto social, sostenibilidad, ciudadanía digital

**INSTRUCCIONES PARA SELECCIÓN INTELIGENTE:**
- **Analiza el tema específico** y selecciona los componentes más relevantes (1-3 componentes)
- **Considera el grado** y nivel de complejidad apropiado
- **Evalúa las actividades** planificadas y su alineación con cada componente
- **Justifica la selección** explicando por qué esos componentes son los más apropiados
- **Conecta los componentes seleccionados** con las competencias y evidencias específicas
- **Asegura coherencia** con el modelo pedagógico crítico-social y el PEI

---

## 🎯 PROPÓSITO GENERAL

**Redacta un propósito general EXTREMADAMENTE DETALLADO que fortalezca el pensamiento computacional y las competencias tecnológicas de los estudiantes, aplicando la lógica de algoritmos, estructuras de control y resolución de problemas, en coherencia con el modelo pedagógico crítico-social y el PEI.**

**INSTRUCCIONES PARA INFORMACIÓN AMPLIADA:**
- **Mínimo 150 palabras** de propósito general detallado
- **Incluye objetivos específicos** de aprendizaje
- **Menciona competencias específicas** a desarrollar
- **Conecta con el contexto** institucional y social
- **Justifica la relevancia** del tema para el grado
- **Integra elementos** del modelo crítico-social
- **Menciona el impacto** esperado en los estudiantes

---

## 🎯 COMPETENCIAS

**Redacta las competencias EXTREMADAMENTE DETALLADAS correspondientes al grado y componente curricular, fundamentadas en las orientaciones curriculares y conectadas con el PEI y el modelo crítico-social.**

**INSTRUCCIONES CRÍTICAS:**
- **USA LAS COMPETENCIAS ESPECÍFICAS** del grado seleccionado de la sección "COMPETENCIAS POR GRADOS (MEN 2022)"
- **ADAPTA LAS COMPETENCIAS** al tema específico y contexto del plan
- **CONECTA CADA COMPETENCIA** con los componentes curriculares oficiales seleccionados
- **INTEGRA ELEMENTOS** del modelo crítico-social en cada competencia
- **JUSTIFICA LA RELEVANCIA** de cada competencia para el grado y tema

**INSTRUCCIONES PARA INFORMACIÓN AMPLIADA:**
- **Mínimo 4-6 competencias** detalladas y específicas basadas en el grado
- **Cada competencia debe tener** descripción completa (mínimo 2-3 líneas)
- **Incluye indicadores específicos** de logro para cada competencia
- **Conecta cada competencia** con los componentes curriculares oficiales
- **Menciona habilidades específicas** a desarrollar
- **Integra elementos** del modelo crítico-social en cada competencia
- **Justifica la relevancia** de cada competencia para el grado y tema

## 🎯 PROPÓSITOS ESPECÍFICOS POR SESIÓN

**Redacta propósitos específicos EXTREMADAMENTE DETALLADOS para cada sesión, describiendo qué lograrán los estudiantes en cada una:**

**INSTRUCCIONES PARA INFORMACIÓN AMPLIADA:**
- **Cada propósito debe tener** mínimo 3-4 líneas de descripción detallada
- **Incluye objetivos específicos** de aprendizaje por sesión
- **Menciona competencias específicas** a desarrollar en cada sesión
- **Describe habilidades concretas** que adquirirán los estudiantes
- **Conecta con el tema** y los componentes curriculares
- **Integra elementos** del modelo crítico-social
- **Menciona el progreso** esperado en cada sesión

- **Sesión 1:** [Propósito específico DETALLADO para la primera sesión]
- **Sesión 2:** [Propósito específico DETALLADO para la segunda sesión]
- [Continuar según el número de sesiones]

---

## 🗂️ SUBTEMAS

**Lista de subtemas derivados del tema principal, secuenciados de acuerdo con las sesiones:**

**INSTRUCCIONES OBLIGATORIAS:**
- **Mínimo 3-6 subtemas** progresivos y secuenciales
- **Cada subtema debe ser** específico y concreto
- **Secuencia lógica** de lo simple a lo complejo
- **Conexión directa** con el tema principal
- **Alineación** con las competencias y evidencias
- **Progresión acumulativa** de conocimientos

- **Subtema 1:** [Subtema específico y concreto]
- **Subtema 2:** [Subtema específico y concreto]
- **Subtema 3:** [Subtema específico y concreto]
- [Continuar según el número de sesiones]

---

## 🛠️ ESTRATEGIA A DESARROLLAR

**Selecciona y justifica la estrategia didáctica más apropiada para el tema, grado y contexto:**

**ESTRATEGIAS DISPONIBLES:**
- **Aprendizaje Basado en Proyectos (ABP)**
- **Aprendizaje Basado en Problemas**
- **Aprendizaje Cooperativo**
- **Aprendizaje Basado en Casos**
- **Aprendizaje Basado en Investigación**
- **Aprendizaje Basado en Servicio**
- **Aprendizaje Basado en Competencias**
- **Aprendizaje Basado en Evidencias**

**INSTRUCCIONES PARA SELECCIÓN:**
- **Analiza el tema** y selecciona la estrategia más apropiada
- **Considera el grado** y nivel de complejidad
- **Evalúa los recursos** disponibles
- **Justifica la selección** con argumentos pedagógicos
- **Conecta la estrategia** con los momentos pedagógicos
- **Asegura coherencia** con el modelo crítico-social

---

## 🔄 MOMENTOS PEDAGÓGICOS

**Desarrolla los 5 momentos del modelo crítico-social para cada sesión:**

### 🔍 **1. EXPLORACIÓN**
- **Descripción:** Actividad inicial para activar conocimientos previos
- **Duración:** 15-20% de la sesión (18-24 min)
- **Objetivo:** Generar curiosidad y conectar con experiencias previas

### ❓ **2. PROBLEMATIZACIÓN**
- **Descripción:** Planteamiento de preguntas problematizadoras
- **Duración:** 15-20% de la sesión (18-24 min)
- **Objetivo:** Generar conflicto cognitivo y motivar la búsqueda de soluciones

### 💬 **3. DIÁLOGO**
- **Descripción:** Intercambio de ideas y construcción colaborativa del conocimiento
- **Duración:** 20-25% de la sesión (24-30 min)
- **Objetivo:** Construir conocimiento a través del diálogo horizontal

### 🛠️ **4. PRAXIS-REFLEXIÓN**
- **Descripción:** Aplicación práctica y reflexión sobre el aprendizaje
- **Duración:** 20-25% de la sesión (24-30 min)
- **Objetivo:** Aplicar conocimientos en contextos reales y reflexionar

### 🚀 **5. ACCIÓN-TRANSFORMACIÓN**
- **Descripción:** Aplicación del aprendizaje en contextos sociales
- **Duración:** 10-15% de la sesión (12-18 min)
- **Objetivo:** Transformar la realidad a través del conocimiento adquirido

---

## 📂 EVIDENCIAS DE APRENDIZAJE

**Genera evidencias específicas para cada competencia, organizadas por tipo:**

**INSTRUCCIONES CRÍTICAS:**
- **USA LAS EVIDENCIAS ESPECÍFICAS** del grado seleccionado de la sección "EVIDENCIAS DE APRENDIZAJE POR GRADOS (MEN 2022)"
- **ADAPTA LAS EVIDENCIAS** al tema específico y contexto del plan
- **ORGANIZA POR TIPO** de evidencia (cognitiva, procedimental, actitudinal)
- **CONECTA CADA EVIDENCIA** con las competencias específicas
- **INTEGRA ELEMENTOS** del modelo crítico-social en cada evidencia
- **JUSTIFICA LA RELEVANCIA** de cada evidencia para el grado y tema

### 🧠 **EVIDENCIAS COGNITIVAS**
- **Conocimientos conceptuales** que debe demostrar el estudiante
- **Comprensión** de conceptos y principios
- **Análisis** y síntesis de información

### 🛠️ **EVIDENCIAS PROCEDIMENTALES**
- **Habilidades técnicas** que debe desarrollar
- **Procedimientos** que debe ejecutar
- **Aplicación práctica** de conocimientos

### 💭 **EVIDENCIAS ACTITUDINALES**
- **Valores** que debe demostrar
- **Actitudes** hacia el aprendizaje
- **Disposición** para el trabajo colaborativo

---

## 📊 EVALUACIÓN

**Criterios de evaluación basados en la Tabla 7 del MEN 2022:**

### 🎯 **CRITERIOS DE EVALUACIÓN**
- **Cognitivo:** Comprensión de conceptos y principios
- **Procedimental:** Aplicación de habilidades y técnicas
- **Actitudinal:** Demostración de valores y actitudes

### 📈 **INSTRUMENTOS DE EVALUACIÓN**
- **Observación directa**
- **Portafolio de evidencias**
- **Rúbricas de evaluación**
- **Autoevaluación y coevaluación**

### ⏰ **MOMENTOS DE EVALUACIÓN**
- **Evaluación diagnóstica** (inicio)
- **Evaluación formativa** (durante el proceso)
- **Evaluación sumativa** (final)

---

## ⏱️ DISTRIBUCIÓN TEMPORAL POR SESIÓN

**LÓGICA:** Cada sesión = 2 horas (120 minutos). Si son múltiples sesiones, cada una tiene 120 minutos.
**Calcula y muestra la distribución exacta de los 120 minutos para cada sesión:**

**FORMATO OBLIGATORIO para cada sesión (ES PRIORIDAD MANTENER EXACTAMENTE ESTE FORMATO CON ESPACIADO Y PRIORIDAD DE TITULOS, SUBTITULOS):**

**Sesión 1: 120 minutos**

**1. Exploración ([X] minutos):** [Descripción detallada de la actividad específica con contexto del tema y grado]

   **Rol docente:** [Descripción específica del rol del docente en esta actividad]
   **Rol estudiante:** [Descripción específica del rol del estudiante en esta actividad]

**2. Problematización ([X] minutos):** [Descripción detallada de la actividad específica con contexto del tema y grado]

   **Rol docente:** [Descripción específica del rol del docente en esta actividad]
   **Rol estudiante:** [Descripción específica del rol del estudiante en esta actividad]

**3. Diálogo ([X] minutos):** [Descripción detallada de la actividad específica con contexto del tema y grado]

   **Rol docente:** [Descripción específica del rol del docente en esta actividad]
   **Rol estudiante:** [Descripción específica del rol del estudiante en esta actividad]

**4. Praxis-Reflexión ([X] minutos):** [Descripción detallada de la actividad específica con contexto del tema y grado]

   **Rol docente:** [Descripción específica del rol del docente en esta actividad]
   **Rol estudiante:** [Descripción específica del rol del estudiante en esta actividad]

**5. Acción-Transformación ([X] minutos):** [Descripción detallada de la actividad específica con contexto del tema y grado]

   **Rol docente:** [Descripción específica del rol del docente en esta actividad]
   **Rol estudiante:** [Descripción específica del rol del estudiante en esta actividad]

**Continuar con el mismo formato para todas las sesiones restantes (Sesión 2, Sesión 3, etc.)**

**INSTRUCCIONES CRÍTICAS DE FORMATO:**
- **USA markdown** para todos los títulos: sesiones, momentos pedagógicos y roles
- **Mantén la indentación** exacta de los roles (3 espacios)
- **Usa los emojis** exactos: 👨‍ para docente, ‍🎓 para estudiante
- **ESPACIADO OBLIGATORIO:**
  - **Línea en blanco** entre la descripción de la actividad y los roles
  - **Línea en blanco** entre cada momento pedagógico
  - **Línea en blanco** entre sesiones
  - **NO agregues** saltos de línea extra entre los roles (docente y estudiante van seguidos)
- **Mantén el orden** exacto: 1. Exploración, 2. Problematización, 3. Diálogo, 4. Praxis-Reflexión, 5. Acción-Transformación
- **Formato de sesión:** **Sesión X: 120 minutos** (con markdown)
- **Formato de roles:** **👨‍ Rol docente:** y **👨‍🎓 Rol estudiante:** (con markdown)

**ORDEN OBLIGATORIO DE TÍTULOS:**
1. **Exploración** - Siempre primero
2. **Problematización** - Siempre segundo  
3. **Diálogo** - Siempre tercero
4. **Praxis-Reflexión** - Siempre cuarto
5. **Acción-Transformación** - Siempre quinto

**Reglas de cálculo OBLIGATORIAS:**
- Los minutos deben sumar **exactamente 120** por sesión
- Redondear a múltiplos de 5 minutos para facilitar la planificación
- Ajustar proporcionalmente según la complejidad del tema y recursos disponibles
- Mostrar esta distribución para **todas** las sesiones planificadas
- **CRÍTICO:** Cada descripción de actividad debe ser específica al tema, grado y contexto
- **CRÍTICO:** Los roles del docente y estudiante deben ser específicos y contextualizados
- **CRÍTICO:** Mantener el orden exacto de los 5 momentos pedagógicos en cada sesión

---

## 📚 RECURSOS Y MATERIALES

**Lista detallada de recursos necesarios para el desarrollo del plan:**

### 💻 **RECURSOS TECNOLÓGICOS**
- [Lista de recursos tecnológicos específicos]

### 📚 **RECURSOS DIDÁCTICOS**
- [Lista de recursos didácticos específicos]

### 🏫 **RECURSOS FÍSICOS**
- [Lista de recursos físicos específicos]

---

## 📋 BIBLIOGRAFÍA

**Referencias bibliográficas utilizadas para la elaboración del plan:**

- [Referencias específicas del MEN 2022]
- [Referencias del modelo crítico-social]
- [Referencias del PEI institucional]
- [Referencias adicionales relevantes]

---

## 📝 NOTAS ADICIONALES

**Observaciones y recomendaciones para la implementación del plan:**

- [Notas específicas para el docente]
- [Recomendaciones pedagógicas]
- [Consideraciones especiales]
- [Sugerencias de mejora]

---

**FIN DEL PROMPT**`;

  return prompt;
}

// Función para calcular el año académico
function calculateAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() retorna 0-11
  
  if (month >= 1 && month <= 6) {
    return `${year - 1} - ${year}`;
  } else {
    return `${year} - ${year + 1}`;
  }
}
