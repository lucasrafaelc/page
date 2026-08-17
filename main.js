// ======================= Utilities =======================
window.ROLE_MAP = window.ROLE_MAP || new Map(Object.entries({
  "Orientador": "Advisor",
  "Co-orientador": "Co-advisor",
  "Bolsista": "Scholarship holder",
  "Professor": "Professor",
  "Aluno": "Student",
  "Mestrado": "Master's",
  "Doutorado": "PhD",
}));

const MONTHS_PT = {
  "jan": "Jan", "fev": "Feb", "mar": "Mar", "abr": "Apr", "mai": "May", "jun": "Jun",
  "jul": "Jul", "ago": "Aug", "set": "Sep", "out": "Oct", "nov": "Nov", "dez": "Dec"
};

function normalizeMonthYear(pt) {
  if (!pt) return "";
  const m = String(pt).toLowerCase().match(/^([a-zç]{3})\s*\/\s*(\d{4})$/i);
  if (m) return (MONTHS_PT[m[1]] || m[1]) + " " + m[2];
  return pt;
}

function dateRank(value) {
  const text = String(value || "");
  const year = parseInt(text.match(/\d{4}/)?.[0] || "0", 10);
  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const monthText = text.slice(0, 3).toLowerCase();
  const month = monthNames.indexOf(monthText) + 1;
  return year * 100 + Math.max(month, 0);
}

function studentGroup(level) {
  const text = String(level || "").toLowerCase();
  if (text.includes("phd") || text.includes("doutorado")) return "PhD";
  if (text.includes("msc") || text.includes("master") || text.includes("mestrado")) return "MSc";
  if (text.includes("undergraduate") || text.includes("graduacao") || text.includes("graduação")) return "Undergraduate";
  return "Other";
}

const PROFESSIONAL_ROLE_LABELS = new Map(Object.entries({
  "LIVRE": "Other professional activity",
  "Livre": "Other professional activity",
  "PROFESSOR_TITULAR": "Full Professor",
  "Professor Titular": "Full Professor",
  "Professor Associado": "Associate Professor",
  "Professor Substituto": "Substitute Professor",
  "Professor Substituto (Part-time Lecturer)": "Substitute Professor (Part-time Lecturer)",
  "Professor vistante": "Visiting Professor",
  "Visiting Associate Professor": "Visiting Associate Professor",
  "Colaborador Convidado": "Invited Collaborator",
  "Mestranda": "Master's Student",
  "Bolsista de Mestrado": "Master's Scholarship Holder",
  "Bolsista recém-doutor": "Recent PhD Scholarship Holder",
  "Bolsista recem-doutor": "Recent PhD Scholarship Holder",
  "Horista": "Hourly Lecturer",
  "Membro de corpo editorial": "Editorial Board Member",
  "Membro de comitê assessor": "Advisory Committee Member",
  "Membro de comite assessor": "Advisory Committee Member",
  "Estagiario": "Intern",
  "Estagiário": "Intern",
  "Engenheiro de Software Senior": "Senior Software Engineer",
  "Programador": "Programmer",
  "Servidor público": "Public Servant",
  "Servidor publico": "Public Servant",
}));

function translateRole(label) { return ROLE_MAP.get(label) || label; }
function translateProfessionalRole(label) {
  const text = normalizeText(label);
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/�/g, "")
    .toLowerCase();
  if (normalized.includes("revisor") && /peri.?dico/.test(normalized)) return "Journal Reviewer";
  if (normalized.includes("corpo editorial")) return "Editorial Board Member";
  if (normalized.includes("comite assessor")) return "Advisory Committee Member";
  if (normalized.includes("estagiario")) return "Intern";
  if (normalized.includes("engenheiro de software")) return "Senior Software Engineer";
  if (normalized.includes("programador")) return "Programmer";
  if (normalized.includes("bolsista") && /rec.?m-doutor/.test(normalized)) return "Recent PhD Scholarship Holder";
  if (normalized.includes("servidor") && /p.?blico/.test(normalized)) return "Public Servant";
  return PROFESSIONAL_ROLE_LABELS.get(text) || labelFromCode(text);
}
function translatePtToEn(text) { return text || ""; } // hook for real translator

function labelFromCode(value) {
  return normalizeText(String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, ch => ch.toUpperCase()));
}

// NFC only (prevents mojibake re-decode issues)
function normalizeText(s) {
  if (s == null) return s;
  try { return String(s).normalize("NFC"); } catch { return String(s); }
}

function hasParserError(doc) { return !!doc.querySelector("parsererror"); }
function listUniqueTags(doc, max = 200) {
  const set = new Set();
  const walker = document.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT, null);
  let n = walker.currentNode;
  while (n) { set.add(n.nodeName); if (set.size >= max) break; n = walker.nextNode(); }
  return Array.from(set).sort();
}
function showEmptyState(sectionId, message) {
  const panel = document.getElementById(sectionId);
  if (!panel || panel.querySelector(".empty-state")) return;
  const div = document.createElement("div");
  div.className = "empty-state";
  div.style.cssText = "padding:.75rem 1rem;border:1px dashed var(--border);border-radius:12px;color:var(--muted);background:#fff;";

  div.textContent = message;
  panel.appendChild(div);
}

// --- Finalize UI after both assets are loaded (no export button in UI) ---
let __hasHeadshot = false;
let __hasCV = false;

function maybeFinalizeUI() {
  if (!(__hasHeadshot && __hasCV)) return;
  // Remove upload controls; keep the Download CV link
  document.querySelectorAll('.actions label.btn').forEach(el => el.remove());
}

// ======================= Site configuration =======================
const LINK_LABELS = {
  scholar: "Scholar",
  lattes: "CV Lattes",
  orcid: "ORCID",
  dblp: "DBLP",
  github: "GitHub",
  linkedin: "LinkedIn",
};

window.__siteConfig = window.SITE_CONFIG || {};
const __siteConfigReady = loadSiteConfig();

async function loadSiteConfig() {
  try {
    const response = await fetch("site-config.json", { cache: "no-store" });
    if (!response.ok) return window.__siteConfig || {};
    const config = await response.json();
    window.__siteConfig = config || {};
    return window.__siteConfig;
  } catch (err) {
    if (window.__siteConfig && Object.keys(window.__siteConfig).length) {
      console.warn("[Site config] site-config.json not loaded; using site-config.js fallback.", err);
      return window.__siteConfig;
    }
    console.warn("[Site config] site-config.json not loaded; using XML/default fallbacks.", err);
    return {};
  }
}

function firstValue(...values) {
  return values.find(value => {
    if (Array.isArray(value)) return value.filter(Boolean).length;
    return String(value || "").trim();
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = String(value || "").trim();
  el.textContent = text;
  el.hidden = !text;
}

// Renders the eyebrow as breadcrumb chips.
// Config accepts an array ["Area 1", "Area 2"] or a legacy pipe-separated string.
function renderEyebrow(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  let items = [];
  if (Array.isArray(value)) {
    items = value.map(s => String(s).trim()).filter(Boolean);
  } else if (typeof value === "string" && value.trim()) {
    items = value.split("|").map(s => s.trim()).filter(Boolean);
  }
  if (!items.length) { el.hidden = true; return; }
  el.innerHTML = items
    .map((item, i) =>
      `<span class="eyebrow-item">${item}</span>` +
      (i < items.length - 1 ? `<span class="eyebrow-sep" aria-hidden="true">›</span>` : "")
    )
    .join("");
  el.hidden = false;
}

function setLines(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const lines = Array.isArray(value) ? value.filter(Boolean) : String(value || "").split(/\r?\n/).filter(Boolean);
  el.textContent = "";
  lines.forEach((line, index) => {
    if (index) el.appendChild(document.createElement("br"));
    el.appendChild(document.createTextNode(line));
  });
  el.hidden = !lines.length;
}

function emailsFromText(text) {
  return Array.from(new Set(String(text || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []));
}

function getXmlSiteFallback(xml) {
  if (!xml) return {};
  const general = xml.querySelector("DADOS-GERAIS, dados-gerais");
  const summary = xml.querySelector("RESUMO-CV, resumo-cv");
  const contact = xml.querySelector("ENDERECO, endereco");
  const professional = xml.querySelector("ENDERECO-PROFISSIONAL, endereco-profissional");
  const residential = xml.querySelector("ENDERECO-RESIDENCIAL, endereco-residencial");
  const name = normalizeText(attr(general, "NOME-COMPLETO") || attr(general, "nome-completo"));
  const institutionParts = [
    attr(professional, "NOME-ORGAO") || attr(professional, "nome-orgao"),
    attr(professional, "NOME-INSTITUICAO-EMPRESA") || attr(professional, "nome-instituicao-empresa")
  ].map(normalizeText).filter(Boolean);
  const institution = Array.from(new Set(institutionParts)).join(", ");
  const address = [
    normalizeText(attr(professional, "LOGRADOURO-COMPLEMENTO") || attr(professional, "logradouro-complemento")),
    [attr(professional, "CIDADE") || attr(professional, "cidade"), attr(professional, "UF") || attr(professional, "uf"), attr(professional, "CEP") || attr(professional, "cep")].filter(Boolean).join(" - "),
    attr(professional, "TELEFONE") || attr(professional, "telefone") ? `Phone: ${attr(professional, "DDD") || attr(professional, "ddd")} ${attr(professional, "TELEFONE") || attr(professional, "telefone")}`.trim() : ""
  ].filter(Boolean);
  const emails = Array.from(new Set([
    ...emailsFromText(attr(contact, "ELETRONICO") || attr(contact, "eletronico")),
    ...emailsFromText(attr(professional, "E-MAIL") || attr(professional, "e-mail")),
    ...emailsFromText(attr(residential, "E-MAIL") || attr(residential, "e-mail"))
  ]));
  const lattesId = attr(xml.documentElement, "NUMERO-IDENTIFICADOR") || attr(xml.documentElement, "numero-identificador");
  const orcidId = attr(general, "ORCID-ID") || attr(general, "orcid-id");
  const links = {};
  if (lattesId) links.lattes = `http://lattes.cnpq.br/${lattesId}`;
  if (orcidId) links.orcid = orcidId.startsWith("http") ? orcidId : `https://orcid.org/${orcidId}`;
  return {
    name,
    title: institution ? institution : "",
    institution,
    address,
    description: normalizeText(attr(summary, "TEXTO-RESUMO-CV-RH-EN") || attr(summary, "texto-resumo-cv-rh-en") || attr(summary, "TEXTO-RESUMO-CV-RH") || attr(summary, "texto-resumo-cv-rh")),
    emails,
    links
  };
}

function renderLinks(containerId, links, linkLabels = LINK_LABELS) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.textContent = "";
  Object.entries(links || {}).forEach(([key, href]) => {
    if (!href) return;
    const a = document.createElement("a");
    a.href = href;
    a.target = href.startsWith("mailto:") ? "" : "_blank";
    if (a.target) a.rel = "noopener";
    a.textContent = `[${linkLabels[key] || key}]`;
    a.setAttribute("aria-label", linkLabels[key] || key);
    container.appendChild(a);
  });
  container.hidden = !container.children.length;
}

function renderEmails(emails) {
  const container = document.getElementById("contactLinks");
  if (!container) return;
  container.textContent = "";
  (emails || []).filter(Boolean).forEach(email => {
    const clean = String(email).trim();
    const [localPart, domain] = clean.split("@");
    if (!localPart || !domain) return;
    const span = document.createElement("span");
    span.className = "email-obfuscated";
    span.textContent = `[${localPart} + at + ${domain}]`;
    span.setAttribute("aria-label", "Email address, replace plus at plus with at sign");
    span.title = "Replace + at + with @";
    container.appendChild(span);
  });
  container.hidden = !container.children.length;
}

function configureExternalLink(noteId, linkId, href) {
  const note = document.getElementById(noteId);
  const link = document.getElementById(linkId);
  if (!note || !link) return;
  if (!href) {
    note.hidden = true;
    return;
  }
  link.href = href;
  link.textContent = href.replace(/^https?:\/\//, "");
  note.hidden = false;
}

function renderCuratedPageLinks(curatedPages = {}) {
  const sections = {
    publications: {
      sectionId: "publications",
      beforeSelector: "#pubList",
      defaultText: "Prefer the full curated list? Visit"
    },
    students: {
      sectionId: "students",
      beforeSelector: ".students",
      defaultText: "For the dedicated page, see"
    },
    projects: {
      sectionId: "projects",
      beforeSelector: "#projectsGrid",
      defaultText: "For the dedicated page, see"
    },
    teaching: {
      sectionId: "courses",
      beforeSelector: "#coursesList",
      defaultText: "For the dedicated page, see"
    }
  };

  Object.entries(sections).forEach(([key, target]) => {
    const existing = document.getElementById(`curated-${key}-link-note`);
    if (existing) existing.remove();

    const entry = curatedPages[key] || {};
    const url = typeof entry === "string" ? entry : entry.url;
    if (!url) return;

    const section = document.getElementById(target.sectionId);
    const before = section?.querySelector(target.beforeSelector);
    if (!section || !before) return;

    const note = document.createElement("p");
    note.className = "external-link-note";
    note.id = `curated-${key}-link-note`;
    note.appendChild(document.createTextNode(`${entry.text || target.defaultText} `));

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = entry.label || url.replace(/^https?:\/\//, "");
    note.appendChild(link);
    note.appendChild(document.createTextNode("."));

    before.parentElement.insertBefore(note, before);
  });
}

function applySiteConfig(config = {}, xml = null) {
  const fallback = getXmlSiteFallback(xml);
  const merged = {
    logo: "inf-logo-2.0.jpeg",
    logoAlt: "Institution logo",
    ...fallback,
    ...config,
    links: { ...(fallback.links || {}), ...(config.links || {}) }
  };
  const name = firstValue(merged.name, "Academic Profile");
  const title = firstValue(merged.title, merged.institution, "");
  const description = `${name} - academic website generated from a Lattes XML file.`;

  document.title = `${name} - Academic Website`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);

  renderEyebrow("siteEyebrow", firstValue(merged.eyebrow, "Academic Website"));
  setText("personName", name);
  setText("personTitle", title);
  setLines("personAddress", firstValue(merged.address, []));
  setText("personBio", firstValue(merged.description, merged.bio, ""));
  setText("footerName", name);
  renderEmails(firstValue(merged.emails, []));
  renderLinks("profileLinks", merged.links);
  renderCuratedPageLinks(merged.curatedPages || {});

  const headshot = document.getElementById("headshot");
  if (headshot) {
    if (merged.photo) {
      headshot.src = merged.photo;
      headshot.alt = merged.photoAlt || `Profile photo of ${name}`;
      headshot.hidden = false;
      const markLoaded = () => {
        __hasHeadshot = true;
        maybeFinalizeUI();
      };
      if (headshot.complete && headshot.naturalWidth) markLoaded();
      else headshot.addEventListener("load", markLoaded, { once: true });
    } else {
      headshot.removeAttribute("src");
      headshot.hidden = true;
    }
  }
  const logo = document.getElementById("logo");
  if (logo) {
    if (merged.logo) {
      logo.src = merged.logo;
      logo.alt = merged.logoAlt || `${merged.institution || "Institution"} logo`;
      logo.hidden = false;
    } else {
      logo.removeAttribute("src");
      logo.hidden = true;
    }
  }

  const schema = document.getElementById("personSchema");
  if (schema) {
    const sameAs = Object.values(merged.links || {}).filter(Boolean);
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name,
      affiliation: merged.institution ? { "@type": "CollegeOrUniversity", name: merged.institution } : undefined,
      sameAs
    }, null, 2);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const config = await __siteConfigReady;
  applySiteConfig(config);
});

// ======================= Tabs & deep links =======================
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  document.querySelectorAll(".tab").forEach(t => {
    const active = t === btn;
    t.classList.toggle("active", active);
    t.setAttribute("aria-selected", String(active));
  });
  const target = btn.dataset.target;
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  const panel = document.getElementById(target);
  if (panel) panel.classList.add("active");
  try { history.replaceState(null, "", "#" + target); } catch {}
});

window.addEventListener("DOMContentLoaded", () => {
  const hash = location.hash.replace("#", "");
  const initialTarget = hash || "education";
  const activateInitialTarget = () => document.querySelector('.tab[data-target="'+initialTarget+'"]')?.click();
  activateInitialTarget();
  setTimeout(activateInitialTarget, 120);
  const yr = document.getElementById("year"); if (yr) yr.textContent = new Date().getFullYear();

  const existingHeadshot = document.getElementById("headshot");
  if (existingHeadshot?.getAttribute("src")) {
    const markHeadshotLoaded = () => {
      __hasHeadshot = true;
      maybeFinalizeUI();
    };
    if (existingHeadshot.complete && existingHeadshot.naturalWidth) markHeadshotLoaded();
    else existingHeadshot.addEventListener("load", markHeadshotLoaded, { once: true });
  }

  // Education search
  const eduSearch = document.getElementById("eduSearch");
  const eduList = document.getElementById("eduList");
  if (eduSearch && eduList) {
    eduSearch.addEventListener("input", () => {
      const q = (eduSearch.value || "").toLowerCase();
      const entries = Array.from(eduList.querySelectorAll(".card"));
      entries.forEach(li => { li.style.display = li.textContent.toLowerCase().includes(q) ? "" : "none"; });
    });
  }
});

// ======================= Headshot loader with srcset =======================
document.getElementById("imgInput")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  const imgEl = document.getElementById("headshot"); if (!imgEl) return;
  const blobUrl = URL.createObjectURL(file);
  const img = new Image();
  img.onload = async () => {
    const sizes = [256, 384, 512];
    const urls = [];
    for (const w of sizes) {
      const c = document.createElement("canvas");
      const scale = w / img.width; c.width = w; c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      urls.push(c.toDataURL("image/jpeg", 0.9) + " " + w + "w");
    }
    imgEl.src = urls[0].split(" ")[0];
    imgEl.srcset = urls.join(", ");
    imgEl.sizes = "(max-width: 600px) 128px, 192px";
    imgEl.hidden = false;

    __hasHeadshot = true;
    maybeFinalizeUI();
  };
  img.src = blobUrl;
});

// ======================= XML decoding (UTF-8/1252/8859-1/UTF-16) =======================
async function readFileAsTextWithEncoding(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);

  function startsWith(sig) { if (bytes.length < sig.length) return false; for (let i=0;i<sig.length;i++) if (bytes[i] !== sig[i]) return false; return true; }
  let bom = null;
  if (startsWith([0xEF,0xBB,0xBF])) bom = "utf-8";
  else if (startsWith([0xFF,0xFE])) bom = "utf-16le";
  else if (startsWith([0xFE,0xFF])) bom = "utf-16be";

  let prolog = null;
  try {
    const head = new TextDecoder("utf-8",{fatal:false}).decode(bytes.slice(0,4096));
    const m = head.match(/encoding=["']([^"']+)["']/i); if (m) prolog = m[1].toLowerCase();
  } catch {}

  function norm(l){ if(!l) return null; l=l.toLowerCase();
    if (["utf8","utf-8"].includes(l)) return "utf-8";
    if (["utf16","utf-16"].includes(l)) return "utf-16";
    if (["utf-16le"].includes(l)) return "utf-16le";
    if (["utf-16be"].includes(l)) return "utf-16be";
    if (["latin1","latin-1","iso8859-1","iso-8859-1"].includes(l)) return "iso-8859-1";
    if (["cp1252","windows-1252","win-1252","windows1252"].includes(l)) return "windows-1252";
    return l;
  }
  const preferred = norm(bom) || norm(prolog) || "utf-8";
  const candidates = Array.from(new Set([preferred, "windows-1252", "iso-8859-1", "utf-8"]));

  function score(text) {
    const rep = (text.match(/\uFFFD/g) || []).length;
    const moj = (text.match(/Ã.|Â.|â|â€“|â€”|â€œ|â€/g) || []).length;
    const good = (text.match(/[êéçãõáíóúÊÉÇÃÕÁÍÓÚàÀôÔûÛ]/g) || []).length;
    return rep*10 + moj*5 - good;
  }

  let bestEnc = candidates[0];
  let bestText = new TextDecoder(bestEnc,{fatal:false}).decode(bytes);
  let bestScore = score(bestText);
  for (const enc of candidates.slice(1)) {
    try {
      const text = new TextDecoder(enc,{fatal:false}).decode(bytes);
      const s = score(text);
      if (s < bestScore) { bestText = text; bestScore = s; bestEnc = enc; }
    } catch {}
  }

  console.log(`[XML] encoding selected: ${bestEnc}`);
  return normalizeText(bestText);
}

// ======================= XML input =======================
document.getElementById("xmlInput")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0]; if (!file) return;
  let xmlText = "";
  try { xmlText = await readFileAsTextWithEncoding(file); }
  catch (err) { console.error("[CV XML] read error:", err); alert("Couldn't read XML. Try re-exporting as UTF-8 or share the file."); return; }
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "application/xml");
  if (hasParserError(xml)) { console.error("[CV XML] parsererror:", xml.querySelector("parsererror")?.textContent?.slice(0,500)); alert("XML parse error. See console for details."); return; }
  console.log("[CV XML] Root:", xml.documentElement.nodeName);
  console.log("[CV XML] Unique tags:", listUniqueTags(xml).slice(0,200));
  populateFromXml(xml);
});

// Auto-load the sibling Lattes XML when the page is served from a web server.
window.addEventListener("DOMContentLoaded", async () => {
  if (window.__defaultXmlLoaded) return;
  try {
    await __siteConfigReady;
    const response = await fetch("cv.xml", { cache: "no-store" });
    if (!response.ok) return;
    const xmlText = await readFileAsTextWithEncoding(await response.blob());
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");
    if (hasParserError(xml)) return;
    window.__defaultXmlLoaded = true;
    populateFromXml(xml);
  } catch (err) {
    console.warn("[CV XML] default cv.xml auto-load skipped:", err);
  }
});

// ======================= Helpers =======================
function textOr(el, sel, fallback = "") {
  const node = el.querySelector(sel);
  return (node?.textContent || fallback).trim();
}
function attr(el, name) { return (el?.getAttribute(name) || "").trim(); }

// Lowercase particles that should not be title-cased
const NAME_PARTICLES = new Set(["de","da","do","dos","das","e","van","von","del","della","di","af","of","the"]);

function titleCaseName(s) {
  return s.toLowerCase().split(/\s+/).map((word, i) => {
    if (!word) return word;
    // Keep particles lowercase unless they are the first word
    if (i > 0 && NAME_PARTICLES.has(word)) return word;
    // Uppercase initials like "p." → "P."
    if (/^[a-záéíóúàâêôãõç]\.$/.test(word)) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
}

// Normalize a single author name to "First [Middle] Last" title-case.
// Handles both "First Last" (already correct) and "SURNAME, FIRSTNAME" (Lattes style).
function normalizeAuthorName(raw) {
  const s = (raw || "").trim();
  if (!s) return s;
  const commaIdx = s.indexOf(",");
  if (commaIdx !== -1) {
    const before = s.slice(0, commaIdx).trim();
    // If everything before the comma is uppercase → SURNAME, GIVEN format
    if (before.length > 0 && before === before.toUpperCase() && /[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ]/.test(before)) {
      const given = s.slice(commaIdx + 1).trim();
      return titleCaseName(given + " " + before);
    }
  }
  // Already in natural order — just normalise case
  return titleCaseName(s);
}

function joinAuthors(nodes, up=true) {
  return Array.from(nodes)
    .map(a => normalizeAuthorName(
      attr(a, up ? "NOME-COMPLETO-DO-AUTOR" : "nome-completo-do-autor") ||
      attr(a, up ? "NOME-PARA-CITACAO"      : "nome-para-citacao")
    ))
    .filter(Boolean)
    .join(", ");
}
function pagesFrom(det, up=true) {
  const p = attr(det, up ? "PAGINAS" : "paginas");
  const pi = attr(det, up ? "PAGINA-INICIAL" : "pagina-inicial");
  const pf = attr(det, up ? "PAGINA-FINAL" : "pagina-final");
  if (pi && pf) return `${pi}--${pf}`;
  return p;
}

// ======================= Publications (Journal/Conference/Chapter/Book) =======================
function extractPublications(xml) {
  const pubs = [];

  // Journal (UPPER)
  xml.querySelectorAll("ARTIGOS-PUBLICADOS > ARTIGO-PUBLICADO").forEach(p => {
    const base = p.querySelector("DADOS-BASICOS-DO-ARTIGO");
    const det  = p.querySelector("DETALHAMENTO-DO-ARTIGO");
    pubs.push({
      type: "Journal",
      title: normalizeText(attr(base, "TITULO-DO-ARTIGO")),
      authors: joinAuthors(p.querySelectorAll("AUTORES"), true),
      venue: normalizeText(attr(det, "TITULO-DO-PERIODICO-OU-REVISTA")),
      year: attr(base, "ANO-DO-ARTIGO"),
      doi: attr(base, "DOI"),
      url: attr(base, "DOI") ? `https://doi.org/${attr(base,"DOI")}` : "",
      volume: attr(det, "VOLUME"),
      number: attr(det, "FASCICULO"),
      pages: pagesFrom(det, true),
      original: { title: attr(base, "TITULO-DO-ARTIGO"), venue: attr(det, "TITULO-DO-PERIODICO-OU-REVISTA") }
    });
  });

  // Journal (lower)
  xml.querySelectorAll("artigos-publicados > artigo-publicado").forEach(p => {
    const base = p.querySelector("dados-basicos-do-artigo");
    const det  = p.querySelector("detalhamento-do-artigo");
    pubs.push({
      type: "Journal",
      title: normalizeText(attr(base, "titulo-do-artigo")),
      authors: joinAuthors(p.querySelectorAll("autores"), false),
      venue: normalizeText(attr(det, "titulo-do-periodico-ou-revista")),
      year: attr(base, "ano-do-artigo"),
      doi: attr(base, "doi"),
      url: attr(base, "doi") ? `https://doi.org/${attr(base,"doi")}` : "",
      volume: attr(det, "volume"),
      number: attr(det, "fasciculo"),
      pages: pagesFrom(det, false),
      original: { title: attr(base, "titulo-do-artigo"), venue: attr(det, "titulo-do-periodico-ou-revista") }
    });
  });

  // Conference (UPPER)
  xml.querySelectorAll("TRABALHOS-EM-EVENTOS > TRABALHO-EM-EVENTOS").forEach(p => {
    const base = p.querySelector("DADOS-BASICOS-DO-TRABALHO");
    const det  = p.querySelector("DETALHAMENTO-DO-TRABALHO");
    pubs.push({
      type: "Conference",
      title: normalizeText(attr(base, "TITULO-DO-TRABALHO")),
      authors: joinAuthors(p.querySelectorAll("AUTORES"), true),
      venue: normalizeText(attr(det, "NOME-DO-EVENTO")),
      year: attr(base, "ANO-DO-TRABALHO"),
      doi: attr(base, "DOI"),
      url: "",
      pages: pagesFrom(det, true),
      original: { title: attr(base, "TITULO-DO-TRABALHO"), venue: attr(det, "NOME-DO-EVENTO") }
    });
  });

  // Conference (lower)
  xml.querySelectorAll("trabalhos-em-eventos > trabalho-em-eventos").forEach(p => {
    const base = p.querySelector("dados-basicos-do-trabalho");
    const det  = p.querySelector("detalhamento-do-trabalho");
    pubs.push({
      type: "Conference",
      title: normalizeText(attr(base, "titulo-do-trabalho")),
      authors: joinAuthors(p.querySelectorAll("autores"), false),
      venue: normalizeText(attr(det, "nome-do-evento")),
      year: attr(base, "ano-do-trabalho"),
      doi: attr(base, "doi"),
      url: "",
      pages: pagesFrom(det, false),
      original: { title: attr(base, "titulo-do-trabalho"), venue: attr(det, "nome-do-evento") }
    });
  });

  // Book chapters (UPPER)
  xml.querySelectorAll("CAPITULOS-DE-LIVROS-PUBLICADOS > CAPITULO-DE-LIVRO-PUBLICADO").forEach(n => {
    const base = n.querySelector("DADOS-BASICOS-DO-CAPITULO");
    const det  = n.querySelector("DETALHAMENTO-DO-CAPITULO");
    pubs.push({
      type: "Chapter",
      title: normalizeText(attr(base, "TITULO-DO-CAPITULO-DO-LIVRO")),
      authors: joinAuthors(n.querySelectorAll("AUTORES"), true),
      booktitle: normalizeText(attr(det, "TITULO-DO-LIVRO")),
      editors: normalizeText(attr(det, "ORGANIZADORES")),
      year: attr(base, "ANO"),
      doi: attr(base, "DOI"),
      url: attr(base, "DOI") ? `https://doi.org/${attr(base,"DOI")}` : "",
      isbn: attr(det, "ISBN"),
      publisher: normalizeText(attr(det, "NOME-DA-EDITORA")),
      address: normalizeText(attr(det, "CIDADE-DA-EDITORA")),
      pages: pagesFrom(det, true),
      original: { title: attr(base, "TITULO-DO-CAPITULO-DO-LIVRO"), venue: attr(det, "TITULO-DO-LIVRO"), publisher: attr(det, "NOME-DA-EDITORA") }
    });
  });

  // Book chapters (lower)
  xml.querySelectorAll("capitulos-de-livros-publicados > capitulo-de-livro-publicado").forEach(n => {
    const base = n.querySelector("dados-basicos-do-capitulo");
    const det  = n.querySelector("detalhamento-do-capitulo");
    pubs.push({
      type: "Chapter",
      title: normalizeText(attr(base, "titulo-do-capitulo-do-livro")),
      authors: joinAuthors(n.querySelectorAll("autores"), false),
      booktitle: normalizeText(attr(det, "titulo-do-livro")),
      editors: normalizeText(attr(det, "organizadores")),
      year: attr(base, "ano"),
      doi: attr(base, "doi"),
      url: attr(base, "doi") ? `https://doi.org/${attr(base,"doi")}` : "",
      isbn: attr(det, "isbn"),
      publisher: normalizeText(attr(det, "nome-da-editora")),
      address: normalizeText(attr(det, "cidade-da-editora")),
      pages: pagesFrom(det, false),
      original: { title: attr(base, "titulo-do-capitulo-do-livro"), venue: attr(det, "titulo-do-livro"), publisher: attr(det, "nome-da-editora") }
    });
  });

  // Books (UPPER)
  xml.querySelectorAll("LIVROS-PUBLICADOS-OU-ORGANIZADOS > LIVRO-PUBLICADO-OU-ORGANIZADO").forEach(n => {
    const base = n.querySelector("DADOS-BASICOS-DO-LIVRO");
    const det  = n.querySelector("DETALHAMENTO-DO-LIVRO");
    const natureza = attr(base, "NATUREZA");
    pubs.push({
      type: "Book",
      edited: /ORGANIZACAO/i.test(natureza),
      title: normalizeText(attr(base, "TITULO-DO-LIVRO")),
      authors: joinAuthors(n.querySelectorAll("AUTORES"), true),
      year: attr(base, "ANO"),
      doi: attr(base, "DOI"),
      url: attr(base, "DOI") ? `https://doi.org/${attr(base,"DOI")}` : "",
      isbn: attr(det, "ISBN"),
      pages: attr(det, "NUMERO-DE-PAGINAS"),
      publisher: normalizeText(attr(det, "NOME-DA-EDITORA")),
      address: normalizeText(attr(det, "CIDADE-DA-EDITORA")),
      original: { title: attr(base, "TITULO-DO-LIVRO"), publisher: attr(det, "NOME-DA-EDITORA") }
    });
  });

  // Books (lower)
  xml.querySelectorAll("livros-publicados-ou-organizados > livro-publicado-ou-organizado").forEach(n => {
    const base = n.querySelector("dados-basicos-do-livro");
    const det  = n.querySelector("detalhamento-do-livro");
    const natureza = attr(base, "natureza");
    pubs.push({
      type: "Book",
      edited: /organizacao/i.test(natureza),
      title: normalizeText(attr(base, "titulo-do-livro")),
      authors: joinAuthors(n.querySelectorAll("autores"), false),
      year: attr(base, "ano"),
      doi: attr(base, "doi"),
      url: attr(base, "doi") ? `https://doi.org/${attr(base,"doi")}` : "",
      isbn: attr(det, "isbn"),
      pages: attr(det, "numero-de-paginas"),
      publisher: normalizeText(attr(det, "nome-da-editora")),
      address: normalizeText(attr(det, "cidade-da-editora")),
      original: { title: attr(base, "titulo-do-livro"), publisher: attr(det, "nome-da-editora") }
    });
  });

  pubs.sort((a,b) => (parseInt(b.year)||0) - (parseInt(a.year)||0));
  return pubs;
}

// ======================= Activities =======================
function extractActivities(xml) {
  const items = [];
  function push(listSel, baseSel, detSel, label) {
    xml.querySelectorAll(listSel).forEach(list => {
      list.querySelectorAll(detSel).forEach(det => {
        const base = det.parentElement.querySelector(baseSel);
        const year = attr(base, "ANO") || attr(base, "ano");
        const title = normalizeText(attr(base, "TITULO") || attr(base, "titulo"));
        const inst = normalizeText(attr(det, "NOME-INSTITUICAO") || attr(det, "NOME-DA-INSTITUICAO") || attr(det, "nome-instituicao") || attr(det, "nome-da-instituicao"));
        const candidate = normalizeAuthorName(
          attr(det, "NOME-DO-CANDIDATO") || attr(det, "nome-do-candidato")
        );
        items.push({
          type: label,
          title: translatePtToEn(title),
          candidate,
          category: inst ? `Committee/Examiner · ${inst}` : "Committee/Examiner",
          date: year,
          link: ""
        });
      });
    });
  }
  // UPPER
  push("PARTICIPACAO-EM-BANCA-DE-MESTRADO","DADOS-BASICOS-DA-PARTICIPACAO-EM-BANCA-DE-MESTRADO","DETALHAMENTO-DA-PARTICIPACAO-EM-BANCA-DE-MESTRADO","Master's thesis committee");
  push("PARTICIPACAO-EM-BANCA-DE-DOUTORADO","DADOS-BASICOS-DA-PARTICIPACAO-EM-BANCA-DE-DOUTORADO","DETALHAMENTO-DA-PARTICIPACAO-EM-BANCA-DE-DOUTORADO","PhD thesis committee");
  push("PARTICIPACAO-EM-BANCA-DE-EXAME-QUALIFICACAO","DADOS-BASICOS-DA-PARTICIPACAO-EM-BANCA-DE-EXAME-QUALIFICACAO","DETALHAMENTO-DA-PARTICIPACAO-EM-BANCA-DE-EXAME-QUALIFICACAO","Qualification exam committee");
  push("BANCA-JULGADORA-PARA-CONCURSO-PUBLICO","DADOS-BASICOS-DA-BANCA-JULGADORA-PARA-CONCURSO-PUBLICO","DETALHAMENTO-DA-BANCA-JULGADORA-PARA-CONCURSO-PUBLICO","Public hiring committee");
  push("BANCA-JULGADORA-PARA-LIVRE-DOCENCIA","DADOS-BASICOS-DA-BANCA-JULGADORA-PARA-LIVRE-DOCENCIA","DETALHAMENTO-DA-BANCA-JULGADORA-PARA-LIVRE-DOCENCIA","Academic promotion committee");
  // lower
  push("participacao-em-banca-de-mestrado","dados-basicos-da-participacao-em-banca-de-mestrado","detalhamento-da-participacao-em-banca-de-mestrado","Master's thesis committee");
  push("participacao-em-banca-de-doutorado","dados-basicos-da-participacao-em-banca-de-doutorado","detalhamento-da-participacao-em-banca-de-doutorado","PhD thesis committee");
  push("participacao-em-banca-de-exame-qualificacao","dados-basicos-da-participacao-em-banca-de-exame-qualificacao","detalhamento-da-participacao-em-banca-de-exame-qualificacao","Qualification exam committee");
  push("banca-julgadora-para-concurso-publico","dados-basicos-da-banca-julgadora-para-concurso-publico","detalhamento-da-banca-julgadora-para-concurso-publico","Public hiring committee");
  push("banca-julgadora-para-livre-docencia","dados-basicos-da-banca-julgadora-para-livre-docencia","detalhamento-da-banca-julgadora-para-livre-docencia","Academic promotion committee");
  return items;
}

// ======================= Education =======================
function extractEducation(xml) {
  const items = [];

  function pushEducation(sel, up, degree) {
    xml.querySelectorAll(sel).forEach(n => {
      const start = attr(n, up ? "ANO-DE-INICIO" : "ano-de-inicio");
      const end = attr(n, up ? "ANO-DE-CONCLUSAO" : "ano-de-conclusao") || attr(n, up ? "ANO-DE-OBTENCAO-DO-TITULO" : "ano-de-obtencao-do-titulo");
      const institution = normalizeText(attr(n, up ? "NOME-INSTITUICAO" : "nome-instituicao"));
      const course = normalizeText(attr(n, up ? "NOME-CURSO-INGLES" : "nome-curso-ingles") || attr(n, up ? "NOME-CURSO" : "nome-curso"));
      const workTitle = normalizeText(attr(n, up ? "TITULO-DA-DISSERTACAO-TESE" : "titulo-da-dissertacao-tese") || attr(n, up ? "TITULO-DO-TRABALHO-DE-CONCLUSAO-DE-CURSO" : "titulo-do-trabalho-de-conclusao-de-curso") || attr(n, up ? "TITULO-DO-TRABALHO" : "titulo-do-trabalho"));
      const advisor = normalizeText(attr(n, up ? "NOME-COMPLETO-DO-ORIENTADOR" : "nome-completo-do-orientador") || attr(n, up ? "NOME-DO-ORIENTADOR" : "nome-do-orientador") || attr(n, up ? "NOME-ORIENTADOR-DOUT" : "nome-orientador-dout") || attr(n, up ? "NOME-ORIENTADOR-GRAD" : "nome-orientador-grad"));
      items.push({
        degree,
        period: [start, end].filter(Boolean).join(" - "),
        institution,
        course,
        workTitle,
        advisor,
        sortYear: parseInt(end || start, 10) || 0
      });
    });
  }

  pushEducation("FORMACAO-ACADEMICA-TITULACAO > POS-DOUTORADO", true, "Sabbatical/Postdoctoral leave");
  pushEducation("formacao-academica-titulacao > pos-doutorado", false, "Sabbatical/Postdoctoral leave");
  pushEducation("FORMACAO-ACADEMICA-TITULACAO > DOUTORADO", true, "Ph.D.");
  pushEducation("formacao-academica-titulacao > doutorado", false, "Ph.D.");
  pushEducation("FORMACAO-ACADEMICA-TITULACAO > MESTRADO", true, "M.Sc.");
  pushEducation("formacao-academica-titulacao > mestrado", false, "M.Sc.");
  pushEducation("FORMACAO-ACADEMICA-TITULACAO > GRADUACAO", true, "B.Sc.");
  pushEducation("formacao-academica-titulacao > graduacao", false, "B.Sc.");

  items.sort((a, b) => b.sortYear - a.sortYear);
  return items;
}

// ======================= Appointments / Professional Career =======================
function extractAppointments(xml) {
  const items = [];

  function periodFrom(v, up) {
    const mi = attr(v, up ? "MES-INICIO" : "mes-inicio");
    const yi = attr(v, up ? "ANO-INICIO" : "ano-inicio");
    const mf = attr(v, up ? "MES-FIM" : "mes-fim");
    const yf = attr(v, up ? "ANO-FIM" : "ano-fim");
    const start = [mi, yi].filter(Boolean).join("/");
    const end = [mf, yf].filter(Boolean).join("/");
    if (start && end) return `${start} - ${end}`;
    if (start) return `${start} - present`;
    return end;
  }

  function appointmentCategory(role, institution, notes) {
    const text = [role, institution, notes].join(" ").toLowerCase();
    if (/revisor|editor|editorial|journal|transactions|computer graphics forum|visual computer|computers|signal, image|psychology/.test(text)) {
      return "Editorial & Reviewing";
    }
    if (/fomento|comit|assessor|cnpq|fapergs|conselho nacional|amparo a pesquisa/.test(text)) {
      return "Advisory & Funding";
    }
    if (/apple|micron|digital equipment|orcus|processamento de dados|programador|engenheiro|estagiario|estagiário/.test(text)) {
      return "Industry Experience";
    }
    return "Academic Appointments";
  }

  function pushAppointments(sel, vincSel, up) {
    xml.querySelectorAll(sel).forEach(org => {
      const institution = normalizeText(attr(org, up ? "NOME-INSTITUICAO" : "nome-instituicao"));
      const importance = parseInt(attr(org, up ? "SEQUENCIA-IMPORTANCIA" : "sequencia-importancia"), 10) || 999;
      org.querySelectorAll(vincSel).forEach(v => {
        const customRole = normalizeText(attr(v, up ? "OUTRO-ENQUADRAMENTO-FUNCIONAL-INFORMADO" : "outro-enquadramento-funcional-informado"));
        const customLink = normalizeText(attr(v, up ? "OUTRO-VINCULO-INFORMADO" : "outro-vinculo-informado"));
        const roleCode = attr(v, up ? "ENQUADRAMENTO-FUNCIONAL" : "enquadramento-funcional");
        const role = translateProfessionalRole(customRole || customLink || roleCode || labelFromCode(roleCode) || "Professional activity");
        const notes = normalizeText(attr(v, up ? "OUTRAS-INFORMACOES" : "outras-informacoes"));
        const startYear = parseInt(attr(v, up ? "ANO-INICIO" : "ano-inicio"), 10) || 0;
        const endYear = parseInt(attr(v, up ? "ANO-FIM" : "ano-fim"), 10) || 0;
        const current = !!startYear && !endYear;
        items.push({
          institution,
          role,
          period: periodFrom(v, up),
          startYear,
          endYear,
          current,
          importance,
          workload: attr(v, up ? "CARGA-HORARIA-SEMANAL" : "carga-horaria-semanal"),
          exclusive: attr(v, up ? "FLAG-DEDICACAO-EXCLUSIVA" : "flag-dedicacao-exclusiva"),
          notes,
          category: appointmentCategory(role, institution, notes)
        });
      });
    });
  }

  pushAppointments("ATUACOES-PROFISSIONAIS > ATUACAO-PROFISSIONAL", "VINCULOS", true);
  pushAppointments("atuacoes-profissionais > atuacao-profissional", "vinculos", false);

  items.sort((a, b) =>
    Number(b.current) - Number(a.current) ||
    (b.endYear || b.startYear) - (a.endYear || a.startYear) ||
    a.importance - b.importance ||
    a.institution.localeCompare(b.institution)
  );

  return items;
}

// ======================= Projects =======================
function extractProjects(xml) {
  const items = [];
  // Generic
  xml.querySelectorAll("projects > project").forEach((n) => {
    items.push({
      title: textOr(n, "title"),
      summary: textOr(n, "summary"),
      keywords: textOr(n, "keywords"),
      role: translateRole(textOr(n, "role")),
      collaborators: textOr(n, "collaborators"),
      link: textOr(n, "url"),
      timeline: normalizeMonthYear(textOr(n, "timeline")),
      startYear: parseInt(String(textOr(n, "timeline")).match(/\d{4}/)?.[0] || "0", 10),
      endYear: parseInt(String(textOr(n, "timeline")).match(/\d{4}/g)?.slice(-1)[0] || "0", 10),
      active: /true|yes|ongoing/i.test(textOr(n, "active"))
    });
  });
  // Lattes UPPER + lower
  function pushProj(sel, up) {
    xml.querySelectorAll(sel).forEach(p => {
      const title = normalizeText(attr(p, up ? "NOME-DO-PROJETO" : "nome-do-projeto") || attr(p, up ? "NOME-DO-PROJETO-INGLES" : "nome-do-projeto-ingles"));
      const y0 = attr(p, up ? "ANO-INICIO" : "ano-inicio");
      const y1 = attr(p, up ? "ANO-FIM" : "ano-fim");
      const situ = attr(p, up ? "SITUACAO" : "situacao");
      const active = /EM_ANDAMENTO|em_andamento/i.test(situ);
      const collaborators = Array.from(p.querySelectorAll(up ? "INTEGRANTES-DO-PROJETO" : "integrantes-do-projeto"))
        .map(m => normalizeText(attr(m, up ? "NOME-COMPLETO" : "nome-completo") || attr(m, up ? "NOME-PARA-CITACAO" : "nome-para-citacao")))
        .filter(Boolean).join(", ");
      const funders = Array.from(p.querySelectorAll(up ? "FINANCIADOR-DO-PROJETO" : "financiador-do-projeto"))
        .map(f => normalizeText(attr(f, up ? "NOME-INSTITUICAO" : "nome-instituicao"))).filter(Boolean);
      items.push({
        title, summary: "", keywords: funders.join(", "), role: "", collaborators,
        link: "", timeline: [y0, y1].filter(Boolean).join("–"), active,
        startYear: parseInt(y0, 10) || 0,
        endYear: parseInt(y1, 10) || 0
      });
    });
  }
  pushProj("PROJETO-DE-PESQUISA", true);
  pushProj("projeto-de-pesquisa", false);

  items.sort((a,b)=> (b.startYear || 0) - (a.startYear || 0) || Number(b.active) - Number(a.active) || (b.endYear || 0) - (a.endYear || 0));
  return items;
}

// ======================= Students =======================
function extractStudents(xml) {
  const ongoing = [], completed = [];
  // Generic
  xml.querySelectorAll("students > student").forEach((n) => {
    const item = {
      name: textOr(n, "name"),
      level: translateRole(textOr(n, "level")),
      topic: textOr(n, "topic"),
      status: textOr(n, "status"),
      date: normalizeMonthYear(textOr(n, "date")),
      coadvisors: textOr(n, "coadvisors"),
      link: textOr(n, "url")
    };
    (/completed|defense|graduated|conclu|defesa/i.test(item.status) ? completed : ongoing).push(item);
  });
  function push(listSel, detSel, baseSel, level) {
    xml.querySelectorAll(listSel).forEach(list => {
      list.querySelectorAll(detSel).forEach(det => {
        const base = det.parentElement.querySelector(baseSel);
        completed.push({
          name: normalizeText(attr(det, "NOME-DO-ORIENTADO") || attr(det, "nome-do-orientado")),
          level,
          topic: normalizeText(attr(base, "TITULO") || attr(base, "titulo")),
          status: "Completed",
          date: attr(base, "ANO") || attr(base, "ano"),
          coadvisors: "",
          link: ""
        });
      });
    });
  }
  // Concluded Master's / PhD (UPPER + lower)
  push("ORIENTACOES-CONCLUIDAS-PARA-MESTRADO","DETALHAMENTO-DE-ORIENTACOES-CONCLUIDAS-PARA-MESTRADO","DADOS-BASICOS-DE-ORIENTACOES-CONCLUIDAS-PARA-MESTRADO","Master's");
  push("orientacoes-concluidas-para-mestrado","detalhamento-de-orientacoes-concluidas-para-mestrado","dados-basicos-de-orientacoes-concluidas-para-mestrado","Master's");
  push("ORIENTACOES-CONCLUIDAS-PARA-DOUTORADO","DETALHAMENTO-DE-ORIENTACOES-CONCLUIDAS-PARA-DOUTORADO","DADOS-BASICOS-DE-ORIENTACOES-CONCLUIDAS-PARA-DOUTORADO","PhD");
  push("orientacoes-concluidas-para-doutorado","detalhamento-de-orientacoes-concluidas-para-doutorado","dados-basicos-de-orientacoes-concluidas-para-doutorado","PhD");

  // Ongoing advising — all types (PhD, Master's, Undergraduate, Other)
  function pushOngoing(sel, baseSel, detSel, level) {
    xml.querySelectorAll(`${sel}, ${sel.toLowerCase()}`).forEach(entry => {
      const base = entry.querySelector(`${baseSel}, ${baseSel.toLowerCase()}`);
      const det  = entry.querySelector(`${detSel}, ${detSel.toLowerCase()}`);
      if (!det) return;
      const natureza = attr(base, "NATUREZA") || attr(base, "natureza") || "";
      const resolvedLevel = level || (
        /doutorado/i.test(natureza) ? "PhD" :
        /mestrado/i.test(natureza)  ? "Master's" :
        /graduacao/i.test(natureza) ? "Undergraduate" : "Other"
      );
      const role = attr(det, "TIPO-DE-ORIENTACAO") || attr(det, "tipo-de-orientacao") || "";
      const coadvisors = /CO_ORIENTADOR/i.test(role) ? "(Co-advisor)" : "";
      ongoing.push({
        name:       normalizeAuthorName(attr(det, "NOME-DO-ORIENTANDO") || attr(det, "nome-do-orientando")),
        level:      resolvedLevel,
        topic:      normalizeText(attr(base, "TITULO-DO-TRABALHO") || attr(base, "TITULO") || attr(base, "titulo-do-trabalho") || attr(base, "titulo")),
        status:     "Ongoing",
        date:       attr(base, "ANO") || attr(base, "ano"),
        coadvisors,
        link:       ""
      });
    });
  }

  pushOngoing("ORIENTACAO-EM-ANDAMENTO-DE-DOUTORADO",   "DADOS-BASICOS-DA-ORIENTACAO-EM-ANDAMENTO-DE-DOUTORADO",   "DETALHAMENTO-DA-ORIENTACAO-EM-ANDAMENTO-DE-DOUTORADO",   "PhD");
  pushOngoing("ORIENTACAO-EM-ANDAMENTO-DE-MESTRADO",    "DADOS-BASICOS-DA-ORIENTACAO-EM-ANDAMENTO-DE-MESTRADO",    "DETALHAMENTO-DA-ORIENTACAO-EM-ANDAMENTO-DE-MESTRADO",    "Master's");
  pushOngoing("ORIENTACAO-EM-ANDAMENTO-DE-GRADUACAO",   "DADOS-BASICOS-DA-ORIENTACAO-EM-ANDAMENTO-DE-GRADUACAO",   "DETALHAMENTO-DA-ORIENTACAO-EM-ANDAMENTO-DE-GRADUACAO",   "Undergraduate");
  pushOngoing("OUTRAS-ORIENTACOES-EM-ANDAMENTO",        "DADOS-BASICOS-DE-OUTRAS-ORIENTACOES-EM-ANDAMENTO",        "DETALHAMENTO-DE-OUTRAS-ORIENTACOES-EM-ANDAMENTO",        "");

  // Other concluded (UG/Specialization)
  xml.querySelectorAll("OUTRAS-ORIENTACOES-CONCLUIDAS, outras-orientacoes-concluidas").forEach(list => {
    list.querySelectorAll("DETALHAMENTO-DE-OUTRAS-ORIENTACOES-CONCLUIDAS, detalhamento-de-outras-orientacoes-concluidas").forEach(det => {
      const base = det.parentElement.querySelector("DADOS-BASICOS-DE-OUTRAS-ORIENTACOES-CONCLUIDAS, dados-basicos-de-outras-orientacoes-concluidas");
      const natureza = (attr(base, "NATUREZA") || attr(base, "natureza") || "").toUpperCase();
      const level = natureza.includes("GRADUACAO") ? "Undergraduate" : (natureza.includes("APERFEICOAMENTO") || natureza.includes("ESPECIALIZACAO") ? "Specialization" : "Other");
      completed.push({
        name: normalizeText(attr(det, "NOME-DO-ORIENTADO") || attr(det, "nome-do-orientado")),
        level,
        topic: normalizeText(attr(base, "TITULO") || attr(base, "titulo")),
        status: "Completed",
        date: attr(base, "ANO") || attr(base, "ano"),
        coadvisors: "",
        link: ""
      });
    });
  });

  completed.sort((a, b) => dateRank(b.date) - dateRank(a.date));

  return { ongoing, completed };
}

// ======================= BibTeX =======================
function toBibTeXKey(title, authors, year) {
  const a = (authors || "").split(/[,;]|\sand\s/i)[0] || "";
  const last = a.split(" ").filter(Boolean).pop() || "key";
  const short = (title || "").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().split(" ").slice(0,5).join("");
  return (last + (year||"") + short).replace(/[^A-Za-z0-9]/g,"").toLowerCase() || "key";
}
function bibtexFor(p) {
  const esc = s => (s||"").replace(/[{}`]/g, "\\$&");
  const pages = p.pages ? `\n  pages = {${esc(p.pages)}},` : "";
  const doi   = p.doi   ? `\n  doi = {${esc(p.doi)}},` : "";
  const url   = p.url   ? `\n  url = {${esc(p.url)}},` : "";
  const year  = p.year  ? `\n  year = {${esc(p.year)}},` : "";
  const key = toBibTeXKey(p.title, p.authors, p.year);

  if (p.type === "Journal") {
    const journal = p.venue ? `\n  journal = {${esc(p.venue)}},` : "";
    const vol = p.volume ? `\n  volume = {${esc(p.volume)}},` : "";
    const num = p.number ? `\n  number = {${esc(p.number)}},` : "";
    return `@article{${key},
  author = {${esc(p.authors)}},
  title = {${esc(p.title)}},${journal}${vol}${num}${pages}${year}${doi}${url}
}`;
  }
  if (p.type === "Conference") {
    const booktitle = p.venue ? `\n  booktitle = {${esc(p.venue)}},` : "";
    return `@inproceedings{${key},
  author = {${esc(p.authors)}},
  title = {${esc(p.title)}},${booktitle}${pages}${year}${doi}${url}
}`;
  }
  if (p.type === "Chapter") {
    const bt = p.booktitle ? `\n  booktitle = {${esc(p.booktitle)}},` : "";
    const ed = p.editors ? `\n  editor = {${esc(p.editors)}},` : "";
    const pub = p.publisher ? `\n  publisher = {${esc(p.publisher)}},` : "";
    const addr = p.address ? `\n  address = {${esc(p.address)}},` : "";
    const isbn = p.isbn ? `\n  isbn = {${esc(p.isbn)}},` : "";
    return `@incollection{${key},
  author = {${esc(p.authors)}},
  title = {${esc(p.title)}},${bt}${ed}${pub}${addr}${isbn}${pages}${year}${doi}${url}
}`;
  }
  if (p.type === "Book") {
    const pub = p.publisher ? `\n  publisher = {${esc(p.publisher)}},` : "";
    const addr = p.address ? `\n  address = {${esc(p.address)}},` : "";
    const isbn = p.isbn ? `\n  isbn = {${esc(p.isbn)}},` : "";
    const pages2 = p.pages ? `\n  pages = {${esc(p.pages)}},` : "";
    return `@book{${key},
  author = {${esc(p.authors)}},
  title = {${esc(p.title)}},${pub}${addr}${isbn}${pages2}${year}${doi}${url}
}`;
  }
  return `@misc{${key},
  author = {${esc(p.authors)}},
  title = {${esc(p.title)}},${year}${doi}${url}
}`;
}

// ======================= Populate UI =======================
function populateFromXml(xml) {
  applySiteConfig(window.__siteConfig || {}, xml);

  // Education
  const education = extractEducation(xml);
  const eduList = document.getElementById("eduList");
  if (eduList && education.length) {
    eduList.innerHTML = "";
    education.forEach(e => {
      const li = document.createElement("li");
      li.className = "card";
      li.innerHTML = `<strong>${e.period || ""}</strong> · ${e.institution || ""} — <em>${e.degree}${e.course ? ` in ${e.course}` : ""}</em>`
        + (e.workTitle ? `<br><span class="education-detail"><strong>Title:</strong> <span class="education-title">${e.workTitle}</span></span>` : "")
        + (e.advisor ? `<br><span class="education-detail"><strong>Advisor:</strong> ${e.advisor}</span>` : "");
      eduList.appendChild(li);
    });
  }

  // Publications
  const pubs = extractPublications(xml).map(p => ({
    ...p,
    title: translatePtToEn(p.title),
    venue: translatePtToEn(p.venue || p.booktitle || ""),
    authors: translatePtToEn(p.authors),
  }));

  // Filters
  const pubYears = new Set(pubs.map(p => p.year).filter(Boolean));
  const yearSel = document.getElementById("pubYearFilter");
  if (yearSel) yearSel.innerHTML = '<option value="">All years</option>' + [...pubYears].sort((a,b)=>b.localeCompare(a)).map(y => `<option>${y}</option>`).join("");
  const pubList = document.getElementById("pubList");

  function renderPubs() {
    const q = (document.getElementById("pubSearch")?.value || "").toLowerCase();
    const y = document.getElementById("pubYearFilter")?.value || "";
    const t = document.getElementById("pubTypeFilter")?.value || "";
    if (pubList) pubList.innerHTML = "";
    pubs.filter(p => (!y || p.year === y) && (!t || p.type === t))
        .filter(p => [p.title, p.authors, p.venue, p.booktitle].join(" ").toLowerCase().includes(q))
        .forEach((p, idx) => {
          const li = document.createElement("li");
          li.className = "card";
          li.setAttribute("data-original-pt", JSON.stringify(p.original || {}));
          const venue = p.venue || p.booktitle || "";
          const vhtml = venue ? ' <em>'+venue+'</em>' : '';
          const link = p.doi ? `<a href="https://doi.org/${p.doi}" target="_blank" rel="noopener">${p.doi}</a>` : (p.url ? `<a href="${p.url}" target="_blank" rel="noopener">link</a>` : '');
          const badges = `<span class="badge badge-warm">${p.type}</span>` + (p.edited ? ' <span class="badge">Edited</span>' : '');
          li.innerHTML = ''
            + `<div class="badges" style="margin-bottom:.5rem">${badges}</div>`
            + `<div><strong>${p.authors}</strong>. <span class="title">${p.title}</span>.${vhtml}${p.year ? ', '+p.year : ''}. ${link}</div>`
            + `<div style="margin-top:.4rem"><button class="btn secondary" data-bib="${idx}">BibTeX</button></div>`
            + `<pre id="bib-${idx}" style="display:none;margin-top:.4rem;overflow:auto"></pre>`;
          pubList.appendChild(li);
        });
    if (pubs.length === 0) showEmptyState("publications", "No publications parsed from XML.");
  }
  renderPubs();
  document.getElementById("pubSearch")?.addEventListener("input", renderPubs);
  document.getElementById("pubYearFilter")?.addEventListener("change", renderPubs);
  document.getElementById("pubTypeFilter")?.addEventListener("change", renderPubs);

  document.getElementById("pubList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-bib]"); if (!btn) return;
    const idx = +btn.getAttribute("data-bib");
    const pre = document.getElementById("bib-"+idx);
    if (pre && !pre.dataset.populated) { pre.textContent = bibtexFor(pubs[idx]); pre.dataset.populated = "true"; }
    if (pre) pre.style.display = pre.style.display === "none" ? "block" : "none";
  });

  // Professional Activities
  const appointments = extractAppointments(xml);
  const acts = extractActivities(xml);
  const actC = document.getElementById("activities");
  let activeProfessionalCategory = "";
  let activeCommitteeType = "";

  function renderActs() {
    const q = (document.getElementById("actSearch")?.value || "").toLowerCase();
    if (actC) actC.innerHTML = "";

    const appointmentOrder = ["Academic Appointments", "Editorial & Reviewing", "Advisory & Funding", "Industry Experience"];
    const filteredAppointments = appointments.filter(a => [a.category, a.institution, a.role, a.period, a.notes].join(" ").toLowerCase().includes(q));
    const appointmentGroups = new Map(appointmentOrder.map(name => [name, []]));
    filteredAppointments.forEach(a => {
      const category = a.category || "Other Activities";
      if (!appointmentGroups.has(category)) appointmentGroups.set(category, []);
      appointmentGroups.get(category).push(a);
    });

    const filteredCommittees = acts.filter(a => [a.type, a.title, a.category, a.date].join(" ").toLowerCase().includes(q));
    const committeeGroups = new Map();
    filteredCommittees.forEach(a => {
      const type = a.type || "Other committee";
      if (!committeeGroups.has(type)) committeeGroups.set(type, []);
      committeeGroups.get(type).push(a);
    });

    const secondLevel = Array.from(appointmentGroups.entries())
      .filter(([, items]) => items.length)
      .map(([name, items]) => ({ name, count: items.length, kind: "appointment" }));
    if (filteredCommittees.length) secondLevel.push({ name: "Committees", count: filteredCommittees.length, kind: "committees" });

    if (!activeProfessionalCategory || !secondLevel.some(item => item.name === activeProfessionalCategory)) {
      activeProfessionalCategory = secondLevel[0]?.name || "";
    }

    const secondNav = document.createElement("div");
    secondNav.className = "subtabs professional-subtabs";
    secondNav.setAttribute("role", "tablist");
    secondLevel.forEach(item => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "subtab" + (item.name === activeProfessionalCategory ? " active" : "");
      btn.setAttribute("aria-selected", item.name === activeProfessionalCategory ? "true" : "false");
      btn.textContent = `${item.name} (${item.count})`;
      btn.addEventListener("click", () => {
        activeProfessionalCategory = item.name;
        renderActs();
      });
      secondNav.appendChild(btn);
    });
    if (secondLevel.length) actC.appendChild(secondNav);

    if (activeProfessionalCategory === "Committees") {
      const committeeTypes = Array.from(committeeGroups.entries()).filter(([, items]) => items.length);
      if (!activeCommitteeType || !committeeTypes.some(([type]) => type === activeCommitteeType)) {
        activeCommitteeType = committeeTypes[0]?.[0] || "";
      }
      const thirdNav = document.createElement("div");
      thirdNav.className = "subtabs subtab-level-3 committee-subtabs";
      thirdNav.setAttribute("role", "tablist");
      committeeTypes.forEach(([type, items]) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "subtab tertiary" + (type === activeCommitteeType ? " active" : "");
        btn.setAttribute("aria-selected", type === activeCommitteeType ? "true" : "false");
        btn.textContent = `${type} (${items.length})`;
        btn.addEventListener("click", () => {
          activeCommitteeType = type;
          renderActs();
        });
        thirdNav.appendChild(btn);
      });
      if (committeeTypes.length) actC.appendChild(thirdNav);

      const items = (committeeGroups.get(activeCommitteeType) || []);
      items.sort((a, b) => (parseInt(b.date, 10) || 0) - (parseInt(a.date, 10) || 0));
      const list = document.createElement("div");
      list.className = "stack activity-list";
      items.forEach(a => {
        const div = document.createElement("div"); div.className = "card appointment-card";
        div.innerHTML =
          `<div><strong class="appointment-title">${a.title}</strong>${a.date ? ` <span class="appointment-period">${a.date}</span>` : ''}</div>`
          + (a.candidate ? `<div class="appointment-institution">${a.candidate}</div>` : '')
          + `<div class="appointment-institution" style="font-weight:500;color:var(--muted)">${a.category || ''}</div>`
          + (a.link ? `<div style="margin-top:6px"><a href="${a.link}" target="_blank" rel="noopener">link</a></div>` : '');
        list.appendChild(div);
      });
      actC.appendChild(list);
    } else {
      const items = (appointmentGroups.get(activeProfessionalCategory) || []);
      const list = document.createElement("div");
      list.className = "stack";
      items.forEach(a => {
        const div = document.createElement("div");
        div.className = "card appointment-card";
        const badges = [
          a.current ? "Current" : "Previous",
          a.workload ? `${a.workload}h/week` : "",
          /SIM/i.test(a.exclusive || "") ? "Exclusive dedication" : ""
        ].filter(Boolean);
        div.innerHTML = `<div><strong class="appointment-title">${a.role}</strong>${a.period ? ` <span class="appointment-period">${a.period}</span>` : ""}</div>`
          + `<div class="appointment-institution">${a.institution || ""}</div>`
          + (a.notes ? `<p>${a.notes}</p>` : "")
          + (badges.length ? `<div class="badges">${badges.map(t => `<span class="badge">${t}</span>`).join("")}</div>` : "");
        list.appendChild(div);
      });
      actC.appendChild(list);
    }

    if (!appointments.length && !acts.length) showEmptyState("professional-activities", "No professional activities found.");
    else if (!secondLevel.length) showEmptyState("professional-activities", "No professional activities match your search.");
  }
  renderActs();
  document.getElementById("actSearch")?.addEventListener("input", renderActs);

  // Projects
  const projs = extractProjects(xml);
  const grid = document.getElementById("projectsGrid");
  function renderProjs() {
    const q = (document.getElementById("projSearch")?.value || "").toLowerCase();
    if (grid) grid.innerHTML = "";
    projs.filter(p => [p.title, p.summary, p.keywords].join(" ").toLowerCase().includes(q)).forEach(p => {
      const card = document.createElement("div"); card.className = "card";
      card.innerHTML = `<h3 style="margin:.1rem 0">${p.title}${p.active ? ' <span class="badge">Active</span>' : ''}</h3>`
        + `<p>${p.summary || ''}</p>`
        + `<p><small>${p.keywords || ''}</small></p>`
        + `<p><small>${p.role || ''}${p.collaborators ? ' · '+p.collaborators : ''}${p.timeline ? ' · '+p.timeline : ''}</small></p>`
        + (p.link ? `<p><a href="${p.link}" target="_blank" rel="noopener">Repo/Demo</a></p>` : '');
      grid.appendChild(card);
    });
    if (projs.length === 0) showEmptyState("projects", "No projects found.");
  }
  renderProjs();
  document.getElementById("projSearch")?.addEventListener("input", renderProjs);

  // Students
  const st = extractStudents(xml);
  const ulO = document.getElementById("studentsOngoing");
  const ulC = document.getElementById("studentsCompleted");
  function findStudentPubs(s) {
    if (!s.name) return [];
    const particles = new Set(["de","da","do","dos","das","van","von","del","di","af","of"]);

    // Extract (firstName, lastName) pairs — handles combined names like "Ana Silva e João Costa"
    function personTokens(fullName) {
      // Split on " e " or ";" to get individual people
      return fullName.split(/\s+e\s+|;/).map(part => {
        const tokens = part.trim().toLowerCase().split(/\s+/).filter(t => t.length > 0 && !particles.has(t));
        if (tokens.length < 2) return null;
        return { first: tokens[0], last: tokens[tokens.length - 1] };
      }).filter(Boolean);
    }

    const people = personTokens(s.name);
    if (!people.length) return [];

    const startYear  = parseInt(s.date) || 0;
    const isCompleted = s.status === "Completed";

    return pubs.filter(p => {
      // Date range
      const pubYear = parseInt(p.year) || 0;
      if (isCompleted) {
        if (pubYear > startYear || pubYear < startYear - 8) return false;
      } else {
        if (startYear && pubYear < startYear) return false;
      }
      // For each individual person, check if any single author entry matches first+last
      const authorList = (p.authors || "").split(/,\s*/);
      return people.some(({ first, last }) =>
        authorList.some(author => {
          const a = author.toLowerCase();
          return a.includes(first) && a.includes(last);
        })
      );
    });
  }



  function addStudent(ul, s) {
    const li = document.createElement("li"); li.className = "card";
    const configTopics = window.__siteConfig?.studentTopics || {};
    const lookupName = Object.keys(configTopics).find(k => k.trim().toLowerCase() === (s.name || "").trim().toLowerCase());
    const configuredTopic = lookupName ? configTopics[lookupName] : null;
    const rawTopic = (configuredTopic !== null && configuredTopic !== undefined && configuredTopic.trim() !== "")
      ? configuredTopic
      : (s.topic || "");
    const cleanTopic = /^a definir$/i.test((rawTopic || "").trim()) ? "To be defined" : rawTopic;
    const topic = cleanTopic
      ? `<div class="student-topic">${translatePtToEn(cleanTopic)}</div>` : "";
    const meta = [
      s.date ? `<span class="appointment-period">${s.date}</span>` : "",
      s.coadvisors ? `<span class="student-coadvisor">${translatePtToEn(s.coadvisors)}</span>` : "",
      s.link ? `<a href="${s.link}" target="_blank" rel="noopener">link</a>` : ""
    ].filter(Boolean).join(" · ");

    const studentPubs = findStudentPubs(s);
    const pubsHtml = studentPubs.length
      ? `<ul class="student-pubs">${studentPubs.map(p => {
          const venue = p.venue || p.booktitle || "";
          const link = p.doi
            ? ` <a href="https://doi.org/${p.doi}" target="_blank" rel="noopener">DOI</a>`
            : (p.url ? ` <a href="${p.url}" target="_blank" rel="noopener">link</a>` : "");
          return `<li>${p.authors}. <em>${p.title}</em>${venue ? ". " + venue : ""}${p.year ? ", " + p.year : ""}.${link}</li>`;
        }).join("")}</ul>`
      : "";

    li.innerHTML =
      `<strong class="appointment-title">${translatePtToEn(s.name)}</strong>`
      + (meta ? ` <span class="student-meta">${meta}</span>` : "")
      + topic
      + pubsHtml;
    ul.appendChild(li);
  }

  function addStudentGroup(ul, label) {
    const li = document.createElement("li");
    li.className = "student-group-title";
    li.textContent = label;
    ul.appendChild(li);
  }
  function renderStudentList(ul, list, query) {
    if (!ul) return 0;
    const groups = ["PhD", "MSc", "Undergraduate", "Other"];
    const filtered = list.filter(s => [s.name, s.level, s.topic].join(" ").toLowerCase().includes(query));
    groups.forEach(group => {
      const items = filtered.filter(s => studentGroup(s.level) === group);
      if (!items.length) return;
      addStudentGroup(ul, group);
      items.forEach(s => addStudent(ul, s));
    });
    return filtered.length;
  }

  function renderStudents() {
    const q = (document.getElementById("stuSearch")?.value || "").toLowerCase();
    if (ulO) ulO.innerHTML = ""; if (ulC) ulC.innerHTML = "";
    const countO = renderStudentList(ulO, st.ongoing, q);
    const countC = renderStudentList(ulC, st.completed, q);

    const countChipO = document.getElementById("countOngoing");
    const countChipC = document.getElementById("countCompleted");
    const secO = document.getElementById("sectionOngoing");
    const secC = document.getElementById("sectionCompleted");

    if (countChipO) countChipO.textContent = countO;
    if (countChipC) countChipC.textContent = countC;

    if (secO) secO.style.display = countO > 0 ? "block" : "none";
    if (secC) secC.style.display = countC > 0 ? "block" : "none";

    if (countO + countC === 0) showEmptyState("students", "No students found matching your search.");
  }
  renderStudents();
  document.getElementById("stuSearch")?.addEventListener("input", renderStudents);

  // Courses
  const courses = (() => {
    const arr = [];
    xml.querySelectorAll("courses > course").forEach((n) => {
      arr.push({
        title: textOr(n, "title"),
        term: textOr(n, "term"),
        institution: textOr(n, "institution"),
        description: textOr(n, "description"),
        syllabus: textOr(n, "syllabus"),
        tags: textOr(n, "tags")
      });
    });

    function teachingLevel(value) {
      const label = String(value || "").toUpperCase();
      if (label.includes("POS")) return "Graduate";
      if (label.includes("GRADUACAO")) return "Undergraduate";
      return value || "Teaching";
    }

    function teachingPeriod(n) {
      const startMonth = attr(n, "MES-INICIO") || attr(n, "mes-inicio");
      const startYear = attr(n, "ANO-INICIO") || attr(n, "ano-inicio");
      const endMonth = attr(n, "MES-FIM") || attr(n, "mes-fim");
      const endYear = attr(n, "ANO-FIM") || attr(n, "ano-fim");
      const start = [startMonth, startYear].filter(Boolean).join("/");
      const end = [endMonth, endYear].filter(Boolean).join("/");
      if (start && end) return `${start} - ${end}`;
      if (start) return `${start} - present`;
      return end;
    }

    function pushTeaching(sel, discSel, up) {
      xml.querySelectorAll(sel).forEach((n) => {
        const level = teachingLevel(attr(n, up ? "TIPO-ENSINO" : "tipo-ensino"));
        const courseName = normalizeText(attr(n, up ? "NOME-CURSO-INGLES" : "nome-curso-ingles") || attr(n, up ? "NOME-CURSO" : "nome-curso"));
        const status = /ATUAL/i.test(attr(n, up ? "FLAG-PERIODO" : "flag-periodo")) ? "Current" : "Previous";
        const period = teachingPeriod(n);
        n.querySelectorAll(discSel).forEach((d) => {
          const title = normalizeText(d.textContent || "").trim();
          if (!title) return;
          arr.push({
            title,
            term: period,
            institution: courseName,
            description: courseName ? `${level} teaching activity in ${courseName}.` : `${level} teaching activity.`,
            syllabus: "",
            tags: [level, status].filter(Boolean).join(", ")
          });
        });
      });
    }

    pushTeaching("ATIVIDADES-DE-ENSINO > ENSINO", "DISCIPLINA", true);
    pushTeaching("atividades-de-ensino > ensino", "disciplina", false);

    arr.sort((a, b) => {
      const ay = parseInt(String(a.term || "").match(/\d{4}/g)?.slice(-1)[0] || "0", 10);
      const by = parseInt(String(b.term || "").match(/\d{4}/g)?.slice(-1)[0] || "0", 10);
      const ac = /Current/i.test(a.tags || "");
      const bc = /Current/i.test(b.tags || "");
      return Number(bc) - Number(ac) || by - ay || a.title.localeCompare(b.title);
    });

    return arr;
  })().map(c => ({
    ...c,
    title: translatePtToEn(c.title),
    institution: translatePtToEn(c.institution),
    description: translatePtToEn(c.description),
    tags: translatePtToEn(c.tags)
  }));
  const cl = document.getElementById("coursesList");
  let activeCourseLevel = "";
  let activeCourseStatus = "";

  function renderCourses() {
    const q = (document.getElementById("courseSearch")?.value || "").toLowerCase();
    if (cl) cl.innerHTML = "";

    const filtered = courses.filter(c => [c.title,c.term,c.institution,c.description,c.tags].join(" ").toLowerCase().includes(q));
    const levels = ["Graduate", "Undergraduate"];
    const statuses = ["Current", "Previous"];
    const byLevel = new Map(levels.map(level => [level, filtered.filter(c => String(c.tags || "").includes(level))]));
    const availableLevels = Array.from(byLevel.entries()).filter(([, items]) => items.length);
    if (!activeCourseLevel || !availableLevels.some(([level]) => level === activeCourseLevel)) {
      activeCourseLevel = availableLevels[0]?.[0] || "";
    }

    const levelNav = document.createElement("div");
    levelNav.className = "subtabs course-level-tabs";
    levelNav.setAttribute("role", "tablist");
    availableLevels.forEach(([level, items]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "subtab" + (level === activeCourseLevel ? " active" : "");
      btn.setAttribute("aria-selected", level === activeCourseLevel ? "true" : "false");
      btn.textContent = `${level} (${items.length})`;
      btn.addEventListener("click", () => {
        activeCourseLevel = level;
        activeCourseStatus = "";
        renderCourses();
      });
      levelNav.appendChild(btn);
    });
    if (availableLevels.length) cl.appendChild(levelNav);

    const levelItems = byLevel.get(activeCourseLevel) || [];
    const byStatus = new Map(statuses.map(status => [status, levelItems.filter(c => String(c.tags || "").includes(status))]));
    const availableStatuses = Array.from(byStatus.entries()).filter(([, items]) => items.length);
    if (!activeCourseStatus || !availableStatuses.some(([status]) => status === activeCourseStatus)) {
      activeCourseStatus = availableStatuses[0]?.[0] || "";
    }

    const statusNav = document.createElement("div");
    statusNav.className = "subtabs subtab-level-3 course-status-tabs";
    statusNav.setAttribute("role", "tablist");
    availableStatuses.forEach(([status, items]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "subtab tertiary" + (status === activeCourseStatus ? " active" : "");
      btn.setAttribute("aria-selected", status === activeCourseStatus ? "true" : "false");
      btn.textContent = `${status} (${items.length})`;
      btn.addEventListener("click", () => {
        activeCourseStatus = status;
        renderCourses();
      });
      statusNav.appendChild(btn);
    });
    if (availableStatuses.length) cl.appendChild(statusNav);

    const list = document.createElement("div");
    list.className = "stack";
    (byStatus.get(activeCourseStatus) || []).forEach(c => {
      const li = document.createElement("li"); li.className = "card";
      li.innerHTML = `<div><strong>${c.title}</strong> — <small>${c.term || ''}${c.institution ? ' · '+c.institution : ''}</small></div>`
        + (c.description ? `<p>${c.description}</p>` : '')
        + (c.syllabus ? `<a href="${c.syllabus}" target="_blank" rel="noopener">Syllabus</a>` : '')
        + (c.tags ? `<div class="badges">${c.tags.split(",").map(t => `<span class="badge">${t.trim()}</span>`).join("")}</div>` : '');
      list.appendChild(li);
    });
    if (availableStatuses.length) cl.appendChild(list);

    if (courses.length === 0) showEmptyState("courses", "No teaching activities found in <ATIVIDADES-DE-ENSINO>.");
    else if (!filtered.length) showEmptyState("courses", "No teaching activities match your search.");
  }
  renderCourses();
  document.getElementById("courseSearch")?.addEventListener("input", renderCourses);

  __hasCV = true;
  maybeFinalizeUI();
  document.dispatchEvent(new Event("cv:populated"));
}

// ======================= Static Export (manual trigger) =======================
function exportStaticPage() {
  const doc = document.documentElement.cloneNode(true);

  // Remove all external scripts (we'll inject a tiny inline script for tabs)
  doc.querySelectorAll('script').forEach(s => s.remove());

  // Remove upload controls and any export buttons
  doc.querySelectorAll('.actions label.btn, .actions [data-export]').forEach(el => el.remove());

  // Remove favicon link (prevents missing file error)
  doc.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(el => el.remove());

  // Ensure a tab is active (keep current if present)
  var activeId = document.querySelector('.panel.active')?.id;
  if (!activeId) {
    var firstTab = document.querySelector('.tab');
    if (firstTab) { activeId = firstTab.getAttribute('data-target'); }
  }
  // Set classes based on the chosen active tab
  if (activeId) {
    doc.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    var panel = doc.getElementById(activeId);
    if (panel) panel.classList.add('active');
    doc.querySelectorAll('.tab').forEach(t => {
      var on = t.getAttribute('data-target') === activeId;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
  }

  // Inject minimal inline JS to keep tabs working in the static page
  var s = doc.createElement('script');
  s.type = 'text/javascript';
  s.textContent = `(function(){
    function activate(target){
      document.querySelectorAll(".tab").forEach(t=>{
        const on = t.dataset.target===target;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", String(on));
      });
      document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
      const panel = document.getElementById(target);
      if (panel) panel.classList.add("active");
      try{ history.replaceState(null,"","#"+target); }catch{}
    }
    document.addEventListener("click", function(e){
      const btn = e.target.closest(".tab"); if(!btn) return;
      activate(btn.dataset.target);
    });
    window.addEventListener("DOMContentLoaded", function(){
      const hash = location.hash.replace("#","");
      const first = document.querySelector(".tab")?.dataset.target;
      activate(hash || first);
    });
  })();`;
  doc.querySelector('head')?.appendChild(s);

  const html = '<!doctype html>\n' + doc.outerHTML;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'index.final.html';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}





// --- Save Final Page (serialize current DOM to a downloadable HTML) ---
(function(){
  function dataURLFromImage(img) {
    try {
      if (!img) return Promise.resolve("");
      if (img.src && img.src.startsWith('data:')) return Promise.resolve(img.src);
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      if (!w || !h) return Promise.resolve(img.src || '');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return Promise.resolve(canvas.toDataURL('image/png'));
    } catch (e) {
      console.warn('Could not convert image to data URL:', e);
      return Promise.resolve(img && img.src ? img.src : '');
    }
  }

  async function inlineStylesheetsFromCSSOM(clone) {
    try {
      let combinedCSS = "";
      for (const sheet of document.styleSheets) {
        try {
          if (sheet && sheet.cssRules) {
            for (const rule of sheet.cssRules) {
              combinedCSS += rule.cssText + "\\n";
            }
          }
        } catch (e) {
          // Cross-origin or restricted stylesheet, skip
          console.warn('Cannot access stylesheet', sheet && sheet.href, e);
        }
      }
      if (combinedCSS) {
        // Remove existing link tags in clone
        clone.querySelectorAll && clone.querySelectorAll('link[rel="stylesheet"]').forEach(l => l.remove());
        const styleTag = document.createElement('style');
        styleTag.setAttribute('data-inlined', 'true');
        styleTag.textContent = combinedCSS;
        const head = clone.querySelector && clone.querySelector('head');
        if (head) head.appendChild(styleTag);
      }
    } catch (e) {
      console.warn('Inlining stylesheets failed:', e);
    }
  }

  
  function transformTabsToAnchors(clone) {
    try {
      // 1) Convert buttons to anchors with hrefs to matching panels
      var tablist = clone.querySelector('[role="tablist"]') || clone.querySelector('.tabs');
      if (tablist) {
        var tabEls = tablist.querySelectorAll('[role="tab"]');
        for (var i=0; i<tabEls.length; i++) {
          var btn = tabEls[i];
          if (btn.tagName.toLowerCase() === 'a') continue; // already an anchor
          var target = btn.getAttribute('aria-controls') || btn.getAttribute('data-target') || '';
          if (target){ target = target.replace(/^#?tab-/, ''); }
          if (!target) continue;
          var a = clone.createElement('a');
          a.setAttribute('role', 'tab');
          a.setAttribute('href', '#' + target);
          a.setAttribute('aria-controls', 'tab-' + target);
          a.className = btn.className || 'tab';
          a.textContent = btn.textContent || btn.innerText || '';
          btn.replaceWith(a);
        }
      }
      // 2) Ensure each panel has an id equal to the anchor hash target (e.g., "publications")
      var panels = clone.querySelectorAll('[role="tabpanel"]');
      for (var j=0; j<panels.length; j++) {
        var panel = panels[j];
        var id = panel.getAttribute('id') || '';
        // Accept either "publications" or "tab-publications"; normalize to base = without "tab-"
        var base = id.indexOf('tab-') === 0 ? id.slice(4) : id;
        // Set id to base for :target to hit, but preserve original id as aria-labelledby link
        panel.setAttribute('id', base);
      }
      // 3) Inject minimal CSS so that only :target is visible; default to Publications if no hash
      var css = "" + ".panel{display:none !important;}" + ".panel:target{display:block !important;}";
      var style = clone.createElement('style');
      style.setAttribute('data-export-tabs', 'true');
      style.textContent = css;
      var head = clone.querySelector('head') || clone;
      head.appendChild(style);
      // 4) Optional: update 'active' class for aesthetics based on current hash (not essential offline)
      // Skipped to keep export logic simple and robust without JS.
    } catch(e) {
      console.warn('transformTabsToAnchors failed:', e);
    }
  }

async function buildExportHTML() {
    const clone = document.documentElement.cloneNode(true);

    // Remove Save Final Page button
    try {
      const btn = clone.querySelector && clone.querySelector('#savePageBtn');
      if (btn) btn.remove();
    } catch(e){}

    // Remove all <script> tags from the clone
    try {
      clone.querySelectorAll && clone.querySelectorAll('script').forEach(s => s.remove());
    } catch(e){}

    // Remove file inputs and their labels
    try {
      clone.querySelectorAll && clone.querySelectorAll('input[type="file"]').forEach(input => {
        const label = input.closest ? input.closest('label') : null;
        if (label) label.remove(); else input.remove();
      });
    } catch(e){}

    // Set Publications as default tab
    try {
      clone.querySelectorAll && clone.querySelectorAll('[role="tab"]').forEach(tab => {
        const isPub = tab.id === 'tabbtn-publications';
        tab.setAttribute('aria-selected', isPub ? 'true' : 'false');
        if (tab.classList) tab.classList.toggle('active', isPub);
      });
      clone.querySelectorAll && clone.querySelectorAll('[role="tabpanel"]').forEach(panel => {
        const active = panel.id === 'publications' || panel.id === 'tab-publications';
        if (panel.classList) panel.classList.toggle('active', active);
        panel.style && (panel.style.display = active ? 'block' : 'none');
      });
    } catch(e){}

    // Inline stylesheets
    await inlineStylesheetsFromCSSOM(clone);

    // Convert JS-driven tabs to anchor-based tabs
    transformTabsToAnchors(clone);

    // Embed headshot
    try {
      const liveHeadshot = document.getElementById('headshot');
      const cloneHeadshot = clone.querySelector && clone.querySelector('#headshot');
      if (liveHeadshot && cloneHeadshot && liveHeadshot.complete) {
        const dataUrl = await dataURLFromImage(liveHeadshot);
        if (dataUrl) cloneHeadshot.setAttribute('src', dataUrl);
      }
    } catch(e){ console.warn('Headshot embedding failed:', e); }

    
    // Embed institution logo
    try {
      const liveLogo = document.getElementById('logo');
      const cloneLogo = clone.querySelector && clone.querySelector('#logo');
      if (cloneLogo) {
        if (liveLogo && liveLogo.complete) {
          const dataUrl = await dataURLFromImage(liveLogo);
          if (dataUrl) cloneLogo.setAttribute('src', dataUrl);
        }
      }
    } catch(e){ 
      console.warn('Logo embedding failed:', e);
    }

    
    // Inject robust tab behavior for the exported page (no external JS)
    try {
      const code = `(function(){
        function show(id){
          var base = (id || "").replace(/^#?/, "");
          var panels = document.querySelectorAll('[role="tabpanel"]');
          for (var i=0;i<panels.length;i++){
            var p = panels[i];
            var isActive = (p.id === base);
            if (p.style) p.style.display = isActive ? 'block' : 'none';
            if (p.classList) p.classList.toggle('active', isActive);
          }
          var tabs = document.querySelectorAll('[role="tab"]');
          for (var j=0;j<tabs.length;j++){
            var t = tabs[j];
            var href = (t.getAttribute('href') || '').replace(/^#?tab-/, '').replace(/^#?/, '');
            var isTab = (href === base);
            t.setAttribute('aria-selected', isTab ? 'true' : 'false');
            if (t.classList) t.classList.toggle('active', isTab);
          }
        }
        function init(){
          var hash = location.hash && location.hash.length > 1 ? location.hash : '#publications';
          if (!location.hash) { try { history.replaceState(null, '', hash); } catch(e){} }
          show(hash);
          var tabs = document.querySelectorAll('[role="tab"]');
          for (var k=0;k<tabs.length;k++){
            (function(btn){
              btn.addEventListener('click', function(e){
                e.preventDefault();
                var href = btn.getAttribute('href') || '';
                if (href){
                  try { history.replaceState(null, '', href); } catch(e){ location.hash = href; }
                  show(href);
                }
              });
            })(tabs[k]);
          }
        }
        if (document.readyState === 'loading'){
          document.addEventListener('DOMContentLoaded', init);
        } else { init(); }
      })();`;
      const s = document.createElement('script');
      s.type = 'text/javascript';
      s.textContent = code;
      const where = clone.querySelector('body') || clone;
      where.appendChild(s);
    } catch(e) { console.warn('Could not inject tab script into export:', e); }

    const doctype = '<!DOCTYPE html>';
    return doctype + '\n' + (clone.outerHTML || '');
  }

  async function saveFinalPage() {
    try {
      const htmlContent = await buildExportHTML();
      const blob = new Blob([htmlContent], {type: 'text/html;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index-final.html';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error('Save Final Page failed:', e);
      alert('Could not save the page. Check console for details.');
    }
  }

  // Expose globally as a fallback
  window.saveFinalPage = saveFinalPage;

  function wireSaveButton() {
    const btn = document.getElementById('savePageBtn');
    if (btn) {
      try { btn.addEventListener('click', saveFinalPage, { once: false }); } catch(e){}
      // Fallback in case addEventListener failed or ran too early
      btn.onclick = saveFinalPage;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireSaveButton);
  } else {
    wireSaveButton();
  }
})();

// --- Robust delegated tab handling ---
(function(){
  function activateTab(id){
    document.querySelectorAll('.tab').forEach(b=>{
      const on = b.dataset.target === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id===id));
  }
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest && e.target.closest('.tab');
    if(!btn) return;
    const id = btn.dataset.target;
    if(!id) return;
    activateTab(id);
    try { history.replaceState(null, '', '#'+id); } catch(_){}
  }, {passive:true});
  window.addEventListener('DOMContentLoaded', ()=>{
    const hash = location.hash.replace('#','');
    if(hash && document.getElementById(hash)) activateTab(hash);
  });
})();



// === Export static snapshot wiring ===
(function(){
  let hasXML = false;
  let hasHeadshot = false;
  let headshotDataURL = null;

  const xmlInput = document.getElementById('xmlInput');
  const imgInput = document.getElementById('imgInput');
  const exportBtn = document.getElementById('exportBtn');
  const headshotImg = document.getElementById('headshot');

  function updateExportBtn(){
    if (!exportBtn) return;
    const hasImg = hasHeadshot || (headshotImg && !!headshotImg.getAttribute('src'));
    const xmlViaInput = !!(xmlInput && xmlInput.files && xmlInput.files.length);
    const xmlViaDom = !!document.querySelector('#eduList li, #pubList li, [data-from-xml]');
    const ready = (hasImg) && (hasXML || xmlViaInput || xmlViaDom);
    exportBtn.hidden = !ready;
    exportBtn.disabled = !ready;
}

  if (imgInput) {
    imgInput.addEventListener('change', () => {
      const file = imgInput.files && imgInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        headshotDataURL = reader.result;
        if (headshotImg) {
          headshotImg.src = headshotDataURL;
          headshotImg.hidden = false;
        }
        hasHeadshot = true;
        updateExportBtn();
      };
      reader.readAsDataURL(file);
    });
  }
  if (xmlInput) {
    xmlInput.addEventListener('change', () => {
      const file = xmlInput.files && xmlInput.files[0];
      hasXML = !!file;
      updateExportBtn();
    });
  }
  document.addEventListener('cv:populated', () => {
    hasXML = true;
    updateExportBtn();
  });
  window.addEventListener('DOMContentLoaded', () => setTimeout(updateExportBtn, 600));

  function exportStatic(){ 
    try {
      const doc = document.cloneNode(true);
      doc.querySelectorAll('#exportBtn,input[type="file"]').forEach(el=>el.remove());
      const cloneHeadshot = doc.getElementById('headshot');
      if (cloneHeadshot && headshotDataURL) {
        cloneHeadshot.setAttribute('src', headshotDataURL);
      }
      const activeTab = doc.querySelector('.tab.active');
      if (activeTab) {
        const target = activeTab.getAttribute('data-target');
        doc.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id===target));
      }
      const htmlText = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      const blob = new Blob([htmlText], {type:'text/html;charset=utf-8'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Could not export the static page. See console for details.');
    }
  }

  if (exportBtn) exportBtn.addEventListener('click', exportStatic);
})();



// === Delegated BibTeX toggle wiring ===
(function(){
  function findBibtexTarget(btn){
    // 1) aria-controls
    const id = btn.getAttribute('aria-controls');
    if (id) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    // 2) data-target
    const sel = btn.getAttribute('data-target');
    if (sel) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    // 3) closest publication item: look for sibling .bibtex
    let li = btn.closest('li, .pub, .publication, .card');
    if (li) {
      const sib = li.querySelector('.bibtex, pre.bibtex, .bibtex-block, .bibtex-content');
      if (sib) return sib;
    }
    // 4) nextElementSibling fallback
    const next = btn.nextElementSibling;
    if (next && (next.matches('.bibtex') || next.matches('pre.bibtex') || next.matches('.bibtex-block') || next.matches('.bibtex-content'))) return next;
    return null;
  }

  function toggleBibtex(btn){
    const target = findBibtexTarget(btn);
    if (!target) return;
    const open = target.classList.toggle('open');
    // aria-expanded
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    // Hide/Show via inline style for safety if CSS missing
    target.style.display = open ? '' : 'none';
  }

  // Delegated click handler
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest && e.target.closest('.bibtex-toggle, [data-action="toggle-bibtex"], button[aria-controls*="bibtex"], .show-bibtex');
    if (!btn) return;
    e.preventDefault();
    toggleBibtex(btn);
  }, {passive:false});

  // Optional: copy-to-clipboard for bibtex blocks (when clicking a [data-action="copy-bibtex"] inside the item)
  document.addEventListener('click', async (e)=>{
    const cpy = e.target.closest && e.target.closest('[data-action="copy-bibtex"]');
    if (!cpy) return;
    e.preventDefault();
    const target = findBibtexTarget(cpy);
    if (!target) return;
    const text = target.innerText || target.textContent || '';
    try {
      await navigator.clipboard.writeText(text);
      cpy.dataset.copied = "true";
      setTimeout(()=>{ delete cpy.dataset.copied; }, 1200);
    } catch(_){
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }, {passive:false});
})();


// === addon: export force-populates ALL BibTeX before cloning ===
(() => {
  function ensurePreFromLive(button) {
    const idx = button.getAttribute('data-bib');
    if (!idx) return null;
    const id = 'bib-' + idx;
    let pre = document.getElementById(id);
    if (pre && (pre.textContent || '').trim().length) return pre; // already present with content

    // If your app lazily creates the <pre> on click, trigger a click to populate it.
    // We mark a flag so any toggle code can detect we're in export mode if needed.
    try {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    } catch(_) {
      try { button.click(); } catch(__) {}
    }

    // Re-check after click
    pre = document.getElementById(id);
    if (pre && (pre.textContent || '').trim().length) return pre;

    // Fallback: try to pull from nearby sources (dataset, script, template)
    let bib = '';
    if (button.dataset && button.dataset.bibtex) bib = button.dataset.bibtex.trim();
    const card = button.closest('li, .pub, .publication, .card');
    if (!bib && card && card.dataset && card.dataset.bibtex) bib = card.dataset.bibtex.trim();
    if (!bib && card) {
      const scr = card.querySelector('script[type="application/x-bibtex"]');
      if (scr && scr.textContent) bib = scr.textContent.trim();
      if (!bib) {
        const src = card.querySelector('.bibtex-source, template[data-bibtex]');
        if (src) bib = (src.dataset?.bibtex || src.textContent || '').trim();
      }
    }
    if (bib) {
      pre = document.createElement('pre');
      pre.id = id;
      pre.className = 'bibtex';
      pre.textContent = bib;
      // insert after button as a sensible default
      if (button.nextSibling) button.parentNode.insertBefore(pre, button.nextSibling);
      else button.parentNode.appendChild(pre);
      return pre;
    }
    return null;
  }

  function exportStatic_ForcePopulate() {
    try {
      // Record which pre blocks are currently visible so we can restore that state later
      const visibleIds = new Set();
      document.querySelectorAll('pre[id^="bib-"], .bibtex, pre.bibtex').forEach(el => {
        const isVisible = getComputedStyle(el).display !== 'none' || el.classList.contains('open');
        if (el.id && isVisible) visibleIds.add(el.id);
      });

      // Ensure EVERY button[data-bib] has a populated <pre id="bib-N"> in the LIVE DOM
      const bibButtons = Array.from(document.querySelectorAll('button[data-bib]'));
      bibButtons.forEach(btn => ensurePreFromLive(btn));

      // After population, make sure all pre are hidden (we keep visibility map)
      document.querySelectorAll('pre[id^="bib-"]').forEach(pre => {
        pre.classList.remove('open');
        pre.style.display = 'none';
      });
      // restore visibility for ones that were open
      visibleIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.add('open');
          el.style.display = '';
        }
      });

      // Clone the full document
      const doc = document.cloneNode(true);

      // Keep only content; remove export controls and file inputs
      doc.querySelectorAll('#exportBtn, input[type="file"]').forEach(el => el.remove());

      // Reflect active tab
      const activeTab = document.querySelector('.tab.active');
      if (activeTab) {
        const target = activeTab.getAttribute('data-target');
        doc.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === target));
      }

      // Remove external scripts that could cause duplicate variable errors
      doc.querySelectorAll('script[src]').forEach(s => s.remove());

      // Inject tiny bootstrap to make tabs + bibtex work offline
      const boot = doc.createElement('script');
      boot.textContent = `(function(){
        function activate(id){
          document.querySelectorAll('.tab').forEach(b=>{
            const on = b.dataset.target===id;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', on?'true':'false');
          });
          document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id===id));
          try{ history.replaceState(null,'','#'+id); }catch{}
        }
        document.addEventListener('click', function(e){
          const t = e.target.closest && e.target.closest('.tab');
          if (t){ e.preventDefault(); activate(t.dataset.target); return; }
          const b = e.target.closest && e.target.closest('button[data-bib], .bibtex-button, .bibtex-toggle, [data-action="toggle-bibtex"], button[aria-controls*="bibtex"], .show-bibtex');
          if (b){
            e.preventDefault();
            let el = null;
            let id = b.getAttribute('data-bib');
            if (id) el = document.getElementById('bib-'+id);
            if (!el){
              const ac = b.getAttribute('aria-controls');
              if (ac) el = document.getElementById(ac);
            }
            if (!el){
              const sel = b.getAttribute('data-target');
              if (sel) el = document.querySelector(sel);
            }
            if (!el){
              const card = b.closest('li, .pub, .publication, .card');
              if (card) el = card.querySelector('pre[id^="bib-"], .bibtex, pre.bibtex, .bibtex-block, .bibtex-content');
            }
            if (!el) el = b.nextElementSibling;
            if (el){
              const open = el.classList.toggle('open');
              b.setAttribute('aria-expanded', open?'true':'false');
              el.style.display = open ? '' : 'none';
            }
          }
        }, {passive:false});
        document.addEventListener('DOMContentLoaded', function(){
          const hash = location.hash.replace('#','');
          const first = document.querySelector('.tab')?.dataset.target;
          activate(hash||first);
        });
      })();`;
      doc.body.appendChild(boot);

      const htmlText = '<!DOCTYPE html>\\n' + doc.documentElement.outerHTML;
      const blob = new Blob([htmlText], {type:'text/html;charset=utf-8'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 800);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. See console.');
    }
  }

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn && !exportBtn.dataset.forcePopulateAll) {
    exportBtn.addEventListener('click', exportStatic_ForcePopulate);
    exportBtn.dataset.forcePopulateAll = '1';
  }
})();

// === addon: safe export that preserves BibTeX and trims leading newline ===
(()=>{
  if (document.__safeExportAddon) return; document.__safeExportAddon = 1;

  function ensureBibtexForAllLive(){
    // Force-populate all BibTeX in LIVE DOM so clone includes them
    const buttons = Array.from(document.querySelectorAll('button[data-bib]'));
    buttons.forEach(btn => {
      const idx = btn.getAttribute('data-bib');
      if (!idx) return;
      const id = 'bib-' + idx;
      let pre = document.getElementById(id);
      if (pre && (pre.textContent || '').trim().length){
        if (!pre.classList.contains('bibtex')) pre.classList.add('bibtex');
        return;
      }
      // Try to trigger lazy population
      try { btn.dispatchEvent(new MouseEvent('click', {bubbles:true,cancelable:true})); } catch(_){ try{ btn.click(); }catch(__){} }
      pre = document.getElementById(id);
      if (pre && (pre.textContent || '').trim().length){
        if (!pre.classList.contains('bibtex')) pre.classList.add('bibtex');
        // close it again if it was opened by the click
        pre.classList.remove('open');
        pre.style.display = 'none';
        return;
      }
      // Fallbacks
      let bib = '';
      if (btn.dataset && btn.dataset.bibtex) bib = btn.dataset.bibtex.trim();
      const card = btn.closest('li, .pub, .publication, .card');
      if (!bib && card && card.dataset && card.dataset.bibtex) bib = card.dataset.bibtex.trim();
      if (!bib && card){
        const scr = card.querySelector('script[type="application/x-bibtex"]');
        if (scr && scr.textContent) bib = scr.textContent.trim();
        if (!bib){
          const src = card.querySelector('.bibtex-source, template[data-bibtex]');
          if (src) bib = (src.dataset?.bibtex || src.textContent || '').trim();
        }
      }
      if (bib){
        pre = document.createElement('pre');
        pre.id = id;
        pre.className = 'bibtex';
        pre.textContent = bib;
        if (btn.nextSibling) btn.parentNode.insertBefore(pre, btn.nextSibling);
        else btn.parentNode.appendChild(pre);
      }
    });
  }

  function inlineBootstrapScript(){
    return `(function(){
      function activate(id){
        document.querySelectorAll('.tab').forEach(b=>{
          const on = b.dataset.target===id;
          b.classList.toggle('active', on);
          b.setAttribute('aria-selected', on?'true':'false');
        });
        document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id===id));
        try{ history.replaceState(null,'','#'+id); }catch{}
      }
      document.addEventListener('click', function(e){
        const t = e.target.closest && e.target.closest('.tab');
        if (t){ e.preventDefault(); activate(t.dataset.target); return; }
        const b = e.target.closest && e.target.closest('button[data-bib], .bibtex-button, .bibtex-toggle, [data-action="toggle-bibtex"], button[aria-controls*="bibtex"], .show-bibtex');
        if (b){
          e.preventDefault();
          let el = null;
          let id = b.getAttribute('data-bib');
          if (id) el = document.getElementById('bib-'+id);
          if (!el){
            const ac = b.getAttribute('aria-controls');
            if (ac) el = document.getElementById(ac);
          }
          if (!el){
            const sel = b.getAttribute('data-target');
            if (sel) el = document.querySelector(sel);
          }
          if (!el){
            const card = b.closest('li, .pub, .publication, .card');
            if (card) el = card.querySelector('pre[id^="bib-"], .bibtex, pre.bibtex, .bibtex-block, .bibtex-content');
          }
          if (!el) el = b.nextElementSibling;
          if (el){
            const open = el.classList.toggle('open');
            b.setAttribute('aria-expanded', open?'true':'false');
            el.style.display = open ? '' : 'none';
          }
        }
      }, {passive:false});
      document.addEventListener('DOMContentLoaded', function(){
        const hash = location.hash.replace('#','');
        const first = document.querySelector('.tab')?.dataset.target;
        activate(hash||first);
      });
    })();`
  }

  function exportStatic_Safe(){
    try{
      // Remember which bibtex are open
      const openIDs = new Set();
      document.querySelectorAll('pre[id^="bib-"], .bibtex, pre.bibtex').forEach(el=>{
        const isOpen = el.classList.contains('open') || getComputedStyle(el).display !== 'none';
        if (el.id && isOpen) openIDs.add(el.id);
      });

      // Ensure all bibtex are present
      ensureBibtexForAllLive();

      // Normalize visibility
      document.querySelectorAll('pre[id^="bib-"]').forEach(pre=>{ pre.classList.remove('open'); pre.style.display='none'; });
      openIDs.forEach(id=>{ const el = document.getElementById(id); if (el){ el.classList.add('open'); el.style.display=''; } });

      // Clone
      const doc = document.cloneNode(true);

      // Remove runtime-only controls
      doc.querySelectorAll('#exportBtn, input[type="file"]').forEach(el => el.remove());

      // Reflect active tab
      const active = document.querySelector('.tab.active')?.dataset.target;
      if (active) doc.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id===active));

      // Do NOT strip external scripts here; keep behavior identical unless host causes errors
      // If you need to avoid duplicates later, we can add a guard.

      // Ensure bibtex CSS exists
      if (!doc.querySelector('style[data-bibtex]')){
        const style = doc.createElement('style'); style.setAttribute('data-bibtex','');
        style.textContent = ".bibtex, pre.bibtex, .bibtex-block, .bibtex-content{display:none}.bibtex.open, pre.bibtex.open, .bibtex-block.open, .bibtex-content.open{display:block}";
        doc.head.appendChild(style);
      }

      // Inject inline bootstrap for tabs+bibtex
      const boot = doc.createElement('script');
      boot.textContent = inlineBootstrapScript();
      doc.body.appendChild(boot);

      // Serialize and trim only the very beginning
      let html = '<!DOCTYPE html>' + doc.documentElement.outerHTML;
      html = html.replace(/^\uFEFF?[\s\r\n]+(?=<!DOCTYPE html>)/, ''); // just in case
      const blob = new Blob([ html ], {type:'text/html;charset=utf-8'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 800);
    }catch(err){
      console.error('Export failed:', err);
      alert('Export failed. See console.');
    }
  }

  // Attach without clobbering existing handlers; call ours first
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn && !exportBtn.dataset.safeExport){
    exportBtn.addEventListener('click', function(e){ 
      // Prefer our safe export; prevent other exporters from running twice
      e.preventDefault(); e.stopImmediatePropagation();
      exportStatic_Safe(); 
    });
    exportBtn.dataset.safeExport = '1';
  }
})();

// === force-top-on-load v5 (extended, anchor-safe, style-safe, idempotent) ===
(() => {
  if (window.__forceTopOnceV5) return;
  window.__forceTopOnceV5 = 1;
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch { /* ignore */ }

  function forceTop() {
    let start = performance.now();
    let running = true;
    function tick(t) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (running && (t - start) < 1200) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    setTimeout(() => { running = false; window.scrollTo(0, 0); }, 1250);
  }

  // Avoid initial hash auto-scroll while preserving the hash
  const initialHash = location.hash;
  if (initialHash && initialHash.length > 1) {
    try {
      const id = initialHash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        const prev = el.id;
        el.id = ''; // temporarily remove to prevent auto-scroll to anchor
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.id = prev; // restore id after layout
          try { history.replaceState(null, '', initialHash); } catch { }
        }));
      }
    } catch { }
  }

  if (document.readyState === 'complete') {
    setTimeout(forceTop, 0);
  } else {
    window.addEventListener('load', () => setTimeout(forceTop, 0), { once: true });
  }
  window.addEventListener('pageshow', (e) => { if (e.persisted) setTimeout(forceTop, 0); });

  // Defocus any auto-focused control that might pull the page down
  window.addEventListener('load', () => { try { document.activeElement && document.activeElement.blur(); } catch { } }, { once: true });
})();

// === modern candidate: final startup tab normalization ===
(() => {
  function normalizeInitialTab() {
    const id = (location.hash || "#publications").replace("#", "") || "publications";
    activateModernTab(id);
  }

  function activateModernTab(id) {
    document.querySelectorAll(".tab").forEach(tab => {
      const active = tab.dataset.target === id;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".panel").forEach(panel => {
      const active = panel.id === id;
      panel.classList.toggle("active", active);
      panel.style.removeProperty("display");
    });
  }

  function normalizeDuringStartup() {
    normalizeInitialTab();
    let count = 0;
    const timer = setInterval(() => {
      normalizeInitialTab();
      count += 1;
      if (count >= 8) clearInterval(timer);
    }, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(normalizeDuringStartup, 360));
  } else {
    setTimeout(normalizeDuringStartup, 360);
  }
  window.addEventListener("load", () => setTimeout(normalizeDuringStartup, 420), { once: true });
  document.addEventListener("click", event => {
    const tab = event.target.closest && event.target.closest(".tab");
    if (!tab || !tab.dataset.target) return;
    event.preventDefault();
    activateModernTab(tab.dataset.target);
    try { history.replaceState(null, "", "#" + tab.dataset.target); } catch {}
  }, { capture: true });
})();
