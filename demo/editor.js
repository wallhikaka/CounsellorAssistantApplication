(() => {
  'use strict';

  const layouts = {
    DAP: ['Data', 'Assessment', 'Plan'],
    SOAP: ['Subjective', 'Objective', 'Assessment', 'Plan'],
    Freeform: ['Note'],
  };
  const aliases = ['Client Fern', 'Client Willow', 'Client Clover', 'Client Reed', 'Client Sage', 'Client Birch', 'Client Hazel', 'Client Moss'];
  const help = {
    Data: 'What did the client share or demonstrate?',
    Assessment: 'What stood out in this session?',
    Plan: 'What did you agree to try next?',
    Subjective: 'What did the client describe in their own words?',
    Objective: 'What did you observe during the session?',
    Note: 'Write your fictional session note…',
  };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(text, className) {
    const result = element('button', className, text);
    result.type = 'button';
    return result;
  }

  function field(labelText, control) {
    const label = element('label', 'editor-field');
    label.append(element('span', 'field-caption', labelText), control);
    return label;
  }

  function select(options, selected) {
    const control = element('select');
    options.forEach(([value, label]) => control.add(new Option(label, value)));
    control.value = selected;
    return control;
  }

  function localDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return now.getFullYear() + '-' + month + '-' + day;
  }

  // Preserve every paragraph when changing formats, including sections with no direct equivalent.
  function convertSections(previous, values, next) {
    const content = Object.fromEntries(layouts[previous].map((label, index) => [label, values[index]]));
    if (next === 'Freeform') {
      return [Object.entries(content).filter(([, value]) => value.trim()).map(([label, value]) => label + '\n' + value).join('\n\n')];
    }
    if (previous === 'Freeform') return layouts[next].map((_, index) => index === 0 ? content.Note : '');
    if (next === 'SOAP') return [content.Data, '', content.Assessment, content.Plan];
    return [[content.Subjective, content.Objective].filter(value => value.trim()).join('\n\n'), content.Assessment, content.Plan];
  }

  window.openNoteEditor = ({note = null, type = 'DAP', onSave}) => {
    if (document.getElementById('editor')) return;
    const opener = document.activeElement;
    const dialog = element('dialog', 'editor-dialog');
    dialog.id = 'editor';
    dialog.setAttribute('aria-labelledby', 'editor-heading');

    const form = element('form', 'editor-form');
    form.method = 'dialog';
    form.autocomplete = 'off';
    form.spellcheck = false;
    const head = element('div', 'dialog-head');
    const heading = element('h2', '', note ? 'Edit session note' : 'New session note');
    heading.id = 'editor-heading';
    const closeButton = button('×', 'editor-close');
    closeButton.setAttribute('aria-label', 'Close editor');
    head.append(heading, closeButton);

    const body = element('div', 'dialog-body');
    const privacy = element('p', 'editor-privacy', 'Use fictional details only. Refreshing this tab clears your changes.');
    const title = element('input');
    title.type = 'text';
    title.required = true;
    title.maxLength = 120;
    title.value = note?.title ?? '';
    title.placeholder = 'Give this note a title';
    title.autocomplete = 'off';
    const alias = select([['', 'Choose a fictional alias'], ...aliases.map(value => [value, value])], note?.alias ?? '');
    alias.required = true;
    const date = element('input');
    date.type = 'date';
    date.required = true;
    date.value = note?.date ?? localDate();
    const meta = element('div', 'editor-meta');
    meta.append(field('Client alias', alias), field('Session date', date));
    let format = note?.type ?? (Object.hasOwn(layouts, type) ? type : 'DAP');
    const formatInput = select([['DAP', 'DAP · Data, Assessment, Plan'], ['SOAP', 'SOAP · Subjective, Objective, Assessment, Plan'], ['Freeform', 'Freeform']], format);
    const sections = element('div', 'editor-sections');
    const formatMemory = new Map();
    let inputs = [];

    function drawSections(values) {
      sections.replaceChildren();
      inputs = layouts[format].map((label, index) => {
        const area = element('textarea');
        area.rows = format === 'Freeform' ? 5 : 2;
        area.placeholder = help[label];
        area.spellcheck = false;
        area.autocomplete = 'off';
        area.value = values[index] ?? '';
        sections.append(field(label, area));
        return area;
      });
    }
    drawSections(note?.sections ?? []);
    const status = element('p', 'editor-sr');
    status.setAttribute('role', 'status');
    body.append(privacy, field('Note title', title), meta, field('Note format', formatInput), sections, status);
    const foot = element('div', 'dialog-foot');
    const cancel = button('Cancel', 'button secondary');
    const save = button('Save note', 'button primary');
    save.type = 'submit';
    foot.append(cancel, save);
    form.append(head, body, foot);
    dialog.append(form);
    document.body.append(dialog);

    const values = () => inputs.map(input => input.value);
    const signature = () => JSON.stringify([title.value, alias.value, date.value, format, values()]);
    const initial = signature();
    const closeOnExit = () => { if (dialog.open) dialog.close(); };
    window.addEventListener('pagehide', closeOnExit, {once: true});
    formatInput.addEventListener('change', () => {
      const previous = format;
      const previousValues = values();
      formatMemory.set(previous, previousValues);
      format = formatInput.value;
      drawSections(formatMemory.get(format) ?? convertSections(previous, previousValues, format));
      status.textContent = 'Switched to ' + format + '. Your text is available in the new layout.';
    });
    sections.addEventListener('input', () => {
      formatMemory.clear();
      inputs[0].setCustomValidity('');
    });
    title.addEventListener('input', () => title.setCustomValidity(''));

    function requestClose() {
      if (dialog.querySelector('.editor-discard')) return;
      if (signature() === initial) {
        dialog.close();
        return;
      }
      const focused = document.activeElement;
      form.hidden = true;
      const panel = element('section', 'editor-discard');
      const confirmHeading = element('h2', '', 'Discard unsaved changes?');
      confirmHeading.id = 'editor-discard-heading';
      const copy = element('p', '', 'Your edits since opening this note will be lost.');
      const actions = element('div', 'dialog-foot');
      const keep = button('Keep editing', 'button primary');
      const discard = button('Discard changes', 'button secondary');
      actions.append(discard, keep);
      panel.append(confirmHeading, copy, actions);
      dialog.append(panel);
      dialog.setAttribute('aria-labelledby', confirmHeading.id);
      keep.focus();

      function keepEditing() {
        panel.remove();
        form.hidden = false;
        dialog.setAttribute('aria-labelledby', heading.id);
        (focused?.isConnected ? focused : title).focus();
      }
      keep.addEventListener('click', keepEditing);
      discard.addEventListener('click', () => dialog.close());
    }
    closeButton.addEventListener('click', requestClose);
    cancel.addEventListener('click', requestClose);
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      const keep = dialog.querySelector('.editor-discard .primary');
      if (keep) keep.click();
      else requestClose();
    });
    dialog.addEventListener('close', () => {
      window.removeEventListener('pagehide', closeOnExit);
      inputs.forEach(input => { input.value = ''; });
      title.value = '';
      formatMemory.clear();
      dialog.remove();
      if (opener?.isConnected && document.activeElement === document.body) opener.focus();
    }, {once: true});
    form.addEventListener('submit', event => {
      event.preventDefault();
      title.setCustomValidity(title.value.trim() ? '' : 'Enter a title for this note.');
      const paragraphs = values().map(value => value.trim());
      inputs[0].setCustomValidity(paragraphs.some(Boolean) ? '' : 'Write something in at least one note section.');
      if (!form.reportValidity()) return;
      const saved = {
        id: note?.id ?? ('note-' + Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16).padStart(8, '0')).join('')),
        title: title.value.trim(),
        alias: alias.value,
        date: date.value,
        type: format,
        starred: note?.starred ?? false,
        trashed: note?.trashed ?? false,
        sections: paragraphs,
      };
      dialog.close();
      onSave(saved);
    });
    dialog.showModal();
    title.focus();
  };
})();
