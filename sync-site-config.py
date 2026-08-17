"""
sync-site-config.py
1. Lê cv.xml (se existir) e descobre todos os orientandos (em andamento ou sem tema).
2. Adiciona automaticamente entradas vazias ("Nome": "") em site-config.json para orientandos não cadastrados.
3. Atualiza site-config.json.
4. Gera site-config.js a partir de site-config.json.

Uso:
    python sync-site-config.py
"""

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

script_dir = Path(__file__).parent
json_path = script_dir / "site-config.json"
js_path   = script_dir / "site-config.js"
xml_path  = script_dir / "cv.xml"

PARTICLES = {'de', 'da', 'do', 'dos', 'das', 'van', 'von', 'del', 'della', 'di', 'af', 'of', 'the'}

def title_case_name(s):
    words = s.lower().split()
    result = []
    for i, w in enumerate(words):
        if not w:
            continue
        if i > 0 and w in PARTICLES:
            result.append(w)
        elif re.match(r'^[a-záéíóúàâêôãõç]\.$', w):
            result.append(w.upper())
        else:
            result.append(w[0].upper() + w[1:])
    return ' '.join(result)

def normalize_name(raw):
    s = raw.strip()
    if not s:
        return s
    comma = s.find(',')
    if comma != -1:
        before = s[:comma].strip()
        if before == before.upper() and re.search(r'[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ]', before):
            given = s[comma+1:].strip()
            return title_case_name(given + ' ' + before)
    return title_case_name(s)

def split_joint_names(raw_name):
    # Splits names like "Ana Silva e João Costa" or "Ana Silva; João Costa"
    parts = re.split(r'\s+e\s+|;', raw_name)
    return [normalize_name(p) for p in parts if p.strip()]

# 1. Carregar site-config.json
if json_path.exists():
    config = json.loads(json_path.read_text(encoding="utf-8"))
else:
    config = {}

if "studentTopics" not in config or not isinstance(config["studentTopics"], dict):
    config["studentTopics"] = {}

student_topics = config["studentTopics"]
existing_keys_lower = {k.strip().lower(): k for k in student_topics.keys()}

added_students = []

# 2. Ler cv.xml e extrair orientandos se o arquivo existir
if xml_path.exists():
    try:
        xml_text = xml_path.read_text(encoding="utf-8")
        root = ET.fromstring(xml_text)

        for elem in root.iter():
            tag = elem.tag.upper()
            if 'ORIENTACAO-EM-ANDAMENTO' in tag and not tag.startswith('DADOS') and not tag.startswith('DETALHAMENTO'):
                for child in elem:
                    ctag = child.tag.upper()
                    if 'DETALHAMENTO' in ctag:
                        raw_name = child.attrib.get('NOME-DO-ORIENTANDO') or child.attrib.get('nome-do-orientando') or ''
                        if raw_name:
                            names = split_joint_names(raw_name)
                            for norm_name in names:
                                if norm_name.lower() not in existing_keys_lower:
                                    student_topics[norm_name] = ""
                                    existing_keys_lower[norm_name.lower()] = norm_name
                                    added_students.append(norm_name)
    except Exception as err:
        print(f"[Aviso] Erro ao ler cv.xml para sync de alunos: {err}")

# 3. Salvar site-config.json se houve alterações
if added_students:
    json_path.write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Adicionados {len(added_students)} novo(s) orientando(s) em site-config.json:")
    for s in added_students:
        print(f"  - {s}")
else:
    print("Nenhum novo orientando pendente de cadastro.")

# 4. Gerar site-config.js
js_content = f"window.SITE_CONFIG = {json.dumps(config, indent=2, ensure_ascii=False)};\n"
js_path.write_text(js_content, encoding="utf-8")
print("Updated site-config.js from site-config.json")
