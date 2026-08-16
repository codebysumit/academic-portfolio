# 🎓 AcademicPages-Style Modern Portfolio Template

An elegant, ultra-fast, zero-build academic website template inspired by [AcademicPages](https://github.com/academicpages/academicpages.github.io) / Minimal Mistakes, engineered for **students, researchers, and professors with zero coding experience**.

![AcademicPages Style Portfolio](images/projects/geomtorch.svg)

---

## ✨ Key Features

- 🏛️ **Classic AcademicPages Layout**: Sticky profile card with avatar, affiliations, phone, social icons (Google Scholar, ORCID, GitHub, LinkedIn, arXiv, Twitter/X, Email), and responsive multi-page layout.
- 📐 **Full LaTeX Math Support**: Fast KaTeX rendering for inline `$E=mc^2$` and display math `$$\int_{-\infty}^\infty e^{-x^2} dx = \sqrt{\pi}$$` across bio, publication abstracts, talk descriptions, and blog posts.
- 💻 **Auto-Detect Code Snippets & Copy Buttons**: Syntax highlighting for Python, C++, PyTorch, LaTeX, Bash, etc., with automatic language badges and a 1-click **Copy Code** button.
- 📚 **Categorized Publications**: Filter by Conference, Journal, Preprint; author name auto-highlighting; badges (Oral, Spotlight, Featured); direct PDF / Code / ArXiv / Video / DOI / Dataset / Poster / Slides links; and interactive BibTeX copy modal.
- 📰 **News & Announcements Feed**: Scrollable timeline on the About page for paper acceptances, awards, talks, and service updates with color-coded badge pills.
- 🎙️ **Talks & Teaching**: Dedicated pages for invited seminars, conference presentations, courses taught — each with full link sets (slides, video, notes, syllabus, etc.).
- 🛠️ **Portfolio / Projects**: Showcase open-source software, research tools, and datasets with visual cards, tags, and rich link sets.
- ✍️ **Markdown Blog**: Full blog article viewer with tags, dates, estimated reading time, embedded LaTeX, and syntax-highlighted code.
- 📄 **Interactive & Printable CV**: Structured CV (Education, Appointments, Awards, Service, Skills) with clean print CSS for 1-click PDF exporting.
- 🎨 **Dark / Light Theme Switcher**: Elegant dark mode with smooth CSS transitions and browser preference memory.
- 🔍 **Live Global Search**: Instant keyword search across all publications, talks, courses, projects, and blog posts (`Press /`).
- 🎛️ **Visual Content Editor (`editor.html`)**: Built-in in-browser editor for non-technical users to edit and export all JSON content files without touching code.
- ⚙️ **Toggleable Feature Flags**: Enable or disable Dark Mode, Global Search, LaTeX, Code Highlighting, Copy Buttons, and BibTeX modal individually via `content/config.json`.
- 🔒 **Minimalist Copyright Footer**: Clean & distraction-free academic footer with optional custom note field.
- ⚡ **Zero-Build & GitHub Pages Ready**: No Jekyll, Ruby, or build scripts. Just push to GitHub and turn on GitHub Pages!

---

## 📁 Project Structure

```
academic-portfolio/
├── index.html                   # Main application entry point
├── editor.html                  # In-browser Visual Content Editor (no code needed)
├── HOW_TO_CUSTOMIZE.md          # Step-by-step guide for customizing the site
├── README.md                    # This documentation file
├── assets/
│   └── Your_Name_CV.pdf         # Downloadable CV PDF
├── css/
│   ├── style.css                # AcademicPages layout, dark/light theme, typography
│   └── syntax.css               # Code block styling, copy button & language badges
├── js/
│   ├── app.js                   # Routing, LaTeX rendering, code highlighter, search
│   └── editor.js                # Visual content editor logic
├── images/
│   ├── profile.jpg              # Profile / avatar photo
│   └── projects/                # Project card preview graphics (SVG/PNG)
└── content/
    ├── config.json              # Author profile, navigation, social links, footer & features
    ├── about.md                 # Main Markdown bio (supports LaTeX math)
    ├── news.json                # News & announcements timeline
    ├── publications.json        # Categorized publications with BibTeX
    ├── talks.json               # Talks and presentations
    ├── teaching.json            # Teaching experience & course links
    ├── portfolio.json           # Research tools & open-source projects
    ├── cv.json                  # Interactive CV sections
    ├── posts.json               # Blog post index (metadata)
    └── posts/                   # Markdown blog articles
```

---

## 🚀 Quickstart & Local Preview

To preview the website locally on your computer:

```bash
# Using Python (built-in on most machines)
python -m http.server 8000

# Or using Node.js
npx serve .
```

Then open `http://localhost:8000` in your web browser.

To use the visual content editor, open `http://localhost:8000/editor.html`.

---

## 🌐 Deploy to GitHub Pages in 2 Minutes

1. Create a repository on GitHub named `yourusername.github.io`.
2. Push all the files in this folder to your repository.
3. In GitHub repo settings, go to **Pages** → Source: **Deploy from a branch** → Branch: **main** / **root** → **Save**.
4. Your website is instantly live at `https://yourusername.github.io`!

---

## 🎛️ Customizing Your Site

All content is driven by simple JSON and Markdown files in the `content/` folder — no code required.

| File | What it controls |
|---|---|
| `content/config.json` | Name, title, bio, phone, avatar, social links, navigation, footer, feature flags |
| `content/about.md` | Your About / Bio page content (Markdown + LaTeX) |
| `content/news.json` | News & announcement feed on the About page |
| `content/publications.json` | Publications list with BibTeX, badges, and links |
| `content/talks.json` | Talks and invited presentations |
| `content/teaching.json` | Courses taught and teaching roles |
| `content/portfolio.json` | Research projects and open-source tools |
| `content/cv.json` | Full CV (Education, Appointments, Awards, Service, Skills) |
| `content/posts.json` | Blog post index |
| `content/posts/*.md` | Individual blog post Markdown files |

### Two ways to edit content

**Option A — Visual Editor (recommended for non-coders):**  
Open `editor.html` in your browser. It provides a point-and-click interface to add/edit/delete entries in all JSON files and download the updated file.

**Option B — Direct file editing:**  
Edit the JSON and `.md` files in the `content/` folder directly with any text editor (VS Code, Notepad++, etc.).

---

## 📖 Full Customization Guide

See [`HOW_TO_CUSTOMIZE.md`](HOW_TO_CUSTOMIZE.md) for step-by-step instructions with JSON examples for every section: profile, news, publications, talks, teaching, portfolio, CV, blog posts, footer, and feature flags.

