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
  const roomHot = $('discoveries');
  const directory = $('directory');
  const directoryButton = $('btn-directory');
  const info = $('info');
  const places = $('locations');
  const homePositions = [
    [['health', 11, 30], ['industrial', 31, 34], ['research', 50, 44],
      ['plant', 69, 44], ['environment', 83, 32], ['orientation', 91, 51],
      ['intro', 27, 76]],
    [['food', 15, 47], ['analyses', 39, 47], ['forensic', 58, 53],
      ['marine', 76, 48], ['space', 91, 52]],
    [['bioeconomy', 31, 43], ['europe', 73, 43]],
  ];
  const shortNames = {
    food: 'Alimentation', analyses: 'Bioanalyses', forensic: 'Forensiques',
    marine: 'Marine', space: 'Spatial', industrial: 'Industrie',
    environment: 'Eau', plant: 'Végétal', health: 'Santé', research: 'Recherche',
    orientation: 'Métiers', bioeconomy: 'Bioéconomie', europe: 'Europe biotech',
  };
  let plaza = 0;
  let homePlaza = 0;
  let zone = null;
  let roomIndex = 0;
  let panX = 0;
  let moveStart = null;
  let infoTrigger = null;

  function makePlus(label, action) {
    const button = document.createElement('button');
    button.className = 'hot';
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.innerHTML = '<span class="cross" aria-hidden="true"></span><span class="hint"></span>';
    button.querySelector('.hint').textContent = label;
    button.addEventListener('click', action);
    return button;
  }

  function renderHomeHotspots() {
    hotLayer.replaceChildren();
    const mobile = $('mobile-worlds');
    mobile.replaceChildren();
    for (const [id] of homePositions[plaza]) {
      const label = id === 'intro' ? `Découvrir les ${Object.keys(Z).length} univers` : Z[id].name;
      const button = makePlus(label, () => id === 'intro' ? toggleDirectory(true) : goZone(id));
      button.id = `home-${id}`;
      hotLayer.appendChild(button);
      if (id === 'intro') continue;
      const quick = document.createElement('button');
      quick.type = 'button';
      quick.textContent = shortNames[id] || label;
      quick.setAttribute('aria-label', `Visiter ${label}`);
      quick.addEventListener('click', () => goZone(id));
      mobile.appendChild(quick);
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
    $('mobile-worlds').hidden = !onHome;
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
    for (const id of ['btn-back', 'room-pos', 'hero', 'location-actions']) $(id).hidden = true;
    roomHot.replaceChildren();
    places.replaceChildren();
    scene.style.backgroundImage = 'none';
    plaza = homePlaza;
    renderHomeHotspots();
    campusImg.src = plazaAsset();
    updatePlazaNav();
    imageDims();
  }

  function goZone(id) {
    if (!Z[id]) return;
    zone = id;
    roomIndex = 0;
    homePlaza = homePositions.findIndex(positions => positions.some(p => p[0] === id));
    if (homePlaza < 0) homePlaza = 0;
    showRoom();
  }

  function showRoom() {
    if (!zone) return;
    const data = Z[zone];
    const room = data.rooms[roomIndex];
    for (const id of ['new-poles', 'plaza-nav', 'mobile-worlds']) $(id).hidden = true;
    closeInfo(false);
    toggleDirectory(false);
    scene.classList.remove('home', 'next');
    campusImg.classList.remove('on');
    $('home-guide').classList.add('hidden');
    for (const id of ['btn-back', 'room-pos', 'hero', 'location-actions']) $(id).hidden = false;
    void scene.offsetWidth;
    scene.style.backgroundImage = `url("${A[room.asset]}")`;
    scene.dataset.zone = zone;
    scene.dataset.room = String(roomIndex);
    scene.setAttribute('role', 'group');
    scene.setAttribute('aria-label', `Vue immersive : ${room.name}`);
    scene.classList.add('next');
    $('hero-tag').textContent = `${data.tag} · ${room.name}`;
    $('hero-title').textContent = room.name;
    $('hero-subtitle').textContent = room.subtitle;
    $('room-pos').textContent = zone === 'research' || zone === 'industrial'
      ? roomIndex === 0 ? `${data.name} · Parvis` : `${data.name} · espace ${roomIndex}/${data.rooms.length - 1}`
      : `${data.name} · ${roomIndex + 1}/${data.rooms.length}`;

    roomHot.replaceChildren();
    room.points.forEach((point, index) => {
      const button = makePlus(point.title, () => openInfo(index, button));
      if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
        button.style.left = `${point.x}%`;
        button.style.top = `${point.y}%`;
      }
      roomHot.appendChild(button);
    });

    places.replaceChildren();
    data.rooms.forEach((place, index) => {
      const button = document.createElement('button');
      button.className = 'place';
      button.type = 'button';
      button.setAttribute('aria-current', String(roomIndex === index));
      button.innerHTML = '<img alt="" loading="lazy"><span></span>';
      button.querySelector('img').src = A[place.asset];
      button.querySelector('span').textContent = place.name;
      button.addEventListener('click', () => {
        if (roomIndex === index) return;
        roomIndex = index;
        showRoom();
      });
      places.appendChild(button);
    });
    if (data.rooms.length > 3) {
      const selected = places.children[roomIndex];
      const goal = selected.offsetLeft - places.offsetLeft - (places.clientWidth - selected.clientWidth) / 2;
      places.scrollTo({ left: Math.max(0, goal), behavior: 'instant' });
    }
    $('btn-prev').disabled = roomIndex === 0;
    $('btn-prev').style.opacity = roomIndex === 0 ? '.45' : '1';
    $('btn-next').textContent = roomIndex === data.rooms.length - 1 ? '← Revoir le parvis'
      : roomIndex === 0 && zone === 'research' ? 'Entrer dans le grand hall →'
      : roomIndex === 0 && zone === 'industrial' ? 'Entrer dans l’atelier →' : 'Lieu suivant →';
    $('btn-next').disabled = false;
  }

  function openInfo(index, trigger) {
    const data = Z[zone];
    const room = data.rooms[roomIndex];
    const point = room.points[index];
    infoTrigger = trigger;
    $('info-context').textContent = `${data.name} · ${room.name}`;
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
    if (!zone) return;
    roomIndex = (roomIndex + offset + Z[zone].rooms.length) % Z[zone].rooms.length;
    showRoom();
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
    directoryButton.textContent = `☷ Explorer les ${Object.keys(Z).length} univers`;
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
  $('btn-prev').addEventListener('click', () => navigate(-1));
  $('btn-next').addEventListener('click', () => navigate(1));
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
