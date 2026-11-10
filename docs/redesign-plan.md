# Plan de rediseño · invitación web de Jose i Anas

Estado: implementado en la web. La carta física y su PDF original son la referencia principal de identidad, lenguaje visual y recorrido. La primera página del PDF confirma L’Alqueria de Galim (L’Olleria), el 30.10.2027 a las 12.00 h; la segunda página aporta las acuarelas originales que se revelan por separado durante el recorrido.

## 1. Dirección visual

La experiencia debe sentirse como una extensión digital de la carta: papel marfil cálido, tinta gris oliva, acuarelas de cipreses, olivos y piedra, una ruta dibujada a mano y detalles pequeños de brújula y ramas. El rosa del sobre y del sello puede permanecer como acento, pero no dominar las secciones interiores.

| Elemento | Decisión |
| --- | --- |
| Paleta | Marfil y arena como base; oliva oscuro para texto y controles; verde ciprés, piedra y un toque de rosa empolvado. Contraste suficiente en texto y campos. |
| Tipografía | Serif editorial legible para títulos; sans discreta para datos y formulario. La caligrafía de «Jose i Anas» y «Vos esperem!» funciona como firma visual, sin usarla para instrucciones esenciales. |
| Composición | Mucho aire, marcos finos, recortes de acuarela sin cajas pesadas, asimetría controlada y una línea de ruta que conecte las escenas. |
| Ilustraciones | Reutilizar las acuarelas existentes del lugar y el retrato. Preparar recortes independientes para edificio, olivos, cipreses, brújula y ruta; evitar que los textos impresos dentro de las imágenes se repitan o se escalen borrosos. |
| Coherencia | Un mismo grosor de línea, textura de papel y tratamiento de sombra en hero, información y RSVP. Las imágenes decorativas llevarán `alt=""`; la información se escribirá también como texto HTML. |

La carta muestra la salida desde Xeraco, la CV-60, la dirección hacia L’Olleria y L’Alqueria de Galim. La ruta se usará como relato visual. El enlace «Cómo llegar» seguirá siendo una indicación real, separada de ese dibujo decorativo.

## 2. Recorrido de la página

```text
Sobre y sello
  ↓ abrir
Hero: la carta se despliega, Jose i Anas, fecha y «Vos esperem!»
  ↓
El camino: acuarelas y ruta Xeraco → CV-60 → L’Olleria
  ↓
El encuentro: L’Alqueria de Galim, fecha/hora confirmadas y mapa
  ↓
Programa: solo hitos realmente confirmados
  ↓
RSVP: respuesta por cada persona y necesidades de menú
  ↓
Cierre: firma y recordatorio amable
```

**Hero.** El sobre existente abre la experiencia. La carta ya abierta ocupa el primer plano, con nombres como foco, retrato en acuarela y una introducción breve. En escritorio, la composición será editorial en dos zonas; en móvil, nombres, fecha, imagen y acción aparecerán en ese orden. El botón llevará a la siguiente escena y habrá una acción clara para ir directamente a confirmar asistencia.

**Camino.** Una sección vertical con fondo de papel y paisaje mediterráneo de acuarela muy tenue muestra primero la torre de Xeraco y después dibuja la carretera CV-60 hasta el marcador de L’Olleria. La carretera aparece de arriba abajo con el scroll y un coche en acuarela visto desde arriba avanza por un único trazado continuo. La brújula procede de la carta original; grupos de olivos y cipreses se sitúan junto a los recodos y se unen al trazado mediante suelo, bancales y pequeños muros ilustrados. El paisaje más lejano queda en los márgenes y deja el centro despejado. El coche continúa tras L’Olleria hasta la acuarela y el nombre de L’Alqueria. Ambos acompañan el scroll hasta ocupar su lugar en la tarjeta de ubicación, que entonces muestra los datos prácticos. La misma composición se adapta a escritorio y móvil.

**Lugar.** La acuarela de L’Alqueria tendrá más protagonismo que la tarjeta actual. Una cartografía en acuarela muy tenue, inspirada en la referencia aportada, da contexto a la ubicación sin competir con los datos ni hacerse pasar por un mapa navegable. El título de la sección queda visible cuando la imagen se integra en la tarjeta. La información práctica estará agrupada en texto: nombre, fecha, hora, localidad y enlace de mapa. No se añadirá otra sede ni un horario que no esté confirmado.

**Programa.** Como hoy solo hay un hito configurado, no se debe estirar una cronología de un único elemento. Se presentará como un bloque breve del comienzo del día; la línea de tiempo completa aparecerá cuando haya más momentos reales.

**RSVP.** Será el remate natural del recorrido y conservará el enlace privado, el idioma y la respuesta individual que ya existen.

## 3. Movimiento al hacer scroll

La sensación buscada es de descubrimiento y tacto, con una revelación distinta por escena. El scroll siempre quedará bajo control del visitante.

1. **Apertura:** conservar el sello y la carta que viaja al hero. Ajustar la duración y la llegada para que el texto sea legible en cuanto termine.
2. **Hero:** nombres y fecha entran de forma escalonada y breve; el retrato aparece como acuarela que se revela. La llamada a la acción queda visible sin esperar a la animación.
3. **Camino:** la línea SVG se dibuja conforme entra la sección; hitos e ilustraciones aparecen en secuencia. El movimiento debe tener poco desplazamiento para evitar mareo.
4. **Lugar:** la acuarela sale del final del camino y viaja hasta la tarjeta. Después aparecen el título y los datos prácticos; la imagen permanece estable durante la lectura.
5. **RSVP:** la tarjeta emerge una vez y, a partir de ahí, el formulario permanece estable. Los campos y errores nunca dependen de una animación para ser visibles.

Implementación prevista: `IntersectionObserver` para disparar una vez cada escena, transformaciones y opacidad ligeras, y `prefers-reduced-motion` para mostrar todo inmediatamente. Sin JavaScript, el contenido será visible y utilizable. Evitar bloqueos del scroll, parallax intenso y transiciones que retrasen el acceso al formulario.

## 4. Diseño del formulario

```text
¿Nos acompañas?
Una respuesta por cada persona de esta invitación.
Plazo de respuesta, si está configurado.

┌ Persona 1 · Nombre ───────────────────────────┐
│ ¿Vendrás?  [ Sí, asistiré ] [ No podré asistir ] │
│                                                  │
│ Si responde «Sí»:                               │
│ ¿Tienes alergias o intolerancias? [ No ] [ Sí ]  │
│ Si responde «Sí»: descripción obligatoria       │
│ Otras necesidades alimentarias (opcional)       │
│ Autorización de uso de datos, si aporta datos    │
└──────────────────────────────────────────────────┘

[Guardar confirmación]
Puedes volver a este enlace para cambiar tu respuesta
mientras el plazo esté abierto.
```

Cada persona tendrá su propia tarjeta con nombre destacado y controles amplios. La elección de asistencia será el primer paso; las preguntas de alimentación solo aparecerán para quienes asistan. El detalle de alergias aparecerá únicamente tras elegir «Sí». La autorización se mostrará cuando se vaya a guardar información alimentaria y tendrá una explicación clara de su finalidad.

**Estados:** vista previa sin envío, abierto sin respuesta, respuesta guardada, error de validación, error de guardado y plazo cerrado. Tras guardar, mostrar un mensaje de éxito y el resumen por persona. En errores, mantener las respuestas, señalar el campo concreto y llevar el foco al primer problema. En móvil, las opciones irán a una columna si no caben; la acción de guardado y la nota de privacidad no quedarán tapadas.

La forma visual cambiará, pero el contrato actual de datos se mantendrá: asistencia por persona, alergias, otras necesidades alimentarias y consentimiento. Cualquier cambio de validación en cliente deberá coincidir con el servidor.

## 5. Propuesta de textos (borrador)

Se aplica la skill `seo-copywriting` de AgentOS para una voz cercana, concreta y sin promesas inventadas. Esta invitación privada tiene `noindex`; los textos se optimizarán para lectura y orientación del invitado, no para posicionamiento en buscadores. La carta física aporta las expresiones «Jose i Anas» y «Vos esperem!» como lenguaje propio. Los siguientes textos son propuesta editorial, no datos nuevos del evento.

| Ubicación | Texto propuesto en español |
| --- | --- |
| Apertura | «Una carta para ti» · «Pulsa el sello para abrirla» |
| Hero | «Jose i Anas» · «30 de octubre de 2027» · «Queremos que formes parte de esta gran etapa.» · «Descubre la invitación» |
| Camino | «El camino hasta encontrarnos» · «De Xeraco a L’Olleria, entre olivos y cipreses.» |
| Lugar | «Nos vemos en L’Alqueria de Galim» · «Las historias más bonitas se viven mejor cuando las compartimos con quienes queremos.» · datos prácticos confirmados · «Ver cómo llegar» |
| Programa | «Así comienza nuestro día»; detalles únicamente cuando estén confirmados. |
| RSVP | «¿Nos acompañas?» · «Confirma la asistencia de cada persona de esta invitación.» · «Guardar confirmación» |
| Éxito | «Hemos guardado tu respuesta. Puedes cambiarla desde este mismo enlace mientras el plazo esté abierto.» |
| Cierre | «Vos esperem!» |

La versión ucraniana se redactará como adaptación natural de la misma intención, conservando nombres, topónimos y datos. Las expresiones de la carta podrán mantenerse como firma visual; las instrucciones y el formulario se traducirán íntegramente. Antes de publicar se revisarán el nombre exacto de la pareja, la grafía de los lugares, la hora, el programa y el plazo.

## 6. Orden de trabajo y verificación

1. **Contenido y fuentes:** registrar la carta física como referencia; confirmar los datos poco legibles o ausentes y actualizar la configuración y los dos idiomas.
2. **Sistema visual y assets:** definir tokens de color/tipo/espaciado; preparar recortes nítidos y elementos ornamentales con fondo transparente. Documentar su origen.
3. **Hero y secciones:** rehacer composición, jerarquía y versión móvil; integrar el camino, el lugar y el bloque de programa real.
4. **Scroll y estados:** añadir revelaciones progresivas con reducción de movimiento y contenido visible sin JavaScript.
5. **Formulario:** aplicar la nueva jerarquía y revelación condicional; cubrir estados, validación, foco y privacidad.
6. **Revisión:** comparar escritorio y móvil con la carta, revisar español/ucraniano, teclado, zoom, movimiento reducido, imágenes lentas y el flujo real de RSVP. Ejecutar las comprobaciones del proyecto.

### Criterios de aceptación

- A simple vista, hero, camino, lugar y formulario pertenecen al mismo universo visual que la carta física.
- Los nombres, la fecha, el lugar y la acción de confirmar se entienden sin esperar ninguna animación.
- La ruta ilustrada no se confunde con instrucciones de conducción ni introduce sedes no confirmadas.
- El formulario puede completarse por teclado o tacto, conserva respuestas tras errores y explica el uso de datos alimentarios.
- La experiencia funciona en español y ucraniano, en móvil y escritorio, con movimiento reducido y sin JavaScript.
