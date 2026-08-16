/**
 * Academic Content Studio (admin.js)
 * Enables non-coding students to visually edit and export config.json, publications.json, etc.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Tab Switching
  const tabs = document.querySelectorAll('.admin-tab-btn');
  const contents = document.querySelectorAll('.admin-tab-content');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      contents.forEach((c) => (c.style.display = 'none'));

      tab.classList.add('active');
      const target = document.getElementById(tab.getAttribute('data-tab'));
      if (target) target.style.display = 'block';
    });
  });

  // Shared Link Labels dictionary and formatter
  const LINK_LABELS = {
    pdf: 'PDF',
    arxiv: 'arXiv',
    code: 'Code',
    github: 'GitHub',
    project: 'Project',
    video: 'Video',
    recording: 'Recording',
    slides: 'Slides',
    poster: 'Poster',
    paper: 'Paper',
    doi: 'DOI',
    dataset: 'Dataset',
    data: 'Data',
    demo: 'Demo',
    docs: 'Docs',
    documentation: 'Docs',
    syllabus: 'Syllabus',
    materials: 'Course Materials',
    coursepage: 'Course Page',
    coursePage: 'Course Page',
    website: 'Website',
    site: 'Website',
    event: 'Event Page',
    certificate: 'Certificate',
    thesis: 'Thesis',
    notes: 'Lecture Notes',
    assignment: 'Assignments',
    changelog: 'Changelog',
    photos: 'Photos'
  };

  function formatLinkLabel(key) {
    if (!key) return 'Link';
    if (LINK_LABELS[key]) return LINK_LABELS[key];
    if (LINK_LABELS[key.toLowerCase()]) return LINK_LABELS[key.toLowerCase()];
    return key
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Renders a JSON string into an output box with syntax highlighting (via highlight.js).
  // outputEl is the .output-box div; it holds a <code class="language-json"> child.
  function renderJsonOutput(outputEl, jsonStr) {
    if (!outputEl) return;
    let codeEl = outputEl.querySelector('code');
    if (!codeEl) {
      codeEl = document.createElement('code');
      outputEl.innerHTML = '';
      outputEl.appendChild(codeEl);
    }
    codeEl.className = 'language-json';
    codeEl.textContent = jsonStr;
    if (window.hljs && typeof hljs.highlightElement === 'function') {
      hljs.highlightElement(codeEl);
    }
  }

  // Copies the currently generated JSON text (not yet-generated placeholder text) to the clipboard.
  function copyOutputText(outputEl, btn) {
    if (!outputEl || !btn) return;
    const codeEl = outputEl.querySelector('code');
    const text = codeEl ? codeEl.textContent : outputEl.textContent;
    if (!text || text.trim().startsWith('//')) return; // nothing generated yet

    const showCopied = () => {
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      setTimeout(() => { btn.innerHTML = original; }, 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showCopied).catch(() => {
        fallbackCopy(text);
        showCopied();
      });
    } else {
      fallbackCopy(text);
      showCopied();
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (err) { /* no-op */ }
    document.body.removeChild(ta);
  }

  // Wire up every "Copy JSON" button declared via data-copy-target across all sections.
  document.querySelectorAll('[data-copy-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.getAttribute('data-copy-target'));
      copyOutputText(target, btn);
    });
  });

  // Prepopulate Config Form
  let currentConfig = null;
  try {
    const res = await fetch('content/config.json');
    if (res.ok) {
      currentConfig = await res.json();
      populateConfigForm(currentConfig);
    }
  } catch (err) {
    console.warn('Could not auto-load config.json in studio:', err);
  }

  function populateConfigForm(cfg) {
    if (!cfg || !cfg.author) return;
    document.getElementById('cfg_name').value = cfg.author.name || '';
    document.getElementById('cfg_title').value = cfg.author.title || '';
    document.getElementById('cfg_department').value = cfg.author.department || '';
    document.getElementById('cfg_institution').value = cfg.author.institution || '';
    document.getElementById('cfg_location').value = cfg.author.location || '';
    document.getElementById('cfg_email').value = cfg.author.email || '';
    document.getElementById('cfg_phone').value = cfg.author.phone || '';
    document.getElementById('cfg_avatar').value = cfg.author.avatar || 'images/profile.jpg';
    document.getElementById('cfg_bio').value = cfg.author.bio || '';
    document.getElementById('cfg_interests').value = (cfg.author.interests || []).join(', ');
    document.getElementById('cfg_copyright').value = (cfg.footer && cfg.footer.copyrightText) || `© 2026 ${cfg.author.name}. All rights reserved.`;
    document.getElementById('cfg_customnote').value = (cfg.footer && cfg.footer.customNote) || '';

    // showCopyright checkbox
    const showCopyrightBox = document.getElementById('feat_showcopyright');
    if (showCopyrightBox) {
      showCopyrightBox.checked = cfg.footer ? cfg.footer.showCopyright !== false : true;
    }

    // Prepopulate navigation checkboxes and titles.
    // A nav id is "checked" only if it exists in the saved navigation array.
    const navIds = ['about', 'publications', 'talks', 'teaching', 'portfolio', 'blog', 'cv'];
    const savedNav = cfg.navigation || [];
    navIds.forEach((id) => {
      const enableBox = document.getElementById(`nav_enable_${id}`);
      const titleBox = document.getElementById(`nav_title_${id}`);
      const match = savedNav.find((n) => n.id === id);
      if (enableBox) enableBox.checked = !!match;
      if (titleBox && match) titleBox.value = match.title || titleBox.value;
    });

    // Prepopulate feature checkboxes
    const featureMap = {
      feat_mathjax: 'enableMathJaxKaTeX',
      feat_codehighlight: 'enableCodeHighlighting',
      feat_codecopy: 'enableCodeCopyButton',
      feat_darkmode: 'enableDarkMode',
      feat_search: 'enableGlobalSearch',
      feat_bibtex: 'enableBibtexModal'
    };
    if (cfg.features) {
      Object.keys(featureMap).forEach((boxId) => {
        const box = document.getElementById(boxId);
        const key = featureMap[boxId];
        if (box && Object.prototype.hasOwnProperty.call(cfg.features, key)) {
          box.checked = !!cfg.features[key];
        }
      });
    }

    // Prepopulate social links by matching each saved entry back to its form box
    const socialFieldMap = {
      'Google Scholar': 'cfg_social_scholar',
      'ORCID': 'cfg_social_orcid',
      'GitHub': 'cfg_social_github',
      'arXiv': 'cfg_social_arxiv',
      'LinkedIn': 'cfg_social_linkedin',
      'Twitter / X': 'cfg_social_twitter'
    };
    (cfg.author.social || []).forEach((entry) => {
      const fieldId = socialFieldMap[entry.name];
      const field = fieldId && document.getElementById(fieldId);
      if (field) field.value = entry.url || '';
    });
  }

  // Generate Config JSON
  const btnGenConfig = document.getElementById('btnGenerateConfig');
  const btnDlConfig = document.getElementById('btnDownloadConfig');
  const configOutput = document.getElementById('configOutputBox');

  function buildConfigObject() {
    const base = currentConfig || {
      baseUrl: "/",
      author: { social: [] },
      navigation: [
        { "id": "about", "title": "About", "icon": "fa-solid fa-user", "default": true },
        { "id": "publications", "title": "Publications", "icon": "fa-solid fa-book-open" },
        { "id": "talks", "title": "Talks", "icon": "fa-solid fa-person-chalkboard" },
        { "id": "teaching", "title": "Teaching", "icon": "fa-solid fa-chalkboard-user" },
        { "id": "portfolio", "title": "Portfolio", "icon": "fa-solid fa-laptop-code" },
        { "id": "blog", "title": "Blog", "icon": "fa-solid fa-pen-nib" },
        { "id": "cv", "title": "CV", "icon": "fa-solid fa-file-lines" }
      ],
      features: {
        enableMathJaxKaTeX: true,
        enableCodeHighlighting: true,
        enableCodeCopyButton: true,
        enableDarkMode: true,
        enableGlobalSearch: true,
        enableBibtexModal: true
      }
    };

    const name = document.getElementById('cfg_name').value.trim();
    base.siteTitle = name;
    base.author.name = name;
    base.author.title = document.getElementById('cfg_title').value.trim();
    base.author.department = document.getElementById('cfg_department').value.trim();
    base.author.institution = document.getElementById('cfg_institution').value.trim();
    base.author.location = document.getElementById('cfg_location').value.trim();
    base.author.email = document.getElementById('cfg_email').value.trim();
    base.author.phone = document.getElementById('cfg_phone').value.trim();
    base.author.avatar = document.getElementById('cfg_avatar').value.trim() || 'images/profile.jpg';
    base.author.bio = document.getElementById('cfg_bio').value.trim();
    
    const interests = document.getElementById('cfg_interests').value.split(',').map(s => s.trim()).filter(Boolean);
    base.author.interests = interests;

    base.footer = {
      showCopyright: document.getElementById('feat_showcopyright') ? document.getElementById('feat_showcopyright').checked : true,
      copyrightText: document.getElementById('cfg_copyright').value.trim() || `© 2026 ${name}. All rights reserved.`,
      customNote: document.getElementById('cfg_customnote').value.trim()
    };

    // Build the navigation menu from the checkboxes. Only ticked items are included.
    const navDefaults = [
      { id: 'about', icon: 'fa-solid fa-user', isDefault: true },
      { id: 'publications', icon: 'fa-solid fa-book-open' },
      { id: 'talks', icon: 'fa-solid fa-person-chalkboard' },
      { id: 'teaching', icon: 'fa-solid fa-chalkboard-user' },
      { id: 'portfolio', icon: 'fa-solid fa-laptop-code' },
      { id: 'blog', icon: 'fa-solid fa-pen-nib' },
      { id: 'cv', icon: 'fa-solid fa-file-lines' }
    ];
    const navigation = [];
    navDefaults.forEach((item) => {
      const enableBox = document.getElementById(`nav_enable_${item.id}`);
      const titleBox = document.getElementById(`nav_title_${item.id}`);
      if (enableBox && !enableBox.checked) return; // unticked, so leave it out of the menu
      const title = (titleBox && titleBox.value.trim()) || item.id;
      const entry = { id: item.id, title, icon: item.icon };
      if (item.isDefault) entry.default = true;
      navigation.push(entry);
    });
    base.navigation = navigation;

    // Build the features object from the checkboxes
    base.features = {
      enableMathJaxKaTeX: document.getElementById('feat_mathjax').checked,
      enableCodeHighlighting: document.getElementById('feat_codehighlight').checked,
      enableCodeCopyButton: document.getElementById('feat_codecopy').checked,
      enableDarkMode: document.getElementById('feat_darkmode').checked,
      enableGlobalSearch: document.getElementById('feat_search').checked,
      enableBibtexModal: document.getElementById('feat_bibtex').checked
    };

    // Build the social links array only from boxes the student actually filled in
    const socialSources = [
      { name: 'Google Scholar', icon: 'fa-brands fa-google-scholar', fieldId: 'cfg_social_scholar', display: 'Google Scholar' },
      { name: 'ORCID', icon: 'fa-brands fa-orcid', fieldId: 'cfg_social_orcid', display: null },
      { name: 'GitHub', icon: 'fa-brands fa-github', fieldId: 'cfg_social_github', display: null },
      { name: 'arXiv', icon: 'fa-solid fa-graduation-cap', fieldId: 'cfg_social_arxiv', display: 'arXiv Profile' },
      { name: 'LinkedIn', icon: 'fa-brands fa-linkedin', fieldId: 'cfg_social_linkedin', display: 'LinkedIn' },
      { name: 'Twitter / X', icon: 'fa-brands fa-x-twitter', fieldId: 'cfg_social_twitter', display: null }
    ];

    const social = [];
    socialSources.forEach((src) => {
      const field = document.getElementById(src.fieldId);
      const url = field && field.value.trim();
      if (!url) return; // skip empty boxes
      let display = src.display;
      if (!display) {
        // Turn the URL into a short readable label, e.g. github.com/username
        display = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      }
      social.push({ name: src.name, icon: src.icon, url, display });
    });

    // Email is always added last if the student entered an email address
    if (base.author.email) {
      social.push({
        name: 'Email',
        icon: 'fa-solid fa-envelope',
        url: `mailto:${base.author.email}`,
        display: base.author.email
      });
    }

    base.author.social = social;

    return base;
  }

  if (btnGenConfig) {
    btnGenConfig.addEventListener('click', () => {
      const cfgObj = buildConfigObject();
      const jsonStr = JSON.stringify(cfgObj, null, 2);
      renderJsonOutput(configOutput, jsonStr);
    });
  }

  if (btnDlConfig) {
    btnDlConfig.addEventListener('click', () => {
      const cfgObj = buildConfigObject();
      const jsonStr = JSON.stringify(cfgObj, null, 2);
      downloadFile(jsonStr, 'config.json', 'application/json');
    });
  }

  // Publications: load existing file first so edits don't wipe out what's already there
  let currentPublications = [];
  try {
    const res = await fetch('content/publications.json');
    if (res.ok) currentPublications = await res.json();
  } catch (err) {
    console.warn('Could not auto-load publications.json in studio:', err);
  }

  let tempPubLinks = {}; // links being built for the publication currently in the form
  let editingPubIndex = null; // index into currentPublications being edited, or null

  const pubOutput = document.getElementById('pubOutputBox');
  const btnGenPub = document.getElementById('btnGeneratePub');
  const btnCancelPubEdit = document.getElementById('btnCancelPubEdit');
  const btnAddPubLink = document.getElementById('btnAddPubLink');
  const btnCancelPubLinkEdit = document.getElementById('btnCancelPubLinkEdit');
  const pubLinkType = document.getElementById('pub_link_type');
  const pubLinkCustomWrap = document.getElementById('pub_link_customkey_wrap');
  const pubLinksChips = document.getElementById('pubLinksChips');
  const btnGeneratePubJson = document.getElementById('btnGeneratePubJson');
  const btnDownloadPub = document.getElementById('btnDownloadPub');

  const PUB_LINK_LABELS = {
    pdf: 'PDF', arxiv: 'arXiv', code: 'Code', project: 'Project', video: 'Video',
    poster: 'Poster', slides: 'Slides', doi: 'DOI', dataset: 'Dataset'
  };

  let editingPubLinkKey = null; // key in tempPubLinks currently loaded into the link form, or null

  if (pubLinkType) {
    pubLinkType.addEventListener('change', () => {
      pubLinkCustomWrap.style.display = pubLinkType.value === 'other' ? 'block' : 'none';
    });
  }

  function cancelPubLinkEdit() {
    editingPubLinkKey = null;
    document.getElementById('pub_link_url').value = '';
    document.getElementById('pub_link_customkey').value = '';
    btnAddPubLink.innerHTML = '<i class="fa-solid fa-link"></i> Add Link';
    if (btnCancelPubLinkEdit) btnCancelPubLinkEdit.style.display = 'none';
  }

  function startPubLinkEdit(key) {
    editingPubLinkKey = key;
    const knownTypes = Array.from(pubLinkType.options).map(o => o.value);
    if (knownTypes.includes(key)) {
      pubLinkType.value = key;
      pubLinkCustomWrap.style.display = 'none';
    } else {
      pubLinkType.value = 'other';
      pubLinkCustomWrap.style.display = 'block';
      document.getElementById('pub_link_customkey').value = key;
    }
    document.getElementById('pub_link_url').value = tempPubLinks[key] || '';
    btnAddPubLink.innerHTML = '<i class="fa-solid fa-check"></i> Update Link';
    if (btnCancelPubLinkEdit) btnCancelPubLinkEdit.style.display = 'inline-flex';
  }

  function renderPubLinkChips() {
    if (!pubLinksChips) return;
    pubLinksChips.innerHTML = '';
    Object.keys(tempPubLinks).forEach((key) => {
      const label = formatLinkLabel(key);
      const chip = document.createElement('span');
      chip.className = 'btn-chip';
      chip.style.cssText = 'padding: 0.3rem 0.7rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.5rem;';
      chip.innerHTML = `<button type="button" data-edit-link="${key}" style="border:none; background:none; cursor:pointer; color:inherit; font:inherit; padding:0;" title="Click to edit this link">${label}</button> <button type="button" data-remove-link="${key}" style="border:none; background:none; cursor:pointer; color: var(--text-secondary); font-weight:700;">&times;</button>`;
      pubLinksChips.appendChild(chip);
    });
    pubLinksChips.querySelectorAll('[data-edit-link]').forEach((btn) => {
      btn.addEventListener('click', () => startPubLinkEdit(btn.getAttribute('data-edit-link')));
    });
    pubLinksChips.querySelectorAll('[data-remove-link]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-remove-link');
        delete tempPubLinks[key];
        if (editingPubLinkKey === key) cancelPubLinkEdit();
        renderPubLinkChips();
      });
    });
  }

  if (btnAddPubLink) {
    btnAddPubLink.addEventListener('click', () => {
      const type = pubLinkType.value;
      const url = document.getElementById('pub_link_url').value.trim();
      if (!url) return;
      let key = type;
      if (type === 'other') {
        key = document.getElementById('pub_link_customkey').value.trim().toLowerCase().replace(/\s+/g, '_');
        if (!key) return;
      }
      if (editingPubLinkKey && editingPubLinkKey !== key) {
        delete tempPubLinks[editingPubLinkKey];
      }
      tempPubLinks[key] = url;
      cancelPubLinkEdit();
      renderPubLinkChips();
    });
  }

  if (btnCancelPubLinkEdit) btnCancelPubLinkEdit.addEventListener('click', cancelPubLinkEdit);

  function makePubId(authors, year, title) {
    const firstAuthor = ((authors[0] || '').trim().split(' ').pop() || 'author').toLowerCase().replace(/[^a-z]/g, '');
    const titleWord = (title || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)[0] || 'paper';
    return `${firstAuthor}${year}${titleWord}`;
  }

  function clearPubForm() {
    document.getElementById('pub_title').value = '';
    document.getElementById('pub_authors').value = '';
    document.getElementById('pub_type').value = 'Conference';
    document.getElementById('pub_venue').value = '';
    document.getElementById('pub_year').value = new Date().getFullYear();
    document.getElementById('pub_badge').value = '';
    document.getElementById('pub_selected').checked = false;
    document.getElementById('pub_abstract').value = '';
    document.getElementById('pub_bibtex').value = '';
    tempPubLinks = {};
    cancelPubLinkEdit();
    renderPubLinkChips();
  }

  function cancelPubEdit() {
    editingPubIndex = null;
    clearPubForm();
    btnGenPub.innerHTML = '<i class="fa-solid fa-plus"></i> Add This Publication';
    btnCancelPubEdit.style.display = 'none';
  }

  function startPubEdit(idx) {
    const pub = currentPublications[idx];
    if (!pub) return;
    editingPubIndex = idx;
    document.getElementById('pub_title').value = pub.title || '';
    document.getElementById('pub_authors').value = (pub.authors || []).join(', ');
    document.getElementById('pub_type').value = pub.type || 'Conference';
    document.getElementById('pub_venue').value = pub.venue || '';
    document.getElementById('pub_year').value = pub.year || new Date().getFullYear();
    document.getElementById('pub_badge').value = pub.badge || '';
    document.getElementById('pub_selected').checked = !!pub.selected;
    document.getElementById('pub_abstract').value = pub.abstract || '';
    document.getElementById('pub_bibtex').value = pub.bibtex || '';
    tempPubLinks = { ...(pub.links || {}) };
    cancelPubLinkEdit();
    renderPubLinkChips();
    btnGenPub.innerHTML = '<i class="fa-solid fa-check"></i> Update This Publication';
    btnCancelPubEdit.style.display = 'inline-flex';
  }

  function renderPubPreview() {
    const box = document.getElementById('pubPreviewList');
    if (!box) return;
    if (!currentPublications.length) {
      box.textContent = '// Publications you add will be listed here...';
      return;
    }
    let html = '';
    currentPublications.forEach((pub, idx) => {
      html += `<div style="display:flex; justify-content:space-between; align-items:center; padding: 0.4rem 0; border-top: 1px solid var(--border-color);">
        <span>&bull; <strong>${pub.title}</strong> — ${pub.venue || ''} (${pub.year || ''})</span>
        <span style="display:flex; gap:0.4rem; flex-shrink: 0;">
          <button type="button" class="btn-chip" data-edit-pub="${idx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Edit</button>
          <button type="button" class="btn-chip" data-remove-pub="${idx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Remove</button>
        </span>
      </div>`;
    });
    box.innerHTML = html;

    box.querySelectorAll('[data-edit-pub]').forEach((btn) => {
      btn.addEventListener('click', () => startPubEdit(Number(btn.getAttribute('data-edit-pub'))));
    });
    box.querySelectorAll('[data-remove-pub]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-remove-pub'));
        currentPublications.splice(idx, 1);
        if (editingPubIndex === idx) cancelPubEdit();
        renderPubPreview();
      });
    });
  }

  if (btnGenPub) {
    btnGenPub.addEventListener('click', () => {
      const title = document.getElementById('pub_title').value.trim();
      const authors = document.getElementById('pub_authors').value.split(',').map(s => s.trim()).filter(Boolean);
      const type = document.getElementById('pub_type').value;
      const venue = document.getElementById('pub_venue').value.trim();
      const year = parseInt(document.getElementById('pub_year').value, 10) || new Date().getFullYear();
      const badge = document.getElementById('pub_badge').value.trim();
      const selected = document.getElementById('pub_selected').checked;
      const abstract = document.getElementById('pub_abstract').value.trim();
      const bibtex = document.getElementById('pub_bibtex').value.trim();
      if (!title) return;

      const existingId = editingPubIndex !== null ? currentPublications[editingPubIndex].id : null;
      const pubObj = {
        id: existingId || makePubId(authors, year, title),
        title,
        authors,
        venue,
        year,
        type,
        selected,
        badge,
        abstract,
        links: { ...tempPubLinks },
        bibtex
      };

      if (editingPubIndex !== null) {
        currentPublications[editingPubIndex] = pubObj;
      } else {
        currentPublications.push(pubObj);
      }

      cancelPubEdit();
      renderPubPreview();
    });
  }

  if (btnCancelPubEdit) btnCancelPubEdit.addEventListener('click', cancelPubEdit);

  if (btnGeneratePubJson) {
    btnGeneratePubJson.addEventListener('click', () => {
      renderJsonOutput(pubOutput, JSON.stringify(currentPublications, null, 2));
    });
  }

  if (btnDownloadPub) {
    btnDownloadPub.addEventListener('click', () => {
      downloadFile(JSON.stringify(currentPublications, null, 2), 'publications.json', 'application/json');
    });
  }

  renderPubLinkChips();
  renderPubPreview();

  // Portfolio: load existing file first so edits don't wipe out what's already there
  let currentPortfolio = [];
  try {
    const res = await fetch('content/portfolio.json');
    if (res.ok) currentPortfolio = await res.json();
  } catch (err) {
    console.warn('Could not auto-load portfolio.json in studio:', err);
  }

  let tempPortLinks = {}; // links being built for the project currently in the form
  let editingPortIndex = null; // index into currentPortfolio being edited, or null

  const portOutput = document.getElementById('portOutputBox');
  const btnGenPort = document.getElementById('btnGeneratePort');
  const btnCancelPortEdit = document.getElementById('btnCancelPortEdit');
  const btnAddPortLink = document.getElementById('btnAddPortLink');
  const btnCancelPortLinkEdit = document.getElementById('btnCancelPortLinkEdit');
  const portLinkType = document.getElementById('port_link_type');
  const portLinkCustomWrap = document.getElementById('port_link_customkey_wrap');
  const portLinksChips = document.getElementById('portLinksChips');
  const btnGeneratePortJson = document.getElementById('btnGeneratePortJson');
  const btnDownloadPort = document.getElementById('btnDownloadPort');

  const PORT_LINK_LABELS = {
    github: 'GitHub', docs: 'Docs', demo: 'Demo', paper: 'Paper', dataset: 'Dataset',
    website: 'Website', video: 'Video'
  };

  let editingPortLinkKey = null; // key in tempPortLinks currently loaded into the link form, or null

  if (portLinkType) {
    portLinkType.addEventListener('change', () => {
      portLinkCustomWrap.style.display = portLinkType.value === 'other' ? 'block' : 'none';
    });
  }

  function cancelPortLinkEdit() {
    editingPortLinkKey = null;
    document.getElementById('port_link_url').value = '';
    document.getElementById('port_link_customkey').value = '';
    btnAddPortLink.innerHTML = '<i class="fa-solid fa-link"></i> Add Link';
    if (btnCancelPortLinkEdit) btnCancelPortLinkEdit.style.display = 'none';
  }

  function startPortLinkEdit(key) {
    editingPortLinkKey = key;
    const knownTypes = Array.from(portLinkType.options).map(o => o.value);
    if (knownTypes.includes(key)) {
      portLinkType.value = key;
      portLinkCustomWrap.style.display = 'none';
    } else {
      portLinkType.value = 'other';
      portLinkCustomWrap.style.display = 'block';
      document.getElementById('port_link_customkey').value = key;
    }
    document.getElementById('port_link_url').value = tempPortLinks[key] || '';
    btnAddPortLink.innerHTML = '<i class="fa-solid fa-check"></i> Update Link';
    if (btnCancelPortLinkEdit) btnCancelPortLinkEdit.style.display = 'inline-flex';
  }

  function renderPortLinkChips() {
    if (!portLinksChips) return;
    portLinksChips.innerHTML = '';
    Object.keys(tempPortLinks).forEach((key) => {
      const label = formatLinkLabel(key);
      const chip = document.createElement('span');
      chip.className = 'btn-chip';
      chip.style.cssText = 'padding:0.3rem 0.7rem; font-size:0.8rem; display:inline-flex; align-items:center; gap:0.4rem;';
      chip.innerHTML = `<button type="button" data-edit-link="${key}" style="border:none; background:none; cursor:pointer; color:inherit; font:inherit; padding:0;" title="Click to edit this link">${label}</button> <button type="button" data-remove-link="${key}" style="border:none; background:none; cursor:pointer; color:inherit;"><i class="fa-solid fa-xmark"></i></button>`;
      portLinksChips.appendChild(chip);
    });
    portLinksChips.querySelectorAll('[data-edit-link]').forEach((btn) => {
      btn.addEventListener('click', () => startPortLinkEdit(btn.getAttribute('data-edit-link')));
    });
    portLinksChips.querySelectorAll('[data-remove-link]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-remove-link');
        delete tempPortLinks[key];
        if (editingPortLinkKey === key) cancelPortLinkEdit();
        renderPortLinkChips();
      });
    });
  }

  if (btnAddPortLink) {
    btnAddPortLink.addEventListener('click', () => {
      const type = portLinkType.value;
      const url = document.getElementById('port_link_url').value.trim();
      if (!url) return;
      let key = type;
      if (type === 'other') {
        key = document.getElementById('port_link_customkey').value.trim().toLowerCase().replace(/\s+/g, '_');
      }
      if (!key) return;
      if (editingPortLinkKey && editingPortLinkKey !== key) {
        delete tempPortLinks[editingPortLinkKey];
      }
      tempPortLinks[key] = url;
      cancelPortLinkEdit();
      renderPortLinkChips();
    });
  }

  if (btnCancelPortLinkEdit) btnCancelPortLinkEdit.addEventListener('click', cancelPortLinkEdit);

  function makePortId(title) {
    return (title || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `project-${Date.now()}`;
  }

  function clearPortForm() {
    document.getElementById('port_title').value = '';
    document.getElementById('port_subtitle').value = '';
    document.getElementById('port_category').value = '';
    document.getElementById('port_date').value = '';
    document.getElementById('port_image').value = '';
    document.getElementById('port_description').value = '';
    document.getElementById('port_tags').value = '';
    tempPortLinks = {};
    cancelPortLinkEdit();
    renderPortLinkChips();
  }

  function cancelPortEdit() {
    editingPortIndex = null;
    clearPortForm();
    btnGenPort.innerHTML = '<i class="fa-solid fa-plus"></i> Add This Project';
    btnCancelPortEdit.style.display = 'none';
  }

  function startPortEdit(idx) {
    const proj = currentPortfolio[idx];
    if (!proj) return;
    editingPortIndex = idx;
    document.getElementById('port_title').value = proj.title || '';
    document.getElementById('port_subtitle').value = proj.subtitle || '';
    document.getElementById('port_category').value = proj.category || '';
    document.getElementById('port_date').value = proj.date || '';
    document.getElementById('port_image').value = proj.image || '';
    document.getElementById('port_description').value = proj.description || '';
    document.getElementById('port_tags').value = (proj.tags || []).join(', ');
    tempPortLinks = { ...(proj.links || {}) };
    cancelPortLinkEdit();
    renderPortLinkChips();
    btnGenPort.innerHTML = '<i class="fa-solid fa-check"></i> Update This Project';
    btnCancelPortEdit.style.display = 'inline-flex';
  }

  function renderPortPreview() {
    const box = document.getElementById('portPreviewList');
    if (!box) return;
    if (!currentPortfolio.length) {
      box.textContent = '// Projects you add will be listed here...';
      return;
    }
    box.innerHTML = '';
    currentPortfolio.forEach((proj, idx) => {
      const row = document.createElement('div');
      row.innerHTML = `
        <span>&bull; <strong>${proj.title}</strong> — ${proj.category || ''} (${proj.date || ''})</span>
        <span style="margin-left:0.5rem;">
          <button type="button" class="btn-chip" data-edit-port="${idx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Edit</button>
          <button type="button" class="btn-chip" data-remove-port="${idx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Remove</button>
        </span>`;
      box.appendChild(row);
    });
    box.querySelectorAll('[data-edit-port]').forEach((btn) => {
      btn.addEventListener('click', () => startPortEdit(Number(btn.getAttribute('data-edit-port'))));
    });
    box.querySelectorAll('[data-remove-port]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-remove-port'));
        currentPortfolio.splice(idx, 1);
        if (editingPortIndex === idx) cancelPortEdit();
        renderPortPreview();
      });
    });
  }

  if (btnGenPort) {
    btnGenPort.addEventListener('click', () => {
      const title = document.getElementById('port_title').value.trim();
      const subtitle = document.getElementById('port_subtitle').value.trim();
      const category = document.getElementById('port_category').value.trim();
      const date = document.getElementById('port_date').value.trim();
      const image = document.getElementById('port_image').value.trim();
      const description = document.getElementById('port_description').value.trim();
      const tags = document.getElementById('port_tags').value.split(',').map(s => s.trim()).filter(Boolean);

      if (!title) return;

      const existingId = editingPortIndex !== null ? currentPortfolio[editingPortIndex].id : null;
      const projObj = {
        id: existingId || makePortId(title),
        title,
        subtitle,
        category,
        date,
        image,
        description,
        tags,
        links: { ...tempPortLinks }
      };

      if (editingPortIndex !== null) {
        currentPortfolio[editingPortIndex] = projObj;
      } else {
        currentPortfolio.push(projObj);
      }

      cancelPortEdit();
      renderPortPreview();
    });
  }

  if (btnCancelPortEdit) btnCancelPortEdit.addEventListener('click', cancelPortEdit);

  if (btnGeneratePortJson) {
    btnGeneratePortJson.addEventListener('click', () => {
      renderJsonOutput(portOutput, JSON.stringify(currentPortfolio, null, 2));
    });
  }

  if (btnDownloadPort) {
    btnDownloadPort.addEventListener('click', () => {
      downloadFile(JSON.stringify(currentPortfolio, null, 2), 'portfolio.json', 'application/json');
    });
  }

  renderPortLinkChips();
  renderPortPreview();

  // Blog: load existing file first so edits don't wipe out what's already there
  let currentPosts = [];
  try {
    const res = await fetch('content/posts.json');
    if (res.ok) currentPosts = await res.json();
  } catch (err) {
    console.warn('Could not auto-load posts.json in studio:', err);
  }

  let editingBlogIndex = null; // index into currentPosts being edited, or null

  const blogOutput = document.getElementById('blogOutputBox');
  const btnGenBlog = document.getElementById('btnGenerateBlog');
  const btnCancelBlogEdit = document.getElementById('btnCancelBlogEdit');
  const btnGenerateBlogJson = document.getElementById('btnGenerateBlogJson');
  const btnDownloadBlog = document.getElementById('btnDownloadBlog');

  function makeBlogSlug(title) {
    return (title || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `post-${Date.now()}`;
  }

  function clearBlogForm() {
    document.getElementById('blog_title').value = '';
    document.getElementById('blog_date').value = '';
    document.getElementById('blog_readtime').value = '';
    document.getElementById('blog_summary').value = '';
    document.getElementById('blog_tags').value = '';
    document.getElementById('blog_file').value = '';
  }

  function cancelBlogEdit() {
    editingBlogIndex = null;
    clearBlogForm();
    btnGenBlog.innerHTML = '<i class="fa-solid fa-plus"></i> Add This Post';
    btnCancelBlogEdit.style.display = 'none';
  }

  function startBlogEdit(idx) {
    const post = currentPosts[idx];
    if (!post) return;
    editingBlogIndex = idx;
    document.getElementById('blog_title').value = post.title || '';
    document.getElementById('blog_date').value = post.date || '';
    document.getElementById('blog_readtime').value = post.readTime || '';
    document.getElementById('blog_summary').value = post.summary || '';
    document.getElementById('blog_tags').value = (post.tags || []).join(', ');
    document.getElementById('blog_file').value = post.file || '';
    btnGenBlog.innerHTML = '<i class="fa-solid fa-check"></i> Update This Post';
    btnCancelBlogEdit.style.display = 'inline-flex';
  }

  function renderBlogPreview() {
    const box = document.getElementById('blogPreviewList');
    if (!box) return;
    if (!currentPosts.length) {
      box.textContent = '// Posts you add will be listed here...';
      return;
    }
    box.innerHTML = '';
    currentPosts.forEach((post, idx) => {
      const row = document.createElement('div');
      row.innerHTML = `
        <span>&bull; <strong>${post.title}</strong> — ${post.date || ''}</span>
        <span style="margin-left:0.5rem;">
          <button type="button" class="btn-chip" data-edit-blog="${idx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Edit</button>
          <button type="button" class="btn-chip" data-remove-blog="${idx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Remove</button>
        </span>`;
      box.appendChild(row);
    });
    box.querySelectorAll('[data-edit-blog]').forEach((btn) => {
      btn.addEventListener('click', () => startBlogEdit(Number(btn.getAttribute('data-edit-blog'))));
    });
    box.querySelectorAll('[data-remove-blog]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-remove-blog'));
        currentPosts.splice(idx, 1);
        if (editingBlogIndex === idx) cancelBlogEdit();
        renderBlogPreview();
      });
    });
  }

  if (btnGenBlog) {
    btnGenBlog.addEventListener('click', () => {
      const title = document.getElementById('blog_title').value.trim();
      const date = document.getElementById('blog_date').value.trim();
      const readTime = document.getElementById('blog_readtime').value.trim();
      const summary = document.getElementById('blog_summary').value.trim();
      const tags = document.getElementById('blog_tags').value.split(',').map(s => s.trim()).filter(Boolean);
      const file = document.getElementById('blog_file').value.trim();

      if (!title) return;

      const existingSlug = editingBlogIndex !== null ? currentPosts[editingBlogIndex].slug : null;
      const postObj = {
        slug: existingSlug || makeBlogSlug(title),
        title,
        date,
        readTime,
        summary,
        tags,
        file
      };

      if (editingBlogIndex !== null) {
        currentPosts[editingBlogIndex] = postObj;
      } else {
        currentPosts.push(postObj);
      }

      cancelBlogEdit();
      renderBlogPreview();
    });
  }

  if (btnCancelBlogEdit) btnCancelBlogEdit.addEventListener('click', cancelBlogEdit);

  if (btnGenerateBlogJson) {
    btnGenerateBlogJson.addEventListener('click', () => {
      renderJsonOutput(blogOutput, JSON.stringify(currentPosts, null, 2));
    });
  }

  if (btnDownloadBlog) {
    btnDownloadBlog.addEventListener('click', () => {
      downloadFile(JSON.stringify(currentPosts, null, 2), 'posts.json', 'application/json');
    });
  }

  renderBlogPreview();

  // News: load existing file first so edits don't wipe out what's already there
  let currentNews = [];
  try {
    const res = await fetch('content/news.json');
    if (res.ok) currentNews = await res.json();
  } catch (err) {
    console.warn('Could not auto-load news.json in studio:', err);
  }

  let editingNewsIndex = null; // index into currentNews being edited, or null

  const newsOutput = document.getElementById('newsOutputBox');
  const btnGenNews = document.getElementById('btnGenerateNews');
  const btnCancelNewsEdit = document.getElementById('btnCancelNewsEdit');
  const btnGenerateNewsJson = document.getElementById('btnGenerateNewsJson');
  const btnDownloadNews = document.getElementById('btnDownloadNews');

  function clearNewsForm() {
    document.getElementById('news_date').value = '';
    document.getElementById('news_badge').value = '';
    document.getElementById('news_content').value = '';
  }

  function cancelNewsEdit() {
    editingNewsIndex = null;
    clearNewsForm();
    btnGenNews.innerHTML = '<i class="fa-solid fa-plus"></i> Add This News Item';
    btnCancelNewsEdit.style.display = 'none';
  }

  function startNewsEdit(idx) {
    const item = currentNews[idx];
    if (!item) return;
    editingNewsIndex = idx;
    document.getElementById('news_date').value = item.date || '';
    document.getElementById('news_badge').value = item.badge || '';
    document.getElementById('news_content').value = item.content || '';
    btnGenNews.innerHTML = '<i class="fa-solid fa-check"></i> Update This News Item';
    btnCancelNewsEdit.style.display = 'inline-flex';
  }

  function renderNewsPreview() {
    const box = document.getElementById('newsPreviewList');
    if (!box) return;
    if (!currentNews.length) {
      box.textContent = '// News items you add will be listed here...';
      return;
    }
    box.innerHTML = '';
    currentNews.forEach((item, idx) => {
      const row = document.createElement('div');
      const shortContent = (item.content || '').replace(/\*/g, '').slice(0, 70);
      row.innerHTML = `
        <span>&bull; <strong>[${item.badge || ''}]</strong> ${item.date || ''} — ${shortContent}${(item.content || '').length > 70 ? '…' : ''}</span>
        <span style="margin-left:0.5rem;">
          <button type="button" class="btn-chip" data-edit-news="${idx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Edit</button>
          <button type="button" class="btn-chip" data-remove-news="${idx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Remove</button>
        </span>`;
      box.appendChild(row);
    });
    box.querySelectorAll('[data-edit-news]').forEach((btn) => {
      btn.addEventListener('click', () => startNewsEdit(Number(btn.getAttribute('data-edit-news'))));
    });
    box.querySelectorAll('[data-remove-news]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-remove-news'));
        currentNews.splice(idx, 1);
        if (editingNewsIndex === idx) cancelNewsEdit();
        renderNewsPreview();
      });
    });
  }

  if (btnGenNews) {
    btnGenNews.addEventListener('click', () => {
      const date = document.getElementById('news_date').value.trim();
      const badge = document.getElementById('news_badge').value.trim();
      const content = document.getElementById('news_content').value.trim();

      if (!content) return;

      const newsObj = { date, badge, content };

      if (editingNewsIndex !== null) {
        currentNews[editingNewsIndex] = newsObj;
      } else {
        currentNews.unshift(newsObj); // newest items go to the top
      }

      cancelNewsEdit();
      renderNewsPreview();
    });
  }

  if (btnCancelNewsEdit) btnCancelNewsEdit.addEventListener('click', cancelNewsEdit);

  if (btnGenerateNewsJson) {
    btnGenerateNewsJson.addEventListener('click', () => {
      renderJsonOutput(newsOutput, JSON.stringify(currentNews, null, 2));
    });
  }

  if (btnDownloadNews) {
    btnDownloadNews.addEventListener('click', () => {
      downloadFile(JSON.stringify(currentNews, null, 2), 'news.json', 'application/json');
    });
  }

  renderNewsPreview();

  // Talks: load existing file first so edits don't wipe out what's already there
  let currentTalks = [];
  try {
    const res = await fetch('content/talks.json');
    if (res.ok) currentTalks = await res.json();
  } catch (err) {
    console.warn('Could not auto-load talks.json in studio:', err);
  }

  let tempTalkLinks = {}; // links being built for the talk currently in the form
  let editingTalkIndex = null; // index into currentTalks being edited, or null

  const talkOutput = document.getElementById('talkOutputBox');
  const btnGenTalk = document.getElementById('btnGenerateTalk');
  const btnCancelTalkEdit = document.getElementById('btnCancelTalkEdit');
  const btnAddTalkLink = document.getElementById('btnAddTalkLink');
  const btnCancelTalkLinkEdit = document.getElementById('btnCancelTalkLinkEdit');
  const talkLinkType = document.getElementById('talk_link_type');
  const talkLinkCustomWrap = document.getElementById('talk_link_customkey_wrap');
  const talkLinksChips = document.getElementById('talkLinksChips');
  const btnGenerateTalkJson = document.getElementById('btnGenerateTalkJson');
  const btnDownloadTalk = document.getElementById('btnDownloadTalk');

  const TALK_LINK_LABELS = {
    slides: 'Slides', video: 'Video', event: 'Event Page', paper: 'Related Paper',
    code: 'Code', poster: 'Poster'
  };

  let editingTalkLinkKey = null; // key in tempTalkLinks currently loaded into the link form, or null

  if (talkLinkType) {
    talkLinkType.addEventListener('change', () => {
      talkLinkCustomWrap.style.display = talkLinkType.value === 'other' ? 'block' : 'none';
    });
  }

  function cancelTalkLinkEdit() {
    editingTalkLinkKey = null;
    document.getElementById('talk_link_url').value = '';
    document.getElementById('talk_link_customkey').value = '';
    btnAddTalkLink.innerHTML = '<i class="fa-solid fa-link"></i> Add Link';
    if (btnCancelTalkLinkEdit) btnCancelTalkLinkEdit.style.display = 'none';
  }

  function startTalkLinkEdit(key) {
    editingTalkLinkKey = key;
    const knownTypes = Array.from(talkLinkType.options).map(o => o.value);
    if (knownTypes.includes(key)) {
      talkLinkType.value = key;
      talkLinkCustomWrap.style.display = 'none';
    } else {
      talkLinkType.value = 'other';
      talkLinkCustomWrap.style.display = 'block';
      document.getElementById('talk_link_customkey').value = key;
    }
    document.getElementById('talk_link_url').value = tempTalkLinks[key] || '';
    btnAddTalkLink.innerHTML = '<i class="fa-solid fa-check"></i> Update Link';
    if (btnCancelTalkLinkEdit) btnCancelTalkLinkEdit.style.display = 'inline-flex';
  }

  function renderTalkLinkChips() {
    if (!talkLinksChips) return;
    talkLinksChips.innerHTML = '';
    Object.keys(tempTalkLinks).forEach((key) => {
      const label = formatLinkLabel(key);
      const chip = document.createElement('span');
      chip.className = 'btn-chip';
      chip.style.cssText = 'padding: 0.3rem 0.7rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.5rem;';
      chip.innerHTML = `<button type="button" data-edit-talklink="${key}" style="border:none; background:none; cursor:pointer; color:inherit; font:inherit; padding:0;" title="Click to edit this link">${label}</button> <button type="button" data-remove-talklink="${key}" style="border:none; background:none; cursor:pointer; color: var(--text-secondary); font-weight:700;">&times;</button>`;
      talkLinksChips.appendChild(chip);
    });
    talkLinksChips.querySelectorAll('[data-edit-talklink]').forEach((btn) => {
      btn.addEventListener('click', () => startTalkLinkEdit(btn.getAttribute('data-edit-talklink')));
    });
    talkLinksChips.querySelectorAll('[data-remove-talklink]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-remove-talklink');
        delete tempTalkLinks[key];
        if (editingTalkLinkKey === key) cancelTalkLinkEdit();
        renderTalkLinkChips();
      });
    });
  }

  if (btnAddTalkLink) {
    btnAddTalkLink.addEventListener('click', () => {
      const type = talkLinkType.value;
      const url = document.getElementById('talk_link_url').value.trim();
      if (!url) return;
      let key = type;
      if (type === 'other') {
        key = document.getElementById('talk_link_customkey').value.trim().toLowerCase().replace(/\s+/g, '_');
        if (!key) return;
      }
      if (editingTalkLinkKey && editingTalkLinkKey !== key) {
        delete tempTalkLinks[editingTalkLinkKey];
      }
      tempTalkLinks[key] = url;
      cancelTalkLinkEdit();
      renderTalkLinkChips();
    });
  }

  if (btnCancelTalkLinkEdit) btnCancelTalkLinkEdit.addEventListener('click', cancelTalkLinkEdit);

  function clearTalkForm() {
    document.getElementById('talk_title').value = '';
    document.getElementById('talk_event').value = '';
    document.getElementById('talk_type').value = '';
    document.getElementById('talk_date').value = '';
    document.getElementById('talk_location').value = '';
    document.getElementById('talk_desc').value = '';
    tempTalkLinks = {};
    cancelTalkLinkEdit();
    renderTalkLinkChips();
  }

  function cancelTalkEdit() {
    editingTalkIndex = null;
    clearTalkForm();
    btnGenTalk.innerHTML = '<i class="fa-solid fa-plus"></i> Add This Talk';
    btnCancelTalkEdit.style.display = 'none';
  }

  function startTalkEdit(idx) {
    const talk = currentTalks[idx];
    if (!talk) return;
    editingTalkIndex = idx;
    document.getElementById('talk_title').value = talk.title || '';
    document.getElementById('talk_event').value = talk.event || '';
    document.getElementById('talk_type').value = talk.type || '';
    document.getElementById('talk_date').value = talk.date || '';
    document.getElementById('talk_location').value = talk.location || '';
    document.getElementById('talk_desc').value = talk.description || '';
    tempTalkLinks = { ...(talk.links || {}) };
    cancelTalkLinkEdit();
    renderTalkLinkChips();
    btnGenTalk.innerHTML = '<i class="fa-solid fa-check"></i> Update This Talk';
    btnCancelTalkEdit.style.display = 'inline-flex';
  }

  function renderTalkPreview() {
    const box = document.getElementById('talkPreviewList');
    if (!box) return;
    if (!currentTalks.length) {
      box.textContent = '// Talks you add will be listed here...';
      return;
    }
    let html = '';
    currentTalks.forEach((talk, idx) => {
      html += `<div style="display:flex; justify-content:space-between; align-items:center; padding: 0.4rem 0; border-top: 1px solid var(--border-color);">
        <span>&bull; <strong>${talk.title}</strong> — ${talk.event || ''} (${talk.date || ''})</span>
        <span style="display:flex; gap:0.4rem; flex-shrink: 0;">
          <button type="button" class="btn-chip" data-edit-talk="${idx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Edit</button>
          <button type="button" class="btn-chip" data-remove-talk="${idx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Remove</button>
        </span>
      </div>`;
    });
    box.innerHTML = html;

    box.querySelectorAll('[data-edit-talk]').forEach((btn) => {
      btn.addEventListener('click', () => startTalkEdit(Number(btn.getAttribute('data-edit-talk'))));
    });
    box.querySelectorAll('[data-remove-talk]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-remove-talk'));
        currentTalks.splice(idx, 1);
        if (editingTalkIndex === idx) cancelTalkEdit();
        renderTalkPreview();
      });
    });
  }

  if (btnGenTalk) {
    btnGenTalk.addEventListener('click', () => {
      const title = document.getElementById('talk_title').value.trim();
      const event = document.getElementById('talk_event').value.trim();
      const type = document.getElementById('talk_type').value.trim();
      const date = document.getElementById('talk_date').value.trim();
      const location = document.getElementById('talk_location').value.trim();
      const desc = document.getElementById('talk_desc').value.trim();
      if (!title) return;

      const talkObj = {
        title,
        event,
        type,
        date,
        location,
        description: desc,
        links: { ...tempTalkLinks }
      };

      if (editingTalkIndex !== null) {
        currentTalks[editingTalkIndex] = talkObj;
      } else {
        currentTalks.push(talkObj);
      }

      cancelTalkEdit();
      renderTalkPreview();
    });
  }

  if (btnCancelTalkEdit) btnCancelTalkEdit.addEventListener('click', cancelTalkEdit);

  if (btnGenerateTalkJson) {
    btnGenerateTalkJson.addEventListener('click', () => {
      renderJsonOutput(talkOutput, JSON.stringify(currentTalks, null, 2));
    });
  }

  if (btnDownloadTalk) {
    btnDownloadTalk.addEventListener('click', () => {
      downloadFile(JSON.stringify(currentTalks, null, 2), 'talks.json', 'application/json');
    });
  }

  renderTalkLinkChips();
  renderTalkPreview();

  // Teaching: load existing file first so edits don't wipe out what's already there
  let currentTeaching = [];
  try {
    const res = await fetch('content/teaching.json');
    if (res.ok) currentTeaching = await res.json();
  } catch (err) {
    console.warn('Could not auto-load teaching.json in studio:', err);
  }

  let tempTeachLinks = {}; // links being built for the teaching entry currently in the form
  let editingTeachIndex = null; // index into currentTeaching being edited, or null

  const teachOutput = document.getElementById('teachOutputBox');
  const btnGenTeach = document.getElementById('btnGenerateTeach');
  const btnCancelTeachEdit = document.getElementById('btnCancelTeachEdit');
  const btnAddTeachLink = document.getElementById('btnAddTeachLink');
  const btnCancelTeachLinkEdit = document.getElementById('btnCancelTeachLinkEdit');
  const teachLinkType = document.getElementById('teach_link_type');
  const teachLinkCustomWrap = document.getElementById('teach_link_customkey_wrap');
  const teachLinksChips = document.getElementById('teachLinksChips');
  const btnGenerateTeachJson = document.getElementById('btnGenerateTeachJson');
  const btnDownloadTeach = document.getElementById('btnDownloadTeach');

  const TEACH_LINK_LABELS = {
    syllabus: 'Syllabus', materials: 'Course Materials', slides: 'Slides', coursePage: 'Course Page'
  };

  let editingTeachLinkKey = null; // key in tempTeachLinks currently loaded into the link form, or null

  if (teachLinkType) {
    teachLinkType.addEventListener('change', () => {
      teachLinkCustomWrap.style.display = teachLinkType.value === 'other' ? 'block' : 'none';
    });
  }

  function cancelTeachLinkEdit() {
    editingTeachLinkKey = null;
    document.getElementById('teach_link_url').value = '';
    document.getElementById('teach_link_customkey').value = '';
    btnAddTeachLink.innerHTML = '<i class="fa-solid fa-link"></i> Add Link';
    if (btnCancelTeachLinkEdit) btnCancelTeachLinkEdit.style.display = 'none';
  }

  function startTeachLinkEdit(key) {
    editingTeachLinkKey = key;
    const knownTypes = Array.from(teachLinkType.options).map(o => o.value);
    if (knownTypes.includes(key)) {
      teachLinkType.value = key;
      teachLinkCustomWrap.style.display = 'none';
    } else {
      teachLinkType.value = 'other';
      teachLinkCustomWrap.style.display = 'block';
      document.getElementById('teach_link_customkey').value = key;
    }
    document.getElementById('teach_link_url').value = tempTeachLinks[key] || '';
    btnAddTeachLink.innerHTML = '<i class="fa-solid fa-check"></i> Update Link';
    if (btnCancelTeachLinkEdit) btnCancelTeachLinkEdit.style.display = 'inline-flex';
  }

  function renderTeachLinkChips() {
    if (!teachLinksChips) return;
    teachLinksChips.innerHTML = '';
    Object.keys(tempTeachLinks).forEach((key) => {
      const label = formatLinkLabel(key);
      const chip = document.createElement('span');
      chip.className = 'btn-chip';
      chip.style.cssText = 'padding: 0.3rem 0.7rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.5rem;';
      chip.innerHTML = `<button type="button" data-edit-teachlink="${key}" style="border:none; background:none; cursor:pointer; color:inherit; font:inherit; padding:0;" title="Click to edit this link">${label}</button> <button type="button" data-remove-teachlink="${key}" style="border:none; background:none; cursor:pointer; color: var(--text-secondary); font-weight:700;">&times;</button>`;
      teachLinksChips.appendChild(chip);
    });
    teachLinksChips.querySelectorAll('[data-edit-teachlink]').forEach((btn) => {
      btn.addEventListener('click', () => startTeachLinkEdit(btn.getAttribute('data-edit-teachlink')));
    });
    teachLinksChips.querySelectorAll('[data-remove-teachlink]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-remove-teachlink');
        delete tempTeachLinks[key];
        if (editingTeachLinkKey === key) cancelTeachLinkEdit();
        renderTeachLinkChips();
      });
    });
  }

  if (btnAddTeachLink) {
    btnAddTeachLink.addEventListener('click', () => {
      const type = teachLinkType.value;
      const url = document.getElementById('teach_link_url').value.trim();
      if (!url) return;
      let key = type;
      if (type === 'other') {
        key = document.getElementById('teach_link_customkey').value.trim();
        // coursePage-style keys stay camelCase if typed that way; otherwise just lowercase with underscores
        if (!key) return;
        if (key.includes(' ')) key = key.toLowerCase().replace(/\s+/g, '_');
      }
      if (editingTeachLinkKey && editingTeachLinkKey !== key) {
        delete tempTeachLinks[editingTeachLinkKey];
      }
      tempTeachLinks[key] = url;
      cancelTeachLinkEdit();
      renderTeachLinkChips();
    });
  }

  if (btnCancelTeachLinkEdit) btnCancelTeachLinkEdit.addEventListener('click', cancelTeachLinkEdit);

  function clearTeachForm() {
    document.getElementById('teach_role').value = '';
    document.getElementById('teach_level').value = 'Graduate Level';
    document.getElementById('teach_course').value = '';
    document.getElementById('teach_institution').value = '';
    document.getElementById('teach_term').value = '';
    document.getElementById('teach_desc').value = '';
    tempTeachLinks = {};
    cancelTeachLinkEdit();
    renderTeachLinkChips();
  }

  function cancelTeachEdit() {
    editingTeachIndex = null;
    clearTeachForm();
    btnGenTeach.innerHTML = '<i class="fa-solid fa-plus"></i> Add This Teaching Entry';
    btnCancelTeachEdit.style.display = 'none';
  }

  function startTeachEdit(idx) {
    const entry = currentTeaching[idx];
    if (!entry) return;
    editingTeachIndex = idx;
    document.getElementById('teach_role').value = entry.role || '';
    document.getElementById('teach_level').value = entry.level || 'Graduate Level';
    document.getElementById('teach_course').value = entry.course || '';
    document.getElementById('teach_institution').value = entry.institution || '';
    document.getElementById('teach_term').value = entry.term || '';
    document.getElementById('teach_desc').value = entry.description || '';
    tempTeachLinks = { ...(entry.links || {}) };
    cancelTeachLinkEdit();
    renderTeachLinkChips();
    btnGenTeach.innerHTML = '<i class="fa-solid fa-check"></i> Update This Teaching Entry';
    btnCancelTeachEdit.style.display = 'inline-flex';
  }

  function renderTeachPreview() {
    const box = document.getElementById('teachPreviewList');
    if (!box) return;
    if (!currentTeaching.length) {
      box.textContent = '// Teaching entries you add will be listed here...';
      return;
    }
    let html = '';
    currentTeaching.forEach((entry, idx) => {
      html += `<div style="display:flex; justify-content:space-between; align-items:center; padding: 0.4rem 0; border-top: 1px solid var(--border-color);">
        <span>&bull; <strong>${entry.course}</strong> — ${entry.role || ''} (${entry.term || ''})</span>
        <span style="display:flex; gap:0.4rem; flex-shrink: 0;">
          <button type="button" class="btn-chip" data-edit-teach="${idx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Edit</button>
          <button type="button" class="btn-chip" data-remove-teach="${idx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Remove</button>
        </span>
      </div>`;
    });
    box.innerHTML = html;

    box.querySelectorAll('[data-edit-teach]').forEach((btn) => {
      btn.addEventListener('click', () => startTeachEdit(Number(btn.getAttribute('data-edit-teach'))));
    });
    box.querySelectorAll('[data-remove-teach]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-remove-teach'));
        currentTeaching.splice(idx, 1);
        if (editingTeachIndex === idx) cancelTeachEdit();
        renderTeachPreview();
      });
    });
  }

  if (btnGenTeach) {
    btnGenTeach.addEventListener('click', () => {
      const role = document.getElementById('teach_role').value.trim();
      const level = document.getElementById('teach_level').value;
      const course = document.getElementById('teach_course').value.trim();
      const institution = document.getElementById('teach_institution').value.trim();
      const term = document.getElementById('teach_term').value.trim();
      const description = document.getElementById('teach_desc').value.trim();
      if (!course) return;

      const teachObj = { role, course, institution, term, level, description, links: { ...tempTeachLinks } };

      if (editingTeachIndex !== null) {
        currentTeaching[editingTeachIndex] = teachObj;
      } else {
        currentTeaching.push(teachObj);
      }

      cancelTeachEdit();
      renderTeachPreview();
    });
  }

  if (btnCancelTeachEdit) btnCancelTeachEdit.addEventListener('click', cancelTeachEdit);

  if (btnGenerateTeachJson) {
    btnGenerateTeachJson.addEventListener('click', () => {
      renderJsonOutput(teachOutput, JSON.stringify(currentTeaching, null, 2));
    });
  }

  if (btnDownloadTeach) {
    btnDownloadTeach.addEventListener('click', () => {
      downloadFile(JSON.stringify(currentTeaching, null, 2), 'teaching.json', 'application/json');
    });
  }

  renderTeachLinkChips();
  renderTeachPreview();

  // Prepopulate CV Form
  let currentCv = null;
  try {
    const res = await fetch('content/cv.json');
    if (res.ok) {
      currentCv = await res.json();
    }
  } catch (err) {
    console.warn('Could not auto-load cv.json in studio:', err);
  }

  function defaultCv() {
    return {
      pdfDownloadUrl: "assets/Alex_Morgan_CV.pdf",
      lastUpdated: "August 2026",
      sections: [
        { title: "Education", icon: "fa-solid fa-graduation-cap", items: [] },
        { title: "Academic Appointments & Experience", icon: "fa-solid fa-briefcase", items: [] },
        { title: "Honors, Grants & Fellowships", icon: "fa-solid fa-award", items: [] },
        { title: "Professional Service & Reviewing", icon: "fa-solid fa-handshake-angle", items: [] },
        { title: "Technical & Mathematical Skills", icon: "fa-solid fa-code", skillsGroup: [] }
      ]
    };
  }

  if (!currentCv) currentCv = defaultCv();
  // Make sure every one of the 5 default sections exists even in an older saved file
  defaultCv().sections.forEach((defSec) => {
    const exists = currentCv.sections.some((s) => s.title === defSec.title);
    if (!exists) currentCv.sections.push(defSec);
  });

  function sectionType(section) {
    return Object.prototype.hasOwnProperty.call(section, 'skillsGroup') ? 'skills' : 'list';
  }

  function populateCvForm(cv) {
    const lastUpdatedEl = document.getElementById('cv_last_updated');
    const pdfUrlEl = document.getElementById('cv_pdf_url');
    if (lastUpdatedEl) lastUpdatedEl.value = cv.lastUpdated || '';
    if (pdfUrlEl) pdfUrlEl.value = cv.pdfDownloadUrl || '';
    refreshCvSectionDropdown();
    renderCvPreview();
  }

  function refreshCvSectionDropdown() {
    const select = document.getElementById('cv_entry_section');
    if (!select) return;
    const prevValue = select.value;
    select.innerHTML = '';
    currentCv.sections.forEach((sec, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = `${sec.title} (${sectionType(sec) === 'skills' ? 'Skills Group' : 'List'})`;
      select.appendChild(opt);
    });
    if (prevValue && Number(prevValue) < currentCv.sections.length) select.value = prevValue;
    toggleCvEntryFields();
  }

  function updateCvLabelPlaceholders() {
    const labelSelect = document.getElementById('cv_entry_label_type');
    if (!labelSelect) return;
    const labelType = labelSelect.value;
    const titleInput = document.getElementById('cv_entry_title');
    const orgInput = document.getElementById('cv_entry_org');
    const titleLabel = document.getElementById('cv_entry_title_label');
    const orgLabel = document.getElementById('cv_entry_org_label');

    if (labelType === 'degree') {
      if (titleLabel) titleLabel.textContent = 'Degree Name';
      if (titleInput) titleInput.placeholder = 'e.g. Ph.D. in Computer Science & AI';
      if (orgLabel) orgLabel.textContent = 'University / College';
      if (orgInput) orgInput.placeholder = 'e.g. Massachusetts Institute of Technology (MIT)';
    } else if (labelType === 'award') {
      if (titleLabel) titleLabel.textContent = 'Award / Fellowship Title';
      if (titleInput) titleInput.placeholder = 'e.g. NSF Postdoctoral Research Fellowship ($320,000)';
      if (orgLabel) orgLabel.textContent = 'Granting Organization';
      if (orgInput) orgInput.placeholder = 'e.g. National Science Foundation';
    } else if (labelType === 'role') {
      if (titleLabel) titleLabel.textContent = 'Role / Position Title';
      if (titleInput) titleInput.placeholder = 'e.g. Postdoctoral Research Fellow or Area Chair';
      if (orgLabel) orgLabel.textContent = 'Institution / Organization';
      if (orgInput) orgInput.placeholder = 'e.g. Stanford University or NeurIPS';
    } else {
      if (titleLabel) titleLabel.textContent = 'Entry Title';
      if (titleInput) titleInput.placeholder = 'e.g. General List Entry';
      if (orgLabel) orgLabel.textContent = 'Institution / Organization';
      if (orgInput) orgInput.placeholder = 'e.g. Stanford University';
    }
  }

  function toggleCvEntryFields() {
    const select = document.getElementById('cv_entry_section');
    const listFields = document.getElementById('cv_list_fields');
    const skillsFields = document.getElementById('cv_skills_fields');
    if (!select || !listFields || !skillsFields) return;
    const idx = Number(select.value);
    const sec = currentCv.sections[idx];
    const isSkills = sec && sectionType(sec) === 'skills';
    listFields.style.display = isSkills ? 'none' : 'block';
    skillsFields.style.display = isSkills ? 'block' : 'none';

    if (!isSkills && sec && !editingEntry) {
      const lowerTitle = (sec.title || '').toLowerCase();
      const labelSelect = document.getElementById('cv_entry_label_type');
      if (labelSelect) {
        if (lowerTitle.includes('education') || lowerTitle.includes('degree')) {
          labelSelect.value = 'degree';
        } else if (lowerTitle.includes('honor') || lowerTitle.includes('award') || lowerTitle.includes('grant') || lowerTitle.includes('fellowship')) {
          labelSelect.value = 'award';
        } else if (lowerTitle.includes('appointment') || lowerTitle.includes('experience') || lowerTitle.includes('service') || lowerTitle.includes('position')) {
          labelSelect.value = 'role';
        } else {
          labelSelect.value = 'title';
        }
      }
    }
    updateCvLabelPlaceholders();
  }

  const cvSectionSelect = document.getElementById('cv_entry_section');
  if (cvSectionSelect) cvSectionSelect.addEventListener('change', toggleCvEntryFields);

  const cvLabelTypeSelect = document.getElementById('cv_entry_label_type');
  if (cvLabelTypeSelect) cvLabelTypeSelect.addEventListener('change', updateCvLabelPlaceholders);

  let editingSectionIndex = null; // index of section currently being edited, or null
  let editingEntry = null; // { sectionIndex, entryIndex } currently being edited, or null

  function renderCvPreview() {
    const box = document.getElementById('cvPreviewList');
    if (!box) return;
    if (!currentCv.sections.length) {
      box.textContent = '// Add a section to get started...';
      return;
    }
    let html = '';
    currentCv.sections.forEach((sec, sIdx) => {
      const list = sec.items || sec.skillsGroup || [];
      html += `<div style="margin-bottom: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.6rem 0.8rem;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong><i class="${sec.icon || ''}"></i> ${sec.title}</strong>
          <span style="display:flex; gap:0.4rem;">
            <button type="button" class="btn-chip" data-edit-section="${sIdx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Edit Section</button>
            <button type="button" class="btn-chip" data-delete-section="${sIdx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Delete Section</button>
          </span>
        </div>`;
      if (!list.length) {
        html += `<div class="form-help" style="margin-top:0.4rem;">No entries yet.</div>`;
      } else {
        list.forEach((entry, eIdx) => {
          const label = entry.degree || entry.role || entry.award || entry.title || entry.category || '(untitled)';
          html += `<div style="display:flex; justify-content:space-between; align-items:center; padding: 0.3rem 0; border-top: 1px solid var(--border-color);">
            <span>&bull; ${label}</span>
            <span style="display:flex; gap:0.4rem;">
              <button type="button" class="btn-chip" data-edit-section="${sIdx}" data-edit-entry="${eIdx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Edit</button>
              <button type="button" class="btn-chip" data-remove-section="${sIdx}" data-remove-entry="${eIdx}" style="padding:0.15rem 0.6rem; font-size:0.75rem;">Remove</button>
            </span>
          </div>`;
        });
      }
      html += `</div>`;
    });
    box.innerHTML = html;

    // Remove entry
    box.querySelectorAll('[data-remove-section][data-remove-entry]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sIdx = Number(btn.getAttribute('data-remove-section'));
        const eIdx = Number(btn.getAttribute('data-remove-entry'));
        const sec = currentCv.sections[sIdx];
        const list = sec.items || sec.skillsGroup;
        list.splice(eIdx, 1);
        if (editingEntry && editingEntry.sectionIndex === sIdx && editingEntry.entryIndex === eIdx) {
          cancelEntryEdit();
        }
        renderCvPreview();
      });
    });

    // Delete section
    box.querySelectorAll('[data-delete-section]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sIdx = Number(btn.getAttribute('data-delete-section'));
        currentCv.sections.splice(sIdx, 1);
        cancelEntryEdit();
        cancelSectionEdit();
        refreshCvSectionDropdown();
        renderCvPreview();
      });
    });

    // Edit entry (buttons that have both data-edit-section and data-edit-entry)
    box.querySelectorAll('[data-edit-section][data-edit-entry]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sIdx = Number(btn.getAttribute('data-edit-section'));
        const eIdx = Number(btn.getAttribute('data-edit-entry'));
        startEntryEdit(sIdx, eIdx);
      });
    });

    // Edit section (buttons that only have data-edit-section)
    box.querySelectorAll('[data-edit-section]:not([data-edit-entry])').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sIdx = Number(btn.getAttribute('data-edit-section'));
        startSectionEdit(sIdx);
      });
    });
  }

  function startSectionEdit(sIdx) {
    const sec = currentCv.sections[sIdx];
    if (!sec) return;
    editingSectionIndex = sIdx;
    document.getElementById('cv_new_section_title').value = sec.title || '';
    document.getElementById('cv_new_section_icon').value = sec.icon || '';
    document.getElementById('cv_new_section_type').value = sectionType(sec) === 'skills' ? 'skills' : 'list';
    document.getElementById('cv_new_section_type').disabled = true; // don't allow changing type of an existing section
    btnAddCvSection.innerHTML = '<i class="fa-solid fa-check"></i> Update Section';
    document.getElementById('btnCancelCvSectionEdit').style.display = 'inline-flex';
  }

  function cancelSectionEdit() {
    editingSectionIndex = null;
    document.getElementById('cv_new_section_title').value = '';
    document.getElementById('cv_new_section_icon').value = '';
    document.getElementById('cv_new_section_type').disabled = false;
    btnAddCvSection.innerHTML = '<i class="fa-solid fa-folder-plus"></i> Add New Section';
    document.getElementById('btnCancelCvSectionEdit').style.display = 'none';
  }

  function startEntryEdit(sIdx, eIdx) {
    const sec = currentCv.sections[sIdx];
    if (!sec) return;
    editingEntry = { sectionIndex: sIdx, entryIndex: eIdx };
    const select = document.getElementById('cv_entry_section');
    select.value = String(sIdx);
    toggleCvEntryFields();

    if (sectionType(sec) === 'skills') {
      const entry = sec.skillsGroup[eIdx];
      document.getElementById('cv_skills_category').value = entry.category || '';
      document.getElementById('cv_skills_list').value = (entry.skills || []).join(', ');
      tempCvLinks = {};
      cancelCvLinkEdit();
      renderCvLinkChips();
    } else {
      const entry = sec.items[eIdx];
      const labelType = ['degree', 'role', 'award', 'title'].find((k) => entry[k] !== undefined) || 'title';
      document.getElementById('cv_entry_label_type').value = labelType;
      document.getElementById('cv_entry_title').value = entry[labelType] || '';
      document.getElementById('cv_entry_org').value = entry.institution || entry.organization || '';
      document.getElementById('cv_entry_location').value = entry.location || '';
      document.getElementById('cv_entry_period').value = entry.period || entry.year || '';
      document.getElementById('cv_entry_badge').value = entry.badge || '';
      const details = entry.details;
      document.getElementById('cv_entry_details').value = Array.isArray(details) ? details.join('\n') : (details || '');
      tempCvLinks = { ...(entry.links || {}) };
      cancelCvLinkEdit();
      renderCvLinkChips();
    }

    btnAddCvEntry.innerHTML = '<i class="fa-solid fa-check"></i> Update This Entry';
    document.getElementById('btnCancelCvEntryEdit').style.display = 'inline-flex';
  }

  function cancelEntryEdit() {
    editingEntry = null;
    document.getElementById('cv_entry_title').value = '';
    document.getElementById('cv_entry_org').value = '';
    document.getElementById('cv_entry_location').value = '';
    document.getElementById('cv_entry_period').value = '';
    document.getElementById('cv_entry_badge').value = '';
    document.getElementById('cv_entry_details').value = '';
    document.getElementById('cv_skills_category').value = '';
    document.getElementById('cv_skills_list').value = '';
    tempCvLinks = {};
    cancelCvLinkEdit();
    renderCvLinkChips();
    btnAddCvEntry.innerHTML = '<i class="fa-solid fa-plus"></i> Add This Entry';
    document.getElementById('btnCancelCvEntryEdit').style.display = 'none';
  }

  // CV Entry Links Handling
  let tempCvLinks = {};
  let editingCvLinkKey = null;

  const cvLinkType = document.getElementById('cv_link_type');
  const cvLinkCustomWrap = document.getElementById('cv_link_customkey_wrap');
  const cvLinksChips = document.getElementById('cvLinksChips');
  const btnAddCvLink = document.getElementById('btnAddCvLink');
  const btnCancelCvLinkEdit = document.getElementById('btnCancelCvLinkEdit');

  if (cvLinkType) {
    cvLinkType.addEventListener('change', () => {
      if (cvLinkCustomWrap) cvLinkCustomWrap.style.display = cvLinkType.value === 'other' ? 'block' : 'none';
    });
  }

  function cancelCvLinkEdit() {
    editingCvLinkKey = null;
    const urlInput = document.getElementById('cv_link_url');
    const customKeyInput = document.getElementById('cv_link_customkey');
    if (urlInput) urlInput.value = '';
    if (customKeyInput) customKeyInput.value = '';
    if (btnAddCvLink) btnAddCvLink.innerHTML = '<i class="fa-solid fa-link"></i> Add Link';
    if (btnCancelCvLinkEdit) btnCancelCvLinkEdit.style.display = 'none';
  }

  function startCvLinkEdit(key) {
    editingCvLinkKey = key;
    if (!cvLinkType) return;
    const knownTypes = Array.from(cvLinkType.options).map((o) => o.value);
    if (knownTypes.includes(key)) {
      cvLinkType.value = key;
      if (cvLinkCustomWrap) cvLinkCustomWrap.style.display = 'none';
    } else {
      cvLinkType.value = 'other';
      if (cvLinkCustomWrap) {
        cvLinkCustomWrap.style.display = 'block';
        document.getElementById('cv_link_customkey').value = key;
      }
    }
    const urlInput = document.getElementById('cv_link_url');
    if (urlInput) urlInput.value = tempCvLinks[key] || '';
    if (btnAddCvLink) btnAddCvLink.innerHTML = '<i class="fa-solid fa-check"></i> Update Link';
    if (btnCancelCvLinkEdit) btnCancelCvLinkEdit.style.display = 'inline-flex';
  }

  function renderCvLinkChips() {
    if (!cvLinksChips) return;
    cvLinksChips.innerHTML = '';
    Object.keys(tempCvLinks).forEach((key) => {
      const label = formatLinkLabel(key);
      const chip = document.createElement('span');
      chip.className = 'btn-chip';
      chip.style.cssText = 'padding: 0.25rem 0.6rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.4rem;';
      chip.innerHTML = `<button type="button" data-edit-cvlink="${key}" style="border:none; background:none; cursor:pointer; color:inherit; font:inherit; padding:0;" title="Click to edit this link">${label}</button> <button type="button" data-remove-cvlink="${key}" style="border:none; background:none; cursor:pointer; color: var(--text-secondary); font-weight:700;">&times;</button>`;
      cvLinksChips.appendChild(chip);
    });
    cvLinksChips.querySelectorAll('[data-edit-cvlink]').forEach((btn) => {
      btn.addEventListener('click', () => startCvLinkEdit(btn.getAttribute('data-edit-cvlink')));
    });
    cvLinksChips.querySelectorAll('[data-remove-cvlink]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-remove-cvlink');
        delete tempCvLinks[key];
        if (editingCvLinkKey === key) cancelCvLinkEdit();
        renderCvLinkChips();
      });
    });
  }

  if (btnAddCvLink) {
    btnAddCvLink.addEventListener('click', () => {
      const type = cvLinkType ? cvLinkType.value : 'other';
      const url = document.getElementById('cv_link_url').value.trim();
      if (!url) return;
      let key = type;
      if (type === 'other') {
        key = document.getElementById('cv_link_customkey').value.trim().toLowerCase().replace(/\s+/g, '_');
        if (!key) return;
      }
      if (editingCvLinkKey && editingCvLinkKey !== key) {
        delete tempCvLinks[editingCvLinkKey];
      }
      tempCvLinks[key] = url;
      cancelCvLinkEdit();
      renderCvLinkChips();
    });
  }

  if (btnCancelCvLinkEdit) btnCancelCvLinkEdit.addEventListener('click', cancelCvLinkEdit);

  renderCvLinkChips();

  // Add or update a section
  const btnAddCvSection = document.getElementById('btnAddCvSection');
  if (btnAddCvSection) {
    btnAddCvSection.addEventListener('click', () => {
      const title = document.getElementById('cv_new_section_title').value.trim();
      const icon = document.getElementById('cv_new_section_icon').value.trim() || 'fa-solid fa-folder-open';
      const type = document.getElementById('cv_new_section_type').value;
      if (!title) return;

      if (editingSectionIndex !== null) {
        // Update existing section (title & icon only, keep its items/skillsGroup as is)
        const sec = currentCv.sections[editingSectionIndex];
        sec.title = title;
        sec.icon = icon;
        cancelSectionEdit();
      } else {
        const newSection = type === 'skills'
          ? { title, icon, skillsGroup: [] }
          : { title, icon, items: [] };
        currentCv.sections.push(newSection);
        document.getElementById('cv_new_section_title').value = '';
        document.getElementById('cv_new_section_icon').value = '';
      }
      refreshCvSectionDropdown();
      renderCvPreview();
    });
  }

  const btnCancelCvSectionEdit = document.getElementById('btnCancelCvSectionEdit');
  if (btnCancelCvSectionEdit) btnCancelCvSectionEdit.addEventListener('click', cancelSectionEdit);

  // Add or update an entry in the selected section
  const btnAddCvEntry = document.getElementById('btnAddCvEntry');
  if (btnAddCvEntry) {
    btnAddCvEntry.addEventListener('click', () => {
      const select = document.getElementById('cv_entry_section');
      const idx = Number(select.value);
      const sec = currentCv.sections[idx];
      if (!sec) return;

      if (sectionType(sec) === 'skills') {
        const category = document.getElementById('cv_skills_category').value.trim();
        const skills = document.getElementById('cv_skills_list').value.split(',').map((s) => s.trim()).filter(Boolean);
        if (!category || !skills.length) return;
        if (!sec.skillsGroup) sec.skillsGroup = [];
        const entry = { category, skills };
        if (editingEntry && editingEntry.sectionIndex === idx) {
          sec.skillsGroup[editingEntry.entryIndex] = entry;
        } else {
          sec.skillsGroup.push(entry);
        }
      } else {
        const labelType = document.getElementById('cv_entry_label_type').value; // degree / role / award / title
        const labelText = document.getElementById('cv_entry_title').value.trim();
        const org = document.getElementById('cv_entry_org').value.trim();
        const location = document.getElementById('cv_entry_location').value.trim();
        const period = document.getElementById('cv_entry_period').value.trim();
        const badge = document.getElementById('cv_entry_badge').value.trim();
        const detailsRaw = document.getElementById('cv_entry_details').value.trim();
        if (!labelText) return;

        const details = detailsRaw ? detailsRaw.split('\n').map((s) => s.trim()).filter(Boolean) : [];
        const newEntry = { [labelType]: labelText };
        if (org) {
          // Honors & Grants entries use "organization", most others use "institution"
          if (labelType === 'award') newEntry.organization = org;
          else newEntry.institution = org;
        }
        if (period) {
          // Honors entries in this CV format use "year" instead of "period"
          if (labelType === 'award') newEntry.year = period;
          else newEntry.period = period;
        }
        if (location) newEntry.location = location;
        if (badge) newEntry.badge = badge;
        if (details.length === 1) newEntry.details = details[0];
        else if (details.length > 1) newEntry.details = details;
        if (Object.keys(tempCvLinks).length > 0) {
          newEntry.links = { ...tempCvLinks };
        }

        if (!sec.items) sec.items = [];
        if (editingEntry && editingEntry.sectionIndex === idx) {
          sec.items[editingEntry.entryIndex] = newEntry;
        } else {
          sec.items.push(newEntry);
        }
      }

      cancelEntryEdit();
      renderCvPreview();
    });
  }

  const btnCancelCvEntryEdit = document.getElementById('btnCancelCvEntryEdit');
  if (btnCancelCvEntryEdit) btnCancelCvEntryEdit.addEventListener('click', cancelEntryEdit);

  function buildCvObject() {
    const lastUpdated = document.getElementById('cv_last_updated').value.trim();
    const pdfUrl = document.getElementById('cv_pdf_url').value.trim();
    if (lastUpdated) currentCv.lastUpdated = lastUpdated;
    if (pdfUrl) currentCv.pdfDownloadUrl = pdfUrl;
    return currentCv;
  }

  const btnGenerateCvJson = document.getElementById('btnGenerateCvJson');
  const btnDlCv = document.getElementById('btnDownloadCv');
  const cvOutput = document.getElementById('cvOutputBox');

  if (btnGenerateCvJson) {
    btnGenerateCvJson.addEventListener('click', () => {
      const cvObj = buildCvObject();
      if (cvOutput) renderJsonOutput(cvOutput, JSON.stringify(cvObj, null, 2));
    });
  }

  if (btnDlCv) {
    btnDlCv.addEventListener('click', () => {
      const cvObj = buildCvObject();
      const jsonStr = JSON.stringify(cvObj, null, 2);
      downloadFile(jsonStr, 'cv.json', 'application/json');
    });
  }

  populateCvForm(currentCv);

  function downloadFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }
});