# 🎓 How to Customize Your Academic Website (Beginner-Friendly Guide)

Welcome! This academic website is specifically designed so that **any student or researcher with zero coding knowledge** can easily customize and maintain their personal portfolio.

You can customize everything in two ways:
1. **Method A: Use the In-Browser Visual Editor (`editor.html`)** — Easiest, no code needed!
2. **Method B: Edit the JSON and Markdown files directly in the `content/` folder.**

---

## 🚀 Quick Navigation
- [1. Changing Your Profile Photo & Info](#1-changing-your-profile-photo--info)
- [2. Adding News & Announcements](#2-adding-news--announcements)
- [3. Writing LaTeX Math Equations](#3-writing-latex-math-equations)
- [4. Code Snippets & Auto Copy Button](#4-code-snippets--auto-copy-button)
- [5. Adding Publications & BibTeX](#5-adding-publications--bibtex)
- [6. Adding Talks, Teaching & Projects](#6-adding-talks-teaching--projects)
- [7. Writing Blog Posts](#7-writing-blog-posts)
- [8. Updating Your CV / Resume](#8-updating-your-cv--resume)
- [9. Footer & Copyright](#9-footer--copyright)
- [10. Toggling Site Features](#10-toggling-site-features)
- [11. Free 1-Click GitHub Pages Deployment](#11-free-1-click-github-pages-deployment)

---

## 1. Changing Your Profile Photo & Info

### Profile Photo
1. Save your headshot inside the `images/` folder (e.g. `images/my_photo.jpg`).
2. Open `content/config.json` and update:
   ```json
   "avatar": "images/my_photo.jpg"
   ```

### Custom Favicons (Browser Icons)
Favicons in `images/favicon/` were generated using [RealFaviconGenerator.net](https://realfavicongenerator.net/). To replace them with your own logo:
1. Upload your custom icon/logo to [RealFaviconGenerator.net](https://realfavicongenerator.net/).
2. Download the generated package.
3. Replace the files inside `images/favicon/` (`favicon.svg`, `favicon-96x96.png`, `favicon.ico`, `apple-touch-icon.png`, `site.webmanifest`).

### Name, Title, Bio & Contact
Open `content/config.json` and edit the `author` block:
```json
{
  "siteTitle": "Your Name, Ph.D.",
  "siteDescription": "Academic website of Your Name – Researcher in ...",
  "author": {
    "name": "Your Name, Ph.D.",
    "avatar": "images/profile.jpg",
    "title": "Postdoctoral Researcher",
    "department": "Department of Computer Science",
    "institution": "Your University",
    "location": "City, State, Country",
    "email": "your.email@university.edu",
    "phone": "+1 555 000 0000",
    "bio": "Short 2–3 sentence summary of your research focus...",
    "interests": [
      "Deep Learning Theory",
      "Scientific Machine Learning"
    ]
  }
}
```

> **Note:** The `phone` field is optional — remove it or leave it blank if you don't want it displayed.

### Social Links & Icons
In `content/config.json`, add or edit entries in the `social` array:
```json
{
  "name": "Google Scholar",
  "icon": "fa-brands fa-google-scholar",
  "url": "https://scholar.google.com/citations?user=YOUR_ID",
  "display": "Google Scholar"
}
```

Supported icons use [Font Awesome 6](https://fontawesome.com/icons) class names (e.g. `fa-brands fa-github`, `fa-brands fa-orcid`, `fa-brands fa-x-twitter`).

---

## 2. Adding News & Announcements

The **About** page shows a scrollable news feed. Edit `content/news.json` to add items:

```json
[
  {
    "date": "August 2026",
    "badge": "Paper",
    "content": "Our paper on *Neural Operators* was accepted at **ICML 2026** (Oral Presentation)!"
  },
  {
    "date": "July 2026",
    "badge": "Award",
    "content": "Received the **NSF GRFP** fellowship for 2026–2028."
  }
]
```

**Available badge values** (controls the colored pill): `Paper`, `Talk`, `Award`, `Service`, `Grant`, `News` — or any custom word.

Content supports **Markdown** formatting: `*italic*`, `**bold**`, and inline links `[text](url)`.

---

## 3. Writing LaTeX Math Equations

LaTeX formulas are **automatically rendered** via KaTeX across your bio (`about.md`), publication abstracts, talk descriptions, and blog posts (`content/posts/*.md`).

### Inline Math
Surround your formula with single dollar signs: `$ ... $`
```markdown
The famous Einstein relation is $E = mc^2$.
```

### Display / Centered Math Equations
Surround your formula with double dollar signs: `$$ ... $$`
```markdown
$$\mathcal{L}_{\text{PINN}}(\theta) = \frac{1}{N} \sum_{i=1}^N \left\| \mathcal{D}[u_\theta](\mathbf{x}_i) - f(\mathbf{x}_i) \right\|^2 + \lambda \mathcal{L}_{\text{boundary}}$$
```

> **Tip:** Inside JSON files, backslashes must be **doubled**: use `\\frac` instead of `\frac`.

---

## 4. Code Snippets & Auto Copy Button

To display code with automatic syntax highlighting and a built-in **"Copy"** button, use standard markdown triple backticks with the language name:

````markdown
```python
import torch
import torch.nn as nn

class ResidualBlock(nn.Module):
    def __init__(self, channels: int):
        super().__init__()
        self.conv = nn.Conv2d(channels, channels, 3, padding=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + torch.relu(self.conv(x))
```
````

The website automatically:
- Highlights syntax in a high-contrast dark theme (Highlight.js)
- Displays a language badge (e.g. `PYTHON`)
- Provides a 1-click **Copy Code** button with a "Copied!" checkmark animation

---

## 5. Adding Publications & BibTeX

Open `content/publications.json` and add a new entry. Full structure with all supported link types:

```json
{
  "id": "smith2026deep",
  "title": "Scalable Neural Operators for Physical Systems",
  "authors": ["Alex Morgan", "Jane Smith", "Elena Rostova"],
  "venue": "International Conference on Machine Learning (ICML)",
  "year": 2026,
  "type": "Conference",
  "selected": true,
  "badge": "Oral Presentation",
  "abstract": "We develop a new neural operator framework with bounded error $\\mathcal{O}(N^{-1/2})$...",
  "links": {
    "pdf": "https://arxiv.org/pdf/...",
    "arxiv": "https://arxiv.org/abs/...",
    "code": "https://github.com/your-username/repo-name",
    "project": "https://your-project-page.com",
    "video": "https://youtube.com/...",
    "doi": "https://doi.org/...",
    "dataset": "https://huggingface.co/datasets/...",
    "poster": "https://poster-link.com",
    "slides": "https://speakerdeck.com/...",
    "castom": "https://any-other-url.com"
  },
  "bibtex": "@inproceedings{smith2026deep,\n  title={Scalable Neural Operators},\n  author={Morgan, Alex and Smith, Jane},\n  booktitle={ICML},\n  year={2026}\n}"
}
```

**Key fields:**
| Field | Description |
|---|---|
| `type` | `"Conference"`, `"Journal"`, or `"Preprint"` — controls the filter tabs |
| `selected` | `true` shows the paper in the **Selected Publications** section |
| `badge` | Optional pill label (e.g. `"Oral Presentation"`, `"Spotlight"`, `"Featured Article"`) |
| `castom` | A wildcard link for any URL not covered by the standard link keys |

> **Tip:** When your name appears in the `authors` list, the website will **automatically bold and underline** your name!

---

## 6. Adding Talks, Teaching & Projects

### Talks (`content/talks.json`)
```json
{
  "title": "My Talk Title",
  "event": "Conference or Workshop Name",
  "type": "Invited Talk",
  "date": "August 15, 2026",
  "location": "City, Country",
  "description": "Short description of what was covered.",
  "links": {
    "slides": "https://speakerdeck.com/...",
    "video": "https://youtube.com/...",
    "paper": "#publications",
    "code": "https://github.com/...",
    "poster": "https://poster-link.com",
    "dataset": "https://huggingface.co/...",
    "event": "https://conference-homepage.com",
    "castom": "https://any-other-url.com"
  }
}
```

**Common `type` values:** `"Oral Presentation"`, `"Invited Seminar"`, `"Invited Talk"`, `"Departmental Talk"`, `"Spotlight Presentation"`.

---

### Teaching (`content/teaching.json`)
```json
{
  "role": "Head Teaching Assistant",
  "course": "CS 101: Introduction to Machine Learning",
  "institution": "Your University",
  "term": "Fall 2026",
  "level": "Graduate Level",
  "description": "Ran weekly recitations for 80+ students...",
  "links": {
    "syllabus": "https://university.edu/syllabus",
    "materials": "https://github.com/...",
    "slides": "https://slideshare.com/...",
    "coursePage": "https://university.edu/course",
    "video": "https://youtube.com/...",
    "notes": "https://university.edu/notes",
    "castom": "https://any-other-url.com"
  }
}
```

---

### Portfolio & Projects (`content/portfolio.json`)
```json
{
  "id": "my-project",
  "title": "My Awesome Research Tool",
  "subtitle": "Open-Source Research Framework",
  "category": "Open Source Software",
  "date": "2025 – Present",
  "image": "images/projects/my-project.svg",
  "description": "Describe what the project does and its impact...",
  "tags": ["Python", "PyTorch", "CUDA"],
  "links": {
    "github": "https://github.com/you/project",
    "docs": "https://project.readthedocs.io",
    "demo": "https://project.org/demo",
    "paper": "#publications",
    "video": "https://youtube.com/...",
    "slides": "https://slideshare.com/...",
    "poster": "https://poster-link.com",
    "dataset": "https://huggingface.co/...",
    "website": "https://project-homepage.com",
    "castom": "https://any-other-url.com"
  }
}
```

> **Project images:** Save SVG or PNG files to `images/projects/` and reference them in the `image` field.

---

## 7. Writing Blog Posts

1. Create a new Markdown file inside `content/posts/`, e.g.:
   `content/posts/2026-08-20-my-first-paper.md`

2. Add the post metadata to `content/posts.json`:
   ```json
   {
     "slug": "my-first-paper",
     "title": "Reflections on Publishing My First Machine Learning Paper",
     "date": "August 20, 2026",
     "readTime": "5 min read",
     "summary": "Key lessons learned during my first major conference submission.",
     "tags": ["Research", "PhD Life", "Writing"],
     "file": "content/posts/2026-08-20-my-first-paper.md"
   }
   ```

3. Write the post content in the `.md` file using standard Markdown. You can freely use:
   - LaTeX math: `$E = mc^2$` or `$$...$$`
   - Code blocks with syntax highlighting and auto-copy buttons
   - Standard Markdown: headers, bold, italic, links, tables

---

## 8. Updating Your CV / Resume

Edit `content/cv.json` to customize each section. Top-level structure:

```json
{
  "pdfDownloadUrl": "assets/Your_Name_CV.pdf",
  "lastUpdated": "August 2026",
  "sections": [ ... ]
}
```

> **Uploading a PDF:** Place your CV PDF in the `assets/` folder and update `pdfDownloadUrl` accordingly.

### Section Types

#### Education
```json
{
  "title": "Education",
  "icon": "fa-solid fa-graduation-cap",
  "items": [
    {
      "degree": "Ph.D. in Computer Science",
      "institution": "Your University",
      "location": "City, State",
      "period": "2020 – 2025",
      "details": [
        "Dissertation: *Your Dissertation Title*",
        "Advisor: Prof. Jane Doe"
      ],
      "links": {
        "thesis": "https://library.university.edu/thesis",
        "pdf": "https://link-to-pdf.com",
        "castom": "https://any-link.com"
      }
    }
  ]
}
```

#### Academic Appointments & Experience
```json
{
  "title": "Academic Appointments & Experience",
  "icon": "fa-solid fa-briefcase",
  "items": [
    {
      "role": "Postdoctoral Research Fellow",
      "institution": "University Name, Lab Name",
      "location": "City, State",
      "period": "2025 – Present",
      "details": ["Host: Prof. Jane Doe", "Research focus description."],
      "links": {
        "website": "https://lab.university.edu",
        "paper": "#publications",
        "castom": "https://any-link.com"
      }
    }
  ]
}
```

#### Honors, Grants & Fellowships
```json
{
  "title": "Honors, Grants & Fellowships",
  "icon": "fa-solid fa-award",
  "items": [
    {
      "award": "NSF Graduate Research Fellowship ($150,000)",
      "organization": "National Science Foundation",
      "year": "2022 – 2025",
      "links": {
        "certificate": "https://nsf.gov/awardsearch",
        "paper": "#publications",
        "slides": "https://speakerdeck.com",
        "castom": "https://any-link.com"
      }
    }
  ]
}
```

#### Professional Service & Reviewing
```json
{
  "title": "Professional Service & Reviewing",
  "icon": "fa-solid fa-handshake-angle",
  "items": [
    {
      "role": "Conference Reviewer",
      "details": "NeurIPS (2023–2026), ICML (2024–2026)."
    }
  ]
}
```

#### Technical & Mathematical Skills
```json
{
  "title": "Technical & Mathematical Skills",
  "icon": "fa-solid fa-code",
  "skillsGroup": [
    {
      "category": "Programming & Frameworks",
      "skills": ["Python", "PyTorch", "JAX", "C++", "Julia"]
    },
    {
      "category": "Mathematics & Theory",
      "skills": ["Differential Geometry", "Convex Optimization", "PDEs"]
    }
  ]
}
```

The CV page includes a **"Print / Save PDF"** button with dedicated print styling for a clean, professional paper resume.

---

## 9. Footer & Copyright

To change the copyright text or add a custom note, edit `content/config.json`:
```json
"footer": {
  "showCopyright": true,
  "copyrightText": "© 2026 Your Name. All rights reserved.",
  "customNote": "Developed by Your Developer Name."
}
```

- Set `showCopyright` to `false` to hide the copyright line entirely.
- `customNote` is optional — remove or leave it blank if not needed.

---

## 10. Toggling Site Features

The `features` block in `content/config.json` lets you enable or disable site-wide functionality:

```json
"features": {
  "enableMathJaxKaTeX": true,
  "enableCodeHighlighting": true,
  "enableCodeCopyButton": true,
  "enableDarkMode": true,
  "enableGlobalSearch": true,
  "enableBibtexModal": true,
  "enableMaintenanceMode": false
}
```

| Feature | What It Does |
|---|---|
| `enableMathJaxKaTeX` | Renders `$...$` and `$$...$$` LaTeX math via KaTeX |
| `enableCodeHighlighting` | Syntax-highlights code blocks (Highlight.js, dark theme) |
| `enableCodeCopyButton` | Adds a 1-click copy button to every code block |
| `enableDarkMode` | Shows the 🌙 Dark / Light mode toggle in the header |
| `enableGlobalSearch` | Enables the 🔍 quick-search modal (keyboard shortcut `/`) |
| `enableBibtexModal` | Enables the "Cite" button that opens a BibTeX copy modal |
| `enableMaintenanceMode` | Automatically redirects site visitors to `maintenance.html` |

---

## 11. Free 1-Click GitHub Pages Deployment

This website is **100% zero-build**—meaning you don't need Ruby, Jekyll, or NodeJS installed on your computer!

### Steps to publish online:
1. Create a new repository on GitHub named `yourusername.github.io` (or any repository name).
2. Upload/push all files in this directory to your GitHub repository.
3. On GitHub, go to **Settings** > **Pages**.
4. Under **Branch**, select `main` (or `master`) and folder `/ (root)`, then click **Save**.
5. In ~30 seconds, your academic website will be live at `https://yourusername.github.io`!

> **Tip:** You can also use any other repo name (e.g. `my-portfolio`) and it will be available at `https://yourusername.github.io/my-portfolio`.
