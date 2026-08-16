/**
 * AcademicPages-Inspired Portfolio Core Application
 * Handles JSON/Markdown dynamic loading, KaTeX LaTeX math rendering,
 * syntax highlighting with auto language detection & copy buttons,
 * search indexing, routing, and dark/light themes.
 */

(function () {
  'use strict';

  // Application State
  const state = {
    config: null,
    publications: [],
    talks: [],
    teaching: [],
    portfolio: [],
    posts: [],
    cv: null,
    news: [],
    activeTab: 'about',
    activePostSlug: null,
    pubFilter: 'all',
    searchIndex: []
  };

  // Helper: Fetch JSON or fallback
  async function fetchJSON(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${path}`);
      return await response.json();
    } catch (err) {
      console.warn(`Failed to load ${path}:`, err);
      return null;
    }
  }

  // Helper: Fetch Text (for Markdown)
  async function fetchText(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${path}`);
      return await response.text();
    } catch (err) {
      console.warn(`Failed to load text ${path}:`, err);
      return '';
    }
  }

  // Dictionary of known link keys, icons, and display labels
  const LINK_METADATA = {
    pdf: { label: 'PDF', icon: 'fa-solid fa-file-pdf' },
    arxiv: { label: 'arXiv', icon: 'fa-solid fa-graduation-cap' },
    code: { label: 'Code', icon: 'fa-brands fa-github' },
    github: { label: 'GitHub', icon: 'fa-brands fa-github' },
    project: { label: 'Project', icon: 'fa-solid fa-globe' },
    video: { label: 'Video', icon: 'fa-solid fa-play' },
    recording: { label: 'Recording', icon: 'fa-solid fa-play' },
    slides: { label: 'Slides', icon: 'fa-solid fa-person-chalkboard' },
    poster: { label: 'Poster', icon: 'fa-solid fa-image' },
    paper: { label: 'Paper', icon: 'fa-solid fa-file-lines' },
    doi: { label: 'DOI', icon: 'fa-solid fa-fingerprint' },
    dataset: { label: 'Dataset', icon: 'fa-solid fa-database' },
    data: { label: 'Data', icon: 'fa-solid fa-database' },
    demo: { label: 'Demo', icon: 'fa-solid fa-laptop-code' },
    docs: { label: 'Docs', icon: 'fa-solid fa-book' },
    documentation: { label: 'Docs', icon: 'fa-solid fa-book' },
    syllabus: { label: 'Syllabus', icon: 'fa-solid fa-book' },
    materials: { label: 'Course Materials', icon: 'fa-brands fa-github' },
    coursepage: { label: 'Website', icon: 'fa-solid fa-globe' },
    coursePage: { label: 'Website', icon: 'fa-solid fa-globe' },
    website: { label: 'Website', icon: 'fa-solid fa-globe' },
    site: { label: 'Website', icon: 'fa-solid fa-globe' },
    event: { label: 'Event Page', icon: 'fa-solid fa-arrow-up-right-from-square' },
    certificate: { label: 'Certificate', icon: 'fa-solid fa-certificate' },
    thesis: { label: 'Thesis', icon: 'fa-solid fa-graduation-cap' },
    notes: { label: 'Lecture Notes', icon: 'fa-solid fa-note-sticky' },
    assignment: { label: 'Assignments', icon: 'fa-solid fa-list-check' },
    changelog: { label: 'Changelog', icon: 'fa-solid fa-clock-rotate-left' },
    photos: { label: 'Photos', icon: 'fa-solid fa-camera' }
  };

  function getLinkIcon(key) {
    if (!key) return 'fa-solid fa-arrow-up-right-from-square';
    const direct = LINK_METADATA[key];
    if (direct) return direct.icon;
    const lower = LINK_METADATA[key.toLowerCase()];
    if (lower) return lower.icon;
    return 'fa-solid fa-arrow-up-right-from-square';
  }

  function formatLinkLabel(key) {
    if (!key) return 'Link';
    const direct = LINK_METADATA[key];
    if (direct) return direct.label;
    const lower = LINK_METADATA[key.toLowerCase()];
    if (lower) return lower.label;
    return key
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function normalizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('./') ||
      trimmed.startsWith('../') ||
      trimmed.startsWith('assets/') ||
      trimmed.startsWith('images/') ||
      trimmed.startsWith('content/')
    ) {
      return trimmed;
    }
    return 'https://' + trimmed;
  }

  function renderAllLinks(links, options = {}) {
    if (!links || typeof links !== 'object') return options.extraButtons || '';
    const { primaryKey = null, extraButtons = '' } = options;
    const entries = Object.entries(links).filter(([_, url]) => url && typeof url === 'string' && url.trim());
    if (entries.length === 0 && !extraButtons) return '';

    const linkChipsHtml = entries
      .map(([key, rawUrl]) => {
        const url = normalizeUrl(rawUrl);
        const isExternal = !rawUrl.trim().startsWith('#');
        const isPrimary = primaryKey && key.toLowerCase() === primaryKey.toLowerCase();
        const icon = getLinkIcon(key);
        const label = formatLinkLabel(key);
        const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
        const chipClass = `btn-chip${isPrimary ? ' primary' : ''}`;
        return `<a href="${url}" ${targetAttr} class="${chipClass}"><i class="${icon}"></i> ${label}</a>`;
      })
      .join(' ');

    return `${linkChipsHtml} ${extraButtons}`.trim();
  }

  // Helper: Render LaTeX math using KaTeX
  function renderLatexMath(str) {
    if (!str || typeof str !== 'string') return str || '';
    // Respect the enableMathJaxKaTeX feature flag
    const features = (state.config && state.config.features) || {};
    if (features.enableMathJaxKaTeX === false) return str;
    if (typeof katex === 'undefined') return str;

    // Display math: $$...$$
    str = str.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
      try {
        return `<div class="katex-display-wrapper">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        console.warn('KaTeX display error:', e);
        return match;
      }
    });

    // Inline math: $...$
    str = str.replace(/(?<!\\)\$([^\$\n\r]+?)(?<!\\)\$/g, (match, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      } catch (e) {
        console.warn('KaTeX inline error:', e);
        return match;
      }
    });

    return str;
  }

  // Helper: Parse Markdown to HTML with Full LaTeX Math Protection
  function parseMarkdown(mdText) {
    if (!mdText || typeof mdText !== 'string') return mdText || '';

    // Check feature flag — if KaTeX is disabled, skip all math processing
    const features = (state.config && state.config.features) || {};
    const enableKaTeX = features.enableMathJaxKaTeX !== false;

    // Step 1: Temporarily protect fenced code blocks and inline code
    const codeBlocks = [];
    let text = mdText.replace(/(```[\s\S]*?```|`[^`\n\r]+`)/g, (match) => {
      codeBlocks.push(match);
      return `%%%CODEBLOCK_${codeBlocks.length - 1}%%%`;
    });

    // Step 2: Extract & pre-render LaTeX math before Marked touches underscores, brackets, etc.
    const mathPlaceholders = [];

    // 2a. Display Math: $$ ... $$
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
      let rendered = match;
      if (enableKaTeX && typeof katex !== 'undefined') {
        try {
          rendered = `<div class="katex-display-wrapper">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
        } catch (e) {
          rendered = match;
        }
      }
      mathPlaceholders.push({ type: 'display', rendered });
      return `\n\n%%%KATEX_MATH_${mathPlaceholders.length - 1}%%%\n\n`;
    });

    // 2b. Inline Math: $ ... $
    text = text.replace(/(?<!\\)\$([^\$\n\r]+?)(?<!\\)\$/g, (match, math) => {
      let rendered = match;
      if (enableKaTeX && typeof katex !== 'undefined') {
        try {
          rendered = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch (e) {
          rendered = match;
        }
      }
      mathPlaceholders.push({ type: 'inline', rendered });
      return `%%%KATEX_MATH_${mathPlaceholders.length - 1}%%%`;
    });

    // Step 3: Restore code blocks so Marked can format them
    codeBlocks.forEach((code, idx) => {
      text = text.replace(`%%%CODEBLOCK_${idx}%%%`, code);
    });

    // Step 4: Parse markdown to HTML
    let html = '';
    if (typeof marked !== 'undefined') {
      html = marked.parse(text);
    } else {
      html = text.replace(/\n/g, '<br>');
    }

    // Step 5: Replace math placeholders with KaTeX rendered HTML
    mathPlaceholders.forEach((item, idx) => {
      const token = `%%%KATEX_MATH_${idx}%%%`;
      if (item.type === 'display') {
        const pWrapped = new RegExp(`<p>\\s*${token}\\s*<\\/p>`, 'g');
        if (pWrapped.test(html)) {
          html = html.replace(pWrapped, item.rendered);
        } else {
          html = html.replaceAll(token, item.rendered);
        }
      } else {
        html = html.replaceAll(token, item.rendered);
      }
    });

    return html;
  }

  // Helper: Enhance Code blocks with Auto-Language Badge & Copy button
  function enhanceCodeBlocks(container) {
    const features = (state.config && state.config.features) || {};
    const enableHighlight = features.enableCodeHighlighting !== false;
    const enableCopyBtn = features.enableCodeCopyButton !== false;

    const codeBlocks = container.querySelectorAll('pre code');
    codeBlocks.forEach((block) => {
      // Check if already enhanced
      if (block.closest('.code-block-wrapper')) return;

      const pre = block.parentElement;
      const rawCode = block.textContent;

      // Detect language from class (e.g. language-python) or heuristic
      let lang = 'Code';
      const classMatch = block.className.match(/language-(\w+)/);
      if (classMatch) {
        lang = classMatch[1].toUpperCase();
      } else {
        // Simple auto-detect heuristic
        if (rawCode.includes('import ') || rawCode.includes('def ') || rawCode.includes('class ')) {
          lang = 'PYTHON';
        } else if (rawCode.includes('#!/bin/bash') || rawCode.includes('git ') || rawCode.includes('curl ')) {
          lang = 'BASH';
        } else if (rawCode.includes('\\documentclass') || rawCode.includes('\\begin{')) {
          lang = 'LATEX';
        } else if (rawCode.includes('function') || rawCode.includes('const ') || rawCode.includes('let ')) {
          lang = 'JAVASCRIPT';
        }
      }

      // Syntax highlighting — only when feature is enabled
      if (enableHighlight && typeof hljs !== 'undefined') {
        hljs.highlightElement(block);
      }

      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';

      const header = document.createElement('div');
      header.className = 'code-block-header';

      // Build header: always show language tag; copy button only when enabled
      header.innerHTML = `
        <span class="code-lang-tag">${lang}</span>
        ${enableCopyBtn ? `<button class="code-copy-btn" title="Copy code">
          <i class="fa-regular fa-copy"></i>
          <span>Copy</span>
        </button>` : ''}
      `;

      // Copy button event — only attach if it was rendered
      if (enableCopyBtn) {
        const copyBtn = header.querySelector('.code-copy-btn');
        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(rawCode);
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Copied!</span>`;
            setTimeout(() => {
              copyBtn.classList.remove('copied');
              copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> <span>Copy</span>`;
            }, 2000);
          } catch (err) {
            console.error('Failed to copy text:', err);
          }
        });
      }

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
    });
  }

  // Initialize UI & Config
  async function initApp() {
    // 1. Load config
    state.config = await fetchJSON('content/config.json');
    if (!state.config) {
      console.error('Could not load content/config.json');
      return;
    }

    // Check if Maintenance Mode is enabled
    if (state.config.features && state.config.features.enableMaintenanceMode === true) {
      window.location.replace('maintenance.html');
      return;
    }

    document.title = state.config.siteTitle || 'Academic Website';
    renderHeaderAndSidebar();
    renderFooter();

    // 2. Apply feature flags from config
    applyFeatureFlags(state.config.features || {});

    // 3. Load all content in parallel
    const [pubs, talks, teaching, portfolio, posts, cv, news] = await Promise.all([
      fetchJSON('content/publications.json'),
      fetchJSON('content/talks.json'),
      fetchJSON('content/teaching.json'),
      fetchJSON('content/portfolio.json'),
      fetchJSON('content/posts.json'),
      fetchJSON('content/cv.json'),
      fetchJSON('content/news.json')
    ]);

    state.publications = pubs || [];
    state.talks = talks || [];
    state.teaching = teaching || [];
    state.portfolio = portfolio || [];
    state.posts = posts || [];
    state.cv = cv || null;
    state.news = news || [];

    buildSearchIndex();
    setupEventListeners();
    handleRouting();
  }

  // Apply all feature flags declared in config.features
  function applyFeatureFlags(features) {
    // Dark Mode: only set default from config if the user hasn't saved a preference
    if (!localStorage.getItem('theme')) {
      const defaultTheme = features.enableDarkMode ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', defaultTheme);
    }

    // Global Search: show/hide search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.style.display = features.enableGlobalSearch === false ? 'none' : '';
    }

    // Dark Mode Toggle button: hide if dark mode feature is disabled
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.style.display = features.enableDarkMode === false ? 'none' : '';
    }

    // Store flags in state for use by renderers
    state.features = features;
  }

  // Render Header & Sticky Sidebar
  function renderHeaderAndSidebar() {
    const { author, navigation, siteTitle } = state.config;

    // Header Brand
    const brandEl = document.getElementById('siteBrand');
    if (brandEl) brandEl.textContent = siteTitle || author.name;

    // Nav Menu
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
      navMenu.innerHTML = navigation
        .map(
          (item) => `
          <li>
            <a href="#${item.id}" class="nav-link" data-tab="${item.id}">
              <i class="${item.icon}"></i> ${item.title}
            </a>
          </li>
        `
        )
        .join('');
    }

    // Author Sidebar
    const avatarImg = document.getElementById('authorAvatar');
    if (avatarImg) {
      avatarImg.src = author.avatar || 'images/profile.jpg';
      avatarImg.alt = author.name;
    }

    const nameEl = document.getElementById('authorName');
    if (nameEl) nameEl.textContent = author.name;

    const titleEl = document.getElementById('authorTitle');
    if (titleEl) titleEl.textContent = author.title;

    const affilEl = document.getElementById('authorAffiliation');
    if (affilEl) affilEl.textContent = `${author.department ? author.department + ', ' : ''}${author.institution || ''}`;

    const bioSnippet = document.getElementById('authorBioSnippet');
    if (bioSnippet) bioSnippet.textContent = author.bio || '';

    // Author details (location, email, phone)
    const detailsList = document.getElementById('authorDetails');
    if (detailsList) {
      detailsList.innerHTML = `
        ${author.location ? `<li><i class="fa-solid fa-location-dot"></i> <span>${author.location}</span></li>` : ''}
        ${author.email ? `<li><i class="fa-solid fa-envelope"></i> <a href="mailto:${author.email}">${author.email}</a></li>` : ''}
        ${author.phone ? `<li><i class="fa-solid fa-phone"></i> <a href="tel:${author.phone}">${author.phone}</a></li>` : ''}
      `;
    }

    // Social & Academic links
    const socialContainer = document.getElementById('socialLinks');
    if (socialContainer && author.social) {
      socialContainer.innerHTML = author.social
        .map(
          (s) => `
          <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="social-link-item" title="${s.name}">
            <i class="${s.icon}"></i> <span>${s.display || s.name}</span>
          </a>
        `
        )
        .join('');
    }
  }

  // Render Minimalist Copyright Footer
  function renderFooter() {
    const footerEl = document.getElementById('footerCopyright');
    const footerEl2 = document.getElementById('footerCustomNote');
    const footerSection = document.querySelector('.site-footer');

    if (!state.config.footer) return;

    const footer = state.config.footer;

    // Honor showCopyright toggle
    if (footer.showCopyright === false) {
      if (footerSection) footerSection.style.display = 'none';
      return;
    } else {
      if (footerSection) footerSection.style.display = '';
    }

    if (footerEl) {
      const year = new Date().getFullYear();
      footerEl.textContent = footer.copyrightText || `© ${year} ${state.config.author.name}. All rights reserved.`;
    }

    // Optional custom note
    if (footerEl2) {
      if (footer.customNote && footer.customNote.trim()) {
        footerEl2.textContent = footer.customNote;
        footerEl2.style.display = '';
      } else {
        footerEl2.style.display = 'none';
      }
    }
  }

  // Client-Side Router
  async function handleRouting() {
    const hash = window.location.hash.slice(1) || 'about';
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;

    // Check for blog post deep link (e.g. #blog/slug)
    if (hash.startsWith('blog/')) {
      const slug = hash.replace('blog/', '');
      state.activeTab = 'blog';
      updateNavHighlight('blog');
      await renderBlogPost(slug, contentArea);
      enhanceCodeBlocks(contentArea);
      window.scrollTo(0, 0);
      return;
    }

    state.activeTab = hash;
    updateNavHighlight(hash);

    switch (hash) {
      case 'about':
        await renderAboutPage(contentArea);
        break;
      case 'publications':
        renderPublicationsPage(contentArea);
        break;
      case 'talks':
        renderTalksPage(contentArea);
        break;
      case 'teaching':
        renderTeachingPage(contentArea);
        break;
      case 'portfolio':
        renderPortfolioPage(contentArea);
        break;
      case 'blog':
        renderBlogPage(contentArea);
        break;
      case 'cv':
        renderCVPage(contentArea);
        break;
      default:
        await renderAboutPage(contentArea);
    }

    enhanceCodeBlocks(contentArea);
    window.scrollTo(0, 0);
  }

  function updateNavHighlight(tabId) {
    document.querySelectorAll('.nav-link').forEach((link) => {
      if (link.getAttribute('data-tab') === tabId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // -------------------------------------------------------------
  // Page Renderers
  // -------------------------------------------------------------

  // About Page
  async function renderAboutPage(container) {
    const aboutMd = await fetchText('content/about.md');
    const parsedBio = parseMarkdown(aboutMd);

    let interestsHtml = '';
    if (state.config.author.interests && state.config.author.interests.length > 0) {
      interestsHtml = `
        <div style="margin-top: 1.5rem;">
          <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem;">Research Interests</h3>
          <div class="tag-list">
            ${state.config.author.interests.map((t) => `<span class="tag-badge"><i class="fa-solid fa-atom" style="margin-right: 4px;"></i> ${t}</span>`).join('')}
          </div>
        </div>
      `;
    }

    let newsHtml = '';
    if (state.news && state.news.length > 0) {
      newsHtml = `
        <div style="margin-top: 2rem;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
            <i class="fa-solid fa-bullhorn" style="color: var(--primary); margin-right: 6px;"></i> Recent News & Updates
          </h2>
          <div class="timeline">
            ${state.news
              .map(
                (item) => `
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-meta">
                    <span class="timeline-date">${item.date}</span>
                    ${item.badge ? `<span class="timeline-badge">${item.badge}</span>` : ''}
                  </div>
                  <div class="timeline-text">${renderLatexMath(parseMarkdown(item.content))}</div>
                </div>
              `
              )
              .join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">About Me</h1>
        <p class="page-subtitle">${state.config.author.title} at ${state.config.author.institution}</p>
      </div>
      <div class="prose">
        ${parsedBio}
      </div>
      ${interestsHtml}
      ${newsHtml}
    `;
  }

  // Publications Page
  function renderPublicationsPage(container) {
    const filter = state.pubFilter;
    const authorName = state.config.author.name.replace(', Ph.D.', '').replace('Dr. ', '').trim();

    let filtered = state.publications;
    if (filter !== 'all') {
      filtered = state.publications.filter((p) => p.type.toLowerCase() === filter.toLowerCase());
    }

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Publications</h1>
        <p class="page-subtitle">Peer-reviewed conference proceedings, journal articles, and preprints.</p>
      </div>

      <div class="filter-bar">
        <div class="filter-buttons">
          <button class="filter-btn ${filter === 'all' ? 'active' : ''}" data-filter="all">All (${state.publications.length})</button>
          <button class="filter-btn ${filter === 'conference' ? 'active' : ''}" data-filter="conference">Conferences</button>
          <button class="filter-btn ${filter === 'journal' ? 'active' : ''}" data-filter="journal">Journals</button>
          <button class="filter-btn ${filter === 'preprint' ? 'active' : ''}" data-filter="preprint">Preprints</button>
        </div>
        <div class="search-input-wrap">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="pubSearchInput" class="search-input" placeholder="Search title, author, year...">
        </div>
      </div>

      <div class="publication-list" id="publicationList">
        ${renderPubCards(filtered, authorName)}
      </div>
    `;

    // Filter clicks
    container.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.pubFilter = btn.getAttribute('data-filter');
        renderPublicationsPage(container);
      });
    });

    // Search filter
    const searchInput = container.querySelector('#pubSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const results = state.publications.filter(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.venue.toLowerCase().includes(query) ||
            p.year.toString().includes(query) ||
            p.authors.some((a) => a.toLowerCase().includes(query))
        );
        document.getElementById('publicationList').innerHTML = renderPubCards(results, authorName);
        attachPubCardListeners(container);
      });
    }

    attachPubCardListeners(container);
  }

  function renderPubCards(pubs, authorName) {
    if (!pubs.length) {
      return `<p style="color: var(--text-muted); font-style: italic; padding: 1rem 0;">No publications found matching your criteria.</p>`;
    }

    return pubs
      .map((pub) => {
        // Highlight current author
        const authorsHtml = pub.authors
          .map((a) => (a.includes(authorName) ? `<span class="pub-author-me">${a}</span>` : a))
          .join(', ');

        return `
        <article class="publication-card" id="${pub.id}">
          <div class="pub-header">
            <h2 class="pub-title">${renderLatexMath(pub.title)}</h2>
            ${pub.badge ? `<span class="pub-badge">${pub.badge}</span>` : ''}
          </div>
          <div class="pub-authors">${authorsHtml}</div>
          <div class="pub-venue">${pub.venue}, ${pub.year}</div>

          <div class="pub-links">
            ${renderAllLinks(pub.links, {
              primaryKey: 'pdf',
              extraButtons: `
                ${pub.abstract ? `<button class="btn-chip abstract-toggle-btn" data-id="${pub.id}"><i class="fa-solid fa-align-left"></i> Abstract</button>` : ''}
                ${(pub.bibtex && (state.features && state.features.enableBibtexModal !== false)) ? `<button class="btn-chip bibtex-modal-btn" data-id="${pub.id}"><i class="fa-solid fa-quote-right"></i> BibTeX</button>` : ''}
              `
            })}
          </div>

          ${
            pub.abstract
              ? `<div class="pub-abstract-drawer" id="abstract-${pub.id}">
                  <strong>Abstract:</strong> ${renderLatexMath(pub.abstract)}
                 </div>`
              : ''
          }
        </article>
      `;
      })
      .join('');
  }

  function attachPubCardListeners(container) {
    // Abstract toggle
    container.querySelectorAll('.abstract-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const drawer = document.getElementById(`abstract-${id}`);
        if (drawer) drawer.classList.toggle('open');
      });
    });

    // BibTeX modal
    container.querySelectorAll('.bibtex-modal-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const pub = state.publications.find((p) => p.id === id);
        if (pub && pub.bibtex) {
          openBibtexModal(pub.title, pub.bibtex);
        }
      });
    });
  }

  // Talks Page
  function renderTalksPage(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Talks & Presentations</h1>
        <p class="page-subtitle">Invited seminars, conference oral presentations, and workshops.</p>
      </div>

      <div class="publication-list">
        ${state.talks
          .map(
            (talk) => `
            <article class="publication-card">
              <div class="pub-header">
                <h2 class="pub-title">${renderLatexMath(talk.title)}</h2>
                <span class="pub-badge">${talk.type}</span>
              </div>
              <div class="pub-authors"><strong>${talk.event}</strong> &bull; ${talk.location}</div>
              <div class="pub-venue"><i class="fa-regular fa-calendar" style="margin-right: 4px;"></i> ${talk.date}</div>
              <p style="font-size: 0.925rem; color: var(--text-secondary); margin-bottom: 0.85rem; line-height: 1.5;">
                ${renderLatexMath(talk.description)}
              </p>
              <div class="pub-links">
                ${renderAllLinks(talk.links, { primaryKey: 'slides' })}
              </div>
            </article>
          `
          )
          .join('')}
      </div>
    `;
  }

  // Teaching Page
  function renderTeachingPage(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Teaching</h1>
        <p class="page-subtitle">University courses, recitations, and instructional materials.</p>
      </div>

      <div class="publication-list">
        ${state.teaching
          .map(
            (t) => `
            <article class="publication-card">
              <div class="pub-header">
                <h2 class="pub-title">${t.course}</h2>
                <span class="pub-badge">${t.role}</span>
              </div>
              <div class="pub-authors"><strong>${t.institution}</strong> &bull; ${t.level}</div>
              <div class="pub-venue"><i class="fa-regular fa-calendar-days" style="margin-right: 4px;"></i> ${t.term}</div>
              <p style="font-size: 0.925rem; color: var(--text-secondary); margin-bottom: 0.85rem; line-height: 1.5;">
                ${t.description}
              </p>
              <div class="pub-links">
                ${renderAllLinks(t.links, { primaryKey: 'syllabus' })}
              </div>
            </article>
          `
          )
          .join('')}
      </div>
    `;
  }

  // Portfolio / Projects Page
  function renderPortfolioPage(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Portfolio & Projects</h1>
        <p class="page-subtitle">Open-source software packages, research tools, and benchmark datasets.</p>
      </div>

      <div class="projects-grid">
        ${state.portfolio
          .map(
            (p) => `
            <div class="project-card">
              <div class="project-image">
                <img src="${p.image}" alt="${p.title}">
              </div>
              <div class="project-body">
                <div class="project-meta">
                  <span>${p.category}</span>
                  <span>${p.date}</span>
                </div>
                <h2 class="project-title">${p.title}</h2>
                <p class="project-desc">${p.description}</p>
                <div class="project-tags">
                  ${p.tags.map((t) => `<span class="tag-badge">${t}</span>`).join('')}
                </div>
                <div class="project-links">
                  ${renderAllLinks(p.links, { primaryKey: 'github' })}
                </div>
              </div>
            </div>
          `
          )
          .join('')}
      </div>
    `;
  }

  // Blog Page
  function renderBlogPage(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Blog & Insights</h1>
        <p class="page-subtitle">Articles on deep learning theory, mathematics, and academic research workflows.</p>
      </div>

      <div class="post-list">
        ${state.posts
          .map(
            (post) => `
            <article class="post-card" onclick="window.location.hash = 'blog/${post.slug}'">
              <div class="post-meta">
                <span><i class="fa-regular fa-calendar"></i> ${post.date}</span>
                <span>&bull;</span>
                <span><i class="fa-regular fa-clock"></i> ${post.readTime}</span>
              </div>
              <h2 class="post-title">${post.title}</h2>
              <p class="post-summary">${post.summary}</p>
              <div class="tag-list" style="margin-bottom: 0;">
                ${post.tags.map((t) => `<span class="tag-badge">${t}</span>`).join('')}
              </div>
            </article>
          `
          )
          .join('')}
      </div>
    `;
  }

  // Single Blog Post Viewer
  async function renderBlogPost(slug, container) {
    const postMeta = state.posts.find((p) => p.slug === slug);
    if (!postMeta) {
      container.innerHTML = `<p>Post not found. <a href="#blog">Back to Blog</a></p>`;
      return;
    }

    const postContent = await fetchText(postMeta.file);
    const parsedHtml = parseMarkdown(postContent);

    container.innerHTML = `
      <div class="post-back-btn" onclick="window.location.hash = 'blog'">
        <i class="fa-solid fa-arrow-left"></i> Back to All Articles
      </div>

      <div class="page-header" style="margin-bottom: 1.5rem;">
        <div class="post-meta" style="margin-bottom: 0.5rem;">
          <span><i class="fa-regular fa-calendar"></i> ${postMeta.date}</span>
          <span>&bull;</span>
          <span><i class="fa-regular fa-clock"></i> ${postMeta.readTime}</span>
        </div>
        <div class="tag-list" style="margin-top: 0.75rem;">
          ${postMeta.tags.map((t) => `<span class="tag-badge">${t}</span>`).join('')}
        </div>
      </div>

      <div class="prose">
        ${parsedHtml}
      </div>

      <hr style="margin: 2.5rem 0; border: 0; height: 1px; background-color: var(--border-color);">

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div class="post-back-btn" onclick="window.location.hash = 'blog'" style="margin-bottom: 0;">
          <i class="fa-solid fa-arrow-left"></i> Back to Blog
        </div>
        <a href="#about" class="btn-chip primary"><i class="fa-solid fa-user"></i> About Author</a>
      </div>
    `;
  }

  // CV / Resume Page
  function renderCVPage(container) {
    if (!state.cv) {
      container.innerHTML = `<p style="color: var(--text-muted); padding: 2rem 0;">Loading CV data...</p>`;
      return;
    }

    const { sections, pdfDownloadUrl, lastUpdated } = state.cv;
    const author = (state.config && state.config.author) || {};
    const affiliation = `${author.department ? author.department + ', ' : ''}${author.institution || ''}`;

    // Print Header (Visible ONLY during @media print)
    const printHeaderHtml = `
      <div class="cv-print-header">
        <h1 class="cv-print-name">${author.name || 'Curriculum Vitae'}</h1>
        <div class="cv-print-title">${author.title || ''}${affiliation ? ` &bull; ${affiliation}` : ''}</div>
        <div class="cv-print-contacts">
          ${author.email ? `<span><i class="fa-solid fa-envelope"></i> ${author.email}</span>` : ''}
          ${author.phone ? `<span><i class="fa-solid fa-phone"></i> ${author.phone}</span>` : ''}
          ${author.location ? `<span><i class="fa-solid fa-location-dot"></i> ${author.location}</span>` : ''}
          ${author.social && author.social.length ? `<span><i class="fa-solid fa-globe"></i> ${author.social[0].display || author.social[0].name}</span>` : ''}
          ${lastUpdated ? `<span><i class="fa-solid fa-clock"></i> Updated: ${lastUpdated}</span>` : ''}
        </div>
      </div>
    `;

    // Screen Nav Pills for jumping between sections
    const navPillsHtml = Array.isArray(sections) && sections.length > 0 ? `
      <div class="cv-nav-pills cv-screen-only">
        ${sections.map((sec, idx) => {
          const secId = `cv-sec-${idx}`;
          return `<a href="#cv" onclick="document.getElementById('${secId}')?.scrollIntoView({behavior: 'smooth'}); return false;" class="cv-pill-btn"><i class="${sec.icon || 'fa-solid fa-bookmark'}"></i> ${sec.title}</a>`;
        }).join('')}
      </div>
    ` : '';

    // Render individual item
    function renderCVItem(item) {
      if (!item) return '';

      const isAward = item.award !== undefined;
      const isDegree = item.degree !== undefined;
      const isRole = item.role !== undefined;

      let typeIcon = '';
      if (isAward) {
        typeIcon = '<i class="fa-solid fa-award" style="color: var(--primary); margin-right: 0.45rem; font-size: 0.9em;"></i>';
      } else if (isDegree) {
        typeIcon = '<i class="fa-solid fa-graduation-cap" style="color: var(--primary); margin-right: 0.45rem; font-size: 0.9em;"></i>';
      } else if (isRole) {
        typeIcon = '<i class="fa-solid fa-briefcase" style="color: var(--primary); margin-right: 0.45rem; font-size: 0.9em;"></i>';
      }

      const title = item.title || item.degree || item.role || item.award || item.position || item.name || '';
      const date = item.period || item.year || item.date || item.time || '';
      
      const org = item.institution || item.organization || item.company || item.venue || item.subtitle || '';
      const subInfo = [org, item.location].filter(Boolean).join(' &bull; ');

      // Render details: can be Array, Markdown string, or plain string
      let detailsHtml = '';
      if (Array.isArray(item.details) && item.details.length > 0) {
        detailsHtml = `
          <ul class="cv-item-details">
            ${item.details.map((d) => `<li>${parseMarkdown(d)}</li>`).join('')}
          </ul>
        `;
      } else if (typeof item.details === 'string' && item.details.trim()) {
        detailsHtml = `
          <div class="cv-item-text">
            ${parseMarkdown(item.details)}
          </div>
        `;
      }

      // Render item links if any (e.g. syllabus, thesis, pdf, certificate, code, paper, etc.)
      let linksHtml = '';
      if (item.links && typeof item.links === 'object') {
        const rendered = renderAllLinks(item.links);
        if (rendered) {
          linksHtml = `
            <div class="cv-item-links cv-screen-only" style="margin-top: 0.4rem;">
              ${rendered}
            </div>
          `;
        }
      }

      // Render tags/skills if item has them
      let tagsHtml = '';
      if (Array.isArray(item.tags) && item.tags.length > 0) {
        tagsHtml = `
          <div class="tag-list" style="margin-top: 0.4rem; margin-bottom: 0;">
            ${item.tags.map(t => `<span class="tag-badge" style="font-size: 0.75rem;">${t}</span>`).join('')}
          </div>
        `;
      }

      return `
        <div class="cv-item ${isAward ? 'cv-item-award' : isDegree ? 'cv-item-degree' : isRole ? 'cv-item-role' : ''}">
          <div class="cv-item-header">
            <span class="cv-item-title">${typeIcon}${renderLatexMath(title)}</span>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              ${item.badge ? `<span class="pub-badge" style="font-size: 0.725rem;">${item.badge}</span>` : ''}
              ${date ? `<span class="cv-item-date">${date}</span>` : ''}
            </div>
          </div>
          ${subInfo ? `<div class="cv-item-sub">${subInfo}</div>` : ''}
          ${detailsHtml}
          ${tagsHtml}
          ${linksHtml}
        </div>
      `;
    }

    container.innerHTML = `
      ${printHeaderHtml}

      <div class="page-header cv-screen-only">
        <h1 class="page-title">Curriculum Vitae</h1>
        <p class="page-subtitle">Academic education, appointments, awards, and professional service.</p>
      </div>

      <div class="cv-top-action cv-screen-only">
        <div>
          <strong>${author.name || 'Author'}</strong> &bull; Updated ${lastUpdated || 'Recently'}
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn-chip" onclick="window.print()"><i class="fa-solid fa-print"></i> Print / Save PDF</button>
          ${pdfDownloadUrl ? `<a href="${pdfDownloadUrl}" download target="_blank" class="btn-chip primary"><i class="fa-solid fa-download"></i> Download PDF</a>` : ''}
        </div>
      </div>

      ${navPillsHtml}

      <div class="cv-container" style="margin-top: 1.5rem;">
        ${(sections || [])
          .map((sec, idx) => {
            const secId = `cv-sec-${idx}`;

            // Skills Matrix Section
            if (sec.skillsGroup && Array.isArray(sec.skillsGroup)) {
              return `
                <div class="cv-section" id="${secId}">
                  <h2 class="cv-section-title"><i class="${sec.icon || 'fa-solid fa-code'}"></i> ${sec.title}</h2>
                  <div class="skills-matrix">
                    ${sec.skillsGroup
                      .map(
                        (g) => `
                        <div class="skill-category-card">
                          <div class="skill-category-title">${g.category}</div>
                          <div class="tag-list" style="margin: 0;">
                            ${(g.skills || []).map((s) => `<span class="tag-badge">${s}</span>`).join('')}
                          </div>
                        </div>
                      `
                      )
                      .join('')}
                  </div>
                </div>
              `;
            }

            // Freeform Markdown Section Content
            let sectionDescHtml = '';
            if (sec.content || sec.description) {
              sectionDescHtml = `
                <div class="prose" style="margin-bottom: 1rem; font-size: 0.95rem;">
                  ${parseMarkdown(sec.content || sec.description)}
                </div>
              `;
            }

            // Items List Section
            const itemsHtml = Array.isArray(sec.items)
              ? sec.items.map((item) => renderCVItem(item)).join('')
              : '';

            return `
              <div class="cv-section" id="${secId}">
                <h2 class="cv-section-title"><i class="${sec.icon || 'fa-solid fa-folder-open'}"></i> ${sec.title}</h2>
                ${sectionDescHtml}
                <div>
                  ${itemsHtml}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  // -------------------------------------------------------------
  // Modals & Search
  // -------------------------------------------------------------
  function openBibtexModal(title, bibtexStr) {
    const modal = document.getElementById('bibtexModal');
    const titleEl = document.getElementById('bibtexModalTitle');
    const codeEl = document.getElementById('bibtexModalCode');
    const copyBtn = document.getElementById('bibtexCopyBtn');

    if (!modal) return;
    if (titleEl) titleEl.textContent = title;
    if (codeEl) codeEl.textContent = bibtexStr;

    modal.classList.add('open');

    if (copyBtn) {
      copyBtn.onclick = async () => {
        await navigator.clipboard.writeText(bibtexStr);
        copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
        setTimeout(() => {
          copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy BibTeX`;
        }, 2000);
      };
    }
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.remove('open'));
  }

  function buildSearchIndex() {
    state.searchIndex = [];

    // Publications
    state.publications.forEach((p) => {
      state.searchIndex.push({
        title: p.title,
        subtitle: `${p.venue} (${p.year}) - Publication`,
        targetHash: 'publications',
        badge: 'Publication'
      });
    });

    // Talks
    state.talks.forEach((t) => {
      state.searchIndex.push({
        title: t.title,
        subtitle: `${t.event} (${t.date}) - Talk`,
        targetHash: 'talks',
        badge: 'Talk'
      });
    });

    // Teaching
    state.teaching.forEach((tc) => {
      state.searchIndex.push({
        title: `${tc.course}: ${tc.role}`,
        subtitle: `${tc.institution} (${tc.term})`,
        targetHash: 'teaching',
        badge: 'Teaching'
      });
    });

    // Projects
    state.portfolio.forEach((pr) => {
      state.searchIndex.push({
        title: pr.title,
        subtitle: pr.category,
        targetHash: 'portfolio',
        badge: 'Project'
      });
    });

    // Blog
    state.posts.forEach((pst) => {
      state.searchIndex.push({
        title: pst.title,
        subtitle: `${pst.date} - Blog Article`,
        targetHash: `blog/${pst.slug}`,
        badge: 'Article'
      });
    });

    // CV Sections, Entries & Skills
    if (state.cv && Array.isArray(state.cv.sections)) {
      state.cv.sections.forEach((sec) => {
        state.searchIndex.push({
          title: sec.title,
          subtitle: `CV Section &bull; ${state.config && state.config.author ? state.config.author.name : 'Curriculum Vitae'}`,
          targetHash: 'cv',
          badge: 'CV'
        });

        if (Array.isArray(sec.items)) {
          sec.items.forEach((item) => {
            const title = item.title || item.degree || item.role || item.award || item.position || item.name || '';
            const org = item.institution || item.organization || item.company || item.venue || '';
            const date = item.period || item.year || item.date || '';
            const sub = [sec.title, org, date].filter(Boolean).join(' &bull; ');

            if (title) {
              state.searchIndex.push({
                title: title,
                subtitle: sub,
                targetHash: 'cv',
                badge: 'CV'
              });
            }
          });
        }

        if (Array.isArray(sec.skillsGroup)) {
          sec.skillsGroup.forEach((g) => {
            (g.skills || []).forEach((skill) => {
              state.searchIndex.push({
                title: skill,
                subtitle: `${g.category} &bull; Technical Skill`,
                targetHash: 'cv',
                badge: 'Skill'
              });
            });
          });
        }
      });
    }
  }

  function openSearchModal() {
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('globalSearchInput');
    const resultsContainer = document.getElementById('searchResultsList');

    if (!modal) return;
    modal.classList.add('open');
    if (input) {
      input.value = '';
      input.focus();
    }
    if (resultsContainer) resultsContainer.innerHTML = '';
  }

  function handleSearchInput(query) {
    const resultsContainer = document.getElementById('searchResultsList');
    if (!resultsContainer) return;

    if (!query.trim()) {
      resultsContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Type to search publications, talks, courses, projects & articles...</p>`;
      return;
    }

    const q = query.toLowerCase();
    const matches = state.searchIndex.filter(
      (item) => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
    );

    if (!matches.length) {
      resultsContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No matching results found for "${query}".</p>`;
      return;
    }

    resultsContainer.innerHTML = matches
      .map(
        (m) => `
        <div class="search-result-item" onclick="window.location.hash = '${m.targetHash}'; document.getElementById('searchModal').classList.remove('open');">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <strong style="color: var(--text-primary); font-size: 0.95rem;">${m.title}</strong>
            <span class="pub-badge" style="font-size: 0.7rem;">${m.badge}</span>
          </div>
          <div style="font-size: 0.825rem; color: var(--text-muted);">${m.subtitle}</div>
        </div>
      `
      )
      .join('');
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Hash change routing
    window.addEventListener('hashchange', handleRouting);

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
      });
    }

    // Mobile Menu Toggle
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    if (mobileBtn && navMenu) {
      mobileBtn.addEventListener('click', () => {
        navMenu.classList.toggle('open');
      });
      navMenu.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    }

    // Search button & keyboard shortcut
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', openSearchModal);

    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        openSearchModal();
      }
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });

    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
    }

    // Close modals on click outside or close button
    document.querySelectorAll('.modal-close-btn').forEach((btn) => {
      btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeAllModals();
      });
    });
  }

  function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggleBtn i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
  }

  // DOM Content Loaded entry point
  document.addEventListener('DOMContentLoaded', initApp);
})();
