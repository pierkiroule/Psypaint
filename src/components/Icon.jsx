const paths = {
  water: <><path d="M12 2.8S6.5 9 6.5 13.1a5.5 5.5 0 0 0 11 0C17.5 9 12 2.8 12 2.8Z"/><path d="M9.2 14.1a3 3 0 0 0 2.3 2.1"/></>,
  ink: <><path d="m4 20 4.4-1.1L19 8.3 15.7 5 5.1 15.6 4 20Z"/><path d="m13.8 6.9 3.3 3.3M5.1 15.6l3.3 3.3M15 5l1.2-1.2a1.6 1.6 0 0 1 2.3 0l1.7 1.7a1.6 1.6 0 0 1 0 2.3L19 9"/></>,
  pencil: <><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4M4 16l4 4"/></>,
  bloom: <><circle cx="12" cy="12" r="2"/><path d="M12 10c-2.8-1.5-3.7-5.2-1.5-6.2C12.7 2.8 14 6.1 12 10Zm2 2c1.5-2.8 5.2-3.7 6.2-1.5C21.2 12.7 17.9 14 14 12Zm-2 2c2.8 1.5 3.7 5.2 1.5 6.2C11.3 21.2 10 17.9 12 14Zm-2-2c-1.5 2.8-5.2 3.7-6.2 1.5C2.8 11.3 6.1 10 10 12Z"/></>,
  leaf: <><path d="M19.8 4.2C12 4.4 6.4 7.4 5.2 12.3c-.8 3.1 1.2 5.8 4.4 5.1 5.2-1.1 8.3-6.6 10.2-13.2Z"/><path d="M4 20c2.6-4.6 6.2-7.5 11-10"/></>,
  play: <path d="m9 7 7 5-7 5V7Z" fill="currentColor" stroke="none"/>, pause: <><path d="M9 7v10M15 7v10"/></>,
  volume: <><path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="M15 9.5c1.3 1.2 1.3 3.8 0 5M17.5 7c3 2.7 3 7.3 0 10"/></>,
  undo: <><path d="m8 8-4 4 4 4"/><path d="M5 12h7a6 6 0 0 1 6 6"/></>,
  trash: <><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 10v6M14 10v6"/></>,
  camera: <><path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z"/><circle cx="12" cy="13" r="3"/></>,
  expand: <><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/><path d="m4 9 5-5m6 0 5 5M4 15l5 5m6 0 5-5"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>, music: <><path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></>,
};
export function Icon({ name, size = 20 }) { return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>; }
