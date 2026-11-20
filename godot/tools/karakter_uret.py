"""Karakter paftasındaki bir çizimden CellCog ile 3B model (GLB) üretir.
   python godot/tools/karakter_uret.py K01_yasli_esnaf "kısa tanım"
Çıktı: godot/modeller/karakter/<ad>/  ·  CELLCOG_API_KEY ortam değişkeni tanımlı olmalı (anahtar bu dosyaya yazılmaz)."""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(os.path.dirname(ROOT), 'antep', 'docs', 'ref')

def main():
    name = sys.argv[1]
    desc = sys.argv[2] if len(sys.argv) > 2 else ''
    img = os.path.join(REF, name + '.png')
    out = os.path.join(ROOT, 'modeller', 'karakter', name)
    os.makedirs(out, exist_ok=True)
    from cellcog import CellCogClient
    client = CellCogClient(agent_provider='claude-code')
    prompt = f"""Create ONE game-ready 3D character model (GLB) from this concept art reference:
<SHOW_FILE>{img}</SHOW_FILE>

Character: {desc}
Setting: Gaziantep (Aintab), Ottoman Empire, 1918-1921. Keep the clothing, colours, proportions and age exactly as in the reference;
do not modernise or stylise. Realistic, not cartoon.

Requirements:
- Full body, single character in a strict T-POSE: both arms straight out horizontally at shoulder height, palms down, fingers together; legs straight and slightly apart; so it can be rigged later.
- ONE continuous, welded mesh (no separate floating shells, no open seams between body parts or clothing panels).
- Neutral facial expression, mouth closed. No props in the hands, no base or pedestal.
- Around 20,000-30,000 triangles, PBR materials (base colour, normal, roughness), textures embedded in the GLB.
- Real-world scale: about 1.68 m tall, feet on the ground plane at the origin, facing +Z.
Deliver the GLB file and one preview image. Save outputs to: {out}"""
    result = client.create_chat(prompt=prompt, task_label='gaziantep-' + name, chat_mode='agent')
    info = {k: (v if isinstance(v, (str, int, float, bool, list, dict, type(None))) else str(v)) for k, v in result.items()} if isinstance(result, dict) else {'result': str(result)}
    info.pop('api_key', None)
    with open(os.path.join(out, 'sonuc.json'), 'w', encoding='utf-8') as f:
        json.dump(info, f, ensure_ascii=False, indent=1)
    print('ANAHTARLAR', sorted(info.keys()))
    print(str(info.get('message', ''))[:1500])

main()
