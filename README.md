# Blog (simple dev README)

Short steps to install and run the project locally (development):

1) Create a Python virtual environment and install dependencies

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2) Apply migrations and (optionally) create a superuser

```bash
python manage.py migrate
python manage.py createsuperuser  # optional
```

3) Run the backend

# Option A — Django development server (quick):
python manage.py runserver 127.0.0.1:8000

# Option B — ASGI server (recommended when testing WebSockets):
pip install daphne
daphne -b 0.0.0.0 -p 8000 project.asgi:application

4) Serve the static frontend (optional, if you open the static `frontend/` pages):

```bash
cd frontend
python -m http.server 5173
# open http://localhost:5173/index.html
```


Test:
- Register via `/register/` (or the static page `/frontend/register.html`).
- Login to get tokens and visit the feed at `/frontend/index.html`.