(function (global) {
  const state = { timer: null, frames: [], idx: 0, speedMs: 350, timeField: null, objectIdField: 'OBJECTID', onFrame: null };

  function findOidField(info) {
    const oidByType = (info.fields || []).find(f => f.type === 'esriFieldTypeOID');
    if (oidByType) return oidByType.name;
    if (info.objectIdField) return info.objectIdField;
    return 'objectid'; // fallback
  }

  function pickTimeField(info) {
    const names = (info.fields || []).map(f => f.name);
    const lowerSet = new Set(names.map(n => n.toLowerCase()));

    // Preferir end_time si existe, luego start_time
    const pref = [];
    if (info.timeInfo) {
      if (info.timeInfo.endTimeField) pref.push(info.timeInfo.endTimeField);
      if (info.timeInfo.startTimeField) pref.push(info.timeInfo.startTimeField);
    }
    pref.push('end_time','End_Time','start_time','Start_Time');

    for (const cand of pref) {
      const lc = cand.toLowerCase();
      if (lowerSet.has(lc)) {
        // devolver con la capitalización real del campo
        return names.find(n => n.toLowerCase() === lc);
      }
    }
    return null;
  }

async function obtenerFramesGOES(url, hours = 10, maxFrames = 60) {
  const info = await fetch(`${url}?f=json`).then(r => r.json());
  const objectIdField = findOidField(info);
  const timeField = pickTimeField(info); // debería resolver 'end_time'

  const serviceEndMs = info?.timeInfo?.timeExtent?.[1];
  const anchorMs = (typeof serviceEndMs === 'number' ? serviceEndMs : Date.now());
  const startMs = anchorMs - (hours * 60 * 60 * 1000);

  // 1) Traer SOLO los más recientes: orderBy DESC + limitar a maxFrames
  const where = timeField ? `${timeField} >= ${startMs}` : '1=1';
  const outFields = '*';
  const orderBy = timeField ? `${timeField} desc` : `${objectIdField} desc`;

  let q = `${url}/query?where=${encodeURIComponent(where)}&outFields=${encodeURIComponent(outFields)}&orderByFields=${encodeURIComponent(orderBy)}&returnGeometry=false&resultRecordCount=${maxFrames}&f=json`;
  let json = await fetch(q).then(r => r.json()).catch(() => ({}));

  if (!json.features || !json.features.length) {
    // Fallback sin filtro temporal, aún en DESC para tomar los más recientes
    q = `${url}/query?where=1%3D1&outFields=${encodeURIComponent(outFields)}&orderByFields=${encodeURIComponent(orderBy)}&returnGeometry=false&resultRecordCount=${maxFrames}&f=json`;
    json = await fetch(q).then(r => r.json()).catch(() => ({}));
  }

  const feats = (json.features || []);

  // 2) Mapear atributos, quedarnos solo con los que traen tiempo válido
  function getAttrCI(attrs, fieldName) {
    if (!attrs || !fieldName) return null;
    if (attrs[fieldName] != null) return attrs[fieldName];
    const lc = fieldName.toLowerCase();
    const k = Object.keys(attrs).find(x => x.toLowerCase() === lc);
    return k ? attrs[k] : null;
  }

  const framesDesc = feats.map(f => {
    const attrs = f.attributes || {};
    // id robusto
    let id = getAttrCI(attrs, objectIdField);
    // timestamp desde end_time (o timeField resuelto)
    let ts = getAttrCI(attrs, timeField);
    ts = (ts != null) ? Number(ts) : null;
    if (ts > 0 && ts < 10000000000) ts *= 1000; // s -> ms
    return { id, t: (typeof ts === 'number' && isFinite(ts)) ? ts : null };
  })
  .filter(f => f.id != null && typeof f.t === 'number');

  // 3) framesDesc está en DESC (más reciente primero). Para animación cronológica, invertimos:
  const framesAsc = framesDesc.slice().reverse();

  // Guardar en estado
  state.objectIdField = objectIdField;
  state.timeField = timeField;

  console.log(`GOES13: obtenidos=${feats.length}, con tiempo=${framesDesc.length}, devueltos(asc)=${framesAsc.length}, timeField=${timeField}`);
  return { frames: framesAsc, objectIdField, timeField };
}

function iniciarAnimacionGOES13(layer) {
  if (!state.frames.length) return;
  detenerAnimacionGOES13();

  // Iniciar desde el primer frame (más antiguo en la ventana)
  state.idx = 0;

  state.timer = setInterval(() => {
    try {
      const frame = state.frames[state.idx];
      const mr = { mosaicMethod: 'esriMosaicLockRaster', lockRasterIds: [frame.id] };
      if (layer && typeof layer.setMosaicRule === 'function') layer.setMosaicRule(mr);
      if (typeof state.onFrame === 'function') { try { state.onFrame(frame, state.idx); } catch {} }
    } finally {
      state.idx = (state.idx + 1) % state.frames.length; // avanzar en orden cronológico
    }
  }, state.speedMs);
}

  function detenerAnimacionGOES13() {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
  }
  function setGOES13Speed(ms) {
    state.speedMs = Math.max(50, Number(ms) || 350);
    if (state.timer && global.capaGOES13) iniciarAnimacionGOES13(global.capaGOES13);
  }
  function onFrame(cb) { state.onFrame = typeof cb === 'function' ? cb : null; }

  global.GOES13Anim = { state, obtenerFramesGOES, iniciarAnimacionGOES13, detenerAnimacionGOES13, setGOES13Speed, onFrame };
})(window);