// All the editable content of the home page lives here.

import thor from '../assets/posters/thor_love_and_thunder.jpg';
import blackAdam from '../assets/posters/black_adam.jpg';
import boyKillsWorld from '../assets/posters/boy_kills_worlds.jpg';
import killersGame from '../assets/posters/killers_game.jpg';
import romulus from '../assets/posters/romulus.jpg';
import youngWoman from '../assets/posters/young_woman_and_the_sea.jpg';
import adagio from '../assets/posters/adagio.jpg';
import enea from '../assets/posters/enea.jpg';

export const site = {
  name: 'Kevin Rosso',
  firstName: 'Kevin',
  lastName: 'Rosso',
  role: 'Rigging TD',
  title: "Kevin Rosso - Rigging TD",
  description:
    'Kevin Rosso, Rigging TD. Character and creature rigs, deformation, Python tools and USD pipelines for film and series.',

  // Line shown under the role on the home page, with the contact buttons. Empty = hidden.
  availability: 'Open to work',

  // Used to keep the "years" in the About section always up to date.
  riggingSince: '2022-03-01',
  codingSince: '2016-09-01',

  // GoatCounter site code (the "name" in https://name.goatcounter.com).
  // Leave empty to disable analytics.
  goatcounter: 'kevinrosso',

  // Topics listed in the structured data (what search engines know you for).
  knowsAbout: ['Character rigging', 'Creature rigging', 'Deformation and skinning', 'Python tooling', 'OpenUSD', 'Autodesk Maya', 'Unreal Engine Control Rig'],

  // The contact email is not stored here (this repository is public): it comes from the
  // CONTACT_EMAIL secret / .env value and is only shown to real visitors (see Contacts.astro).
  resumeUrl: 'https://drive.google.com/file/d/13sH9EtUJQd3JMTsrTn_S0Zl7RrK3B4VO/view',
  // Shown in the tabbed viewer of the About section. They are embedded straight from
  // Google Drive: replace the file on Drive keeping the same link (right click >
  // Manage versions > Upload new version) and the website updates by itself.
  // The files must be shared as "Anyone with the link: Viewer".
  documents: [
    { id: 'resume', label: 'Resume', fileId: '13sH9EtUJQd3JMTsrTn_S0Zl7RrK3B4VO' },
    { id: 'portfolio', label: 'Portfolio', fileId: '1I5REFrkIN40TamqfPeJyszqIjQQMSwos' },
  ],

  socials: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kevin-rosso/', icon: 'linkedin' },
    { label: 'IMDb', href: 'https://www.imdb.com/name/nm13685669/', icon: 'imdb' },
    { label: 'GitHub', href: 'https://github.com/vinRosso', icon: 'github' },
    // Add your Instagram URL here to show the icon, or leave it empty to hide it.
    { label: 'Instagram', href: '', icon: 'instagram' },
  ],

  posters: [
    { src: thor, title: 'Thor: Love and Thunder' },
    { src: blackAdam, title: 'Black Adam' },
    { src: boyKillsWorld, title: 'Boy Kills World' },
    { src: killersGame, title: "The Killer's Game" },
    { src: romulus, title: 'Romulus' },
    { src: youngWoman, title: 'Young Woman and the Sea' },
    { src: adagio, title: 'Adagio' },
    { src: enea, title: 'Enea' },
  ],

  experience: [
    { company: 'EDI Effetti Digitali Italiani', role: 'Pipeline TD', period: '2026 - now' },
    { company: 'EDI Effetti Digitali Italiani', role: 'Rigging TD', period: '2022 - 2026' },
    { company: 'Freelance', role: 'Rigging TD / 3D Generalist', period: '2020 - now' },
  ],

  credits: [
    { title: 'Ripley', year: 2024 },
    { title: 'Young Woman and the Sea', year: 2024 },
    { title: 'Boy Kills World', year: 2023 },
    { title: 'Thor: Love and Thunder', year: 2022 },
    { title: 'Black Adam', year: 2022 },
  ],
};

export function yearsSince(date: string, now = new Date()): number {
  const start = new Date(date);
  let years = now.getFullYear() - start.getFullYear();
  const beforeAnniversary =
    now.getMonth() < start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() < start.getDate());
  if (beforeAnniversary) years -= 1;
  return years;
}
