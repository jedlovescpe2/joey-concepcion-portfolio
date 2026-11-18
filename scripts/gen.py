# usage: python3 -I scripts/gen.py <name> [--force]
# PAID: one OpenAI image per call (gpt-image-2.5-sunburst, images/edits with Joey's CV photo as the face reference).
# Raw render + usage land in art/raw/ (git-ignored); costs are appended to art/usage.jsonl.
import os, sys, json, base64, time, uuid, urllib.request, urllib.error

MODEL = "gpt-image-2.5-sunburst"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "art", "raw")
REF = os.path.join(ROOT, "public", "img", "joey.jpg")

IDENTITY = (
    "a Filipino man of about forty: round full face, soft rounded jaw, warm light-tan skin, dark almond-shaped eyes, thick straight dark brows, "
    "short thick black hair styled up and back with volume on top and shorter sides, a light thin mustache and a short sparse goatee on the chin, "
    "friendly relaxed closed-mouth smile")
LIKENESS = (
    "He must be an EXACT likeness of the man in the reference photo: keep his real face shape, fuller cheeks, eye shape, nose, brows, hairline and age; "
    "do not slim, lengthen, westernise or idealise his face. ")
STYLE = (
    "Rendered as a polished, high-end stylised 3D animated-film character (soft subsurface skin, clean sculpted hair, gentle studio lighting), "
    "tasteful and professional, not cartoonish or childish. ")
BUILD = (
    "Body: fit and slim, an athletic lean build with natural realistic adult proportions (about 7.5 heads tall), flat stomach, narrow waist, "
    "trim shoulders and arms, clothes fitting neatly. Keep the head at a normal realistic size for the body: NOT a caricature, NOT chibi, "
    "NOT big-headed, NOT stocky or heavy-set. Only the face follows the reference photo; the body is slimmer than in the photo. ")
OUTFIT = (
    "Outfit: a light heather-grey knit zip cardigan over a dark plum shirt with a small subtle floral print, slim charcoal chinos, brown leather loafers, "
    "a slim black smartwatch. ")

PHOTO = (
    "A real professional photograph (not an illustration, not 3D): natural skin texture, true-to-life colour, soft flattering light, "
    "shallow depth of field, shot on a full-frame camera with an 85mm lens, editorial portrait quality. ")
NOTEXT = "No text, no logos, no watermark, no other people. "


def portrait(scene, outfit, frame="waist-up portrait, both shoulders and arms fully inside the frame, head in the upper third"):
    return ("Photo of " + IDENTITY + ". " + LIKENESS + BUILD + PHOTO + "Outfit: " + outfit + ". Framing: " + frame + ". Scene: " + scene + ". " + NOTEXT)


TALL = dict(size="1024x1536", background="opaque")
SQ = dict(size="1024x1024", background="opaque")
HAT_FRAME = "head-and-shoulders to chest portrait, centred, face in the upper half of the image, generous headroom, full shoulders inside the frame"

JOBS = {
    "hero": dict(TALL, prompt=portrait(
        "plain seamless light warm-grey studio backdrop with nothing else in it, even soft studio lighting, he stands relaxed and confident, arms loosely crossed, warm closed-mouth smile, looking at the camera",
        "a tailored navy suit jacket and trousers, crisp white open-collar shirt without a tie, slim black smartwatch",
        "waist-up portrait from the belt up, both shoulders and both elbows fully inside the frame with space around them, head in the upper third")),
    "about": dict(TALL, prompt=portrait(
        "a bright modern Singapore office lounge with plants and warm wood, blurred background, he sits on the edge of a desk holding a coffee cup, relaxed friendly smile, looking at the camera",
        "a light heather-grey knit zip cardigan over a dark plum shirt with a small subtle floral print, charcoal chinos")),
    "x-happy": dict(SQ, prompt=portrait("soft cream background, he smiles warmly with a closed-mouth smile, looking at the camera",
        "a white oxford shirt with the top button open", HAT_FRAME)),
    "x-thinking": dict(SQ, prompt=portrait("soft sage-green background, thoughtful expression, chin resting on his hand, eyes looking slightly up and to the side",
        "a charcoal crew-neck sweater over a light blue collar shirt", HAT_FRAME)),
    "x-laughing": dict(SQ, prompt=portrait("soft warm beige background, genuinely laughing with a natural open smile showing teeth, eyes crinkled",
        "a navy polo shirt", HAT_FRAME)),
    "x-focused": dict(SQ, prompt=portrait("dim modern office at night with a laptop screen lighting his face softly, focused concentrated expression looking down at the screen",
        "a dark olive-green overshirt over a black t-shirt", HAT_FRAME)),
    "hat-programmer": dict(TALL, prompt=portrait("a 2006-era Philippine government office with beige CRT monitors and paper files, warm fluorescent light, he looks at the camera with a slight smile",
        "a short-sleeved light blue polo shirt with a lanyard ID", HAT_FRAME)),
    "hat-data": dict(TALL, prompt=portrait("a cool blue-lit server room with rows of racks and blinking lights, he looks at the camera with a calm confident expression",
        "a white long-sleeved button-down shirt with sleeves rolled to the forearm, a lanyard", HAT_FRAME)),
    "hat-analyst": dict(TALL, prompt=portrait("a Singapore bank meeting room with a glass whiteboard covered in system diagrams behind him, soft daylight, professional smile",
        "a pale blue dress shirt with a dark navy tie", HAT_FRAME)),
    "hat-support": dict(TALL, prompt=portrait("an operations room at night with multiple monitors showing dashboards, he wears a headset around his neck, alert friendly expression",
        "a dark grey zip hoodie over a black t-shirt", HAT_FRAME)),
    "hat-frontend": dict(TALL, prompt=portrait("a bright creative tech office with a large monitor showing a website layout, warm daylight, relaxed smile",
        "a charcoal unstructured blazer over a plain white t-shirt", HAT_FRAME)),
    "hat-lead": dict(TALL, prompt=portrait("a modern corporate office in Singapore with floor-to-ceiling windows and the city skyline softly blurred, confident leader smile",
        "a tailored navy suit with a white open-collar shirt, no tie", HAT_FRAME)),
    "hat-mentor": dict(TALL, prompt=portrait("a university classroom with students softly blurred in the background and a screen with code behind him, warm encouraging smile, gesturing gently with one hand",
        "a light heather-grey knit zip cardigan over a dark plum shirt with a small subtle floral print", HAT_FRAME)),
    "sheet": dict(size="1536x1024", background="opaque", prompt=(
        "A professional character model sheet of " + IDENTITY + ". " + LIKENESS + BUILD + STYLE + OUTFIT +
        "Layout on a clean warm cream paper background (#f6f3e7) with thin olive-green (#4c5a2b) guide lines and small olive labels: "
        "LEFT two thirds: a full-body turnaround of the same man standing in a relaxed neutral pose, four views evenly spaced on one baseline, "
        "all the same height and scale: FRONT, THREE-QUARTER, SIDE (profile facing right), BACK; each view labelled underneath in small clean sans-serif capitals. "
        "RIGHT third: a 2x2 grid of head-and-shoulders expression studies labelled HAPPY, THINKING, LAUGHING, FOCUSED; below the grid a row of five round colour "
        "swatches (skin, hair black, cardigan grey, shirt plum, olive accent) and a small item callout of his smartwatch. "
        "Top left title in an elegant serif: 'JOEY CONCEPCION' with a smaller line 'IT Professional · Digital Channel Lead · IT Mentor'. "
        "Consistent slim proportions across every view, crisp even lighting, no extra people, no watermark, no slogans or taglines, no other text.")),
}


def run(name):
    job = JOBS[name]
    out = os.path.join(RAW, f"{name}.png")
    if os.path.exists(out) and "--force" not in sys.argv:
        sys.exit(f"{out} exists (pass --force to pay for a new render)")
    os.makedirs(RAW, exist_ok=True)
    fields = {"model": MODEL, "prompt": job["prompt"], "size": job["size"], "quality": "high", "n": "1",
              "background": job["background"], "output_format": "png"}
    b = "----" + uuid.uuid4().hex
    body = b""
    for k, v in fields.items():
        body += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    body += (f'--{b}\r\nContent-Disposition: form-data; name="image[]"; filename="joey.jpg"\r\nContent-Type: image/jpeg\r\n\r\n').encode() + open(REF, "rb").read() + b"\r\n"
    body += f"--{b}--\r\n".encode()
    req = urllib.request.Request("https://api.openai.com/v1/images/edits", data=body, method="POST",
                                 headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}", "Content-Type": f"multipart/form-data; boundary={b}"})
    t = time.time()
    try:
        r = urllib.request.urlopen(req, timeout=580)
        served = r.headers.get("openai-model")
        d = json.load(r)
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode()[:900]); sys.exit(1)
    open(out, "wb").write(base64.b64decode(d["data"][0]["b64_json"]))
    u = d.get("usage", {}); det = u.get("input_tokens_details", {})
    cost = (det.get("text_tokens", 0) * 5 + det.get("image_tokens", 0) * 8 + u.get("output_tokens", 0) * 30) / 1e6  # sunburst list prices per 1M tokens
    rec = {"name": name, "model": MODEL, "served": served, "size": job["size"], "usage": u, "cost_usd": round(cost, 4), "at": time.strftime("%Y-%m-%dT%H:%M:%S")}
    with open(os.path.join(ROOT, "art", "usage.jsonl"), "a") as f:
        f.write(json.dumps(rec) + "\n")
    print("saved %s in %.0fs | served %s | out tokens %s | cost $%.4f" % (out, time.time() - t, served, u.get("output_tokens"), cost))


if __name__ == "__main__":
    run(sys.argv[1])
