"use strict";
// Regressão: debrid nativo (Real-Debrid/TorBox) deve escolher o arquivo de
// VÍDEO, não o primeiro (.url/.png/.nfo) — mesmo comportamento do StremThru.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const repo = process.env.PROJACK_REPO || "/home/vinicius/docker/apps/prowjack";
const {
  pickNativeVideoFile,
  pickRdVideoLink,
  NATIVE_VIDEO_RE,
  NATIVE_NON_VIDEO_RE,
} = require(`${repo}/debrid`);

test("pickNativeVideoFile: filme escolhe o maior vídeo, ignora .url/.png", () => {
  const files = [
    { id: "0", filename: "movie.url", filesize: 1 },
    { id: "1", filename: "poster.png", filesize: 500 },
    { id: "2", filename: "info.nfo", filesize: 2 },
    { id: "3", filename: "Filme.2024.1080p.mkv", filesize: 4000000000 },
    { id: "4", filename: "sample.mp4", filesize: 50000000 },
  ];
  const picked = pickNativeVideoFile(files, null, null, false);
  assert.equal(picked.id, "3");
});

test("pickNativeVideoFile: série escolhe episódio correspondente", () => {
  const files = [
    { id: "0", filename: "S01E01.mkv", filesize: 1000000000 },
    { id: "1", filename: "S01E02.mkv", filesize: 1100000000 },
    { id: "2", filename: "S01E03.png", filesize: 999999999 },
  ];
  const picked = pickNativeVideoFile(files, 1, 2, false);
  assert.equal(picked.id, "1");
});

test("pickNativeVideoFile: sem vídeo, evita não-vídeo se houver alternativa", () => {
  const files = [
    { id: "0", filename: "a.url", size: 2 },
    { id: "1", filename: "b.png", size: 1000 },
    { id: "2", filename: "c.bin", size: 5000 },
  ];
  const picked = pickNativeVideoFile(files, null, null, false);
  assert.equal(picked.id, "2"); // .bin não está na lista explícita de não-vídeo
});

test("pickRdVideoLink: escolhe link de vídeo por files/name", () => {
  const info = {
    links: [
      "https://rd/abc/movie.url",
      "https://rd/def/poster.png",
      "https://rd/123/Filme.2024.1080p.mkv",
    ],
  };
  assert.ok(NATIVE_VIDEO_RE.test("Filme.2024.1080p.mkv"));
  assert.ok(NATIVE_NON_VIDEO_RE.test("movie.url"));
  const link = pickRdVideoLink(info);
  assert.ok(link.includes("Filme.2024.1080p.mkv"), link);
});

test("pickRdVideoLink: sem vídeo, pula não-vídeo se existir link alternativo", () => {
  const info = { links: ["https://rd/a/1.url", "https://rd/b/IMG_001.png", "https://rd/c/data.bin"] };
  const link = pickRdVideoLink(info);
  assert.ok(link.includes("data.bin"), link);
});

test("pickRdVideoLink: somente não-vídeo → retorna o primeiro como fallback", () => {
  const info = { links: ["https://rd/a/1.url", "https://rd/b/2.png"] };
  assert.ok(pickRdVideoLink(info));
});
