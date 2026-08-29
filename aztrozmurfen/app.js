const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

const reveals = document.querySelectorAll('.reveal');
reveals.forEach((item) => {
  const delay = item.dataset.delay;
  if (delay) item.style.setProperty('--delay', `${delay}ms`);
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach((item) => observer.observe(item));
} else {
  reveals.forEach((item) => item.classList.add('is-visible'));
}

const albums = {
  'interztellar-zmurfination': {
    title: 'Interztellar Zmurfination',
    folder: 'Interztellar Zmurfination',
    art: 'assets/interztellar-zmurfination.png',
    tracks: [
      ['Under The Stars Tonight', '01 - Under The Stars Tonight.mp3'],
      ['Fire It Up', '02 - Fire It Up.mp3'],
      ['Hope', '03 - Hope.mp3'],
      ['Nobody Listen To My Call', '04 - Nobody Listen To My Call.mp3'],
      ['I Just Wanna Smoke', '05 - I Just Wanna Smoke.mp3'],
      ['Trash', '06 - Trash.mp3'],
      ['Empty Space', '07 - Empty Space.mp3'],
      ['Metal Cowboy', '08 - Metal Cowboy.mp3'],
      ['I Watch The Sunset', '09 - I Watch The Sunset.mp3'],
      ['The Buzz On', '10 - The Buzz On.mp3'],
      ['Everything Will Be Alright', '11 - Everything Will Be Alright.mp3'],
      ['Four Twenty', '12 - Four Twenty.mp3'],
      ["It's Your Smile", "13 - It's Your Smile.mp3"],
      ['Headlights', '14 - Headlights.mp3']
    ]
  },
  'zmurf-oddity': {
    title: 'Zmurf Oddity',
    folder: 'Zmurf Oddity',
    art: 'assets/zmurf-oddity.png',
    tracks: [
      ['The Hills Have Eyes', '01 - The Hills Have Eyes.mp3'],
      ['Zmurf Oddity', '02 - Zmurf Oddity.mp3'],
      ["Don't Go Away", "03 - Don't Go Away.mp3"],
      ['Lost In Space', '04 - Lost In Space.mp3'],
      ['The Wizard', '05 - The Wizard.mp3'],
      ['Far Away From Me', '06 - Far Away From Me.mp3'],
      ['Superhero', '07 - Superhero.mp3'],
      ['Masterpiece', '08 - Masterpiece.mp3'],
      ['I Miss You So Much', '09 - I Miss You So Much.mp3'],
      ['Beautiful Time', '10 - Beautiful Time.mp3'],
      ['Dreams', '11 - Dreams.mp3'],
      ['Slow Down', '12 - Slow Down.mp3'],
      ['Future In Your Past', '13 - Future In Your Past.mp3'],
      ['Holy Roller', '14 - Holy Roller.mp3']
    ]
  }
};

const audio = document.getElementById('audioPlayer');
const player = document.getElementById('player');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const playerArt = document.getElementById('playerArt');
const playerElapsed = document.getElementById('playerElapsed');
const playerDuration = document.getElementById('playerDuration');
const progressTrack = document.getElementById('progressTrack');
const progressFill = document.getElementById('progressFill');
const playButton = document.getElementById('playButton');
const previousButton = document.getElementById('previousButton');
const nextButton = document.getElementById('nextButton');
const shuffleButton = document.getElementById('shuffleButton');
const repeatButton = document.getElementById('repeatButton');

let currentAlbumKey = null;
let currentTrackIndex = -1;
let shuffle = false;
let repeat = false;

function audioPath(album, filename) {
  return encodeURI(`assets/audio/${album.folder}/${filename}`);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function getCurrentTrack() {
  if (!currentAlbumKey || currentTrackIndex < 0) return null;
  const album = albums[currentAlbumKey];
  const track = album?.tracks[currentTrackIndex];
  if (!album || !track) return null;
  return { album, track };
}

function renderTrackLists() {
  Object.entries(albums).forEach(([albumKey, album]) => {
    const list = document.getElementById(`tracks-${albumKey}`);
    if (!list) return;

    list.innerHTML = album.tracks.map((track, index) => `
      <li>
        <button class="track-button" type="button" data-album="${albumKey}" data-track="${index}">
          <span class="track-number">${String(index + 1).padStart(2, '0')}</span>
          <span class="track-name">${track[0]}</span>
          <span class="track-play">▶</span>
        </button>
      </li>
    `).join('');
  });

  document.querySelectorAll('.track-button').forEach((button) => {
    button.addEventListener('click', () => {
      loadTrack(button.dataset.album, Number(button.dataset.track), true);
    });
  });
}

function markActiveTrack() {
  document.querySelectorAll('.track-button').forEach((button) => {
    const active = button.dataset.album === currentAlbumKey && Number(button.dataset.track) === currentTrackIndex;
    button.classList.toggle('is-playing', active);
    const icon = button.querySelector('.track-play');
    if (icon) icon.textContent = active && !audio.paused ? '❚❚' : '▶';
  });

  document.querySelectorAll('[data-album-card]').forEach((card) => {
    card.classList.toggle('is-current-album', card.dataset.albumCard === currentAlbumKey);
  });
}

function updateMediaSession(album, trackTitle) {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: trackTitle,
    artist: 'Aztrozmurfen',
    album: album.title,
    artwork: [
      { src: album.art, sizes: '512x512', type: 'image/png' }
    ]
  });
}

function loadTrack(albumKey, trackIndex, autoplay = true) {
  const album = albums[albumKey];
  if (!album || !album.tracks[trackIndex] || !audio) return;

  const [title, filename] = album.tracks[trackIndex];
  currentAlbumKey = albumKey;
  currentTrackIndex = trackIndex;

  audio.src = audioPath(album, filename);
  audio.load();

  if (playerTitle) playerTitle.textContent = title;
  if (playerArtist) playerArtist.textContent = `Aztrozmurfen · ${album.title}`;
  if (playerArt) {
    playerArt.src = album.art;
    playerArt.alt = `${album.title} cover`;
  }
  if (playerElapsed) playerElapsed.textContent = '0:00';
  if (playerDuration) playerDuration.textContent = '0:00';
  if (progressFill) progressFill.style.width = '0%';

  updateMediaSession(album, title);
  markActiveTrack();

  if (autoplay) {
    audio.play().catch((error) => {
      console.warn('The audio file could not be started:', audio.src, error);
    });
  }

  if (player) {
    player.classList.add('pulse-player');
    setTimeout(() => player.classList.remove('pulse-player'), 550);
  }
}

function playAlbum(albumKey) {
  if (!albums[albumKey]) return;
  loadTrack(albumKey, 0, true);
}

function togglePlay() {
  if (!audio) return;

  if (!audio.src) {
    playAlbum('interztellar-zmurfination');
    return;
  }

  if (audio.paused) {
    audio.play().catch((error) => console.warn('Playback failed:', error));
  } else {
    audio.pause();
  }
}

function nextTrack() {
  if (!currentAlbumKey) {
    playAlbum('interztellar-zmurfination');
    return;
  }

  const album = albums[currentAlbumKey];
  let nextIndex;

  if (shuffle) {
    if (album.tracks.length === 1) {
      nextIndex = 0;
    } else {
      do {
        nextIndex = Math.floor(Math.random() * album.tracks.length);
      } while (nextIndex === currentTrackIndex);
    }
  } else {
    nextIndex = currentTrackIndex + 1;
    if (nextIndex >= album.tracks.length) nextIndex = 0;
  }

  loadTrack(currentAlbumKey, nextIndex, true);
}

function previousTrack() {
  if (!currentAlbumKey) {
    playAlbum('interztellar-zmurfination');
    return;
  }

  if (audio.currentTime > 4) {
    audio.currentTime = 0;
    return;
  }

  const album = albums[currentAlbumKey];
  let previousIndex = currentTrackIndex - 1;
  if (previousIndex < 0) previousIndex = album.tracks.length - 1;
  loadTrack(currentAlbumKey, previousIndex, true);
}

function updatePlayerState() {
  if (!audio) return;

  if (playButton) {
    playButton.textContent = audio.paused ? '▶' : '❚❚';
    playButton.setAttribute('aria-label', audio.paused ? 'Play' : 'Pause');
    playButton.title = audio.paused ? 'Play' : 'Pause';
  }

  markActiveTrack();
}

renderTrackLists();

document.querySelectorAll('.album-play').forEach((button) => {
  button.addEventListener('click', () => playAlbum(button.dataset.album));
});

playButton?.addEventListener('click', togglePlay);
previousButton?.addEventListener('click', previousTrack);
nextButton?.addEventListener('click', nextTrack);

shuffleButton?.addEventListener('click', () => {
  shuffle = !shuffle;
  shuffleButton.classList.toggle('is-active', shuffle);
  shuffleButton.setAttribute('aria-pressed', String(shuffle));
});

repeatButton?.addEventListener('click', () => {
  repeat = !repeat;
  repeatButton.classList.toggle('is-active', repeat);
  repeatButton.setAttribute('aria-pressed', String(repeat));
});

audio?.addEventListener('play', updatePlayerState);
audio?.addEventListener('pause', updatePlayerState);
audio?.addEventListener('loadedmetadata', () => {
  if (playerDuration) playerDuration.textContent = formatTime(audio.duration);
});
audio?.addEventListener('timeupdate', () => {
  const ratio = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  if (progressFill) progressFill.style.width = `${ratio}%`;
  if (playerElapsed) playerElapsed.textContent = formatTime(audio.currentTime);
  if (playerDuration) playerDuration.textContent = formatTime(audio.duration);
});
audio?.addEventListener('ended', () => {
  if (repeat) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } else {
    nextTrack();
  }
});
audio?.addEventListener('error', () => {
  console.warn('Audio file not found or could not be decoded:', audio.currentSrc || audio.src);
  if (playerArtist) playerArtist.textContent = 'Audio file not found — check assets/audio path';
});

progressTrack?.addEventListener('click', (event) => {
  if (!audio?.duration) return;
  const rect = progressTrack.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  audio.currentTime = ratio * audio.duration;
});

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => audio?.play());
  navigator.mediaSession.setActionHandler('pause', () => audio?.pause());
  navigator.mediaSession.setActionHandler('previoustrack', previousTrack);
  navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
}
