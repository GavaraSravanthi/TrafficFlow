# TrafficFlow: Smart Traffic Simulation & Performance Engineering

TrafficFlow is a modern traffic signal simulation and management system. It provides an interactive intersection simulation engine powered by **FastAPI** on the backend and **React + Vite** with **Recharts** on the frontend, supported by an automated CI/CD pipeline and dedicated performance testing suite.

---

## Architecture & Technology Stack

- **Backend**: Python 3.12+ / FastAPI / Uvicorn / Pydantic v2
- **Frontend**: React 19 / Vite / Recharts
- **Testing**: Pytest (Unit Tests & Performance Test Suite)
- **Benchmarking**: Custom zero-dependency ASGI/HTTP Performance Engine
- **CI/CD**: GitHub Actions (Separate automated CI and on-demand performance workflows)

---

## Project Structure

```text
Devops_TrafficFlow/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Automated CI workflow (Unit tests + Frontend build)
│       └── performance.yml            # Manually triggered performance benchmarking workflow
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application & REST endpoints
│   │   ├── simulation.py              # 4-way intersection simulation engine
│   │   ├── signal_controller.py       # Fixed & Adaptive signal strategy logic
│   │   └── metrics.py                 # Traffic & waiting time metrics
│   ├── perf_reports/                  # Generated benchmark reports (Markdown & JSON)
│   │   ├── performance_report.md
│   │   └── performance_report.json
│   ├── perf_tests/                    # Performance test suite (Milestone 4)
│   │   ├── benchmark.py               # Benchmark engine & CLI runner
│   │   └── test_performance.py       # Automated Pytest performance assertions
│   ├── tests/                         # Unit & integration test suite
│   │   ├── test_api.py
│   │   └── test_simulation.py
│   └── requirements.txt
├── frontend/                          # React + Vite application
│   ├── src/
│   └── package.json
├── pytest.ini                         # Root Pytest configuration
└── README.md
```

---

## Setup & Installation

### Prerequisites

- Python 3.12 or higher
- Node.js 20 or higher & npm

### 1. Backend Setup

```bash
# Optional: create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 2. Frontend Setup

```bash
cd frontend
npm ci
cd ..
```

---

## Running the Application Locally

### Start Backend Server

```bash
# From repository root or backend/
python -m uvicorn app.main:app --reload --port 8000
```

The API will be accessible at:
- **API URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

### Start Frontend Client

```bash
cd frontend
npm run dev
```

The UI dashboard will run at `http://localhost:5173`.

---

## Testing & Quality Assurance

### 1. Existing Unit Tests (CI Pipeline)

The core unit test suite validates API contracts, simulation logic, and signal controllers:

```bash
# Run unit tests
python -m pytest backend/tests -v
```

### 2. Performance Test Suite (Pytest)

The automated performance suite validates latency distributions, throughput bounds, and non-flaky execution:

```bash
# Run automated performance tests
python -m pytest backend/perf_tests -v
```

### 3. Running the Performance Benchmark Engine (CLI)

TrafficFlow includes a standalone performance benchmarking engine that measures repeated-request latency and throughput across target endpoints (`GET /api/health`, `GET /api/simulation/state`, `POST /api/simulation/step`):

```bash
# Run default benchmark (300 iterations, 30 warmup, concurrency 5)
python backend/perf_tests/benchmark.py

# Custom iterations and concurrency
python backend/perf_tests/benchmark.py --iterations 500 --warmup 50 --concurrency 10

# Benchmark a running live server instance
python backend/perf_tests/benchmark.py --base-url http://127.0.0.1:8000
```

#### Output Reports

Benchmark results are automatically formatted and saved to:
- **Markdown Report**: `backend/perf_reports/performance_report.md`
- **JSON Report**: `backend/perf_reports/performance_report.json`

### 4. Frontend Production Build

```bash
cd frontend
npm run build
cd ..
```

---

## Performance Metrics Explained

| Metric | Description |
| :--- | :--- |
| **Average (Mean) Latency** | Sum of response times divided by sample count. Indicates overall throughput efficiency. |
| **Median (p50) Latency** | Middle value of sorted request times. Unaffected by transient spikes, reflects typical user experience. |
| **95th Percentile (p95)** | 95% of requests completed within this duration. Highlights latency tail and degradation under load. |
| **Throughput (req/s)** | Total successful requests completed per wall-clock second, measured under sequential and concurrent worker pools. |

---

## GitHub Actions CI/CD Workflows

1. **TrafficFlow CI (`ci.yml`)**:
   - Runs automatically on every `push` and `pull_request`.
   - Executes backend unit tests (`pytest backend/tests -v`) and verifies the frontend production bundle (`npm run build`).
2. **Performance Benchmarks (`performance.yml`)**:
   - Manually triggered via GitHub's **Actions** tab (`workflow_dispatch`).
   - Runs the benchmark engine, generates performance reports, publishes the summary table to `$GITHUB_STEP_SUMMARY`, and archives downloadable artifacts.
