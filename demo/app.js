(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const views = {all: 'All notes', starred: 'Starred', trash: 'Trash', DAP: 'DAP notes', SOAP: 'SOAP notes', Freeform: 'Freeform notes'};
  const formats = {DAP: ['Data','Assessment','Plan'], SOAP: ['Subjective','Objective','Assessment','Plan'], Freeform: ['Note']};
  const noteList = $('#list');
  const detail = $('#detail');
  const search = $('#search');
  const confirmDialog = $('#confirm');
  const shortDate = new Intl.DateTimeFormat('en-NZ', {day:'numeric',month:'short'});
  const longDate = new Intl.DateTimeFormat('en-NZ', {day:'numeric',month:'long',year:'numeric'});
  let notes = copyExamples();
  let view = 'all';
  let selected = notes[0].id;
  let newestFirst = true;
  let confirmAction = null;

  function copyExamples() {
    return SEED_NOTES.map(note => ({...note, sections: [...note.sections]}));
  }
  function make(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function graphic(name, cls) {
    const span = make('span', cls);
    span.innerHTML = icon(name);
    return span;
  }
  function action(label, name, symbol, classes, iconOnly = false) {
    const btn = make('button', classes);
    btn.type = 'button';
    btn.dataset.do = name;
    if (symbol) btn.append(graphic(symbol));
    if (iconOnly) {
      btn.setAttribute('aria-label', label);
      btn.title = label;
    } else {
      btn.append(document.createTextNode(label));
    }
    return btn;
  }
  function formatDate(value, formatter) {
    const date = new Date(value + 'T12:00:00');
    return Number.isNaN(date.getTime()) ? '' : formatter.format(date);
  }
  function fitsView(note) {
    if (view === 'trash') return note.trashed;
    if (note.trashed) return false;
    return view === 'all' || (view === 'starred' ? note.starred : note.type === view);
  }
  function filtered() {
    const q = search.value.trim().toLocaleLowerCase();
    return notes.filter(note => fitsView(note) && (!q || [note.title, note.alias, note.type, ...note.sections].some(s => s.toLocaleLowerCase().includes(q))))
      .sort((a,b) => newestFirst ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  }
  function say(message) {
    $('#status').textContent = message;
  }
  function placeFocus(selector) {
    document.querySelector(selector)?.focus({preventScroll:true});
  }
  function renderNav() {
    const live = notes.filter(note => !note.trashed);
    $('#count-all').textContent = live.length;
    $('#count-starred').textContent = live.filter(note => note.starred).length;
    $('#count-trash').textContent = notes.length - live.length;
    for (const item of document.querySelectorAll('[data-view]')) {
      item.classList.toggle('active',item.dataset.view === view);
      if (item.dataset.view === view) item.setAttribute('aria-current','page');
      else item.removeAttribute('aria-current');
    }
    $('#list-title').textContent = views[view];
  }
  function row(note) {
    const btn = make('button', 'row' + (selected === note.id ? ' selected' : ''));
    btn.type = 'button';
    btn.dataset.note = note.id;
    btn.setAttribute('aria-pressed',String(selected === note.id));
    const tile = graphic('file', 'file-tile tile ' + note.type.toLowerCase());
    const copy = make('span','row-copy');
    const top = make('span','row-title-line');
    top.append(make('span','row-title',note.title));
    if (note.starred) {
      const star = graphic('star','row-star');
      star.append(make('span','sr-only','Starred'));
      top.append(star);
    }
    const meta = make('span','row-meta');
    meta.append(make('span','',note.alias),make('span','meta-dot','·'),make('span','',formatDate(note.date,shortDate)));
    copy.append(top,meta);
    btn.append(tile,copy);
    return btn;
  }
  function emptyCard(heading, copy, symbol, extraClass = '') {
    const box = make('div','empty ' + extraClass);
    box.append(graphic(symbol),make('h3','',heading),make('p','',copy));
    return box;
  }
  function renderIndex(matches) {
    $('#result-count').textContent = String(matches.length);
    const sort = $('#sortBtn');
    sort.innerHTML = icon(newestFirst ? 'sort-down' : 'sort-up');
    sort.setAttribute('aria-label',newestFirst ? 'Sort notes by oldest first' : 'Sort notes by newest first');
    sort.title = newestFirst ? 'Newest first · change sort order' : 'Oldest first · change sort order';
    noteList.replaceChildren(...matches.map(row));
    if (matches.length) return;
    let box;
    if (search.value.trim()) {
      box = emptyCard('No matching notes','Try another word or clear your search.','search');
      box.append(action('Clear search','clear-search',null,'button secondary'));
    } else if (view === 'trash') {
      box = emptyCard('Trash is empty','Notes you move to Trash appear here.','trash');
    } else if (view === 'starred') {
      box = emptyCard('No starred notes','Use the star on a note to keep it here.','star');
    } else {
      box = emptyCard('No notes yet','Create a fictional session note to begin.','notebook');
      if (!notes.length && view === 'all') box.append(action('Load fictional examples','examples',null,'button secondary'));
    }
    noteList.append(box);
  }
  function renderDetail(note) {
    const bar = make('div','detail-bar');
    const caption = make('span','caption');
    caption.append(graphic('eye'), document.createTextNode('Note preview'));
    bar.append(caption);
    detail.replaceChildren(bar);
    if (!note) {
      detail.append(emptyCard('No note selected','Choose a note from the list to read it here.','notebook','detail-empty'));
      return;
    }
    const controls = make('div','bar-actions');
    if (note.trashed) {
      controls.append(action('Delete permanently','delete','trash','icon-button',true));
    } else {
      const star = action(note.starred ? 'Remove star' : 'Star note','star','star','icon-button' + (note.starred ? ' on' : ''),true);
      star.setAttribute('aria-pressed',String(note.starred));
      controls.append(star,action('Move to Trash','trash','trash','icon-button',true));
    }
    bar.append(controls);
    const body = make('div','detail-body');
    const badge = make('span','tag ' + note.type.toLowerCase(),note.type + ' note');
    const title = make('h2','detail-title',note.title);
    const meta = make('div','detail-meta');
    const client = make('span');
    client.append(graphic('user'),document.createTextNode(note.alias));
    const date = make('span');
    date.append(graphic('calendar'),document.createTextNode(formatDate(note.date,longDate)));
    meta.append(client,date);
    const content = make('div','detail-copy');
    formats[note.type].forEach((name,idx) => {
      if (!note.sections[idx]) return;
      const section = make('section','note-section');
      const letter = make('span','section-letter',name.charAt(0));
      letter.setAttribute('aria-hidden','true');
      const block = make('div');
      block.append(make('h3','',name),make('p','',note.sections[idx]));
      section.append(letter,block);
      content.append(section);
    });
    body.append(badge,title,meta,content);
    const foot = make('div','detail-bottom');
    const info = make('small');
    info.append(graphic('shield'),document.createTextNode('Tab memory only'));
    foot.append(info,note.trashed ? action('Restore note','restore','restore','button secondary') : action('Edit note','edit','edit','button secondary'));
    detail.append(body,foot);
  }
  function render() {
    const matches = filtered();
    const current = matches.find(note => note.id === selected) ?? matches[0];
    selected = current?.id ?? null;
    renderNav();
    renderIndex(matches);
    renderDetail(current);
  }
  function setMenu(open) {
    $('#rail').classList.toggle('open',open);
    $('#scrim').hidden = !open;
    $('#menuBtn').setAttribute('aria-expanded',String(open));
    $('.shell').inert = open;
    if (open) placeFocus('.mobile-close');
  }
  const mobileMenu = matchMedia('(max-width:800px)');
  mobileMenu.addEventListener('change',() => setMenu(false));
  function navigate(next) {
    view = next;
    search.value = '';
    setMenu(false);
    render();
    if (mobileMenu.matches) placeFocus('#menuBtn');
  }
  function ask(title,copy,label,callback) {
    $('#confirm-title').textContent = title;
    $('#confirm-copy').textContent = copy;
    $('#accept-confirm').textContent = label;
    confirmAction = callback;
    confirmDialog.showModal();
  }
  $('#cancel-confirm').addEventListener('click',() => confirmDialog.close());
  $('#accept-confirm').addEventListener('click',() => {
    const callback = confirmAction;
    confirmAction = null;
    confirmDialog.close();
    callback?.();
  });
  confirmDialog.addEventListener('close',() => { confirmAction = null; });
  function save(note) {
    const index = notes.findIndex(existing => existing.id === note.id);
    if (index >= 0) notes[index] = note;
    else notes.unshift(note);
    if (!fitsView(note)) view = 'all';
    search.value = '';
    selected = note.id;
    render();
    placeFocus('[data-do="edit"]');
    say('Note saved in this tab.');
  }
  const commands = {
    menu() {
      const open = $('#scrim').hidden;
      setMenu(open);
      if (!open) placeFocus('#menuBtn');
    },
    new() { window.openNoteEditor({note:null,type:formats[view] ? view : 'DAP',onSave:save}); },
    edit(note) { if (note && !note.trashed) window.openNoteEditor({note,onSave:save}); },
    sort() { newestFirst = !newestFirst; render(); say(newestFirst ? 'Newest notes first.' : 'Oldest notes first.'); },
    star(note) {
      if (!note || note.trashed) return;
      note.starred = !note.starred;
      render();
      placeFocus(selected ? '[data-do="star"]' : '[data-view="starred"]');
      say(note.starred ? 'Note starred.' : 'Star removed.');
    },
    trash(note) {
      if (!note) return;
      note.trashed = true;
      render();
      placeFocus(selected ? '.row.selected' : '#search');
      say('Note moved to Trash. You can restore it from Trash.');
    },
    restore(note) {
      if (!note) return;
      note.trashed = false;
      render();
      placeFocus(selected ? '.row.selected' : '#search');
      say('Note restored to All notes.');
    },
    delete(note) {
      if (!note?.trashed) return;
      ask('Delete this note?', 'This removes the note from this session, including Trash.', 'Delete note', () => {
        notes = notes.filter(item => item.id !== note.id);
        render();
        placeFocus('#search');
        say('Note deleted.');
      });
    },
    clear() {
      setMenu(false);
      ask('Clear this workspace?', 'All notes and edits in this tab will be removed, including notes in Trash.', 'Clear workspace',() => {
        notes = [];
        selected = null;
        navigate('all');
        placeFocus('[data-do="new"]');
        say('Workspace cleared.');
      });
    },
    examples() { notes = copyExamples(); newestFirst = true; navigate('all'); placeFocus('.row.selected'); say('Fictional examples loaded.'); },
    'clear-search'() { search.value = ''; render(); search.focus(); }
  };
  document.addEventListener('click',event => {
    const el = event.target.closest('button');
    if (!el) return;
    if (el.dataset.note) {
      selected = el.dataset.note;
      render();
      if (matchMedia('(max-width:640px)').matches) {
        detail.focus({preventScroll:true});
        detail.scrollIntoView({block:'start'});
      } else placeFocus('.row.selected');
    } else if (el.dataset.view) {
      navigate(el.dataset.view);
    } else if (Object.hasOwn(commands,el.dataset.do)) {
      commands[el.dataset.do](notes.find(note => note.id === selected));
    }
  });
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape' && !$('#scrim').hidden) { setMenu(false); placeFocus('#menuBtn'); }
  });
  search.addEventListener('input', () => { render(); say($('#result-count').textContent + ' matching notes.'); });
  window.addEventListener('pagehide',() => {
    notes = []; selected = null; search.value = ''; confirmAction = null;
    if (confirmDialog.open) confirmDialog.close();
    noteList.replaceChildren(); detail.replaceChildren(); say('');
  });
  window.addEventListener('pageshow',event => {
    if (event.persisted) {
      notes = copyExamples(); selected = notes[0].id; newestFirst = true; navigate('all');
    }
  });
  search.value = '';
  render();
})();
