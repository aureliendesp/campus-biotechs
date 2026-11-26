import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const readJSON = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const zones = await readJSON('contenus.json');
const assets = await readJSON('assets/images.json');
let rooms = 0;
let discoveries = 0;

for (const [id, zone] of Object.entries(zones)) {
  assert.ok(zone.name && zone.tag && Array.isArray(zone.rooms) && zone.rooms.length, `Univers incomplet : ${id}`);
  for (const room of zone.rooms) {
    rooms++;
    assert.ok(room.name && room.subtitle && assets[room.asset], `Lieu incomplet : ${id} / ${room.name}`);
    assert.ok(Array.isArray(room.points), `Fiches manquantes : ${room.name}`);
    if (room.entry) {
      assert.ok(room.entry.label?.trim(), `Libellé d’entrée manquant : ${room.name}`);
      assert.ok(zone.rooms.some(target => target !== room && target.asset === room.entry.asset), `Destination introuvable : ${room.name}`);
    }
    for (const point of room.points) {
      discoveries++;
      assert.ok(point.title && (point.body || point.issue || point.solution), `Fiche vide : ${room.name}`);
      if (point.term) assert.ok(point.definition, `Définition absente : ${point.title}`);
      for (const axis of ['x', 'y']) {
        if (point[axis] !== undefined) assert.ok(Number.isFinite(point[axis]) && point[axis] >= 0 && point[axis] <= 100, `Position invalide : ${point.title}`);
      }
    }
  }
}
for (const id of ['campus', 'campus_extension', 'campus_third_parvis']) assert.ok(assets[id], `Parvis manquant : ${id}`);
for (const [id, path] of Object.entries(assets)) {
  assert.match(path, /^images\/[a-zA-Z0-9_\-]+\.(png|webp|jpe?g)$/u, `Chemin invalide : ${id}`);
  assert.ok((await stat(new URL(path, root))).isFile(), `Image absente : ${path}`);
  const exactNames = await readdir(new URL('images/', root));
  assert.ok(exactNames.includes(path.slice('images/'.length)), `Casse incorrecte : ${path}`);
}
const html = await readFile(new URL('index.html', root), 'utf8');
for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)(?:[?#][^"]*)?"/gu)) {
  assert.ok((await stat(new URL(match[1], root))).isFile(), `Fichier absent : ${match[1]}`);
}
console.log(`${Object.keys(zones).length} univers · ${rooms} lieux · ${discoveries} fiches · ${Object.keys(assets).length} références d’images : OK`);
