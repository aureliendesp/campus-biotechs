// Campus Biotechs Occitanie — navigation issue de la V27.
// Les textes et la correspondance des images se modifient dans leurs JSON.
async function loadJSON(path) {
  const response = await fetch(new URL(path, document.baseURI));
  if (!response.ok) throw new Error(`Chargement impossible : ${path} (${response.status})`);
  return response.json();
}

async function startCampus() {
  const [A, Z] = await Promise.all([
    loadJSON('./assets/images.json'),
    loadJSON('./contenus.json'),
  ]);
  const $ = id => document.getElementById(id);
  const app = $('app');
  const scene = $('scene');
  const campusImg = $('campus-image');
  const hotLayer = $('home-hotspots');
  const zoneUi = $('zone-ui');
  const enterMarker = $('btn-enter');
  const exploreButton = $('explore-pavilion');
  const dnaTemplate = $('dna-icon');
  const roomHot = $('discoveries');
  const directory = $('directory');
  const directoryButton = $('btn-directory');
  const info = $('info');
  const places = $('locations');
  const homePositions = [
    [['health', 11, 30], ['industrial', 31, 34], ['research', 50, 44],
      ['plant', 69, 44], ['environment', 83, 32], ['orientation', 91, 51]],
    [['food', 15, 47], ['analyses', 39, 47], ['forensic', 58, 53],
      ['marine', 76, 48], ['space', 91, 52]],
    [['bioeconomy', 31, 43], ['europe', 73, 43]],
  ];
  let plaza = 0;
  let homePlaza = 0;
  let zone = null;
  let roomIndex = 0;
  let panX = 0;
  let moveStart = null;
  let infoTrigger = null;

  function makeHotspot(label, action, isEntry = false) {
    const button = document.createElement('button');
    button.className = isEntry ? 'hot entry-marker' : 'hot';
    button.type = 'button';
    button.setAttribute('aria-label', label);
    const hint = document.createElement('span');
    hint.className = 'hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = label;
    if (isEntry) {
      button.append(dnaTemplate.content.cloneNode(true));
    } else {
      const cross = document.createElement('span');
      cross.className = 'cross';
      cross.setAttribute('aria-hidden', 'true');
      button.append(cross);
    }
    button.append(hint);
    button.addEventListener('click', action);
    return button;
  }

  function renderHomeHotspots() {
    hotLayer.replaceChildren();
    for (const [id] of homePositions[plaza]) {
      const button = makeHotspot(Z[id].name, () => goZone(id), true);
      button.id = `home-${id}`;
      hotLayer.appendChild(button);
    }
  }

  function imageDims() {
    const w = scene.clientWidth;
    const h = scene.clientHeight;
    const scale = Math.max(w / (campusImg.naturalWidth || 1672), h / (campusImg.naturalHeight || 941));
    const rw = (campusImg.naturalWidth || 1672) * scale;
    const rh = (campusImg.naturalHeight || 941) * scale;
    const limit = Math.max(0, (rw - w) / 2);
    panX = Math.max(-limit, Math.min(limit, panX));
    const left = (w - rw) / 2 + panX;
    const top = (h - rh) / 2;
    campusImg.style.cssText = `left:${left}px;top:${top}px;width:${rw}px;height:${rh}px`;
    for (const [id, x, y] of homePositions[plaza]) {
      const button = $(`home-${id}`);
      if (!button) continue;
      const bx = left + rw * x / 100;
      const by = top + rh * y / 100;
      button.style.left = `${bx}px`;
      button.style.top = `${by}px`;
      button.style.display = bx < 0 || bx > w || by < 0 || by > h ? 'none' : '';
    }
  }

  function updatePlazaNav() {
    const onHome = !zone;
    $('plaza-nav').hidden = !onHome;
    if (!onHome) return;
    const names = ['Parvis principal', 'Parvis des nouveaux pôles', 'Parvis Bioéconomie & Europe'];
    const guides = [
      'Six grands domaines : explorez les bâtiments ou avancez vers les autres parvis',
      'Cinq pôles spécialisés : explorez les bâtiments ou avancez vers le troisième parvis',
      'Deux pavillons : découvrez la bioéconomie et les dynamiques biotech européennes',
    ];
    $('plaza-count').textContent = `${String(plaza + 1).padStart(2, '0')} / 03`;
    $('plaza-name').textContent = names[plaza];
    $('plaza-left').disabled = plaza === 0;
    $('plaza-right').disabled = plaza === 2;
    $('plaza-left').setAttribute('aria-label', plaza === 0 ? 'Aucun parvis précédent' : 'Retour au parvis précédent');
    $('plaza-right').setAttribute('aria-label', plaza === 2 ? 'Dernier parvis' : 'Découvrir le parvis suivant');
    $('new-poles').hidden = plaza === 2;
    $('new-poles').textContent = `Parvis ${String(plaza + 2).padStart(2, '0')} / 03`;
    $('new-poles').setAttribute('aria-label', 'Visiter le parvis suivant');
    $('home-guide').textContent = guides[plaza];
  }

  function plazaAsset() {
    return [A.campus, A.campus_extension, A.campus_third_parvis][plaza];
  }

  function setPlaza(next) {
    if (next < 0 || next >= homePositions.length) return;
    plaza = next;
    homePlaza = next;
    panX = 0;
    renderHomeHotspots();
    campusImg.classList.remove('plaza-transition');
    void campusImg.offsetWidth;
    campusImg.classList.add('plaza-transition');
    campusImg.src = plazaAsset();
    updatePlazaNav();
    imageDims();
  }

  function home() {
    const previousZone = zone;
    zone = null;
    roomIndex = 0;
    closeInfo(false);
    toggleDirectory(false);
    scene.classList.add('home');
    scene.removeAttribute('data-zone');
    scene.removeAttribute('data-room');
    scene.removeAttribute('role');
    scene.setAttribute('aria-label', 'Panorama du campus');
    campusImg.classList.add('on');
    $('home-guide').classList.remove('hidden');
    for (const id of ['btn-back', 'room-pos']) $(id).hidden = true;
    zoneUi.hidden = true;
    roomHot.replaceChildren();
    places.replaceChildren();
    scene.style.backgroundImage = 'none';
    plaza = homePlaza;
    renderHomeHotspots();
    campusImg.src = plazaAsset();
    updatePlazaNav();
    imageDims();
    if (previousZone) {
      const marker = $(`home-${previousZone}`);
      const target = marker && marker.style.display !== 'none' ? marker : directoryButton;
      target.focus({ preventScroll: true });
    }
  }

  function goZone(id) {
    if (!Z[id]) return;
    zone = id;
    homePlaza = homePositions.findIndex(positions => positions.some(p => p[0] === id));
    if (homePlaza < 0) homePlaza = 0;
    showRoom(0);
  }

  function showRoom(index) {
    const data = Z[zone];
    const room = data.rooms[index];
    const overview = index === 0;
    roomIndex = index;
    for (const id of ['new-poles', 'plaza-nav']) $(id).hidden = true;
    closeInfo(false);
    toggleDirectory(false);
    scene.classList.remove('home', 'next');
    campusImg.classList.remove('on');
    $('home-guide').classList.add('hidden');
    $('btn-back').hidden = false;
    $('room-pos').hidden = overview;
    $('room-pos').textContent = `Salle ${index} / ${data.rooms.length - 1}`;
    zoneUi.hidden = false;
    enterMarker.hidden = exploreButton.hidden = !overview || data.rooms.length < 2;
    void scene.offsetWidth;
    scene.style.backgroundImage = `url("${A[room.asset]}")`;
    scene.dataset.zone = zone;
    scene.dataset.room = String(index);
    scene.setAttribute('role', 'group');
    const title = overview ? data.name : room.name;
    scene.setAttribute('aria-label', `Vue immersive — ${title}`);
    scene.classList.add('next');
    $('hero-title').textContent = title;
    $('hero-subtitle').textContent = overview ? data.subtitle : room.subtitle;
    $('hero-details').open = true;

    renderDiscoveries(room.points, overview);
    renderPlaces(data.rooms, overview);
    $('hero-summary').focus({ preventScroll: true });
  }

  function renderDiscoveries(points, overview) {
    roomHot.replaceChildren();
    // Leave the center clear for entering, and separate legacy points with the same coordinates.
    const rows = Math.max(1, Math.ceil(points.length / 2) - 1);
    const anchors = points.map((_, index) => [
      index % 2 === 0 ? 27 : 73,
      33 + 34 * Math.floor(index / 2) / rows,
    ]);
    const occupied = [];
    const fits = ([x, y]) => occupied.every(([otherX, otherY]) =>
      Math.abs(x - otherX) >= 15 || Math.abs(y - otherY) >= 20);
    points.forEach((point, index) => {
      const configured = !overview && Number.isFinite(point.x) && Number.isFinite(point.y);
      const preferred = configured ? [point.x, point.y] : anchors[index];
      const position = fits(preferred) ? preferred : anchors.find(fits) ?? preferred;
      const [x, y] = position;
      occupied.push(position);
      const button = makeHotspot(point.title, () => openInfo(index, button));
      button.style.setProperty('--point-x', `${x}%`);
      button.style.setProperty('--point-y', `${y}%`);
      roomHot.appendChild(button);
    });
  }

  function renderPlaces(rooms, overview) {
    places.replaceChildren();
    places.hidden = overview;
    if (overview) return;

    rooms.forEach((place, index) => {
      const current = roomIndex === index;
      const button = document.createElement('button');
      button.className = 'place';
      button.type = 'button';
      button.setAttribute('aria-current', String(current));
      button.innerHTML = '<span class="place-image"><img alt="" loading="lazy"></span><span class="place-label"></span>';
      const thumbnail = button.querySelector('.place-image');
      thumbnail.querySelector('img').src = A[place.asset];
      button.querySelector('.place-label').textContent = index === 0 ? 'Présentation' : place.name;
      if (index === 0) {
        const badge = document.createElement('span');
        badge.className = 'place-return';
        badge.setAttribute('aria-hidden', 'true');
        badge.textContent = '←';
        thumbnail.append(badge);
      }
      button.addEventListener('click', () => {
        if (!current) showRoom(index);
      });
      places.appendChild(button);
    });
    if (places.scrollWidth > places.clientWidth) {
      const selected = places.children[roomIndex];
      places.scrollLeft = selected.offsetLeft - (places.clientWidth - selected.clientWidth) / 2;
    }
  }

  function openInfo(index, trigger) {
    const point = Z[zone].rooms[roomIndex].points[index];
    infoTrigger = trigger;
    $('info-title').textContent = point.title;
    $('discovery-body').textContent = point.body || [point.issue, point.solution].filter(Boolean).join(' ');
    $('term-name').textContent = point.term || '';
    $('term-def').textContent = point.definition || '';
    $('term').hidden = !point.term;
    $('foot').textContent = point.source || '';
    $('foot').hidden = !point.source;
    info.classList.add('show');
    $('close-info').focus();
  }

  function closeInfo(restoreFocus = true) {
    const wasOpen = info.classList.contains('show');
    info.classList.remove('show');
    if (wasOpen && restoreFocus && infoTrigger?.isConnected) infoTrigger.focus();
    infoTrigger = null;
  }

  function navigate(offset) {
    const count = Z[zone].rooms.length;
    showRoom((roomIndex + offset + count) % count);
  }

  function buildNav() {
    const groups = [
      ['Parvis principal', ['research', 'health', 'industrial', 'environment', 'plant', 'orientation']],
      ['Second parvis · pôles spécialisés', ['food', 'analyses', 'forensic', 'marine', 'space']],
      ['Troisième parvis · bioéconomie et Europe', ['bioeconomy', 'europe']],
    ];
    groups.forEach(([title, keys], groupIndex) => {
      const heading = document.createElement('div');
      heading.className = 'dir-section';
      heading.textContent = title;
      directory.appendChild(heading);
      keys.forEach(key => {
        const data = Z[key];
        const button = document.createElement('button');
        button.type = 'button';
        if (groupIndex === 0) {
          button.textContent = `${data.name}  ›`;
        } else {
          button.className = 'dir-new';
          const image = document.createElement('img');
          image.alt = '';
          image.loading = 'lazy';
          image.src = A[data.rooms[0].asset];
          const label = document.createElement('span');
          label.textContent = data.name;
          const description = document.createElement('small');
          description.textContent = data.subtitle;
          label.appendChild(description);
          button.append(image, label);
        }
        button.addEventListener('click', () => goZone(key));
        directory.appendChild(button);
      });
    });
    const label = `Explorer les ${Object.keys(Z).length} univers`;
    directoryButton.setAttribute('aria-label', label);
    directoryButton.title = label;
  }

  function toggleDirectory(force) {
    const open = typeof force === 'boolean' ? force : !directory.classList.contains('show');
    directory.classList.toggle('show', open);
    directoryButton.setAttribute('aria-expanded', String(open));
  }

  $('new-poles').addEventListener('click', () => {
    if (zone) home();
    setPlaza(plaza + 1);
  });
  $('plaza-left').addEventListener('click', () => setPlaza(plaza - 1));
  $('plaza-right').addEventListener('click', () => setPlaza(plaza + 1));
  $('btn-back').addEventListener('click', home);
  $('close-info').addEventListener('click', () => closeInfo());
  enterMarker.append(dnaTemplate.content.cloneNode(true));
  const enterPavilion = () => showRoom(1);
  enterMarker.addEventListener('click', enterPavilion);
  exploreButton.addEventListener('click', enterPavilion);
  directoryButton.addEventListener('click', () => toggleDirectory());
  $('full').addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    const fallback = () => {
      if (location.protocol !== 'about:') window.open(location.href, '_blank', 'noopener');
    };
    if (app.requestFullscreen) {
      const result = app.requestFullscreen();
      if (result?.catch) result.catch(fallback);
    } else fallback();
  });
  document.addEventListener('fullscreenchange', () => {
    $('full').textContent = document.fullscreenElement ? '×' : '⛶';
    $('full').setAttribute('aria-label', document.fullscreenElement ? 'Quitter le plein écran' : 'Plein écran');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (info.classList.contains('show')) closeInfo();
      else toggleDirectory(false);
      return;
    }
    if (info.classList.contains('show') || directory.classList.contains('show')) return;
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    if (zone) navigate(offset);
    else setPlaza(plaza + offset);
  });
  campusImg.addEventListener('load', imageDims);
  window.addEventListener('resize', imageDims);
  scene.addEventListener('pointerdown', event => {
    if (zone || event.target.closest('button')) return;
    moveStart = { id: event.pointerId, x: event.clientX, pan: panX };
    scene.setPointerCapture?.(event.pointerId);
  });
  scene.addEventListener('pointermove', event => {
    if (!moveStart || zone || moveStart.id !== event.pointerId) return;
    panX = moveStart.pan + event.clientX - moveStart.x;
    imageDims();
  });
  scene.addEventListener('pointerup', () => { moveStart = null; });
  scene.addEventListener('pointercancel', () => { moveStart = null; });
  scene.addEventListener('lostpointercapture', () => { moveStart = null; });

  buildNav();
  home();
  $('loading').remove();
  new Image().src = A.campus_extension;
  new Image().src = A.campus_third_parvis;
}

startCampus().catch(error => {
  console.error(error);
  const loading = document.getElementById('loading');
  loading.textContent = 'Le campus n’a pas pu se charger.';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Réessayer';
  retry.addEventListener('click', () => location.reload());
  loading.appendChild(retry);
});
