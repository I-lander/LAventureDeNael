import argparse
import base64
import glob
import http.client
import json
import mimetypes
import os
import string
import sys
import time
import urllib.error
import urllib.request

PROJECT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
DEFAULT_MODEL = 'gemini-3-pro-image'
ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
ATTEMPTS_PER_VARIANT = 2
MAX_VARIANTS = 10
TRANSIENT_HTTP_CODES = {429, 500, 502, 503, 504}
RETRYABLE_FINISH_REASONS = {None, 'STOP', 'MAX_TOKENS', 'FINISH_REASON_UNSPECIFIED'}
RETRY_DELAY_SECONDS = 20
IMAGE_EXTENSIONS = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif'}


class GenerationFailure(Exception):
    def __init__(self, message: str, transient: bool, retry_after: float = RETRY_DELAY_SECONDS):
        super().__init__(message)
        self.transient = transient
        self.retry_after = retry_after


def project_path(path: str) -> str:
    return path if os.path.isabs(path) else os.path.join(PROJECT, path)


def display_path(path: str) -> str:
    try:
        return os.path.relpath(path, PROJECT)
    except ValueError:
        return path


def read_api_key() -> str:
    from_environment = os.environ.get('GEMINI_API_KEY', '').strip()
    if from_environment:
        return from_environment
    env_path = project_path('.env')
    if not os.path.exists(env_path):
        raise SystemExit('GEMINI_API_KEY is not set and .env does not exist')
    with open(env_path, encoding='utf-8-sig') as env_file:
        for line in env_file:
            entry = line.strip()
            if entry.startswith('export '):
                entry = entry[len('export '):].strip()
            name, separator, value = entry.partition('=')
            if separator and name.strip() == 'GEMINI_API_KEY':
                value = value.strip()
                if value[:1] in ('"', "'"):
                    value = value[1:].split(value[0], 1)[0]
                else:
                    value = value.split(' #', 1)[0].strip()
                if value:
                    return value
    raise SystemExit('GEMINI_API_KEY is missing or empty in .env')


def image_part(path: str) -> dict:
    mime_type = mimetypes.guess_type(path)[0] or 'image/png'
    with open(project_path(path), 'rb') as image_file:
        data = base64.b64encode(image_file.read()).decode('ascii')
    return {'inline_data': {'mime_type': mime_type, 'data': data}}


def request_image(model: str, parts: list[dict], aspect_ratio: str, api_key: str) -> tuple[bytes, str]:
    body = {
        'contents': [{'parts': parts}],
        'generationConfig': {'responseModalities': ['TEXT', 'IMAGE'], 'imageConfig': {'aspectRatio': aspect_ratio}},
    }
    request = urllib.request.Request(
        ENDPOINT.format(model=model),
        data=json.dumps(body).encode('utf8'),
        headers={'Content-Type': 'application/json', 'x-goog-api-key': api_key},
        method='POST',
    )
    try:
        with urllib.request.urlopen(request, timeout=240) as response:
            payload = json.loads(response.read())
    except urllib.error.HTTPError as error:
        retry_after = error.headers.get('Retry-After', '') if error.headers else ''
        delay = float(retry_after) if retry_after.isdigit() else RETRY_DELAY_SECONDS
        raise GenerationFailure(f'HTTP {error.code}: {error.read()[:300]!r}', error.code in TRANSIENT_HTTP_CODES, delay)
    except (urllib.error.URLError, http.client.HTTPException, OSError) as error:
        raise GenerationFailure(f'network error: {error}', True)
    except json.JSONDecodeError as error:
        raise GenerationFailure(f'unreadable response: {error}', True)
    for candidate in payload.get('candidates', []):
        for part in candidate.get('content', {}).get('parts', []):
            inline = part.get('inlineData') or part.get('inline_data')
            if inline and inline.get('data') and not part.get('thought'):
                mime_type = inline.get('mimeType') or inline.get('mime_type') or 'image/png'
                return base64.b64decode(inline['data']), IMAGE_EXTENSIONS.get(mime_type, 'png')
    reasons = [candidate.get('finishReason') for candidate in payload.get('candidates', [])]
    block_reason = payload.get('promptFeedback', {}).get('blockReason')
    blocked = block_reason is not None or any(reason not in RETRYABLE_FINISH_REASONS for reason in reasons)
    raise GenerationFailure(f'no image returned, finish reasons {reasons}, block reason {block_reason}', not blocked)


def main():
    parser = argparse.ArgumentParser(description='Generate sprite reference images with Gemini (Nano Banana Pro).')
    parser.add_argument('--prompt', required=True, help='text file holding the prompt, relative to the project')
    parser.add_argument('--image', action='append', default=[],
                        help='input image, repeatable, sent in order: describe each one as "image 1", "image 2"... in the prompt')
    parser.add_argument('--out', required=True, help='output path without extension, relative to the project; must not exist yet')
    parser.add_argument('--count', type=int, default=2, help=f'number of variants, 1 to {MAX_VARIANTS} (default 2)')
    parser.add_argument('--aspect-ratio', default='1:1', help='output aspect ratio, e.g. 1:1 or 16:9')
    parser.add_argument('--model', default=DEFAULT_MODEL)
    arguments = parser.parse_args()

    if not 1 <= arguments.count <= MAX_VARIANTS:
        raise SystemExit(f'--count must be between 1 and {MAX_VARIANTS}')
    output_base = project_path(arguments.out)
    candidates = [output_base] + [f'{output_base}-{letter}' for letter in string.ascii_lowercase[:MAX_VARIANTS]]
    existing = [path for candidate in candidates for extension in set(IMAGE_EXTENSIONS.values())
                for path in glob.glob(glob.escape(candidate) + '.' + extension)]
    if existing:
        raise SystemExit(f'{arguments.out} already has outputs ({", ".join(display_path(path) for path in existing)}): '
                         'choose a new --out so approved references are never overwritten')

    with open(project_path(arguments.prompt), encoding='utf-8-sig') as prompt_file:
        prompt = prompt_file.read().strip()
    parts = [image_part(path) for path in arguments.image] + [{'text': prompt}]
    api_key = read_api_key()

    written = []
    aborted = False
    for variant in range(arguments.count):
        if aborted:
            break
        suffix = f'-{string.ascii_lowercase[variant]}' if arguments.count > 1 else ''
        for attempt in range(ATTEMPTS_PER_VARIANT):
            try:
                image_bytes, extension = request_image(arguments.model, parts, arguments.aspect_ratio, api_key)
            except GenerationFailure as failure:
                print(f'variant {variant + 1}, attempt {attempt + 1}: {failure}')
                if not failure.transient:
                    print('not a transient failure: stopping the run')
                    aborted = True
                    break
                if attempt + 1 < ATTEMPTS_PER_VARIANT:
                    time.sleep(failure.retry_after)
                continue
            output_path = f'{output_base}{suffix}.{extension}'
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'xb') as output_file:
                output_file.write(image_bytes)
            written.append(display_path(output_path))
            print(f'variant {variant + 1}: {display_path(output_path)}')
            break

    print(f'{len(written)} of {arguments.count} variants written')
    if not written:
        sys.exit(1)


if __name__ == '__main__':
    main()
